/**
 * registrarEventoSuperAgent
 * ─────────────────────────────────────────────────────────────
 * Ponte segura entre o NR22888 SuperAgent (Telegram) e o CRM visual.
 * Registra eventos externos (contratos, visitas, follow-ups, logs)
 * nas entidades ClientDocument e AIInteractionLog.
 *
 * Autenticação: Bearer token via variável de ambiente SUPERAGENT_TOKEN
 * Configure em: Dashboard → Code → Environment Variables → SUPERAGENT_TOKEN
 *
 * FASE 1 (atual): apenas ClientDocument + AIInteractionLog
 * FASE 2 (futura): Sale, Task, Visit — quando autorizado
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ── Validação do token de acesso ───────────────────────────────
function validateToken(req) {
  const authHeader = req.headers.get('Authorization') || '';
  const token = authHeader.replace('Bearer ', '').trim();
  const expected = Deno.env.get('SUPERAGENT_TOKEN');
  if (!expected) return false; // sem token configurado = bloqueado
  return token === expected;
}

// ── Tipos permitidos na FASE 1 ─────────────────────────────────
const ALLOWED_EVENT_TYPES = ['contrato', 'proposta', 'visita', 'follow_up', 'log', 'documento'];
const DOC_TYPE_MAP = {
  contrato:  'contrato',
  proposta:  'proposta',
  visita:    'relatorio',
  follow_up: 'relatorio',
  log:       'outros',
  documento: 'outros',
};

Deno.serve(async (req) => {
  // ── CORS preflight ───────────────────────────────────────────
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  if (req.method !== 'POST') {
    return Response.json({ error: 'Método não permitido. Use POST.' }, { status: 405 });
  }

  try {
    // ── 1. Autenticação ───────────────────────────────────────
    if (!validateToken(req)) {
      return Response.json({ error: 'Não autorizado. Token inválido ou ausente.' }, { status: 401 });
    }

    // ── 2. Parse do payload ───────────────────────────────────
    let payload;
    try {
      payload = await req.json();
    } catch {
      return Response.json({ error: 'Payload JSON inválido.' }, { status: 400 });
    }

    const {
      event_type,       // 'contrato' | 'proposta' | 'visita' | 'follow_up' | 'log' | 'documento'
      title,            // Título do evento (obrigatório)
      client_id,        // ID do cliente no CRM (opcional — buscar por cnpj se ausente)
      client_name,      // Nome do cliente
      cnpj,             // CNPJ para tentativa de vínculo
      razao_social,     // Razão social
      equipamento,      // Equipamento relacionado
      valor,            // Valor em R$
      status,           // Status do documento
      origem,           // Origem: 'NR22888 SuperAgent Telegram'
      observacao,       // Notas livres
      file_url,         // URL de arquivo (opcional)
      metadata,         // Objeto livre para dados extras
    } = payload;

    // ── 3. Validação de campos obrigatórios ───────────────────
    if (!event_type || !ALLOWED_EVENT_TYPES.includes(event_type)) {
      return Response.json({
        error: `event_type inválido. Permitidos: ${ALLOWED_EVENT_TYPES.join(', ')}`,
      }, { status: 400 });
    }
    if (!title) {
      return Response.json({ error: 'Campo "title" é obrigatório.' }, { status: 400 });
    }
    if (!client_name && !cnpj) {
      return Response.json({ error: 'Informe "client_name" ou "cnpj" para identificar o cliente.' }, { status: 400 });
    }

    // ── 4. SDK no service role (sem autenticação de usuário) ──
    const base44 = createClientFromRequest(req);

    // ── 5. Tentativa de vínculo com cliente existente ─────────
    let resolvedClientId = client_id || null;
    let resolvedClientName = client_name || razao_social || 'Desconhecido';

    if (!resolvedClientId && cnpj) {
      // Busca pelo CNPJ nos clientes cadastrados
      const cnpjClean = cnpj.replace(/\D/g, '');
      const matches = await base44.asServiceRole.entities.Client.filter({ cnpj: cnpjClean }).catch(() => []);
      if (matches.length > 0) {
        resolvedClientId = matches[0].id;
        resolvedClientName = matches[0].clinic_name || matches[0].first_name || resolvedClientName;
      }
    }

    // Se ainda não encontrou, tenta por razão social parcial
    if (!resolvedClientId && razao_social) {
      const allClients = await base44.asServiceRole.entities.Client.list('-created_date', 200).catch(() => []);
      const found = allClients.find(c =>
        c.razao_social && c.razao_social.toLowerCase().includes(razao_social.toLowerCase().slice(0, 15))
      );
      if (found) {
        resolvedClientId = found.id;
        resolvedClientName = found.clinic_name || found.first_name || resolvedClientName;
      }
    }

    // Se não encontrou cliente, usa ID placeholder
    const finalClientId = resolvedClientId || 'superagent_externo';

    // ── 6. Monta notes completo ───────────────────────────────
    const notesLines = [
      `📌 Origem: ${origem || 'NR22888 SuperAgent Telegram'}`,
      equipamento ? `🔧 Equipamento: ${equipamento}` : null,
      valor ? `💰 Valor: R$ ${valor}` : null,
      razao_social ? `🏢 Razão Social: ${razao_social}` : null,
      cnpj ? `📄 CNPJ: ${cnpj}` : null,
      status ? `✅ Status: ${status}` : null,
      observacao ? `📝 Obs: ${observacao}` : null,
      metadata ? `📊 Dados extras: ${JSON.stringify(metadata, null, 2)}` : null,
    ].filter(Boolean).join('\n');

    const now = new Date().toISOString();

    // ── 7. Registra em ClientDocument ─────────────────────────
    const docRecord = await base44.asServiceRole.entities.ClientDocument.create({
      client_id: finalClientId,
      client_name: resolvedClientName,
      title,
      type: DOC_TYPE_MAP[event_type] || 'outros',
      notes: notesLines,
      file_url: file_url || null,
      is_signed: status === 'validado' || status === 'assinado',
      signed_date: (status === 'validado' || status === 'assinado') ? now : null,
      signers: client_name ? [{ name: client_name, email: '', signed: status === 'validado', signed_at: now }] : [],
    });

    // ── 8. Registra em AIInteractionLog como log de evento ────
    const logRecord = await base44.asServiceRole.entities.AIInteractionLog.create({
      action_type: 'general',
      source: 'api',
      user_message: `[SuperAgent] ${event_type.toUpperCase()}: ${title}`,
      ai_response: notesLines,
      client_id: finalClientId,
      client_name: resolvedClientName,
      success: true,
      model_used: 'SuperAgent-Telegram',
      tokens_used: 0,
    });

    // ── 9. Resposta de sucesso ─────────────────────────────────
    return Response.json({
      success: true,
      message: 'Evento registrado com sucesso no CRM Método NR22888.',
      data: {
        document_id: docRecord.id,
        log_id: logRecord.id,
        client_id: finalClientId,
        client_name: resolvedClientName,
        client_vinculado: !!resolvedClientId,
        event_type,
        title,
        created_at: now,
      },
      visualizar: {
        documento: `Painel → Cliente 360° → aba Documentos (client_id: ${finalClientId})`,
        log: 'Painel → Audit / Logs de Interação',
      },
    }, {
      status: 201,
      headers: { 'Access-Control-Allow-Origin': '*' },
    });

  } catch (error) {
    return Response.json({
      success: false,
      error: 'Erro interno ao registrar evento.',
      detail: error.message,
    }, { status: 500 });
  }
});
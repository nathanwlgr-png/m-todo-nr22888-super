/**
 * registrarEventoSuperAgent — v2
 * ─────────────────────────────────────────────────────────────
 * Ponte segura entre o NR22888 SuperAgent (Telegram) e o CRM visual.
 * Registra eventos externos com vínculo automático de cliente.
 *
 * Autenticação: Bearer token via variável de ambiente SUPERAGENT_TOKEN
 * Entidades lidas:  Client
 * Entidades gravadas: ClientDocument, AuditLog (obrigatório), AIInteractionLog (complementar)
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ── Validação do token ──────────────────────────────────────────
function validateToken(req) {
  const authHeader = req.headers.get('Authorization') || '';
  const token = authHeader.replace('Bearer ', '').trim();
  const expected = Deno.env.get('SUPERAGENT_TOKEN');
  if (!expected) return false;
  return token === expected;
}

// ── Tipos permitidos ────────────────────────────────────────────
const ALLOWED_EVENT_TYPES = ['contrato', 'proposta', 'visita', 'follow_up', 'log', 'documento'];
const DOC_TYPE_MAP = {
  contrato:  'contrato',
  proposta:  'proposta',
  visita:    'relatorio',
  follow_up: 'relatorio',
  log:       'outros',
  documento: 'outros',
};

// ── Normaliza telefone (apenas dígitos) ─────────────────────────
function normalizePhone(p) {
  return (p || '').replace(/\D/g, '');
}

// ── Lógica de vínculo automático de cliente ─────────────────────
async function resolveClient(serviceRole, payload) {
  const { client_id, cnpj, phone, telefone, client_name, clinic_name, razao_social } = payload;

  // 1. client_id explícito
  if (client_id && client_id !== 'superagent_externo') {
    return { id: client_id, name: client_name || razao_social || 'Desconhecido', method: 'manual', confidence: 'alta' };
  }

  // 2. CNPJ — maior confiança
  if (cnpj) {
    const cnpjClean = cnpj.replace(/\D/g, '');
    const matches = await serviceRole.entities.Client.filter({ cnpj: cnpjClean }).catch(() => []);
    if (matches.length === 1) {
      return {
        id: matches[0].id,
        name: matches[0].clinic_name || matches[0].first_name || client_name || 'Desconhecido',
        method: 'cnpj',
        confidence: 'alta',
      };
    }
    if (matches.length > 1) return null; // ambíguo
  }

  // Busca geral para os próximos critérios
  const allClients = await serviceRole.entities.Client.list('-created_date', 300).catch(() => []);

  // 3. Telefone
  const rawPhone = normalizePhone(phone || telefone);
  if (rawPhone.length >= 8) {
    const phoneMatches = allClients.filter(c => normalizePhone(c.phone) === rawPhone);
    if (phoneMatches.length === 1) {
      return {
        id: phoneMatches[0].id,
        name: phoneMatches[0].clinic_name || phoneMatches[0].first_name || client_name || 'Desconhecido',
        method: 'phone',
        confidence: 'media',
      };
    }
    if (phoneMatches.length > 1) return null; // ambíguo
  }

  // 4. client_name / clinic_name / razao_social — correspondência aproximada
  const searchNames = [client_name, clinic_name, razao_social].filter(Boolean).map(n => n.toLowerCase().slice(0, 20));
  if (searchNames.length > 0) {
    const nameMatches = allClients.filter(c => {
      const fields = [c.full_name, c.clinic_name, c.razao_social, c.first_name]
        .filter(Boolean)
        .map(f => f.toLowerCase());
      return searchNames.some(sn => fields.some(f => f.includes(sn) || sn.includes(f.slice(0, 15))));
    });
    if (nameMatches.length === 1) {
      return {
        id: nameMatches[0].id,
        name: nameMatches[0].clinic_name || nameMatches[0].first_name || client_name || 'Desconhecido',
        method: 'client_name',
        confidence: 'baixa',
      };
    }
    // ambíguo ou não encontrado → sem vínculo
  }

  return null; // nenhum match confiável
}

// ── Handler principal ───────────────────────────────────────────
Deno.serve(async (req) => {
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
    // ── Autenticação ──────────────────────────────────────────
    if (!validateToken(req)) {
      return Response.json({ error: 'Não autorizado. Token inválido ou ausente.' }, { status: 401 });
    }

    // ── Parse do payload ──────────────────────────────────────
    let payload;
    try {
      payload = await req.json();
    } catch {
      return Response.json({ error: 'Payload JSON inválido.' }, { status: 400 });
    }

    const {
      event_type,
      title,
      client_id,
      client_name,
      clinic_name,
      cnpj,
      razao_social,
      phone,
      telefone,
      equipamento,
      valor,
      status,
      origem,
      observacao,
      summary,
      file_url,
      metadata,
      module: payloadModule,
      action: payloadAction,
    } = payload;

    // ── Validação obrigatória ─────────────────────────────────
    if (!event_type || !ALLOWED_EVENT_TYPES.includes(event_type)) {
      return Response.json({
        error: `event_type inválido. Permitidos: ${ALLOWED_EVENT_TYPES.join(', ')}`,
      }, { status: 400 });
    }
    if (!title) {
      return Response.json({ error: 'Campo "title" é obrigatório.' }, { status: 400 });
    }
    if (!client_name && !cnpj && !clinic_name && !razao_social) {
      return Response.json({
        error: 'Informe ao menos um de: client_name, clinic_name, razao_social ou cnpj.',
      }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);
    const serviceRole = base44.asServiceRole;

    // ── Vínculo automático de cliente ─────────────────────────
    const matched = await resolveClient(serviceRole, payload);

    let finalClientId, finalClientName, clientVinculado, matchMethod, matchConfidence;

    if (matched) {
      finalClientId    = matched.id;
      finalClientName  = matched.name;
      clientVinculado  = true;
      matchMethod      = matched.method;
      matchConfidence  = matched.confidence;
    } else {
      finalClientId    = 'superagent_externo';
      finalClientName  = client_name || clinic_name || razao_social || 'Desconhecido';
      clientVinculado  = false;
      matchMethod      = 'none';
      matchConfidence  = 'baixa';
    }

    const now = new Date().toISOString();

    // ── Monta notes enriquecido ───────────────────────────────
    const vinculoInfo = clientVinculado
      ? `✅ Cliente vinculado automaticamente (método: ${matchMethod}, confiança: ${matchConfidence})`
      : `⚠️ Registro externo não vinculado automaticamente; revisar manualmente.`;

    const notesLines = [
      `📌 Origem: ${origem || 'NR22888 SuperAgent Telegram'}`,
      vinculoInfo,
      equipamento  ? `🔧 Equipamento: ${equipamento}`         : null,
      valor        ? `💰 Valor: R$ ${valor}`                  : null,
      razao_social ? `🏢 Razão Social: ${razao_social}`       : null,
      cnpj         ? `📄 CNPJ: ${cnpj}`                       : null,
      status       ? `✅ Status: ${status}`                   : null,
      summary      ? `📋 Resumo: ${summary}`                  : null,
      observacao   ? `📝 Obs: ${observacao}`                  : null,
      metadata     ? `📊 Extras: ${JSON.stringify(metadata)}` : null,
    ].filter(Boolean).join('\n');

    // ── Grava ClientDocument ──────────────────────────────────
    const docRecord = await serviceRole.entities.ClientDocument.create({
      client_id:   finalClientId,
      client_name: finalClientName,
      title,
      type:        DOC_TYPE_MAP[event_type] || 'outros',
      notes:       notesLines,
      file_url:    file_url || null,
      is_signed:   status === 'validado' || status === 'assinado',
      signed_date: (status === 'validado' || status === 'assinado') ? now : null,
      signers:     client_name
        ? [{ name: client_name, email: '', signed: status === 'validado', signed_at: now }]
        : [],
    });

    // ── Grava AuditLog (OBRIGATÓRIO) ──────────────────────────
    const auditRecord = await serviceRole.entities.AuditLog.create({
      module:       payloadModule || 'superagent',
      action:       payloadAction || 'evento_superagent_registrado',
      user_message: `[SuperAgent] ${event_type.toUpperCase()}: ${title}`,
      details:      notesLines,
      client_id:    finalClientId,
      client_name:  finalClientName,
      success:      true,
      error_message: '',
      input_size:   'pequeno',
      output_size:  'pequeno',
      cost_credits: 0,
      source:       'api',
    }).catch(async () => {
      // Fallback: tenta com campos mínimos se entidade tiver schema diferente
      return await serviceRole.entities.AuditLog.create({
        module:  payloadModule || 'superagent',
        action:  payloadAction || 'evento_superagent_registrado',
        success: true,
        details: notesLines,
      });
    });

    // ── Grava AIInteractionLog (COMPLEMENTAR) ─────────────────
    const logRecord = await serviceRole.entities.AIInteractionLog.create({
      action_type:  'general',
      source:       'api',
      user_message: `[SuperAgent] ${event_type.toUpperCase()}: ${title}`,
      ai_response:  notesLines,
      client_id:    finalClientId,
      client_name:  finalClientName,
      success:      true,
      model_used:   'SuperAgent-Telegram',
      tokens_used:  0,
    }).catch(() => ({ id: null })); // não bloqueia se falhar

    // ── Resposta de sucesso ───────────────────────────────────
    return Response.json({
      success:           true,
      message:           'Evento registrado com sucesso no CRM Método NR22888.',
      data: {
        document_id:      docRecord.id,
        audit_log_id:     auditRecord.id,
        ai_log_id:        logRecord.id,
        client_id:        finalClientId,
        client_name:      finalClientName,
        client_vinculado: clientVinculado,
        match_method:     matchMethod,
        match_confidence: matchConfidence,
        event_type,
        title,
        created_at:       now,
      },
      visualizar: {
        documento: `Painel → Cliente 360° → aba Documentos (client_id: ${finalClientId})`,
        auditlog:  'Painel → SuperAgentWidget / AuditLog',
      },
    }, {
      status: 201,
      headers: { 'Access-Control-Allow-Origin': '*' },
    });

  } catch (error) {
    return Response.json({
      success: false,
      error:   'Erro interno ao registrar evento.',
      detail:  error.message,
    }, { status: 500 });
  }
});
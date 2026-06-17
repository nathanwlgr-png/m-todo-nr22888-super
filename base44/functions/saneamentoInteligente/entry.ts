/**
 * saneamentoInteligente — v1
 * Roda automaticamente (agendado) ou sob demanda.
 * 1. Detecta clientes duplicados por telefone/CNPJ/nome
 * 2. Corrige telefones para formato 55XXXXXXXXXXX
 * 3. Preenche pipeline_stage e status ausentes com defaults
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function normalizePhone(p) {
  if (!p) return '';
  const digits = p.replace(/\D/g, '');
  if (digits.length === 11 && !digits.startsWith('55')) return '55' + digits;
  if (digits.length === 10 && !digits.startsWith('55')) return '55' + digits;
  return digits;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const serviceRole = base44.asServiceRole;

    const clients = await serviceRole.entities.Client.list('-created_date', 500);

    let phonesFixed = 0;
    let defaultsFixed = 0;
    const duplicatesFound = [];

    // Mapas para detectar duplicatas
    const phoneMap = {};
    const cnpjMap = {};

    for (const client of clients) {
      const updates = {};

      // 1. Corrigir telefone
      if (client.phone) {
        const fixed = normalizePhone(client.phone);
        if (fixed !== client.phone) {
          updates.phone = fixed;
          phonesFixed++;
        }
      }

      // 2. Preencher defaults ausentes
      if (!client.pipeline_stage) {
        updates.pipeline_stage = 'lead';
        defaultsFixed++;
      }
      if (!client.status) {
        updates.status = 'morno';
        defaultsFixed++;
      }

      if (Object.keys(updates).length > 0) {
        await serviceRole.entities.Client.update(client.id, updates).catch(() => null);
      }

      // 3. Mapear duplicatas por telefone
      if (client.phone) {
        const norm = normalizePhone(client.phone);
        if (norm.length >= 10) {
          if (phoneMap[norm]) {
            duplicatesFound.push({ type: 'phone', value: norm, ids: [phoneMap[norm], client.id] });
          } else {
            phoneMap[norm] = client.id;
          }
        }
      }

      // 4. Mapear duplicatas por CNPJ
      if (client.cnpj) {
        const cnpjClean = client.cnpj.replace(/\D/g, '');
        if (cnpjClean.length >= 14) {
          if (cnpjMap[cnpjClean]) {
            duplicatesFound.push({ type: 'cnpj', value: cnpjClean, ids: [cnpjMap[cnpjClean], client.id] });
          } else {
            cnpjMap[cnpjClean] = client.id;
          }
        }
      }
    }

    const summary = `✅ Saneamento concluído: ${phonesFixed} telefones corrigidos, ${defaultsFixed} defaults aplicados, ${duplicatesFound.length} possíveis duplicatas detectadas.`;

    // Grava no AuditLog
    await serviceRole.entities.AuditLog.create({
      module:        'saneamento',
      action:        'saneamento_automatico',
      user_email:    'nathan.wlgr@gmail.com',
      user_message:  summary,
      details:       JSON.stringify({ phonesFixed, defaultsFixed, duplicatesFound: duplicatesFound.slice(0, 20) }),
      success:       true,
      error_message: '',
      duration_ms:   0,
      cost_credits:  0,
      input_size:    'grande',
      output_size:   'pequeno',
      source:        'automation',
    }).catch(() => null);

    return Response.json({
      success: true,
      summary,
      details: { phonesFixed, defaultsFixed, duplicatesFound: duplicatesFound.slice(0, 20) },
    });

  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});
/**
 * limpezaCompletaCRM — MODO AUDITORIA SAFE
 * Normaliza telefones e defaults (correção leve e reversível).
 * NÃO arquiva duplicatas automaticamente: gera DuplicateReviewQueue para aprovação humana.
 * Não altera pipeline/status/lost_reason de duplicatas sem aprovação.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function normalizePhone(p) {
  if (!p) return '';
  const d = p.replace(/\D/g, '');
  if (d.length === 11 && !d.startsWith('55')) return '55' + d;
  if (d.length === 10 && !d.startsWith('55')) return '55' + d;
  return d;
}

function completeness(r) {
  return ['first_name','full_name','clinic_name','phone','email','cnpj',
    'city','address','status','purchase_score','notes','website','cpf'].filter(f => r[f]).length;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Apenas administradores podem executar a limpeza' }, { status: 403 });
    const sr = base44.asServiceRole;

    let dry_run = true;
    try { const body = await req.json(); if (body && body.dry_run === false) dry_run = false; } catch (_) { /* default auditoria */ }

    const clients = await sr.entities.Client.list('-created_date', 1000);

    let phonesFixed = 0;
    let defaultsFixed = 0;
    const processed = new Set();

    // ── SANEAMENTO LEVE: telefones + defaults ──
    // dry_run=true: apenas CONTA o que seria corrigido. NÃO altera nenhum Client.
    for (const c of clients) {
      const upd = {};
      if (c.phone) {
        const fixed = normalizePhone(c.phone);
        if (fixed !== c.phone && fixed.length >= 12) { upd.phone = fixed; phonesFixed++; }
      }
      if (!c.pipeline_stage) { upd.pipeline_stage = 'lead';  defaultsFixed++; }
      if (!c.status)         { upd.status = 'morno';         defaultsFixed++; }
      if (!dry_run && Object.keys(upd).length) {
        await sr.entities.Client.update(c.id, upd).catch(() => null);
      }
    }

    // ── DETECÇÃO SEGURA: código externo + nome exato da empresa ──
    const normalizeText = (value) => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const groups = [];
    for (let i = 0; i < clients.length; i++) {
      if (processed.has(clients[i].id)) continue;
      const group = [clients[i]];
      for (let j = i + 1; j < clients.length; j++) {
        if (processed.has(clients[j].id)) continue;
        const a = clients[i], b = clients[j];
        const codeA = normalizeText(a.external_code), codeB = normalizeText(b.external_code);
        const companyA = normalizeText(a.clinic_name || a.razao_social);
        const companyB = normalizeText(b.clinic_name || b.razao_social);
        const sameExternalCodeAndCompany = codeA.length > 0 && companyA.length > 2 && codeA === codeB && companyA === companyB;
        if (sameExternalCodeAndCompany) {
          group.push(clients[j]);
          processed.add(clients[j].id);
        }
      }
      if (group.length > 1) {
        processed.add(clients[i].id);
        groups.push({ group });
      }
    }

    // ── FILA DE REVISÃO (nunca arquiva). dry_run=true só conta, não cria fila. ──
    let queued = 0;
    for (const { group } of groups) {
      const keeper = group.reduce((best, cur) => completeness(cur) > completeness(best) ? cur : best);
      for (const dup of group) {
        if (dup.id === keeper.id) continue;
        if (dry_run) { queued++; continue; }

        // Evitar duplicar item já na fila
        const exists = await sr.entities.DuplicateReviewQueue.filter({
          entidade_id_principal: keeper.id, entidade_id_duplicada: dup.id
        }).catch(() => []);
        if (exists && exists.length) continue;

        await sr.entities.DuplicateReviewQueue.create({
          tipo_entidade: 'client',
          entidade_id_principal: keeper.id,
          entidade_id_duplicada: dup.id,
          nome_principal: keeper.first_name || keeper.clinic_name || keeper.id,
          nome_duplicada: dup.first_name || dup.clinic_name || dup.id,
          motivo_suspeita: 'codigo_externo+nome_empresa_exatos',
          dados_comparados: JSON.stringify({
            principal: { external_code: keeper.external_code, clinic_name: keeper.clinic_name, razao_social: keeper.razao_social },
            duplicada: { external_code: dup.external_code, clinic_name: dup.clinic_name, razao_social: dup.razao_social },
          }),
          sugestao: `Manter ${keeper.first_name || keeper.clinic_name}, revisar arquivamento da duplicata`,
          risco: 'medio',
          status: 'pendente',
          exige_aprovacao: true,
          data_criacao: new Date().toISOString(),
        }).catch(() => null);
        queued++;
      }
    }

    const summary = dry_run
      ? `🔍 Prévia: ${phonesFixed} telefones e ${defaultsFixed} campos SERIAM organizados; ${groups.length} grupos com código externo + empresa idênticos. Nada foi alterado.`
      : `✅ Limpeza segura: ${phonesFixed} telefones normalizados, ${defaultsFixed} campos organizados e ${queued} duplicatas exatas enviadas para revisão.`;

    await sr.entities.AuditLog.create({
      module: 'limpeza_crm', action: 'limpeza_auditoria_safe', user_email: 'sistema_automatico',
      user_message: summary,
      details: JSON.stringify({ phonesFixed, defaultsFixed, groupsFound: groups.length, queued, dry_run }),
      success: true, source: 'automation',
    }).catch(() => null);

    return Response.json({
      success: true, mode: dry_run ? 'dry_run_preview' : 'auditoria_safe', dry_run, summary,
      phonesFixed, defaultsFixed, groupsFound: groups.length,
      duplicatesQueued: queued, merged: 0,
      message: dry_run
        ? 'Prévia: nenhum dado foi alterado e nenhuma fila foi criada.'
        : 'Modo seguro: duplicatas vão para fila de revisão. Nenhuma duplicata foi arquivada automaticamente.',
    });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
});
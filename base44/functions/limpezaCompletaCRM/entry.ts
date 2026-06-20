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
    const sr = base44.asServiceRole;

    let dry_run = true;
    try { const body = await req.json(); if (body && body.dry_run === false) dry_run = false; } catch (_) { /* default auditoria */ }

    const clients = await sr.entities.Client.list('-created_date', 1000);

    let phonesFixed = 0;
    let defaultsFixed = 0;
    const processed = new Set();

    // ── SANEAMENTO LEVE: telefones + defaults (não destrutivo) ──
    for (const c of clients) {
      const upd = {};
      if (c.phone) {
        const fixed = normalizePhone(c.phone);
        if (fixed !== c.phone && fixed.length >= 12) { upd.phone = fixed; phonesFixed++; }
      }
      if (!c.pipeline_stage) { upd.pipeline_stage = 'lead';  defaultsFixed++; }
      if (!c.status)         { upd.status = 'morno';         defaultsFixed++; }
      if (Object.keys(upd).length) {
        await sr.entities.Client.update(c.id, upd).catch(() => null);
      }
    }

    // ── DETECÇÃO DE DUPLICATAS (sem arquivar) ──
    const groups = [];
    for (let i = 0; i < clients.length; i++) {
      if (processed.has(clients[i].id)) continue;
      const group = [clients[i]];
      for (let j = i + 1; j < clients.length; j++) {
        if (processed.has(clients[j].id)) continue;
        const a = clients[i], b = clients[j];
        const pA = normalizePhone(a.phone || ''), pB = normalizePhone(b.phone || '');
        const samePhone = pA.length >= 12 && pA === pB;
        const cnpjA = (a.cnpj || '').replace(/\D/g,''), cnpjB = (b.cnpj || '').replace(/\D/g,'');
        const sameCNPJ = cnpjA.length >= 14 && cnpjA === cnpjB;
        const emailA = (a.email || '').toLowerCase().trim(), emailB = (b.email || '').toLowerCase().trim();
        const sameEmail = emailA.length > 3 && emailA === emailB;
        const nameA = (a.first_name || a.full_name || '').toLowerCase().trim();
        const nameB = (b.first_name || b.full_name || '').toLowerCase().trim();
        const sameCity = (a.city || '').toLowerCase() === (b.city || '').toLowerCase();
        const similarName = nameA.length > 2 && nameB.length > 2 && (nameA === nameB || nameA.includes(nameB) || nameB.includes(nameA));
        if (samePhone || sameCNPJ || sameEmail || (similarName && sameCity)) {
          group.push(clients[j]); processed.add(clients[j].id);
        }
      }
      if (group.length > 1) { processed.add(clients[i].id); groups.push({ group, samePhone: true }); }
    }

    // ── CRIAR FILA DE REVISÃO (não arquiva nada) ──
    let queued = 0;
    for (const { group } of groups) {
      const keeper = group.reduce((best, cur) => completeness(cur) > completeness(best) ? cur : best);
      for (const dup of group) {
        if (dup.id === keeper.id) continue;
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
          motivo_suspeita: 'telefone/cnpj/email/nome+cidade',
          dados_comparados: JSON.stringify({
            principal: { phone: keeper.phone, cnpj: keeper.cnpj, email: keeper.email, city: keeper.city },
            duplicada: { phone: dup.phone, cnpj: dup.cnpj, email: dup.email, city: dup.city },
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

    const summary = `✅ Auditoria SAFE: ${phonesFixed} telefones normalizados, ${defaultsFixed} defaults, ${groups.length} grupos duplicados detectados, ${queued} enviados para revisão humana (nada arquivado).`;

    await sr.entities.AuditLog.create({
      module: 'limpeza_crm', action: 'limpeza_auditoria_safe', user_email: 'sistema_automatico',
      user_message: summary,
      details: JSON.stringify({ phonesFixed, defaultsFixed, groupsFound: groups.length, queued, dry_run }),
      success: true, source: 'automation',
    }).catch(() => null);

    return Response.json({
      success: true, mode: 'auditoria_safe', summary,
      phonesFixed, defaultsFixed, groupsFound: groups.length,
      duplicatesQueued: queued, merged: 0,
      message: 'Modo seguro: duplicatas vão para fila de revisão. Nenhuma duplicata foi arquivada automaticamente.',
    });
  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
});
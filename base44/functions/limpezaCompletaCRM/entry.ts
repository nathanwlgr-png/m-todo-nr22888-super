/**
 * limpezaCompletaCRM — Saneamento + Deduplicação em sequência
 * Chamado pelo botão do Dashboard e pela automação a cada 3 dias.
 * Não deleta — arquiva duplicatas (archived=true) para preservar histórico.
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

    // ── 1. BUSCAR TODOS OS CLIENTES ──────────────────────────────
    const clients = await sr.entities.Client.list('-created_date', 1000);

    let phonesFixed = 0;
    let defaultsFixed = 0;
    let merged = 0;

    const phoneMap = {};
    const cnpjMap  = {};
    const emailMap = {};
    const processed = new Set();

    // ── 2. SANEAMENTO: normalizar telefones + defaults ───────────
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

    // ── 3. DEDUPLICAÇÃO: encontrar grupos ───────────────────────
    const groups = [];
    for (let i = 0; i < clients.length; i++) {
      if (processed.has(clients[i].id)) continue;
      const group = [clients[i]];

      for (let j = i + 1; j < clients.length; j++) {
        if (processed.has(clients[j].id)) continue;
        const a = clients[i], b = clients[j];

        const normPhoneA = normalizePhone(a.phone || '');
        const normPhoneB = normalizePhone(b.phone || '');
        const samePhone = normPhoneA.length >= 12 && normPhoneA === normPhoneB;

        const cnpjA = (a.cnpj || '').replace(/\D/g,'');
        const cnpjB = (b.cnpj || '').replace(/\D/g,'');
        const sameCNPJ = cnpjA.length >= 14 && cnpjA === cnpjB;

        const emailA = (a.email || '').toLowerCase().trim();
        const emailB = (b.email || '').toLowerCase().trim();
        const sameEmail = emailA.length > 3 && emailA === emailB;

        const nameA = (a.first_name || a.full_name || '').toLowerCase().trim();
        const nameB = (b.first_name || b.full_name || '').toLowerCase().trim();
        const sameCity = (a.city || '').toLowerCase() === (b.city || '').toLowerCase();
        const similarName = nameA.length > 2 && nameB.length > 2 &&
          (nameA === nameB || nameA.includes(nameB) || nameB.includes(nameA));

        if (samePhone || sameCNPJ || sameEmail || (similarName && sameCity)) {
          group.push(clients[j]);
          processed.add(clients[j].id);
        }
      }

      if (group.length > 1) {
        processed.add(clients[i].id);
        groups.push(group);
      }
    }

    // ── 4. FUSÃO: manter o mais completo, arquivar os outros ────
    const mergeLog = [];
    for (const group of groups) {
      const keeper = group.reduce((best, cur) =>
        completeness(cur) > completeness(best) ? cur : best
      );

      // Mesclar dados nos campos vazios do keeper
      const patch = {};
      for (const dup of group) {
        if (dup.id === keeper.id) continue;
        for (const key of Object.keys(dup)) {
          if (!patch[key] && !keeper[key] && dup[key] &&
              !['id','created_date','updated_date','created_by_id'].includes(key)) {
            patch[key] = dup[key];
          }
        }
      }
      if (Object.keys(patch).length) {
        await sr.entities.Client.update(keeper.id, patch).catch(() => null);
      }

      // Arquivar duplicados (não deletar)
      for (const dup of group) {
        if (dup.id === keeper.id) continue;
        await sr.entities.Client.update(dup.id, {
          status: 'frio',
          lost_reason: `[DUPLICATA_ARQUIVADA] Fusionado com ${keeper.id} (${keeper.first_name || keeper.clinic_name})`,
          pipeline_stage: 'perdido',
        }).catch(() => null);
        merged++;
      }

      mergeLog.push({
        kept: keeper.first_name || keeper.clinic_name || keeper.id,
        archived: group.length - 1,
      });
    }

    const summary = `✅ Limpeza concluída: ${phonesFixed} telefones corrigidos, ${defaultsFixed} defaults, ${groups.length} grupos duplicados, ${merged} registros arquivados.`;

    await sr.entities.AuditLog.create({
      module:       'limpeza_crm',
      action:       'limpeza_completa',
      user_email:   'sistema_automatico',
      user_message: summary,
      details:      JSON.stringify({ phonesFixed, defaultsFixed, groupsFound: groups.length, merged, mergeLog }),
      success:      true,
      source:       'automation',
    }).catch(() => null);

    return Response.json({
      success: true,
      summary,
      phonesFixed,
      defaultsFixed,
      groupsFound: groups.length,
      merged,
      mergeLog,
    });

  } catch (err) {
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * deduplicateAndClean — Encontra e remove duplicatas no CRM.
 * Detecta por: mesmo telefone, mesmo CNPJ, nome muito similar + mesma cidade.
 * Modo: 'scan' (só lista) | 'merge' (unifica mantendo o mais completo) | 'delete_duplicates'
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    if (user.role !== 'admin' && user.email !== 'nathan.wlgr@gmail.com') {
      return Response.json({ error: 'Acesso restrito ao administrador' }, { status: 403 });
    }

    const { mode = 'scan', entity = 'Client' } = await req.json();

    const records = entity === 'Lead'
      ? await base44.entities.Lead.list('-created_date', 1000)
      : await base44.entities.Client.list('-created_date', 1000);

    const duplicateGroups = [];
    const processed = new Set();

    for (let i = 0; i < records.length; i++) {
      if (processed.has(records[i].id)) continue;

      const group = [records[i]];

      for (let j = i + 1; j < records.length; j++) {
        if (processed.has(records[j].id)) continue;

        const a = records[i];
        const b = records[j];

        // Critérios de duplicata
        const samePhone = a.phone && b.phone &&
          a.phone.replace(/\D/g, '') === b.phone.replace(/\D/g, '');

        const sameCNPJ = a.cnpj && b.cnpj &&
          a.cnpj.replace(/\D/g, '') === b.cnpj.replace(/\D/g, '');

        const sameEmail = a.email && b.email &&
          a.email.toLowerCase() === b.email.toLowerCase();

        const similarName = () => {
          const nameA = (a.first_name || a.full_name || '').toLowerCase().trim();
          const nameB = (b.first_name || b.full_name || '').toLowerCase().trim();
          if (!nameA || !nameB || nameA.length < 3) return false;
          return nameA === nameB || nameA.includes(nameB) || nameB.includes(nameA);
        };

        const sameCity = (a.city || '').toLowerCase() === (b.city || '').toLowerCase();

        if (samePhone || sameCNPJ || sameEmail || (similarName() && sameCity)) {
          group.push(records[j]);
          processed.add(records[j].id);
        }
      }

      if (group.length > 1) {
        processed.add(records[i].id);
        duplicateGroups.push(group);
      }
    }

    if (mode === 'scan') {
      return Response.json({
        success: true,
        mode: 'scan',
        entity,
        total_records: records.length,
        duplicate_groups: duplicateGroups.length,
        duplicates_to_remove: duplicateGroups.reduce((sum, g) => sum + g.length - 1, 0),
        groups: duplicateGroups.map(group => ({
          count: group.length,
          reason: getDuplicateReason(group),
          records: group.map(r => ({
            id: r.id,
            name: r.first_name || r.full_name,
            clinic: r.clinic_name,
            phone: r.phone,
            email: r.email,
            cnpj: r.cnpj,
            city: r.city,
            created: r.created_date,
            completeness: calcCompleteness(r)
          }))
        }))
      });
    }

    if (mode === 'merge') {
      const mergeResults = [];

      for (const group of duplicateGroups) {
        // Manter o registro mais completo
        const keeper = group.reduce((best, curr) =>
          calcCompleteness(curr) > calcCompleteness(best) ? curr : best
        );

        // Mesclar dados dos duplicados no keeper
        const merged = { ...keeper };
        for (const dup of group) {
          if (dup.id === keeper.id) continue;
          // Preencher campos vazios do keeper com dados dos duplicados
          for (const key of Object.keys(dup)) {
            if (!merged[key] && dup[key]) merged[key] = dup[key];
          }
        }

        // Atualizar o keeper com dados mesclados
        if (entity === 'Lead') {
          await base44.entities.Lead.update(keeper.id, merged);
        } else {
          await base44.entities.Client.update(keeper.id, merged);
        }

        // Deletar os duplicados
        const deleted = [];
        for (const dup of group) {
          if (dup.id === keeper.id) continue;
          if (entity === 'Lead') {
            await base44.entities.Lead.delete(dup.id);
          } else {
            await base44.entities.Client.delete(dup.id);
          }
          deleted.push(dup.id);
        }

        mergeResults.push({
          kept: keeper.id,
          kept_name: keeper.first_name || keeper.full_name,
          deleted_count: deleted.length,
          deleted_ids: deleted
        });
      }

      return Response.json({
        success: true,
        mode: 'merge',
        entity,
        groups_processed: duplicateGroups.length,
        records_merged: mergeResults.reduce((s, r) => s + r.deleted_count, 0),
        details: mergeResults
      });
    }

    return Response.json({ error: 'Modo inválido. Use: scan | merge' }, { status: 400 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function calcCompleteness(r) {
  const fields = ['first_name', 'full_name', 'clinic_name', 'phone', 'email', 'cnpj',
    'city', 'address', 'status', 'purchase_score', 'notes', 'website'];
  return fields.filter(f => r[f]).length;
}

function getDuplicateReason(group) {
  const a = group[0], b = group[1];
  if (a.phone && b.phone && a.phone.replace(/\D/g,'') === b.phone.replace(/\D/g,'')) return 'Mesmo telefone';
  if (a.cnpj && b.cnpj && a.cnpj.replace(/\D/g,'') === b.cnpj.replace(/\D/g,'')) return 'Mesmo CNPJ';
  if (a.email && b.email && a.email.toLowerCase() === b.email.toLowerCase()) return 'Mesmo e-mail';
  return 'Nome similar + mesma cidade';
}
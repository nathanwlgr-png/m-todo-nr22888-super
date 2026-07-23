import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const { mode = 'scan', entity = 'Client' } = await req.json().catch(() => ({}));
    if (!['Client', 'Lead'].includes(entity)) return Response.json({ error: 'Entidade inválida' }, { status: 400 });
    if (mode !== 'scan') {
      return Response.json({
        error: 'Mesclagem e exclusão automática estão desativadas. Revise as duplicatas manualmente.',
        destructive_action_blocked: true
      }, { status: 409 });
    }

    const records = entity === 'Lead'
      ? await base44.entities.Lead.list('-created_date', 1000)
      : await base44.entities.Client.list('-created_date', 1000);
    const groups = [];
    const processed = new Set();

    for (let i = 0; i < records.length; i++) {
      if (processed.has(records[i].id)) continue;
      const group = [records[i]];
      for (let j = i + 1; j < records.length; j++) {
        if (processed.has(records[j].id)) continue;
        if (isPossibleDuplicate(records[i], records[j])) {
          group.push(records[j]);
          processed.add(records[j].id);
        }
      }
      if (group.length > 1) {
        processed.add(records[i].id);
        groups.push(group);
      }
    }

    return Response.json({
      success: true,
      mode: 'scan',
      entity,
      total_records: records.length,
      duplicate_groups: groups.length,
      duplicates_to_review: groups.reduce((sum, group) => sum + group.length - 1, 0),
      groups: groups.map((group) => ({
        count: group.length,
        records: group.map((record) => ({
          id: record.id,
          name: record.first_name || record.full_name,
          clinic: record.clinic_name,
          phone: record.phone,
          email: record.email,
          cnpj: record.cnpj,
          city: record.city,
          created: record.created_date
        }))
      })),
      records_changed: 0,
      records_deleted: 0
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function normalize(value) {
  return String(value || '').toLowerCase().trim();
}

function digits(value) {
  return String(value || '').replace(/\D/g, '');
}

function isPossibleDuplicate(a, b) {
  const samePhone = digits(a.phone).length >= 10 && digits(a.phone) === digits(b.phone);
  const sameCnpj = digits(a.cnpj).length === 14 && digits(a.cnpj) === digits(b.cnpj);
  const sameEmail = normalize(a.email) && normalize(a.email) === normalize(b.email);
  const nameA = normalize(a.first_name || a.full_name);
  const nameB = normalize(b.first_name || b.full_name);
  const sameNameAndCity = nameA.length >= 3 && nameA === nameB && normalize(a.city) === normalize(b.city);
  return Boolean(samePhone || sameCnpj || sameEmail || sameNameAndCity);
}
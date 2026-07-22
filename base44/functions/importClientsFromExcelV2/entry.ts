import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import * as XLSX from 'npm:xlsx@0.18.5';

function clean(value) {
  return String(value ?? '').trim();
}

function isMissing(value) {
  const text = clean(value).toLowerCase();
  return !text || text.includes('não identificado') || text.includes('sem registro') || text.includes('validar') || text === 'nan';
}

function toNumber(value, fallback = 0) {
  const number = Number(String(value ?? '').replace(',', '.').replace(/[^0-9.-]/g, ''));
  return Number.isFinite(number) ? number : fallback;
}

function normalizePhone(value) {
  const text = clean(value);
  if (isMissing(text)) return undefined;
  const firstPhone = text.split('/')[0].trim();
  const digits = firstPhone.replace(/\D/g, '');
  if (!digits || digits.length < 8) return undefined;
  return digits.startsWith('55') ? digits : `55${digits}`;
}

function normalizeCnpj(value) {
  return clean(value).replace(/\D/g, '');
}

function normalizeKey(value) {
  return clean(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ');
}

function tagSafe(value) {
  return clean(value).replace(/\s+/g, '_').replace(/[^\wÀ-ÿ/-]/g, '').slice(0, 40);
}

function clientTypeFrom(segmento, perfil) {
  const text = `${clean(segmento)} ${clean(perfil)}`.toLowerCase();
  if (text.includes('hospital')) return 'hospital_veterinario';
  if (text.includes('laborat')) return 'laboratorio_terceirizado';
  if (text.includes('especial')) return 'clinica_especializada';
  return 'clinica_media';
}

function statusFrom(temperatura, score) {
  const text = clean(temperatura).toLowerCase();
  if (text.includes('quente') || score >= 80) return 'quente';
  if (text.includes('frio') || score < 40) return 'frio';
  return 'morno';
}

function pipelineFrom(statusComercial) {
  const text = clean(statusComercial).toLowerCase();
  if (text.includes('pós') || text.includes('pos') || text.includes('expans')) return 'qualificado';
  if (text.includes('proposta')) return 'proposta';
  if (text.includes('negocia')) return 'negociacao';
  return 'lead';
}

function buildNotes(row) {
  return [
    `MATRIZ 515 — ${clean(row.id_interno)} | Código externo: ${clean(row.cod_externo)}`,
    `Status comercial: ${clean(row.status_comercial)}`,
    `Cliente Seamaty: ${clean(row.cliente_seamaty)}`,
    `Equipamentos Seamaty instalados: ${clean(row.equipamentos_seamaty_instalados)}`,
    `Famílias instaladas: ${clean(row.familias_instaladas)}`,
    `Investigação: ${clean(row.status_investigacao)} | Fonte: ${clean(row.qualidade_fonte)}`,
    `Evidência: ${clean(row.resumo_evidencia)}`,
    `Concorrente/parceiro: ${clean(row.concorrente_parceiro_identificado)} | Ameaça: ${clean(row.grau_ameaca_concorrente)} | Confiança: ${clean(row.confianca_texto)} (${clean(row.confianca_num)})`,
    `Dor principal: ${clean(row.dor_provavel_principal)}`,
    `Dor detalhada: ${clean(row.dor_provavel_detalhada)}`,
    `Lacuna comercial: ${clean(row.lacuna_comercial)}`,
    `Produto principal: ${clean(row.produto_seamaty_principal)} | Secundário: ${clean(row.produto_seamaty_secundario)}`,
    `Tipo oportunidade: ${clean(row.tipo_oportunidade)} | Prioridade: ${clean(row.prioridade_comercial)}`,
    `Probabilidade: ${clean(row.probabilidade_fechamento)} | Potencial técnico: ${clean(row.potencial_tecnico)} | Potencial financeiro: ${clean(row.potencial_financeiro)}`,
    `Modelo recomendado: ${clean(row.modelo_comercial_recomendado)} | ROI: ${clean(row.roi_estimado)} | Volume estimado: ${clean(row.volume_estimado_exames_mes)}`,
    `Material ideal: ${clean(row.material_ideal_enviar)}`,
    `Argumento central: ${clean(row.argumento_central)}`,
    `Objeção provável: ${clean(row.objecao_provavel)} | Resposta: ${clean(row.resposta_curta_objecao)}`,
    `Roteiro abordagem: ${clean(row.roteiro_abordagem)}`,
    `Pergunta principal validação: ${clean(row.pergunta_principal_validacao)}`,
    `Checklist visita: ${clean(row.checklist_visita)}`,
    `Pendência real campo: ${clean(row.pendencia_real_campo)}`,
    `Observações internas: ${clean(row.observacoes_internas)}`,
    `Fontes: principal=${clean(row.fonte_principal)} | auxiliar=${clean(row.fonte_auxiliar)} | Maps=${clean(row.google_maps)}`,
    `Regra segurança: ${clean(row.bloqueio_nao_inventar_dados)}`
  ].filter(Boolean).join('\n\n').slice(0, 45000);
}

function cleanObject(data) {
  const output = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined && value !== null && value !== '') output[key] = value;
  }
  return output;
}

function mapMatrizRow(row) {
  const score = Math.max(0, Math.min(100, toNumber(row.score_comercial, 0)));
  const clinicName = clean(row.nome_comercial) || clean(row.razao_social) || clean(row.id_interno);
  const decisor = isMissing(row.responsavel_decisor) ? clinicName : clean(row.responsavel_decisor);
  const competitor = clean(row.concorrente_parceiro_identificado);
  const threat = clean(row.grau_ameaca_concorrente).toLowerCase();
  const priority = clean(row.prioridade_comercial).toLowerCase();
  const isSeamatyClient = clean(row.cliente_seamaty).toLowerCase().includes('sim');

  const tags = [
    'Lote_515_Suprema',
    'V10_SUPREMA',
    tagSafe(row.id_interno),
    isSeamatyClient ? 'Cliente_Seamaty' : 'Prospect_Seamaty',
    score >= 80 ? 'Ataque_Imediato' : score >= 50 ? 'Validar_Campo' : 'Radar_60_Dias',
    threat.includes('alta') ? 'Ameaca_Alta' : 'Ameaca_Mapeada',
    competitor.toLowerCase().includes('idexx') ? 'Concorrente_IDEXX' : undefined,
    priority.includes('up') ? 'Upsell_PosVenda' : undefined,
  ].filter(Boolean);

  const currentEquipment = isMissing(row.equipamento_marca_identificada)
    ? clean(row.equipamentos_seamaty_instalados)
    : clean(row.equipamento_marca_identificada);

  return cleanObject({
    external_code: clean(row.cod_externo) || clean(row.id_interno),
    full_name: decisor,
    first_name: decisor.split(' ')[0] || clinicName,
    cnpj: isMissing(row.cnpj) ? undefined : clean(row.cnpj),
    razao_social: isMissing(row.razao_social) ? undefined : clean(row.razao_social),
    clinic_name: clinicName,
    phone: normalizePhone(row.whatsapp),
    address: isMissing(row.endereco) ? undefined : clean(row.endereco),
    cep: isMissing(row.cep) ? undefined : clean(row.cep),
    city: isMissing(row.cidade) ? undefined : clean(row.cidade),
    instagram_handle: isMissing(row.instagram) ? undefined : clean(row.instagram),
    facebook_url: isMissing(row.facebook) ? undefined : clean(row.facebook),
    website: isMissing(row.site) ? undefined : clean(row.site),
    current_equipment: currentEquipment,
    equipment_sold: clean(row.equipamentos_seamaty_instalados).toLowerCase().includes('nenhum') ? undefined : clean(row.equipamentos_seamaty_instalados),
    equipment_interest: [clean(row.produto_seamaty_principal), clean(row.produto_seamaty_secundario)].filter(Boolean).join(' | '),
    client_type: clientTypeFrom(row.segmento, row.perfil_operacional),
    lead_source: 'importacao_planilha',
    purchase_score: score,
    status: statusFrom(row.temperatura, score),
    pipeline_stage: pipelineFrom(row.status_comercial),
    main_pains: [clean(row.dor_provavel_principal), clean(row.lacuna_comercial)].filter((item) => item && !isMissing(item)),
    real_objections: [clean(row.objecao_provavel)].filter((item) => item && !isMissing(item)),
    purchase_motivators: [clean(row.argumento_central)].filter((item) => item && !isMissing(item)),
    next_action: clean(row.proxima_acao) || clean(row.pergunta_principal_validacao),
    notes: buildNotes(row),
    custom_tags: tags,
    projected_revenue: score >= 80 ? 80000 : score >= 50 ? 40000 : undefined,
    priority_level: score >= 80 ? 1 : score >= 50 ? 3 : 5,
    equipment_suggestion: clean(row.produto_seamaty_principal),
    equipment_suggestion_alternative: clean(row.produto_seamaty_secundario),
    equipment_suggestion_reason: clean(row.lacuna_comercial),
  });
}

async function readRowsFromExcel(fileUrl, sheetName) {
  const response = await fetch(fileUrl);
  if (!response.ok) throw new Error(`Falha ao baixar planilha: ${response.status}`);
  const buffer = await response.arrayBuffer();
  const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' });
  const sheet = workbook.Sheets[sheetName] || workbook.Sheets.BASE44_IMPORT_VALIDADA || workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet, { defval: '' });
}

async function readMatrixFromExcel(fileUrl, sheetName) {
  const response = await fetch(fileUrl);
  if (!response.ok) throw new Error(`Falha ao baixar planilha: ${response.status}`);
  const buffer = await response.arrayBuffer();
  const workbook = XLSX.read(new Uint8Array(buffer), { type: 'array' });
  const sheet = workbook.Sheets[sheetName] || workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: false });
}

function normalizeEmail(value) {
  const email = clean(value).toLowerCase();
  return email.includes('@') ? email : '';
}

function regionalCandidate(row, start) {
  const code = clean(row[start]).replace(/\.0$/, '');
  const legalName = clean(row[start + 1]);
  const fantasy = clean(row[start + 2]);
  const city = clean(row[start + 3]);
  if (!/^\d+$/.test(code) || !legalName || !city) return null;
  const tail = row.slice(start + 8, start + 20).map(clean);
  const dddIndex = tail.findIndex((value) => /^\d{2}(?:\.0)?$/.test(value));
  const ddd = dddIndex >= 0 ? tail[dddIndex].replace(/\.0$/, '') : '';
  const phoneValues = dddIndex >= 0 ? tail.slice(dddIndex + 1, dddIndex + 3) : [];
  const phones = phoneValues.map((value) => value.replace(/\.0$/, '').replace(/\D/g, '')).filter((value) => value.length >= 8);
  const chosenPhone = phones.find((value) => value.length >= 9) || phones[0] || '';
  const email = normalizeEmail(tail.find((value) => value.includes('@')));
  const contactIndex = dddIndex >= 0 ? dddIndex + 3 : -1;
  return {
    external_code: code,
    razao_social: legalName,
    clinic_name: fantasy || legalName,
    city,
    address: clean(row[start + 4]),
    neighborhood: clean(row[start + 5]),
    cep: clean(row[start + 6]),
    segment: clean(row[start + 7]),
    phone: chosenPhone ? `55${ddd}${chosenPhone}` : '',
    email,
    contact: contactIndex >= 0 ? clean(tail[contactIndex]) : ''
  };
}

function tokenKey(value) {
  const stop = new Set(['ltda', 'me', 'epp', 'eireli', 'clinica', 'veterinaria', 'veterinario', 'hospital', 'pet', 'shop', 'comercio', 'produtos', 'de', 'da', 'do', 'e']);
  return normalizeKey(value).replace(/[^a-z0-9 ]/g, ' ').split(' ').filter((part) => part.length > 1 && !stop.has(part)).sort();
}

function sameBusiness(a, b, cityA, cityB) {
  if (normalizeKey(cityA) !== normalizeKey(cityB)) return false;
  const left = tokenKey(a);
  const right = tokenKey(b);
  if (!left.length || !right.length) return false;
  const common = left.filter((token) => right.includes(token)).length;
  return common / Math.min(left.length, right.length) >= 0.75;
}

function mergeMissing(existing, incoming) {
  const output = { id: existing.id };
  for (const [key, value] of Object.entries(incoming)) {
    if ((existing[key] === undefined || existing[key] === null || existing[key] === '') && value !== undefined && value !== null && value !== '') output[key] = value;
  }
  return output;
}

async function importRegional(base44, user, sourceUrl, sheetName, knownClients, dryRun) {
  const matrix = await readMatrixFromExcel(sourceUrl, sheetName);
  const raw = [];
  for (const row of matrix) {
    const first = regionalCandidate(row, 0);
    const shifted = regionalCandidate(row, 4);
    if (first) raw.push(first);
    if (shifted) raw.push(shifted);
  }
  const unique = [];
  const seen = new Set();
  for (const item of raw) {
    const key = item.external_code || item.email || item.phone || `${normalizeKey(item.clinic_name)}|${normalizeKey(item.city)}`;
    if (!seen.has(key)) { seen.add(key); unique.push(item); }
  }

  const [clients, leads] = await Promise.all([
    base44.asServiceRole.entities.Client.list('-updated_date', 5000),
    base44.asServiceRole.entities.Lead.list('-updated_date', 5000)
  ]);
  const distinctKnown = [];
  for (const known of knownClients || []) {
    if (!distinctKnown.some((saved) => sameBusiness(saved.name || saved.nome, known.name || known.nome, saved.city || saved.cidade, known.city || known.cidade))) distinctKnown.push(known);
  }
  const knownFor = (item) => distinctKnown.find((known) => sameBusiness(item.razao_social, known.name || known.nome, item.city, known.city || known.cidade) || sameBusiness(item.clinic_name, known.name || known.nome, item.city, known.city || known.cidade));
  const matchRecord = (records, item) => records.find((record) =>
    (item.email && normalizeEmail(record.email) === item.email) ||
    (item.phone && normalizePhone(record.phone) === normalizePhone(item.phone)) ||
    sameBusiness(record.clinic_name || record.company || record.razao_social || record.full_name, item.clinic_name || item.razao_social, record.city, item.city)
  );

  const createClients = [], updateClients = [], createLeads = [], updateLeads = [];
  const matchedKnown = new Set();
  const updatedClientIds = new Set();
  let clientesOficiais = 0;
  let prospectsExistentes = 0;
  for (const item of unique) {
    const existingClient = matchRecord(clients, item);
    const existingLead = matchRecord(leads, item);
    const known = knownFor(item);
    if (known) {
      const knownKey = `${normalizeKey(known.name || known.nome)}|${normalizeKey(known.city || known.cidade)}`;
      if (!matchedKnown.has(knownKey)) clientesOficiais += 1;
      matchedKnown.add(knownKey);
      const equipment = (known.equipment || known.equipamentos || []).join(' | ');
      const data = cleanObject({ external_code: item.external_code, full_name: item.contact || item.clinic_name, first_name: (item.contact || item.clinic_name).split(' ')[0], clinic_name: item.clinic_name, razao_social: item.razao_social, email: item.email, phone: item.phone, address: item.address, cep: item.cep, city: item.city, current_equipment: equipment, equipment_sold: equipment, representante: 'Nathan', lead_source: 'importacao_planilha', status: 'morno', notes: `Cliente Seamaty validado. Segmento: ${item.segment}. Bairro: ${item.neighborhood}.` });
      if (existingClient) {
        const tags = Array.from(new Set([...(existingClient.custom_tags || []), 'Cliente_Seamaty', 'Base_Regional_Nathan']));
        const update = { ...mergeMissing(existingClient, data), pipeline_stage: 'fechado', custom_tags: tags, ...(equipment ? { current_equipment: equipment, equipment_sold: equipment } : {}) };
        const updateIndex = updateClients.findIndex((saved) => saved.id === existingClient.id);
        if (updateIndex >= 0) updateClients[updateIndex] = { ...updateClients[updateIndex], ...update };
        else updateClients.push(update);
        updatedClientIds.add(existingClient.id);
      } else createClients.push({ ...data, pipeline_stage: 'fechado', custom_tags: ['Cliente_Seamaty', 'Base_Regional_Nathan'] });
    } else if (existingClient) {
      prospectsExistentes += 1;
      const data = cleanObject({ external_code: item.external_code, full_name: item.contact || item.clinic_name, first_name: (item.contact || item.clinic_name).split(' ')[0], clinic_name: item.clinic_name, razao_social: item.razao_social, email: item.email, phone: item.phone, address: item.address, cep: item.cep, city: item.city, representante: 'Nathan', lead_source: 'importacao_planilha', notes: `Prospecção regional. Segmento: ${item.segment}. Bairro: ${item.neighborhood}.` });
      if (!updatedClientIds.has(existingClient.id)) {
        const tags = Array.from(new Set([...(existingClient.custom_tags || []), 'Prospect_Regional', 'Base_Regional_Nathan']));
        updateClients.push({ ...mergeMissing(existingClient, data), pipeline_stage: existingClient.pipeline_stage || 'lead', custom_tags: tags });
        updatedClientIds.add(existingClient.id);
      }
    } else {
      const data = cleanObject({ external_code: item.external_code, full_name: item.contact || item.clinic_name, company: item.clinic_name, razao_social: item.razao_social, email: item.email, phone: item.phone, city: item.city, address: item.address, neighborhood: item.neighborhood, cep: item.cep, source: 'importacao_manual', interest: 'Equipamentos Seamaty', stage: 'novo', status: 'novo', assigned_to: user.email, map_status: 'pendente', notes: `Prospecção regional. Segmento: ${item.segment}.` });
      if (existingLead) updateLeads.push(mergeMissing(existingLead, data));
      else createLeads.push(data);
    }
  }

  for (const known of distinctKnown) {
    const knownKey = `${normalizeKey(known.name || known.nome)}|${normalizeKey(known.city || known.cidade)}`;
    if (matchedKnown.has(knownKey)) continue;
    const name = known.name || known.nome;
    const city = known.city || known.cidade;
    const equipment = (known.equipment || known.equipamentos || []).join(' | ');
    const existing = clients.find((client) => sameBusiness(client.clinic_name || client.razao_social || client.full_name, name, client.city, city));
    clientesOficiais += 1;
    if (existing) {
      const tags = Array.from(new Set([...(existing.custom_tags || []), 'Cliente_Seamaty', 'Base_Regional_Nathan']));
      const update = { id: existing.id, pipeline_stage: 'fechado', custom_tags: tags, ...(equipment ? { current_equipment: equipment, equipment_sold: equipment } : {}) };
      const updateIndex = updateClients.findIndex((saved) => saved.id === existing.id);
      if (updateIndex >= 0) updateClients[updateIndex] = { ...updateClients[updateIndex], ...update };
      else updateClients.push(update);
      updatedClientIds.add(existing.id);
    } else {
      createClients.push(cleanObject({ full_name: name, first_name: name.split(' ')[0], clinic_name: name, city, current_equipment: equipment, equipment_sold: equipment, representante: 'Nathan', lead_source: 'importacao_planilha', pipeline_stage: 'fechado', status: 'morno', custom_tags: ['Cliente_Seamaty', 'Base_Regional_Nathan'], notes: 'Cliente confirmado pelo relatório comercial Seamaty.' }));
    }
  }

  if (!dryRun) {
    for (let i = 0; i < createClients.length; i += 100) await base44.asServiceRole.entities.Client.bulkCreate(createClients.slice(i, i + 100));
    for (let i = 0; i < updateClients.length; i += 100) await base44.asServiceRole.entities.Client.bulkUpdate(updateClients.slice(i, i + 100));
    for (let i = 0; i < createLeads.length; i += 100) await base44.asServiceRole.entities.Lead.bulkCreate(createLeads.slice(i, i + 100));
    for (let i = 0; i < updateLeads.length; i += 100) await base44.asServiceRole.entities.Lead.bulkUpdate(updateLeads.slice(i, i + 100));
  }
  return { success: true, dryRun, summary: { linhas_validas: unique.length, clientes_oficiais: clientesOficiais, prospects_existentes_reclassificados: prospectsExistentes, clientes_criar: createClients.length, registros_atualizar_sem_duplicar: updateClients.length + updateLeads.length, leads_criar: createLeads.length, duplicados_evitar: updateClients.length + updateLeads.length, trecho_deslocado_recuperado: raw.length - matrix.filter((row) => regionalCandidate(row, 0)).length } };
}

function indexExistingClients(clients) {
  const byExternal = new Map();
  const byCnpj = new Map();
  const byNameCity = new Map();

  for (const client of clients) {
    if (clean(client.external_code)) byExternal.set(clean(client.external_code), client);
    const cnpj = normalizeCnpj(client.cnpj);
    if (cnpj) byCnpj.set(cnpj, client);
    const name = normalizeKey(client.clinic_name || client.first_name || client.full_name);
    const city = normalizeKey(client.city);
    if (name || city) byNameCity.set(`${name}|${city}`, client);
  }

  return { byExternal, byCnpj, byNameCity };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { fileUrl, file_url, sheetName = 'BASE44_IMPORT_VALIDADA', dryRun = false, mode = 'matriz_515', knownClients = [] } = await req.json();
    const sourceUrl = fileUrl || file_url;
    if (!sourceUrl) return Response.json({ error: 'fileUrl é obrigatório' }, { status: 400 });
    if (mode === 'regional_prospects') return Response.json(await importRegional(base44, user, sourceUrl, sheetName, knownClients, dryRun));

    const rows = await readRowsFromExcel(sourceUrl, sheetName);
    const validRows = rows.filter((row) => clean(row.status_base44).toLowerCase().includes('pronto') && clean(row.nome_comercial));
    const mappedClients = validRows.map(mapMatrizRow);

    const existingClients = await base44.asServiceRole.entities.Client.list('-updated_date', 5000);
    const indexes = indexExistingClients(existingClients);
    const toCreate = [];
    const toUpdate = [];
    const matchedIds = new Set();

    for (let index = 0; index < validRows.length; index += 1) {
      const row = validRows[index];
      const data = mappedClients[index];
      const cnpj = normalizeCnpj(data.cnpj);
      const nameCity = `${normalizeKey(data.clinic_name || data.first_name)}|${normalizeKey(data.city)}`;
      const existing = indexes.byExternal.get(clean(data.external_code)) || (cnpj ? indexes.byCnpj.get(cnpj) : null) || indexes.byNameCity.get(nameCity);

      if (existing && !matchedIds.has(existing.id)) {
        const customTags = Array.from(new Set([...(existing.custom_tags || []), ...(data.custom_tags || [])]));
        toUpdate.push({ id: existing.id, ...data, custom_tags: customTags });
        matchedIds.add(existing.id);
      } else if (!existing) {
        toCreate.push(data);
      }
    }

    if (!dryRun) {
      for (let index = 0; index < toCreate.length; index += 100) {
        const chunk = toCreate.slice(index, index + 100);
        if (chunk.length) await base44.asServiceRole.entities.Client.bulkCreate(chunk);
      }

      for (let index = 0; index < toUpdate.length; index += 100) {
        const chunk = toUpdate.slice(index, index + 100);
        if (chunk.length) await base44.asServiceRole.entities.Client.bulkUpdate(chunk);
      }
    }

    const highScore = validRows.filter((row) => toNumber(row.score_comercial) >= 80).length;
    const seamaty = validRows.filter((row) => clean(row.cliente_seamaty).toLowerCase().includes('sim')).length;
    const idexx = validRows.filter((row) => clean(row.concorrente_parceiro_identificado).toLowerCase().includes('idexx')).length;
    const highThreat = validRows.filter((row) => clean(row.grau_ameaca_concorrente).toLowerCase().includes('alta')).length;

    return Response.json({
      success: true,
      dryRun,
      summary: {
        total_planilha: rows.length,
        prontos_importacao: validRows.length,
        criar: toCreate.length,
        atualizar: toUpdate.length,
        score_80_mais: highScore,
        clientes_seamaty_no_lote: seamaty,
        concorrente_idexx_mapeado: idexx,
        ameaca_alta_ou_media_alta: highThreat,
      },
    });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});
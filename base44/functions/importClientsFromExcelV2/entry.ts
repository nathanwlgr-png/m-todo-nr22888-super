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

    const { fileUrl, file_url, sheetName = 'BASE44_IMPORT_VALIDADA', dryRun = false } = await req.json();
    const sourceUrl = fileUrl || file_url;
    if (!sourceUrl) return Response.json({ error: 'fileUrl é obrigatório' }, { status: 400 });

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
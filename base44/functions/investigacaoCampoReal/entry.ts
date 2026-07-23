import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const serviceMap = {
  hemogram: 'hemograma',
  biochemistry: 'bioquimico',
  blood_gas: 'hemogasio',
  immunofluorescence: 'imunofluorescencia',
  urinalysis: 'urinalise',
  pcr: 'pcr'
};

function calculateEquipmentPurchaseScore(data) {
  const services = Object.entries(data.services || {}).filter(([, value]) => value === true).map(([key]) => key);
  const sizePoints = { pequena: 6, media: 12, grande: 20 }[data.organization_size] || 4;
  const servicePoints = Math.min(25, services.length * 5);
  const equipmentNames = (data.equipment_evidence?.names || []).join(' ').toLowerCase();
  let equipmentPoints = 10;
  if (data.equipment_evidence?.status === 'validado') equipmentPoints = /seamaty|smt|vg2|qt3|3dx/.test(equipmentNames) ? 8 : 30;
  else if (data.equipment_evidence?.status === 'provavel') equipmentPoints = 20;
  else if (services.length) equipmentPoints = 25;
  const experiencePoints = Math.min(10, Math.max(0, Number(data.years_experience || 0) / 2));
  const followers = Number(data.followers || 0);
  const socialPoints = followers >= 50000 ? 10 : followers >= 20000 ? 8 : followers >= 5000 ? 6 : followers >= 1000 ? 4 : followers >= 100 ? 2 : 0;
  const confidencePoints = Math.min(5, Math.max(0, Number(data.evidence_confidence || 0) / 20));
  return Math.min(100, Math.round(sizePoints + servicePoints + equipmentPoints + experiencePoints + socialPoints + confidencePoints));
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

    const payload = await req.json().catch(() => ({}));
    const sr = base44.asServiceRole;
    const client = payload.client_id ? await sr.entities.Client.get(payload.client_id) : null;
    const clinicName = client?.clinic_name || client?.razao_social || payload.clinic_name;
    const city = client?.city || payload.city;
    if (!clinicName) return Response.json({ error: 'Nome da clínica/empresa obrigatório' }, { status: 400 });

    const investigation = await sr.integrations.Core.InvokeLLM({
      model: 'gemini_3_flash',
      add_context_from_internet: true,
      prompt: `Faça uma investigação comercial factual sobre a organização veterinária "${clinicName}" em "${city || 'cidade não informada'}".
Consulte Google, site oficial e redes sociais públicas. Examine textos e, quando disponíveis, fotos públicas para identificar equipamentos laboratoriais visíveis. Não invente: equipamento só pode ser "validado" quando houver marca/modelo legível ou declaração pública clara; use "provavel" para indício parcial e "nao_encontrado" quando não houver prova.
Identifique se é clínica, hospital veterinário ou laboratório; porte pequeno, médio ou grande; anos de experiência; seguidores publicamente visíveis; especialidades; e se oferece hemograma, bioquímica, hemogasometria, PCR, imunofluorescência, hormonais ou urinálise. Cada conclusão importante deve citar URL e evidência curta. Se não houver fonte, use valor desconhecido/false e explique a lacuna.
Contexto CRM: website=${client?.website || payload.website || 'não informado'}; instagram=${client?.instagram_handle || payload.instagram || 'não informado'}; equipamento atual=${client?.current_equipment || payload.current_equipment || 'não informado'}.
O objetivo é estimar potencial real de COMPRA DE EQUIPAMENTO Seamaty e preparar abordagem SPIN, sem usar popularidade isolada como prova de capacidade financeira.`,
      response_json_schema: {
        type: 'object',
        properties: {
          organization_type: { type: 'string', enum: ['clinica', 'hospital', 'laboratorio', 'desconhecido'] },
          organization_size: { type: 'string', enum: ['pequena', 'media', 'grande', 'desconhecida'] },
          years_experience: { type: 'number' },
          followers: { type: 'number' },
          specialties: { type: 'array', items: { type: 'string' } },
          services: { type: 'object', properties: {
            hemogram: { type: 'boolean' }, biochemistry: { type: 'boolean' }, blood_gas: { type: 'boolean' },
            pcr: { type: 'boolean' }, immunofluorescence: { type: 'boolean' }, hormonal: { type: 'boolean' }, urinalysis: { type: 'boolean' }
          } },
          equipment_evidence: { type: 'object', properties: {
            status: { type: 'string', enum: ['validado', 'provavel', 'nao_encontrado'] },
            names: { type: 'array', items: { type: 'string' } }, evidence: { type: 'string' }, source_url: { type: 'string' }
          } },
          evidence_confidence: { type: 'number' },
          sources: { type: 'array', items: { type: 'object', properties: { url: { type: 'string' }, evidence: { type: 'string' } } } },
          score_justification: { type: 'string' },
          equipment_purchase_potential: { type: 'string' },
          recommended_product: { type: 'string' },
          recommended_approach: { type: 'string' },
          spin_questions: { type: 'array', items: { type: 'string' } },
          next_action: { type: 'string' }
        }
      }
    });

    const commercialScore = calculateEquipmentPurchaseScore(investigation);
    const scoreLevel = commercialScore >= 75 ? 'alto' : commercialScore >= 50 ? 'medio' : 'baixo';
    const labNeeds = Object.entries(investigation.services || {}).filter(([key, value]) => value && serviceMap[key]).map(([key]) => serviceMap[key]);
    const recommendedProduct = investigation.services?.pcr ? '3Dx' :
      (investigation.services?.immunofluorescence || investigation.services?.hormonal) ? 'QT3' :
      investigation.services?.biochemistry ? 'SMT-120VP' :
      investigation.services?.hemogram ? 'VG2' : 'Diagnóstico técnico necessário';
    const scoreJustification = `Score ${commercialScore}/100: porte ${investigation.organization_size || 'desconhecido'}, ${labNeeds.length} serviço(s) laboratorial(is) validado(s), equipamento ${investigation.equipment_evidence?.status || 'não encontrado'}, ${investigation.years_experience || 0} ano(s) de experiência, ${investigation.followers || 0} seguidores e confiança de evidência ${investigation.evidence_confidence || 0}/100.`;
    const purchasePotential = scoreLevel === 'alto' ? 'Alta prioridade para visita e diagnóstico de equipamento.' : scoreLevel === 'medio' ? 'Potencial moderado; validar volume de exames e orçamento no SPIN.' : 'Baixa evidência atual; confirmar serviços e volume antes de ofertar equipamento.';

    if (client) {
      const updates = {
        purchase_score: commercialScore,
        ai_website_analysis: JSON.stringify({ ...investigation, metric: 'potencial_compra_equipamento_v1', score: commercialScore, investigated_at: new Date().toISOString() }),
        lab_needs: labNeeds,
        equipment_suggestion: recommendedProduct,
        equipment_suggestion_reason: purchasePotential,
        next_action: investigation.next_action
      };
      const typeMap = { clinica: investigation.organization_size === 'media' ? 'clinica_media' : 'clinica_pequena', hospital: 'hospital_veterinario', laboratorio: 'laboratorio_terceirizado' };
      const sizeMap = { pequena: 'pequena', media: 'media', grande: 'grande' };
      if (typeMap[investigation.organization_type]) updates.client_type = typeMap[investigation.organization_type];
      if (sizeMap[investigation.organization_size]) updates.company_size = sizeMap[investigation.organization_size];
      if (investigation.equipment_evidence?.status === 'validado' && investigation.equipment_evidence.names?.length) updates.current_equipment = investigation.equipment_evidence.names.join(', ');
      await sr.entities.Client.update(client.id, updates);
    }

    return Response.json({
      ...investigation,
      commercial_score: commercialScore,
      score_level: scoreLevel,
      score_justification: scoreJustification,
      equipment_purchase_potential: purchasePotential,
      recommended_product: recommendedProduct,
      metric_version: 'potencial_compra_equipamento_v1',
      score_components: {
        porte: investigation.organization_size,
        servicos_laboratoriais: labNeeds.length,
        equipamento: investigation.equipment_evidence?.status || 'nao_encontrado',
        experiencia_anos: investigation.years_experience || 0,
        seguidores: investigation.followers || 0,
        confianca_evidencias: investigation.evidence_confidence || 0
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
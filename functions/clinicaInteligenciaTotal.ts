// FUNÇÃO 1: Inteligência Total de Clínica - busca tudo na internet + perfil completo do CRM
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { clinic_name, city, client_id } = await req.json();

    if (!clinic_name && !client_id) {
      return Response.json({ error: 'clinic_name ou client_id obrigatório' }, { status: 400 });
    }

    // Buscar dados do cliente no CRM
    let client = null;
    let sales = [];
    let visits = [];
    let tasks = [];
    let interactions = [];
    let messages = [];

    if (client_id) {
      client = await base44.asServiceRole.entities.Client.get(client_id).catch(() => null);
      if (client) {
        [sales, visits, tasks, interactions, messages] = await Promise.all([
          base44.asServiceRole.entities.Sale.filter({ client_id }).catch(() => []),
          base44.asServiceRole.entities.Visit.filter({ client_id }).catch(() => []),
          base44.asServiceRole.entities.Task.filter({ client_id }).catch(() => []),
          base44.asServiceRole.entities.Interaction.filter({ client_id }).catch(() => []),
          base44.asServiceRole.entities.WhatsAppMessage.filter({ contact_id: client_id }).catch(() => []),
        ]);
      }
    }

    const targetClinic = clinic_name || client?.clinic_name || '';
    const targetCity = city || client?.city || '';
    const targetName = client?.first_name || '';

    // Busca na internet com IA
    const internetResearch = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Você é um analista de mercado veterinário. Pesquise TUDO sobre:

CLÍNICA: "${targetClinic}"
CIDADE: "${targetCity}"
RESPONSÁVEL: "${targetName}"

Busque e analise:
1. Informações da clínica (site, Google Maps, redes sociais)
2. Especialidades oferecidas
3. Avaliações de clientes (Google, Facebook)
4. Equipamentos mencionados ou visíveis
5. Volume estimado de atendimentos por mês
6. Concorrentes diretos na mesma cidade
7. Potencial de compra estimado para equipamentos laboratoriais
8. Melhor abordagem de venda baseada no perfil online
9. Notícias recentes sobre a clínica ou o veterinário responsável
10. Instagram, Facebook - nível de atividade e engajamento

CONTEXTO SEAMATY/CMAT BRASIL:
- Equipamentos: SMT-120VP (hematológico), VG1/VG2 (gasometria), Vi1 (imunofluorescência), VBC50A, VQ1 (PCR)
- Foco: clínicas que terceirizam hemogramas ou têm volume >40/mês

Gere análise COMPLETA E DETALHADA com todos os dados encontrados.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: 'object',
        properties: {
          clinic_info: {
            type: 'object',
            properties: {
              nome_confirmado: { type: 'string' },
              endereco: { type: 'string' },
              telefone: { type: 'string' },
              site: { type: 'string' },
              instagram: { type: 'string' },
              facebook: { type: 'string' },
              google_maps_link: { type: 'string' },
              avaliacao_google: { type: 'string' },
              numero_avaliacoes: { type: 'number' },
            }
          },
          especialidades: { type: 'array', items: { type: 'string' } },
          equipamentos_detectados: { type: 'array', items: { type: 'string' } },
          volume_estimado_mensal: { type: 'string' },
          porte_clinica: { type: 'string' },
          potencial_compra: { type: 'string' },
          score_oportunidade: { type: 'number' },
          equipamento_recomendado: { type: 'string' },
          razao_recomendacao: { type: 'string' },
          abordagem_ideal: { type: 'string' },
          gatilhos_recomendados: { type: 'array', items: { type: 'string' } },
          concorrentes_cidade: { type: 'array', items: { type: 'string' } },
          outras_clinicas_cidade: { type: 'array', items: { type: 'string' } },
          insights_midia_social: { type: 'string' },
          alertas: { type: 'array', items: { type: 'string' } },
          resumo_executivo: { type: 'string' },
        }
      }
    });

    // Análise CRM interna
    const crmAnalysis = {
      client_data: client ? {
        nome: client.first_name,
        clinica: client.clinic_name,
        cidade: client.city,
        status: client.status,
        pipeline: client.pipeline_stage,
        purchase_score: client.purchase_score,
        health_score: client.health_score,
        engagement_score: client.engagement_score,
        numerologia: client.numerology_number,
        perfil_comportamental: client.behavioral_profile,
        decisao_estilo: client.decision_style,
        dores_principais: client.main_pains,
        motivadores: client.purchase_motivators,
        objecoes: client.real_objections,
        equipamento_atual: client.current_equipment,
        equipamento_interesse: client.equipment_interest,
        orcamento_disponivel: client.available_budget,
        ultimo_contato: client.last_contact_date,
        proxima_acao: client.next_action,
        ai_segment: client.ai_segment,
        notes: client.notes,
      } : null,
      historico: {
        total_vendas: sales.length,
        total_visitas: visits.length,
        total_tarefas: tasks.length,
        total_interacoes: interactions.length,
        total_mensagens: messages.length,
        receita_total: sales.reduce((sum, s) => sum + (s.sale_value || 0), 0),
        vendas_fechadas: sales.filter(s => s.status === 'fechada' || s.status === 'entregue').length,
        ultima_venda: sales[0] || null,
        ultima_visita: visits[0] || null,
        ultimas_interacoes: interactions.slice(0, 3),
      }
    };

    // Atualizar cliente com dados da pesquisa se existir
    if (client_id && client && internetResearch) {
      await base44.asServiceRole.entities.Client.update(client_id, {
        ai_website_analysis: JSON.stringify(internetResearch),
        equipment_suggestion: internetResearch.equipamento_recomendado,
        equipment_suggestion_reason: internetResearch.razao_recomendacao,
        health_score: Math.min(100, Math.max(0, (internetResearch.score_oportunidade || 50))),
        ai_next_best_action: internetResearch.abordagem_ideal,
        competitor_analysis_date: new Date().toISOString().split('T')[0],
      }).catch(e => console.error('Update error:', e));
    }

    return Response.json({
      success: true,
      clinic_name: targetClinic,
      city: targetCity,
      internet_research: internetResearch,
      crm_analysis: crmAnalysis,
      generated_at: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Erro clinicaInteligenciaTotal:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
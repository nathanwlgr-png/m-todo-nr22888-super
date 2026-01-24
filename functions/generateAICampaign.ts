import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { 
      campaign_goal, 
      target_criteria = {},
      execute_campaign = false 
    } = await req.json();

    if (!campaign_goal) {
      return Response.json({ error: 'campaign_goal obrigatório' }, { status: 400 });
    }

    // Buscar todos os clientes para análise
    const clients = await base44.entities.Client.list();

    // Filtrar clientes pelo critério
    let targetClients = clients;

    if (target_criteria.status) {
      targetClients = targetClients.filter(c => c.status === target_criteria.status);
    }
    if (target_criteria.min_score) {
      targetClients = targetClients.filter(c => (c.purchase_score || 0) >= target_criteria.min_score);
    }
    if (target_criteria.pipeline_stage) {
      targetClients = targetClients.filter(c => c.pipeline_stage === target_criteria.pipeline_stage);
    }
    if (target_criteria.city) {
      targetClients = targetClients.filter(c => c.city === target_criteria.city);
    }
    if (target_criteria.ai_segment) {
      targetClients = targetClients.filter(c => c.ai_segment === target_criteria.ai_segment);
    }
    if (target_criteria.days_without_contact) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - target_criteria.days_without_contact);
      targetClients = targetClients.filter(c => 
        !c.last_contact_date || new Date(c.last_contact_date) < cutoffDate
      );
    }

    // Estatísticas do público-alvo
    const targetStats = {
      total: targetClients.length,
      hot: targetClients.filter(c => c.status === 'quente').length,
      warm: targetClients.filter(c => c.status === 'morno').length,
      cold: targetClients.filter(c => c.status === 'frio').length,
      avg_score: targetClients.reduce((sum, c) => sum + (c.purchase_score || 0), 0) / targetClients.length || 0,
      cities: [...new Set(targetClients.map(c => c.city).filter(Boolean))],
      segments: [...new Set(targetClients.map(c => c.ai_segment).filter(Boolean))]
    };

    // Gerar campanha com IA
    const campaign = await base44.integrations.Core.InvokeLLM({
      prompt: `Você é um especialista em marketing e prospecção B2B.

OBJETIVO DA CAMPANHA: ${campaign_goal}

PÚBLICO-ALVO SELECIONADO:
- Total: ${targetStats.total} clientes
- Status: ${targetStats.hot} quentes, ${targetStats.warm} mornos, ${targetStats.cold} frios
- Score médio: ${targetStats.avg_score.toFixed(0)}%
- Cidades: ${targetStats.cities.join(', ')}
- Segmentos IA: ${targetStats.segments.join(', ')}

CRITÉRIOS DE FILTRO:
${JSON.stringify(target_criteria, null, 2)}

TAREFA:
Crie uma campanha de prospecção COMPLETA e ESTRATÉGICA.

Defina:

**1. NOME DA CAMPANHA** (criativo, impactante)

**2. ESTRATÉGIA GERAL** (2-3 parágrafos)
- Por que esta campanha funciona para este público
- Timing ideal
- Expectativa de conversão

**3. CANAIS E PRIORIDADES**
- Canal primário (email/whatsapp/telefone)
- Canal secundário
- Justificativa

**4. MENSAGEM PRINCIPAL**
- Headline/Assunto matador
- Corpo da mensagem (3-4 parágrafos COMPLETOS)
- CTA principal
- Senso de urgência

**5. VARIAÇÕES POR PERFIL**
Para cada perfil comportamental comum (analítico, emocional, direto):
- Ajuste no tom
- Variação do pitch

**6. SEQUÊNCIA MULTI-TOUCH**
- Mensagem 1 (Dia 0): texto completo
- Mensagem 2 (Dia 3): texto completo  
- Mensagem 3 (Dia 7): texto completo

**7. MÉTRICAS DE SUCESSO**
- Taxa de abertura esperada
- Taxa de resposta esperada
- Taxa de conversão esperada

**8. OFERTAS E GATILHOS**
- Oferta principal
- Gatilho de escassez
- Garantia/bonificação diferencial

REGRAS:
- Use dados do mercado veterinário brasileiro
- Mencione diferenciais Seamaty (garantia 25 meses, bonificação insumos)
- Seja persuasivo mas profissional
- Adapte ao perfil B2B veterinário
- Todas as mensagens devem estar PRONTAS para envio

Retorne JSON estruturado.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          campaign_name: { type: "string" },
          strategy: { type: "string" },
          primary_channel: { type: "string" },
          secondary_channel: { type: "string" },
          main_message: {
            type: "object",
            properties: {
              subject: { type: "string" },
              body: { type: "string" },
              cta: { type: "string" }
            }
          },
          profile_variations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                profile_type: { type: "string" },
                tone_adjustment: { type: "string" },
                pitch_variation: { type: "string" }
              }
            }
          },
          multi_touch_sequence: {
            type: "array",
            items: {
              type: "object",
              properties: {
                day: { type: "number" },
                subject: { type: "string" },
                body: { type: "string" }
              }
            }
          },
          success_metrics: {
            type: "object",
            properties: {
              expected_open_rate: { type: "number" },
              expected_response_rate: { type: "number" },
              expected_conversion_rate: { type: "number" }
            }
          },
          offers: {
            type: "object",
            properties: {
              main_offer: { type: "string" },
              scarcity_trigger: { type: "string" },
              guarantee: { type: "string" }
            }
          }
        }
      }
    });

    // Salvar campanha
    const savedCampaign = await base44.entities.Campaign.create({
      name: campaign.campaign_name,
      goal: campaign_goal,
      target_criteria: target_criteria,
      target_count: targetStats.total,
      status: execute_campaign ? 'active' : 'draft',
      channels: [campaign.primary_channel, campaign.secondary_channel].filter(Boolean),
      message_template: campaign.main_message.body,
      subject_line: campaign.main_message.subject,
      start_date: new Date().toISOString().split('T')[0],
      expected_conversion_rate: campaign.success_metrics?.expected_conversion_rate || 10
    });

    // Se executar campanha, enviar mensagens
    let sent_count = 0;
    if (execute_campaign && targetClients.length > 0) {
      for (const client of targetClients.slice(0, 50)) { // Limitar a 50 por vez
        try {
          if (campaign.primary_channel === 'email' && client.email) {
            await base44.integrations.Core.SendEmail({
              to: client.email,
              subject: campaign.main_message.subject.replace('{nome}', client.first_name),
              body: campaign.main_message.body.replace('{nome}', client.first_name)
            });
            sent_count++;
          }
          
          await new Promise(resolve => setTimeout(resolve, 100)); // Rate limiting
        } catch (error) {
          console.error(`Erro ao enviar para ${client.first_name}:`, error);
        }
      }
    }

    return Response.json({
      success: true,
      campaign: {
        ...campaign,
        id: savedCampaign.id,
        target_stats: targetStats
      },
      messages_sent: sent_count,
      executed: execute_campaign
    });

  } catch (error) {
    console.error('Erro:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
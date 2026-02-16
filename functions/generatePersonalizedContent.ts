import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { contact_id, content_type, custom_context } = await req.json();

    // Buscar lead ou cliente
    const contact = await base44.entities.Client.get(contact_id).catch(() => 
      base44.entities.Lead.get(contact_id)
    );

    // Buscar dados dos produtos
    const allEquipment = await base44.asServiceRole.entities.Equipment.list();
    const activeEquipment = allEquipment.filter(e => e.is_active !== false);

    // Buscar dados contextuais
    const interactions = await base44.entities.Interaction.filter({ client_id: contact_id });
    const sales = await base44.entities.Sale?.filter({ client_id: contact_id }).catch(() => []);
    const docs = await base44.entities.DocumentEngagement?.filter({ client_id: contact_id }).catch(() => []);

    // Calcular engajamento e sentimento
    const sentimentData = interactions.filter(i => i.sentiment);
    const avgSentiment = sentimentData.length > 0
      ? sentimentData.reduce((sum, i) => sum + (i.sentiment_score || 0), 0) / sentimentData.length
      : 0;
    const lastSentiment = sentimentData[0]?.sentiment || 'neutral';
    const lastEmotion = sentimentData[0]?.emotion_detected || 'neutral';

    const engagementLevel = docs.reduce((sum, d) => sum + (d.views_count || 0), 0) > 5 ? 'alto' :
                           interactions.length > 3 ? 'medio' : 'baixo';

    // Prompt baseado no tipo de conteúdo
    const prompts = {
      email_prospeccao: `Crie um EMAIL DE PROSPECÇÃO profissional e persuasivo.

PERFIL DO DESTINATÁRIO:
- Nome: ${contact.first_name || contact.full_name}
- Empresa: ${contact.company || contact.clinic_name}
- Cargo: ${contact.decision_role}
- Perfil: ${contact.behavioral_profile}
- Numerologia: ${contact.numerology_number}
- Tom: ${contact.client_tone}
- Interesse: ${contact.equipment_interest || contact.interest}

PRODUTOS DISPONÍVEIS (USE DADOS REAIS):
${activeEquipment.map(e => `
  • ${e.name} - R$ ${e.price?.toLocaleString('pt-BR')}
    - Tempo: ${e.processing_time || 'N/A'}
    - Amostra: ${e.sample_volume || 'N/A'}
    - ROI: ${e.roi_months || 'N/A'} meses
    - Economia: R$ ${e.monthly_savings || 'N/A'}/mês
    - Parâmetros: ${e.parameters_measured || 'N/A'}
    - Benefícios: ${e.key_benefits || 'N/A'}
`).join('\n')}

CONTEXTO:
- Sentimento médio: ${avgSentiment.toFixed(2)} (${lastSentiment})
- Engajamento: ${engagementLevel}
- Interações: ${interactions.length}
- ${custom_context || ''}

CRIE EMAIL COM:
- Assunto irresistível (personalizado ao perfil)
- Abertura com gatilho específico
- Corpo adaptado ao estilo de decisão
- CTA claro e específico
- Assinatura profissional

Adapte ao perfil numerológico. ${contact.numerology_number === 1 ? 'Use exclusividade e liderança.' : ''}
${contact.numerology_number === 7 ? 'Use dados e evidências científicas.' : ''}
${contact.numerology_number === 8 ? 'Foque em ROI e números.' : ''}`,

      email_followup: `Crie EMAIL DE FOLLOW-UP natural e não invasivo.

DESTINATÁRIO: ${contact.first_name || contact.full_name}
ÚLTIMA INTERAÇÃO: ${interactions[0]?.subject || 'Primeira abordagem'}
SENTIMENTO ATUAL: ${lastSentiment} (${lastEmotion})
DIAS SEM CONTATO: ${interactions.length > 0 ? Math.floor((Date.now() - new Date(interactions[0].created_date)) / (1000*60*60*24)) : 0}

${lastSentiment === 'negative' ? 'CUIDADO: Sentimento negativo. Use empatia e suporte.' : ''}
${lastSentiment === 'positive' ? 'APROVEITE: Sentimento positivo. Avance na venda.' : ''}

CRIE EMAIL QUE:
- Referencie última conversa
- Agregue valor (não só vender)
- Mantenha relacionamento
- Sugira próximo passo`,

      social_linkedin: `Crie POST PARA LINKEDIN sobre case de sucesso.

USE DADOS:
- Cliente: ${contact.clinic_name || contact.company}
- Equipamento: ${contact.equipment_sold || contact.equipment_interest}
- Cidade: ${contact.city}
- Resultado: ${sales.length > 0 ? 'Cliente satisfeito' : 'Em negociação'}

FORMATO:
- Hook impactante
- Problema → Solução
- Benefício mensurável
- CTA para contato
- 3-5 hashtags relevantes`,

      social_instagram: `Crie LEGENDA INSTAGRAM engajadora.

TEMA: ${contact.equipment_interest || 'Equipamentos veterinários'}
TOM: Informal, visual, emocional
INCLUIR: Emojis, call-to-action, hashtags (#veterinaria #equipamentos)

Máximo 150 caracteres.`,

      whatsapp_sequence: `Crie SEQUÊNCIA DE 3 MENSAGENS WHATSAPP.

PARA: ${contact.first_name}
PERFIL: ${contact.behavioral_profile}
SENTIMENTO: ${lastSentiment}
ENGAJAMENTO: ${engagementLevel}

MENSAGEM 1 (Dia 0): Abertura amigável
MENSAGEM 2 (Dia 3): Valor agregado + pergunta
MENSAGEM 3 (Dia 7): Fechamento suave com urgência ética

Cada mensagem max 3 parágrafos. Adapte ao tom ${contact.client_tone}.`
    };

    const prompt = prompts[content_type] || prompts.email_prospeccao;

    const generatedContent = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          subject: { type: "string" },
          content: { type: "string" },
          alternative_version: { type: "string" },
          best_send_time: { type: "string" },
          key_points: { type: "array", items: { type: "string" } },
          expected_response_rate: { type: "number" },
          personalization_elements: { type: "array", items: { type: "string" } }
        }
      }
    });

    return Response.json({
      success: true,
      content: generatedContent,
      contact_name: contact.first_name || contact.full_name,
      sentiment: lastSentiment,
      engagement: engagementLevel
    });

  } catch (error) {
    console.error('Content generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
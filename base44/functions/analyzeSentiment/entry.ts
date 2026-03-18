import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { interaction_id, text } = await req.json();

    // Análise de sentimento com IA
    const sentimentAnalysis = await base44.integrations.Core.InvokeLLM({
      prompt: `Analise o sentimento desta interação de vendas:

TEXTO:
${text}

Analise:
1. Sentimento geral (positivo/neutro/negativo)
2. Score numérico (-1 a 1, onde -1 é muito negativo e 1 é muito positivo)
3. Confiança da análise (0-100)
4. Palavras-chave que indicam o sentimento
5. Emoção principal (alegria/raiva/medo/tristeza/surpresa/neutro)
6. Prioridade de ação (baixa/media/alta/urgente)

RETORNE JSON VÁLIDO.`,
      response_json_schema: {
        type: "object",
        properties: {
          sentiment: { type: "string", enum: ["positive", "neutral", "negative"] },
          sentiment_score: { type: "number" },
          confidence: { type: "number" },
          keywords: { type: "array", items: { type: "string" } },
          emotion: { type: "string" },
          priority: { type: "string" },
          reasoning: { type: "string" }
        }
      }
    });

    // Atualizar interação
    await base44.entities.Interaction.update(interaction_id, {
      sentiment: sentimentAnalysis.sentiment,
      sentiment_score: sentimentAnalysis.sentiment_score,
      sentiment_confidence: sentimentAnalysis.confidence,
      sentiment_keywords: sentimentAnalysis.keywords,
      emotion_detected: sentimentAnalysis.emotion,
      ai_priority: sentimentAnalysis.priority
    });

    // Buscar interação atualizada
    const interaction = await base44.entities.Interaction.get(interaction_id);

    // Buscar últimas 10 interações do cliente
    const recentInteractions = await base44.entities.Interaction.filter({
      client_id: interaction.client_id
    });

    // Calcular health score baseado em sentimento
    const last10 = recentInteractions.slice(0, 10);
    const sentimentScores = last10.map(i => i.sentiment_score || 0).filter(s => s !== 0);
    const avgSentiment = sentimentScores.length > 0 
      ? sentimentScores.reduce((a, b) => a + b, 0) / sentimentScores.length 
      : 0;

    // Converter para health score (0-100)
    const healthScore = Math.round(((avgSentiment + 1) / 2) * 100);

    // Contar negativos recentes
    const negativeCount = last10.filter(i => i.sentiment === 'negative').length;

    // Atualizar cliente
    const client = await base44.entities.Client.get(interaction.client_id).catch(() => null);
    const lead = !client ? await base44.entities.Lead.get(interaction.client_id).catch(() => null) : null;
    
    if (client) {
      await base44.entities.Client.update(client.id, {
        health_score: healthScore,
        health_score_updated: new Date().toISOString()
      });
    } else if (lead) {
      await base44.entities.Lead.update(lead.id, {
        ai_score: Math.max(0, healthScore - 10) // Penaliza um pouco por ser lead
      });
    }

    // Criar alerta se necessário
    if (negativeCount >= 3 || (sentimentAnalysis.sentiment === 'negative' && sentimentAnalysis.sentiment_score < -0.7)) {
      await base44.entities.SentimentAlert.create({
        client_id: interaction.client_id,
        client_name: interaction.client_name,
        alert_type: negativeCount >= 3 ? 'multiple_negative' : 'critical',
        severity: 'high',
        sentiment_score: avgSentiment,
        previous_score: 0,
        interactions_analyzed: last10.length,
        negative_count: negativeCount,
        trigger_reason: `${negativeCount} interações negativas detectadas. Score: ${avgSentiment.toFixed(2)}`,
        recommended_action: 'Contato imediato do gerente comercial para recuperar relacionamento',
        assigned_to: client?.created_by || lead?.created_by
      });
    }

    return Response.json({
      success: true,
      sentiment: sentimentAnalysis.sentiment,
      score: sentimentAnalysis.sentiment_score,
      health_score: healthScore,
      alert_created: negativeCount >= 3
    });

  } catch (error) {
    console.error('Sentiment analysis error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action } = body;

    // ANÁLISE DE IMAGEM - Clínica / Equipamentos
    if (action === 'analyze_clinic_image') {
      const { image_url, client_id } = body;

      const vision = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `Você é um especialista em diagnóstico veterinário e avaliador de equipamentos laboratoriais da CMAT Brasil.

Analise esta imagem de uma clínica/laboratório veterinário e extraia:

1. EQUIPAMENTOS VISÍVEIS: Identifique todos os equipamentos laboratoriais/diagnósticos visíveis (marca, modelo se identificável, estado aparente)
2. INFRAESTRUTURA: Avalie o porte e nível de investimento da clínica
3. OPORTUNIDADES: Quais equipamentos Seamaty se encaixam neste perfil?
   - SMT-120VP: Hematológico 5 partes completo
   - VG1/VG2: Gases e eletrólitos  
   - VBC50A: Hematológico 5 partes
   - Vi1: Imunofluorescência
   - VQ1: PCR veterinário
4. ESTIMATIVA DE POTENCIAL: Qual o potencial de compra estimado?
5. ABORDAGEM RECOMENDADA: Como abordar este cliente baseado no que vejo?

Seja específico e prático nas recomendações.`,
        file_urls: [image_url],
        response_json_schema: {
          type: 'object',
          properties: {
            equipment_found: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  brand: { type: 'string' },
                  condition: { type: 'string' },
                  age_estimate: { type: 'string' }
                }
              }
            },
            clinic_size: { type: 'string' },
            infrastructure_score: { type: 'number' },
            investment_level: { type: 'string' },
            equipment_suggestion: { type: 'string' },
            equipment_suggestion_reason: { type: 'string' },
            equipment_suggestion_alternative: { type: 'string' },
            purchase_potential: { type: 'number' },
            approach_recommendation: { type: 'string' },
            key_observations: { type: 'array', items: { type: 'string' } }
          }
        }
      });

      if (client_id && vision.equipment_suggestion) {
        await base44.asServiceRole.entities.Client.update(client_id, {
          equipment_suggestion: vision.equipment_suggestion,
          equipment_suggestion_reason: vision.equipment_suggestion_reason,
          equipment_suggestion_alternative: vision.equipment_suggestion_alternative,
          ai_sales_intelligence: {
            best_approach: vision.approach_recommendation
          }
        });
      }

      return Response.json({ analysis: vision, success: true });
    }

    // ANÁLISE DE ÁUDIO / TRANSCRIÇÃO
    if (action === 'analyze_audio') {
      const { audio_url, client_id, transcript_text } = body;

      const prompt = transcript_text
        ? `Analise este texto/transcrição de uma conversa/chamada de vendas e extraia insights:

TRANSCRIÇÃO: ${transcript_text}`
        : `Analise este conteúdo de áudio de uma conversa/chamada de vendas.`;

      const audioAnalysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `${prompt}

Você é um especialista em análise de vendas e comunicação. Identifique:

1. SENTIMENTO: Positivo/Neutro/Negativo do cliente durante a conversa
2. EMOÇÕES DETECTADAS: Interesse, dúvida, resistência, entusiasmo, frustração
3. PALAVRAS-CHAVE: Termos importantes mencionados (equipamentos, preço, concorrentes, objeções)
4. OBJEÇÕES LEVANTADAS: O cliente mencionou alguma objeção?
5. SINAIS DE COMPRA: Houve sinais positivos de intenção de compra?
6. RESUMO EXECUTIVO: O que aconteceu nesta conversa?
7. PRÓXIMA AÇÃO: O que fazer agora com base nesta conversa?
8. SCORE DE ENGAJAMENTO: De 0 a 100, quão engajado estava o cliente?`,
        file_urls: audio_url ? [audio_url] : undefined,
        response_json_schema: {
          type: 'object',
          properties: {
            sentiment: { type: 'string' },
            sentiment_score: { type: 'number' },
            emotion_detected: { type: 'string' },
            keywords: { type: 'array', items: { type: 'string' } },
            objections_found: { type: 'array', items: { type: 'string' } },
            buying_signals: { type: 'array', items: { type: 'string' } },
            summary: { type: 'string' },
            next_action: { type: 'string' },
            engagement_score: { type: 'number' },
            key_moments: { type: 'array', items: { type: 'string' } }
          }
        }
      });

      if (client_id) {
        await base44.asServiceRole.entities.Interaction.create({
          client_id,
          type: 'ligacao',
          direction: 'outbound',
          subject: 'Análise de Áudio - IA',
          notes: audioAnalysis.summary,
          outcome: audioAnalysis.sentiment === 'positive' ? 'positive' : audioAnalysis.sentiment === 'negative' ? 'negative' : 'neutral',
          sentiment: audioAnalysis.sentiment,
          sentiment_score: audioAnalysis.sentiment_score,
          sentiment_keywords: audioAnalysis.keywords,
          emotion_detected: audioAnalysis.emotion_detected,
          next_action: audioAnalysis.next_action,
          ai_summary: audioAnalysis.summary,
          ai_tags: audioAnalysis.keywords
        });

        await base44.asServiceRole.entities.Client.update(client_id, {
          engagement_score: audioAnalysis.engagement_score,
          real_objections: audioAnalysis.objections_found,
          last_contact_date: new Date().toISOString().split('T')[0]
        });
      }

      return Response.json({ analysis: audioAnalysis, success: true });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
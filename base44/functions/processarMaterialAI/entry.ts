import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ success: false, error: 'Não autorizado' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file');
    const client_id = formData.get('client_id');

    if (!file || !client_id) {
      return Response.json({ 
        success: false, 
        error: 'Arquivo e ID do cliente são obrigatórios' 
      }, { status: 400 });
    }

    // 1. Upload do arquivo
    console.log('Fazendo upload do arquivo...');
    const uploadResult = await base44.integrations.Core.UploadFile({ file });
    const file_url = uploadResult.file_url;

    // 2. Buscar informações do cliente
    const client = await base44.entities.Client.get(client_id);
    if (!client) {
      return Response.json({ 
        success: false, 
        error: 'Cliente não encontrado' 
      }, { status: 404 });
    }

    // 3. Extração rápida: imagens seguem direto para análise visual para evitar timeout 503
    console.log('Preparando análise rápida do material...');
    let extractedData = null;
    const shouldExtractText = !file.type?.includes('image');

    if (shouldExtractText) {
      try {
        const extractResult = await base44.integrations.Core.ExtractDataFromUploadedFile({
          file_url: file_url,
          json_schema: {
            type: "object",
            properties: {
              content: { type: "string", description: "Conteúdo textual extraído" },
              key_points: { 
                type: "array", 
                items: { type: "string" },
                description: "Pontos-chave identificados"
              },
              product_mentions: {
                type: "array",
                items: { type: "string" },
                description: "Menções a produtos ou equipamentos"
              }
            }
          }
        });

        if (extractResult.status === 'success' && extractResult.output) {
          extractedData = extractResult.output;
        }
      } catch (error) {
        console.log('Extração textual indisponível, seguindo com análise visual rápida...');
      }
    }

    // 4. Análise com IA rápida (usando file_url diretamente para imagens)
    console.log('Analisando material com IA rápida...');
    const aiPrompt = `
Você é um especialista em vendas consultivas para o mercado veterinário brasileiro.

MATERIAL RECEBIDO: ${file.name}
${extractedData ? `CONTEÚDO EXTRAÍDO: ${JSON.stringify(extractedData)}` : ''}

PERFIL DO CLIENTE:
- Nome: ${client.full_name || client.first_name}
- Clínica: ${client.clinic_name || 'N/A'}
- Tipo: ${client.client_type || 'N/A'}
- Equipamento Atual: ${client.current_equipment || 'Nenhum'}
- Status: ${client.status || 'morno'}
- Dores Principais: ${client.main_pains?.join(', ') || 'Não identificadas'}
- Motivadores de Compra: ${client.purchase_motivators?.join(', ') || 'Não identificados'}

TAREFA:
1. Analise o material enviado (catálogo, imagem, documento)
2. Identifique como este material se relaciona com o perfil e necessidades do cliente
3. Avalie o potencial de interesse do cliente (0-100%)
4. Gere uma mensagem personalizada para envio via WhatsApp que:
   - Seja breve e objetiva (máximo 3 parágrafos)
   - Mencione especificamente o material anexado
   - Faça conexão com as necessidades do cliente
   - Inclua um call-to-action claro
   - Use tom consultivo e profissional

FORMATO DE RESPOSTA (JSON):
{
  "interest_score": 85,
  "analysis": "Análise breve do material e fit com o cliente",
  "whatsapp_message": "Mensagem completa para envio",
  "key_highlights": ["Ponto 1", "Ponto 2", "Ponto 3"],
  "recommended_action": "Próxima ação sugerida"
}
`;

    let aiAnalysis;
    try {
      aiAnalysis = await base44.integrations.Core.InvokeLLM({
        prompt: aiPrompt,
        file_urls: [file_url],
        model: 'gemini_3_flash',
        response_json_schema: {
          type: "object",
          properties: {
            interest_score: { type: "number" },
            analysis: { type: "string" },
            whatsapp_message: { type: "string" },
            key_highlights: { 
              type: "array",
              items: { type: "string" }
            },
            recommended_action: { type: "string" }
          }
        }
      });
    } catch (aiError) {
      console.error('IA rápida indisponível:', aiError);
      aiAnalysis = {
        interest_score: 50,
        analysis: 'Material recebido e salvo. A análise completa ficou pendente para revisão manual, evitando perda do registro por instabilidade temporária da IA.',
        whatsapp_message: '',
        key_highlights: ['Material salvo', 'Revisão manual recomendada'],
        recommended_action: 'Revisar o material no CRM antes de enviar mensagem ao cliente.'
      };
    }

    // 5. Preparar mensagem para aprovação manual — nunca enviar WhatsApp automaticamente
    console.log('Preparando mensagem sugerida para aprovação...');
    let whatsappSent = false;

    if (client.phone && aiAnalysis.whatsapp_message) {
      try {
        await base44.entities.PendingMessage.create({
          recipient_id: client_id,
          recipient_name: client.full_name || client.first_name,
          recipient_phone: client.phone,
          channel: 'whatsapp',
          message_content: aiAnalysis.whatsapp_message,
          context: `Material analisado: ${file.name}`,
          ai_reasoning: aiAnalysis.analysis,
          status: 'pending',
          priority: aiAnalysis.interest_score >= 80 ? 'alta' : 'media'
        });
      } catch (whatsappError) {
        console.error('Erro ao salvar mensagem pendente:', whatsappError);
      }
    }

    // 6. Salvar na base de conhecimento
    await base44.entities.AIKnowledgeDocument.create({
      title: file.name,
      document_type: file.type.includes('image') ? 'imagem' : 
                     file.type.includes('pdf') ? 'pdf_generico' : 'outro',
      file_format: file.name.split('.').pop(),
      file_url: file_url,
      file_size_kb: Math.round(file.size / 1024),
      extracted_text: extractedData?.content || '',
      summary: aiAnalysis.analysis,
      key_data: {
        client_id: client_id,
        client_name: client.full_name || client.first_name,
        interest_score: aiAnalysis.interest_score,
        key_highlights: aiAnalysis.key_highlights
      },
      tags: [client.client_type, client.status, 'material_enviado'],
      upload_date: new Date().toISOString(),
      usage_count: 1
    });

    // 7. Registrar interação
    await base44.entities.Interaction.create({
      client_id: client_id,
      client_name: client.full_name || client.first_name,
      type: 'whatsapp',
      direction: 'outbound',
      subject: `Material enviado: ${file.name}`,
      notes: `${aiAnalysis.analysis}\n\nMensagem: ${aiAnalysis.whatsapp_message}`,
      outcome: 'positive',
      ai_summary: aiAnalysis.analysis,
      ai_tags: aiAnalysis.key_highlights
    });

    // 8. Atualizar campo AI do cliente
    await base44.entities.Client.update(client_id, {
      ai_sales_intelligence: {
        ...client.ai_sales_intelligence,
        last_material_sent: {
          date: new Date().toISOString(),
          file_name: file.name,
          file_url: file_url,
          interest_score: aiAnalysis.interest_score,
          analysis: aiAnalysis.analysis
        }
      }
    });

    return Response.json({
      success: true,
      file_url: file_url,
      analysis: aiAnalysis.analysis,
      interest_score: aiAnalysis.interest_score,
      whatsapp_message: aiAnalysis.whatsapp_message,
      message_sent: whatsappSent,
      client_name: client.full_name || client.first_name,
      recommended_action: aiAnalysis.recommended_action,
      key_highlights: aiAnalysis.key_highlights
    });

  } catch (error) {
    console.error('Erro no processamento:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { client_id, competitors = [] } = await req.json();

    // Buscar dados do cliente
    const clients = await base44.entities.Client.list();
    const client = clients.find(c => c.id === client_id);

    if (!client) {
      return Response.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    // Análise de concorrentes com IA
    const analysis = await base44.integrations.Core.InvokeLLM({
      prompt: `Você é um estrategista de vendas especializado em análise competitiva.

CLIENTE ALVO: ${client.first_name} - ${client.clinic_name}
Cidade: ${client.city}
Equipamento atual: ${client.current_equipment || 'Não especificado'}
Equipamento interesse: ${client.equipment_interest || 'VG2'}
Status: ${client.status}

CONCORRENTES DIRETOS:
${competitors.length > 0 ? competitors.map((c, i) => `${i+1}. ${c}`).join('\n') : 'Principais do mercado veterinário'}

TAREFA: Crie análise competitiva completa para apresentação em slides.

Retorne JSON estruturado:
{
  "presentation_title": "Análise Competitiva - [Cliente]",
  "slides": [
    {
      "title": "Título do slide",
      "content": "Conteúdo principal",
      "bullet_points": ["ponto 1", "ponto 2", "ponto 3"],
      "notes": "Notas do apresentador"
    }
  ]
}

ESTRUTURA DA APRESENTAÇÃO:

1. SLIDE: Visão Geral do Mercado
   - Principais players
   - Participação de mercado
   - Tendências

2. SLIDE: Análise SWOT - Concorrente 1
   - Forças, Fraquezas, Oportunidades, Ameaças

3. SLIDE: Análise SWOT - Concorrente 2

4. SLIDE: Matriz Competitiva
   - Preço vs Qualidade
   - Posicionamento

5. SLIDE: Nossa Vantagem Competitiva
   - Diferenciais únicos
   - Proposta de valor
   - Por que somos a melhor escolha

6. SLIDE: Estratégia de Posicionamento
   - Como nos diferenciar
   - Mensagens-chave
   - Argumentos contra concorrentes

7. SLIDE: Plano de Ação
   - Próximos passos
   - Timeline
   - Métricas de sucesso`,
      response_json_schema: {
        type: "object",
        properties: {
          presentation_title: { type: "string" },
          slides: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                content: { type: "string" },
                bullet_points: { type: "array", items: { type: "string" } },
                notes: { type: "string" }
              }
            }
          }
        }
      }
    });

    // Criar apresentação no Google Slides
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('googleslides');

    // Criar nova apresentação
    const createResponse = await fetch('https://slides.googleapis.com/v1/presentations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: analysis.presentation_title
      })
    });

    const presentation = await createResponse.json();
    const presentationId = presentation.presentationId;

    // Adicionar slides
    const requests = [];
    
    // Criar slides
    analysis.slides.forEach((slide, index) => {
      if (index > 0) { // Pula o primeiro pois já existe um slide
        requests.push({
          createSlide: {
            insertionIndex: index,
            slideLayoutReference: {
              predefinedLayout: 'TITLE_AND_BODY'
            }
          }
        });
      }
    });

    // Executar criação de slides
    if (requests.length > 0) {
      await fetch(`https://slides.googleapis.com/v1/presentations/${presentationId}:batchUpdate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ requests })
      });
    }

    // Buscar IDs dos slides criados
    const updatedPresentation = await fetch(`https://slides.googleapis.com/v1/presentations/${presentationId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    const presentationData = await updatedPresentation.json();

    // Adicionar conteúdo aos slides
    const contentRequests = [];
    
    analysis.slides.forEach((slide, index) => {
      const slideId = presentationData.slides[index].objectId;
      
      // Adicionar título
      contentRequests.push({
        insertText: {
          objectId: presentationData.slides[index].pageElements.find(e => e.shape?.shapeType === 'TEXT_BOX')?.objectId,
          text: slide.title,
          insertionIndex: 0
        }
      });

      // Adicionar conteúdo
      const bodyElement = presentationData.slides[index].pageElements.find(e => 
        e.shape?.placeholder?.type === 'BODY'
      );
      
      if (bodyElement) {
        const textContent = slide.content + '\n\n' + slide.bullet_points.map(bp => `• ${bp}`).join('\n');
        contentRequests.push({
          insertText: {
            objectId: bodyElement.objectId,
            text: textContent,
            insertionIndex: 0
          }
        });
      }
    });

    // Aplicar conteúdo
    if (contentRequests.length > 0) {
      await fetch(`https://slides.googleapis.com/v1/presentations/${presentationId}:batchUpdate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ requests: contentRequests })
      });
    }

    return Response.json({
      success: true,
      presentation_id: presentationId,
      presentation_url: `https://docs.google.com/presentation/d/${presentationId}/edit`,
      analysis
    });

  } catch (error) {
    console.error('Erro:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { client_id, products = [], custom_notes = '' } = await req.json();

    if (!client_id) {
      return Response.json({ error: 'client_id obrigatório' }, { status: 400 });
    }

    // Buscar dados em paralelo
    const [clients, allEquipments] = await Promise.all([
      base44.asServiceRole.entities.Client.filter({}),
      base44.asServiceRole.entities.Equipment.filter({ is_active: true }).catch(() => []),
    ]);

    const client = clients.find(c => c.id === client_id);
    if (!client) return Response.json({ error: 'Cliente não encontrado' }, { status: 404 });

    // Montar contexto para IA gerar conteúdo dos slides
    const clientContext = `
Cliente: ${client.first_name || ''} ${client.full_name || ''}
Clínica: ${client.clinic_name || 'N/A'}
Cidade: ${client.city || 'N/A'}
Tipo: ${client.client_type || 'N/A'}
Volume mensal: ${client.current_volume || 'N/A'}
Equipamento atual: ${client.current_equipment || 'Nenhum'}
Dores principais: ${client.main_pains?.join(', ') || 'N/A'}
Necessidades lab: ${client.lab_needs?.join(', ') || 'N/A'}
Orçamento: ${client.available_budget ? 'R$ ' + client.available_budget.toLocaleString('pt-BR') : 'A definir'}
Score compra: ${client.purchase_score || 0}%
Perfil comportamental: ${client.behavioral_profile || 'N/A'}
    `.trim();

    const productsInfo = products.length > 0 
      ? products.map(p => `- ${p.name || p}: R$ ${p.price || 'sob consulta'}`).join('\n')
      : allEquipments.slice(0, 3).map(e => `- ${e.name}: R$ ${e.price?.toLocaleString('pt-BR') || 'sob consulta'}`).join('\n');

    // IA gera conteúdo estruturado para cada slide
    const slideContent = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Você é especialista em vendas consultivas de equipamentos veterinários Seamaty.
Gere conteúdo PROFISSIONAL e PERSUASIVO para uma apresentação de proposta comercial no Google Slides.

DADOS DO CLIENTE:
${clientContext}

PRODUTOS PROPOSTOS:
${productsInfo}

NOTAS ADICIONAIS: ${custom_notes || 'Nenhuma'}

Gere conteúdo para 8 slides neste formato JSON exato:
{
  "title": "Título geral da apresentação",
  "subtitle": "Subtítulo (ex: Proposta Comercial Seamaty - [Nome Clínica])",
  "date": "${new Date().toLocaleDateString('pt-BR')}",
  "slides": [
    {
      "slide_number": 1,
      "title": "Capa",
      "heading": "PROPOSTA COMERCIAL SEAMATY",
      "body": "Para: [Nome Clínica]\nData: [data]\nVendedor: Nathan",
      "notes": "Notas do apresentador para este slide"
    },
    {
      "slide_number": 2,
      "title": "Sobre a Seamaty",
      "heading": "Quem Somos",
      "body": "bullets sobre a Seamaty, expertise veterinária, diferenciais",
      "notes": "notas"
    },
    {
      "slide_number": 3,
      "title": "Diagnóstico do Cliente",
      "heading": "Entendemos Sua Realidade",
      "body": "personalizado com as dores e necessidades específicas do cliente",
      "notes": "notas"
    },
    {
      "slide_number": 4,
      "title": "Solução Proposta",
      "heading": "Nossa Solução Para Você",
      "body": "produtos recomendados com benefícios específicos para este cliente",
      "notes": "notas"
    },
    {
      "slide_number": 5,
      "title": "Especificações Técnicas",
      "heading": "Tecnologia de Ponta",
      "body": "specs técnicas dos produtos propostos",
      "notes": "notas"
    },
    {
      "slide_number": 6,
      "title": "ROI e Benefícios",
      "heading": "Retorno do Investimento",
      "body": "cálculo de ROI, economia mensal, payback estimado baseado no volume do cliente",
      "notes": "notas"
    },
    {
      "slide_number": 7,
      "title": "Investimento",
      "heading": "Condições Especiais",
      "body": "valores, condições de pagamento, bonificações",
      "notes": "notas"
    },
    {
      "slide_number": 8,
      "title": "Próximos Passos",
      "heading": "Vamos Começar?",
      "body": "próximas etapas claras, CTA, contatos",
      "notes": "notas"
    }
  ]
}
Retorne APENAS o JSON, sem markdown ou explicações.`,
      response_json_schema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          subtitle: { type: 'string' },
          date: { type: 'string' },
          slides: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                slide_number: { type: 'number' },
                title: { type: 'string' },
                heading: { type: 'string' },
                body: { type: 'string' },
                notes: { type: 'string' }
              }
            }
          }
        }
      }
    });

    // Obter token do Google Slides
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('googleslides');

    // 1. Criar apresentação no Google Slides
    const createResp = await fetch('https://slides.googleapis.com/v1/presentations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: slideContent.subtitle || `Proposta Seamaty - ${client.clinic_name || client.first_name}`,
      }),
    });

    if (!createResp.ok) {
      const err = await createResp.text();
      throw new Error(`Erro ao criar apresentação: ${err}`);
    }

    const presentation = await createResp.json();
    const presentationId = presentation.presentationId;
    const existingSlideId = presentation.slides[0]?.objectId;

    // 2. Montar requests de batchUpdate para criar slides e conteúdo
    const requests = [];

    // Slide 1 já existe, configurar capa
    const firstSlide = slideContent.slides[0];
    if (existingSlideId) {
      requests.push({
        deleteText: {
          objectId: presentation.slides[0]?.pageElements?.[0]?.objectId,
          textRange: { type: 'ALL' }
        }
      });
    }

    // Criar slides 2-8
    const slideIds = [existingSlideId];
    for (let i = 1; i < slideContent.slides.length; i++) {
      const newSlideId = `slide_${i + 1}_${Date.now()}`;
      slideIds.push(newSlideId);
      requests.push({
        createSlide: {
          objectId: newSlideId,
          insertionIndex: i,
          slideLayoutReference: { predefinedLayout: 'TITLE_AND_BODY' },
        }
      });
    }

    // Aplicar batchUpdate para criar estrutura dos slides
    if (requests.length > 0) {
      await fetch(`https://slides.googleapis.com/v1/presentations/${presentationId}:batchUpdate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requests }),
      });
    }

    // 3. Buscar apresentação atualizada com IDs dos elementos
    const getResp = await fetch(`https://slides.googleapis.com/v1/presentations/${presentationId}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });
    const updatedPresentation = await getResp.json();

    // 4. Inserir conteúdo em cada slide
    const contentRequests = [];

    updatedPresentation.slides.forEach((slide, idx) => {
      const slideData = slideContent.slides[idx];
      if (!slideData) return;

      // Cores por tipo de slide
      const bgColor = idx === 0 ? { red: 0.094, green: 0.267, blue: 0.71 } // azul escuro capa
        : idx === slideContent.slides.length - 1 ? { red: 0.094, green: 0.267, blue: 0.71 }
        : { red: 1, green: 1, blue: 1 };

      contentRequests.push({
        updatePageProperties: {
          objectId: slide.objectId,
          pageProperties: {
            pageBackgroundFill: {
              solidFill: { color: { rgbColor: bgColor } }
            }
          },
          fields: 'pageBackgroundFill'
        }
      });

      slide.pageElements?.forEach((el) => {
        if (el.shape?.placeholder?.type === 'CENTERED_TITLE' || el.shape?.placeholder?.type === 'TITLE') {
          contentRequests.push({
            insertText: {
              objectId: el.objectId,
              text: slideData.heading || slideData.title,
              insertionIndex: 0
            }
          });
          contentRequests.push({
            updateTextStyle: {
              objectId: el.objectId,
              style: {
                fontSize: { magnitude: idx === 0 ? 36 : 28, unit: 'PT' },
                bold: true,
                foregroundColor: {
                  opaqueColor: { rgbColor: idx === 0 ? { red: 1, green: 1, blue: 1 } : { red: 0.094, green: 0.267, blue: 0.71 } }
                }
              },
              fields: 'fontSize,bold,foregroundColor',
              textRange: { type: 'ALL' }
            }
          });
        } else if (el.shape?.placeholder?.type === 'BODY' || el.shape?.placeholder?.type === 'SUBTITLE') {
          const bodyText = slideData.body || '';
          contentRequests.push({
            insertText: {
              objectId: el.objectId,
              text: bodyText,
              insertionIndex: 0
            }
          });
          contentRequests.push({
            updateTextStyle: {
              objectId: el.objectId,
              style: {
                fontSize: { magnitude: 16, unit: 'PT' },
                foregroundColor: {
                  opaqueColor: { rgbColor: idx === 0 ? { red: 0.9, green: 0.9, blue: 0.9 } : { red: 0.2, green: 0.2, blue: 0.2 } }
                }
              },
              fields: 'fontSize,foregroundColor',
              textRange: { type: 'ALL' }
            }
          });
        }
      });

      // Notas do apresentador
      if (slideData.notes && slide.slideProperties?.notesPage) {
        const notesEl = slide.slideProperties.notesPage.pageElements?.find(
          el => el.shape?.placeholder?.type === 'BODY'
        );
        if (notesEl) {
          contentRequests.push({
            insertText: {
              objectId: notesEl.objectId,
              text: slideData.notes,
              insertionIndex: 0
            }
          });
        }
      }
    });

    // Aplicar conteúdo
    if (contentRequests.length > 0) {
      await fetch(`https://slides.googleapis.com/v1/presentations/${presentationId}:batchUpdate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requests: contentRequests }),
      });
    }

    const slidesUrl = `https://docs.google.com/presentation/d/${presentationId}/edit`;

    // Salvar no CRM
    await base44.asServiceRole.entities.ClientDocument.create({
      client_id: client.id,
      client_name: client.first_name,
      title: `Proposta Google Slides - ${new Date().toLocaleDateString('pt-BR')}`,
      type: 'apresentacao',
      file_url: slidesUrl,
      notes: `Apresentação gerada automaticamente por IA. ${products.length} produto(s).`,
    }).catch(() => null);

    return Response.json({
      success: true,
      presentation_id: presentationId,
      slides_url: slidesUrl,
      slides_count: slideContent.slides.length,
      client_name: client.first_name,
      clinic_name: client.clinic_name,
      message: `✅ Apresentação criada com ${slideContent.slides.length} slides!`
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
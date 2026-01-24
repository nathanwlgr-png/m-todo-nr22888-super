import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { client_id, strategy_type = 'complete' } = await req.json();

    // Buscar dados
    const clients = await base44.entities.Client.list();
    const client = clients.find(c => c.id === client_id);

    if (!client) {
      return Response.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    const interactions = await base44.entities.Interaction.filter({ client_id });
    const visits = await base44.entities.Visit.filter({ client_id });
    const tasks = await base44.entities.Task.filter({ client_id });

    // Gerar estratégia com IA
    const strategy = await base44.integrations.Core.InvokeLLM({
      prompt: `Você é um consultor de vendas estratégico.

CLIENTE: ${client.first_name} - ${client.clinic_name}
Perfil: ${client.behavioral_profile}
Estilo Decisão: ${client.decision_style}
Tom: ${client.client_tone}
Status: ${client.status} | Score: ${client.purchase_score}%
Pipeline: ${client.pipeline_stage}

HISTÓRICO:
- Interações: ${interactions.length}
- Visitas: ${visits.length}
- Tarefas: ${tasks.length}

Dores identificadas:
${client.main_pains?.join(', ') || 'Não identificadas'}

Objeções:
${client.real_objections?.join(', ') || 'Não identificadas'}

TAREFA: Crie documentação completa de estratégia de vendas.

Retorne JSON:
{
  "strategy_title": "Estratégia [Cliente]",
  "executive_summary": "resumo executivo (2-3 parágrafos)",
  "sections": [
    {
      "title": "Título da seção",
      "content": "conteúdo detalhado",
      "action_items": ["ação 1", "ação 2"]
    }
  ]
}

SEÇÕES OBRIGATÓRIAS:

1. Perfil do Cliente
   - Análise comportamental
   - Padrão de decisão
   - Motivadores de compra

2. Análise de Necessidades
   - Dores identificadas
   - Impacto no negócio
   - Urgência

3. Estratégia de Abordagem
   - Tom e linguagem ideais
   - Gatilhos mentais a usar
   - Técnicas de persuasão

4. Controle de Objeções
   - Objeções esperadas
   - Argumentos de rebate
   - Provas e evidências

5. Plano de Fechamento
   - Sinais de compra
   - Técnicas de fechamento
   - Condições ideais

6. Timeline e Marcos
   - Próximos passos
   - Datas-chave
   - KPIs de sucesso`,
      response_json_schema: {
        type: "object",
        properties: {
          strategy_title: { type: "string" },
          executive_summary: { type: "string" },
          sections: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                content: { type: "string" },
                action_items: { type: "array", items: { type: "string" } }
              }
            }
          }
        }
      }
    });

    // Criar página no Notion
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('notion');

    // Buscar databases disponíveis
    const searchResponse = await fetch('https://api.notion.com/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filter: { property: 'object', value: 'database' },
        page_size: 10
      })
    });

    const searchData = await searchResponse.json();
    let parentId = null;

    // Usar primeiro database encontrado ou criar como página raiz
    if (searchData.results && searchData.results.length > 0) {
      parentId = searchData.results[0].id;
    }

    // Construir conteúdo da página
    const pageContent = {
      parent: parentId ? { database_id: parentId } : { type: 'page_id', page_id: 'root' },
      properties: {
        title: {
          title: [{ text: { content: strategy.strategy_title } }]
        }
      },
      children: [
        {
          object: 'block',
          type: 'heading_1',
          heading_1: {
            rich_text: [{ text: { content: 'Resumo Executivo' } }]
          }
        },
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [{ text: { content: strategy.executive_summary } }]
          }
        },
        {
          object: 'block',
          type: 'divider',
          divider: {}
        }
      ]
    };

    // Adicionar seções
    strategy.sections.forEach(section => {
      pageContent.children.push({
        object: 'block',
        type: 'heading_2',
        heading_2: {
          rich_text: [{ text: { content: section.title } }]
        }
      });

      pageContent.children.push({
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [{ text: { content: section.content } }]
        }
      });

      if (section.action_items && section.action_items.length > 0) {
        pageContent.children.push({
          object: 'block',
          type: 'heading_3',
          heading_3: {
            rich_text: [{ text: { content: 'Ações' } }]
          }
        });

        section.action_items.forEach(action => {
          pageContent.children.push({
            object: 'block',
            type: 'to_do',
            to_do: {
              rich_text: [{ text: { content: action } }],
              checked: false
            }
          });
        });
      }

      pageContent.children.push({
        object: 'block',
        type: 'divider',
        divider: {}
      });
    });

    // Criar página sem parent database (como página raiz)
    const createPageResponse = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        parent: { type: 'page_id', page_id: searchData.results?.[0]?.id || 'workspace' },
        properties: {
          title: {
            title: [{ text: { content: strategy.strategy_title } }]
          }
        }
      })
    });

    let notionPage = await createPageResponse.json();
    
    // Se falhou, tentar criar sem parent
    if (notionPage.status === 400 || notionPage.status === 404) {
      const fallbackResponse = await fetch('https://api.notion.com/v1/pages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(pageContent)
      });
      notionPage = await fallbackResponse.json();
    }

    if (!notionPage.id) {
      throw new Error('Falha ao criar página no Notion: ' + JSON.stringify(notionPage));
    }

    // Adicionar conteúdo em blocos (limitado a 100 blocos por request)
    const blocksToAdd = pageContent.children.slice(0, 100);
    
    await fetch(`https://api.notion.com/v1/blocks/${notionPage.id}/children`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        children: blocksToAdd
      })
    });

    return Response.json({
      success: true,
      notion_page_id: notionPage.id,
      notion_url: notionPage.url,
      strategy
    });

  } catch (error) {
    console.error('Erro:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
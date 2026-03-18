import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { client_id } = await req.json();

    if (!client_id) {
      return Response.json({ error: 'client_id é obrigatório' }, { status: 400 });
    }

    // Buscar dados do cliente
    const client = await base44.entities.Client.get(client_id);

    if (!client) {
      return Response.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    // Buscar materiais da base de conhecimento baseados no perfil numerológico
    const numerologyNumber = client.numerology_number || client.life_path_number;
    let knowledgeMaterials = [];

    if (numerologyNumber) {
      knowledgeMaterials = await base44.asServiceRole.entities.KnowledgeBase.filter({
        numerology_numbers: numerologyNumber
      });
    }

    // Se não encontrou materiais específicos, busca gerais
    if (!knowledgeMaterials || knowledgeMaterials.length === 0) {
      knowledgeMaterials = await base44.asServiceRole.entities.KnowledgeBase.list('-created_date', 20);
    }

    // Montar prompt para IA
    const prompt = `Você é um especialista em vendas consultivas e técnicas de persuasão.

DADOS DO CLIENTE:
- Nome: ${client.full_name || 'Não informado'}
- Clínica: ${client.clinic_name || 'Não informada'}
- Cidade: ${client.city || 'Não informada'}
- Tipo: ${client.client_type || 'Não definido'}
- Equipamento Atual: ${client.current_equipment || 'Não informado'}
- Volume Mensal: ${client.current_volume || 'Não informado'}
- Número Numerológico: ${numerologyNumber || 'Não calculado'}
- Perfil Comportamental: ${client.behavioral_profile || 'Não definido'}
- Estilo de Decisão: ${client.decision_style || 'Não definido'}
- Status: ${client.status || 'Não definido'}
- Score de Compra: ${client.purchase_score || 'Não calculado'}
- Dores Principais: ${client.main_pains?.join(', ') || 'Não identificadas'}
- Objeções: ${client.real_objections?.join(', ') || 'Não identificadas'}

MATERIAIS DA BASE DE CONHECIMENTO:
${knowledgeMaterials.map(m => `
- ${m.title}
  Categoria: ${m.category}
  Técnica: ${m.sales_technique || 'N/A'}
  Resumo: ${m.summary}
  Dicas: ${m.approach_tips || 'N/A'}
`).join('\n')}

TAREFA:
Crie um PLANO DE ABORDAGEM ESTRATÉGICO completo para este cliente, incluindo:

1. ANÁLISE DO PERFIL
   - Interpretação do perfil numerológico e comportamental
   - Pontos fortes e fracos na negociação

2. TÉCNICA DE VENDAS IDEAL
   - Qual técnica usar (baseada nos materiais da base de conhecimento)
   - Por que essa técnica é ideal para este perfil

3. GATILHOS MENTAIS RECOMENDADOS
   - Quais gatilhos de Cialdini aplicar
   - Como aplicar cada um

4. ROTEIRO DE ABORDAGEM
   - Abertura (primeiros 2 minutos)
   - Investigação (perguntas SPIN ou similar)
   - Apresentação (foco nos benefícios para o perfil)
   - Fechamento (técnicas específicas)

5. SCRIPTS PRONTOS
   - 3 frases de abertura
   - 5 perguntas investigativas
   - 3 frases de fechamento

6. TRATAMENTO DE OBJEÇÕES
   - Possíveis objeções deste perfil
   - Como rebater cada uma

7. PRÓXIMOS PASSOS
   - Ações imediatas
   - Sequência de follow-up

8. MELHORES DIAS PARA FECHAR
   - Baseado em numerologia (se disponível)

Seja PRÁTICO, DIRETO e ACIONÁVEL. Use os materiais da base de conhecimento como referência.`;

    // Chamar IA
    const aiResponse = await base44.integrations.Core.InvokeLLM({
      prompt: prompt,
      add_context_from_internet: false
    });

    // Retornar plano
    return Response.json({
      success: true,
      client_id: client_id,
      client_name: client.full_name || client.clinic_name,
      plan: aiResponse,
      materials_used: knowledgeMaterials.length,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro ao gerar plano:', error);
    return Response.json({ 
      error: error.message,
      details: 'Erro ao gerar plano de abordagem'
    }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Validação de API key
    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) {
      return Response.json({
        error: 'IA temporariamente indisponível',
        message: 'Configure OPENAI_API_KEY nos secrets',
      }, { status: 503 });
    }

    const payload = await req.json();
    let { 
      client_id, 
      client_name, 
      city, 
      last_interaction,
      current_equipment,
      pipeline_stage,
      main_pains = []
    } = payload;

    // Se só veio client_id, busca dados do cliente no banco
    if (client_id && !client_name) {
      try {
        const c = await base44.entities.Client.get(client_id);
        if (c) {
          client_name = c.clinic_name || c.full_name || c.first_name || client_name;
          city = city || c.city;
          last_interaction = last_interaction || c.last_contact_date;
          current_equipment = current_equipment || c.current_equipment;
          pipeline_stage = pipeline_stage || c.pipeline_stage;
          main_pains = (main_pains && main_pains.length) ? main_pains : (c.main_pains || []);
        }
      } catch (_e) {}
    }

    const vendedorNome = user.full_name || user.email || 'Seu consultor Seamaty';

    // Calcula dias desde última interação
    const daysLastContact = last_interaction 
      ? Math.floor((Date.now() - new Date(last_interaction)) / 86400000)
      : 365;

    const recentContact = daysLastContact < 7;
    const coldProspect = daysLastContact > 90;

    // Chamada ao OpenAI para gerar mensagens SPIN (usando mini para economizar)
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Modelo econômico
        max_tokens: 300, // Limita resposta
        messages: [
          {
            role: 'system',
            content: `Você é um especialista em vendas SPIN Selling para equipamentos veterinários. 
            Gere 3 mensagens WhatsApp PERSONALIZADAS baseadas no perfil do cliente.
            
            Cada mensagem deve:
            1. Ter max 240 caracteres (limite WhatsApp)
            2. Usar técnica SPIN (Situation → Problem → Implication → Need Payoff)
            3. Ser personalizada com nome, cidade e contexto
            4. Incluir uma pergunta aberta que desperte interesse
            5. Ser natural e humana, não parecer template
            6. ASSINAR a mensagem com o nome real do vendedor: "${vendedorNome}". NUNCA use "[Seu Nome]" ou placeholders.
            
            Retorne APENAS um JSON válido com array "messages" contendo 3 objetos com:
            - text: a mensagem
            - spin_analysis: { situation, problem, implication, need_payoff }
            
            Nenhum texto fora do JSON.`
          },
          {
            role: 'user',
            content: `Cliente: ${client_name}
Cidade: ${city}
Equipamento atual: ${current_equipment || 'Não informado'}
Estágio: ${pipeline_stage || 'Lead'}
Último contato: ${daysLastContact} dias atrás
Dores principais: ${main_pains.join(', ') || 'Não mapeadas'}
Contexto: ${recentContact ? 'Contato recente' : coldProspect ? 'Prospecto frio' : 'Perspectiva ativa'}

Gere 3 mensagens SPIN diferentes, cada uma explorando um ângulo diferente de venda.`
          }
        ],
        temperature: 0.8,
        max_tokens: 1200,
      })
    });

    if (!response.ok) {
      const err = await response.json();
      const errorMsg = err.error?.message || 'Erro ao chamar OpenAI';
      
      // Detecta se é problema de saldo
      if (errorMsg.includes('insufficient_quota') || errorMsg.includes('rate_limit')) {
        return Response.json({
          error: 'IA temporariamente indisponível',
          hint: 'Sem créditos ou rate limit atingido',
          code: 'API_QUOTA_EXCEEDED',
        }, { status: 429 });
      }
      
      return Response.json({ error: `OpenAI: ${errorMsg}` }, { status: 400 });
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    // Parse JSON da resposta
    let messages = [];
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        messages = parsed.messages || [];
      }
    } catch {
      // Fallback: cria mensagens básicas se parse falhar
      messages = [
        {
          text: `Oi ${client_name.split(' ')[0]}! Tudo bem? Vendo que você está em ${city}... você tem enfrentado desafios com a qualidade dos exames de sangue na sua clínica?`,
          spin_analysis: {
            situation: `Cliente em ${city}`,
            problem: 'Qualidade de exames',
            implication: 'Pode afetar diagnóstico',
            need_payoff: 'Melhorar precisão'
          }
        },
        {
          text: `${client_name.split(' ')[0]}, passando para avisar que temos uma promoção especial para clínicas em ${city}. Você teria 10 minutos para conversar sobre automação de exames?`,
          spin_analysis: {
            situation: `Promoção em ${city}`,
            problem: 'Falta de automação',
            implication: 'Maior custo operacional',
            need_payoff: 'Reduzir custos'
          }
        },
        {
          text: `Oi ${client_name.split(' ')[0]}! Vimos que sua clínica usa ${current_equipment || 'equipamentos'} atualmente. Como está o tempo de resposta dos seus resultados?`,
          spin_analysis: {
            situation: `Equipamento: ${current_equipment}`,
            problem: 'Tempo de resposta',
            implication: 'Cliente espera mais',
            need_payoff: 'Agilidade'
          }
        }
      ];
    }

    // Log de auditoria
    await base44.asServiceRole.entities.AIInteractionLog?.create({
      user_message: `SPIN Selling para ${client_name}`,
      ai_response: JSON.stringify(messages),
      action_type: 'spin_selling_messages',
      client_id: client_id,
      client_name: client_name,
      source: 'spin_whatsapp_generator',
      success: true,
    }).catch(() => null);

    return Response.json({ messages });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
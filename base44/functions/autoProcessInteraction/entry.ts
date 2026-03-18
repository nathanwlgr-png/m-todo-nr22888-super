import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { client_id, interaction_text, source, interaction_id } = await req.json();

    // Buscar dados do cliente
    const client = await base44.asServiceRole.entities.Client.get(client_id);

    // Análise IA do conteúdo
    const analysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Analise esta interação/email com cliente e extraia informações para automação:

**CLIENTE:** ${client.first_name}
**FONTE:** ${source}
**CONTEÚDO:**
${interaction_text}

**TAREFA:**
Analise e identifique:
1. Menções de datas de follow-up (hoje, amanhã, segunda, dia X, etc)
2. Compromissos ou ações acordadas
3. Tarefas pendentes mencionadas
4. Urgência/prioridade da situação
5. Outcome da interação (positivo, neutro, negativo)
6. Próximas ações necessárias

Para cada ação identificada, forneça:
- Título claro e curto
- Descrição do que fazer
- Tipo (follow_up, ligacao, email, visita)
- Prioridade (baixa, media, alta)
- Prazo em dias a partir de hoje
- Se deve criar tarefa automática (true/false)`,
      response_json_schema: {
        type: "object",
        properties: {
          interaction_outcome: {
            type: "string",
            enum: ["positive", "neutral", "negative", "no_answer"]
          },
          sentiment: {
            type: "string",
            enum: ["positivo", "neutro", "negativo"]
          },
          urgency_level: {
            type: "string",
            enum: ["baixa", "media", "alta"]
          },
          follow_up_needed: { type: "boolean" },
          suggested_tasks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                type: { type: "string" },
                priority: { type: "string" },
                due_days: { type: "number" },
                should_create: { type: "boolean" },
                reason: { type: "string" }
              }
            }
          },
          key_points: {
            type: "array",
            items: { type: "string" }
          },
          next_action_recommended: { type: "string" }
        }
      }
    });

    // Criar tarefas automáticas
    const tasksCreated = [];
    if (analysis.suggested_tasks?.length > 0) {
      for (const task of analysis.suggested_tasks) {
        if (task.should_create) {
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + task.due_days);

          const newTask = await base44.asServiceRole.entities.Task.create({
            client_id,
            client_name: client.first_name,
            title: task.title,
            description: task.description,
            type: task.type,
            priority: task.priority,
            due_date: dueDate.toISOString().split('T')[0],
            status: 'pendente',
            auto_created: true
          });
          tasksCreated.push(newTask);
        }
      }
    }

    // Atualizar interação com análise (se ID fornecido)
    if (interaction_id) {
      await base44.asServiceRole.entities.Interaction.update(interaction_id, {
        outcome: analysis.interaction_outcome,
        ai_sentiment: analysis.sentiment,
        ai_priority: analysis.urgency_level
      });
    }

    // Log de follow-up
    if (analysis.follow_up_needed) {
      await base44.asServiceRole.entities.FollowUpLog.create({
        client_id,
        client_name: client.first_name,
        channel: source,
        status: 'sent',
        ai_generated: true,
        notes: `Auto-gerado: ${analysis.next_action_recommended}`
      });
    }

    return Response.json({
      success: true,
      analysis,
      tasks_created: tasksCreated.length,
      automation_applied: {
        tasks: tasksCreated.map(t => ({ id: t.id, title: t.title })),
        sentiment: analysis.sentiment,
        outcome: analysis.interaction_outcome,
        next_action: analysis.next_action_recommended
      }
    });

  } catch (error) {
    console.error('Erro:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});
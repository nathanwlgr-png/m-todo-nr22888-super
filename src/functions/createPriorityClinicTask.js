import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// deno-lint-ignore no-undef
// eslint-disable-next-line no-undef
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await req.json();
    const { event, data } = payload;

    // Validar que é uma atualização de prioridade
    if (event.type !== 'update' || !data?.prioridade) {
      return Response.json({ skipped: true }, { status: 200 });
    }

    // Só criar tarefa se marcar como "a_quente" ou "prioridade_maxima"
    const priorityValues = ['a_quente', 'prioridade_maxima'];
    if (!priorityValues.includes(data.prioridade)) {
      return Response.json({ skipped: true }, { status: 200 });
    }

    // Criar tarefa
    const nomeClinica = data.nome_clinica || data.clinic_name || 'Clínica sem nome';
    const cidade = data.cidade || data.city || '';

    const task = await base44.asServiceRole.entities.Task.create({
      client_id: data.client_id || event.entity_id,
      client_name: nomeClinica,
      title: `[Mapa] Acompanhar ${nomeClinica}`,
      description: `Clínica marcada como prioridade no Mapa Seamaty. Localização: ${cidade}. Prioridade: ${data.prioridade}.`,
      due_date: new Date().toISOString().split('T')[0],
      status: 'pendente',
      priority: 'alta',
      type: 'follow_up',
      assigned_to: 'nathan@seamaty.com',
      assigned_to_name: 'Nathan',
      auto_created: true,
    });

    return Response.json({
      success: true,
      task_id: task.id,
      clinic: nomeClinica,
      priority: data.prioridade,
    });
  } catch (error) {
    console.error('Erro ao criar tarefa de prioridade:', error);
    return Response.json({
      error: error.message,
    }, { status: 500 });
  }
});
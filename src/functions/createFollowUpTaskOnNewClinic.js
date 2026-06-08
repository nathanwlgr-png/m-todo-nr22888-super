import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// deno-lint-ignore no-undef
// deno-lint-ignore no-undef
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Criar tarefa de acompanhamento
    const taskData = {
      client_id: data.client_id || '',
      client_name: data.nome_clinica || 'Nova Clínica',
      title: `[Acompanhamento] ${data.nome_clinica || 'Nova Clínica'} - Cadastrada no Mapa Territorial`,
      description: `Clínica adicionada ao mapa territorial do Nathan.\n\nCidade: ${data.cidade || 'N/A'}\nTipo: ${data.tipo || 'N/A'}\nResponsável: ${data.responsavel || 'N/A'}\n\nPróxima ação: Qualificar lead e agendar visita.`,
      due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'pendente',
      priority: 'media',
      type: 'follow_up',
      assigned_to: data.responsavel || user.email,
      auto_created: true,
    };

    await base44.asServiceRole.entities.Task.create(taskData);

    return Response.json({ 
      success: true, 
      message: `Tarefa de acompanhamento criada para ${data.nome_clinica}` 
    });
  } catch (error) {
    console.error('Erro ao criar tarefa:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
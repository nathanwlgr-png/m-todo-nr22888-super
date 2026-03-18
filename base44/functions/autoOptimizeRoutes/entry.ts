import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { city, days = 5 } = await req.json();

    if (!city) {
      return Response.json({ error: 'Cidade obrigatória' }, { status: 400 });
    }

    // Buscar clientes da cidade
    const allClients = await base44.entities.Client.list('-updated_date', 10000);
    const cityClients = allClients.filter(c => 
      c.city?.toLowerCase().includes(city.toLowerCase())
    );

    if (cityClients.length === 0) {
      return Response.json({ error: `Nenhum cliente em ${city}` }, { status: 404 });
    }

    // Priorizar clientes
    const prioritized = cityClients.map(client => {
      let score = 0;
      
      // Status weight
      if (client.status === 'quente') score += 100;
      else if (client.status === 'morno') score += 50;
      
      // Purchase score
      score += (client.purchase_score || 0);
      
      // Sem visita recente = prioridade
      if (!client.last_visit_date) {
        score += 60;
      } else {
        const daysSince = Math.floor((Date.now() - new Date(client.last_visit_date)) / (1000 * 60 * 60 * 24));
        score += Math.min(daysSince / 2, 40);
      }
      
      // AI segment
      if (client.ai_segment === 'VIP') score += 50;
      else if (client.ai_segment === 'Champions') score += 40;
      
      // Engagement
      score += (client.engagement_score || 0) / 5;
      
      return { ...client, priority_score: Math.round(score) };
    }).sort((a, b) => b.priority_score - a.priority_score);

    // Distribuir em dias (5-6 por dia)
    const schedule = [];
    const clientsPerDay = 6;
    
    for (let day = 0; day < days; day++) {
      const date = new Date();
      date.setDate(date.getDate() + day);
      
      const start = day * clientsPerDay;
      const dayClients = prioritized.slice(start, start + clientsPerDay);
      const planB = prioritized.slice(start + clientsPerDay, start + clientsPerDay + 2);
      
      if (dayClients.length > 0) {
        schedule.push({
          day: day + 1,
          date: date.toISOString().split('T')[0],
          clients: dayClients.map(c => ({
            id: c.id,
            name: c.first_name,
            clinic: c.clinic_name,
            address: c.address,
            phone: c.phone,
            status: c.status,
            score: c.purchase_score,
            priority: c.priority_score,
            last_visit: c.last_visit_date
          })),
          plan_b: planB.map(c => ({
            id: c.id,
            name: c.first_name,
            clinic: c.clinic_name,
            phone: c.phone,
            priority: c.priority_score
          }))
        });
      }
    }

    // Criar tarefas automaticamente
    const tasksCreated = [];
    for (const day of schedule) {
      for (const client of day.clients) {
        try {
          const task = await base44.entities.Task.create({
            client_id: client.id,
            client_name: client.name,
            title: `Visita: ${client.name} - ${client.clinic || ''}`,
            description: `Visita programada automaticamente\nEndereço: ${client.address || 'N/A'}\nPrioridade: ${client.priority}`,
            due_date: day.date,
            status: 'pendente',
            priority: client.priority > 150 ? 'alta' : 'media',
            type: 'visita',
            auto_created: true
          });
          tasksCreated.push(task.id);
        } catch (error) {
          console.error('Erro ao criar tarefa:', error);
        }
      }
    }

    return Response.json({
      success: true,
      city,
      total_clients: cityClients.length,
      schedule,
      tasks_created: tasksCreated.length,
      message: `${schedule.length} dias programados, ${tasksCreated.length} tarefas criadas`
    });

  } catch (error) {
    console.error('Erro:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import * as XLSX from 'npm:xlsx@0.18.5';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { city, month_year } = await req.json();

    if (!city) {
      return Response.json({ error: 'Cidade obrigatória' }, { status: 400 });
    }

    // Buscar todos os clientes da cidade
    const allClients = await base44.entities.Client.list('-updated_date', 10000);
    const cityClients = allClients.filter(c => 
      c.city?.toLowerCase().includes(city.toLowerCase())
    );

    if (cityClients.length === 0) {
      return Response.json({ error: `Nenhum cliente encontrado em ${city}` }, { status: 404 });
    }

    // Ordenar por prioridade (score + status + última visita)
    const prioritizedClients = cityClients.map(client => {
      let priorityScore = 0;
      
      // Status
      if (client.status === 'quente') priorityScore += 100;
      else if (client.status === 'morno') priorityScore += 50;
      
      // Purchase score
      priorityScore += (client.purchase_score || 0);
      
      // Última visita (quanto mais antigo, maior prioridade)
      if (client.last_visit_date) {
        const daysSinceVisit = Math.floor((Date.now() - new Date(client.last_visit_date).getTime()) / (1000 * 60 * 60 * 24));
        priorityScore += Math.min(daysSinceVisit / 10, 30);
      } else {
        priorityScore += 50; // Nunca visitado = alta prioridade
      }
      
      // AI segment
      if (client.ai_segment === 'VIP' || client.ai_segment === 'Champions') priorityScore += 40;
      
      return { ...client, priorityScore };
    }).sort((a, b) => b.priorityScore - a.priorityScore);

    // Gerar agenda mensal (5-6 clientes por dia)
    const schedule = [];
    const today = new Date();
    const daysInMonth = 30;
    const clientsPerDay = 5;
    
    let clientIndex = 0;
    
    for (let day = 0; day < daysInMonth; day++) {
      const date = new Date(today);
      date.setDate(date.getDate() + day);
      
      // Pular domingos
      if (date.getDay() === 0) continue;
      
      const dayClients = [];
      const planB = [];
      
      // Clientes principais do dia
      for (let i = 0; i < clientsPerDay && clientIndex < prioritizedClients.length; i++) {
        dayClients.push(prioritizedClients[clientIndex]);
        clientIndex++;
      }
      
      // Plano B (próximos 2 clientes)
      for (let i = 0; i < 2 && clientIndex < prioritizedClients.length; i++) {
        planB.push(prioritizedClients[clientIndex]);
        clientIndex++;
      }
      
      if (dayClients.length > 0) {
        schedule.push({
          date: date.toISOString().split('T')[0],
          day_of_week: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][date.getDay()],
          clients: dayClients,
          plan_b: planB
        });
      }
    }

    // Gerar Excel
    const excelData = [];
    
    schedule.forEach(day => {
      day.clients.forEach((client, idx) => {
        excelData.push({
          'Data': day.date,
          'Dia Semana': day.day_of_week,
          'Ordem': idx + 1,
          'Cliente': client.first_name,
          'Clínica': client.clinic_name || '-',
          'Cidade': client.city || '-',
          'Telefone': client.phone || '-',
          'Status': client.status || '-',
          'Score': client.purchase_score || 0,
          'Prioridade': Math.round(client.priorityScore),
          'Tipo': 'Principal',
          'Endereço': client.address || '-',
          'Última Visita': client.last_visit_date || 'Nunca',
          'Equipamento Interesse': client.equipment_interest || '-'
        });
      });
      
      day.plan_b.forEach((client, idx) => {
        excelData.push({
          'Data': day.date,
          'Dia Semana': day.day_of_week,
          'Ordem': day.clients.length + idx + 1,
          'Cliente': client.first_name,
          'Clínica': client.clinic_name || '-',
          'Cidade': client.city || '-',
          'Telefone': client.phone || '-',
          'Status': client.status || '-',
          'Score': client.purchase_score || 0,
          'Prioridade': Math.round(client.priorityScore),
          'Tipo': 'PLANO B',
          'Endereço': client.address || '-',
          'Última Visita': client.last_visit_date || 'Nunca',
          'Equipamento Interesse': client.equipment_interest || '-'
        });
      });
    });

    // Criar workbook
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Agenda Mensal');
    
    // Converter para buffer
    const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return new Response(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="agenda_${city}_${month_year || 'mensal'}.xlsx"`
      }
    });

  } catch (error) {
    console.error('Erro:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
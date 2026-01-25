import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    const { message, from } = await req.json();
    const messageText = message?.toLowerCase() || '';
    
    // Buscar todos os clientes
    const clients = await base44.asServiceRole.entities.Client.list('-updated_date', 100);
    
    let responseText = '';
    
    // COMANDOS DO BOT
    
    // 1. BUSCAR CLIENTE
    if (messageText.startsWith('buscar ') || messageText.startsWith('cliente ')) {
      const searchTerm = messageText.replace('buscar ', '').replace('cliente ', '').trim();
      const foundClients = clients.filter(c => 
        c.first_name?.toLowerCase().includes(searchTerm) ||
        c.clinic_name?.toLowerCase().includes(searchTerm) ||
        c.city?.toLowerCase().includes(searchTerm)
      ).slice(0, 5);
      
      if (foundClients.length === 0) {
        responseText = `❌ Nenhum cliente encontrado com "${searchTerm}"`;
      } else {
        responseText = `✅ *${foundClients.length} cliente(s) encontrado(s):*\n\n`;
        foundClients.forEach((c, i) => {
          responseText += `${i + 1}. *${c.first_name}*\n`;
          responseText += `   Clínica: ${c.clinic_name || 'N/A'}\n`;
          responseText += `   Status: ${c.status} (${c.purchase_score}%)\n`;
          responseText += `   Cidade: ${c.city || 'N/A'}\n`;
          responseText += `   Pipeline: ${c.pipeline_stage || 'lead'}\n\n`;
        });
      }
    }
    
    // 2. ANÁLISE DE PERFORMANCE DA EQUIPE
    else if (messageText.includes('performance') || messageText.includes('equipe') || messageText.includes('analise')) {
      const sales = await base44.asServiceRole.entities.Sale.list('-sale_date', 50);
      const coachingSessions = await base44.asServiceRole.entities.CoachingSession.list('-created_date', 50);
      const interactions = await base44.asServiceRole.entities.Interaction.list('-created_date', 50);
      
      // Últimos 30 dias
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentSales = sales.filter(s => new Date(s.sale_date) >= thirtyDaysAgo);
      const recentCoaching = coachingSessions.filter(c => new Date(c.created_date) >= thirtyDaysAgo);
      const recentInteractions = interactions.filter(i => new Date(i.created_date) >= thirtyDaysAgo);
      
      const totalRevenue = recentSales.reduce((sum, s) => sum + (s.sale_value || 0), 0);
      const avgScore = recentCoaching.length > 0 
        ? (recentCoaching.reduce((sum, c) => sum + (c.overall_score || 0), 0) / recentCoaching.length).toFixed(1)
        : 0;
      
      responseText = `📊 *PERFORMANCE DA EQUIPE (30 dias)*\n\n`;
      responseText += `💰 *Vendas:* ${recentSales.length}\n`;
      responseText += `💵 *Receita:* R$ ${totalRevenue.toLocaleString('pt-BR')}\n`;
      responseText += `📈 *Ticket Médio:* R$ ${(totalRevenue / recentSales.length || 0).toFixed(2)}\n`;
      responseText += `🎯 *Coaching:* ${recentCoaching.length} sessões (Score: ${avgScore}/100)\n`;
      responseText += `💬 *Interações:* ${recentInteractions.length}\n\n`;
      responseText += `_Digite "performance detalhada" para análise completa com IA_`;
    }
    
    // 3. PLAYBOOK PARA CLIENTE
    else if (messageText.startsWith('playbook ')) {
      const clientName = messageText.replace('playbook ', '').trim();
      const client = clients.find(c => 
        c.first_name?.toLowerCase().includes(clientName) ||
        c.clinic_name?.toLowerCase().includes(clientName)
      );
      
      if (!client) {
        responseText = `❌ Cliente "${clientName}" não encontrado.\n\nTente: *playbook [nome do cliente]*`;
      } else {
        responseText = `🎯 Gerando playbook para *${client.first_name}*...\n\n`;
        
        // Gerar playbook rápido com IA
        const quickPlaybook = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `Gere um playbook de vendas SUPER RÁPIDO para WhatsApp (máximo 500 caracteres):

Cliente: ${client.first_name}
Numerologia: ${client.numerology_number || 'N/A'}
Status: ${client.status}
Pipeline: ${client.pipeline_stage || 'lead'}

Forneça:
1. Melhor abordagem (1 frase)
2. Top 2 perguntas SPIN
3. Principal objeção esperada + resposta
4. Fechamento ideal

SEJA ULTRA-CONCISO para WhatsApp!`,
          response_json_schema: {
            type: "object",
            properties: {
              abordagem: { type: "string" },
              perguntas_spin: { type: "array", items: { type: "string" } },
              objecao_principal: { type: "string" },
              resposta_objecao: { type: "string" },
              fechamento: { type: "string" }
            }
          }
        });
        
        responseText += `📍 *Abordagem:* ${quickPlaybook.abordagem}\n\n`;
        responseText += `❓ *Perguntas SPIN:*\n`;
        quickPlaybook.perguntas_spin?.forEach((p, i) => {
          responseText += `${i + 1}. ${p}\n`;
        });
        responseText += `\n🛡️ *Objeção:* ${quickPlaybook.objecao_principal}\n`;
        responseText += `💡 *Resposta:* ${quickPlaybook.resposta_objecao}\n\n`;
        responseText += `🎯 *Fechamento:* ${quickPlaybook.fechamento}`;
      }
    }
    
    // 4. CLIENTES QUENTES
    else if (messageText.includes('quente') || messageText.includes('hot')) {
      const hotClients = clients.filter(c => c.status === 'quente').slice(0, 10);
      
      responseText = `🔥 *${hotClients.length} CLIENTES QUENTES*\n\n`;
      hotClients.forEach((c, i) => {
        responseText += `${i + 1}. *${c.first_name}* - ${c.clinic_name || 'N/A'}\n`;
        responseText += `   Score: ${c.purchase_score}% | ${c.city || 'N/A'}\n`;
        if (c.next_contact_date) {
          responseText += `   Próximo contato: ${new Date(c.next_contact_date).toLocaleDateString('pt-BR')}\n`;
        }
        responseText += `\n`;
      });
    }
    
    // 5. TAREFAS PENDENTES
    else if (messageText.includes('tarefa') || messageText.includes('task')) {
      const tasks = await base44.asServiceRole.entities.Task.list('-due_date', 20);
      const pendingTasks = tasks.filter(t => t.status === 'pendente');
      
      responseText = `✅ *${pendingTasks.length} TAREFAS PENDENTES*\n\n`;
      pendingTasks.slice(0, 5).forEach((t, i) => {
        responseText += `${i + 1}. ${t.title}\n`;
        responseText += `   Cliente: ${t.client_name || 'N/A'}\n`;
        if (t.due_date) {
          responseText += `   Vencimento: ${new Date(t.due_date).toLocaleDateString('pt-BR')}\n`;
        }
        responseText += `   Prioridade: ${t.priority}\n\n`;
      });
    }
    
    // 6. RESUMO DO DIA
    else if (messageText.includes('resumo') || messageText.includes('hoje') || messageText.includes('dia')) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todaySales = await base44.asServiceRole.entities.Sale.filter({ sale_date: today.toISOString().split('T')[0] });
      const todayTasks = await base44.asServiceRole.entities.Task.filter({ due_date: today.toISOString().split('T')[0] });
      const todayVisits = await base44.asServiceRole.entities.Visit.filter({ status: 'agendada' });
      
      const hotClients = clients.filter(c => c.status === 'quente').length;
      
      responseText = `📅 *RESUMO DE HOJE*\n`;
      responseText += `${new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}\n\n`;
      responseText += `💰 Vendas: ${todaySales.length}\n`;
      responseText += `✅ Tarefas: ${todayTasks.length}\n`;
      responseText += `📍 Visitas: ${todayVisits.length}\n`;
      responseText += `🔥 Clientes Quentes: ${hotClients}\n`;
      responseText += `👥 Total Clientes: ${clients.length}\n`;
    }
    
    // 7. AJUDA
    else if (messageText.includes('ajuda') || messageText.includes('help') || messageText.includes('comando')) {
      responseText = `🤖 *ASSISTENTE MASTER PRIMORI*\n\n`;
      responseText += `📱 *Comandos disponíveis:*\n\n`;
      responseText += `🔍 *buscar [nome]* - Buscar cliente\n`;
      responseText += `🎯 *playbook [nome]* - Gerar playbook\n`;
      responseText += `📊 *performance* - Performance da equipe\n`;
      responseText += `🔥 *quentes* - Ver clientes quentes\n`;
      responseText += `✅ *tarefas* - Tarefas pendentes\n`;
      responseText += `📅 *resumo* - Resumo do dia\n`;
      responseText += `💬 *ajuda* - Ver comandos\n\n`;
      responseText += `_Digite qualquer comando para começar!_`;
    }
    
    // COMANDO PADRÃO
    else {
      responseText = `👋 Olá! Sou o *Assistente Master Primori*.\n\n`;
      responseText += `Digite *ajuda* para ver todos os comandos disponíveis.\n\n`;
      responseText += `Comandos rápidos:\n`;
      responseText += `• buscar [nome]\n`;
      responseText += `• playbook [nome]\n`;
      responseText += `• performance\n`;
      responseText += `• resumo`;
    }
    
    return Response.json({
      success: true,
      message: responseText,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Erro no bot WhatsApp:', error);
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
});
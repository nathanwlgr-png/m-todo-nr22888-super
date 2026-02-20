import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { message, from } = await req.json();
    const messageText = message?.toLowerCase() || '';
    
    // Buscar todos os clientes (sem auth obrigatória - bot interno)
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
    else if (messageText.includes('performance') && !messageText.includes('detalhada')) {
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
    
    // 2B. PERFORMANCE DETALHADA COM IA
    else if (messageText.includes('performance detalhada') || messageText.includes('análise detalhada')) {
      const sales = await base44.asServiceRole.entities.Sale.list('-sale_date', 50);
      const coachingSessions = await base44.asServiceRole.entities.CoachingSession.list('-created_date', 30);
      const interactions = await base44.asServiceRole.entities.Interaction.list('-created_date', 50);
      
      responseText = `⏳ Gerando análise detalhada com IA...\n\n`;
      
      const aiAnalysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `Analise a performance da equipe de vendas (últimos 30 dias):

VENDAS: ${sales.length} vendas, ${sales.reduce((sum, s) => sum + (s.sale_value || 0), 0).toLocaleString('pt-BR')} em receita

COACHING: ${coachingSessions.length} sessões
Scores médios: ${coachingSessions.map(c => c.technique_scores).filter(Boolean).length} análises

INTERAÇÕES: ${interactions.length} interações registradas

Forneça análise SUPER CONCISA (máximo 400 caracteres) para WhatsApp:
1. Principal força da equipe
2. Maior oportunidade de melhoria
3. Recomendação #1 acionável HOJE

Seja direto e prático!`,
        response_json_schema: {
          type: "object",
          properties: {
            forca: { type: "string" },
            oportunidade: { type: "string" },
            acao_imediata: { type: "string" }
          }
        }
      });
      
      responseText = `🤖 *ANÁLISE IA - PERFORMANCE*\n\n`;
      responseText += `💪 *Força:* ${aiAnalysis.forca}\n\n`;
      responseText += `📈 *Oportunidade:* ${aiAnalysis.oportunidade}\n\n`;
      responseText += `⚡ *Ação Hoje:* ${aiAnalysis.acao_imediata}`;
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
    
    // 7. CRIAR TAREFA RÁPIDA
    else if (messageText.startsWith('criar tarefa') || messageText.startsWith('nova tarefa')) {
      const taskText = messageText.replace('criar tarefa', '').replace('nova tarefa', '').trim();
      
      if (!taskText) {
        responseText = `❌ Use: *criar tarefa [descrição]*\n\nEx: criar tarefa Ligar para João da Clínica Vida`;
      } else {
        // Criar tarefa com IA para extrair cliente
        const taskData = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `Extraia informações desta tarefa: "${taskText}"\n\nRetorne: título curto, descrição, prioridade (alta/media/baixa), se há menção a cliente (nome)`,
          response_json_schema: {
            type: "object",
            properties: {
              title: { type: "string" },
              description: { type: "string" },
              priority: { type: "string" },
              client_mention: { type: "string" }
            }
          }
        });
        
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 1);
        
        await base44.asServiceRole.entities.Task.create({
          title: taskData.title,
          description: taskData.description || taskText,
          priority: taskData.priority || 'media',
          status: 'pendente',
          due_date: dueDate.toISOString().split('T')[0],
          type: 'outro'
        });
        
        responseText = `✅ *Tarefa Criada!*\n\n`;
        responseText += `📋 ${taskData.title}\n`;
        responseText += `⚡ Prioridade: ${taskData.priority}\n`;
        responseText += `📅 Vence amanhã`;
      }
    }
    
    // 8. BUSCA CLÍNICAS DA CIDADE (NOVO)
    else if (messageText.startsWith('clinicas ') || messageText.startsWith('clínicas ')) {
      const cityName = messageText.replace('clinicas ', '').replace('clínicas ', '').trim();
      responseText = `🔍 *Buscando clínicas em ${cityName}...*\n\nUse a função "buscaClinicasCidade" no CRM para análise completa com internet.\n\n*Clientes já cadastrados nesta cidade:*\n`;
      const cityClients = clients.filter(c => c.city?.toLowerCase().includes(cityName.toLowerCase())).slice(0, 5);
      if (cityClients.length === 0) {
        responseText += `❌ Nenhum cliente de ${cityName} no CRM ainda.\n\nDica: Use *buscar mercado ${cityName}* para prospectar!`;
      } else {
        cityClients.forEach((c, i) => {
          responseText += `${i + 1}. ${c.first_name} - ${c.clinic_name || 'N/A'} (${c.status})\n`;
        });
      }
    }

    // 8B. INTELIGÊNCIA COMPLETA DE CLÍNICA (NOVO)
    else if (messageText.startsWith('inteligencia ') || messageText.startsWith('inteligência ') || messageText.startsWith('perfil completo ')) {
      const clinicName = messageText.replace('inteligencia ', '').replace('inteligência ', '').replace('perfil completo ', '').trim();
      const client = clients.find(c =>
        c.first_name?.toLowerCase().includes(clinicName) ||
        c.clinic_name?.toLowerCase().includes(clinicName)
      );

      if (!client) {
        responseText = `❌ Cliente "${clinicName}" não encontrado.\n\nTente: *perfil completo [nome]*`;
      } else {
        // Chamar função de inteligência total
        const result = await base44.asServiceRole.functions.invoke('clinicaInteligenciaTotal', {
          client_id: client.id,
          clinic_name: client.clinic_name,
          city: client.city,
        }).catch(e => null);

        if (result?.internet_research) {
          const r = result.internet_research;
          responseText = `🔬 *ANÁLISE TOTAL: ${client.first_name}*\n`;
          responseText += `━━━━━━━━━━━━━━━━━━━\n`;
          responseText += `📋 *CRM:* Score ${client.purchase_score}% | ${client.status}\n`;
          responseText += `🏥 *Porte:* ${r.porte_clinica || 'N/D'}\n`;
          responseText += `📊 *Volume/mês:* ${r.volume_estimado_mensal || 'N/D'}\n`;
          responseText += `⭐ *Google:* ${r.clinic_info?.avaliacao_google || 'N/D'} (${r.clinic_info?.numero_avaliacoes || 0} avaliações)\n`;
          responseText += `🎯 *Score Oportunidade:* ${r.score_oportunidade || 'N/D'}/100\n`;
          responseText += `🔧 *Equipamento Rec.:* ${r.equipamento_recomendado || 'N/D'}\n`;
          responseText += `━━━━━━━━━━━━━━━━━━━\n`;
          responseText += `💡 *Insights:* ${r.resumo_executivo || 'Ver CRM'}\n\n`;
          responseText += `⚡ *Abordagem:* ${r.abordagem_ideal || client.next_action || 'Ver playbook'}`;
        } else {
          responseText = `📋 *${client.first_name} - Perfil CRM*\n\n`;
          responseText += `Status: ${client.status} | Score: ${client.purchase_score}%\n`;
          responseText += `Clínica: ${client.clinic_name}\n`;
          responseText += `Cidade: ${client.city}\n`;
          responseText += `Pipeline: ${client.pipeline_stage}\n`;
          responseText += `Numerologia: ${client.numerology_number} - ${client.behavioral_profile}\n`;
          if (client.main_pains?.length) responseText += `\nDores: ${client.main_pains.join(', ')}\n`;
          if (client.next_action) responseText += `\nPróxima ação: ${client.next_action}`;
        }
      }
    }

    // 8C. RESUMO DIÁRIO (NOVO)
    else if (messageText.includes('resumo') && (messageText.includes('diario') || messageText.includes('diário'))) {
      const result = await base44.asServiceRole.functions.invoke('whatsappMasterNotificacao', {
        action: 'resumo_diario',
        phone: from || '5514991676428',
      }).catch(e => null);
      responseText = result?.message_text || '❌ Erro ao gerar resumo diário';
    }

    // 9. ANÁLISE RÁPIDA CLIENTE
    else if (messageText.startsWith('analisar ') || messageText.startsWith('análise ')) {
      const clientName = messageText.replace('analisar ', '').replace('análise ', '').trim();
      const client = clients.find(c => 
        c.first_name?.toLowerCase().includes(clientName) ||
        c.clinic_name?.toLowerCase().includes(clientName)
      );
      
      if (!client) {
        responseText = `❌ Cliente não encontrado.\n\nTente: *analisar [nome]*`;
      } else {
        const analysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `Análise ultra-rápida para WhatsApp (300 chars):

Cliente: ${client.first_name} - ${client.clinic_name}
Status: ${client.status} (Score: ${client.purchase_score}%)
Numerologia: ${client.numerology_number}
Pipeline: ${client.pipeline_stage}
Dores: ${client.main_pains?.join(', ')}

Dê: 1 insight principal + 1 ação imediata`,
          response_json_schema: {
            type: "object",
            properties: {
              insight: { type: "string" },
              acao: { type: "string" }
            }
          }
        });
        
        responseText = `🎯 *${client.first_name}*\n\n`;
        responseText += `💡 ${analysis.insight}\n\n`;
        responseText += `⚡ *AÇÃO:* ${analysis.acao}`;
      }
    }
    
    // 9. AJUDA
    else if (messageText.includes('ajuda') || messageText.includes('help') || messageText.includes('comando')) {
      responseText = `🤖 *ASSISTENTE MASTER PRIMORI*\n\n`;
      responseText += `📱 *Comandos:*\n\n`;
      responseText += `🔍 buscar [nome]\n`;
      responseText += `🎯 playbook [nome]\n`;
      responseText += `📊 performance\n`;
      responseText += `🤖 performance detalhada\n`;
      responseText += `🔥 quentes\n`;
      responseText += `✅ tarefas\n`;
      responseText += `➕ criar tarefa [texto]\n`;
      responseText += `🔬 analisar [nome]\n`;
      responseText += `🏥 clínicas [cidade]\n`;
      responseText += `🔍 inteligência [nome]\n`;
      responseText += `📊 perfil completo [nome]\n`;
      responseText += `📅 resumo\n`;
      responseText += `📅 resumo diário\n`;
      responseText += `💬 ajuda\n\n`;
      responseText += `_Conectado aos módulos de IA!_`;
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
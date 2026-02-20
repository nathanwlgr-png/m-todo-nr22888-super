import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { message, from, lat, lng } = body;
    const messageText = message?.toLowerCase() || '';
    
    const clients = await base44.asServiceRole.entities.Client.list('-updated_date', 150);
    let responseText = '';

    // ─── HELPER: encontrar cliente pelo nome ───
    const findClient = (name) => clients.find(c =>
      c.first_name?.toLowerCase().includes(name) ||
      c.clinic_name?.toLowerCase().includes(name) ||
      c.full_name?.toLowerCase().includes(name)
    );

    // ─── GPS + CLIENTES PRÓXIMOS ─────────────────────────────────────────────
    if (messageText.includes('gps') || messageText.includes('onde estou') || messageText.includes('próximos') || messageText.includes('proximos')) {
      if (lat && lng) {
        // Clientes com cidade mapeada — retorna os mais prioritários da região
        const cityClients = clients
          .filter(c => c.city)
          .sort((a, b) => (a.priority_level || 9) - (b.priority_level || 9))
          .slice(0, 5);

        responseText = `📍 *GPS RECEBIDO*\nLat: ${parseFloat(lat).toFixed(4)}, Lng: ${parseFloat(lng).toFixed(4)}\n\n`;
        responseText += `🏥 *Clientes prioritários na rota:*\n\n`;
        cityClients.forEach((c, i) => {
          responseText += `${i+1}. *${c.first_name}* — ${c.city}\n`;
          responseText += `   Score: ${c.purchase_score || 0}% | ${c.status}\n`;
          if (c.phone) responseText += `   📱 wa.me/${c.phone}\n`;
          responseText += '\n';
        });
        responseText += `🗺️ *Google Maps rota completa:*\nhttps://www.google.com/maps/dir/?api=1&origin=${lat},${lng}&destination=Marília,SP&travelmode=driving`;
      } else {
        // Sem coordenadas: mostrar como enviar
        responseText = `📍 *Para usar GPS, envie:*\n\ngps lat:-22.2139 lng:-49.9461\n\nOu acesse o CRM → Agenda → GPS para monitoramento automático.`;
      }
    }

    // ─── ROTA DO DIA ─────────────────────────────────────────────────────────
    else if (messageText.includes('rota') || (messageText.includes('agenda') && (messageText.includes('hoje') || messageText.includes('dia')))) {
      const today = new Date().toISOString().split('T')[0];
      const visits = await base44.asServiceRole.entities.Visit.filter({ status: 'agendada' });
      const todayVisits = visits.filter(v => v.scheduled_date?.startsWith(today));

      responseText = `📅 *ROTA DE HOJE — ${new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}*\n\n`;

      if (todayVisits.length === 0) {
        responseText += `❌ Nenhuma visita agendada para hoje.\n\nDigite *agenda [cidades]* para gerar sua rota!`;
      } else {
        todayVisits.forEach((v, i) => {
          const hora = v.scheduled_date?.split('T')[1]?.slice(0,5) || '';
          responseText += `${i+1}. *${v.client_name}*${hora ? ` — ${hora}` : ''}\n`;
          if (v.location) responseText += `   📍 ${v.location}\n`;
          responseText += '\n';
        });

        // Link do Maps com todos os waypoints
        const waypoints = todayVisits.map(v => encodeURIComponent(v.client_name + ', SP')).join('|');
        responseText += `🗺️ *Abrir rota completa:*\nhttps://www.google.com/maps/dir/?api=1&origin=Marília,SP&destination=Marília,SP&waypoints=${waypoints}&travelmode=driving`;
      }
    }

    // ─── NAVEGAÇÃO PARA CLIENTE ───────────────────────────────────────────────
    else if (messageText.startsWith('navegar ') || messageText.startsWith('ir para ') || messageText.startsWith('maps ')) {
      const nome = messageText.replace('navegar ', '').replace('ir para ', '').replace('maps ', '').trim();
      const client = findClient(nome);
      if (!client) {
        responseText = `❌ Cliente "${nome}" não encontrado.`;
      } else {
        const dest = encodeURIComponent(`${client.clinic_name || client.first_name}, ${client.city || ''}, SP`);
        const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=driving`;
        const wazeUrl = `https://waze.com/ul?q=${dest}&navigate=yes`;
        responseText = `🗺️ *Navegação para ${client.first_name}*\n\n`;
        responseText += `📍 ${client.clinic_name || ''} — ${client.city}\n\n`;
        responseText += `🔵 *Google Maps:*\n${mapsUrl}\n\n`;
        responseText += `🔷 *Waze:*\n${wazeUrl}`;
      }
    }

    // ─── REGISTRAR NOTA/VISITA ────────────────────────────────────────────────
    else if (messageText.startsWith('anota ') || messageText.startsWith('anotar ') || messageText.startsWith('nota ')) {
      const match = messageText.match(/(?:anota(?:r)?|nota)\s+(?:para |no |pra )?(.+?)[:]\s*(.+)/);
      if (!match) {
        responseText = `❌ Use o formato:\n*anota para [nome]: [sua nota]*\n\nEx: anota para Dr. João: muito interessado, quer demo na semana que vem`;
      } else {
        const nomeCliente = match[1].trim();
        const nota = match[2].trim();
        const client = findClient(nomeCliente);

        if (!client) {
          responseText = `❌ Cliente "${nomeCliente}" não encontrado no CRM.`;
        } else {
          const visits = await base44.asServiceRole.entities.Visit.filter({ client_id: client.id });
          const now = new Date().toISOString();

          if (visits.length > 0) {
            const ultima = visits.sort((a, b) => new Date(b.scheduled_date) - new Date(a.scheduled_date))[0];
            await base44.asServiceRole.entities.Visit.update(ultima.id, {
              result_notes: (ultima.result_notes || '') + `\n[WhatsApp ${new Date().toLocaleTimeString('pt-BR')}]: ${nota}`,
            });
          } else {
            await base44.asServiceRole.entities.Visit.create({
              client_id: client.id,
              client_name: client.first_name,
              scheduled_date: now,
              status: 'realizada',
              visit_type: 'followup',
              result_notes: nota,
              notes: '[Criado via WhatsApp Bot]',
            });
          }

          await base44.asServiceRole.entities.Client.update(client.id, {
            last_contact_date: now.split('T')[0],
          });

          responseText = `✅ *Nota registrada!*\n\nCliente: *${client.first_name}*\nNota: "${nota}"\n\nSalvo no histórico de visitas do CRM.`;
        }
      }
    }

    // ─── DETALHES DO CLIENTE ──────────────────────────────────────────────────
    else if (messageText.startsWith('detalhes ') || messageText.startsWith('status ') || messageText.startsWith('info ')) {
      const nome = messageText.replace('detalhes ', '').replace('status ', '').replace('info ', '').trim();
      const client = findClient(nome);
      if (!client) {
        responseText = `❌ Cliente "${nome}" não encontrado.`;
      } else {
        const visits = await base44.asServiceRole.entities.Visit.filter({ client_id: client.id });
        const tasks = await base44.asServiceRole.entities.Task.filter({ client_id: client.id });
        responseText = `📋 *${client.first_name}*\n`;
        responseText += `🏥 ${client.clinic_name || 'N/A'} — ${client.city || 'N/A'}\n`;
        responseText += `━━━━━━━━━━━━━\n`;
        responseText += `🔥 Status: *${client.status}*\n`;
        responseText += `📊 Score: *${client.purchase_score || 0}%*\n`;
        responseText += `🔄 Pipeline: ${client.pipeline_stage || 'lead'}\n`;
        responseText += `📅 Última visita: ${client.last_visit_date || 'Nunca'}\n`;
        responseText += `📅 Próx. contato: ${client.next_contact_date || 'N/A'}\n`;
        responseText += `🎯 Visitas: ${visits.length}\n`;
        responseText += `✅ Tarefas: ${tasks.filter(t => t.status === 'pendente').length} pendentes\n`;
        if (client.main_pains?.length) responseText += `💢 Dores: ${client.main_pains.join(', ')}\n`;
        if (client.next_action) responseText += `⚡ Próxima ação: ${client.next_action}\n`;
        if (client.phone) responseText += `\n💬 wa.me/${client.phone}`;
      }
    }

    // ─── ABORDAGEM/ESTRATÉGIA ─────────────────────────────────────────────────
    else if (messageText.startsWith('abordagem ') || messageText.startsWith('como abordar ') || messageText.startsWith('estratégia ')) {
      const nome = messageText.replace('abordagem ', '').replace('como abordar ', '').replace('estratégia ', '').trim();
      const client = findClient(nome);
      if (!client) {
        responseText = `❌ Cliente "${nome}" não encontrado.`;
      } else {
        const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `Gere abordagem de vendas ULTRA-CONCISA (max 400 chars) para WhatsApp:
Cliente: ${client.first_name}, Numerologia: ${client.numerology_number || 'N/A'}
Perfil: ${client.behavioral_profile || 'N/A'}, Tom: ${client.client_tone || 'N/A'}
Status: ${client.status}, Score: ${client.purchase_score}%
Dores: ${client.main_pains?.join(', ') || 'N/A'}
Inclua: 1 frase de abertura + 1 pergunta SPIN + 1 gatilho mental`,
          response_json_schema: { type: 'object', properties: {
            abertura: { type: 'string' }, pergunta_spin: { type: 'string' }, gatilho: { type: 'string' }
          }}
        });
        responseText = `🎯 *Abordagem: ${client.first_name}*\n\n`;
        responseText += `💬 *Abertura:* ${result.abertura}\n\n`;
        responseText += `❓ *SPIN:* ${result.pergunta_spin}\n\n`;
        responseText += `⚡ *Gatilho:* ${result.gatilho}`;
      }
    }

    // ─── BUSCAR CLIENTE ───────────────────────────────────────────────────────
    else if (messageText.startsWith('buscar ') || messageText.startsWith('cliente ')) {
      const searchTerm = messageText.replace('buscar ', '').replace('cliente ', '').trim();
      const found = clients.filter(c =>
        c.first_name?.toLowerCase().includes(searchTerm) ||
        c.clinic_name?.toLowerCase().includes(searchTerm) ||
        c.city?.toLowerCase().includes(searchTerm)
      ).slice(0, 5);

      if (found.length === 0) {
        responseText = `❌ Nenhum cliente encontrado com "${searchTerm}"`;
      } else {
        responseText = `✅ *${found.length} cliente(s):*\n\n`;
        found.forEach((c, i) => {
          responseText += `${i+1}. *${c.first_name}* — ${c.clinic_name || 'N/A'}\n`;
          responseText += `   ${c.status} · ${c.purchase_score}% · ${c.city || 'N/A'}\n\n`;
        });
      }
    }

    // ─── PLAYBOOK ─────────────────────────────────────────────────────────────
    else if (messageText.startsWith('playbook ')) {
      const clientName = messageText.replace('playbook ', '').trim();
      const client = findClient(clientName);
      if (!client) {
        responseText = `❌ Cliente "${clientName}" não encontrado.\n\nUse: *playbook [nome]*`;
      } else {
        const playbook = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `Playbook para WhatsApp (max 500 chars): ${client.first_name}, Numerologia: ${client.numerology_number}, Status: ${client.status}, Pipeline: ${client.pipeline_stage}. Inclua: abertura, pergunta SPIN, objeção + resposta, fechamento.`,
          response_json_schema: { type: 'object', properties: {
            abordagem: { type: 'string' }, perguntas_spin: { type: 'array', items: { type: 'string' } },
            objecao_principal: { type: 'string' }, resposta_objecao: { type: 'string' }, fechamento: { type: 'string' }
          }}
        });
        responseText = `🎯 *PLAYBOOK: ${client.first_name}*\n\n📍 ${playbook.abordagem}\n\n❓ ${playbook.perguntas_spin?.[0]}\n\n🛡️ ${playbook.objecao_principal}\n💡 ${playbook.resposta_objecao}\n\n🏁 ${playbook.fechamento}`;
      }
    }

    // ─── QUENTES ──────────────────────────────────────────────────────────────
    else if (messageText.includes('quente') || messageText.includes('hot')) {
      const hot = clients.filter(c => c.status === 'quente').slice(0, 8);
      responseText = `🔥 *${hot.length} CLIENTES QUENTES*\n\n`;
      hot.forEach((c, i) => {
        responseText += `${i+1}. *${c.first_name}* — ${c.city || 'N/A'}\n   Score: ${c.purchase_score}%`;
        if (c.phone) responseText += ` · wa.me/${c.phone}`;
        responseText += '\n\n';
      });
    }

    // ─── TAREFAS ──────────────────────────────────────────────────────────────
    else if (messageText.includes('tarefa') || messageText.startsWith('criar tarefa') || messageText.startsWith('nova tarefa')) {
      if (messageText.startsWith('criar tarefa') || messageText.startsWith('nova tarefa')) {
        const taskText = messageText.replace('criar tarefa', '').replace('nova tarefa', '').trim();
        if (!taskText) {
          responseText = `❌ Use: *criar tarefa [descrição]*`;
        } else {
          const taskData = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt: `Extraia da tarefa: "${taskText}" → título curto, prioridade (alta/media/baixa), cliente mencionado (se houver)`,
            response_json_schema: { type: 'object', properties: { title: { type: 'string' }, priority: { type: 'string' }, client_mention: { type: 'string' } }}
          });
          const due = new Date(); due.setDate(due.getDate() + 1);
          await base44.asServiceRole.entities.Task.create({
            title: taskData.title, priority: taskData.priority || 'media',
            status: 'pendente', due_date: due.toISOString().split('T')[0], type: 'outro',
          });
          responseText = `✅ *Tarefa criada!*\n\n📋 ${taskData.title}\n⚡ Prioridade: ${taskData.priority || 'media'}\n📅 Vence amanhã`;
        }
      } else {
        const tasks = await base44.asServiceRole.entities.Task.list('-due_date', 20);
        const pending = tasks.filter(t => t.status === 'pendente');
        responseText = `✅ *${pending.length} TAREFAS PENDENTES*\n\n`;
        pending.slice(0, 6).forEach((t, i) => {
          responseText += `${i+1}. ${t.title}\n   ${t.client_name || ''} · ${t.due_date || ''} · ${t.priority}\n\n`;
        });
      }
    }

    // ─── RESUMO DO DIA ────────────────────────────────────────────────────────
    else if (messageText.includes('resumo') || messageText.includes('hoje') || messageText.includes('dia')) {
      const today = new Date().toISOString().split('T')[0];
      const [todaySales, todayTasks, todayVisits] = await Promise.all([
        base44.asServiceRole.entities.Sale.filter({ sale_date: today }),
        base44.asServiceRole.entities.Task.filter({ due_date: today }),
        base44.asServiceRole.entities.Visit.filter({ status: 'agendada' }),
      ]);
      const hot = clients.filter(c => c.status === 'quente').length;
      responseText = `📅 *RESUMO — ${new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}*\n\n`;
      responseText += `💰 Vendas hoje: ${todaySales.length}\n`;
      responseText += `✅ Tarefas: ${todayTasks.length}\n`;
      responseText += `📍 Visitas agendadas: ${todayVisits.length}\n`;
      responseText += `🔥 Clientes quentes: ${hot}\n`;
      responseText += `👥 Total no CRM: ${clients.length}\n\n`;
      responseText += `_Digite "rota" para ver o roteiro do dia_`;
    }

    // ─── PERFORMANCE ─────────────────────────────────────────────────────────
    else if (messageText.includes('performance')) {
      const sales = await base44.asServiceRole.entities.Sale.list('-sale_date', 50);
      const d30 = new Date(); d30.setDate(d30.getDate() - 30);
      const recent = sales.filter(s => new Date(s.sale_date) >= d30);
      const revenue = recent.reduce((sum, s) => sum + (s.sale_value || 0), 0);
      responseText = `📊 *PERFORMANCE (30 dias)*\n\n💰 Vendas: ${recent.length}\n💵 Receita: R$ ${revenue.toLocaleString('pt-BR')}\n📈 Ticket médio: R$ ${recent.length ? (revenue / recent.length).toFixed(0) : 0}`;
    }

    // ─── AJUDA ────────────────────────────────────────────────────────────────
    else if (messageText.includes('ajuda') || messageText.includes('help') || messageText.includes('comando')) {
      responseText = `🤖 *PRIMORI — COMANDOS*\n\n`;
      responseText += `📍 *GPS/Rota:*\ngps · rota · agenda hoje\nnavegar [nome]\nmaps [nome]\n\n`;
      responseText += `👤 *Clientes:*\nbuscar [nome]\ndetalhes [nome]\nstatus [nome]\nabordagem [nome]\nplaybook [nome]\n\n`;
      responseText += `📝 *Registros:*\nanota para [nome]: [texto]\ncriar tarefa [texto]\n\n`;
      responseText += `📊 *Relatórios:*\nresumo · hoje\nquentes\ntarefas\nperformance\n\n`;
      responseText += `_Dica: Envie "gps lat:-22.21 lng:-49.94" para localização real_`;
    }

    // ─── IA LIVRE (qualquer pergunta) ─────────────────────────────────────────
    else {
      const today = new Date().toISOString().split('T')[0];
      const [visits, tasks] = await Promise.all([
        base44.asServiceRole.entities.Visit.filter({ status: 'agendada' }),
        base44.asServiceRole.entities.Task.list('-due_date', 10),
      ]);
      const visitasHoje = visits.filter(v => v.scheduled_date?.startsWith(today));

      const aiResp = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `Você é Primori, assistente de CRM e vendas para WhatsApp. Responda em PORTUGUÊS, máx 300 chars, prático e direto.

CONTEXTO:
- Data: ${new Date().toLocaleString('pt-BR')}
- GPS: ${lat && lng ? `Lat ${lat}, Lng ${lng}` : 'não disponível'}
- Visitas hoje: ${visitasHoje.length}
- Clientes quentes: ${clients.filter(c => c.status === 'quente').length}
- Tarefas pendentes: ${tasks.filter(t => t.status === 'pendente').length}
- Total clientes: ${clients.length}

Pergunta: ${message}

Se pedir rota/navegar, sugira o link do Maps. Se pedir cliente, use dados acima.`,
      });

      responseText = aiResp || '❓ Não entendi. Digite *ajuda* para ver os comandos.';
    }

    return Response.json({ success: true, message: responseText, timestamp: new Date().toISOString() });

  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});
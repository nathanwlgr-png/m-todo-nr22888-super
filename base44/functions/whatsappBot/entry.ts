import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// ═══════════════════════════════════════════════════════════════
// MÉTODO NR22 — WhatsApp Master Bot UNIFICADO v6
// Acesso TOTAL ao CRM + 25 IAs integradas — Econômico e Rápido
// ═══════════════════════════════════════════════════════════════

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    const { message, from, lat, lng } = body;
    const msg = (message || '').trim();
    const msgL = msg.toLowerCase();

    // ─── CARREGAR CRM (cache único) ──────────────────────────────
    const [clients, tasks, visits, sales] = await Promise.all([
      base44.asServiceRole.entities.Client.list('-purchase_score', 200),
      base44.asServiceRole.entities.Task.list('-due_date', 30),
      base44.asServiceRole.entities.Visit.list('-scheduled_date', 30),
      base44.asServiceRole.entities.Sale.list('-sale_date', 30),
    ]);

    const today = new Date().toISOString().split('T')[0];
    const todayStr = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

    // Helper: encontrar cliente
    const findClient = (name) => {
      const n = name.toLowerCase().trim();
      return clients.find(c =>
        c.first_name?.toLowerCase().includes(n) ||
        c.full_name?.toLowerCase().includes(n) ||
        c.clinic_name?.toLowerCase().includes(n)
      );
    };

    // Helper: formatar score
    const scoreEmoji = (s) => s >= 70 ? '🔥' : s >= 40 ? '🌡️' : '❄️';

    let responseText = '';

    // ═══════════════════════════════════════════════════════
    // 1. GPS / LOCALIZAÇÃO
    // ═══════════════════════════════════════════════════════
    const latMatch = msgL.match(/lat[:\s]*([-\d.]+)/);
    const lngMatch = msgL.match(/lng[:\s]*([-\d.]+)/);
    const gpsLat = latMatch ? parseFloat(latMatch[1]) : lat;
    const gpsLng = lngMatch ? parseFloat(lngMatch[1]) : lng;

    if (msgL.includes('gps') || msgL.includes('onde estou') || msgL.match(/próximos|proximos.*clientes/)) {
      if (gpsLat && gpsLng) {
        const nearest = clients
          .filter(c => c.city)
          .sort((a, b) => (b.purchase_score || 0) - (a.purchase_score || 0))
          .slice(0, 5);
        responseText = `📍 *GPS — CLIENTES PRIORITÁRIOS*\nLat: ${gpsLat.toFixed(4)}, Lng: ${gpsLng.toFixed(4)}\n\n`;
        nearest.forEach((c, i) => {
          responseText += `${i+1}. *${c.first_name}* — ${c.city}\n   ${scoreEmoji(c.purchase_score||0)} Score: ${c.purchase_score||0}%`;
          if (c.phone) responseText += ` · wa.me/${c.phone}`;
          responseText += '\n\n';
        });
        responseText += `🗺️ https://www.google.com/maps/dir/?api=1&origin=${gpsLat},${gpsLng}&destination=Marília,SP&travelmode=driving`;
      } else {
        responseText = `📍 Envie: *gps lat:-22.2139 lng:-49.9461*`;
      }
    }

    // ═══════════════════════════════════════════════════════
    // 2. ROTA / AGENDA HOJE
    // ═══════════════════════════════════════════════════════
    else if (msgL.match(/^rota|agenda hoje|agenda do dia|visitas hoje/)) {
      const todayVisits = visits.filter(v => v.scheduled_date?.startsWith(today) && v.status === 'agendada');
      responseText = `📅 *ROTA — ${todayStr}*\n\n`;
      if (todayVisits.length === 0) {
        responseText += `❌ Nenhuma visita agendada hoje.\nDigite *agenda [cidade]* para gerar!`;
      } else {
        todayVisits.forEach((v, i) => {
          const hora = v.scheduled_date?.split('T')[1]?.slice(0, 5) || '';
          responseText += `${i+1}. *${v.client_name}*${hora ? ` — ${hora}` : ''}\n`;
          if (v.location) responseText += `   📍 ${v.location}\n`;
        });
        const wp = todayVisits.map(v => encodeURIComponent(v.client_name + ', SP')).join('|');
        responseText += `\n🗺️ https://www.google.com/maps/dir/?api=1&origin=Marília,SP&destination=Marília,SP&waypoints=${wp}&travelmode=driving`;
      }
    }

    // ═══════════════════════════════════════════════════════
    // 3. AGENDA SEMANA [CIDADE]
    // ═══════════════════════════════════════════════════════
    else if (msgL.startsWith('agenda ') && !msgL.includes('hoje') && !msgL.includes('dia')) {
      const cidade = msg.replace(/agenda/i, '').trim();
      try {
        const result = await base44.asServiceRole.functions.invoke('agendaInteligente', {
          tipo: 'semana',
          cidades: [cidade],
          criar_visitas: true,
        });
        const agenda = result.agenda || [];
        responseText = `📅 *AGENDA SEMANA — ${cidade.toUpperCase()}*\n\n`;
        agenda.slice(0, 5).forEach(dia => {
          responseText += `*${dia.dia_semana}:*\n`;
          (dia.clientes || []).slice(0, 3).forEach((c, i) => {
            responseText += `  ${i+1}. ${c.nome} — ${c.clinica} (${c.horario_sugerido})\n`;
          });
          responseText += '\n';
        });
      } catch {
        responseText = `⚠️ Agenda em processamento. Acesse o CRM para detalhes.`;
      }
    }

    // ═══════════════════════════════════════════════════════
    // 4. NAVEGAÇÃO PARA CLIENTE
    // ═══════════════════════════════════════════════════════
    else if (msgL.match(/^(navegar|ir para|maps) /)) {
      const nome = msg.replace(/^(navegar|ir para|maps) /i, '').trim();
      const client = findClient(nome);
      if (!client) {
        responseText = `❌ Cliente "${nome}" não encontrado.`;
      } else {
        const dest = encodeURIComponent(`${client.clinic_name || client.first_name}, ${client.city || ''}, SP`);
        responseText = `🗺️ *Navegação: ${client.first_name}*\n📍 ${client.clinic_name || ''} — ${client.city}\n\n🔵 Google Maps:\nhttps://www.google.com/maps/dir/?api=1&destination=${dest}&travelmode=driving\n\n🔷 Waze:\nhttps://waze.com/ul?q=${dest}&navigate=yes`;
      }
    }

    // ═══════════════════════════════════════════════════════
    // 5. DETALHES / STATUS / INFO CLIENTE
    // ═══════════════════════════════════════════════════════
    else if (msgL.match(/^(detalhes|status|info|ver) /)) {
      const nome = msg.replace(/^(detalhes|status|info|ver) /i, '').trim();
      const client = findClient(nome);
      if (!client) {
        responseText = `❌ Cliente "${nome}" não encontrado.`;
      } else {
        const [cVisits, cTasks] = await Promise.all([
          base44.asServiceRole.entities.Visit.filter({ client_id: client.id }),
          base44.asServiceRole.entities.Task.filter({ client_id: client.id }),
        ]);
        responseText = `📋 *${client.first_name} — ${client.clinic_name || 'N/A'}*\n`;
        responseText += `🏙️ ${client.city || 'N/A'} | ${client.client_type || 'N/A'}\n`;
        responseText += `━━━━━━━━━━━━━━━\n`;
        responseText += `${scoreEmoji(client.purchase_score||0)} Score: *${client.purchase_score||0}%* | Status: *${client.status}*\n`;
        responseText += `🔄 Pipeline: ${client.pipeline_stage || 'lead'}\n`;
        responseText += `📅 Último contato: ${client.last_contact_date || 'Nunca'}\n`;
        responseText += `📅 Próx. contato: ${client.next_contact_date || 'N/A'}\n`;
        responseText += `📍 Visitas: ${cVisits.length} | ✅ Tarefas: ${cTasks.filter(t => t.status === 'pendente').length} pend.\n`;
        if (client.equipment_interest) responseText += `🔬 Interesse: ${client.equipment_interest}\n`;
        if (client.main_pains?.length) responseText += `💢 Dores: ${client.main_pains.slice(0,2).join(', ')}\n`;
        if (client.next_action) responseText += `⚡ Próx. ação: ${client.next_action}\n`;
        if (client.numerology_tip) responseText += `🔢 NR22: ${client.numerology_tip}\n`;
        if (client.phone) responseText += `\n💬 wa.me/${client.phone}`;
      }
    }

    // ═══════════════════════════════════════════════════════
    // 6. ANÁLISE COMPLETA NR22 (usa 1 chamada IA econômica)
    // ═══════════════════════════════════════════════════════
    else if (msgL.match(/^(análise|analise|analisar) /)) {
      const nome = msg.replace(/^(análise|analise|analisar) /i, '').trim();
      const client = findClient(nome);
      if (!client) {
        responseText = `❌ Cliente "${nome}" não encontrado.`;
      } else {
        const [cInteractions, cSales] = await Promise.all([
          base44.asServiceRole.entities.Interaction.filter({ client_id: client.id }).catch(() => []),
          base44.asServiceRole.entities.Sale.filter({ client_id: client.id }).catch(() => []),
        ]);
        const aiResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `Análise NR22 COMPACTA para WhatsApp (máx 500 chars). Cliente: ${client.first_name}, Clínica: ${client.clinic_name}, Cidade: ${client.city}, Score: ${client.purchase_score}%, Status: ${client.status}, Pipeline: ${client.pipeline_stage}, Numerologia: ${client.numerology_number || 'N/A'}, Perfil: ${client.behavioral_profile || 'N/A'}, Tom: ${client.client_tone || 'N/A'}, Dores: ${(client.main_pains||[]).join(', ')}, Interações: ${cInteractions.length}, Vendas: ${cSales.length}.
          Retorne: diagnostico (1 linha), score_recomendado, proxima_acao, abertura_whatsapp (1 frase), gatilho_mental.`,
          response_json_schema: { type: 'object', properties: {
            diagnostico: { type: 'string' },
            score_recomendado: { type: 'number' },
            proxima_acao: { type: 'string' },
            abertura_whatsapp: { type: 'string' },
            gatilho_mental: { type: 'string' },
          }}
        });
        responseText = `🧠 *ANÁLISE NR22 — ${client.first_name}*\n\n`;
        responseText += `${scoreEmoji(client.purchase_score||0)} Score: ${client.purchase_score||0}% | ${client.status}\n`;
        responseText += `📋 ${aiResult.diagnostico}\n\n`;
        responseText += `💬 *Abertura:* "${aiResult.abertura_whatsapp}"\n`;
        responseText += `⚡ *Gatilho:* ${aiResult.gatilho_mental}\n`;
        responseText += `🎯 *Próx. ação:* ${aiResult.proxima_acao}`;
        if (client.phone) responseText += `\n\n📱 wa.me/${client.phone}`;

        // Registrar interação automaticamente
        await base44.asServiceRole.entities.Interaction.create({
          client_id: client.id,
          client_name: client.first_name,
          type: 'whatsapp',
          direction: 'outbound',
          subject: 'Análise NR22 via WhatsApp',
          notes: `Análise via bot: ${aiResult.diagnostico}`,
          ai_summary: aiResult.proxima_acao,
        }).catch(() => {});
      }
    }

    // ═══════════════════════════════════════════════════════
    // 7. ABORDAGEM / PLAYBOOK / ESTRATÉGIA
    // ═══════════════════════════════════════════════════════
    else if (msgL.match(/^(abordagem|playbook|estratégia|estrategia|como abordar) /)) {
      const nome = msg.replace(/^(abordagem|playbook|estratégia|estrategia|como abordar) /i, '').trim();
      const client = findClient(nome);
      if (!client) {
        responseText = `❌ Cliente "${nome}" não encontrado.`;
      } else {
        const aiResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `Playbook de vendas COMPACTO para WhatsApp (máx 400 chars cada campo). Cliente: ${client.first_name}, Numerologia: ${client.numerology_number}, Tom: ${client.client_tone}, Status: ${client.status}, Pipeline: ${client.pipeline_stage}, Dores: ${(client.main_pains||[]).join(', ')}.`,
          response_json_schema: { type: 'object', properties: {
            abertura: { type: 'string' },
            pergunta_spin: { type: 'string' },
            objecao_resposta: { type: 'string' },
            fechamento: { type: 'string' },
          }}
        });
        responseText = `🎯 *PLAYBOOK: ${client.first_name}*\n\n`;
        responseText += `💬 *Abertura:*\n${aiResult.abertura}\n\n`;
        responseText += `❓ *SPIN:*\n${aiResult.pergunta_spin}\n\n`;
        responseText += `🛡️ *Objeção:*\n${aiResult.objecao_resposta}\n\n`;
        responseText += `🏁 *Fechamento:*\n${aiResult.fechamento}`;
      }
    }

    // ═══════════════════════════════════════════════════════
    // 8. PROPOSTA [CLIENTE] [PRODUTO]
    // ═══════════════════════════════════════════════════════
    else if (msgL.startsWith('proposta ')) {
      const parts = msg.replace(/proposta /i, '').split(' ');
      const nomeParte = parts.slice(0, 2).join(' ');
      const produto = parts.slice(2).join(' ') || '';
      const client = findClient(nomeParte) || findClient(parts[0]);
      if (!client) {
        responseText = `❌ Use: *proposta [nome cliente] [produto]*\nEx: proposta João VBC-50A`;
      } else {
        try {
          const result = await base44.asServiceRole.functions.invoke('generateWhatsAppProposal', {
            client_id: client.id,
            equipment_name: produto || client.equipment_interest || 'VBC-50A',
            include_roi: true,
          });
          responseText = result.message || result.proposal_text || `✅ Proposta gerada para ${client.first_name}! Acesse o CRM para visualizar.`;
        } catch {
          responseText = `⚠️ Proposta iniciada para ${client.first_name}. Acesse o CRM → Proposta IA para detalhes.`;
        }
      }
    }

    // ═══════════════════════════════════════════════════════
    // 9. FOLLOW-UP [CLIENTE]
    // ═══════════════════════════════════════════════════════
    else if (msgL.startsWith('followup ') || msgL.startsWith('follow-up ') || msgL.startsWith('follow up ')) {
      const nome = msg.replace(/^follow[\s-]?up /i, '').trim();
      const client = findClient(nome);
      if (!client) {
        responseText = `❌ Use: *followup [nome cliente]*`;
      } else {
        const score = client.purchase_score || 50;
        const estrategia = score >= 70 ? 'AGRESSIVA (14 dias)' : score >= 40 ? 'MODERADA (21 dias)' : 'NURTURING (30 dias)';
        // Criar tarefa de follow-up imediatamente
        const amanha = new Date(); amanha.setDate(amanha.getDate() + 1);
        await base44.asServiceRole.entities.Task.create({
          client_id: client.id,
          client_name: client.first_name,
          title: `Follow-up NR22 — ${client.first_name}`,
          priority: score >= 70 ? 'alta' : 'media',
          status: 'pendente',
          due_date: amanha.toISOString().split('T')[0],
          type: 'follow_up',
          auto_created: true,
        }).catch(() => {});
        responseText = `🔄 *FOLLOW-UP: ${client.first_name}*\n\n${scoreEmoji(score)} Score: ${score}% — Estratégia: *${estrategia}*\n\n✅ Tarefa criada para amanhã!\n\nDigite *análise ${client.first_name}* para script personalizado.`;
      }
    }

    // ═══════════════════════════════════════════════════════
    // 10. REATIVAR — Clientes inativos
    // ═══════════════════════════════════════════════════════
    else if (msgL.includes('reativar') || msgL.includes('inativos')) {
      const d30 = new Date(); d30.setDate(d30.getDate() - 30);
      const inativos = clients
        .filter(c => !c.last_contact_date || new Date(c.last_contact_date) < d30 || c.status === 'frio')
        .sort((a, b) => (b.purchase_score || 0) - (a.purchase_score || 0))
        .slice(0, 6);
      responseText = `🔔 *${inativos.length} CLIENTES PARA REATIVAR*\n\n`;
      inativos.forEach((c, i) => {
        const dias = c.last_contact_date
          ? Math.floor((Date.now() - new Date(c.last_contact_date)) / 86400000)
          : 'N/A';
        responseText += `${i+1}. *${c.first_name}* — ${c.city || 'N/A'}\n`;
        responseText += `   ${scoreEmoji(c.purchase_score||0)} Score: ${c.purchase_score||0}% | Inativo: ${dias} dias\n`;
        if (c.phone) responseText += `   💬 wa.me/${c.phone}\n`;
        responseText += '\n';
      });
    }

    // ═══════════════════════════════════════════════════════
    // 11. BUSCA CLÍNICAS EM CIDADE
    // ═══════════════════════════════════════════════════════
    else if (msgL.startsWith('busca ') || msgL.startsWith('clínicas ') || msgL.startsWith('clinicas ')) {
      const cidade = msg.replace(/^(busca|clínicas|clinicas) /i, '').trim();
      try {
        const result = await base44.asServiceRole.functions.invoke('buscaClinicasCidade', {
          cidade,
          limite: 8,
        });
        const clinicas = result.clinicas || result.results || [];
        responseText = `🔍 *CLÍNICAS: ${cidade.toUpperCase()}*\n\n`;
        clinicas.slice(0, 8).forEach((cl, i) => {
          responseText += `${i+1}. *${cl.nome || cl.name}*\n`;
          if (cl.telefone || cl.phone) responseText += `   📱 ${cl.telefone || cl.phone}\n`;
          if (cl.endereco || cl.address) responseText += `   📍 ${cl.endereco || cl.address}\n`;
          responseText += '\n';
        });
        responseText += `_Digite "cadastrar lead [nome]" para adicionar ao CRM_`;
      } catch {
        responseText = `🔍 Buscando clínicas em ${cidade}... Acesse o CRM → Busca Regional para resultados detalhados.`;
      }
    }

    // ═══════════════════════════════════════════════════════
    // 12. BUSCAR CLIENTE NO CRM
    // ═══════════════════════════════════════════════════════
    else if (msgL.match(/^(buscar|cliente|procurar) /)) {
      const term = msg.replace(/^(buscar|cliente|procurar) /i, '').trim().toLowerCase();
      const found = clients.filter(c =>
        c.first_name?.toLowerCase().includes(term) ||
        c.full_name?.toLowerCase().includes(term) ||
        c.clinic_name?.toLowerCase().includes(term) ||
        c.city?.toLowerCase().includes(term)
      ).slice(0, 6);
      if (found.length === 0) {
        responseText = `❌ Nenhum cliente com "${term}"`;
      } else {
        responseText = `✅ *${found.length} cliente(s) encontrado(s):*\n\n`;
        found.forEach((c, i) => {
          responseText += `${i+1}. *${c.first_name}* — ${c.clinic_name || 'N/A'} — ${c.city || 'N/A'}\n`;
          responseText += `   ${scoreEmoji(c.purchase_score||0)} ${c.purchase_score||0}% | ${c.status} | ${c.pipeline_stage}\n\n`;
        });
      }
    }

    // ═══════════════════════════════════════════════════════
    // 13. ANOTAR NOTA/VISITA
    // ═══════════════════════════════════════════════════════
    else if (msgL.match(/^(anota|anotar|nota) /)) {
      const match = msg.match(/(?:anota(?:r)?|nota)\s+(?:para |no |pra )?(.+?)[:]\s*(.+)/i);
      if (!match) {
        responseText = `❌ Use: *anota para [nome]: [sua nota]*`;
      } else {
        const client = findClient(match[1].trim());
        const nota = match[2].trim();
        if (!client) {
          responseText = `❌ Cliente "${match[1]}" não encontrado.`;
        } else {
          await Promise.all([
            base44.asServiceRole.entities.Interaction.create({
              client_id: client.id,
              client_name: client.first_name,
              type: 'whatsapp',
              direction: 'outbound',
              subject: 'Nota WhatsApp',
              notes: nota,
            }),
            base44.asServiceRole.entities.Client.update(client.id, {
              last_contact_date: today,
              notes: (client.notes || '') + `\n[WA ${new Date().toLocaleTimeString('pt-BR')}]: ${nota}`,
            }),
          ]);
          responseText = `✅ *Nota salva!*\nCliente: *${client.first_name}*\n"${nota}"`;
        }
      }
    }

    // ═══════════════════════════════════════════════════════
    // 14. CRIAR TAREFA
    // ═══════════════════════════════════════════════════════
    else if (msgL.match(/^(criar tarefa|nova tarefa|tarefa) /)) {
      const taskText = msg.replace(/^(criar tarefa|nova tarefa|tarefa) /i, '').trim();
      if (!taskText) {
        responseText = `❌ Use: *criar tarefa [descrição]*`;
      } else {
        const taskData = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `Extraia: título curto, prioridade (alta/media/baixa), cliente mencionado (se houver). Tarefa: "${taskText}"`,
          response_json_schema: { type: 'object', properties: {
            title: { type: 'string' }, priority: { type: 'string' }, client_mention: { type: 'string' }
          }}
        });
        const due = new Date(); due.setDate(due.getDate() + 1);
        let clientId = 'geral'; let clientName = '';
        if (taskData.client_mention) {
          const found = findClient(taskData.client_mention);
          if (found) { clientId = found.id; clientName = found.first_name; }
        }
        await base44.asServiceRole.entities.Task.create({
          client_id: clientId, client_name: clientName,
          title: taskData.title, priority: taskData.priority || 'media',
          status: 'pendente', due_date: due.toISOString().split('T')[0],
          type: 'outro', auto_created: true,
        });
        responseText = `✅ *Tarefa criada!*\n📋 ${taskData.title}\n⚡ ${taskData.priority || 'media'} prioridade${clientName ? `\n👤 ${clientName}` : ''}`;
      }
    }

    // ═══════════════════════════════════════════════════════
    // 15. TAREFAS PENDENTES
    // ═══════════════════════════════════════════════════════
    else if (msgL.match(/^tarefas|minhas tarefas/)) {
      const pending = tasks.filter(t => t.status === 'pendente').slice(0, 8);
      const late = pending.filter(t => t.due_date && t.due_date < today);
      responseText = `✅ *TAREFAS (${pending.length} pendentes)*\n⚠️ Atrasadas: ${late.length}\n\n`;
      pending.forEach((t, i) => {
        const atrasada = t.due_date && t.due_date < today;
        responseText += `${i+1}. ${atrasada ? '⚠️' : '📋'} ${t.title}\n`;
        responseText += `   ${t.client_name || 'Geral'} · ${t.due_date || 'S/ data'} · ${t.priority}\n\n`;
      });
    }

    // ═══════════════════════════════════════════════════════
    // 16. CLIENTES QUENTES
    // ═══════════════════════════════════════════════════════
    else if (msgL.match(/quente|hot leads|leads quentes/)) {
      const hot = clients.filter(c => c.status === 'quente').slice(0, 8);
      responseText = `🔥 *${hot.length} CLIENTES QUENTES*\n\n`;
      if (hot.length === 0) {
        responseText += `Nenhum cliente quente no momento.\nDigite *análise [nome]* para recalcular scores.`;
      } else {
        hot.forEach((c, i) => {
          responseText += `${i+1}. *${c.first_name}* — ${c.city || 'N/A'}\n`;
          responseText += `   🔥 Score: ${c.purchase_score||0}% | ${c.pipeline_stage}\n`;
          if (c.phone) responseText += `   wa.me/${c.phone}\n`;
          responseText += '\n';
        });
      }
    }

    // ═══════════════════════════════════════════════════════
    // 17. RESUMO DO DIA / HOJE
    // ═══════════════════════════════════════════════════════
    else if (msgL.match(/^(resumo|hoje|bom dia|boa tarde|dia)$/) || msgL === 'r') {
      const todayVisits = visits.filter(v => v.scheduled_date?.startsWith(today));
      const pendingTasks = tasks.filter(t => t.status === 'pendente');
      const lateTasks = pendingTasks.filter(t => t.due_date && t.due_date < today);
      const hot = clients.filter(c => c.status === 'quente');
      const todaySales = sales.filter(s => s.sale_date === today);

      responseText = `☀️ *BOM DIA, NATHAN!*\n📅 ${todayStr}\n\n`;
      responseText += `━━━━━━━━━━━━━━━\n`;
      responseText += `🔥 Clientes quentes: *${hot.length}*\n`;
      responseText += `✅ Tarefas: *${pendingTasks.length}*${lateTasks.length > 0 ? ` ⚠️ ${lateTasks.length} atrasadas` : ''}\n`;
      responseText += `📍 Visitas hoje: *${todayVisits.length}*\n`;
      responseText += `💰 Vendas hoje: *${todaySales.length}*\n`;
      responseText += `👥 CRM: *${clients.length} clientes*\n`;
      responseText += `━━━━━━━━━━━━━━━\n\n`;
      responseText += `*Comandos rápidos:*\n_rota · quentes · tarefas · reativar · ajuda_`;
    }

    // ═══════════════════════════════════════════════════════
    // 18. PERFORMANCE / RELATÓRIO
    // ═══════════════════════════════════════════════════════
    else if (msgL.match(/^(performance|relatório|relatorio|report)/)) {
      const d30 = new Date(); d30.setDate(d30.getDate() - 30);
      const recentSales = sales.filter(s => new Date(s.sale_date) >= d30);
      const revenue = recentSales.reduce((sum, s) => sum + (s.sale_value || 0), 0);
      const recentVisits = visits.filter(v => new Date(v.scheduled_date) >= d30);
      const recentTasks = tasks.filter(t => t.status === 'concluida');
      responseText = `📊 *PERFORMANCE — 30 DIAS*\n\n`;
      responseText += `💰 Vendas: *${recentSales.length}* → R$ ${revenue.toLocaleString('pt-BR')}\n`;
      responseText += `📈 Ticket médio: R$ ${recentSales.length ? Math.round(revenue / recentSales.length).toLocaleString('pt-BR') : 0}\n`;
      responseText += `📍 Visitas: ${recentVisits.length}\n`;
      responseText += `✅ Tarefas concluídas: ${recentTasks.length}\n`;
      responseText += `🔥 Quentes: ${clients.filter(c => c.status === 'quente').length}\n`;
      responseText += `🌡️ Mornos: ${clients.filter(c => c.status === 'morno').length}\n`;
      responseText += `❄️ Frios: ${clients.filter(c => c.status === 'frio').length}`;
    }

    // ═══════════════════════════════════════════════════════
    // 19. CADASTRAR LEAD
    // ═══════════════════════════════════════════════════════
    else if (msgL.match(/^(cadastrar lead|novo lead|cadastrar cliente) /)) {
      const info = msg.replace(/^(cadastrar lead|novo lead|cadastrar cliente) /i, '').trim();
      const parsed = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `Extraia dados de: "${info}". Retorne: nome, empresa, cidade, telefone, interesse.`,
        response_json_schema: { type: 'object', properties: {
          nome: { type: 'string' }, empresa: { type: 'string' },
          cidade: { type: 'string' }, telefone: { type: 'string' }, interesse: { type: 'string' }
        }}
      });
      const lead = await base44.asServiceRole.entities.Lead.create({
        full_name: parsed.nome || info,
        company: parsed.empresa || '',
        city: parsed.cidade || '',
        phone: parsed.telefone || '',
        interest: parsed.interesse || '',
        source: 'whatsapp',
        stage: 'novo',
        status: 'novo',
      });
      responseText = `✅ *Lead cadastrado!*\n👤 ${parsed.nome || info}${parsed.empresa ? `\n🏥 ${parsed.empresa}` : ''}${parsed.cidade ? `\n🏙️ ${parsed.cidade}` : ''}`;
    }

    // ═══════════════════════════════════════════════════════
    // 20. INTELIGÊNCIA DE MERCADO
    // ═══════════════════════════════════════════════════════
    else if (msgL.match(/mercado|concorrente|idexx|mindray|primori|mobivet|heska/)) {
      try {
        const result = await base44.asServiceRole.functions.invoke('marketIntelligenceMonitor', {
          action: 'market_scan', region: 'São Paulo',
        });
        const scan = result.scan || {};
        responseText = `📡 *INTELIGÊNCIA DE MERCADO*\n\n`;
        responseText += `📊 Sentimento: *${scan.market_sentiment || 'neutro'}*\n\n`;
        responseText += `📰 *Notícias:*\n`;
        (scan.top_news || []).slice(0, 2).forEach(n => responseText += `• ${n}\n`);
        responseText += `\n⚔️ *Concorrentes:*\n`;
        (scan.competitor_activity || []).slice(0, 3).forEach(c => {
          responseText += `• *${c.competitor}*: ${c.threat_level} — ${c.counter_argument}\n`;
        });
      } catch {
        responseText = `📡 Inteligência de mercado processando. Acesse o CRM → Market Intelligence.`;
      }
    }

    // ═══════════════════════════════════════════════════════
    // 21. AJUDA / COMANDOS
    // ═══════════════════════════════════════════════════════
    else if (msgL.match(/ajuda|help|comando|menu/)) {
      responseText = `🤖 *NR22 MASTER — COMANDOS*\n\n`;
      responseText += `📅 *Agenda/Rota:*\n_rota · agenda [cidade] · navegar [nome]_\n\n`;
      responseText += `👤 *Clientes:*\n_detalhes [nome] · análise [nome] · buscar [nome]_\n\n`;
      responseText += `🎯 *Vendas:*\n_abordagem [nome] · playbook [nome] · proposta [nome]_\n\n`;
      responseText += `🔄 *Follow-up:*\n_followup [nome] · reativar_\n\n`;
      responseText += `📝 *Registros:*\n_anota para [nome]: [texto] · criar tarefa [texto]_\n\n`;
      responseText += `📊 *Relatórios:*\n_resumo · quentes · tarefas · performance_\n\n`;
      responseText += `🔍 *Busca:*\n_busca [cidade] · mercado · cadastrar lead [dados]_\n\n`;
      responseText += `📍 *GPS:*\n_gps lat:-22.21 lng:-49.94_`;
    }

    // ═══════════════════════════════════════════════════════
    // 22. IA LIVRE — Qualquer pergunta (econômica)
    // ═══════════════════════════════════════════════════════
    else {
      const hot = clients.filter(c => c.status === 'quente').length;
      const pendingT = tasks.filter(t => t.status === 'pendente').length;
      const todayV = visits.filter(v => v.scheduled_date?.startsWith(today)).length;

      const aiResp = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `Você é o Assistente NR22 Master de Vendas Seamaty. Responda em PT-BR, máx 300 chars, prático e direto.
CONTEXTO CRM: Data=${new Date().toLocaleDateString('pt-BR')}, Quentes=${hot}, Tarefas pendentes=${pendingT}, Visitas hoje=${todayV}, Total clientes=${clients.length}.
PERGUNTA: ${msg}
Se mencionar cliente específico, use o CRM. Se técnica de vendas, aplique SPIN/Challenger/Cialdini. Se produto Seamaty, use: VBC-50A, SMT-120VP, VG1, VG2, VQ1, Vi1, QT3.`,
      });
      responseText = aiResp || `❓ Não entendi. Digite *ajuda* para ver os comandos.`;
    }

    return Response.json({
      success: true,
      message: responseText,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});
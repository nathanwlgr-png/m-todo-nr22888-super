import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ── DADOS TÉCNICOS OFICIAIS SEAMATY — FONTE ÚNICA DE VERDADE ──
// NUNCA inventar parâmetros, volumes ou preços fora deste objeto.
const EQUIPAMENTOS = {
  'SMT-120VP': {
    nome: 'SMT-120VP', tipo: 'bioquímica', parametros: 'até 24 parâmetros',
    tempo: '12 min', volume: '100 µL', bloqueado: false,
  },
  'VG1': {
    nome: 'VG1', tipo: 'hemogás', parametros: '17 parâmetros',
    tempo: '4 min', volume: '100 µL', bloqueado: false,
    // CORRIGIDO: volume era 65 µL — agora 100 µL conforme dado oficial
  },
  'VI1': {
    nome: 'VI1', tipo: 'imuno', parametros: null, // NÃO inventar quantidade
    tempo: '10 min', volume: null, // NÃO citar volume
    bloqueado: true, motivo_bloqueio: 'Preço pendente de validação — Nathan/Karoline. Não gerar proposta com valores.',
  },
  'VBC50A': {
    nome: 'VBC50A', tipo: 'hematologia 5 partes',
    parametros: 'hematologia completa 5 partes', // NÃO afirmar "26 parâmetros" sem fonte validada
    tempo: '3-5 min', volume: '20 µL', bloqueado: false,
  },
  'QT3': {
    nome: 'QT3', tipo: 'bioquímica rápida', parametros: 'rotores circulares e setorizados',
    tempo: '3–8 min', volume: null, // NÃO inventar volume
    bloqueado: false,
  },
  'VG2': {
    nome: 'VG2', tipo: 'hemogás + imuno', parametros: 'combinado',
    tempo: null, volume: null, // NÃO inventar detalhes não validados
    bloqueado: false,
  },
  '3DX': {
    nome: '3DX', tipo: 'hemogás + imuno + bioquímica', parametros: 'combinado 3 em 1',
    tempo: null, volume: null, // NÃO inventar detalhes não validados
    bloqueado: false,
  },
  'VQ1': {
    nome: 'VQ1', tipo: 'PCR', parametros: 'diagnóstico molecular',
    tempo: '~40 min', volume: null, bloqueado: false,
  },
};

// PROIBIDO em todo o sistema:
// - citar 36 parâmetros
// - VG1 com 65 µL (era errado, corrigido para 100 µL)
// - VI1 com volume, preço ou quantidade de parâmetros inventada
// - VBC50A com "26 parâmetros" sem fonte oficial validada
// - logo Compete em artes Seamaty

const DIFERENCIAIS = `✅ 25 MESES DE GARANTIA (mercado: 12 meses)
✅ MANUTENÇÃO VITALÍCIA INCLUSA
✅ BONIFICAÇÃO EM INSUMOS (nunca desconto no equipamento)
✅ ISO 13485:2016
✅ COMODATO a partir de 40-60 exames/mês`;

// ── Comandos Hunter ──
const COMANDOS_HUNTER = ['/hunter', '/hunter_rota', '/leads_quentes', '/mapa_hunter', '/investigar_clinica', '/criar_lead_hunter'];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const {
      comando,
      client_search,
      client_id,   // suporte direto a ID
      clinic_name, // suporte a nome de clínica
      cidade,      // suporte a filtro por cidade
      equipamento,
      publico = 'veterinario',
      formato = 'whatsapp_curto',
      source,      // 'telegram' ou outros
    } = body;

    const cmdNorm = (comando || '').trim().toLowerCase().replace(/^\//, '');

    // ── COMANDOS SEM CLIENTE ─────────────────────────────────────────────────
    if (cmdNorm === 'quentes' || cmdNorm === '/quentes') {
      const todos = await base44.asServiceRole.entities.Client.filter({ status: 'quente' }, '-purchase_score', 10).catch(() => []);
      const lista = todos.map(c =>
        `🔥 *${c.clinic_name || c.first_name || 'Sem nome'}* — ${c.city || '?'} | Score: ${c.purchase_score || 0} | ${c.equipment_interest || 'S/equip'}`
      ).join('\n');
      return Response.json({
        success: true,
        source,
        comando: cmdNorm,
        resultado: `🎯 *CLIENTES QUENTES (${todos.length})*\n\n${lista || 'Nenhum cliente quente encontrado.'}\n\n/proposta [nome] para gerar proposta`,
        duration_ms: 0,
        comandos_disponiveis: Object.keys(getComandos()),
        nota: 'Nenhuma mensagem enviada externamente sem aprovação do Nathan.',
      });
    }

    if (cmdNorm === 'visualizacoes') {
      const logs = await base44.asServiceRole.entities.AIInteractionLog.list('-created_date', 5).catch(() => []);
      const resumo = logs.map(l => `📄 ${l.client_name || 'S/cliente'} — ${l.action_type} — ${new Date(l.created_date).toLocaleDateString('pt-BR')}`).join('\n');
      return Response.json({
        success: true, source, comando: cmdNorm,
        resultado: `👁️ *ÚLTIMAS PROPOSTAS/ACESSOS*\n\n${resumo || 'Sem registros recentes.'}`,
        nota: 'Nenhuma mensagem enviada externamente sem aprovação do Nathan.',
      });
    }

    if (COMANDOS_HUNTER.includes('/' + cmdNorm)) {
      return Response.json({
        success: true, source, comando: cmdNorm,
        resultado: `🕵️ *HUNTER ATIVO*\nComando: /${cmdNorm}\nCidade: ${cidade || 'não informada'}\n\nUse /investigar_clinica [nome] [cidade] para pesquisa completa ou acesse ModoCacaComercial no app.`,
        hunter_status: 'ATIVO',
        nota: 'Hunter nunca segue perfis ou envia mensagens sozinho. Sugestões apenas para Nathan aprovar.',
      });
    }

    // ── CORRIGIR BUSCA VI1 COM COMANDO TELEGRAM ──────────────────────────────
    const equipKey = (equipamento || '').toUpperCase().replace(/-/g, '').replace(/\s/g, '');
    if (equipKey === 'VI1') {
      const vi1 = EQUIPAMENTOS['VI1'];
      const msg = source === 'telegram'
        ? `⚠️ Proposta VI1 BLOQUEADA — preço não validado por Nathan/Karoline. Não enviar proposta com valores antes da validação.`
        : `VI1 bloqueado: ${vi1.motivo_bloqueio}`;
      return Response.json({
        success: source === 'telegram',
        source, comando: cmdNorm,
        resultado: msg,
        bloqueado: true,
        motivo: vi1.motivo_bloqueio,
        equipamento: 'VI1',
        acao: 'Aguardar validação de preço com Nathan/Karoline.',
        nota: 'Nenhuma mensagem enviada externamente sem aprovação do Nathan.',
        comandos_disponiveis: Object.keys(getComandos()),
      });
    }

    // ── IDENTIFICAR CLIENTE ───────────────────────────────────────────────────
    let client = null;
    let confianca = 100;

    // Busca por ID direto
    if (client_id) {
      const todos = await base44.asServiceRole.entities.Client.list('-updated_date', 200).catch(() => []);
      client = todos.find(c => c.id === client_id) || null;
      if (!client) {
        return Response.json({
          success: false,
          erro: `Cliente com ID "${client_id}" não encontrado no CRM.`,
          acao: 'Verifique o ID do cliente.',
        });
      }
    }

    // Busca textual multi-campo
    if (!client && (client_search || clinic_name)) {
      const busca = (client_search || clinic_name || '').trim().toLowerCase();
      const todos = await base44.asServiceRole.entities.Client.list('-updated_date', 200).catch(() => []);

      const matches = todos.filter(c => {
        const fields = [
          c.first_name, c.full_name, c.clinic_name,
          c.phone, c.instagram_handle, c.city,
        ].map(f => (f || '').toLowerCase());
        return fields.some(f => f.includes(busca));
      });

      if (matches.length === 0) {
        return Response.json({
          success: false,
          erro: `Cliente "${client_search || clinic_name}" não encontrado no CRM.`,
          acao: 'Cadastre o cliente em /Clients ou verifique o nome.',
        });
      }

      if (matches.length > 1) {
        // Filtrar por cidade se informada
        const porCidade = cidade
          ? matches.filter(c => (c.city || '').toLowerCase().includes(cidade.toLowerCase()))
          : matches;

        if (porCidade.length === 1) {
          client = porCidade[0];
        } else {
          return Response.json({
            success: false,
            erro: `Múltiplos clientes encontrados para "${busca}":`,
            opcoes: (porCidade.length > 1 ? porCidade : matches).slice(0, 5).map(c => ({
              id: c.id, nome: c.first_name || c.full_name,
              clinica: c.clinic_name, cidade: c.city,
            })),
            acao: 'Especifique o client_id para continuar.',
            confianca: 60,
            homonimo_risco: true,
          });
        }
      } else {
        client = matches[0];
      }

      // Validação de confiança
      if (!client.phone) confianca -= 15;
      if (!client.city) confianca -= 10;
      if (!client.clinic_name) confianca -= 10;

      if (confianca < 95) {
        return Response.json({
          success: false,
          aviso: `Confiança de identificação: ${confianca}%. Confirmar antes de gerar proposta.`,
          cliente: { id: client.id, nome: client.first_name || client.full_name, clinica: client.clinic_name, cidade: client.city, telefone: client.phone },
          acao: 'Responda com client_id confirmado para continuar.',
          confianca,
        });
      }
    }

    // ── COMANDOS QUE PRECISAM DE CLIENTE ─────────────────────────────────────

    if (cmdNorm === 'score' || cmdNorm === '/score') {
      if (!client) return Response.json({ success: false, erro: 'Informe o nome do cliente para consultar score.', acao: '/score [nome]' });
      const resultado = [
        `📊 *SCORE — ${client.clinic_name || client.first_name}*`,
        `📍 ${client.city || 'cidade não informada'}`,
        `🌡️ Status: ${client.status || 'morno'}`,
        `💰 Score Compra: ${client.purchase_score || 0}/100`,
        `❤️ Health Score: ${client.health_score || 0}/100`,
        `🏁 Funil: ${client.pipeline_stage || 'lead'}`,
        `📅 Último contato: ${client.last_contact_date || 'não registrado'}`,
        `🔗 Cliente360: https://nr22888.base44.app/ClienteDetalhe360?id=${client.id}`,
      ].join('\n');
      return Response.json({ success: true, source, comando: cmdNorm, resultado, nota: 'Nenhuma mensagem enviada externamente sem aprovação do Nathan.' });
    }

    if (cmdNorm === 'cliente360') {
      if (!client) return Response.json({ success: false, erro: 'Informe o nome do cliente.', acao: '/cliente360 [nome]' });
      return Response.json({
        success: true, source, comando: cmdNorm,
        resultado: `🔗 *${client.clinic_name || client.first_name}*\nhttps://nr22888.base44.app/ClienteDetalhe360?id=${client.id}`,
        nota: 'Nenhuma mensagem enviada externamente sem aprovação do Nathan.',
      });
    }

    if (cmdNorm === 'followup') {
      if (!client) return Response.json({ success: false, erro: 'Informe o nome do cliente para follow-up.', acao: '/followup [nome]' });
      await base44.asServiceRole.entities.Task.create({
        client_id: client.id,
        client_name: client.clinic_name || client.first_name,
        title: `Follow-up — ${client.clinic_name || client.first_name}`,
        type: 'follow_up', priority: 'alta', status: 'pendente',
        due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        auto_created: true,
      }).catch(() => {});
      return Response.json({
        success: true, source, comando: cmdNorm,
        resultado: `✅ Follow-up criado para *${client.clinic_name || client.first_name}* — vence em 2 dias.\n🔗 https://nr22888.base44.app/ClienteDetalhe360?id=${client.id}`,
        nota: 'Nenhuma mensagem enviada externamente sem aprovação do Nathan.',
      });
    }

    if (cmdNorm === 'copiar') {
      if (!client) return Response.json({ success: false, erro: 'Informe o nome do cliente.', acao: '/copiar [nome]' });
      const logs = await base44.asServiceRole.entities.AIInteractionLog.filter({ client_id: client.id }, '-created_date', 1).catch(() => []);
      const ultima = logs[0];
      return Response.json({
        success: true, source, comando: cmdNorm,
        resultado: ultima
          ? `📋 *Última mensagem gerada para ${client.clinic_name || client.first_name}:*\n\n${ultima.ai_response || 'Sem conteúdo salvo.'}`
          : `Nenhuma mensagem salva para ${client.clinic_name || client.first_name} ainda.`,
        nota: 'Nenhuma mensagem enviada externamente sem aprovação do Nathan.',
      });
    }

    if (cmdNorm === 'aprovar' || cmdNorm === 'reprovar') {
      if (!client) return Response.json({ success: false, erro: 'Informe o nome do cliente.', acao: `/${cmdNorm} [nome]` });
      const pendentes = await base44.asServiceRole.entities.PendingMessage.filter({ client_id: client.id }, '-created_date', 1).catch(() => []);
      const msg = pendentes[0];
      if (!msg) return Response.json({ success: false, erro: 'Nenhuma mensagem pendente encontrada para este cliente.' });
      const novoStatus = cmdNorm === 'aprovar' ? 'aprovado' : 'reprovado';
      await base44.asServiceRole.entities.PendingMessage.update(msg.id, { status: novoStatus }).catch(() => {});
      return Response.json({
        success: true, source, comando: cmdNorm,
        resultado: `${cmdNorm === 'aprovar' ? '✅ Mensagem APROVADA' : '❌ Mensagem REPROVADA'} para *${client.clinic_name || client.first_name}*.\n⚠️ Aprovação não envia automaticamente. Nathan deve copiar e enviar manualmente.`,
        nota: 'Nenhuma mensagem enviada externamente sem aprovação do Nathan.',
      });
    }

    // ── PROPOSTA / MATERIAL / MSG ─────────────────────────────────────────────
    const ehProposta = ['proposta', 'msg', 'material', 'nova_versao'].includes(cmdNorm);
    if (!ehProposta) {
      return Response.json({
        success: true, source, comando: cmdNorm,
        resultado: `Comando "${cmdNorm}" não reconhecido ou sem ação definida. Use:\n${Object.entries(getComandos()).map(([k, v]) => `${k} — ${v}`).join('\n')}`,
        comandos_disponiveis: Object.keys(getComandos()),
        nota: 'Nenhuma mensagem enviada externamente sem aprovação do Nathan.',
      });
    }

    // Selecionar equipamento (sem VI1 liberado)
    const equipKeyFinal = (equipamento || client?.equipment_interest || 'VG2').toUpperCase().replace(/-/g, '').replace(/\s/g, '');
    const equip = Object.values(EQUIPAMENTOS).find(e => e.nome.replace(/-/g, '').toUpperCase() === equipKeyFinal) || EQUIPAMENTOS['VG2'];

    if (equip.bloqueado) {
      return Response.json({
        success: false, bloqueado: true,
        motivo: equip.motivo_bloqueio,
        equipamento: equip.nome,
        acao: 'Aguardar validação de preço com Nathan/Karoline antes de gerar proposta definitiva.',
        nota: 'Nenhuma mensagem enviada externamente sem aprovação do Nathan.',
      });
    }

    const nomeCliente = client?.first_name || client?.full_name || client_search || 'Doutor(a)';
    const clinica = client?.clinic_name || 'sua clínica';
    const cidadeCliente = client?.city || '';

    // Montar linha de dados técnicos segura (nunca inventar)
    const linhasTecnicas = [
      `🔬 *${equip.tipo}*`,
      equip.parametros ? `▸ ${equip.parametros}` : null,
      equip.tempo ? `▸ Resultado em ${equip.tempo}` : null,
      equip.volume ? `▸ Volume: ${equip.volume}` : null,
    ].filter(Boolean).join('\n');

    let conteudo = '';

    if (cmdNorm === 'proposta' || cmdNorm === 'msg' || cmdNorm === 'nova_versao') {
      if (formato === 'whatsapp_curto') {
        conteudo = `Olá, ${nomeCliente}! 👋\n\nSou o Nathan da SEAMATY Brasil.\n\nVi que ${clinica}${cidadeCliente ? ` em ${cidadeCliente}` : ''} pode se beneficiar muito com o *${equip.nome}*.\n\n${linhasTecnicas}\n\n${DIFERENCIAIS}\n\n📊 Posso te mostrar o ROI real pra sua realidade?\n\n⏰ 5 minutos de conversa pode mudar seu fluxo diagnóstico.\n\n💬 Quando você tem uns minutinhos essa semana?`;
      } else if (formato === 'whatsapp_tecnico') {
        conteudo = `Dr(a). ${nomeCliente},\n\nA Seamaty desenvolveu o *${equip.nome}* especificamente para o fluxo veterinário:\n\n${linhasTecnicas}\n\n${DIFERENCIAIS}\n\n📎 Posso encaminhar o material técnico completo?\n\nAguardo seu retorno, ${nomeCliente}.`;
      } else {
        conteudo = `*PROPOSTA TÉCNICA — SEAMATY BRASIL*\n\nCliente: ${nomeCliente} | ${clinica}\n\n*Equipamento:* ${equip.nome}\n${linhasTecnicas}\n\n${DIFERENCIAIS}\n\n*Preço:* [CONFIRMAR COM NATHAN ANTES DE ENVIAR]\n\n⚠️ Esta proposta precisa da aprovação do Nathan antes de ser enviada ao cliente.`;
      }
    }

    if (cmdNorm === 'material') {
      if (publico === 'veterinario') {
        conteudo = `*MATERIAL TÉCNICO — ${equip.nome} | SEAMATY BRASIL*\n\n🔬 APLICAÇÃO CLÍNICA:\n${linhasTecnicas}\n\n⚕️ BENEFÍCIOS NO FLUXO HOSPITALAR:\n▸ Resultado rápido → decisão clínica imediata\n▸ Reduz dependência de laboratório terceirizado\n▸ Integra ao prontuário digital\n\n📊 DIFERENCIAIS:\n${DIFERENCIAIS}`;
      } else if (publico === 'gestor') {
        conteudo = `*ROI — ${equip.nome} | SEAMATY BRASIL*\n\n💰 PARA O GESTOR:\n▸ Redução de custo com terceirização\n▸ Aumento de receita com exames in-house\n▸ Retenção de tutor: resultado na hora = menos cancelamento\n▸ Recorrência: insumos mensais garantidos\n\n📈 DIFERENCIAIS:\n${DIFERENCIAIS}\n\n⏱️ ROI estimado: 8-12 meses (varia por volume)`;
      } else {
        conteudo = `*Por que exames rápidos fazem diferença? 🐾*\n\nQuando seu pet precisa de atenção urgente, cada minuto conta.\n\nCom o ${equip.nome}, o veterinário tem o resultado em ${equip.tempo || 'poucos minutos'} — sem esperar laboratório externo.\n\n✅ Decisão mais rápida\n✅ Tratamento iniciado antes\n✅ Mais segurança para seu animal\n\nPergunte na sua clínica! 🏥`;
      }
    }

    // ── GERAR LINK RASTREÁVEL ─────────────────────────────────────────────────
    const clientId = client?.id || 'sem_cliente';
    const trackingUrl = `https://nr22888.base44.app/ProposalGenerator?client_id=${clientId}&utm_source=telegram&utm_medium=${publico}&utm_campaign=proposta_${equip.nome.toLowerCase()}&utm_content=${Date.now()}`;

    // ── CRIAR FOLLOW-UP SE CLIENTE IDENTIFICADO ──────────────────────────────
    if (client && (cmdNorm === 'proposta' || cmdNorm === 'followup')) {
      await base44.asServiceRole.entities.Task.create({
        client_id: client.id,
        client_name: client.clinic_name || client.first_name,
        title: `Follow-up ${equip.nome} — ${client.clinic_name || client.first_name}`,
        type: 'follow_up', priority: 'alta', status: 'pendente',
        due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        auto_created: true,
      }).catch(() => {});
    }

    // ── RESUMO TELEGRAM ───────────────────────────────────────────────────────
    const resumoTelegram = client ? [
      `🎯 *${client.clinic_name || client.first_name}*`,
      `📍 ${client.city || 'cidade não informada'}`,
      `📱 ${client.phone || 'sem telefone'}`,
      `🔬 Equipamento: *${equip.nome}*`,
      `📊 Score: ${client.purchase_score || 0} | Status: ${client.status || 'morno'}`,
      `🏁 Funil: ${client.pipeline_stage || 'lead'}`,
      `🔗 Cliente360: https://nr22888.base44.app/ClienteDetalhe360?id=${client.id}`,
      `🔗 Link rastreável: ${trackingUrl}`,
    ].join('\n') : `ℹ️ Cliente não identificado — busca: "${client_search}"`;

    // ── LOG ───────────────────────────────────────────────────────────────────
    await base44.asServiceRole.entities.AIInteractionLog.create({
      action_type: 'briefing',
      user_message: `[executarComandoNathanSupremo] cmd=${cmdNorm} cliente=${client_search || client_id} equip=${equip.nome}`,
      ai_response: conteudo.slice(0, 1000),
      client_id: client?.id || null,
      client_name: client?.clinic_name || client?.first_name || null,
      source: 'central_ia_master',
      success: true,
    }).catch(() => {});

    return Response.json({
      success: true, comando: cmdNorm, source,
      equipamento: { nome: equip.nome, tipo: equip.tipo, parametros: equip.parametros, tempo: equip.tempo, bloqueado: equip.bloqueado },
      cliente: client ? { id: client.id, nome: client.first_name || client.full_name, clinica: client.clinic_name, cidade: client.city, telefone: client.phone, score: client.purchase_score } : null,
      conteudo,
      resumo_telegram: resumoTelegram,
      tracking_url: trackingUrl,
      confianca,
      follow_up_criado: !!(client && cmdNorm === 'proposta'),
      aprovacao_pendente: true,
      aviso: '⚠️ Nenhum conteúdo deve ser enviado ao cliente sem aprovação explícita do Nathan.',
      nota: 'Nenhuma mensagem enviada externamente sem aprovação do Nathan.',
      comandos_disponiveis: Object.keys(getComandos()),
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function getComandos() {
  return {
    '/proposta [cliente]': 'Proposta personalizada',
    '/material [cliente] [equip]': 'Material técnico',
    '/msg [cliente]': 'Mensagem WhatsApp pronta',
    '/score [cliente]': 'Score e análise',
    '/quentes': 'Top clientes quentes',
    '/visualizacoes': 'Propostas abertas',
    '/followup [cliente]': 'Criar follow-up',
    '/aprovar [cliente]': 'Aprovar mensagem',
    '/reprovar [cliente]': 'Reprovar mensagem',
    '/nova_versao [cliente]': 'Nova versão de mensagem',
    '/copiar [cliente]': 'Copiar última mensagem',
    '/cliente360 [cliente]': 'Link Cliente360',
    '/hunter [cidade]': 'Caçar leads na cidade',
    '/investigar_clinica [nome] [cidade]': 'Investigar clínica',
  };
}
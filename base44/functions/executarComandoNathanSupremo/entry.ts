import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// ── Dados técnicos OFICIAIS Seamaty — NUNCA inventar fora daqui ──
const EQUIPAMENTOS = {
  'SMT-120VP': { nome: 'SMT-120VP', tipo: 'bioquímica', parametros: 'até 24 parâmetros', tempo: '12 min', volume: '100 µL', bloqueado: false },
  'VG1':       { nome: 'VG1',       tipo: 'hemogás',    parametros: '17 parâmetros',      tempo: '4 min',  volume: '100 µL', bloqueado: false },
  'VI1':       { nome: 'VI1',       tipo: 'imuno',      parametros: '10 parâmetros',       tempo: '10 min', volume: 'não citar', bloqueado: true, motivo_bloqueio: 'Preço pendente de validação — Nathan/Karoline' },
  'VBC50A':    { nome: 'VBC50A',    tipo: 'hematologia 5 partes', parametros: '26 parâmetros', tempo: '3-5 min', volume: '20 µL', bloqueado: false },
  'QT3':       { nome: 'QT3',       tipo: 'bioquímica rápida', parametros: 'até 24 parâmetros', tempo: '3-8 min', volume: 'rotores', bloqueado: false },
  'VG2':       { nome: 'VG2',       tipo: 'hemogás + imuno', parametros: 'combinado', tempo: 'variável', volume: 'variável', bloqueado: false },
  '3DX':       { nome: '3DX',       tipo: 'hemogás + imuno + bioquímica', parametros: 'combinado 3 em 1', tempo: 'variável', volume: 'variável', bloqueado: false },
  'VQ1':       { nome: 'VQ1',       tipo: 'PCR',        parametros: 'molecular',           tempo: '~40 min', volume: 'variável', bloqueado: false },
};

const DIFERENCIAIS = `✅ 25 MESES DE GARANTIA (mercado: 12 meses)
✅ MANUTENÇÃO VITALÍCIA INCLUSA
✅ BONIFICAÇÃO EM INSUMOS (nunca desconto no equipamento)
✅ ISO 13485:2016
✅ COMODATO a partir de 40-60 exames/mês`;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { comando, client_search, equipamento, publico = 'veterinario', formato = 'whatsapp_curto' } = body;

    // ── 1. IDENTIFICAR CLIENTE ──────────────────────────────────────────────
    let client = null;
    let confianca = 100;
    let homonimoRisco = false;

    if (client_search) {
      const busca = client_search.trim().toLowerCase();
      const todos = await base44.asServiceRole.entities.Client.list('-updated_date', 50).catch(() => []);

      // Busca por nome exato ou parcial
      const matches = todos.filter(c =>
        (c.first_name || '').toLowerCase().includes(busca) ||
        (c.full_name || '').toLowerCase().includes(busca) ||
        (c.clinic_name || '').toLowerCase().includes(busca)
      );

      if (matches.length === 0) {
        return Response.json({
          success: false,
          erro: `Cliente "${client_search}" não encontrado no CRM.`,
          acao: 'Cadastre o cliente em /Clients antes de gerar proposta.',
        });
      }

      if (matches.length > 1) {
        homonimoRisco = true;
        confianca = 60;
        return Response.json({
          success: false,
          erro: `Múltiplos clientes encontrados para "${client_search}":`,
          opcoes: matches.slice(0, 5).map(c => ({
            id: c.id,
            nome: c.first_name || c.full_name,
            clinica: c.clinic_name,
            cidade: c.city,
          })),
          acao: 'Especifique o ID do cliente para continuar.',
          confianca,
          homonimo_risco: homonimoRisco,
        });
      }

      client = matches[0];
      // Validação de confiança: telefone + cidade + clínica
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

    // ── 2. SELECIONAR EQUIPAMENTO ───────────────────────────────────────────
    const equipKey = (equipamento || client?.equipment_interest || 'VG2').toUpperCase().replace('-', '').replace(' ', '');
    const equip = Object.values(EQUIPAMENTOS).find(e => e.nome.replace('-', '').toUpperCase() === equipKey) || EQUIPAMENTOS['VG2'];

    if (equip.bloqueado) {
      return Response.json({
        success: false,
        bloqueado: true,
        motivo: equip.motivo_bloqueio,
        equipamento: equip.nome,
        acao: 'Aguardar validação de preço com Nathan/Karoline antes de gerar proposta definitiva.',
      });
    }

    // ── 3. MONTAR PROPOSTA / MATERIAL ───────────────────────────────────────
    let conteudo = '';

    if (comando === 'proposta' || comando === 'msg') {
      const nomeCliente = client?.first_name || client?.full_name || client_search || 'Doutor(a)';
      const clinica = client?.clinic_name || 'sua clínica';
      const cidade = client?.city || '';

      if (formato === 'whatsapp_curto') {
        conteudo = `Olá, ${nomeCliente}! 👋\n\nSou o Nathan da Seamaty Brasil.\n\nVi que ${clinica}${cidade ? ` em ${cidade}` : ''} pode se beneficiar muito com o *${equip.nome}*.\n\n🔬 *${equip.tipo}* | ${equip.parametros} | ${equip.tempo}\n\n${DIFERENCIAIS}\n\n📊 Posso te mostrar o ROI real pra sua realidade?\n\n⏰ 5 minutos de conversa pode mudar seu fluxo diagnóstico.\n\n💬 Quando você tem uns minutinhos essa semana?`;
      } else if (formato === 'whatsapp_tecnico') {
        conteudo = `Dr(a). ${nomeCliente},\n\nA Seamaty desenvolveu o *${equip.nome}* especificamente para o fluxo veterinário:\n\n▸ Tipo: ${equip.tipo}\n▸ Parâmetros: ${equip.parametros}\n▸ Tempo de resultado: ${equip.tempo}${equip.volume !== 'não citar' ? `\n▸ Volume amostra: ${equip.volume}` : ''}\n\n${DIFERENCIAIS}\n\n📎 Posso encaminhar o material técnico completo?\n\nAguardo seu retorno, ${nomeCliente}.`;
      } else {
        conteudo = `*PROPOSTA TÉCNICA — SEAMATY BRASIL*\n\nCliente: ${nomeCliente} | ${clinica}\n\n*Equipamento:* ${equip.nome}\nTipo: ${equip.tipo}\nParâmetros: ${equip.parametros}\nTempo: ${equip.tempo}${equip.volume !== 'não citar' ? `\nVolume: ${equip.volume}` : ''}\n\n${DIFERENCIAIS}\n\n*Preço:* [CONFIRMAR COM NATHAN ANTES DE ENVIAR]\n\n⚠️ Esta proposta precisa da aprovação do Nathan antes de ser enviada ao cliente.`;
      }
    }

    if (comando === 'material') {
      if (publico === 'veterinario') {
        conteudo = `*MATERIAL TÉCNICO — ${equip.nome} | SEAMATY BRASIL*\n\n🔬 APLICAÇÃO CLÍNICA:\n▸ ${equip.tipo}\n▸ ${equip.parametros}\n▸ Resultado em ${equip.tempo}\n${equip.volume !== 'não citar' ? `▸ Volume: ${equip.volume}` : ''}\n\n⚕️ BENEFÍCIOS NO FLUXO HOSPITALAR:\n▸ Resultado rápido → decisão clínica imediata\n▸ Reduz dependência de laboratório terceirizado\n▸ Integra ao prontuário digital\n▸ Precisão comparável a equipment de bancada maior\n\n📊 DIFERENCIAIS:\n${DIFERENCIAIS}`;
      } else if (publico === 'gestor') {
        conteudo = `*ROI — ${equip.nome} | SEAMATY BRASIL*\n\n💰 PARA O GESTOR:\n▸ Redução de custo com terceirização\n▸ Aumento de receita com exames in-house\n▸ Retenção de tutor: resultado na hora = menos cancelamento\n▸ Recorrência: insumos mensais garantidos\n▸ Diferenciação competitiva local\n\n📈 DIFERENCIAIS:\n${DIFERENCIAIS}\n\n⏱️ ROI estimado: 8-12 meses (varia por volume)`;
      } else {
        conteudo = `*Por que exames rápidos fazem diferença? 🐾*\n\nQuando seu pet precisa de atenção urgente, cada minuto conta.\n\nCom o ${equip.nome}, o veterinário tem o resultado em ${equip.tempo} — sem esperar laboratório externo.\n\n✅ Decisão mais rápida\n✅ Tratamento iniciado antes\n✅ Mais segurança para seu animal\n\nPergunte na sua clínica! 🏥`;
      }
    }

    // ── 4. GERAR LINK RASTREÁVEL ─────────────────────────────────────────────
    const clientId = client?.id || 'sem_cliente';
    const trackingUrl = `https://nr22888.base44.app/ProposalGenerator?client_id=${clientId}&utm_source=telegram&utm_medium=${publico}&utm_campaign=proposta_${equip.nome.toLowerCase()}&utm_content=${Date.now()}`;

    // ── 5. CRIAR FOLLOW-UP SE CLIENTE IDENTIFICADO ──────────────────────────
    if (client && (comando === 'proposta' || comando === 'followup')) {
      await base44.asServiceRole.entities.Task.create({
        client_id: client.id,
        client_name: client.clinic_name || client.first_name,
        title: `Follow-up ${equip.nome} — ${client.clinic_name || client.first_name}`,
        type: 'follow_up',
        priority: 'alta',
        status: 'pendente',
        due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        auto_created: true,
      }).catch(() => {});
    }

    // ── 6. RESUMO TELEGRAM ───────────────────────────────────────────────────
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

    // ── 7. LOG ───────────────────────────────────────────────────────────────
    await base44.asServiceRole.entities.AIInteractionLog.create({
      action_type: 'briefing',
      user_message: `[executarComandoNathanSupremo] comando=${comando} cliente=${client_search} equip=${equip.nome}`,
      ai_response: conteudo.slice(0, 1000),
      client_id: client?.id || null,
      client_name: client?.clinic_name || client?.first_name || null,
      source: 'central_ia_master',
      success: true,
    }).catch(() => {});

    return Response.json({
      success: true,
      comando,
      equipamento: { nome: equip.nome, tipo: equip.tipo, parametros: equip.parametros, tempo: equip.tempo, bloqueado: equip.bloqueado },
      cliente: client ? { id: client.id, nome: client.first_name || client.full_name, clinica: client.clinic_name, cidade: client.city, telefone: client.phone, score: client.purchase_score } : null,
      conteudo,
      resumo_telegram: resumoTelegram,
      tracking_url: trackingUrl,
      confianca,
      follow_up_criado: !!(client && (comando === 'proposta' || comando === 'followup')),
      aprovacao_pendente: true,
      aviso: '⚠️ Nenhum conteúdo deve ser enviado ao cliente sem aprovação explícita do Nathan.',
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Dias da semana em PT
const DIAS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

// Gera datas da semana atual (Seg-Sex) ou próxima
function getWeekDates(offset = 0) {
  const today = new Date();
  const day = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1) + (offset * 7));
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

// Gera datas úteis do mês
function getMonthDates(year, month) {
  const dates = [];
  const d = new Date(year, month, 1);
  while (d.getMonth() === month) {
    const dow = d.getDay();
    if (dow >= 1 && dow <= 5) dates.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const {
      tipo = 'semana',        // 'semana' | 'mes'
      cidades = [],           // ex: ['Marília', 'Bauru']
      semana_offset = 0,      // 0=atual, 1=próxima
      mes = null,             // null=atual, ou numero 0-11
      ano = null,
      max_por_dia = 5,
      prioridade = 'score',   // 'score' | 'status' | 'ultimo_contato'
      criar_visitas = true,   // Se deve criar registros de Visit
    } = body;

    // Buscar clientes
    let clientes = await base44.entities.Client.list('-purchase_score', 500).catch(() => []);

    // Filtrar por cidades se especificado
    if (cidades.length > 0) {
      const cidadesLower = cidades.map(c => c.toLowerCase().trim());
      clientes = clientes.filter(c =>
        c.city && cidadesLower.some(cidade => c.city.toLowerCase().includes(cidade))
      );
    }

    // Excluir clientes perdidos/fechados recentemente
    clientes = clientes.filter(c => c.pipeline_stage !== 'perdido');

    // Ordenar por prioridade
    clientes.sort((a, b) => {
      if (prioridade === 'score') return (b.purchase_score || 0) - (a.purchase_score || 0);
      if (prioridade === 'status') {
        const order = { quente: 0, morno: 1, frio: 2 };
        return (order[a.status] ?? 2) - (order[b.status] ?? 2);
      }
      if (prioridade === 'ultimo_contato') {
        const da = a.last_contact_date ? new Date(a.last_contact_date).getTime() : 0;
        const db = b.last_contact_date ? new Date(b.last_contact_date).getTime() : 0;
        return da - db; // mais antigo primeiro
      }
      return 0;
    });

    // Determinar datas
    let datas = [];
    const now = new Date();
    if (tipo === 'semana') {
      datas = getWeekDates(semana_offset);
    } else {
      const m = mes !== null ? mes : now.getMonth();
      const y = ano !== null ? ano : now.getFullYear();
      datas = getMonthDates(y, m);
    }

    // Agrupar clientes por cidade
    const clientesPorCidade = {};
    clientes.forEach(c => {
      const city = c.city || 'Sem cidade';
      if (!clientesPorCidade[city]) clientesPorCidade[city] = [];
      clientesPorCidade[city].push(c);
    });

    // Distribuir clientes pelos dias: cada dia uma cidade/rota
    const agenda = [];

    // Normaliza cidades: compatibilidade com nomes parciais
    const cidadesOrdenadas = cidades.length > 0
      ? cidades.map(c => {
          const match = Object.keys(clientesPorCidade).find(k => k.toLowerCase().includes(c.toLowerCase()));
          return match || c;
        })
      : Object.keys(clientesPorCidade).sort((a, b) => {
          const countA = clientesPorCidade[a]?.length || 0;
          const countB = clientesPorCidade[b]?.length || 0;
          return countB - countA;
        });

    // Se não há clientes suficientes, retorna resumo sem erro
    if (cidadesOrdenadas.length === 0 || clientes.length === 0) {
      return Response.json({
        success: true,
        agenda: [],
        resumo: { tipo, total_dias: 0, total_visitas: 0, cidades_cobertas: [], clientes_quentes: 0, potencial_fechamento: 0, visitas_criadas_crm: 0 },
        whatsapp_preview: `📅 *AGENDA ${tipo.toUpperCase()}*\n\n⚠️ Nenhum cliente encontrado para as cidades solicitadas.\n\nCadastre clientes com cidade preenchida no CRM para gerar agendas!`,
        visitas_criadas: [],
        info: 'Nenhum cliente com as cidades solicitadas. Cadastre clientes no CRM primeiro.'
      });
    }

    let cidadeIdx = 0;
    const visitasCriadas = [];

    for (const data of datas) {
      if (cidadeIdx >= cidadesOrdenadas.length && cidades.length > 0) break;

      const cidadeAtual = cidadesOrdenadas[cidadeIdx % cidadesOrdenadas.length];
      const clientesDia = (clientesPorCidade[cidadeAtual] || []).slice(0, max_por_dia);

      if (clientesDia.length === 0) {
        cidadeIdx++;
        continue;
      }

      const diaAgenda = {
        data: data.toISOString().split('T')[0],
        dia_semana: DIAS[data.getDay()],
        cidade: cidadeAtual,
        clientes: clientesDia.map((c, i) => ({
          id: c.id,
          nome: c.first_name,
          clinica: c.clinic_name || '',
          status: c.status,
          score: c.purchase_score || 0,
          pipeline: c.pipeline_stage,
          telefone: c.phone || '',
          objetivo: c.visit_objective || 'diagnosticar_necessidades',
          horario_sugerido: `${8 + i * 2}:00`,
          prioridade: i + 1,
        })),
        total_clientes: clientesDia.length,
        score_medio: Math.round(clientesDia.reduce((s, c) => s + (c.purchase_score || 0), 0) / clientesDia.length),
        quentes: clientesDia.filter(c => c.status === 'quente').length,
        potencial_fechamento: clientesDia.filter(c => c.pipeline_stage === 'negociacao' || c.pipeline_stage === 'proposta').length,
      };

      agenda.push(diaAgenda);

      // Criar visitas no CRM se solicitado
      if (criar_visitas) {
        for (let i = 0; i < clientesDia.length; i++) {
          const c = clientesDia[i];
          const hora = 8 + i * 2;
          const scheduledDate = new Date(data);
          scheduledDate.setHours(hora, 0, 0, 0);

          // Verificar se já existe visita para este cliente nesta data
          const existing = await base44.entities.Visit.filter({ client_id: c.id }).catch(() => []);
          const jaExiste = existing.some(v => v.scheduled_date?.startsWith(diaAgenda.data));

          if (!jaExiste) {
            const visit = await base44.entities.Visit.create({
              client_id: c.id,
              client_name: c.first_name,
              scheduled_date: scheduledDate.toISOString(),
              duration_minutes: 60,
              visit_type: c.pipeline_stage === 'negociacao' ? 'fechamento' : 
                          c.pipeline_stage === 'proposta' ? 'followup' :
                          visits?.length === 0 ? 'primeira_visita' : 'demonstracao',
              location: c.address || c.city || '',
              status: 'agendada',
              notes: `Agenda ${tipo} - Cidade: ${cidadeAtual} - Score: ${c.purchase_score}% - Pipeline: ${c.pipeline_stage}`,
            }).catch(() => null);
            if (visit) visitasCriadas.push({ id: visit.id, client: c.first_name, data: diaAgenda.data });
          }
        }
      }

      cidadeIdx++;
    }

    // Resumo da agenda
    const resumo = {
      tipo,
      total_dias: agenda.length,
      total_visitas: agenda.reduce((s, d) => s + d.total_clientes, 0),
      cidades_cobertas: [...new Set(agenda.map(d => d.cidade))],
      clientes_quentes: agenda.reduce((s, d) => s + d.quentes, 0),
      potencial_fechamento: agenda.reduce((s, d) => s + d.potencial_fechamento, 0),
      visitas_criadas_crm: visitasCriadas.length,
    };

    // Gerar mensagem WhatsApp da agenda
    let whatsappMsg = `📅 *AGENDA ${tipo.toUpperCase()} GERADA*\n\n`;
    whatsappMsg += `🏙️ Cidades: ${resumo.cidades_cobertas.join(', ')}\n`;
    whatsappMsg += `👥 Total visitas: ${resumo.total_visitas}\n`;
    whatsappMsg += `🔥 Clientes quentes: ${resumo.clientes_quentes}\n`;
    whatsappMsg += `💰 Potencial fechamento: ${resumo.potencial_fechamento}\n\n`;

    agenda.slice(0, 5).forEach(dia => {
      whatsappMsg += `━━━━━━━━━━━━━━━━━\n`;
      whatsappMsg += `📅 *${dia.dia_semana} ${dia.data}*\n`;
      whatsappMsg += `📍 ${dia.cidade} (${dia.total_clientes} visitas)\n`;
      dia.clientes.slice(0, 3).forEach(c => {
        whatsappMsg += `  ${c.horario_sugerido} - ${c.nome} ${c.clinica ? `(${c.clinica})` : ''} [${c.status}]\n`;
      });
    });

    return Response.json({
      success: true,
      agenda,
      resumo,
      whatsapp_preview: whatsappMsg,
      visitas_criadas: visitasCriadas,
    });

  } catch (error) {
    console.error('Erro agendaInteligente:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
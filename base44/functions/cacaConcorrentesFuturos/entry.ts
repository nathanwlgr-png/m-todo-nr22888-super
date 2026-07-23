import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * cacaConcorrentesFuturos — Busca Suprema de NOVOS lançamentos de equipamentos
 * veterinários (todos os tipos: hematologia, bioquímica, morfologia, PCR, etc.),
 * com foco na China e no mercado global. Captura concorrentes FUTUROS antes deles
 * chegarem no Brasil.
 *
 * O que faz:
 * 1. Usa IA com contexto da internet para descobrir lançamentos recentes/anunciados.
 * 2. Para cada produto/marca novo que AINDA NÃO existe no CompetitorTracker, cria o registro.
 * 3. Se algum for ameaça alta/crítica, alerta no Telegram.
 *
 * SAFE: não altera clientes, não envia WhatsApp. Só popula inteligência comercial.
 * Roda manual (usuário logado) ou via automação mensal (service role).
 *
 * Secrets: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID (para o alerta)
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const dryRun = body?.dry_run === true;

    // 1. Concorrentes já cadastrados — para não duplicar
    const existentes = await base44.asServiceRole.entities.CompetitorTracker.list('-created_date', 500);
    const nomesExistentes = existentes.map(c =>
      `${(c.nome || '').toLowerCase().trim()} | ${(c.equipamento_instalado || '').toLowerCase().trim()}`
    );

    // 2. IA: descobrir lançamentos recentes de equipamentos vet
    const ia = await base44.asServiceRole.integrations.Core.InvokeLLM({
      add_context_from_internet: true,
      model: 'gemini_3_flash',
      prompt: `Você é o analista de inteligência competitiva da Compet Distribuidora, que vende equipamentos laboratoriais veterinários da marca SEAMATY no Brasil (hematologia, bioquímica, morfologia celular por IA, hemogasometria, imunofluorescência, PCR, urinálise).

TAREFA: Pesquise na internet (priorize fabricantes da CHINA e lançamentos globais recentes ou anunciados para 2025/2026) e liste EQUIPAMENTOS veterinários NOVOS ou em pré-lançamento que possam competir com a SEAMATY no Brasil. Inclua qualquer tipo: hematologia, bioquímica, morfologia/análise celular por IA, PCR, imunofluorescência, hemogasometria, urinálise.

Para CADA equipamento novo encontrado, informe: nome do equipamento/produto, fabricante/marca, país, tecnologia/linha, um resumo do que ele faz, e o link da fonte. Foque em concorrentes FUTUROS (lançamentos novos) — não liste produtos antigos e consolidados há muitos anos.

Retorne no máximo 12 itens, os mais relevantes e recentes.`,
      response_json_schema: {
        type: 'object',
        properties: {
          equipamentos: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                nome_equipamento: { type: 'string' },
                fabricante: { type: 'string' },
                pais: { type: 'string' },
                tecnologia: {
                  type: 'string',
                  description: 'hematologia, bioquimica, morfologia, pcr, imunofluorescencia, hemogasometria, urinalise ou outro'
                },
                resumo: { type: 'string' },
                ano_lancamento: { type: 'string' },
                nivel_ameaca: { type: 'string', description: 'baixo, medio, alto ou critico' },
                argumento_contra: { type: 'string', description: 'Como a SEAMATY pode se posicionar contra esse concorrente' },
                url: { type: 'string' }
              }
            }
          }
        }
      }
    });

    const encontrados = Array.isArray(ia?.equipamentos) ? ia.equipamentos : [];
    const TECNOLOGIAS_VALIDAS = ['hematologia', 'bioquimica', 'hemogasometria', 'imunofluorescencia', 'pcr', 'urinalise', 'outro'];
    const AMEACAS_VALIDAS = ['baixo', 'medio', 'alto', 'critico'];
    const hoje = new Date().toISOString().slice(0, 10);

    const novos = [];
    const ameacasAltas = [];

    for (const e of encontrados) {
      const nomeFull = `${(e.fabricante || '').toLowerCase().trim()} ${(e.nome_equipamento || '').toLowerCase().trim()}`.trim();
      if (!nomeFull) continue;

      // Dedupe: pula se já existe algo parecido cadastrado
      const jaExiste = nomesExistentes.some(n =>
        n.includes((e.nome_equipamento || '').toLowerCase().trim()) ||
        (nomeFull && n.includes(nomeFull))
      );
      if (jaExiste) continue;

      const tecnologia = TECNOLOGIAS_VALIDAS.includes((e.tecnologia || '').toLowerCase()) ? (e.tecnologia || '').toLowerCase() : 'outro';
      const ameaca = AMEACAS_VALIDAS.includes((e.nivel_ameaca || '').toLowerCase()) ? (e.nivel_ameaca || '').toLowerCase() : 'medio';

      const novoRegistro = {
        nome: `${e.fabricante || 'Concorrente'} — ${e.nome_equipamento || 'novo equipamento'}`,
        tipo: 'marca_concorrente',
        tecnologias: [tecnologia],
        equipamento_instalado: e.nome_equipamento || '',
        website: e.url || '',
        nivel_ameaca: ameaca,
        status_monitoramento: 'novo',
        fontes_consultadas: ['web', 'busca_suprema_china'],
        ultimas_publicacoes: [{
          fonte: 'lancamento',
          resumo: `${e.resumo || ''}${e.pais ? ' | País: ' + e.pais : ''}${e.ano_lancamento ? ' | ' + e.ano_lancamento : ''}`,
          data: hoje,
          url: e.url || ''
        }],
        inteligencia_ia: e.resumo || '',
        argumento_contra: e.argumento_contra || '',
        ultima_investigacao: new Date().toISOString(),
        ativo: true
      };

      novos.push(novoRegistro);
      if (ameaca === 'alto' || ameaca === 'critico') {
        ameacasAltas.push(`• ${novoRegistro.nome} (${tecnologia}, ${e.pais || '?'}) — ameaça ${ameaca}`);
      }
    }

    // 3. Gravar os novos
    if (!dryRun && novos.length > 0) {
      await base44.asServiceRole.entities.CompetitorTracker.bulkCreate(novos);
    }

    // Alertas externos são convertidos em rascunho pendente.
    let pendingMessageId = null;
    if (!dryRun && novos.length > 0) {
      const linhasAmeaca = ameacasAltas.length > 0 ? `\n\nAmeaças para revisão:\n${ameacasAltas.join('\n')}` : '';
      const texto = `NR22888 — Concorrentes futuros\n\n${novos.length} item(ns) novo(s) preparado(s) para revisão.${linhasAmeaca}`;
      const draft = await base44.entities.PendingMessage.create({
        canal: 'telegram', channel: 'telegram', destinatario_nome: 'Canal Telegram configurado',
        contexto: 'concorrentes_futuros', mensagem: texto, message_content: texto,
        status: 'aguardando_aprovacao', criado_por_agente: 'cacaConcorrentesFuturos',
        aprovado_por_nathan: false, data_criacao: new Date().toISOString(), priority: 'media'
      });
      pendingMessageId = draft.id;
    }

    return Response.json({
      success: true,
      dry_run: dryRun,
      encontrados_total: encontrados.length,
      novos_registrados: dryRun ? 0 : novos.length,
      novos_detectados: novos.length,
      ameacas_altas: ameacasAltas.length,
      telegram_enviado: false,
      pending_message_id: pendingMessageId,
      preview: novos.map(n => ({ nome: n.nome, tecnologia: n.tecnologias[0], ameaca: n.nivel_ameaca }))
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
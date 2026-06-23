import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Varredura SAFE em lote dos sites dos concorrentes cadastrados.
// Para cada concorrente com site (ou Instagram/marca), usa IA com contexto da internet para detectar
// NOVAS instalações de equipamentos e atualizações de catálogo. Só registra o que ainda não existe.
// NÃO envia mensagem e NÃO altera clientes. Pode rodar manual ou via automação diária.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Permite execução manual (usuário logado) ou automação (sem usuário → service role).
    let isAuto = false;
    try {
      const user = await base44.auth.me();
      if (!user) isAuto = true;
    } catch (_e) {
      isAuto = true;
    }

    const body = await req.json().catch(() => ({}));
    const onlyId = body?.competitor_id || null;
    const dryRun = body?.dry_run === true;
    const limit = Number.isFinite(Number(body?.limit)) ? Math.max(1, Math.min(Number(body.limit), 2)) : 1;

    const filtro = onlyId ? { id: onlyId } : { ativo: true };
    // Limite seguro: padrão 1 por execução para evitar timeout em automação semanal.
    // Execução manual pode passar limit=2. Roda em rodízio pelos menos investigados.
    const concorrentes = await base44.asServiceRole.entities.CompetitorTracker.filter(filtro, 'ultima_investigacao', onlyId ? 1 : limit);

    const resultados = [];

    for (const c of concorrentes) {
      // Precisa de alguma fonte para varrer
      if (!c.website && !c.instagram_handle && !c.marca_concorrente) continue;

      const jaConhecido = (Array.isArray(c.ultimas_publicacoes) ? c.ultimas_publicacoes : [])
        .map(p => `${p.fonte || ''}: ${p.resumo || ''}`)
        .join(' | ') || 'nenhum registro anterior';

      try {
        // Timeout de 60s por concorrente: se a IA travar, pulamos sem derrubar a função.
        const iaPromise = base44.asServiceRole.integrations.Core.InvokeLLM({
          add_context_from_internet: true,
          model: 'gemini_3_flash',
          prompt: `Você monitora o concorrente abaixo para a Compet Distribuidora (equipamentos veterinários Seamaty).

CONCORRENTE:
- Nome: ${c.nome}
- Marca: ${c.marca_concorrente || 'N/A'}
- Site: ${c.website || 'N/A'}
- Instagram: ${c.instagram_handle || 'N/A'}
- Cidade/UF: ${c.cidade || '?'}/${c.uf || '?'}

JÁ REGISTRADO ANTES (não repetir): ${jaConhecido}

TAREFA: consulte o site oficial e fontes públicas atuais e detecte SOMENTE movimentos NOVOS (que não estejam no "já registrado"):
1. Novas instalações de equipamentos em clínicas/parceiros.
2. Atualizações de catálogo (novos modelos, novos exames/parâmetros, novos reagentes/insumos, descontinuações).
Se nada novo for encontrado, retorne tem_novidade=false e listas vazias.`,
          response_json_schema: {
            type: 'object',
            properties: {
              tem_novidade: { type: 'boolean' },
              novas_instalacoes: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    resumo: { type: 'string' },
                    local: { type: 'string' },
                    data: { type: 'string' },
                    url: { type: 'string' }
                  }
                }
              },
              atualizacoes_catalogo: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    resumo: { type: 'string' },
                    data: { type: 'string' },
                    url: { type: 'string' }
                  }
                }
              },
              oportunidade_detectada: { type: 'string' }
            }
          }
        });

        const ia = await Promise.race([
          iaPromise,
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout 60s')), 60000))
        ]);

        if (!ia?.tem_novidade) {
          if (!dryRun) {
            await base44.asServiceRole.entities.CompetitorTracker.update(c.id, {
              ultima_investigacao: new Date().toISOString()
            });
          }
          resultados.push({ nome: c.nome, novidades: 0, dry_run: dryRun });
          continue;
        }

        const novasInstalacoes = (ia.novas_instalacoes || []).map(i => ({
          fonte: 'instalacao',
          resumo: i.local ? `${i.resumo} (${i.local})` : i.resumo,
          data: i.data || new Date().toISOString().slice(0, 10),
          url: i.url || c.website || ''
        }));
        const novasCatalogo = (ia.atualizacoes_catalogo || []).map(i => ({
          fonte: 'catalogo',
          resumo: i.resumo,
          data: i.data || new Date().toISOString().slice(0, 10),
          url: i.url || c.website || ''
        }));

        const todasNovas = [...novasInstalacoes, ...novasCatalogo];
        if (todasNovas.length === 0) {
          if (!dryRun) {
            await base44.asServiceRole.entities.CompetitorTracker.update(c.id, {
              ultima_investigacao: new Date().toISOString()
            });
          }
          resultados.push({ nome: c.nome, novidades: 0, dry_run: dryRun });
          continue;
        }

        const publicacoesAtualizadas = [...todasNovas, ...(c.ultimas_publicacoes || [])].slice(0, 20);
        const temInstalacao = novasInstalacoes.length > 0;

        if (!dryRun) {
          await base44.asServiceRole.entities.CompetitorTracker.update(c.id, {
            ultimas_publicacoes: publicacoesAtualizadas,
            equipamento_instalado: novasInstalacoes[0]
              ? (novasInstalacoes[0].resumo).slice(0, 200)
              : (c.equipamento_instalado || ''),
            oportunidade_detectada: ia.oportunidade_detectada || c.oportunidade_detectada || '',
            status_monitoramento: (temInstalacao || ia.oportunidade_detectada) ? 'oportunidade_quente' : (c.status_monitoramento || 'monitorado'),
            ultima_investigacao: new Date().toISOString()
          });
        }

        resultados.push({
          nome: c.nome,
          novidades: todasNovas.length,
          instalacoes: novasInstalacoes.length,
          catalogo: novasCatalogo.length,
          oportunidade: !!ia.oportunidade_detectada,
          dry_run: dryRun
        });
      } catch (e) {
        resultados.push({ nome: c.nome, erro: e.message });
      }
    }

    const totalNovidades = resultados.reduce((s, r) => s + (r.novidades || 0), 0);
    return Response.json({ success: true, auto: isAuto, dry_run: dryRun, analisados: concorrentes.length, total_novidades: totalNovidades, resultados });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

// Investigação Suprema multicanal de concorrentes — SAFE.
// Usa fontes públicas (Instagram, site, Google, CNPJ, LinkedIn, vagas) via IA com contexto da internet.
// NÃO envia mensagem, NÃO altera clientes. Só enriquece o CompetitorTracker com inteligência.
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { competitor_id, force_refresh } = body;
    if (!competitor_id) return Response.json({ error: 'competitor_id obrigatório' }, { status: 400 });

    const comp = await base44.asServiceRole.entities.CompetitorTracker.filter({ id: competitor_id });
    const alvo = comp?.[0];
    if (!alvo) return Response.json({ error: 'Concorrente não encontrado' }, { status: 404 });

    const investigadoHoje = alvo.ultima_investigacao && String(alvo.ultima_investigacao).slice(0, 10) === new Date().toISOString().slice(0, 10);
    if (investigadoHoje && alvo.inteligencia_ia && force_refresh !== true) {
      return Response.json({ success: true, cached: true, competitor: alvo, message: 'Investigação já feita hoje. Cache usado para evitar gasto IA/API.' });
    }

    // Contexto de clientes da Compet para cruzar proximidade (somente nomes/cidades, leitura)
    const clients = await base44.asServiceRole.entities.Client.list('-purchase_score', 200).catch(() => []);
    const cidadesClientes = [...new Set(clients.map(c => c.city).filter(Boolean))].slice(0, 40);

    const prompt = `Você é o analista de inteligência competitiva da Compet Distribuidora (representa equipamentos veterinários Seamaty: hematologia, bioquímica, hemogasometria, imunofluorescência, PCR).

ALVO A INVESTIGAR (fontes públicas):
- Nome: ${alvo.nome}
- Marca concorrente: ${alvo.marca_concorrente || 'não informada'}
- Instagram: ${alvo.instagram_handle || 'não informado'}
- Site: ${alvo.website || 'não informado'}
- Google Maps: ${alvo.google_maps_url || 'não informado'}
- LinkedIn: ${alvo.linkedin_url || 'não informado'}
- CNPJ: ${alvo.cnpj || 'não informado'}
- Cidade/UF: ${alvo.cidade || '?'}/${alvo.uf || '?'}

CIDADES ONDE A COMPET TEM CLIENTES (para cruzar proximidade): ${cidadesClientes.join(', ') || 'não informado'}

TAREFA — investigue por TODAS as fontes públicas que conseguir (Instagram, site institucional, Google/Maps, registros de CNPJ, LinkedIn corporativo, anúncios de vagas) e retorne:
1. Resumo das publicações/sinais recentes (instalações de equipamentos, expansão, novas unidades, contratações).
2. Onde o concorrente está ativo (cidades/regiões) e se está perto de algum cliente da Compet.
3. Quais tecnologias (hematologia, bioquímica, hemogás, imuno, PCR) ele cobre.
4. Nível de ameaça (baixo/medio/alto/critico).
5. Argumento de venda Seamaty para superar esse concorrente.
6. Oportunidade comercial concreta detectada agora.
Seja factual. Se não encontrar evidência de uma fonte, diga "sem evidência pública".`;

    const ia = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      model: 'gemini_3_flash',
      response_json_schema: {
        type: 'object',
        properties: {
          ultimas_publicacoes: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                fonte: { type: 'string' },
                resumo: { type: 'string' },
                data: { type: 'string' },
                url: { type: 'string' }
              }
            }
          },
          fontes_consultadas: { type: 'array', items: { type: 'string' } },
          tecnologias: { type: 'array', items: { type: 'string' } },
          ultima_localizacao_vista: { type: 'string' },
          equipamento_instalado: { type: 'string' },
          nivel_ameaca: { type: 'string' },
          inteligencia_ia: { type: 'string' },
          argumento_contra: { type: 'string' },
          oportunidade_detectada: { type: 'string' }
        }
      }
    });

    const techsValidas = ['hematologia', 'bioquimica', 'hemogasometria', 'imunofluorescencia', 'pcr', 'urinalise', 'outro'];
    const ameacas = ['baixo', 'medio', 'alto', 'critico'];

    const atualizado = await base44.asServiceRole.entities.CompetitorTracker.update(competitor_id, {
      ultimas_publicacoes: Array.isArray(ia.ultimas_publicacoes) ? ia.ultimas_publicacoes.slice(0, 10) : [],
      fontes_consultadas: Array.isArray(ia.fontes_consultadas) ? ia.fontes_consultadas : [],
      tecnologias: Array.isArray(ia.tecnologias) ? ia.tecnologias.filter(t => techsValidas.includes(t)) : (alvo.tecnologias || []),
      ultima_localizacao_vista: ia.ultima_localizacao_vista || alvo.ultima_localizacao_vista || '',
      equipamento_instalado: ia.equipamento_instalado || alvo.equipamento_instalado || '',
      nivel_ameaca: ameacas.includes(ia.nivel_ameaca) ? ia.nivel_ameaca : (alvo.nivel_ameaca || 'medio'),
      inteligencia_ia: ia.inteligencia_ia || '',
      argumento_contra: ia.argumento_contra || '',
      oportunidade_detectada: ia.oportunidade_detectada || '',
      status_monitoramento: ia.oportunidade_detectada ? 'oportunidade_quente' : 'monitorado',
      ultima_investigacao: new Date().toISOString()
    });

    return Response.json({ success: true, competitor: atualizado });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
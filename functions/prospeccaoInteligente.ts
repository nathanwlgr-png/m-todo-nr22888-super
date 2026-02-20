// Função: Sugestão automática de clínicas para prospecção baseada no perfil de clientes e histórico de vendas
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { limit = 10, filters = {} } = await req.json();

    // Buscar dados do CRM para montar perfil do cliente ideal (ICP)
    const [allClients, allSales, allLeads] = await Promise.all([
      base44.asServiceRole.entities.Client.list('-updated_date', 500).catch(() => []),
      base44.asServiceRole.entities.Sale.list('-sale_date', 100).catch(() => []),
      base44.asServiceRole.entities.Lead.list('-created_date', 200).catch(() => []),
    ]);

    // Montar ICP (Ideal Customer Profile)
    const closedSales = allSales.filter(s => s.status === 'fechada' || s.status === 'entregue');
    const convertedClientIds = closedSales.map(s => s.client_id);
    const convertedClients = allClients.filter(c => convertedClientIds.includes(c.id));

    const icpData = {
      total_clientes: allClients.length,
      total_vendas_fechadas: closedSales.length,
      receita_total: closedSales.reduce((s, v) => s + (v.sale_value || 0), 0),
      equipamentos_mais_vendidos: Object.entries(
        closedSales.reduce((acc, s) => {
          const eq = s.equipment_name || 'N/A';
          acc[eq] = (acc[eq] || 0) + 1;
          return acc;
        }, {})
      ).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => ({ name, count })),
      cidades_com_clientes: [...new Set(allClients.map(c => c.city).filter(Boolean))],
      tipos_mais_comuns: Object.entries(
        convertedClients.reduce((acc, c) => {
          const t = c.client_type || 'N/A';
          acc[t] = (acc[t] || 0) + 1;
          return acc;
        }, {})
      ).sort((a, b) => b[1] - a[1]).slice(0, 3),
      ticket_medio: closedSales.length > 0
        ? (closedSales.reduce((s, v) => s + (v.sale_value || 0), 0) / closedSales.length).toFixed(0)
        : 0,
      volumes_mais_comuns: Object.entries(
        convertedClients.reduce((acc, c) => {
          const v = c.current_volume || 'N/A';
          acc[v] = (acc[v] || 0) + 1;
          return acc;
        }, {})
      ).sort((a, b) => b[1] - a[1]).slice(0, 3),
    };

    // Clientes quentes para contexto de padrão de sucesso
    const hotClients = allClients
      .filter(c => c.status === 'quente' && c.health_score > 60)
      .slice(0, 10)
      .map(c => ({
        tipo: c.client_type,
        cidade: c.city,
        volume: c.current_volume,
        score: c.purchase_score,
        equipamento_interesse: c.equipment_interest,
        especialidades: c.industry,
      }));

    // Invocar IA para gerar sugestões de prospecção
    const suggestions = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Você é um especialista em vendas B2B para equipamentos veterinários (CMAT Brasil / Seamaty).

Com base no PERFIL DO CLIENTE IDEAL (ICP) abaixo, sugira ${limit} clínicas veterinárias ESPECÍFICAS para prospecção agora mesmo.

## PERFIL DO CLIENTE IDEAL (ICP):
- Total de clientes atuais: ${icpData.total_clientes}
- Vendas fechadas: ${icpData.total_vendas_fechadas}
- Ticket médio: R$ ${icpData.ticket_medio}
- Equipamentos mais vendidos: ${JSON.stringify(icpData.equipamentos_mais_vendidos)}
- Cidades com presença: ${icpData.cidades_com_clientes.slice(0, 15).join(', ')}
- Tipos de clientes que mais compram: ${JSON.stringify(icpData.tipos_mais_comuns)}
- Volumes mais comuns: ${JSON.stringify(icpData.volumes_mais_comuns)}

## CLIENTES QUENTES COMO REFERÊNCIA:
${JSON.stringify(hotClients, null, 2)}

## FILTROS APLICADOS:
${JSON.stringify(filters)}

## TAREFA:
1. Pesquise na internet clínicas veterinárias reais que se encaixam neste ICP
2. Priorize clínicas em cidades onde já temos presença (maior chance de conversão)
3. Busque clínicas com perfil similar aos clientes que já compraram
4. Inclua justificativa de por que cada clínica é uma boa oportunidade
5. Calcule um "fit score" (0-100) para cada sugestão baseado no ICP
6. Sugira o melhor equipamento e abordagem para cada uma

Retorne clínicas REAIS com dados verificáveis no Google/Maps.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: 'object',
        properties: {
          icp_resumo: {
            type: 'object',
            properties: {
              perfil_ideal: { type: 'string' },
              caracteristicas_chave: { type: 'array', items: { type: 'string' } },
              melhor_abordagem_geral: { type: 'string' },
            }
          },
          sugestoes: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                nome_clinica: { type: 'string' },
                responsavel: { type: 'string' },
                cidade: { type: 'string' },
                estado: { type: 'string' },
                telefone: { type: 'string' },
                instagram: { type: 'string' },
                site: { type: 'string' },
                especialidades: { type: 'array', items: { type: 'string' } },
                porte: { type: 'string' },
                fit_score: { type: 'number' },
                razao_indicacao: { type: 'string' },
                equipamento_recomendado: { type: 'string' },
                abordagem_personalizada: { type: 'string' },
                urgencia: { type: 'string' },
                sinais_compra: { type: 'array', items: { type: 'string' } },
                volume_estimado: { type: 'string' },
              }
            }
          },
          insights_mercado: { type: 'string' },
          proximas_cidades_alvo: { type: 'array', items: { type: 'string' } },
        }
      }
    });

    return Response.json({
      success: true,
      icp_data: icpData,
      suggestions,
      generated_at: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Erro prospeccaoInteligente:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
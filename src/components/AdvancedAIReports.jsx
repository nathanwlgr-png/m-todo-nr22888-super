import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Filter,
  Loader2,
  TrendingUp,
  Users,
  Target,
  MapPin,
  Calendar,
  BarChart3,
  PieChart,
  Download,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart as RePieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer 
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function AdvancedAIReports() {
  const [filters, setFilters] = useState({
    dateStart: '',
    dateEnd: '',
    status: 'all',
    pipeline: 'all',
    seller: 'all',
    city: 'all'
  });
  
  const [reportType, setReportType] = useState('sales_by_region');
  const [generating, setGenerating] = useState(false);
  const [reportData, setReportData] = useState(null);

  const { data: clients = [] } = useQuery({
    queryKey: ['clients-reports'],
    queryFn: () => base44.entities.Client.list('-updated_date', 500)
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['sales-reports'],
    queryFn: () => base44.entities.Sale.list('-sale_date', 500)
  });

  const { data: interactions = [] } = useQuery({
    queryKey: ['interactions-reports'],
    queryFn: () => base44.entities.Interaction.list('-created_date', 500)
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks-reports'],
    queryFn: () => base44.entities.Task.list('-due_date', 500)
  });

  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      if (filters.status !== 'all' && client.status !== filters.status) return false;
      if (filters.pipeline !== 'all' && client.pipeline_stage !== filters.pipeline) return false;
      if (filters.city !== 'all' && client.city !== filters.city) return false;
      return true;
    });
  }, [clients, filters]);

  const cities = useMemo(() => {
    const unique = [...new Set(clients.map(c => c.city).filter(Boolean))];
    return unique.sort();
  }, [clients]);

  const pipelines = ['lead', 'qualificado', 'proposta', 'negociacao', 'fechado', 'perdido'];

  const generateReport = async () => {
    setGenerating(true);
    try {
      let analysisData = {};
      let chartData = [];

      // Preparar dados baseado no tipo de relatório
      if (reportType === 'sales_by_region') {
        const salesByCity = {};
        filteredClients.forEach(client => {
          const city = client.city || 'Sem cidade';
          const clientSales = sales.filter(s => s.client_id === client.id);
          const totalSales = clientSales.reduce((acc, s) => acc + (s.sale_value || 0), 0);
          salesByCity[city] = (salesByCity[city] || 0) + totalSales;
        });
        
        chartData = Object.entries(salesByCity)
          .map(([city, value]) => ({ name: city, value: Math.round(value) }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 10);

        analysisData = {
          total_cities: Object.keys(salesByCity).length,
          total_revenue: Object.values(salesByCity).reduce((a, b) => a + b, 0),
          top_city: chartData[0]?.name,
          top_city_revenue: chartData[0]?.value
        };

      } else if (reportType === 'seller_performance') {
        const sellerData = {};
        filteredClients.forEach(client => {
          const seller = client.created_by || 'Sem vendedor';
          if (!sellerData[seller]) {
            sellerData[seller] = { clients: 0, sales: 0, revenue: 0, tasks: 0 };
          }
          sellerData[seller].clients++;
          
          const clientSales = sales.filter(s => s.client_id === client.id);
          sellerData[seller].sales += clientSales.length;
          sellerData[seller].revenue += clientSales.reduce((acc, s) => acc + (s.sale_value || 0), 0);
          
          const sellerTasks = tasks.filter(t => t.client_id === client.id && t.status === 'concluida');
          sellerData[seller].tasks += sellerTasks.length;
        });

        chartData = Object.entries(sellerData)
          .map(([name, data]) => ({ 
            name: name.split('@')[0], 
            clientes: data.clients,
            vendas: data.sales,
            receita: Math.round(data.revenue),
            tarefas: data.tasks
          }))
          .sort((a, b) => b.receita - a.receita);

        analysisData = {
          total_sellers: chartData.length,
          best_seller: chartData[0]?.name,
          best_seller_revenue: chartData[0]?.receita
        };

      } else if (reportType === 'funnel_analysis') {
        const funnelData = {};
        pipelines.forEach(stage => {
          const stageClients = filteredClients.filter(c => c.pipeline_stage === stage);
          funnelData[stage] = stageClients.length;
        });

        chartData = Object.entries(funnelData).map(([name, value]) => ({ name, value }));

        const conversionRate = funnelData.lead > 0 
          ? ((funnelData.fechado || 0) / funnelData.lead * 100).toFixed(1)
          : 0;

        analysisData = {
          total_leads: funnelData.lead || 0,
          total_closed: funnelData.fechado || 0,
          conversion_rate: conversionRate,
          biggest_drop: 'lead -> qualificado'
        };

      } else if (reportType === 'churn_by_segment') {
        const segmentData = {};
        filteredClients.forEach(client => {
          const segment = client.ai_segment || 'Sem segmento';
          const daysSinceContact = client.last_contact_date 
            ? Math.floor((Date.now() - new Date(client.last_contact_date).getTime()) / (1000 * 60 * 60 * 24))
            : 999;
          
          if (!segmentData[segment]) {
            segmentData[segment] = { total: 0, at_risk: 0 };
          }
          segmentData[segment].total++;
          if (daysSinceContact > 60 || client.status === 'frio') {
            segmentData[segment].at_risk++;
          }
        });

        chartData = Object.entries(segmentData).map(([name, data]) => ({
          name,
          total: data.total,
          em_risco: data.at_risk,
          taxa_risco: Math.round((data.at_risk / data.total) * 100)
        }));

        analysisData = {
          total_segments: chartData.length,
          highest_risk_segment: chartData.sort((a, b) => b.taxa_risco - a.taxa_risco)[0]?.name
        };

      } else if (reportType === 'interaction_trends') {
        const interactionsByMonth = {};
        interactions.forEach(interaction => {
          const date = new Date(interaction.created_date);
          const monthKey = `${date.getMonth() + 1}/${date.getFullYear()}`;
          interactionsByMonth[monthKey] = (interactionsByMonth[monthKey] || 0) + 1;
        });

        chartData = Object.entries(interactionsByMonth)
          .map(([name, value]) => ({ name, value }))
          .slice(-12);

        analysisData = {
          total_interactions: interactions.length,
          avg_per_month: Math.round(interactions.length / 12)
        };
      }

      // Gerar insights com IA
      const aiInsights = await base44.integrations.Core.InvokeLLM({
        prompt: `ANÁLISE INTELIGENTE DE RELATÓRIO - PRIMORI

═══════════════════════════════════════
📊 TIPO DE RELATÓRIO
═══════════════════════════════════════
${reportType === 'sales_by_region' ? 'Vendas por Região' :
  reportType === 'seller_performance' ? 'Performance de Vendedores' :
  reportType === 'funnel_analysis' ? 'Análise de Funil' :
  reportType === 'churn_by_segment' ? 'Taxa de Churn por Segmento' :
  'Tendências de Interação'}

═══════════════════════════════════════
📈 DADOS DO RELATÓRIO
═══════════════════════════════════════
${JSON.stringify(analysisData, null, 2)}

Dados do gráfico:
${JSON.stringify(chartData.slice(0, 5), null, 2)}

Filtros aplicados:
- Status: ${filters.status}
- Pipeline: ${filters.pipeline}
- Cidade: ${filters.city}
- Período: ${filters.dateStart || 'Sem início'} até ${filters.dateEnd || 'Sem fim'}

═══════════════════════════════════════
🎯 ANÁLISE SOLICITADA
═══════════════════════════════════════

Forneça uma análise ULTRA-DETALHADA com:

1. **RESUMO EXECUTIVO** (3-4 linhas):
   - O que os dados mostram em termos de negócio?

2. **INSIGHTS PRINCIPAIS** (5-7 insights):
   - Padrões identificados
   - Oportunidades descobertas
   - Riscos detectados

3. **RECOMENDAÇÕES ACIONÁVEIS** (4-6 ações):
   - Ações específicas e práticas
   - Prioridade (Alta/Média/Baixa)
   - Impacto esperado

4. **PRÓXIMOS PASSOS** (3-4 passos):
   - O que fazer imediatamente
   - Sequência lógica de ações

5. **MÉTRICAS DE ACOMPANHAMENTO**:
   - KPIs para monitorar resultado das ações

Seja ESPECÍFICO, DIRETO e ACIONÁVEL.`,
        response_json_schema: {
          type: "object",
          properties: {
            resumo_executivo: { type: "string" },
            insights_principais: { type: "array", items: { type: "string" } },
            recomendacoes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  acao: { type: "string" },
                  prioridade: { type: "string" },
                  impacto: { type: "string" }
                }
              }
            },
            proximos_passos: { type: "array", items: { type: "string" } },
            metricas_acompanhamento: { type: "array", items: { type: "string" } }
          }
        }
      });

      setReportData({
        chartData,
        analysisData,
        aiInsights,
        reportType,
        filters
      });

      toast.success('Relatório gerado com sucesso!');
    } catch (error) {
      toast.error('Erro ao gerar relatório');
      console.error(error);
    } finally {
      setGenerating(false);
    }
  };

  const exportToPDF = () => {
    toast.info('Exportação PDF em desenvolvimento');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-300">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-slate-800">Relatórios IA Avançados</h3>
            <p className="text-xs text-purple-700">Análises customizadas com insights acionáveis</p>
          </div>
        </div>

        {/* Tipo de Relatório */}
        <div className="mb-3">
          <label className="text-xs font-semibold text-slate-700 mb-1 block">Tipo de Análise</label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm"
          >
            <option value="sales_by_region">📍 Vendas por Região</option>
            <option value="seller_performance">👥 Performance de Vendedores</option>
            <option value="funnel_analysis">📊 Análise de Funil</option>
            <option value="churn_by_segment">⚠️ Churn por Segmento</option>
            <option value="interaction_trends">📈 Tendências de Interação</option>
          </select>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div>
            <label className="text-xs text-slate-600 mb-1 block">Data Início</label>
            <Input
              type="date"
              value={filters.dateStart}
              onChange={(e) => setFilters({...filters, dateStart: e.target.value})}
              className="h-9 text-xs"
            />
          </div>
          <div>
            <label className="text-xs text-slate-600 mb-1 block">Data Fim</label>
            <Input
              type="date"
              value={filters.dateEnd}
              onChange={(e) => setFilters({...filters, dateEnd: e.target.value})}
              className="h-9 text-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <div>
            <label className="text-xs text-slate-600 mb-1 block">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="w-full h-9 px-2 rounded-lg border border-slate-300 text-xs"
            >
              <option value="all">Todos</option>
              <option value="quente">Quente 🔥</option>
              <option value="morno">Morno 🌡️</option>
              <option value="frio">Frio ❄️</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-600 mb-1 block">Pipeline</label>
            <select
              value={filters.pipeline}
              onChange={(e) => setFilters({...filters, pipeline: e.target.value})}
              className="w-full h-9 px-2 rounded-lg border border-slate-300 text-xs"
            >
              <option value="all">Todos</option>
              {pipelines.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>

        {cities.length > 0 && (
          <div className="mb-3">
            <label className="text-xs text-slate-600 mb-1 block">Cidade</label>
            <select
              value={filters.city}
              onChange={(e) => setFilters({...filters, city: e.target.value})}
              className="w-full h-9 px-2 rounded-lg border border-slate-300 text-xs"
            >
              <option value="all">Todas</option>
              {cities.slice(0, 20).map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
        )}

        <Button
          onClick={generateReport}
          disabled={generating}
          className="w-full bg-purple-600 hover:bg-purple-700"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Gerando Relatório...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Gerar Relatório IA
            </>
          )}
        </Button>
      </Card>

      {/* Report Results */}
      {reportData && (
        <>
          {/* Chart */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-slate-800">📊 Visualização</h4>
              <Button size="sm" variant="outline" onClick={exportToPDF}>
                <Download className="w-4 h-4 mr-1" />
                PDF
              </Button>
            </div>

            <ResponsiveContainer width="100%" height={300}>
              {reportType === 'funnel_analysis' || reportType === 'churn_by_segment' ? (
                <BarChart data={reportData.chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {reportType === 'churn_by_segment' ? (
                    <>
                      <Bar dataKey="total" fill="#3b82f6" name="Total" />
                      <Bar dataKey="em_risco" fill="#ef4444" name="Em Risco" />
                    </>
                  ) : (
                    <Bar dataKey="value" fill="#8b5cf6" />
                  )}
                </BarChart>
              ) : reportType === 'seller_performance' ? (
                <BarChart data={reportData.chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="receita" fill="#10b981" name="Receita" />
                  <Bar dataKey="vendas" fill="#3b82f6" name="Vendas" />
                </BarChart>
              ) : (
                <LineChart data={reportData.chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={2} />
                </LineChart>
              )}
            </ResponsiveContainer>
          </Card>

          {/* AI Insights */}
          <Card className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-300">
            <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Insights IA
            </h4>

            {/* Resumo Executivo */}
            <div className="mb-3 p-3 bg-white rounded-lg border border-blue-200">
              <p className="text-xs font-semibold text-blue-800 mb-1">📋 Resumo Executivo:</p>
              <p className="text-sm text-slate-700">{reportData.aiInsights.resumo_executivo}</p>
            </div>

            {/* Insights Principais */}
            <div className="mb-3 p-3 bg-white rounded-lg border border-purple-200">
              <p className="text-xs font-semibold text-purple-800 mb-2">💡 Insights Principais:</p>
              <div className="space-y-1">
                {reportData.aiInsights.insights_principais?.map((insight, i) => (
                  <div key={i} className="text-xs text-slate-700 flex items-start gap-1">
                    <span className="text-purple-600">•</span>
                    <span>{insight}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recomendações */}
            <div className="mb-3 p-3 bg-white rounded-lg border border-green-200">
              <p className="text-xs font-semibold text-green-800 mb-2">✅ Recomendações Acionáveis:</p>
              <div className="space-y-2">
                {reportData.aiInsights.recomendacoes?.map((rec, i) => (
                  <div key={i} className="p-2 bg-green-50 rounded border border-green-200">
                    <div className="flex items-start justify-between mb-1">
                      <p className="text-xs font-semibold text-slate-800">{rec.acao}</p>
                      <Badge className={
                        rec.prioridade === 'Alta' ? 'bg-red-500' :
                        rec.prioridade === 'Média' ? 'bg-yellow-500' : 'bg-blue-500'
                      }>
                        {rec.prioridade}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600">Impacto: {rec.impacto}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Próximos Passos */}
            <div className="mb-3 p-3 bg-white rounded-lg border border-orange-200">
              <p className="text-xs font-semibold text-orange-800 mb-2">🎯 Próximos Passos:</p>
              <div className="space-y-1">
                {reportData.aiInsights.proximos_passos?.map((passo, i) => (
                  <div key={i} className="text-xs text-slate-700 flex items-start gap-2">
                    <span className="text-orange-600 font-bold">{i + 1}.</span>
                    <span>{passo}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Métricas de Acompanhamento */}
            <div className="p-3 bg-white rounded-lg border border-indigo-200">
              <p className="text-xs font-semibold text-indigo-800 mb-2">📈 Métricas de Acompanhamento:</p>
              <div className="space-y-1">
                {reportData.aiInsights.metricas_acompanhamento?.map((metrica, i) => (
                  <div key={i} className="text-xs text-slate-700 flex items-start gap-1">
                    <span className="text-indigo-600">•</span>
                    <span>{metrica}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
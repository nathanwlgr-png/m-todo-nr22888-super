import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, BarChart3, TrendingUp, AlertTriangle, CheckCircle, DollarSign } from 'lucide-react';

export default function WeeklyMonthlyReportAI() {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [period, setPeriod] = useState('semanal');

  const { data: clients = [] } = useQuery({ queryKey: ['clients-report'], queryFn: () => base44.entities.Client.list('-updated_date', 200) });
  const { data: sales = [] } = useQuery({ queryKey: ['sales-report'], queryFn: () => base44.entities.Sale.list('-sale_date', 100) });
  const { data: tasks = [] } = useQuery({ queryKey: ['tasks-report'], queryFn: () => base44.entities.Task.list('-created_date', 100) });
  const { data: visits = [] } = useQuery({ queryKey: ['visits-report'], queryFn: () => base44.entities.Visit.list('-scheduled_date', 50) });

  const generateReport = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const days = period === 'semanal' ? 7 : 30;
      const cutoff = new Date(now.getTime() - days * 86400000);

      const recentSales = sales.filter(s => new Date(s.sale_date) > cutoff);
      const totalRevenue = recentSales.reduce((sum, s) => sum + (s.sale_value || 0), 0);
      const hotClients = clients.filter(c => c.status === 'quente').length;
      const coldClients = clients.filter(c => c.status === 'frio').length;
      const pendingTasks = tasks.filter(t => t.status === 'pendente').length;
      const completedTasks = tasks.filter(t => t.status === 'concluida').length;
      const pipelineValue = clients.reduce((sum, c) => sum + (c.projected_revenue || 0), 0);
      const avgScore = clients.length ? Math.round(clients.reduce((s, c) => s + (c.purchase_score || 0), 0) / clients.length) : 0;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é analista sênior de vendas do Método NR22 (equipamentos de diagnóstico veterinário Seamaty).

DADOS DO PERÍODO (${period} — últimos ${days} dias):
- Vendas realizadas: ${recentSales.length}
- Receita total: R$ ${totalRevenue.toLocaleString('pt-BR')}
- Clientes quentes: ${hotClients}
- Clientes frios: ${coldClients}
- Total de clientes: ${clients.length}
- Tarefas pendentes: ${pendingTasks}
- Tarefas concluídas: ${completedTasks}
- Pipeline total estimado: R$ ${pipelineValue.toLocaleString('pt-BR')}
- Score médio da carteira: ${avgScore}/100
- Visitas realizadas: ${visits.filter(v => v.status === 'realizada').length}

VENDAS RECENTES: ${recentSales.slice(0, 5).map(s => `${s.client_name}: ${s.equipment_name} R$${s.sale_value?.toLocaleString('pt-BR')}`).join(', ') || 'nenhuma'}

Gere um relatório ${period} COMPLETO e ACIONÁVEL com:
1. Resumo executivo (3-4 frases)
2. KPIs principais com análise de performance
3. Top 3 oportunidades identificadas
4. Top 3 riscos/alertas
5. Ações imediatas recomendadas (5 ações)
6. Previsão de receita para o próximo período (baseada em tendências)
7. Clientes que precisam de atenção urgente

Responda em JSON:`,
        response_json_schema: {
          type: 'object',
          properties: {
            titulo: { type: 'string' },
            resumo_executivo: { type: 'string' },
            kpis: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  nome: { type: 'string' },
                  valor: { type: 'string' },
                  status: { type: 'string' },
                  variacao: { type: 'string' }
                }
              }
            },
            oportunidades: { type: 'array', items: { type: 'string' } },
            riscos: { type: 'array', items: { type: 'string' } },
            acoes_imediatas: { type: 'array', items: { type: 'string' } },
            previsao_receita: { type: 'string' },
            clientes_atencao: { type: 'array', items: { type: 'string' } }
          }
        }
      });
      setReport({ ...result, periodo: period, data_geracao: now.toLocaleDateString('pt-BR') });
    } finally {
      setLoading(false);
    }
  };

  const statusColor = (s) => {
    if (s === 'otimo' || s === 'positivo') return 'bg-green-100 text-green-700';
    if (s === 'alerta' || s === 'atencao') return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-semibold text-slate-800">📊 IA 24 — Relatório com Insights e Previsão de Receita</h3>
          <p className="text-sm text-slate-500">Análise automática com ações acionáveis e forecast</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semanal">Semanal</SelectItem>
              <SelectItem value="mensal">Mensal</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={generateReport} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <BarChart3 className="w-4 h-4 mr-2" />}
            {loading ? 'Gerando...' : 'Gerar Relatório'}
          </Button>
        </div>
      </div>

      {report && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl p-5">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-bold text-lg">{report.titulo}</h4>
                <p className="text-indigo-200 text-sm">{report.periodo} · Gerado em {report.data_geracao}</p>
              </div>
              <Badge className="bg-white text-indigo-700">NR22 IA 24</Badge>
            </div>
            <p className="mt-3 text-sm leading-relaxed opacity-90">{report.resumo_executivo}</p>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(report.kpis || []).slice(0, 4).map((kpi, i) => (
              <Card key={i} className="border border-slate-200">
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-slate-500 mb-1">{kpi.nome}</p>
                  <p className="text-xl font-bold text-slate-800">{kpi.valor}</p>
                  <p className="text-xs text-slate-400">{kpi.variacao}</p>
                  <Badge className={`text-xs mt-1 ${statusColor(kpi.status)}`}>{kpi.status}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Previsão de Receita */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
            <DollarSign className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-green-800 text-sm">📈 Previsão de Receita</p>
              <p className="text-sm text-green-700">{report.previsao_receita}</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Oportunidades */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <p className="font-semibold text-blue-800 text-sm mb-3 flex items-center gap-1"><TrendingUp className="w-4 h-4" /> Oportunidades</p>
              <ul className="space-y-2">
                {(report.oportunidades || []).map((o, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-blue-700">
                    <CheckCircle className="w-3 h-3 text-blue-500 flex-shrink-0 mt-1" />
                    {o}
                  </li>
                ))}
              </ul>
            </div>

            {/* Riscos */}
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <p className="font-semibold text-red-800 text-sm mb-3 flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> Riscos & Alertas</p>
              <ul className="space-y-2">
                {(report.riscos || []).map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-red-700">
                    <AlertTriangle className="w-3 h-3 text-red-500 flex-shrink-0 mt-1" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Ações Imediatas */}
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <p className="font-semibold text-slate-700 text-sm mb-3">⚡ Ações Imediatas (Execute Hoje)</p>
            <div className="space-y-2">
              {(report.acoes_imediatas || []).map((a, i) => (
                <div key={i} className="flex items-start gap-3 bg-white rounded p-2 border border-slate-200">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">{i + 1}</span>
                  <p className="text-sm text-slate-700">{a}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Clientes que precisam de atenção */}
          {(report.clientes_atencao || []).length > 0 && (
            <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
              <p className="font-semibold text-orange-800 text-sm mb-2">🔔 Clientes que Precisam de Atenção Urgente</p>
              <div className="flex flex-wrap gap-2">
                {report.clientes_atencao.map((c, i) => (
                  <Badge key={i} className="bg-orange-100 text-orange-700">{c}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
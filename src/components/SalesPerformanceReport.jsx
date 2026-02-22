import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, BarChart3, TrendingUp, TrendingDown, Copy, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

export default function SalesPerformanceReport() {
  const [period, setPeriod] = useState('semanal');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);

  const { data: sales = [] } = useQuery({ queryKey: ['all-sales'], queryFn: () => base44.entities.Sale.list('-sale_date') });
  const { data: clients = [] } = useQuery({ queryKey: ['all-clients-report'], queryFn: () => base44.entities.Client.list() });
  const { data: tasks = [] } = useQuery({ queryKey: ['all-tasks-report'], queryFn: () => base44.entities.Task.list() });
  const { data: visits = [] } = useQuery({ queryKey: ['all-visits-report'], queryFn: () => base44.entities.Visit.list() });

  const getDays = () => period === 'semanal' ? 7 : period === 'mensal' ? 30 : 90;

  const getMetrics = () => {
    const cutoff = new Date(Date.now() - getDays() * 86400000);
    const recentSales = sales.filter(s => new Date(s.sale_date) >= cutoff);
    const recentVisits = visits.filter(v => new Date(v.scheduled_date) >= cutoff);
    const completedTasks = tasks.filter(t => t.status === 'concluida' && new Date(t.updated_date) >= cutoff);
    const hotClients = clients.filter(c => c.status === 'quente');
    const totalRevenue = recentSales.reduce((sum, s) => sum + (s.sale_value || 0), 0);
    const conversionRate = clients.length > 0 ? ((clients.filter(c => c.pipeline_stage === 'fechado').length / clients.length) * 100).toFixed(1) : 0;

    return {
      totalRevenue, recentSales: recentSales.length, recentVisits: recentVisits.length,
      completedTasks: completedTasks.length, hotClients: hotClients.length,
      conversionRate, totalClients: clients.length,
      avgScore: clients.length > 0 ? Math.round(clients.reduce((s, c) => s + (c.purchase_score || 0), 0) / clients.length) : 0,
      coldClients: clients.filter(c => c.status === 'frio').length,
      warmClients: clients.filter(c => c.status === 'morno').length,
    };
  };

  const generateReport = async () => {
    setLoading(true);
    setReport(null);
    try {
      const metrics = getMetrics();
      const days = getDays();
      const cutoff = new Date(Date.now() - days * 86400000);
      const recentSales = sales.filter(s => new Date(s.sale_date) >= cutoff);
      const byProduct = {};
      recentSales.forEach(s => { byProduct[s.equipment_name || 'Outro'] = (byProduct[s.equipment_name || 'Outro'] || 0) + (s.sale_value || 0); });

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `MÉTODO NR22 — RELATÓRIO DE PERFORMANCE ${period.toUpperCase()}

PERÍODO: últimos ${days} dias

MÉTRICAS:
- Receita: R$ ${metrics.totalRevenue.toLocaleString('pt-BR')}
- Vendas fechadas: ${metrics.recentSales}
- Visitas realizadas: ${metrics.recentVisits}
- Tarefas concluídas: ${metrics.completedTasks}
- Clientes quentes: ${metrics.hotClients}
- Clientes frios: ${metrics.coldClients}
- Clientes mornos: ${metrics.warmClients}
- Taxa de conversão: ${metrics.conversionRate}%
- Score médio carteira: ${metrics.avgScore}%
- Total clientes: ${metrics.totalClients}
- Por produto: ${JSON.stringify(byProduct)}

Gere um relatório executivo completo com:
1. headline: título do relatório com emoji
2. executive_summary: resumo executivo de 2 linhas
3. highlights: array de 3 pontos positivos (com emoji)
4. alerts: array de 2-3 alertas/riscos (com emoji)
5. insights: array de 4 insights acionáveis com dado específico
6. top_actions: array de 3 ações prioritárias para a próxima semana (SMART: específica, mensurável, com prazo)
7. forecast: previsão de receita para o próximo período com justificativa
8. motivational_close: frase final motivacional de Napoleão Hill`,
        response_json_schema: {
          type: 'object',
          properties: {
            headline: { type: 'string' },
            executive_summary: { type: 'string' },
            highlights: { type: 'array', items: { type: 'string' } },
            alerts: { type: 'array', items: { type: 'string' } },
            insights: { type: 'array', items: { type: 'string' } },
            top_actions: { type: 'array', items: { type: 'string' } },
            forecast: { type: 'string' },
            motivational_close: { type: 'string' }
          }
        }
      });
      setReport({ ...result, metrics, byProduct });
    } catch (e) {
      toast.error('Erro ao gerar relatório');
    } finally {
      setLoading(false);
    }
  };

  const pieData = report?.byProduct
    ? Object.entries(report.byProduct).map(([name, value]) => ({ name, value }))
    : [];
  const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="h-8 text-xs flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="semanal">📅 Semanal (7 dias)</SelectItem>
            <SelectItem value="mensal">📆 Mensal (30 dias)</SelectItem>
            <SelectItem value="trimestral">📊 Trimestral (90 dias)</SelectItem>
          </SelectContent>
        </Select>
        <Button size="sm" onClick={generateReport} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 h-8 text-xs shrink-0">
          {loading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <BarChart3 className="w-3 h-3 mr-1" />}
          {loading ? 'Gerando...' : 'Gerar'}
        </Button>
      </div>

      {/* KPIs rápidos */}
      {!report && !loading && (
        () => {
          const m = getMetrics();
          return (
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Vendas', value: m.recentSales, sub: `R$ ${m.totalRevenue.toLocaleString('pt-BR')}`, color: 'text-green-600' },
                { label: 'Quentes', value: m.hotClients, sub: `${m.conversionRate}% conv.`, color: 'text-red-500' },
                { label: 'Score Médio', value: `${m.avgScore}%`, sub: `${m.totalClients} clientes`, color: 'text-indigo-600' },
              ].map(({ label, value, sub, color }) => (
                <Card key={label}>
                  <CardContent className="p-2.5 text-center">
                    <p className={`text-lg font-bold ${color}`}>{value}</p>
                    <p className="text-[10px] text-slate-500">{label}</p>
                    <p className="text-[9px] text-slate-400">{sub}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          );
        }
      )()}

      {loading && (
        <Card>
          <CardContent className="p-6 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto mb-2" />
            <p className="text-xs text-slate-500">Analisando {getDays()} dias de dados com IA NR22...</p>
          </CardContent>
        </Card>
      )}

      {report && (
        <div className="space-y-3">
          {/* Header */}
          <Card className="bg-gradient-to-br from-indigo-600 to-purple-700 border-0">
            <CardContent className="p-3">
              <p className="text-sm font-bold text-white">{report.headline}</p>
              <p className="text-xs text-indigo-200 mt-1">{report.executive_summary}</p>
            </CardContent>
          </Card>

          {/* KPIs */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Receita', value: `R$ ${(report.metrics.totalRevenue/1000).toFixed(0)}k`, color: 'text-green-600', icon: '💰' },
              { label: 'Vendas', value: report.metrics.recentSales, color: 'text-blue-600', icon: '🤝' },
              { label: 'Visitas', value: report.metrics.recentVisits, color: 'text-purple-600', icon: '🏥' },
              { label: 'Conversão', value: `${report.metrics.conversionRate}%`, color: 'text-indigo-600', icon: '🎯' },
              { label: 'Quentes', value: report.metrics.hotClients, color: 'text-red-500', icon: '🔥' },
              { label: 'Score Médio', value: `${report.metrics.avgScore}%`, color: 'text-amber-600', icon: '📊' },
            ].map(({ label, value, color, icon }) => (
              <Card key={label}>
                <CardContent className="p-2 text-center">
                  <p className="text-base">{icon}</p>
                  <p className={`text-sm font-bold ${color}`}>{value}</p>
                  <p className="text-[10px] text-slate-500">{label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Gráfico por produto */}
          {pieData.length > 0 && (
            <Card>
              <CardContent className="p-3">
                <p className="text-xs font-semibold text-slate-700 mb-2">📦 Receita por Produto</p>
                <ResponsiveContainer width="100%" height={120}>
                  <BarChart data={pieData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 9 }} />
                    <Tooltip formatter={(v) => [`R$ ${v.toLocaleString('pt-BR')}`, 'Receita']} />
                    <Bar dataKey="value" fill="#6366f1" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Highlights + Alerts */}
          <div className="grid grid-cols-2 gap-2">
            {report.highlights?.length > 0 && (
              <Card className="border-green-200">
                <CardContent className="p-2.5">
                  <p className="text-[10px] font-bold text-green-700 mb-1">✅ DESTAQUES</p>
                  <ul className="space-y-1">
                    {report.highlights.map((h, i) => <li key={i} className="text-[10px] text-slate-700">{h}</li>)}
                  </ul>
                </CardContent>
              </Card>
            )}
            {report.alerts?.length > 0 && (
              <Card className="border-red-200">
                <CardContent className="p-2.5">
                  <p className="text-[10px] font-bold text-red-700 mb-1">⚠️ ALERTAS</p>
                  <ul className="space-y-1">
                    {report.alerts.map((a, i) => <li key={i} className="text-[10px] text-slate-700">{a}</li>)}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Insights */}
          {report.insights?.length > 0 && (
            <Card>
              <CardContent className="p-3">
                <p className="text-xs font-bold text-slate-700 mb-2">💡 Insights Acionáveis</p>
                <ul className="space-y-1.5">
                  {report.insights.map((ins, i) => (
                    <li key={i} className="text-xs text-slate-700 flex gap-1.5">
                      <span className="text-indigo-400 font-bold shrink-0">{i+1}.</span>{ins}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Top Actions */}
          {report.top_actions?.length > 0 && (
            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="p-3">
                <p className="text-xs font-bold text-amber-800 mb-2">🚀 TOP 3 AÇÕES PARA A PRÓXIMA SEMANA</p>
                <ol className="space-y-2">
                  {report.top_actions.map((action, i) => (
                    <li key={i} className="flex gap-2 text-xs text-amber-900">
                      <span className="w-5 h-5 bg-amber-400 text-white rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">{i+1}</span>
                      {action}
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          )}

          {/* Forecast */}
          {report.forecast && (
            <Card className="border-indigo-200 bg-indigo-50">
              <CardContent className="p-3">
                <p className="text-[10px] font-bold text-indigo-600 mb-1">🔮 PREVISÃO PRÓXIMO PERÍODO</p>
                <p className="text-xs text-indigo-800">{report.forecast}</p>
              </CardContent>
            </Card>
          )}

          {/* Motivacional */}
          {report.motivational_close && (
            <Card className="bg-gradient-to-r from-indigo-600 to-purple-700 border-0">
              <CardContent className="p-3">
                <p className="text-xs text-white italic">"{report.motivational_close}"</p>
                <p className="text-[10px] text-indigo-300 mt-1">— Napoleão Hill | Método NR22</p>
              </CardContent>
            </Card>
          )}

          {/* Copiar relatório */}
          <Button variant="outline" size="sm" className="w-full h-8 text-xs"
            onClick={() => {
              const txt = `${report.headline}\n\n${report.executive_summary}\n\nDESTAQUES:\n${report.highlights?.join('\n')}\n\nALERTAS:\n${report.alerts?.join('\n')}\n\nINSIGHTS:\n${report.insights?.join('\n')}\n\nAÇÕES:\n${report.top_actions?.join('\n')}\n\nPREVISÃO: ${report.forecast}`;
              navigator.clipboard.writeText(txt);
              toast.success('Relatório copiado!');
            }}>
            <Copy className="w-3 h-3 mr-1" /> Copiar Relatório Completo
          </Button>
        </div>
      )}
    </div>
  );
}
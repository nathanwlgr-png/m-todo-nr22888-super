import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, BarChart3, Copy, RefreshCw, TrendingUp, TrendingDown, Send } from 'lucide-react';
import { toast } from 'sonner';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import AdvancedPerformanceGraphs from './AdvancedPerformanceGraphs';
import TrendAnalysisPanel from './TrendAnalysisPanel';

export default function SalesPerformanceReport() {
  const [period, setPeriod] = useState('semanal');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [sending, setSending] = useState(false);

  const { data: sales = [] } = useQuery({ queryKey: ['all-sales'], queryFn: () => base44.entities.Sale.list('-sale_date') });
  const { data: clients = [] } = useQuery({ queryKey: ['all-clients-report'], queryFn: () => base44.entities.Client.list() });
  const { data: tasks = [] } = useQuery({ queryKey: ['all-tasks-report'], queryFn: () => base44.entities.Task.list() });
  const { data: visits = [] } = useQuery({ queryKey: ['all-visits-report'], queryFn: () => base44.entities.Visit.list() });
  const { data: interactions = [] } = useQuery({ queryKey: ['all-interactions-report'], queryFn: () => base44.entities.Interaction.list('-created_date') });

  const getDays = () => period === 'semanal' ? 7 : period === 'mensal' ? 30 : 90;

  const metrics = useMemo(() => {
    const days = getDays();
    const cutoff = new Date(Date.now() - days * 86400000);
    const prevCutoff = new Date(Date.now() - days * 2 * 86400000);

    const recentSales = sales.filter(s => new Date(s.sale_date) >= cutoff);
    const prevSales = sales.filter(s => new Date(s.sale_date) >= prevCutoff && new Date(s.sale_date) < cutoff);
    const recentVisits = visits.filter(v => new Date(v.scheduled_date) >= cutoff);
    const completedTasks = tasks.filter(t => t.status === 'concluida' && new Date(t.updated_date) >= cutoff);
    const recentInteractions = interactions.filter(i => new Date(i.created_date) >= cutoff);

    const totalRevenue = recentSales.reduce((sum, s) => sum + (s.sale_value || 0), 0);
    const prevRevenue = prevSales.reduce((sum, s) => sum + (s.sale_value || 0), 0);
    const revenueGrowth = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue * 100).toFixed(1) : null;

    const hotClients = clients.filter(c => c.status === 'quente');
    const coldClients = clients.filter(c => c.status === 'frio');
    const warmClients = clients.filter(c => c.status === 'morno');
    const closedClients = clients.filter(c => c.pipeline_stage === 'fechado');
    const conversionRate = clients.length > 0 ? ((closedClients.length / clients.length) * 100).toFixed(1) : 0;
    const avgScore = clients.length > 0 ? Math.round(clients.reduce((s, c) => s + (c.purchase_score || 0), 0) / clients.length) : 0;

    // Revenue by product
    const byProduct = {};
    recentSales.forEach(s => {
      const name = s.equipment_name || 'Outro';
      byProduct[name] = (byProduct[name] || 0) + (s.sale_value || 0);
    });

    // Positive/negative interactions
    const positiveInteractions = recentInteractions.filter(i => i.outcome === 'positive').length;
    const negativeInteractions = recentInteractions.filter(i => i.outcome === 'negative').length;

    // Inactive clients (no contact >30 days)
    const inactive30 = clients.filter(c => {
      const last = c.last_contact_date ? new Date(c.last_contact_date) : null;
      return !last || last < new Date(Date.now() - 30 * 86400000);
    }).length;

    // Pipeline value
    const pipelineValue = clients
      .filter(c => ['proposta', 'negociacao'].includes(c.pipeline_stage))
      .reduce((sum, c) => sum + (c.available_budget || c.projected_revenue || 0), 0);

    return {
      totalRevenue, prevRevenue, revenueGrowth, recentSalesCount: recentSales.length,
      recentVisits: recentVisits.length, completedTasks: completedTasks.length,
      hotClients: hotClients.length, coldClients: coldClients.length, warmClients: warmClients.length,
      conversionRate, avgScore, totalClients: clients.length, closedClients: closedClients.length,
      byProduct, positiveInteractions, negativeInteractions, inactive30, pipelineValue,
      avgTicket: recentSales.length > 0 ? Math.round(totalRevenue / recentSales.length) : 0
    };
  }, [sales, clients, tasks, visits, interactions, period]);

  const productChartData = Object.entries(metrics.byProduct)
    .map(([name, value]) => ({ name: name.replace('SMT-', '').replace('VBC-', 'VBC'), value }))
    .sort((a, b) => b.value - a.value);

  const generateReport = async () => {
    setLoading(true);
    setReport(null);
    try {
      const days = getDays();

      // Executa em paralelo: relatório IA + busca de previsão
      const [result] = await Promise.all([
        base44.integrations.Core.InvokeLLM({
          prompt: `MÉTODO NR22 — RELATÓRIO DE PERFORMANCE ${period.toUpperCase()} (${days} dias)

━━━ MÉTRICAS DO PERÍODO ━━━
Receita: R$ ${metrics.totalRevenue.toLocaleString('pt-BR')} ${metrics.revenueGrowth ? `(${metrics.revenueGrowth > 0 ? '+' : ''}${metrics.revenueGrowth}% vs período anterior)` : ''}
Receita período anterior: R$ ${metrics.prevRevenue.toLocaleString('pt-BR')}
Vendas fechadas: ${metrics.recentSalesCount} | Ticket médio: R$ ${metrics.avgTicket.toLocaleString('pt-BR')}
Visitas realizadas: ${metrics.recentVisits}
Tarefas concluídas: ${metrics.completedTasks}
Interações positivas: ${metrics.positiveInteractions} | Negativas: ${metrics.negativeInteractions}

━━━ CARTEIRA ━━━
Total clientes: ${metrics.totalClients}
Quentes: ${metrics.hotClients} | Mornos: ${metrics.warmClients} | Frios: ${metrics.coldClients}
Fechados no período: ${metrics.closedClients}
Taxa de conversão: ${metrics.conversionRate}%
Score médio carteira: ${metrics.avgScore}%
Inativos +30 dias: ${metrics.inactive30}
Pipeline em negociação/proposta: R$ ${metrics.pipelineValue.toLocaleString('pt-BR')}

━━━ POR PRODUTO ━━━
${JSON.stringify(metrics.byProduct)}

Gere relatório executivo COMPLETO com insights ACIONÁVEIS baseados no Método NR22.
Inclua comparações e identifique padrões de mercado veterinário.

Retorne:
1. headline: título impactante com emoji e dado principal
2. executive_summary: 2-3 linhas resumindo o período com tom executivo
3. performance_score: score 0-100 do período com justificativa (string ex: "72/100 — Ritmo forte mas pipeline precisa atenção")
4. highlights: 3-4 pontos positivos específicos com dado (ex: "VBC-50A respondeu por 60% da receita")
5. alerts: 2-3 alertas críticos com impacto estimado
6. insights: 4-5 insights acionáveis ESPECÍFICOS com dado e ação recomendada
7. top_actions: 3 ações SMART para os próximos ${days} dias (específica, mensurável, com prazo)
8. focus_clients: perfil de clientes para priorizar agora (características, não nomes)
9. forecast: previsão de receita próximo período com % de confiança e premissas
10. risk_factor: principal risco identificado e como mitigar
11. motivational_close: frase de Napoleão Hill adaptada ao momento do vendedor`,
          response_json_schema: {
            type: 'object',
            properties: {
              headline: { type: 'string' },
              executive_summary: { type: 'string' },
              performance_score: { type: 'string' },
              highlights: { type: 'array', items: { type: 'string' } },
              alerts: { type: 'array', items: { type: 'string' } },
              insights: { type: 'array', items: { type: 'string' } },
              top_actions: { type: 'array', items: { type: 'string' } },
              focus_clients: { type: 'string' },
              forecast: { type: 'string' },
              risk_factor: { type: 'string' },
              motivational_close: { type: 'string' }
            }
          }
        })
      ]);

      setReport({ ...result, metrics });
    } catch (e) {
      toast.error('Erro ao gerar relatório');
    } finally {
      setLoading(false);
    }
  };

  const sendToWhatsApp = async () => {
    if (!report) return;
    setSending(true);
    try {
      const txt = `📊 *RELATÓRIO NR22 — ${period.toUpperCase()}*\n\n${report.headline}\n\n${report.executive_summary}\n\n*PERFORMANCE:* ${report.performance_score}\n\n✅ *DESTAQUES:*\n${report.highlights?.map((h, i) => `${i + 1}. ${h}`).join('\n')}\n\n⚠️ *ALERTAS:*\n${report.alerts?.join('\n')}\n\n🚀 *TOP AÇÕES:*\n${report.top_actions?.map((a, i) => `${i + 1}. ${a}`).join('\n')}\n\n🔮 *PREVISÃO:* ${report.forecast}\n\n_"${report.motivational_close}"_`;
      const res = await base44.functions.invoke('whatsappSendChunked', {
        message: txt, phone: '5514991676428'
      });
      if (res.data?.chunks?.[0]?.whatsapp_url) {
        window.open(res.data.chunks[0].whatsapp_url, '_blank');
        toast.success('Relatório enviado para WhatsApp!');
      }
    } catch (e) {
      toast.error('Erro ao enviar');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Controles */}
      <div className="flex items-center gap-2">
        <Select value={period} onValueChange={v => { setPeriod(v); setReport(null); }}>
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

      {/* KPIs rápidos sempre visíveis */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Receita', value: `R$ ${(metrics.totalRevenue / 1000).toFixed(0)}k`, sub: metrics.revenueGrowth ? `${metrics.revenueGrowth > 0 ? '▲' : '▼'} ${Math.abs(metrics.revenueGrowth)}%` : `${metrics.recentSalesCount} vendas`, color: metrics.revenueGrowth > 0 ? 'text-green-600' : 'text-red-500' },
          { label: 'Quentes', value: metrics.hotClients, sub: `${metrics.conversionRate}% conv.`, color: 'text-red-500' },
          { label: 'Score Médio', value: `${metrics.avgScore}%`, sub: `${metrics.inactive30} inativos`, color: 'text-indigo-600' },
        ].map(({ label, value, sub, color }) => (
          <Card key={label}>
            <CardContent className="p-2.5 text-center">
              <p className={`text-base font-bold ${color}`}>{value}</p>
              <p className="text-[10px] text-slate-500">{label}</p>
              <p className="text-[9px] text-slate-400">{sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gráfico rápido de produtos */}
      {productChartData.length > 0 && (
        <Card>
          <CardContent className="p-3">
            <p className="text-xs font-semibold text-slate-700 mb-2">📦 Receita por Produto ({getDays()} dias)</p>
            <ResponsiveContainer width="100%" height={100}>
              <BarChart data={productChartData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => [`R$ ${v.toLocaleString('pt-BR')}`, 'Receita']} />
                <Bar dataKey="value" fill="#6366f1" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {loading && (
        <Card>
          <CardContent className="p-5 text-center space-y-1">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-600 mx-auto" />
            <p className="text-xs text-slate-500">IA NR22 analisando {getDays()} dias de dados...</p>
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
              {report.performance_score && (
                <Badge className="mt-2 bg-white/20 text-white text-[10px]">📊 {report.performance_score}</Badge>
              )}
            </CardContent>
          </Card>

          {/* Destaques + Alertas */}
          <div className="grid grid-cols-2 gap-2">
            {report.highlights?.length > 0 && (
              <Card className="border-green-200">
                <CardContent className="p-2.5">
                  <p className="text-[10px] font-bold text-green-700 mb-1">✅ DESTAQUES</p>
                  <ul className="space-y-1">
                    {report.highlights.map((h, i) => <li key={i} className="text-[10px] text-slate-700 flex gap-1"><span className="text-green-400 shrink-0">›</span>{h}</li>)}
                  </ul>
                </CardContent>
              </Card>
            )}
            {report.alerts?.length > 0 && (
              <Card className="border-red-200">
                <CardContent className="p-2.5">
                  <p className="text-[10px] font-bold text-red-700 mb-1">⚠️ ALERTAS</p>
                  <ul className="space-y-1">
                    {report.alerts.map((a, i) => <li key={i} className="text-[10px] text-slate-700 flex gap-1"><span className="text-red-400 shrink-0">›</span>{a}</li>)}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Insights acionáveis */}
          {report.insights?.length > 0 && (
            <Card>
              <CardContent className="p-3">
                <p className="text-xs font-bold text-slate-700 mb-2">💡 Insights Acionáveis NR22</p>
                <ul className="space-y-1.5">
                  {report.insights.map((ins, i) => (
                    <li key={i} className="text-xs text-slate-700 flex gap-1.5 bg-slate-50 rounded p-1.5">
                      <span className="text-indigo-500 font-bold shrink-0">{i + 1}.</span>{ins}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Top ações */}
          {report.top_actions?.length > 0 && (
            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="p-3">
                <p className="text-xs font-bold text-amber-800 mb-2">🚀 TOP 3 AÇÕES — PRÓXIMOS {getDays()} DIAS</p>
                <ol className="space-y-2">
                  {report.top_actions.map((action, i) => (
                    <li key={i} className="flex gap-2 text-xs text-amber-900">
                      <span className="w-5 h-5 bg-amber-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">{i + 1}</span>
                      {action}
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          )}

          {/* Foco + Risco */}
          <div className="grid grid-cols-2 gap-2">
            {report.focus_clients && (
              <Card className="border-indigo-200">
                <CardContent className="p-2.5">
                  <p className="text-[10px] font-bold text-indigo-700 mb-1">🎯 PERFIL PRIORITÁRIO</p>
                  <p className="text-[10px] text-slate-700">{report.focus_clients}</p>
                </CardContent>
              </Card>
            )}
            {report.risk_factor && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-2.5">
                  <p className="text-[10px] font-bold text-red-700 mb-1">🚨 RISCO PRINCIPAL</p>
                  <p className="text-[10px] text-slate-700">{report.risk_factor}</p>
                </CardContent>
              </Card>
            )}
          </div>

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

          {/* Ações do relatório */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1 h-8 text-xs"
              onClick={() => {
                const txt = `${report.headline}\n\n${report.executive_summary}\n\nPERFORMANCE: ${report.performance_score}\n\nDESTAQUES:\n${report.highlights?.join('\n')}\n\nALERTAS:\n${report.alerts?.join('\n')}\n\nINSIGHTS:\n${report.insights?.join('\n')}\n\nAÇÕES:\n${report.top_actions?.join('\n')}\n\nPREVISÃO: ${report.forecast}`;
                navigator.clipboard.writeText(txt);
                toast.success('Relatório copiado!');
              }}>
              <Copy className="w-3 h-3 mr-1" /> Copiar
            </Button>
            <Button size="sm" onClick={sendToWhatsApp} disabled={sending} className="flex-1 h-8 text-xs bg-green-600 hover:bg-green-700">
              {sending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Send className="w-3 h-3 mr-1" />}
              {sending ? 'Enviando...' : 'WhatsApp'}
            </Button>
            <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={generateReport}>
              <RefreshCw className="w-3 h-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
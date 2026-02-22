import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { base44 } from '@/api/base44Client';
import { Loader2, RefreshCw, Send } from 'lucide-react';
import { toast } from 'sonner';

const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

const PERIOD_LABELS = {
  ultimo_mes: 'Último mês', ultimo_trimestre: 'Último trimestre',
  ultimo_semestre: 'Último semestre', ultimo_ano: 'Último ano',
  mes_atual: 'Mês atual', trimestre_atual: 'Trimestre atual', ano_atual: 'Ano atual', custom: 'Período personalizado'
};

function ChartRenderer({ kpiId, chartType, data }) {
  if (!data || data.length === 0) return <p className="text-xs text-slate-400 text-center py-4">Sem dados suficientes</p>;

  if (chartType === 'pie') {
    return (
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={65} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (chartType === 'line') {
    return (
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={data}>
          <XAxis dataKey="name" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip />
          <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} dot={{ fill: '#6366f1', r: 3 }} />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  // bar (default)
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data}>
        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 10 }} />
        <Tooltip />
        <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export default function ReportPreview({ report, KPIS, CHART_OPTIONS }) {
  const [generating, setGenerating] = useState(false);
  const [reportData, setReportData] = useState(report.last_report_data ? JSON.parse(report.last_report_data) : null);
  const [sending, setSending] = useState(false);

  const generatePreview = async () => {
    setGenerating(true);
    try {
      const [clients, sales, leads, visits, tasks] = await Promise.all([
        base44.entities.Client.list('-updated_date', 500),
        base44.entities.Sale.list('-created_date', 200),
        base44.entities.Lead.list('-created_date', 200),
        base44.entities.Visit.list('-created_date', 200),
        base44.entities.Task.list('-created_date', 200),
      ]);

      const now = new Date();
      const getPeriodStart = () => {
        switch (report.period) {
          case 'ultimo_mes': return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          case 'ultimo_trimestre': return new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
          case 'ultimo_semestre': return new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
          case 'ultimo_ano': return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
          case 'mes_atual': return new Date(now.getFullYear(), now.getMonth(), 1);
          case 'trimestre_atual': return new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
          case 'ano_atual': return new Date(now.getFullYear(), 0, 1);
          case 'custom': return report.period_start ? new Date(report.period_start) : new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
          default: return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        }
      };
      const periodStart = getPeriodStart();

      const inPeriod = (dateStr) => dateStr && new Date(dateStr) >= periodStart;
      const salesInPeriod = sales.filter(s => inPeriod(s.sale_date || s.created_date));
      const leadsInPeriod = leads.filter(l => inPeriod(l.created_date));
      const visitsInPeriod = visits.filter(v => inPeriod(v.scheduled_date));
      const tasksInPeriod = tasks.filter(t => inPeriod(t.created_date));

      // Build monthly breakdown for charts
      const monthlyData = {};
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.toLocaleString('pt-BR', { month: 'short' })}/${d.getFullYear().toString().slice(2)}`;
        monthlyData[key] = { sales: 0, revenue: 0, leads: 0, visits: 0 };
      }
      salesInPeriod.forEach(s => {
        const d = new Date(s.sale_date || s.created_date);
        const key = `${d.toLocaleString('pt-BR', { month: 'short' })}/${d.getFullYear().toString().slice(2)}`;
        if (monthlyData[key]) { monthlyData[key].sales++; monthlyData[key].revenue += s.sale_value || 0; }
      });
      leadsInPeriod.forEach(l => {
        const d = new Date(l.created_date);
        const key = `${d.toLocaleString('pt-BR', { month: 'short' })}/${d.getFullYear().toString().slice(2)}`;
        if (monthlyData[key]) monthlyData[key].leads++;
      });

      const monthlyArr = Object.entries(monthlyData).map(([name, v]) => ({ name, ...v }));

      const kpiValues = {};
      report.metrics_included.forEach(kpiId => {
        switch (kpiId) {
          case 'vendas_realizadas':
            kpiValues[kpiId] = { value: salesInPeriod.length, chart: monthlyArr.map(m => ({ name: m.name, value: m.sales })), unit: 'vendas' };
            break;
          case 'ticket_medio':
            const totalRev = salesInPeriod.reduce((a, s) => a + (s.sale_value || 0), 0);
            kpiValues[kpiId] = { value: salesInPeriod.length > 0 ? (totalRev / salesInPeriod.length).toFixed(0) : 0, chart: monthlyArr.map(m => ({ name: m.name, value: Math.round(m.revenue / (m.sales || 1)) })), unit: 'R$' };
            break;
          case 'receita_total':
            kpiValues[kpiId] = { value: salesInPeriod.reduce((a, s) => a + (s.sale_value || 0), 0).toFixed(0), chart: monthlyArr.map(m => ({ name: m.name, value: Math.round(m.revenue) })), unit: 'R$' };
            break;
          case 'novos_leads':
            kpiValues[kpiId] = { value: leadsInPeriod.length, chart: monthlyArr.map(m => ({ name: m.name, value: m.leads })), unit: 'leads' };
            break;
          case 'taxa_conversao':
            const conv = leadsInPeriod.length > 0 ? ((leadsInPeriod.filter(l => l.stage === 'convertido').length / leadsInPeriod.length) * 100).toFixed(1) : 0;
            kpiValues[kpiId] = { value: conv, chart: [{ name: 'Convertidos', value: leadsInPeriod.filter(l => l.stage === 'convertido').length }, { name: 'Outros', value: leadsInPeriod.filter(l => l.stage !== 'convertido').length }], unit: '%' };
            break;
          case 'clientes_ativos':
            const hot = clients.filter(c => c.status === 'quente').length;
            const warm = clients.filter(c => c.status === 'morno').length;
            const cold = clients.filter(c => c.status === 'frio').length;
            kpiValues[kpiId] = { value: clients.length, chart: [{ name: 'Quente', value: hot }, { name: 'Morno', value: warm }, { name: 'Frio', value: cold }], unit: 'clientes' };
            break;
          case 'health_score_medio':
            const avgScore = clients.filter(c => c.health_score).reduce((a, c, _, arr) => a + c.health_score / arr.length, 0);
            kpiValues[kpiId] = { value: avgScore.toFixed(0), chart: [{ name: '<40', value: clients.filter(c => (c.health_score || 0) < 40).length }, { name: '40-70', value: clients.filter(c => (c.health_score || 0) >= 40 && (c.health_score || 0) < 70).length }, { name: '>70', value: clients.filter(c => (c.health_score || 0) >= 70).length }], unit: 'pts' };
            break;
          case 'visitas_realizadas':
            kpiValues[kpiId] = { value: visitsInPeriod.filter(v => v.status === 'realizada').length, chart: monthlyArr.map(m => ({ name: m.name, value: m.visits })), unit: 'visitas' };
            break;
          case 'tarefas_concluidas':
            kpiValues[kpiId] = { value: tasksInPeriod.filter(t => t.status === 'concluida').length, chart: [{ name: 'Concluídas', value: tasksInPeriod.filter(t => t.status === 'concluida').length }, { name: 'Pendentes', value: tasksInPeriod.filter(t => t.status === 'pendente').length }], unit: 'tarefas' };
            break;
          case 'pipeline_status':
            const stages = ['lead','qualificado','proposta','negociacao','fechado','perdido'];
            kpiValues[kpiId] = { value: clients.filter(c => ['proposta','negociacao'].includes(c.pipeline_stage)).length, chart: stages.map(s => ({ name: s, value: clients.filter(c => c.pipeline_stage === s).length })), unit: 'em negociação' };
            break;
          default:
            kpiValues[kpiId] = { value: '-', chart: [], unit: '' };
        }
      });

      setReportData({ kpiValues, generatedAt: new Date().toISOString(), period: report.period });
      await base44.entities.ScheduledReport.update(report.id, { last_report_data: JSON.stringify({ kpiValues, generatedAt: new Date().toISOString(), period: report.period }) });
      toast.success('Relatório gerado!');
    } catch (e) {
      toast.error('Erro: ' + e.message);
    } finally {
      setGenerating(false);
    }
  };

  const sendByEmail = async () => {
    setSending(true);
    try {
      await base44.functions.invoke('generateConsolidatedReport', { report_id: report.id });
      toast.success('Relatório enviado por e-mail!');
    } catch (e) {
      toast.error('Erro ao enviar: ' + e.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-800">{report.report_name}</h3>
          <p className="text-xs text-slate-500">{PERIOD_LABELS[report.period] || 'Período não definido'}</p>
          {reportData?.generatedAt && (
            <p className="text-xs text-slate-400">Gerado em: {new Date(reportData.generatedAt).toLocaleString('pt-BR')}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={generatePreview} disabled={generating} className="h-8 text-xs">
            {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            {generating ? 'Gerando...' : 'Gerar Preview'}
          </Button>
          <Button size="sm" onClick={sendByEmail} disabled={sending} className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700">
            {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            Enviar E-mail
          </Button>
        </div>
      </div>

      {!reportData && !generating && (
        <div className="text-center py-8 text-slate-400 border-2 border-dashed rounded-xl">
          <p className="text-sm">Clique em "Gerar Preview" para visualizar o relatório</p>
        </div>
      )}

      {reportData?.kpiValues && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {report.metrics_included.map(kpiId => {
            const kpiInfo = KPIS.find(k => k.id === kpiId);
            const kpiData = reportData.kpiValues[kpiId];
            const chartType = (report.chart_types || {})[kpiId] || 'bar';
            if (!kpiInfo || !kpiData) return null;
            const Icon = kpiInfo.icon;
            return (
              <Card key={kpiId} className="overflow-hidden">
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Icon className="w-4 h-4 text-indigo-600" />
                    {kpiInfo.label}
                    <Badge variant="outline" className="ml-auto text-xs">
                      {chartType === 'bar' ? '▊ Barras' : chartType === 'line' ? '📈 Linhas' : '🥧 Pizza'}
                    </Badge>
                  </CardTitle>
                  <p className="text-2xl font-bold text-indigo-700">
                    {kpiData.unit === 'R$' ? `R$ ${Number(kpiData.value).toLocaleString('pt-BR')}` : `${kpiData.value} ${kpiData.unit}`}
                  </p>
                </CardHeader>
                <CardContent className="px-2 pb-3">
                  <ChartRenderer kpiId={kpiId} chartType={chartType} data={kpiData.chart} />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
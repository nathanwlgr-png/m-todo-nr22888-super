import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  BarChart2, LineChart, PieChart, TrendingUp, Users, AlertTriangle,
  Sparkles, FileText, CheckCircle2, Clock, DollarSign, Heart, Target, Star
} from 'lucide-react';

const KPIS = [
  { id: 'vendas_realizadas', label: 'Vendas Realizadas', icon: DollarSign, group: 'Vendas' },
  { id: 'ticket_medio', label: 'Ticket Médio', icon: DollarSign, group: 'Vendas' },
  { id: 'taxa_conversao', label: 'Taxa de Conversão', icon: Target, group: 'Vendas' },
  { id: 'receita_total', label: 'Receita Total', icon: TrendingUp, group: 'Vendas' },
  { id: 'novos_leads', label: 'Novos Leads', icon: Users, group: 'Leads' },
  { id: 'conversao_leads', label: 'Conversão de Leads', icon: Target, group: 'Leads' },
  { id: 'clientes_ativos', label: 'Clientes Ativos', icon: CheckCircle2, group: 'Clientes' },
  { id: 'satisfacao_cliente', label: 'Satisfação do Cliente', icon: Heart, group: 'Clientes' },
  { id: 'health_score_medio', label: 'Health Score Médio', icon: Star, group: 'Clientes' },
  { id: 'alertas_churn', label: 'Alertas de Churn', icon: AlertTriangle, group: 'Retenção' },
  { id: 'sentimento_clientes', label: 'Sentimento dos Clientes', icon: Sparkles, group: 'Retenção' },
  { id: 'performance_equipe', label: 'Performance da Equipe', icon: Users, group: 'Equipe' },
  { id: 'visitas_realizadas', label: 'Visitas Realizadas', icon: Clock, group: 'Equipe' },
  { id: 'tarefas_concluidas', label: 'Tarefas Concluídas', icon: CheckCircle2, group: 'Equipe' },
  { id: 'pipeline_status', label: 'Status do Pipeline', icon: FileText, group: 'Pipeline' },
  { id: 'oportunidades_ia', label: 'Oportunidades IA', icon: Sparkles, group: 'IA' },
];

const CHART_OPTIONS = [
  { value: 'bar', label: 'Barras', icon: BarChart2 },
  { value: 'line', label: 'Linhas', icon: LineChart },
  { value: 'pie', label: 'Pizza', icon: PieChart },
];

const PERIODS = [
  { value: 'ultimo_mes', label: 'Último mês' },
  { value: 'ultimo_trimestre', label: 'Último trimestre' },
  { value: 'ultimo_semestre', label: 'Último semestre' },
  { value: 'ultimo_ano', label: 'Último ano' },
  { value: 'mes_atual', label: 'Mês atual' },
  { value: 'trimestre_atual', label: 'Trimestre atual' },
  { value: 'ano_atual', label: 'Ano atual' },
  { value: 'custom', label: 'Período personalizado' },
];

const FREQUENCIES = [
  { value: 'diario', label: 'Diário' },
  { value: 'semanal', label: 'Semanal' },
  { value: 'mensal', label: 'Mensal' },
  { value: 'trimestral', label: 'Trimestral' },
  { value: 'anual', label: 'Anual' },
];

const groups = [...new Set(KPIS.map(k => k.group))];

export default function ReportBuilder({ formData, setFormData, onSubmit, isSubmitting }) {
  const toggleKpi = (id) => {
    setFormData(prev => ({
      ...prev,
      metrics_included: prev.metrics_included.includes(id)
        ? prev.metrics_included.filter(m => m !== id)
        : [...prev.metrics_included, id]
    }));
  };

  const setChartType = (kpiId, chartType) => {
    setFormData(prev => ({
      ...prev,
      chart_types: { ...(prev.chart_types || {}), [kpiId]: chartType }
    }));
  };

  const selectedKpis = KPIS.filter(k => formData.metrics_included.includes(k.id));

  return (
    <div className="space-y-5">
      {/* Nome */}
      <div>
        <Label className="text-sm font-semibold">Nome do Relatório</Label>
        <Input
          className="mt-1"
          value={formData.report_name}
          onChange={e => setFormData({ ...formData, report_name: e.target.value })}
          placeholder="Ex: Relatório Trimestral de Vendas"
        />
      </div>

      {/* Período de análise + Frequência */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-sm font-semibold">Período de Análise</Label>
          <Select value={formData.period} onValueChange={v => setFormData({ ...formData, period: v })}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PERIODS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-sm font-semibold">Frequência de Envio</Label>
          <Select value={formData.report_type} onValueChange={v => setFormData({ ...formData, report_type: v })}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {FREQUENCIES.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Período custom */}
      {formData.period === 'custom' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-sm font-semibold">Data Início</Label>
            <Input type="date" className="mt-1" value={formData.period_start || ''} onChange={e => setFormData({ ...formData, period_start: e.target.value })} />
          </div>
          <div>
            <Label className="text-sm font-semibold">Data Fim</Label>
            <Input type="date" className="mt-1" value={formData.period_end || ''} onChange={e => setFormData({ ...formData, period_end: e.target.value })} />
          </div>
        </div>
      )}

      {/* Agendamento */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-sm font-semibold">Horário de Envio</Label>
          <Input type="time" className="mt-1" value={formData.schedule_time} onChange={e => setFormData({ ...formData, schedule_time: e.target.value })} />
        </div>
        {formData.report_type === 'semanal' && (
          <div>
            <Label className="text-sm font-semibold">Dia da Semana</Label>
            <Select value={formData.schedule_day} onValueChange={v => setFormData({ ...formData, schedule_day: v })}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {['monday','tuesday','wednesday','thursday','friday','saturday','sunday'].map(d => (
                  <SelectItem key={d} value={d}>{['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo'][['monday','tuesday','wednesday','thursday','friday','saturday','sunday'].indexOf(d)]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {['mensal','trimestral','anual'].includes(formData.report_type) && (
          <div>
            <Label className="text-sm font-semibold">Dia do Mês</Label>
            <Input type="number" min="1" max="28" className="mt-1" value={formData.schedule_day_of_month || 1}
              onChange={e => setFormData({ ...formData, schedule_day_of_month: parseInt(e.target.value) })} />
          </div>
        )}
      </div>

      {/* Destinatários */}
      <div>
        <Label className="text-sm font-semibold">Destinatários (separados por vírgula)</Label>
        <Input
          className="mt-1"
          value={formData.recipients}
          onChange={e => setFormData({ ...formData, recipients: e.target.value })}
          placeholder="email1@empresa.com, email2@empresa.com"
        />
      </div>

      {/* KPIs por grupo */}
      <div>
        <Label className="text-sm font-semibold mb-2 block">KPIs a incluir</Label>
        <div className="space-y-3">
          {groups.map(group => (
            <div key={group}>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-1.5">{group}</p>
              <div className="grid grid-cols-2 gap-2">
                {KPIS.filter(k => k.group === group).map(kpi => {
                  const Icon = kpi.icon;
                  const selected = formData.metrics_included.includes(kpi.id);
                  return (
                    <button
                      key={kpi.id}
                      type="button"
                      onClick={() => toggleKpi(kpi.id)}
                      className={`flex items-center gap-2 p-2 rounded-lg border text-left transition-colors text-sm ${
                        selected ? 'bg-indigo-50 border-indigo-400 text-indigo-800' : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-300'
                      }`}
                    >
                      <Checkbox checked={selected} readOnly className="pointer-events-none" />
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate text-xs">{kpi.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tipo de visualização por KPI selecionado */}
      {selectedKpis.length > 0 && (
        <div>
          <Label className="text-sm font-semibold mb-2 block">Visualização por KPI</Label>
          <div className="space-y-2">
            {selectedKpis.map(kpi => {
              const currentChart = (formData.chart_types || {})[kpi.id] || 'bar';
              return (
                <div key={kpi.id} className="flex items-center gap-3 bg-slate-50 rounded-lg px-3 py-2">
                  <span className="text-xs text-slate-700 flex-1">{kpi.label}</span>
                  <div className="flex gap-1">
                    {CHART_OPTIONS.map(opt => {
                      const ChartIcon = opt.icon;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setChartType(kpi.id, opt.value)}
                          title={opt.label}
                          className={`p-1.5 rounded border transition-colors ${
                            currentChart === opt.value ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-300'
                          }`}
                        >
                          <ChartIcon className="w-3.5 h-3.5" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Opções extras */}
      <div className="flex items-center gap-3">
        <Checkbox
          checked={formData.include_charts}
          onCheckedChange={v => setFormData({ ...formData, include_charts: v })}
        />
        <Label className="text-sm cursor-pointer">Incluir gráficos no e-mail</Label>
        <div className="ml-4 flex items-center gap-2">
          <Label className="text-sm">Formato:</Label>
          <Select value={formData.format} onValueChange={v => setFormData({ ...formData, format: v })}>
            <SelectTrigger className="h-8 w-24"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="html">HTML</SelectItem>
              <SelectItem value="pdf">PDF</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button
        onClick={onSubmit}
        disabled={!formData.report_name || !formData.recipients || formData.metrics_included.length === 0 || isSubmitting}
        className="w-full bg-indigo-600 hover:bg-indigo-700"
      >
        {isSubmitting ? 'Salvando...' : '📅 Salvar Relatório Agendado'}
      </Button>
    </div>
  );
}

export { KPIS, CHART_OPTIONS, PERIODS, FREQUENCIES };
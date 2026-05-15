import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, FunnelChart, Funnel, LabelList, Cell } from 'recharts';
import { TrendingUp, DollarSign, Target, Percent, Users } from 'lucide-react';

const FUNNEL_STAGES = [
  { key: 'lead', label: 'Leads', color: '#6366f1' },
  { key: 'qualificado', label: 'Qualificados', color: '#8b5cf6' },
  { key: 'proposta', label: 'Proposta', color: '#f59e0b' },
  { key: 'negociacao', label: 'Negociação', color: '#f97316' },
  { key: 'fechado', label: 'Fechados', color: '#10b981' },
];

const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

export default function SalesDashboardWidget() {
  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['dashboard-clients-all'],
    queryFn: () => base44.entities.Client.list('-created_date', 200),
    staleTime: 120000,
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['dashboard-sales'],
    queryFn: () => base44.entities.Sale.list('-sale_date', 100),
    staleTime: 120000,
  });

  const { data: goals = [] } = useQuery({
    queryKey: ['dashboard-goals'],
    queryFn: () => base44.entities.SalesGoal.filter({ status: 'active' }),
    staleTime: 120000,
  });

  // Funil de vendas
  const funnelData = FUNNEL_STAGES.map(stage => ({
    ...stage,
    value: clients.filter(c => c.pipeline_stage === stage.key).length,
  }));

  // Negociações em aberto
  const openNegotiations = clients.filter(c =>
    c.pipeline_stage === 'negociacao' || c.pipeline_stage === 'proposta'
  ).length;

  // Taxa de conversão
  const totalLeads = clients.length || 1;
  const closed = clients.filter(c => c.pipeline_stage === 'fechado').length;
  const conversionRate = ((closed / totalLeads) * 100).toFixed(1);

  // Vendas por mês (últimos 6 meses)
  const now = new Date();
  const monthlySales = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const monthSales = sales.filter(s => {
      if (!s.sale_date) return false;
      const sd = new Date(s.sale_date);
      return sd.getMonth() === d.getMonth() && sd.getFullYear() === d.getFullYear();
    });
    return {
      mes: MONTHS[d.getMonth()],
      valor: monthSales.reduce((acc, s) => acc + (s.sale_value || 0), 0),
      qtd: monthSales.length,
    };
  });

  // Metas ativas
  const salesGoal = goals.find(g => g.metric_type === 'sales_value');
  const countGoal = goals.find(g => g.metric_type === 'sales_count');
  const currentMonthSales = monthlySales[5];

  if (isLoading) return null;

  return (
    <div className="space-y-4 mb-4">
      <h2 className="text-base font-bold text-slate-700 flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-indigo-600" />
        Dashboard de Vendas
      </h2>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-orange-50 to-orange-100">
          <CardContent className="p-3 text-center">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center mx-auto mb-1">
              <Users className="w-4 h-4 text-white" />
            </div>
            <p className="text-xl font-black text-orange-600">{openNegotiations}</p>
            <p className="text-[10px] text-orange-500 font-medium leading-tight">Negociações Abertas</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-emerald-100">
          <CardContent className="p-3 text-center">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center mx-auto mb-1">
              <Percent className="w-4 h-4 text-white" />
            </div>
            <p className="text-xl font-black text-emerald-600">{conversionRate}%</p>
            <p className="text-[10px] text-emerald-500 font-medium leading-tight">Taxa Conversão</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-indigo-50 to-indigo-100">
          <CardContent className="p-3 text-center">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center mx-auto mb-1">
              <DollarSign className="w-4 h-4 text-white" />
            </div>
            <p className="text-xl font-black text-indigo-600">
              {currentMonthSales.qtd}
            </p>
            <p className="text-[10px] text-indigo-500 font-medium leading-tight">Vendas no Mês</p>
          </CardContent>
        </Card>
      </div>

      {/* Funil de Vendas */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-bold text-slate-700">🎯 Funil de Vendas</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="space-y-2">
            {funnelData.map((stage, i) => {
              const pct = funnelData[0].value > 0 ? (stage.value / funnelData[0].value) * 100 : 0;
              return (
                <div key={stage.key} className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 w-20 shrink-0">{stage.label}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-5 overflow-hidden">
                    <div
                      className="h-full rounded-full flex items-center justify-end pr-2 transition-all duration-500"
                      style={{ width: `${Math.max(pct, 5)}%`, backgroundColor: stage.color }}
                    >
                      <span className="text-[10px] text-white font-bold">{stage.value}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de vendas mensais */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-bold text-slate-700">📊 Vendas Últimos 6 Meses</CardTitle>
        </CardHeader>
        <CardContent className="px-2 pb-4">
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={monthlySales} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="mes" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip
                formatter={(v, name) => [name === 'valor' ? `R$ ${v.toLocaleString('pt-BR')}` : v, name === 'valor' ? 'Receita' : 'Qtd']}
                contentStyle={{ fontSize: 11 }}
              />
              <Bar dataKey="valor" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Metas mensais */}
      {(salesGoal || countGoal) && (
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <Target className="w-4 h-4 text-amber-500" />
              Metas do Mês
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            {salesGoal && (
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600">{salesGoal.title}</span>
                  <span className="font-bold text-slate-700">
                    R$ {(salesGoal.current_value || 0).toLocaleString('pt-BR')} / R$ {salesGoal.target_value.toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3">
                  <div
                    className="h-3 rounded-full bg-gradient-to-r from-amber-400 to-amber-500"
                    style={{ width: `${Math.min(((salesGoal.current_value || 0) / salesGoal.target_value) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  {(((salesGoal.current_value || 0) / salesGoal.target_value) * 100).toFixed(0)}% concluído
                </p>
              </div>
            )}
            {countGoal && (
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600">{countGoal.title}</span>
                  <span className="font-bold text-slate-700">
                    {countGoal.current_value || 0} / {countGoal.target_value} vendas
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3">
                  <div
                    className="h-3 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500"
                    style={{ width: `${Math.min(((countGoal.current_value || 0) / countGoal.target_value) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  {(((countGoal.current_value || 0) / countGoal.target_value) * 100).toFixed(0)}% concluído
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
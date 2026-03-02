import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { DollarSign, TrendingUp, Target, RefreshCw } from 'lucide-react';

export default function ClientSalesKPIDashboard({ client, sales = [], visits = [] }) {
  const kpis = useMemo(() => {
    const closedSales = sales.filter(s => s.status === 'fechada');
    const totalRevenue = closedSales.reduce((sum, s) => sum + (s.sale_value || 0), 0);
    const avgTicket = closedSales.length > 0 ? totalRevenue / closedSales.length : 0;
    const conversionRate = visits.length > 0 ? ((closedSales.length / visits.length) * 100).toFixed(1) : 0;

    // LTV estimado: ticket médio × frequência esperada (3 compras em 36 meses)
    const ltv12 = client?.ai_sales_intelligence?.ltv_12_months || avgTicket * 1.2;
    const ltv36 = client?.ai_sales_intelligence?.ltv_36_months || avgTicket * 3;

    // Histórico mensal dos últimos 6 meses
    const now = new Date();
    const monthlyData = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const label = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      const rev = closedSales
        .filter(s => {
          const sd = new Date(s.sale_date);
          return sd.getMonth() === d.getMonth() && sd.getFullYear() === d.getFullYear();
        })
        .reduce((sum, s) => sum + (s.sale_value || 0), 0);
      return { month: label, receita: rev };
    });

    return { totalRevenue, avgTicket, conversionRate, ltv12, ltv36, closedSales, monthlyData };
  }, [sales, visits, client]);

  return (
    <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-indigo-600" />
          Dashboard KPIs — {client?.first_name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 bg-white rounded-lg border border-green-200">
            <p className="text-[10px] text-slate-500 mb-1 flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-green-600" /> Ticket Médio
            </p>
            <p className="text-lg font-bold text-green-700">
              R$ {kpis.avgTicket.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="p-3 bg-white rounded-lg border border-blue-200">
            <p className="text-[10px] text-slate-500 mb-1 flex items-center gap-1">
              <Target className="w-3 h-3 text-blue-600" /> Taxa Conversão
            </p>
            <p className="text-lg font-bold text-blue-700">{kpis.conversionRate}%</p>
            <p className="text-[10px] text-slate-400">{kpis.closedSales.length} vendas / {visits.length} visitas</p>
          </div>
          <div className="p-3 bg-white rounded-lg border border-purple-200">
            <p className="text-[10px] text-slate-500 mb-1">LTV 12 meses</p>
            <p className="text-lg font-bold text-purple-700">
              R$ {(kpis.ltv12 / 1000).toFixed(1)}k
            </p>
          </div>
          <div className="p-3 bg-white rounded-lg border border-indigo-200">
            <p className="text-[10px] text-slate-500 mb-1">LTV 36 meses</p>
            <p className="text-lg font-bold text-indigo-700">
              R$ {(kpis.ltv36 / 1000).toFixed(1)}k
            </p>
          </div>
        </div>

        {/* Receita histórica */}
        {kpis.totalRevenue > 0 && (
          <div>
            <p className="text-[10px] font-semibold text-slate-600 mb-2">Receita — Últimos 6 meses</p>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={kpis.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} tickFormatter={v => v > 0 ? `${(v/1000).toFixed(0)}k` : '0'} />
                <Tooltip formatter={v => `R$ ${(v/1000).toFixed(1)}k`} />
                <Bar dataKey="receita" fill="#6366f1" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {kpis.totalRevenue === 0 && (
          <p className="text-xs text-slate-400 text-center py-2">Nenhuma venda fechada ainda — KPIs serão calculados após a primeira venda.</p>
        )}
      </CardContent>
    </Card>
  );
}
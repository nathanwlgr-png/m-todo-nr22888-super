import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, Target, Clock } from 'lucide-react';

export default function SalesKPIDashboard() {
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(false);

  const { data: leads = [] } = useQuery({
    queryKey: ['leads-kpi'],
    queryFn: () => base44.entities.Lead.list('-created_date'),
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['sales-kpi'],
    queryFn: () => base44.entities.Sale.list('-sale_date'),
  });

  useEffect(() => {
    if (leads.length > 0 && sales.length > 0) {
      calculateKPIs();
    }
  }, [leads.length, sales.length]);

  const calculateKPIs = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('calculateSalesKPIs', {
        leads: leads.slice(0, 100),
        sales: sales.slice(0, 100)
      });
      if (res.data) {
        setKpis(res.data);
      }
    } catch (error) {
      console.error('Erro ao calcular KPIs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !kpis) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-2" />
          <p className="text-sm text-slate-500">Calculando KPIs...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {/* Conversão */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-600">Taxa de Conversão</span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-indigo-600">{kpis.conversion_rate || 0}%</div>
          <p className="text-[10px] text-slate-500 mt-1">
            {kpis.converted_count || 0} de {kpis.total_leads || 0}
          </p>
        </CardContent>
      </Card>

      {/* Ticket Médio */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-600">Ticket Médio</span>
            <Badge className="bg-green-100 text-green-700 text-[10px]">R$</Badge>
          </div>
          <div className="text-2xl font-bold text-green-600">
            {kpis.average_deal_value ? `${(kpis.average_deal_value / 1000).toFixed(1)}k` : 'N/A'}
          </div>
          <p className="text-[10px] text-slate-500 mt-1">
            Total: R$ {kpis.total_sales_value ? (kpis.total_sales_value / 1000).toFixed(0) : 0}k
          </p>
        </CardContent>
      </Card>

      {/* Ciclo de Vendas */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-600">Ciclo de Vendas</span>
            <Clock className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-600">{kpis.average_cycle_days || 0} dias</div>
          <p className="text-[10px] text-slate-500 mt-1">Média até conversão</p>
        </CardContent>
      </Card>

      {/* Meta */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-600">Meta Mensal</span>
            <Target className="w-4 h-4 text-orange-600" />
          </div>
          <div className="text-2xl font-bold text-orange-600">
            {kpis.monthly_goal_progress || 0}%
          </div>
          <p className="text-[10px] text-slate-500 mt-1">
            R$ {kpis.total_sales_value ? (kpis.total_sales_value / 1000).toFixed(0) : 0}k / {kpis.monthly_goal ? (kpis.monthly_goal / 1000).toFixed(0) : 0}k
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
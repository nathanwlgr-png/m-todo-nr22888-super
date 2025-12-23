import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Package, TrendingUp, DollarSign, TrendingDown, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function SalesOverview() {
  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      try {
        const data = await base44.entities.Client.list();
        return data.filter(c => c && c.id && c.first_name);
      } catch (error) {
        console.error('Erro ao carregar clientes:', error);
        return [];
      }
    },
    staleTime: 30 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 0
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['sales'],
    queryFn: async () => {
      try {
        return await base44.entities.Sale.list();
      } catch (error) {
        console.error('Erro ao carregar vendas:', error);
        return [];
      }
    },
    staleTime: 30 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 0
  });

  const { data: consumableOrders = [] } = useQuery({
    queryKey: ['consumable-orders'],
    queryFn: async () => {
      try {
        return await base44.entities.ConsumableOrder.list();
      } catch (error) {
        console.error('Erro ao carregar pedidos:', error);
        return [];
      }
    },
    staleTime: 30 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 0
  });

  const { data: visits = [] } = useQuery({
    queryKey: ['all-visits'],
    queryFn: async () => {
      try {
        return await base44.entities.Visit.list('-scheduled_date', 100);
      } catch (error) {
        console.error('Erro ao carregar visitas:', error);
        return [];
      }
    },
    staleTime: 30 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 0
  });

  // Análise expandida de vendas
  const analytics = useMemo(() => {
    const now = new Date();
    const thisMonth = sales.filter(s => {
      const saleDate = new Date(s.sale_date);
      return saleDate.getMonth() === now.getMonth() && 
             saleDate.getFullYear() === now.getFullYear();
    });

    const lastMonth = sales.filter(s => {
      const saleDate = new Date(s.sale_date);
      const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1);
      return saleDate.getMonth() === lastMonthDate.getMonth() && 
             saleDate.getFullYear() === lastMonthDate.getFullYear();
    });

    const confirmedSales = sales.filter(s => s.status === 'fechada' || s.status === 'entregue');
    const equipmentRevenue = confirmedSales.reduce((sum, s) => sum + (s.sale_value || 0), 0);
    const avgDealSize = confirmedSales.length > 0 ? equipmentRevenue / confirmedSales.length : 0;

    const hotClients = clients.filter(c => c.status === 'quente').length;
    const warmClients = clients.filter(c => c.status === 'morno').length;
    const completedVisits = visits.filter(v => v.status === 'realizada').length;
    const scheduledVisits = visits.filter(v => v.status === 'agendada').length;

    const monthGrowth = lastMonth.length > 0 
      ? ((thisMonth.length - lastMonth.length) / lastMonth.length) * 100 
      : 0;

    const conversionRate = clients.length > 0 ? (confirmedSales.length / clients.length) * 100 : 0;

    // Insumos
    const totalConsumables = consumableOrders.filter(o => o.status === 'entregue').length;
    const consumablesRevenue = consumableOrders
      .filter(o => o.status === 'entregue')
      .reduce((sum, o) => sum + (o.total_value || 0), 0);

    return {
      thisMonthSales: thisMonth.length,
      totalSales: confirmedSales.length,
      equipmentRevenue,
      avgDealSize,
      monthGrowth,
      conversionRate,
      hotClients,
      warmClients,
      completedVisits,
      scheduledVisits,
      totalConsumables,
      consumablesRevenue,
      closedSaleClients: clients.filter(c => c.sale_closed)
    };
  }, [sales, clients, visits, consumableOrders]);

  return (
    <div className="space-y-4">
      {/* Vendas Fechadas Aguardando Assinatura */}
      {analytics.closedSaleClients.length > 0 && (
        <Card className="p-4 bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-300 shadow-lg">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-yellow-500 flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Vendas Aguardando Assinatura</h3>
              <p className="text-xs text-slate-600">Equipamentos fechados pendentes</p>
            </div>
          </div>

          <div className="space-y-2">
            {analytics.closedSaleClients.map((client) => (
              <div key={client.id} className="p-3 bg-white rounded-lg border-2 border-yellow-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-800">{client.first_name}</p>
                    <p className="text-sm text-slate-600">{client.equipment_sold}</p>
                  </div>
                  {client.contract_signature_date && (
                    <Badge className="bg-yellow-100 text-yellow-700">
                      📝 {new Date(client.contract_signature_date).toLocaleDateString('pt-BR')}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Análise Expandida de Vendas */}
      <Card className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-green-600 flex items-center justify-center">
            <Package className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Análise de Vendas</h3>
            <p className="text-xs text-slate-600">Performance detalhada</p>
          </div>
        </div>

        {/* Métricas Principais */}
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="text-center p-3 bg-white rounded-lg border border-green-200">
            <p className="text-2xl font-bold text-green-700">{analytics.thisMonthSales}</p>
            <p className="text-xs text-slate-600">Este Mês</p>
            {analytics.monthGrowth !== 0 && (
              <div className="flex items-center justify-center gap-1 mt-1">
                {analytics.monthGrowth > 0 ? (
                  <TrendingUp className="w-3 h-3 text-green-600" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-600" />
                )}
                <p className={`text-[10px] font-semibold ${analytics.monthGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {Math.abs(analytics.monthGrowth).toFixed(0)}%
                </p>
              </div>
            )}
          </div>

          <div className="text-center p-3 bg-white rounded-lg border border-green-200">
            <p className="text-2xl font-bold text-green-700">
              R$ {(analytics.equipmentRevenue / 1000).toFixed(0)}k
            </p>
            <p className="text-xs text-slate-600">Receita Total</p>
            <p className="text-[10px] text-slate-500 mt-1">
              Ticket: R$ {(analytics.avgDealSize / 1000).toFixed(0)}k
            </p>
          </div>

          <div className="text-center p-3 bg-white rounded-lg border border-green-200">
            <p className="text-2xl font-bold text-green-700">
              {analytics.conversionRate.toFixed(1)}%
            </p>
            <p className="text-xs text-slate-600">Conversão</p>
          </div>
        </div>

        {/* Métricas Secundárias */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 bg-red-50 rounded-lg border border-red-200">
            <p className="text-lg font-bold text-red-600">{analytics.hotClients}</p>
            <p className="text-[10px] text-slate-600">Quentes</p>
          </div>
          <div className="text-center p-2 bg-orange-50 rounded-lg border border-orange-200">
            <p className="text-lg font-bold text-orange-600">{analytics.warmClients}</p>
            <p className="text-[10px] text-slate-600">Mornos</p>
          </div>
          <div className="text-center p-2 bg-green-50 rounded-lg border border-green-200">
            <p className="text-lg font-bold text-green-600">{analytics.completedVisits}</p>
            <p className="text-[10px] text-slate-600">Visitas</p>
          </div>
        </div>
      </Card>

      {/* Cliente Recente: Dr. Fausto */}
      {clients.some(c => c.first_name?.includes('Fausto')) && (
        <Card className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-300 shadow-lg">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Cliente Recém-Cadastrado</h3>
              <p className="text-xs text-slate-600">Dr. Fausto - CEDVET Marília</p>
            </div>
          </div>

          {clients.filter(c => c.first_name?.includes('Fausto')).map(client => (
            <div key={client.id} className="space-y-2">
              <div className="p-3 bg-white rounded-lg border border-purple-200">
                <p className="font-semibold text-slate-800 mb-1">{client.first_name}</p>
                <p className="text-sm text-slate-600 mb-2">{client.clinic_name}</p>
                
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div className="text-center p-2 bg-purple-50 rounded">
                    <p className="text-lg font-bold text-purple-700">{client.total_visits_count || 0}</p>
                    <p className="text-xs text-slate-600">Visitas</p>
                  </div>
                  <div className="text-center p-2 bg-orange-50 rounded">
                    <p className="text-lg font-bold text-orange-700">{client.purchase_score || 0}%</p>
                    <p className="text-xs text-slate-600">Score</p>
                  </div>
                </div>

                <div className="text-xs text-slate-600 space-y-1 mb-3">
                  <p>🎯 <strong>Interesse:</strong> {client.equipment_interest || 'VG2'}</p>
                  <p>⚠️ <strong>Objeção:</strong> Descapitalizado pós-reforma</p>
                  <p>💡 <strong>Decisor:</strong> Marcos (sócio hesitante)</p>
                  <p>📅 <strong>Próximo:</strong> Follow-up estruturado</p>
                </div>

                <Link to={createPageUrl(`ClientProfile?id=${client.id}`)}>
                  <Button className="w-full bg-purple-600 hover:bg-purple-700">
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Ver Perfil Completo
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
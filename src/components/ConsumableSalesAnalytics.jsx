import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Package, BarChart3, Calendar, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ConsumableSalesAnalytics({ clientId }) {
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['consumable-orders', clientId],
    queryFn: () => base44.entities.ConsumableOrder.filter({ client_id: clientId })
  });

  const { data: allOrders = [] } = useQuery({
    queryKey: ['all-consumable-orders'],
    queryFn: () => base44.entities.ConsumableOrder.list()
  });

  if (isLoading) {
    return (
      <Card className="p-4">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-600 mx-auto" />
      </Card>
    );
  }

  if (orders.length === 0) {
    return (
      <Card className="p-6 text-center bg-slate-50">
        <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
        <p className="text-sm text-slate-500">Nenhuma venda de insumo registrada</p>
      </Card>
    );
  }

  // Análise de vendas por insumo para este cliente
  const salesByConsumable = orders.reduce((acc, order) => {
    const key = order.consumable_name;
    if (!acc[key]) {
      acc[key] = {
        name: key,
        total_quantity: 0,
        total_value: 0,
        count: 0,
        last_purchase: order.order_date
      };
    }
    acc[key].total_quantity += order.quantity || 0;
    acc[key].total_value += order.total_value || 0;
    acc[key].count += 1;
    if (new Date(order.order_date) > new Date(acc[key].last_purchase)) {
      acc[key].last_purchase = order.order_date;
    }
    return acc;
  }, {});

  const topConsumables = Object.values(salesByConsumable)
    .sort((a, b) => b.total_value - a.total_value)
    .slice(0, 5);

  // Rotor mais vendido globalmente
  const globalSalesByConsumable = allOrders.reduce((acc, order) => {
    const key = order.consumable_name;
    if (!acc[key]) {
      acc[key] = { name: key, total: 0 };
    }
    acc[key].total += order.quantity || 0;
    return acc;
  }, {});

  const topGlobal = Object.values(globalSalesByConsumable)
    .sort((a, b) => b.total - a.total)[0];

  // Predição de próxima compra
  const predictions = topConsumables.map(item => {
    const daysSinceLastPurchase = Math.floor(
      (new Date() - new Date(item.last_purchase)) / (1000 * 60 * 60 * 24)
    );
    const avgFrequency = daysSinceLastPurchase / item.count;
    const daysToNextPurchase = Math.max(0, Math.round(avgFrequency - daysSinceLastPurchase));
    
    return {
      name: item.name,
      days: daysToNextPurchase,
      quantity: Math.round(item.total_quantity / item.count)
    };
  });

  const chartData = topConsumables.map(item => ({
    name: item.name.substring(0, 15),
    value: item.total_value
  }));

  return (
    <Card className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-slate-800">Análise de Vendas de Insumos</h3>
          <p className="text-xs text-slate-600">Histórico e previsões</p>
        </div>
      </div>

      {/* Rotor mais vendido globalmente */}
      {topGlobal && (
        <div className="mb-4 p-3 bg-gradient-to-r from-amber-100 to-orange-100 rounded-lg border border-amber-300">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-amber-700" />
            <p className="text-xs font-semibold text-amber-700">🏆 INSUMO MAIS VENDIDO (GERAL)</p>
          </div>
          <p className="font-bold text-amber-900">{topGlobal.name}</p>
          <p className="text-xs text-amber-700">{topGlobal.total} unidades vendidas</p>
        </div>
      )}

      {/* Top Insumos deste Cliente */}
      <div className="space-y-2 mb-4">
        <p className="text-xs font-semibold text-purple-700">TOP INSUMOS VENDIDOS</p>
        {topConsumables.map((item, idx) => (
          <div key={idx} className="p-3 bg-white rounded-lg border border-purple-200">
            <div className="flex items-center justify-between mb-1">
              <p className="font-semibold text-slate-800 text-sm">{item.name}</p>
              <Badge className="bg-purple-100 text-purple-700">#{idx + 1}</Badge>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <p className="text-slate-500">Quantidade</p>
                <p className="font-semibold text-slate-700">{item.total_quantity}</p>
              </div>
              <div>
                <p className="text-slate-500">Valor Total</p>
                <p className="font-semibold text-green-600">R$ {item.total_value.toLocaleString('pt-BR')}</p>
              </div>
              <div>
                <p className="text-slate-500">Pedidos</p>
                <p className="font-semibold text-slate-700">{item.count}x</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Gráfico */}
      <div className="bg-white rounded-lg p-3 mb-4">
        <p className="text-xs font-semibold text-slate-700 mb-3">VENDAS POR INSUMO</p>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Bar dataKey="value" fill="#9333ea" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Previsões de Compra */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-indigo-700">🔮 PREVISÃO DE PRÓXIMAS COMPRAS</p>
        {predictions.filter(p => p.days <= 30).map((pred, idx) => (
          <div key={idx} className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="font-semibold text-slate-800 text-sm">{pred.name}</p>
                <p className="text-xs text-slate-600 mt-1">
                  Previsão: ~{pred.quantity} unidades em ~{pred.days} dias
                </p>
              </div>
              <Calendar className="w-4 h-4 text-indigo-600" />
            </div>
          </div>
        ))}
        {predictions.filter(p => p.days <= 30).length === 0 && (
          <p className="text-xs text-slate-500 text-center py-2">
            Sem compras previstas nos próximos 30 dias
          </p>
        )}
      </div>
    </Card>
  );
}
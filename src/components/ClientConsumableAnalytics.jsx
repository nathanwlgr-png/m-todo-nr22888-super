import React, { useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, Package, Calendar, AlertCircle, Sparkles } from 'lucide-react';
import { differenceInDays, format, addDays } from 'date-fns';

export default function ClientConsumableAnalytics({ clientId, clientName }) {
  const { data: orders = [] } = useQuery({
    queryKey: ['consumable-orders', clientId],
    queryFn: () => base44.entities.ConsumableOrder.filter({ client_id: clientId }),
    enabled: !!clientId
  });

  const analytics = useMemo(() => {
    if (orders.length === 0) return null;

    // Agrupar por insumo
    const byConsumable = {};
    orders.forEach(order => {
      if (!byConsumable[order.consumable_id]) {
        byConsumable[order.consumable_id] = {
          name: order.consumable_name,
          orders: [],
          totalQuantity: 0,
          totalValue: 0
        };
      }
      byConsumable[order.consumable_id].orders.push(order);
      byConsumable[order.consumable_id].totalQuantity += order.quantity;
      byConsumable[order.consumable_id].totalValue += order.total_value || 0;
    });

    // Top insumos
    const topConsumables = Object.values(byConsumable)
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, 5);

    // Calcular frequência média de pedidos
    const predictions = {};
    Object.entries(byConsumable).forEach(([id, data]) => {
      if (data.orders.length >= 2) {
        const sortedOrders = data.orders
          .filter(o => o.order_date)
          .sort((a, b) => new Date(a.order_date) - new Date(b.order_date));
        
        if (sortedOrders.length >= 2) {
          const intervals = [];
          for (let i = 1; i < sortedOrders.length; i++) {
            const days = differenceInDays(
              new Date(sortedOrders[i].order_date),
              new Date(sortedOrders[i - 1].order_date)
            );
            if (days > 0) intervals.push(days);
          }
          
          if (intervals.length > 0) {
            const avgInterval = Math.round(
              intervals.reduce((a, b) => a + b, 0) / intervals.length
            );
            const lastOrder = new Date(sortedOrders[sortedOrders.length - 1].order_date);
            const nextPredicted = addDays(lastOrder, avgInterval);
            const daysUntilNext = differenceInDays(nextPredicted, new Date());
            
            predictions[id] = {
              name: data.name,
              avgInterval,
              nextPredicted,
              daysUntilNext,
              lastQuantity: sortedOrders[sortedOrders.length - 1].quantity
            };
          }
        }
      }
    });

    // Insumos com pedido previsto próximo (próximos 7 dias)
    const upcomingOrders = Object.values(predictions)
      .filter(p => p.daysUntilNext <= 7 && p.daysUntilNext >= 0)
      .sort((a, b) => a.daysUntilNext - b.daysUntilNext);

    return {
      topConsumables,
      predictions,
      upcomingOrders,
      totalOrders: orders.length,
      totalValue: orders.reduce((sum, o) => sum + (o.total_value || 0), 0)
    };
  }, [orders]);

  if (!analytics || orders.length === 0) {
    return (
      <Card className="p-4 bg-slate-50 border-slate-200">
        <div className="flex items-center gap-3">
          <Package className="w-5 h-5 text-slate-400" />
          <div>
            <p className="text-sm font-medium text-slate-700">Histórico de Insumos</p>
            <p className="text-xs text-slate-500">Nenhum pedido registrado ainda</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {/* Stats Overview */}
      <Card className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-purple-900">Análise de Insumos</p>
            <p className="text-xs text-purple-700">{analytics.totalOrders} pedidos registrados</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-white rounded-lg">
            <p className="text-xs text-slate-500">Total Gasto</p>
            <p className="text-lg font-bold text-slate-800">
              R$ {analytics.totalValue.toLocaleString('pt-BR')}
            </p>
          </div>
          <div className="p-3 bg-white rounded-lg">
            <p className="text-xs text-slate-500">Insumos Únicos</p>
            <p className="text-lg font-bold text-slate-800">
              {analytics.topConsumables.length}
            </p>
          </div>
        </div>
      </Card>

      {/* Previsões de Pedidos */}
      {analytics.upcomingOrders.length > 0 && (
        <Card className="p-4 bg-amber-50 border-amber-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-900 mb-2">
                Pedidos Previstos (Próximos 7 dias)
              </p>
              {analytics.upcomingOrders.map((pred, idx) => (
                <div key={idx} className="mb-2 last:mb-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-amber-800">{pred.name}</span>
                    <Badge className="bg-amber-200 text-amber-900 text-xs">
                      {pred.daysUntilNext === 0 ? 'Hoje' : `${pred.daysUntilNext}d`}
                    </Badge>
                  </div>
                  <p className="text-xs text-amber-700">
                    Próximo pedido previsto: {format(pred.nextPredicted, 'dd/MM/yyyy')}
                  </p>
                  <p className="text-xs text-amber-600">
                    Quantidade usual: {pred.lastQuantity} unidades
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Top Insumos */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <h3 className="text-sm font-semibold text-slate-800">Insumos Mais Pedidos</h3>
        </div>
        
        <div className="space-y-2">
          {analytics.topConsumables.map((consumable, idx) => {
            const prediction = analytics.predictions[Object.keys(analytics.predictions).find(
              key => analytics.predictions[key].name === consumable.name
            )];
            
            return (
              <div key={idx} className="p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-slate-800">{consumable.name}</span>
                  <Badge variant="outline" className="text-xs">
                    #{idx + 1}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-600">
                  <span>{consumable.totalQuantity} unidades</span>
                  <span>•</span>
                  <span>R$ {consumable.totalValue.toLocaleString('pt-BR')}</span>
                  <span>•</span>
                  <span>{consumable.orders.length} pedidos</span>
                </div>
                {prediction && (
                  <div className="mt-1 text-xs text-slate-500">
                    <Calendar className="w-3 h-3 inline mr-1" />
                    Pedido a cada ~{prediction.avgInterval} dias
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
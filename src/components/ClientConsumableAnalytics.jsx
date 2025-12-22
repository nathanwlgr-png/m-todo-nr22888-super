import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Package,
  TrendingUp,
  Calendar,
  DollarSign,
  Settings,
  Sparkles,
  AlertCircle,
  ShoppingCart,
  Gift
} from 'lucide-react';
import { format, addDays, differenceInDays } from 'date-fns';

export default function ClientConsumableAnalytics({ clientId, clientName }) {
  const queryClient = useQueryClient();
  const [prefDialog, setPrefDialog] = useState(false);
  const [editingPref, setEditingPref] = useState(null);

  const { data: orders = [] } = useQuery({
    queryKey: ['consumable-orders', clientId],
    queryFn: () => base44.entities.ConsumableOrder.filter({ client_id: clientId }),
    enabled: !!clientId
  });

  const { data: preferences = [] } = useQuery({
    queryKey: ['consumable-preferences', clientId],
    queryFn: () => base44.entities.ConsumablePreference.filter({ client_id: clientId }),
    enabled: !!clientId
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['client-sales', clientId],
    queryFn: () => base44.entities.Sale.filter({ client_id: clientId }),
    enabled: !!clientId
  });

  const { data: consumables = [] } = useQuery({
    queryKey: ['consumables'],
    queryFn: () => base44.entities.Consumable.list()
  });

  const { data: equipment = [] } = useQuery({
    queryKey: ['equipment'],
    queryFn: () => base44.entities.Equipment.list()
  });

  const savePrefMutation = useMutation({
    mutationFn: (data) => {
      if (editingPref?.id) {
        return base44.entities.ConsumablePreference.update(editingPref.id, data);
      } else {
        return base44.entities.ConsumablePreference.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['consumable-preferences']);
      setPrefDialog(false);
      setEditingPref(null);
    }
  });

  // Calcular analytics avançados
  const analytics = useMemo(() => {
    if (orders.length === 0) return null;

    const totalOrders = orders.length;
    const totalValue = orders.reduce((sum, o) => sum + (o.total_value || 0), 0);
    const uniqueConsumables = [...new Set(orders.map(o => o.consumable_id))];

    // Agrupar por insumo
    const byConsumable = {};
    orders.forEach(order => {
      if (!byConsumable[order.consumable_id]) {
        byConsumable[order.consumable_id] = {
          consumable_id: order.consumable_id,
          consumable_name: order.consumable_name,
          orders: [],
          total_quantity: 0,
          total_value: 0
        };
      }
      byConsumable[order.consumable_id].orders.push(order);
      byConsumable[order.consumable_id].total_quantity += order.quantity || 0;
      byConsumable[order.consumable_id].total_value += order.total_value || 0;
    });

    // Calcular frequência e previsão para cada insumo
    const topConsumables = Object.values(byConsumable).map(item => {
      const sortedOrders = item.orders.sort((a, b) => 
        new Date(a.order_date) - new Date(b.order_date)
      );

      // Calcular intervalo médio entre pedidos
      let totalDays = 0;
      let intervals = 0;
      for (let i = 1; i < sortedOrders.length; i++) {
        const days = differenceInDays(
          new Date(sortedOrders[i].order_date),
          new Date(sortedOrders[i - 1].order_date)
        );
        totalDays += days;
        intervals++;
      }
      const avgFrequency = intervals > 0 ? Math.round(totalDays / intervals) : 30;

      // Verificar preferência customizada
      const pref = preferences.find(p => p.consumable_id === item.consumable_id);
      const frequency = pref?.custom_frequency_days || avgFrequency;

      // Última compra
      const lastOrder = sortedOrders[sortedOrders.length - 1];
      const lastOrderDate = new Date(lastOrder.order_date);
      const daysSinceLastOrder = differenceInDays(new Date(), lastOrderDate);

      // Previsão próximo pedido
      const nextOrderDate = addDays(lastOrderDate, frequency);
      const daysUntilNext = differenceInDays(nextOrderDate, new Date());

      // Buscar dados de sazonalidade do insumo
      const consumableData = consumables.find(c => c.id === item.consumable_id);
      const currentMonth = new Date().getMonth() + 1;
      let seasonalMultiplier = 1;
      
      if (consumableData?.seasonal_demand) {
        const { peak_months, low_months, peak_multiplier = 1.3, low_multiplier = 0.7 } = consumableData.seasonal_demand;
        if (peak_months?.includes(currentMonth)) {
          seasonalMultiplier = peak_multiplier;
        } else if (low_months?.includes(currentMonth)) {
          seasonalMultiplier = low_multiplier;
        }
      }

      // Considerar ciclo de vida do equipamento
      let lifecycleMultiplier = 1;
      if (sales.length > 0) {
        const firstSale = sales.sort((a, b) => new Date(a.sale_date) - new Date(b.sale_date))[0];
        const monthsSincePurchase = differenceInDays(new Date(), new Date(firstSale.sale_date)) / 30;
        
        if (consumableData?.equipment_lifecycle_usage) {
          const { initial_months = 3, initial_multiplier = 1.5 } = consumableData.equipment_lifecycle_usage;
          if (monthsSincePurchase < initial_months) {
            lifecycleMultiplier = initial_multiplier;
          }
        }
      }

      // Previsão ajustada
      const baseQuantity = pref?.preferred_quantity || 
        (item.total_quantity / item.orders.length);
      const predictedQuantity = Math.round(baseQuantity * seasonalMultiplier * lifecycleMultiplier);

      return {
        ...item,
        frequency,
        lastOrderDate,
        daysSinceLastOrder,
        nextOrderDate,
        daysUntilNext,
        avgQuantity: Math.round(item.total_quantity / item.orders.length),
        predictedQuantity,
        seasonalMultiplier,
        lifecycleMultiplier,
        hasCustomPreference: !!pref,
        preference: pref
      };
    }).sort((a, b) => b.total_value - a.total_value);

    // Pedidos próximos (próximos 7 dias)
    const upcomingOrders = topConsumables.filter(item => 
      item.daysUntilNext >= 0 && item.daysUntilNext <= 7
    );

    // Pedidos atrasados
    const overdueOrders = topConsumables.filter(item => item.daysUntilNext < 0);

    // Bundle recomendado baseado no equipamento
    let recommendedBundle = null;
    if (sales.length > 0) {
      const clientEquipment = equipment.find(e => 
        sales.some(s => s.equipment_id === e.id)
      );
      if (clientEquipment?.recommended_bundle) {
        recommendedBundle = clientEquipment.recommended_bundle;
      }
    }

    return {
      totalOrders,
      totalValue,
      uniqueConsumables: uniqueConsumables.length,
      topConsumables,
      upcomingOrders,
      overdueOrders,
      recommendedBundle
    };
  }, [orders, preferences, sales, consumables, equipment]);

  const handleEditPreference = (consumable) => {
    const existing = preferences.find(p => p.consumable_id === consumable.consumable_id);
    setEditingPref({
      ...existing,
      client_id: clientId,
      client_name: clientName,
      consumable_id: consumable.consumable_id,
      consumable_name: consumable.consumable_name,
      custom_frequency_days: existing?.custom_frequency_days || consumable.frequency,
      preferred_quantity: existing?.preferred_quantity || consumable.avgQuantity,
      auto_order_enabled: existing?.auto_order_enabled || false,
      alert_days_before: existing?.alert_days_before || 7
    });
    setPrefDialog(true);
  };

  const handleSavePreference = () => {
    savePrefMutation.mutate(editingPref);
  };

  if (!analytics) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <Card className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">Análise de Insumos</h3>
            <p className="text-xs text-slate-600">Previsão inteligente com sazonalidade</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">{analytics.totalOrders}</p>
            <p className="text-xs text-slate-600">Pedidos</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              R$ {(analytics.totalValue / 1000).toFixed(1)}k
            </p>
            <p className="text-xs text-slate-600">Total Gasto</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-indigo-600">{analytics.uniqueConsumables}</p>
            <p className="text-xs text-slate-600">Insumos</p>
          </div>
        </div>
      </Card>

      {/* Bundle Recomendado */}
      {analytics.recommendedBundle && (
        <Card className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600 flex items-center justify-center flex-shrink-0">
              <Gift className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-slate-800 mb-1">
                {analytics.recommendedBundle.bundle_name}
              </h4>
              <p className="text-sm text-slate-600 mb-2">
                Kit recomendado para seu equipamento
              </p>
              <div className="space-y-1 mb-3">
                {analytics.recommendedBundle.consumables?.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="text-slate-700">• {item.consumable_name}</span>
                    <span className="text-slate-500">
                      {item.recommended_quantity}x a cada {item.frequency_days} dias
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-800">
                  Custo estimado: R$ {analytics.recommendedBundle.monthly_estimated_cost?.toLocaleString('pt-BR')}/mês
                </span>
                {analytics.recommendedBundle.discount_percentage > 0 && (
                  <Badge className="bg-green-100 text-green-700">
                    -{analytics.recommendedBundle.discount_percentage}% no bundle
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Alertas de Pedidos Atrasados */}
      {analytics.overdueOrders.length > 0 && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <h4 className="font-semibold text-red-800">Pedidos Atrasados</h4>
          </div>
          <div className="space-y-2">
            {analytics.overdueOrders.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <span className="text-sm text-slate-700">{item.consumable_name}</span>
                <Badge variant="outline" className="border-red-300 text-red-700">
                  {Math.abs(item.daysUntilNext)} dias atrasado
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Próximos Pedidos */}
      {analytics.upcomingOrders.length > 0 && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-5 h-5 text-blue-600" />
            <h4 className="font-semibold text-blue-800">Próximos Pedidos (7 dias)</h4>
          </div>
          <div className="space-y-2">
            {analytics.upcomingOrders.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-800">{item.consumable_name}</p>
                  <p className="text-xs text-slate-600">
                    Previsão: {format(item.nextOrderDate, 'dd/MM/yyyy')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-blue-600">
                    {item.predictedQuantity}x
                  </p>
                  {item.seasonalMultiplier !== 1 && (
                    <p className="text-xs text-slate-500">
                      {item.seasonalMultiplier > 1 ? '↑' : '↓'} Sazonalidade
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Top Insumos */}
      <div>
        <h4 className="text-sm font-semibold text-slate-700 mb-3 px-1">Top Insumos Comprados</h4>
        <div className="space-y-3">
          {analytics.topConsumables.slice(0, 5).map((item, idx) => (
            <Card key={idx} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h5 className="font-semibold text-slate-800">{item.consumable_name}</h5>
                    {item.hasCustomPreference && (
                      <Badge variant="outline" className="text-xs border-purple-300 text-purple-700">
                        Personalizado
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-600">
                    {item.orders.length} pedidos • {item.total_quantity} unidades
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleEditPreference(item)}
                  className="flex-shrink-0"
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="text-center p-2 bg-slate-50 rounded-lg">
                  <p className="text-lg font-bold text-slate-800">
                    {item.frequency} dias
                  </p>
                  <p className="text-xs text-slate-600">Frequência</p>
                </div>
                <div className="text-center p-2 bg-green-50 rounded-lg">
                  <p className="text-lg font-bold text-green-600">
                    R$ {(item.total_value / 1000).toFixed(1)}k
                  </p>
                  <p className="text-xs text-slate-600">Total Gasto</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">
                  Último pedido: {format(item.lastOrderDate, 'dd/MM/yyyy')}
                </span>
                <span className={`font-medium ${
                  item.daysUntilNext < 0 ? 'text-red-600' :
                  item.daysUntilNext <= 7 ? 'text-amber-600' :
                  'text-green-600'
                }`}>
                  Próximo em {item.daysUntilNext} dias
                </span>
              </div>

              {(item.seasonalMultiplier !== 1 || item.lifecycleMultiplier !== 1) && (
                <div className="mt-2 p-2 bg-indigo-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <p className="text-xs text-indigo-700">
                      Previsão ajustada: {item.predictedQuantity}x
                      {item.seasonalMultiplier !== 1 && ` (${item.seasonalMultiplier}x sazonalidade)`}
                      {item.lifecycleMultiplier !== 1 && ` (${item.lifecycleMultiplier}x ciclo de vida)`}
                    </p>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* Dialog de Preferências */}
      <Dialog open={prefDialog} onOpenChange={setPrefDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configurar Frequência de Pedido</DialogTitle>
          </DialogHeader>
          
          {editingPref && (
            <div className="space-y-4 py-4">
              <div>
                <Label className="text-xs text-slate-600">Insumo</Label>
                <p className="font-semibold text-slate-800">{editingPref.consumable_name}</p>
              </div>

              <div>
                <Label>Frequência (dias) *</Label>
                <Input
                  type="number"
                  value={editingPref.custom_frequency_days || ''}
                  onChange={(e) => setEditingPref({
                    ...editingPref,
                    custom_frequency_days: parseInt(e.target.value)
                  })}
                  placeholder="Ex: 15"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Quantos dias entre cada pedido
                </p>
              </div>

              <div>
                <Label>Quantidade Preferida *</Label>
                <Input
                  type="number"
                  value={editingPref.preferred_quantity || ''}
                  onChange={(e) => setEditingPref({
                    ...editingPref,
                    preferred_quantity: parseInt(e.target.value)
                  })}
                  placeholder="Ex: 10"
                />
              </div>

              <div>
                <Label>Alertar quantos dias antes?</Label>
                <Input
                  type="number"
                  value={editingPref.alert_days_before || 7}
                  onChange={(e) => setEditingPref({
                    ...editingPref,
                    alert_days_before: parseInt(e.target.value)
                  })}
                />
              </div>

              <Button
                onClick={handleSavePreference}
                disabled={savePrefMutation.isPending}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                Salvar Preferência
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
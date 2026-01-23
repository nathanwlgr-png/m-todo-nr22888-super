import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingDown, CheckCircle2 } from 'lucide-react';

export default function InventoryStockDisplay({ clientId }) {
  const { data: inventory = [] } = useQuery({
    queryKey: ['inventory-stock', clientId],
    queryFn: async () => {
      try {
        const allInventory = await base44.entities.MobVendedorInventory.list();
        return allInventory || [];
      } catch (error) {
        console.error('Erro ao buscar estoque:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  if (inventory.length === 0) {
    return null;
  }

  const criticalStock = inventory.filter(item => item.stock_status === 'critical');
  const lowStock = inventory.filter(item => item.stock_status === 'low');

  const getStatusBadge = (status) => {
    const config = {
      critical: { icon: AlertTriangle, color: 'bg-red-100 text-red-700', label: 'Crítico' },
      low: { icon: TrendingDown, color: 'bg-yellow-100 text-yellow-700', label: 'Baixo' },
      normal: { icon: CheckCircle2, color: 'bg-green-100 text-green-700', label: 'Normal' },
      high: { icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-700', label: 'Alto' }
    };
    return config[status] || config.normal;
  };

  return (
    <div className="space-y-3">
      {/* Alertas críticos */}
      {criticalStock.length > 0 && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-red-900">⚠️ Estoque Crítico</p>
              <p className="text-sm text-red-700 mt-1">
                {criticalStock.length} equipamento(s) zerado(s)
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                {criticalStock.map(item => (
                  <Badge key={item.id} className="bg-red-600 text-white text-xs">
                    {item.equipment_name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Estoque baixo */}
      {lowStock.length > 0 && (
        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <div className="flex items-start gap-3">
            <TrendingDown className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-yellow-900">📉 Estoque Baixo</p>
              <p className="text-sm text-yellow-700 mt-1">
                {lowStock.length} equipamento(s) abaixo do mínimo
              </p>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {lowStock.map(item => (
                  <div key={item.id} className="text-xs bg-white rounded p-2">
                    <p className="font-medium text-yellow-900">{item.equipment_name}</p>
                    <p className="text-yellow-700">
                      {item.current_stock}/{item.minimum_stock} un.
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Todos os itens */}
      <Card className="p-4 bg-gradient-to-r from-slate-50 to-slate-100">
        <h3 className="font-semibold text-slate-800 mb-3">📦 Estoque mobVendedor</h3>
        <div className="space-y-2">
          {inventory.map(item => {
            const statusConfig = getStatusBadge(item.stock_status);
            const StatusIcon = statusConfig.icon;
            
            return (
              <div key={item.id} className="flex items-center justify-between p-2 bg-white rounded-lg">
                <div className="flex items-center gap-3 flex-1">
                  <StatusIcon className={`w-4 h-4 ${statusConfig.color.split(' ')[0]}`} />
                  <div>
                    <p className="text-sm font-medium text-slate-800">{item.equipment_name}</p>
                    <p className="text-xs text-slate-500">
                      {item.current_stock} / {item.minimum_stock} un.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {item.price && (
                    <span className="text-xs text-slate-600">
                      R$ {item.price.toLocaleString('pt-BR')}
                    </span>
                  )}
                  <Badge className={statusConfig.color}>
                    {statusConfig.label}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
        
        {inventory.length > 0 && (
          <p className="text-xs text-slate-500 mt-3">
            Atualizado: {new Date(inventory[0].last_updated).toLocaleString('pt-BR')}
          </p>
        )}
      </Card>
    </div>
  );
}
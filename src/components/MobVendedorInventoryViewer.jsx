import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, TrendingUp, AlertTriangle } from 'lucide-react';

export default function MobVendedorInventoryViewer() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: inventory = [] } = useQuery({
    queryKey: ['mob_inventory'],
    queryFn: async () => {
      try {
        return await base44.entities.MobVendedorSync.list('-stock_quantity');
      } catch (error) {
        console.error('Erro ao buscar inventário:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  const filtered = inventory.filter(item =>
    item.equipment_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStock = inventory.filter(item => item.stock_quantity <= 3);
  const topSellers = inventory.sort((a, b) => (b.monthly_sales || 0) - (a.monthly_sales || 0)).slice(0, 5);

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Buscar equipamento..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Alerts */}
      {lowStock.length > 0 && (
        <Card className="p-3 bg-red-50 border-red-200">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-red-900">Estoque Baixo</p>
              <p className="text-sm text-red-700">{lowStock.length} equipamentos com estoque ≤ 3 unidades</p>
            </div>
          </div>
        </Card>
      )}

      {/* Inventário */}
      <div className="grid gap-3">
        {filtered.map(item => (
          <Card key={item.id} className="p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold text-slate-800">{item.equipment_name}</h3>
                <p className="text-xs text-slate-500">{item.category}</p>
              </div>
              <Badge className={
                item.stock_quantity > 10 ? 'bg-green-100 text-green-700' :
                item.stock_quantity > 3 ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }>
                {item.stock_quantity} un.
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="p-2 bg-slate-50 rounded">
                <p className="text-slate-500">Preço</p>
                <p className="font-semibold text-slate-800">R$ {(item.price || 0).toLocaleString('pt-BR')}</p>
              </div>
              <div className="p-2 bg-slate-50 rounded">
                <p className="text-slate-500">Vendas/mês</p>
                <p className="font-semibold text-slate-800">{item.monthly_sales || 0}</p>
              </div>
              <div className="p-2 bg-slate-50 rounded">
                <p className="text-slate-500">Faturamento</p>
                <p className="font-semibold text-slate-800">R$ {((item.monthly_sales || 0) * (item.price || 0)).toLocaleString('pt-BR')}</p>
              </div>
            </div>

            {item.last_sync && (
              <p className="text-xs text-slate-400 mt-2">
                Atualizado: {new Date(item.last_sync).toLocaleString('pt-BR')}
              </p>
            )}
          </Card>
        ))}
      </div>

      {/* Top Sellers */}
      {topSellers.length > 0 && (
        <Card className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-slate-800">Mais Vendidos (Mês)</h3>
          </div>
          <div className="space-y-2">
            {topSellers.map((item, idx) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-green-600 w-6">{idx + 1}º</span>
                  <div>
                    <p className="font-medium text-slate-800">{item.equipment_name}</p>
                    <p className="text-xs text-slate-500">{item.monthly_sales} vendas</p>
                  </div>
                </div>
                <p className="font-semibold text-green-700">R$ {((item.monthly_sales || 0) * (item.price || 0)).toLocaleString('pt-BR')}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
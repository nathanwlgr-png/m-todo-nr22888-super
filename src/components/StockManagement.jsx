import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Package, AlertTriangle, TrendingUp, Plus, Edit2, Save, Loader2, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from 'sonner';

export default function StockManagement() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: consumables = [], isLoading } = useQuery({
    queryKey: ['consumables'],
    queryFn: () => base44.entities.Consumable.list()
  });

  const { data: equipment = [] } = useQuery({
    queryKey: ['equipment'],
    queryFn: () => base44.entities.Equipment.list()
  });

  const updateStockMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Consumable.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['consumables']);
      toast.success('Estoque atualizado!');
      setEditingId(null);
    }
  });

  const allProducts = [
    ...consumables.map(c => ({ ...c, type: 'consumable' })),
    ...equipment.map(e => ({ ...e, type: 'equipment' }))
  ];

  const filteredProducts = allProducts.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase())
  );

  const lowStockItems = consumables.filter(c => 
    c.stock_quantity <= c.min_stock && c.min_stock > 0
  );

  const handleUpdateStock = (id, field, value) => {
    updateStockMutation.mutate({ id, data: { [field]: value } });
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditData({ stock_quantity: item.stock_quantity, min_stock: item.min_stock });
  };

  const saveEdit = () => {
    if (editingId) {
      updateStockMutation.mutate({ id: editingId, data: editData });
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-gradient-to-r from-orange-500 to-red-600 text-white">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            <h3 className="font-bold">Gestão de Estoque</h3>
          </div>
          <Badge className="bg-white text-orange-700">{allProducts.length} produtos</Badge>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-white/20 backdrop-blur rounded-lg p-2 text-center">
            <p className="text-xs opacity-80">Insumos</p>
            <p className="text-lg font-bold">{consumables.length}</p>
          </div>
          <div className="bg-white/20 backdrop-blur rounded-lg p-2 text-center">
            <p className="text-xs opacity-80">Equipamentos</p>
            <p className="text-lg font-bold">{equipment.length}</p>
          </div>
          <div className="bg-white/20 backdrop-blur rounded-lg p-2 text-center">
            <p className="text-xs opacity-80">Estoque Baixo</p>
            <p className="text-lg font-bold">{lowStockItems.length}</p>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
          <Input
            placeholder="Buscar produtos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white/20 backdrop-blur border-white/30 text-white placeholder:text-white/60"
          />
        </div>
      </Card>

      {/* Alertas de Estoque Baixo */}
      {lowStockItems.length > 0 && (
        <Card className="p-3 bg-red-50 border-2 border-red-300">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <p className="text-sm font-bold text-red-700">Estoque Baixo - {lowStockItems.length} itens</p>
          </div>
          <div className="space-y-2">
            {lowStockItems.slice(0, 5).map(item => (
              <div key={item.id} className="flex items-center justify-between bg-white rounded-lg p-2">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{item.name}</p>
                  <p className="text-xs text-slate-600">Atual: {item.stock_quantity} | Mínimo: {item.min_stock}</p>
                </div>
                <Badge className="bg-red-500 text-white">Reabastecer</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Lista de Produtos */}
      <div className="space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-orange-600" />
          </div>
        ) : filteredProducts.length === 0 ? (
          <Card className="p-6 text-center">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">Nenhum produto encontrado</p>
          </Card>
        ) : (
          filteredProducts.map(product => (
            <Card key={product.id} className="p-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-slate-800">{product.name}</p>
                    <Badge variant="outline" className="text-xs">
                      {product.type === 'consumable' ? 'Insumo' : 'Equipamento'}
                    </Badge>
                  </div>
                  
                  {product.type === 'consumable' && (
                    <>
                      {editingId === product.id ? (
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <div>
                            <Label className="text-xs">Estoque Atual</Label>
                            <Input
                              type="number"
                              value={editData.stock_quantity}
                              onChange={(e) => setEditData({ ...editData, stock_quantity: parseInt(e.target.value) })}
                              className="h-8"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Estoque Mínimo</Label>
                            <Input
                              type="number"
                              value={editData.min_stock}
                              onChange={(e) => setEditData({ ...editData, min_stock: parseInt(e.target.value) })}
                              className="h-8"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-4 text-xs text-slate-600 mt-1">
                          <span>Estoque: <strong className="text-slate-800">{product.stock_quantity || 0}</strong></span>
                          <span>Mínimo: <strong className="text-slate-800">{product.min_stock || 0}</strong></span>
                          <span>Preço: <strong className="text-green-700">R$ {(product.unit_price || 0).toLocaleString('pt-BR')}</strong></span>
                        </div>
                      )}
                    </>
                  )}

                  {product.type === 'equipment' && (
                    <div className="flex items-center gap-4 text-xs text-slate-600 mt-1">
                      <span>Preço: <strong className="text-green-700">R$ {(product.price || 0).toLocaleString('pt-BR')}</strong></span>
                      {product.is_active === false && <Badge className="bg-red-500 text-white">Inativo</Badge>}
                    </div>
                  )}
                </div>

                {product.type === 'consumable' && (
                  <div>
                    {editingId === product.id ? (
                      <Button
                        size="sm"
                        onClick={saveEdit}
                        disabled={updateStockMutation.isPending}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {updateStockMutation.isPending ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Save className="w-3 h-3" />
                        )}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEdit(product)}
                      >
                        <Edit2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Alert if low stock */}
              {product.type === 'consumable' && product.stock_quantity <= product.min_stock && product.min_stock > 0 && (
                <div className="mt-2 p-2 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-xs text-red-700 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Estoque abaixo do mínimo!
                  </p>
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
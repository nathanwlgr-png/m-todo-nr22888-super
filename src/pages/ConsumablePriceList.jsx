import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Edit2, Save, Plus, Loader2, DollarSign, Package } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const categoryLabels = {
  reagente: 'Reagente',
  kit_analise: 'Kit de Análise',
  calibrador: 'Calibrador',
  controle_qualidade: 'Controle de Qualidade',
  consumivel_geral: 'Consumível Geral'
};

export default function ConsumablePriceList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editDialog, setEditDialog] = useState(false);
  const [editData, setEditData] = useState({});
  const [filter, setFilter] = useState('all');

  const { data: consumables = [], isLoading } = useQuery({
    queryKey: ['consumables'],
    queryFn: () => base44.entities.Consumable.list('-created_date', 200)
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Consumable.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['consumables']);
      setEditDialog(false);
    }
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Consumable.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['consumables']);
      setEditDialog(false);
    }
  });

  const handleEdit = (consumable) => {
    setEditData(consumable);
    setEditDialog(true);
  };

  const handleNew = () => {
    setEditData({
      name: '',
      category: 'reagente',
      unit_price: 0,
      unit_type: 'unidade',
      supplier: '',
      description: '',
      stock_quantity: 0,
      min_stock: 0,
      is_active: true
    });
    setEditDialog(true);
  };

  const handleSave = () => {
    if (editData.id) {
      updateMutation.mutate({ id: editData.id, data: editData });
    } else {
      createMutation.mutate(editData);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const activeConsumables = consumables.filter(c => c.is_active);
  const filteredConsumables = filter === 'all' 
    ? activeConsumables 
    : activeConsumables.filter(c => c.category === filter);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-white border-b px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-4 mb-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-slate-100">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-slate-800">Insumos</h1>
            <p className="text-xs text-slate-500">{activeConsumables.length} ativos</p>
          </div>
          <Button
            size="sm"
            onClick={handleNew}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            <SelectItem value="reagente">Reagentes</SelectItem>
            <SelectItem value="kit_analise">Kits de Análise</SelectItem>
            <SelectItem value="calibrador">Calibradores</SelectItem>
            <SelectItem value="controle_qualidade">Controle de Qualidade</SelectItem>
            <SelectItem value="consumivel_geral">Consumíveis Gerais</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="p-4 space-y-3">
        {filteredConsumables.map((consumable) => (
          <Card key={consumable.id} className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h3 className="font-semibold text-slate-800">{consumable.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {categoryLabels[consumable.category]}
                  </Badge>
                  {consumable.stock_quantity <= consumable.min_stock && (
                    <Badge className="bg-red-500 text-xs">Estoque Baixo</Badge>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleEdit(consumable)}
                className="p-2 hover:bg-slate-100 rounded-lg"
              >
                <Edit2 className="w-4 h-4 text-slate-600" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-2">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                <div>
                  <p className="text-lg font-bold text-green-600">
                    R$ {consumable.unit_price?.toLocaleString('pt-BR')}
                  </p>
                  <p className="text-xs text-slate-500">por {consumable.unit_type}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-600" />
                <div>
                  <p className="text-lg font-bold text-slate-800">{consumable.stock_quantity || 0}</p>
                  <p className="text-xs text-slate-500">em estoque</p>
                </div>
              </div>
            </div>

            {consumable.supplier && (
              <p className="text-xs text-slate-600 mb-1">
                <strong>Fornecedor:</strong> {consumable.supplier}
              </p>
            )}

            {consumable.description && (
              <p className="text-sm text-slate-600">{consumable.description}</p>
            )}
          </Card>
        ))}

        {filteredConsumables.length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-slate-500 mb-4">Nenhum insumo encontrado</p>
            <Button onClick={handleNew} variant="outline">
              Adicionar Primeiro Insumo
            </Button>
          </Card>
        )}
      </div>

      {/* Edit/Create Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editData.id ? 'Editar' : 'Novo'} Insumo</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Nome *</Label>
              <Input
                value={editData.name || ''}
                onChange={(e) => setEditData({...editData, name: e.target.value})}
              />
            </div>

            <div>
              <Label>Categoria *</Label>
              <Select
                value={editData.category}
                onValueChange={(v) => setEditData({...editData, category: v})}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="reagente">Reagente</SelectItem>
                  <SelectItem value="kit_analise">Kit de Análise</SelectItem>
                  <SelectItem value="calibrador">Calibrador</SelectItem>
                  <SelectItem value="controle_qualidade">Controle de Qualidade</SelectItem>
                  <SelectItem value="consumivel_geral">Consumível Geral</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Preço Unitário (R$) *</Label>
                <Input
                  type="number"
                  value={editData.unit_price || 0}
                  onChange={(e) => setEditData({...editData, unit_price: parseFloat(e.target.value)})}
                />
              </div>
              <div>
                <Label>Tipo de Unidade *</Label>
                <Select
                  value={editData.unit_type}
                  onValueChange={(v) => setEditData({...editData, unit_type: v})}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unidade">Unidade</SelectItem>
                    <SelectItem value="caixa">Caixa</SelectItem>
                    <SelectItem value="kit">Kit</SelectItem>
                    <SelectItem value="litro">Litro</SelectItem>
                    <SelectItem value="ml">ML</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Fornecedor</Label>
              <Input
                value={editData.supplier || ''}
                onChange={(e) => setEditData({...editData, supplier: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Estoque Atual</Label>
                <Input
                  type="number"
                  value={editData.stock_quantity || 0}
                  onChange={(e) => setEditData({...editData, stock_quantity: parseInt(e.target.value)})}
                />
              </div>
              <div>
                <Label>Estoque Mínimo</Label>
                <Input
                  type="number"
                  value={editData.min_stock || 0}
                  onChange={(e) => setEditData({...editData, min_stock: parseInt(e.target.value)})}
                />
              </div>
            </div>

            <div>
              <Label>Descrição</Label>
              <Textarea
                value={editData.description || ''}
                onChange={(e) => setEditData({...editData, description: e.target.value})}
                rows={3}
              />
            </div>

            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending || createMutation.isPending || !editData.name || !editData.unit_price}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              {(updateMutation.isPending || createMutation.isPending) ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
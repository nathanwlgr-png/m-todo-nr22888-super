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
import { ArrowLeft, Edit2, Save, X, Plus, Loader2, DollarSign } from 'lucide-react';
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
  analisador_hematologico: 'Analisador Hematológico',
  analisador_bioquimico: 'Analisador Bioquímico',
  contador_celulas: 'Contador de Células',
  outro: 'Outro'
};

export default function EquipmentPriceList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editDialog, setEditDialog] = useState(false);
  const [editData, setEditData] = useState({});

  const { data: equipments = [], isLoading } = useQuery({
    queryKey: ['equipments'],
    queryFn: () => base44.entities.Equipment.list('-created_date', 200)
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Equipment.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['equipments']);
      setEditDialog(false);
    }
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Equipment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['equipments']);
      setEditDialog(false);
    }
  });

  const handleEdit = (equipment) => {
    setEditData(equipment);
    setEditDialog(true);
  };

  const handleNew = () => {
    setEditData({
      name: '',
      category: 'analisador_hematologico',
      price: 0,
      monthly_bonus: '',
      specifications: '',
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

  const activeEquipments = equipments.filter(e => e.is_active);
  const inactiveEquipments = equipments.filter(e => !e.is_active);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-white border-b px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-slate-100">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-slate-800">Equipamentos</h1>
            <p className="text-xs text-slate-500">{activeEquipments.length} ativos</p>
          </div>
          <Button
            size="sm"
            onClick={handleNew}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {activeEquipments.map((equipment) => (
          <Card key={equipment.id} className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h3 className="font-semibold text-slate-800">{equipment.name}</h3>
                <Badge variant="outline" className="mt-1 text-xs">
                  {categoryLabels[equipment.category]}
                </Badge>
              </div>
              <button
                onClick={() => handleEdit(equipment)}
                className="p-2 hover:bg-slate-100 rounded-lg"
              >
                <Edit2 className="w-4 h-4 text-slate-600" />
              </button>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              <span className="text-2xl font-bold text-green-600">
                R$ {equipment.price?.toLocaleString('pt-BR')}
              </span>
            </div>

            {equipment.monthly_bonus && (
              <div className="p-2 bg-amber-50 rounded-lg border border-amber-200 mb-2">
                <p className="text-xs text-amber-800">
                  <strong>Bonificação:</strong> {equipment.monthly_bonus}
                </p>
              </div>
            )}

            {equipment.specifications && (
              <p className="text-sm text-slate-600 mt-2">{equipment.specifications}</p>
            )}
          </Card>
        ))}

        {activeEquipments.length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-slate-500 mb-4">Nenhum equipamento cadastrado</p>
            <Button onClick={handleNew} variant="outline">
              Adicionar Primeiro Equipamento
            </Button>
          </Card>
        )}
      </div>

      {/* Edit/Create Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editData.id ? 'Editar' : 'Novo'} Equipamento</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Nome *</Label>
              <Input
                value={editData.name || ''}
                onChange={(e) => setEditData({...editData, name: e.target.value})}
                placeholder="Ex: Analisador BC-3000"
              />
            </div>

            <div>
              <Label>Categoria *</Label>
              <Select
                value={editData.category}
                onValueChange={(v) => setEditData({...editData, category: v})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="analisador_hematologico">Analisador Hematológico</SelectItem>
                  <SelectItem value="analisador_bioquimico">Analisador Bioquímico</SelectItem>
                  <SelectItem value="contador_celulas">Contador de Células</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Preço (R$) *</Label>
              <Input
                type="number"
                value={editData.price || 0}
                onChange={(e) => setEditData({...editData, price: parseFloat(e.target.value)})}
                placeholder="45000"
              />
            </div>

            <div>
              <Label>Bonificação Mensal</Label>
              <Input
                value={editData.monthly_bonus || ''}
                onChange={(e) => setEditData({...editData, monthly_bonus: e.target.value})}
                placeholder="Ex: 20% em reagentes no primeiro mês"
              />
            </div>

            <div>
              <Label>Especificações</Label>
              <Textarea
                value={editData.specifications || ''}
                onChange={(e) => setEditData({...editData, specifications: e.target.value})}
                placeholder="Características técnicas do equipamento..."
                rows={3}
              />
            </div>

            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending || createMutation.isPending || !editData.name || !editData.price}
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
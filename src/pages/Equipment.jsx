import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Package, DollarSign, Gift, ArrowLeft, Pencil, Trash2 } from 'lucide-react';

const categoryLabels = {
  analisador_hematologico: 'Analisador Hematológico',
  analisador_bioquimico: 'Analisador Bioquímico',
  contador_celulas: 'Contador de Células',
  outro: 'Outro'
};

export default function Equipment() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    monthly_bonus: '',
    bonus_details: '',
    specifications: '',
    image_url: '',
    is_active: true
  });

  const { data: equipment = [], isLoading } = useQuery({
    queryKey: ['equipment'],
    queryFn: () => base44.entities.Equipment.list('-created_date', 50)
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Equipment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['equipment']);
      setDialogOpen(false);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Equipment.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['equipment']);
      setDialogOpen(false);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Equipment.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['equipment'])
  });

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      price: '',
      monthly_bonus: '',
      bonus_details: '',
      specifications: '',
      image_url: '',
      is_active: true
    });
    setEditingEquipment(null);
  };

  const handleSubmit = () => {
    const data = {
      ...formData,
      price: parseFloat(formData.price)
    };

    if (editingEquipment) {
      updateMutation.mutate({ id: editingEquipment.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (eq) => {
    setEditingEquipment(eq);
    setFormData({
      name: eq.name,
      category: eq.category,
      price: eq.price.toString(),
      monthly_bonus: eq.monthly_bonus || '',
      bonus_details: eq.bonus_details || '',
      specifications: eq.specifications || '',
      image_url: eq.image_url || '',
      is_active: eq.is_active
    });
    setDialogOpen(true);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, image_url: file_url });
    } catch (error) {
      console.error('Erro ao fazer upload da imagem');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('Home')}>
              <button className="p-2 -ml-2 rounded-full hover:bg-slate-100">
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
            </Link>
            <h1 className="text-lg font-semibold text-slate-800">Equipamentos</h1>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="w-4 h-4 mr-2" />
                Novo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingEquipment ? 'Editar Equipamento' : 'Novo Equipamento'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label>Nome do Equipamento</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Analisador BC-5000"
                  />
                </div>

                <div>
                  <Label>Categoria</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(categoryLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Preço (R$)</Label>
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="Ex: 45000"
                  />
                </div>

                <div>
                  <Label>Bonificação em Insumos do Mês</Label>
                  <Input
                    value={formData.monthly_bonus}
                    onChange={(e) => setFormData({ ...formData, monthly_bonus: e.target.value })}
                    placeholder="Ex: 20% em reagentes, Kit completo, 3 meses de insumos"
                  />
                </div>

                <div>
                  <Label>Detalhes da Bonificação</Label>
                  <Textarea
                    value={formData.bonus_details}
                    onChange={(e) => setFormData({ ...formData, bonus_details: e.target.value })}
                    placeholder="Descreva os detalhes da bonificação..."
                    className="h-20"
                  />
                </div>

                <div>
                  <Label>Especificações Técnicas</Label>
                  <Textarea
                    value={formData.specifications}
                    onChange={(e) => setFormData({ ...formData, specifications: e.target.value })}
                    placeholder="Parâmetros, capacidade, precisão..."
                    className="h-24"
                  />
                </div>

                <div>
                  <Label>Imagem do Equipamento</Label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="w-full text-sm"
                  />
                  {formData.image_url && (
                    <img src={formData.image_url} alt="Preview" className="mt-2 w-full h-32 object-cover rounded" />
                  )}
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={!formData.name || !formData.category || !formData.price}
                  className="w-full"
                >
                  {editingEquipment ? 'Atualizar' : 'Criar'} Equipamento
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {equipment.map((eq) => (
          <Card key={eq.id} className="p-4">
            <div className="flex gap-4 mb-3">
              {eq.image_url && (
                <img 
                  src={eq.image_url} 
                  alt={eq.name}
                  className="w-24 h-24 object-cover rounded-lg"
                />
              )}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-slate-800">{eq.name}</h3>
                    <p className="text-sm text-slate-500">{categoryLabels[eq.category]}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(eq)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteMutation.mutate(eq.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold text-emerald-700">
                  R$ {eq.price.toLocaleString('pt-BR')}
                </span>
              </div>

              {eq.monthly_bonus && (
                <div className="flex items-start gap-2 text-sm">
                  <Gift className="w-4 h-4 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-amber-700">Bonificação:</p>
                    <p className="text-slate-600">{eq.monthly_bonus}</p>
                  </div>
                </div>
              )}

              {eq.bonus_details && (
                <p className="text-xs text-slate-500 pl-6">{eq.bonus_details}</p>
              )}
              </div>
            </div>
          </Card>
        ))}

        {equipment.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">Nenhum equipamento cadastrado</p>
          </div>
        )}
      </div>
    </div>
  );
}
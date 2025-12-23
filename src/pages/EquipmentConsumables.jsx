import { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Plus, Package, Trash2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

export default function EquipmentConsumables() {
  const queryClient = useQueryClient();
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    consumable_name: '',
    image_url: '',
    price_per_unit: '',
    unit_type: 'unidade'
  });

  const { data: equipment = [] } = useQuery({
    queryKey: ['equipment'],
    queryFn: () => base44.entities.Equipment.list('-created_date', 50)
  });

  const updateEquipmentMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Equipment.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['equipment']);
      setDialogOpen(false);
      resetForm();
    }
  });

  const resetForm = () => {
    setFormData({
      consumable_name: '',
      image_url: '',
      price_per_unit: '',
      unit_type: 'unidade'
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, image_url: file_url });
      toast.success('Imagem carregada!');
    } catch (error) {
      toast.error('Erro ao fazer upload');
    }
  };

  const addConsumable = () => {
    if (!formData.consumable_name || !formData.price_per_unit) {
      toast.error('Preencha nome e preço');
      return;
    }

    const currentConsumables = selectedEquipment.recommended_bundle?.consumables || [];
    const newConsumable = {
      consumable_name: formData.consumable_name,
      image_url: formData.image_url,
      price_per_unit: parseFloat(formData.price_per_unit),
      unit_type: formData.unit_type
    };

    const updatedBundle = {
      ...selectedEquipment.recommended_bundle,
      consumables: [...currentConsumables, newConsumable]
    };

    updateEquipmentMutation.mutate({
      id: selectedEquipment.id,
      data: { recommended_bundle: updatedBundle }
    });
  };

  const removeConsumable = (equipmentId, index) => {
    const eq = equipment.find(e => e.id === equipmentId);
    const currentConsumables = eq.recommended_bundle?.consumables || [];
    const updated = currentConsumables.filter((_, i) => i !== index);

    updateEquipmentMutation.mutate({
      id: equipmentId,
      data: {
        recommended_bundle: {
          ...eq.recommended_bundle,
          consumables: updated
        }
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link to={createPageUrl('Home')}>
            <button className="p-2 -ml-2 rounded-full hover:bg-slate-100">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
          </Link>
          <h1 className="text-lg font-semibold text-slate-800">Insumos por Equipamento</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {equipment.map((eq) => (
          <Card key={eq.id} className="p-4">
            <div className="flex items-start gap-3 mb-4">
              {eq.image_url && (
                <img src={eq.image_url} alt={eq.name} className="w-20 h-20 object-cover rounded-lg" />
              )}
              <div className="flex-1">
                <h3 className="font-semibold text-slate-800">{eq.name}</h3>
                <p className="text-sm text-slate-500">
                  {eq.recommended_bundle?.consumables?.length || 0} insumo(s) cadastrado(s)
                </p>
              </div>
              <Dialog open={dialogOpen && selectedEquipment?.id === eq.id} onOpenChange={(open) => {
                setDialogOpen(open);
                if (open) setSelectedEquipment(eq);
                if (!open) resetForm();
              }}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-1" />
                    Adicionar Insumo
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Novo Insumo - {eq.name}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label>Nome do Insumo</Label>
                      <Input
                        value={formData.consumable_name}
                        onChange={(e) => setFormData({ ...formData, consumable_name: e.target.value })}
                        placeholder="Ex: Reagente CBC"
                      />
                    </div>
                    
                    <div>
                      <Label>Preço Unitário (R$)</Label>
                      <Input
                        type="number"
                        value={formData.price_per_unit}
                        onChange={(e) => setFormData({ ...formData, price_per_unit: e.target.value })}
                        placeholder="Ex: 150"
                      />
                    </div>

                    <div>
                      <Label>Unidade</Label>
                      <Input
                        value={formData.unit_type}
                        onChange={(e) => setFormData({ ...formData, unit_type: e.target.value })}
                        placeholder="Ex: unidade, caixa, litro"
                      />
                    </div>

                    <div>
                      <Label>Imagem do Insumo</Label>
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

                    <Button onClick={addConsumable} className="w-full">
                      Adicionar Insumo
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {eq.recommended_bundle?.consumables?.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {eq.recommended_bundle.consumables.map((consumable, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                    {consumable.image_url && (
                      <img 
                        src={consumable.image_url} 
                        alt={consumable.consumable_name}
                        className="w-full h-24 object-cover rounded mb-2"
                      />
                    )}
                    <p className="font-medium text-sm text-slate-800">{consumable.consumable_name}</p>
                    <p className="text-xs text-slate-600">
                      R$ {consumable.price_per_unit?.toFixed(2)} / {consumable.unit_type}
                    </p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeConsumable(eq.id, idx)}
                      className="w-full mt-2 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Remover
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {(!eq.recommended_bundle?.consumables || eq.recommended_bundle.consumables.length === 0) && (
              <div className="text-center py-6 text-slate-400">
                <Package className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">Nenhum insumo cadastrado</p>
              </div>
            )}
          </Card>
        ))}

        {equipment.length === 0 && (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">Nenhum equipamento cadastrado</p>
            <Link to={createPageUrl('Equipment')}>
              <Button className="mt-4">
                Cadastrar Equipamentos
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
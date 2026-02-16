import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Edit2, Save, X, Package } from 'lucide-react';
import { toast } from 'sonner';

export default function ProductManager() {
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState({});
  const queryClient = useQueryClient();

  const { data: equipment = [] } = useQuery({
    queryKey: ['equipment'],
    queryFn: () => base44.entities.Equipment.list(),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Equipment.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['equipment']);
      toast.success('Produto atualizado!');
      setEditing(null);
    }
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Equipment.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['equipment']);
      toast.success('Produto criado!');
      setEditing(null);
      setFormData({});
    }
  });

  const handleEdit = (equip) => {
    setEditing(equip.id);
    setFormData({
      name: equip.name || '',
      category: equip.category || 'analisador_hematologico',
      price: equip.price || '',
      processing_time: equip.processing_time || '',
      sample_volume: equip.sample_volume || '',
      parameters_measured: equip.parameters_measured || '',
      roi_months: equip.roi_months || '',
      monthly_savings: equip.monthly_savings || '',
      specifications: equip.specifications || '',
      monthly_bonus: equip.monthly_bonus || '',
      bonus_details: equip.bonus_details || '',
      key_benefits: equip.key_benefits || ''
    });
  };

  const handleSave = () => {
    if (editing === 'new') {
      createMutation.mutate(formData);
    } else {
      updateMutation.mutate({ id: editing, data: formData });
    }
  };

  const handleNew = () => {
    setEditing('new');
    setFormData({
      name: '',
      category: 'analisador_hematologico',
      price: '',
      processing_time: '',
      sample_volume: '',
      parameters_measured: '',
      roi_months: '',
      monthly_savings: '',
      specifications: '',
      monthly_bonus: '',
      bonus_details: '',
      key_benefits: '',
      is_active: true
    });
  };

  return (
    <div className="space-y-4 pb-20">
      <Card className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Package className="w-6 h-6" />
            Gerenciador de Produtos
          </CardTitle>
          <p className="text-indigo-100">
            Configure dados técnicos corretos para IA usar nas mensagens
          </p>
        </CardHeader>
      </Card>

      <Button onClick={handleNew} className="w-full bg-green-600">
        <Plus className="w-4 h-4 mr-2" />
        Novo Produto
      </Button>

      {editing && (
        <Card className="border-2 border-orange-500">
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              {editing === 'new' ? 'Novo Produto' : 'Editando Produto'}
              <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                <X className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Nome do Produto *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Ex: VG2 Plus"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Preço (R$) *</Label>
                <Input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
                  placeholder="80000"
                />
              </div>
              <div>
                <Label>Tempo Processamento</Label>
                <Input
                  value={formData.processing_time}
                  onChange={(e) => setFormData({...formData, processing_time: e.target.value})}
                  placeholder="Ex: 3-5 minutos"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>ROI (meses)</Label>
                <Input
                  type="number"
                  value={formData.roi_months}
                  onChange={(e) => setFormData({...formData, roi_months: parseInt(e.target.value)})}
                  placeholder="14"
                />
              </div>
              <div>
                <Label>Economia Mensal (R$)</Label>
                <Input
                  type="number"
                  value={formData.monthly_savings}
                  onChange={(e) => setFormData({...formData, monthly_savings: parseFloat(e.target.value)})}
                  placeholder="3200"
                />
              </div>
            </div>

            <div>
              <Label>Volume da Amostra</Label>
              <Input
                value={formData.sample_volume}
                onChange={(e) => setFormData({...formData, sample_volume: e.target.value})}
                placeholder="Ex: 20-50 μL"
              />
            </div>

            <div>
              <Label>Parâmetros Medidos</Label>
              <Input
                value={formData.parameters_measured}
                onChange={(e) => setFormData({...formData, parameters_measured: e.target.value})}
                placeholder="Ex: 26 parâmetros hematológicos + 3 histogramas"
              />
            </div>

            <div>
              <Label>Especificações Técnicas</Label>
              <Textarea
                value={formData.specifications}
                onChange={(e) => setFormData({...formData, specifications: e.target.value})}
                placeholder="Detalhes técnicos completos..."
                rows={3}
              />
            </div>

            <div>
              <Label>Benefícios Principais</Label>
              <Textarea
                value={formData.key_benefits}
                onChange={(e) => setFormData({...formData, key_benefits: e.target.value})}
                placeholder="Liste os principais benefícios separados por | Ex: Redução de custos|Resultados rápidos|Precisão laboratorial"
                rows={2}
              />
            </div>

            <div>
              <Label>Bonificação Mensal</Label>
              <Input
                value={formData.monthly_bonus}
                onChange={(e) => setFormData({...formData, monthly_bonus: e.target.value})}
                placeholder="Ex: 20% em reagentes"
              />
            </div>

            <div>
              <Label>Detalhes da Bonificação</Label>
              <Textarea
                value={formData.bonus_details}
                onChange={(e) => setFormData({...formData, bonus_details: e.target.value})}
                placeholder="Detalhes completos da bonificação..."
                rows={2}
              />
            </div>

            <Button 
              onClick={handleSave} 
              className="w-full bg-orange-600"
              disabled={!formData.name || !formData.price}
            >
              <Save className="w-4 h-4 mr-2" />
              Salvar Produto
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {equipment.map(equip => (
          <Card key={equip.id} className={editing === equip.id ? 'hidden' : ''}>
            <CardContent className="pt-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-lg">{equip.name}</h3>
                  <Badge className="bg-indigo-600 mt-1">
                    R$ {equip.price?.toLocaleString('pt-BR')}
                  </Badge>
                </div>
                <Button size="sm" variant="ghost" onClick={() => handleEdit(equip)}>
                  <Edit2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {equip.processing_time && (
                  <div className="bg-slate-50 p-2 rounded">
                    <p className="text-slate-500">Tempo:</p>
                    <p className="font-semibold">{equip.processing_time}</p>
                  </div>
                )}
                {equip.roi_months && (
                  <div className="bg-slate-50 p-2 rounded">
                    <p className="text-slate-500">ROI:</p>
                    <p className="font-semibold">{equip.roi_months} meses</p>
                  </div>
                )}
                {equip.sample_volume && (
                  <div className="bg-slate-50 p-2 rounded">
                    <p className="text-slate-500">Amostra:</p>
                    <p className="font-semibold">{equip.sample_volume}</p>
                  </div>
                )}
                {equip.monthly_savings && (
                  <div className="bg-slate-50 p-2 rounded">
                    <p className="text-slate-500">Economia/mês:</p>
                    <p className="font-semibold">R$ {equip.monthly_savings}</p>
                  </div>
                )}
              </div>

              {equip.parameters_measured && (
                <div className="mt-2 text-xs">
                  <p className="text-slate-600">{equip.parameters_measured}</p>
                </div>
              )}

              {equip.key_benefits && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {equip.key_benefits.split('|').map((benefit, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {benefit.trim()}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
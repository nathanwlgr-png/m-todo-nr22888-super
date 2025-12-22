import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Plus, Save, Tag, ShoppingBag, MessageSquare } from 'lucide-react';

export default function ClientDetailsModal({ client, open, onOpenChange }) {
  const queryClient = useQueryClient();
  const [newTag, setNewTag] = useState('');
  const [newEquipment, setNewEquipment] = useState({ equipment_name: '', purchase_date: '', value: '', supplier: '' });
  const [editedClient, setEditedClient] = useState(client || {});

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Client.update(client.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['clients']);
      onOpenChange(false);
    }
  });

  const handleSave = () => {
    updateMutation.mutate(editedClient);
  };

  const addTag = () => {
    if (newTag.trim()) {
      const tags = editedClient.custom_tags || [];
      if (!tags.includes(newTag.trim())) {
        setEditedClient({
          ...editedClient,
          custom_tags: [...tags, newTag.trim()]
        });
      }
      setNewTag('');
    }
  };

  const removeTag = (tag) => {
    setEditedClient({
      ...editedClient,
      custom_tags: (editedClient.custom_tags || []).filter(t => t !== tag)
    });
  };

  const addEquipmentHistory = () => {
    if (newEquipment.equipment_name && newEquipment.purchase_date) {
      const history = editedClient.equipment_purchase_history || [];
      setEditedClient({
        ...editedClient,
        equipment_purchase_history: [
          ...history,
          {
            ...newEquipment,
            value: parseFloat(newEquipment.value) || 0
          }
        ]
      });
      setNewEquipment({ equipment_name: '', purchase_date: '', value: '', supplier: '' });
    }
  };

  const toggleLabNeed = (need) => {
    const needs = editedClient.lab_needs || [];
    if (needs.includes(need)) {
      setEditedClient({
        ...editedClient,
        lab_needs: needs.filter(n => n !== need)
      });
    } else {
      setEditedClient({
        ...editedClient,
        lab_needs: [...needs, need]
      });
    }
  };

  const LAB_NEEDS_OPTIONS = [
    { value: 'hemograma', label: '🩸 Hemograma' },
    { value: 'bioquimico', label: '🧪 Bioquímico' },
    { value: 'hemogasio', label: '💨 Hemogásio' },
    { value: 'imunofluorescencia', label: '🔬 Imunofluorescência' },
    { value: 'urinalise', label: '💧 Urinálise' },
    { value: 'pcr', label: '🧬 PCR' },
    { value: 'microbiologia', label: '🦠 Microbiologia' },
    { value: 'sorologia', label: '🩺 Sorologia' }
  ];

  if (!client) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Detalhes Avançados - {client.first_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Custom Tags */}
          <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
            <div className="flex items-center gap-2 mb-3">
              <Tag className="w-4 h-4 text-purple-600" />
              <h3 className="font-semibold text-slate-800">Tags Personalizáveis</h3>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {(editedClient.custom_tags || []).map(tag => (
                <Badge key={tag} className="bg-purple-100 text-purple-700 flex items-center gap-1">
                  {tag}
                  <button onClick={() => removeTag(tag)} className="ml-1 hover:text-purple-900">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Nova tag (ex: Potencial de Upgrade)"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addTag()}
              />
              <Button onClick={addTag} size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="text-xs text-slate-600">Sugestões:</span>
              {['Potencial de Upgrade', 'Baixo Engajamento', 'Fidelidade Alta', 'VIP', 'Risco de Churn'].map(suggestion => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setNewTag(suggestion);
                    addTag();
                  }}
                  className="text-xs px-2 py-1 bg-white rounded border border-purple-200 hover:bg-purple-50"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </Card>

          {/* Lab Needs */}
          <Card className="p-4 border-indigo-200">
            <h3 className="font-semibold text-slate-800 mb-3">Necessidades de Laboratório</h3>
            <div className="space-y-2">
              {LAB_NEEDS_OPTIONS.map(need => (
                <div key={need.value} className="flex items-center gap-2">
                  <Checkbox
                    checked={(editedClient.lab_needs || []).includes(need.value)}
                    onCheckedChange={() => toggleLabNeed(need.value)}
                  />
                  <label className="text-sm">{need.label}</label>
                </div>
              ))}
            </div>
          </Card>

          {/* Equipment Purchase History */}
          <Card className="p-4 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
            <div className="flex items-center gap-2 mb-3">
              <ShoppingBag className="w-4 h-4 text-green-600" />
              <h3 className="font-semibold text-slate-800">Histórico de Compras</h3>
            </div>
            
            {(editedClient.equipment_purchase_history || []).length > 0 && (
              <div className="space-y-2 mb-3">
                {editedClient.equipment_purchase_history.map((item, idx) => (
                  <div key={idx} className="p-2 bg-white rounded border text-sm">
                    <div className="font-medium">{item.equipment_name}</div>
                    <div className="text-xs text-slate-600">
                      {item.purchase_date} • R$ {item.value?.toLocaleString('pt-BR')} • {item.supplier}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <Input
                placeholder="Nome do equipamento"
                value={newEquipment.equipment_name}
                onChange={(e) => setNewEquipment({...newEquipment, equipment_name: e.target.value})}
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="date"
                  value={newEquipment.purchase_date}
                  onChange={(e) => setNewEquipment({...newEquipment, purchase_date: e.target.value})}
                />
                <Input
                  type="number"
                  placeholder="Valor (R$)"
                  value={newEquipment.value}
                  onChange={(e) => setNewEquipment({...newEquipment, value: e.target.value})}
                />
              </div>
              <Input
                placeholder="Fornecedor"
                value={newEquipment.supplier}
                onChange={(e) => setNewEquipment({...newEquipment, supplier: e.target.value})}
              />
              <Button onClick={addEquipmentHistory} size="sm" variant="outline" className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar ao Histórico
              </Button>
            </div>
          </Card>

          {/* Communication Preferences */}
          <Card className="p-4 border-blue-200">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="w-4 h-4 text-blue-600" />
              <h3 className="font-semibold text-slate-800">Preferências de Comunicação</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Canal Preferido</Label>
                <Select
                  value={editedClient.communication_preferences?.preferred_channel || 'whatsapp'}
                  onValueChange={(v) => setEditedClient({
                    ...editedClient,
                    communication_preferences: {
                      ...(editedClient.communication_preferences || {}),
                      preferred_channel: v
                    }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="telefone">Telefone</SelectItem>
                    <SelectItem value="presencial">Presencial</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Melhor Horário</Label>
                <Select
                  value={editedClient.communication_preferences?.preferred_time || 'qualquer'}
                  onValueChange={(v) => setEditedClient({
                    ...editedClient,
                    communication_preferences: {
                      ...(editedClient.communication_preferences || {}),
                      preferred_time: v
                    }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manha">Manhã</SelectItem>
                    <SelectItem value="tarde">Tarde</SelectItem>
                    <SelectItem value="noite">Noite</SelectItem>
                    <SelectItem value="qualquer">Qualquer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Frequência</Label>
                <Select
                  value={editedClient.communication_preferences?.frequency || 'semanal'}
                  onValueChange={(v) => setEditedClient({
                    ...editedClient,
                    communication_preferences: {
                      ...(editedClient.communication_preferences || {}),
                      frequency: v
                    }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="diaria">Diária</SelectItem>
                    <SelectItem value="semanal">Semanal</SelectItem>
                    <SelectItem value="quinzenal">Quinzenal</SelectItem>
                    <SelectItem value="mensal">Mensal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Pipeline</Label>
                <Select
                  value={editedClient.pipeline_stage || 'lead'}
                  onValueChange={(v) => setEditedClient({
                    ...editedClient,
                    pipeline_stage: v
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="qualificado">Qualificado</SelectItem>
                    <SelectItem value="proposta">Proposta</SelectItem>
                    <SelectItem value="negociacao">Negociação</SelectItem>
                    <SelectItem value="fechado">Fechado</SelectItem>
                    <SelectItem value="perdido">Perdido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Save Button */}
          <Button 
            onClick={handleSave} 
            disabled={updateMutation.isPending}
            className="w-full bg-indigo-600 hover:bg-indigo-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {updateMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wrench, Plus, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ClientEquipmentManager({ clientId, clientName }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    equipment_id: '',
    equipment_name: '',
    sale_date: new Date().toISOString().split('T')[0],
    sale_value: '',
    payment_terms: '',
    status: 'proposta'
  });

  const { data: equipment = [] } = useQuery({
    queryKey: ['equipment'],
    queryFn: () => base44.entities.Equipment.list()
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['client-sales', clientId],
    queryFn: () => base44.entities.Sale.filter({ client_id: clientId }),
    enabled: !!clientId
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Sale.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['client-sales']);
      toast.success('Equipamento registrado!');
      setOpen(false);
      setFormData({
        equipment_id: '',
        equipment_name: '',
        sale_date: new Date().toISOString().split('T')[0],
        sale_value: '',
        payment_terms: '',
        status: 'proposta'
      });
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ saleId, status }) => {
      await base44.entities.Sale.update(saleId, { status });
      
      // Se status mudou para "fechada", atualizar pipeline do cliente
      if (status === 'fechada') {
        await base44.entities.Client.update(clientId, {
          pipeline_stage: 'fechado',
          visit_objective: 'fechar_venda',
          status: 'quente'
        });
      }
      
      // Se mudou para "aguardando_assinatura", atualizar também
      if (status === 'aguardando_assinatura') {
        await base44.entities.Client.update(clientId, {
          pipeline_stage: 'negociacao',
          visit_objective: 'negociar_proposta'
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['client-sales']);
      queryClient.invalidateQueries(['client']);
      toast.success('Status atualizado!');
    }
  });

  const handleEquipmentSelect = (equipId) => {
    const selected = equipment.find(e => e.id === equipId);
    if (selected) {
      setFormData({
        ...formData,
        equipment_id: equipId,
        equipment_name: selected.name,
        sale_value: selected.price || ''
      });
    }
  };

  const handleSubmit = () => {
    if (!formData.equipment_name || !formData.sale_value) {
      toast.error('Preencha equipamento e valor');
      return;
    }

    createMutation.mutate({
      client_id: clientId,
      client_name: clientName,
      ...formData
    });
  };

  return (
    <>
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-indigo-600" />
            <h3 className="font-semibold text-slate-800">Equipamentos</h3>
          </div>
          <Button onClick={() => setOpen(true)} size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Adicionar
          </Button>
        </div>

        {sales.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">
            Nenhum equipamento registrado
          </p>
        ) : (
          <div className="space-y-2">
            {sales.map(sale => (
              <div key={sale.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-slate-800 text-sm">{sale.equipment_name}</p>
                  <p className="text-xs text-slate-500">
                    R$ {sale.sale_value?.toLocaleString('pt-BR')} • {sale.status}
                  </p>
                </div>
                <div className="flex gap-1">
                  {sale.status === 'proposta' && (
                    <Button
                      size="sm"
                      onClick={() => updateStatusMutation.mutate({ saleId: sale.id, status: 'aguardando_assinatura' })}
                      className="bg-blue-600 hover:bg-blue-700 h-8 text-xs"
                    >
                      Enviar p/ Assinar
                    </Button>
                  )}
                  {sale.status === 'aguardando_assinatura' && (
                    <Button
                      size="sm"
                      onClick={() => updateStatusMutation.mutate({ saleId: sale.id, status: 'fechada' })}
                      className="bg-emerald-600 hover:bg-emerald-700 h-8 text-xs"
                    >
                      Marcar Assinada
                    </Button>
                  )}
                  {(sale.status === 'fechada' || sale.status === 'entregue') && (
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Equipamento</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Equipamento (selecione ou digite)</Label>
              <Select onValueChange={handleEquipmentSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione da lista" />
                </SelectTrigger>
                <SelectContent>
                  {equipment.map(e => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name} - R$ {e.price?.toLocaleString('pt-BR')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                className="mt-2"
                value={formData.equipment_name}
                onChange={(e) => setFormData({ ...formData, equipment_name: e.target.value })}
                placeholder="Ou digite o nome do equipamento"
              />
            </div>

            <div>
              <Label>Valor (R$) *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">R$</span>
                <Input
                  type="text"
                  value={formData.sale_value}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    setFormData({ ...formData, sale_value: value ? parseFloat(value) : '' });
                  }}
                  placeholder="70000"
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {formData.sale_value ? `R$ ${parseFloat(formData.sale_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 'Digite apenas números'}
              </p>
            </div>

            <div>
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="proposta">Proposta</SelectItem>
                  <SelectItem value="aguardando_assinatura">Aguardando Assinatura</SelectItem>
                  <SelectItem value="fechada">Fechada</SelectItem>
                  <SelectItem value="entregue">Entregue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Condições de Pagamento *</Label>
              <Input
                value={formData.payment_terms}
                onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                placeholder="Ex: 12x sem juros, à vista com 10% desconto, etc"
              />
            </div>

            <Button onClick={handleSubmit} className="w-full" disabled={createMutation.isPending}>
              Registrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
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

  const { data: client } = useQuery({
    queryKey: ['client', clientId],
    queryFn: async () => {
      const clients = await base44.entities.Client.list();
      return clients.find(c => c.id === clientId);
    },
    enabled: !!clientId
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const sale = await base44.entities.Sale.create(data);
      
      // AUTOMAÇÃO: Se status é "fechada", executar workflow completo
      if (data.status === 'fechada') {
        await handleClosedSale(sale, data);
      }
      
      return sale;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['client-sales']);
      queryClient.invalidateQueries(['client']);
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

  const handleClosedSale = async (sale, saleData) => {
    try {
      // 1. Verificar divergência com necessidades do lab
      if (client?.lab_needs?.length > 0) {
        const equipmentObj = equipment.find(e => e.name === saleData.equipment_name);
        const needsMatch = checkEquipmentNeedsMatch(equipmentObj, client.lab_needs);
        
        if (!needsMatch.isMatch) {
          const confirm = window.confirm(
            `⚠️ DIVERGÊNCIA DETECTADA:\n\nEquipamento: ${saleData.equipment_name}\nNecessidades do Lab: ${client.lab_needs.join(', ')}\n\nEste equipamento pode não atender todas as necessidades. Confirma mesmo assim?`
          );
          if (!confirm) throw new Error('Venda cancelada pelo usuário');
        }
      }

      // 2. Atualizar pipeline do cliente
      await base44.entities.Client.update(clientId, {
        pipeline_stage: 'fechado',
        visit_objective: 'fechar_venda',
        status: 'quente'
      });

      // 3. Enviar WhatsApp automático
      if (client?.phone) {
        const message = `🎉 Parabéns ${client.first_name}!\n\nSua compra foi confirmada:\n\n📦 Equipamento: ${saleData.equipment_name}\n💰 Valor: R$ ${parseFloat(saleData.sale_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n📅 Data: ${new Date(saleData.sale_date).toLocaleDateString('pt-BR')}\n💳 Pagamento: ${saleData.payment_terms}\n\n✅ Status: ${saleData.status === 'fechada' ? 'Fechado' : 'Aguardando Assinatura'}\n\nEm breve nossa equipe entrará em contato para os próximos passos.\n\nObrigado pela confiança! 🚀`;
        
        const cleanPhone = client.phone.replace(/\D/g, '');
        const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
        
        await base44.entities.WhatsAppMessage.create({
          contact_id: clientId,
          contact_name: clientName,
          contact_phone: client.phone,
          direction: 'sent',
          message: message,
          status: 'sent',
          automated: true
        });

        window.open(whatsappUrl, '_blank');
        toast.success('Mensagem WhatsApp enviada!');
      }

      // 4. Criar tarefa para vendedor
      const user = await base44.auth.me();
      await base44.entities.Task.create({
        client_id: clientId,
        client_name: clientName,
        title: '📋 Coletar Informações Pós-Venda',
        description: `INFORMAÇÕES NECESSÁRIAS para ${clientName}:\n\n✓ CNPJ/CPF\n✓ Endereço completo de entrega\n✓ Email para NF-e\n✓ Dados bancários (se parcelado)\n✓ Contato técnico para instalação\n\nEquipamento: ${saleData.equipment_name}\nValor: R$ ${parseFloat(saleData.sale_value).toLocaleString('pt-BR')}`,
        due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'pendente',
        priority: 'alta',
        type: 'outro',
        auto_created: true,
        assigned_to: user.email,
        assigned_to_name: user.full_name
      });

      toast.success('Tarefa de pós-venda criada!');

    } catch (error) {
      if (error.message !== 'Venda cancelada pelo usuário') {
        console.error('Erro na automação:', error);
      }
    }
  };

  const checkEquipmentNeedsMatch = (equipment, needs) => {
    if (!equipment || !needs) return { isMatch: true };
    
    const equipmentCategories = {
      'analisador_hematologico': ['hemograma'],
      'analisador_bioquimico': ['bioquimico'],
      'VG1': ['hemogasio'],
      'VG2': ['hemogasio'],
      'VI1': ['imunofluorescencia'],
      'VQ1': ['pcr']
    };

    const covered = equipmentCategories[equipment.category] || 
                    equipmentCategories[equipment.name] || [];
    const missing = needs.filter(n => !covered.includes(n));

    return {
      isMatch: missing.length === 0,
      missing: missing
    };
  };

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
            <h3 className="font-semibold text-slate-800">Equipamentos Vendidos</h3>
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
            <DialogTitle>Registrar Venda de Equipamento</DialogTitle>
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
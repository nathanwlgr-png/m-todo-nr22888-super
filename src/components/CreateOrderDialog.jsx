import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function CreateOrderDialog({ isOpen, onClose, client, equipment, vq1Panels }) {
  const [items, setItems] = useState([]);
  const [selectedEquipment, setSelectedEquipment] = useState('');
  const [selectedPanels, setSelectedPanels] = useState([]);
  const [shippingAddress, setShippingAddress] = useState({
    street: client?.address || '',
    city: client?.city || '',
    zip_code: client?.cep || ''
  });
  const queryClient = useQueryClient();

  const createOrderMutation = useMutation({
    mutationFn: (orderData) => base44.entities.Order.create(orderData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('✅ Pedido criado com sucesso!');
      resetForm();
      onClose();
    },
    onError: (error) => {
      toast.error('❌ Erro ao criar pedido: ' + error.message);
    }
  });

  const resetForm = () => {
    setItems([]);
    setSelectedEquipment('');
    setSelectedPanels([]);
  };

  const addEquipmentItem = () => {
    if (!selectedEquipment) {
      toast.error('Selecione um equipamento');
      return;
    }

    const equip = equipment?.find(e => e.code === selectedEquipment);
    if (!equip) return;

    const newItem = {
      item_id: `item_${Date.now()}`,
      equipment_code: equip.code,
      equipment_name: equip.name,
      quantity: 1,
      unit_price: equip.price_sp,
      item_total: equip.price_sp,
      panel_combo: selectedPanels
    };

    setItems([...items, newItem]);
    setSelectedEquipment('');
    setSelectedPanels([]);
    toast.success(`✅ ${equip.name} adicionado!`);
  };

  const removeItem = (itemId) => {
    setItems(items.filter(item => item.item_id !== itemId));
  };

  const updateItemQuantity = (itemId, newQuantity) => {
    setItems(items.map(item =>
      item.item_id === itemId
        ? {
          ...item,
          quantity: newQuantity,
          item_total: item.unit_price * newQuantity
        }
        : item
    ));
  };

  const totalValue = items.reduce((sum, item) => sum + item.item_total, 0);

  const handleCreateOrder = () => {
    if (items.length === 0) {
      toast.error('Adicione pelo menos um item ao pedido');
      return;
    }

    const orderData = {
      order_number: `PED-${Date.now().toString().slice(-8)}`,
      client_id: client?.id,
      client_name: client?.full_name || client?.first_name,
      client_email: client?.email,
      client_phone: client?.phone,
      items: items,
      total_value: totalValue,
      status: 'pending',
      order_date: new Date().toISOString(),
      shipping_address: shippingAddress,
      payment_status: 'pending',
      status_history: [
        {
          status: 'pending',
          changed_date: new Date().toISOString(),
          notes: 'Pedido criado'
        }
      ],
      assigned_to: 'nathan@cmatbrasil.com.br'
    };

    createOrderMutation.mutate(orderData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <CardTitle>📦 Novo Pedido</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white hover:bg-white/20"
          >
            <X className="w-5 h-5" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          {/* Cliente */}
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="font-semibold text-slate-900">{client?.full_name || client?.first_name}</p>
            <p className="text-sm text-slate-600">{client?.clinic_name}</p>
            <p className="text-xs text-slate-500 mt-1">{client?.city}</p>
          </div>

          {/* Adicionar Equipamentos */}
          <div className="space-y-4 border rounded-lg p-4 bg-blue-50">
            <h3 className="font-semibold text-slate-900">Adicionar Equipamentos</h3>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-semibold text-slate-700">Equipamento</label>
                <select
                  value={selectedEquipment}
                  onChange={(e) => setSelectedEquipment(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="">Selecione...</option>
                  {equipment?.map(eq => (
                    <option key={eq.code} value={eq.code}>
                      {eq.name} - R$ {eq.price_sp.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">Painéis PCR (opcional)</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {vq1Panels?.slice(0, 6).map(panel => (
                    <Button
                      key={panel.id}
                      variant={selectedPanels.includes(panel.id) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setSelectedPanels(prev =>
                          prev.includes(panel.id)
                            ? prev.filter(id => id !== panel.id)
                            : [...prev, panel.id]
                        );
                      }}
                      className="text-xs"
                    >
                      {panel.id}
                    </Button>
                  ))}
                </div>
              </div>

              <Button
                onClick={addEquipmentItem}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Item
              </Button>
            </div>
          </div>

          {/* Itens no Pedido */}
          {items.length > 0 && (
            <div className="space-y-3 border rounded-lg p-4">
              <h3 className="font-semibold text-slate-900">Itens do Pedido</h3>
              {items.map(item => (
                <div key={item.item_id} className="flex items-center justify-between bg-slate-50 p-3 rounded">
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-slate-900">{item.equipment_name}</p>
                    {item.panel_combo?.length > 0 && (
                      <p className="text-xs text-slate-600 mt-1">
                        Painéis: {item.panel_combo.join(', ')}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItemQuantity(item.item_id, parseInt(e.target.value) || 1)}
                      className="w-12 px-2 py-1 border rounded text-sm text-center"
                    />
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-600">
                        R$ {item.item_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => removeItem(item.item_id)}
                      className="h-8 w-8"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}

              <div className="border-t pt-3 flex justify-between items-center">
                <p className="font-semibold text-slate-900">Total</p>
                <p className="text-2xl font-bold text-green-600">
                  R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          )}

          {/* Endereço de Entrega */}
          <div className="space-y-3 border rounded-lg p-4 bg-green-50">
            <h3 className="font-semibold text-slate-900">Endereço de Entrega</h3>
            <Input
              placeholder="Rua"
              value={shippingAddress.street}
              onChange={(e) => setShippingAddress({ ...shippingAddress, street: e.target.value })}
              className="text-sm"
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Cidade"
                value={shippingAddress.city}
                onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                className="text-sm"
              />
              <Input
                placeholder="CEP"
                value={shippingAddress.zip_code}
                onChange={(e) => setShippingAddress({ ...shippingAddress, zip_code: e.target.value })}
                className="text-sm"
              />
            </div>
          </div>

          {/* Ações */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateOrder}
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={items.length === 0 || createOrderMutation.isPending}
            >
              {createOrderMutation.isPending ? 'Criando...' : 'Criar Pedido'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
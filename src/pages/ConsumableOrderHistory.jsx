import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  ArrowLeft, 
  Plus, 
  Package, 
  Loader2, 
  TrendingUp,
  Calendar,
  DollarSign,
  Search
} from 'lucide-react';
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
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function ConsumableOrderHistory() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [addDialog, setAddDialog] = useState(false);
  const [search, setSearch] = useState('');
  const [newOrder, setNewOrder] = useState({
    client_id: '',
    consumable_id: '',
    quantity: 1,
    order_date: new Date().toISOString().split('T')[0]
  });

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['consumable-orders'],
    queryFn: () => base44.entities.ConsumableOrder.list('-order_date', 200)
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list()
  });

  const { data: consumables = [] } = useQuery({
    queryKey: ['consumables'],
    queryFn: () => base44.entities.Consumable.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.ConsumableOrder.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['consumable-orders']);
      setAddDialog(false);
      resetForm();
      toast.success('Pedido registrado com sucesso!');
    }
  });

  const resetForm = () => {
    setNewOrder({
      client_id: '',
      consumable_id: '',
      quantity: 1,
      order_date: new Date().toISOString().split('T')[0]
    });
  };

  const handleSave = () => {
    const client = clients.find(c => c.id === newOrder.client_id);
    const consumable = consumables.find(c => c.id === newOrder.consumable_id);
    
    if (!client || !consumable) {
      toast.error('Selecione cliente e insumo');
      return;
    }

    const unitPrice = consumable.unit_price || 0;
    const totalValue = unitPrice * newOrder.quantity;

    createMutation.mutate({
      ...newOrder,
      client_name: client.first_name,
      consumable_name: consumable.name,
      unit_price: unitPrice,
      total_value: totalValue,
      status: 'pendente'
    });
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(order =>
      !search ||
      order.client_name?.toLowerCase().includes(search.toLowerCase()) ||
      order.consumable_name?.toLowerCase().includes(search.toLowerCase())
    );
  }, [orders, search]);

  // Estatísticas gerais
  const stats = useMemo(() => {
    const totalValue = orders.reduce((sum, o) => sum + (o.total_value || 0), 0);
    const byClient = {};
    orders.forEach(order => {
      if (!byClient[order.client_id]) {
        byClient[order.client_id] = {
          name: order.client_name,
          count: 0,
          value: 0
        };
      }
      byClient[order.client_id].count++;
      byClient[order.client_id].value += order.total_value || 0;
    });

    const topClients = Object.values(byClient)
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    return {
      totalOrders: orders.length,
      totalValue,
      topClients
    };
  }, [orders]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="bg-white border-b px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-slate-100">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-slate-800">Histórico de Pedidos</h1>
            <p className="text-xs text-slate-500">{orders.length} pedidos</p>
          </div>
          <Button
            size="sm"
            onClick={() => setAddDialog(true)}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder="Buscar por cliente ou insumo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-12 rounded-xl border-2"
          />
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Estatísticas */}
        <Card className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
          <div className="flex items-center gap-3 mb-3">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            <h3 className="font-semibold text-indigo-900">Estatísticas Gerais</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="p-3 bg-white rounded-lg">
              <p className="text-xs text-slate-500">Total de Pedidos</p>
              <p className="text-2xl font-bold text-slate-800">{stats.totalOrders}</p>
            </div>
            <div className="p-3 bg-white rounded-lg">
              <p className="text-xs text-slate-500">Valor Total</p>
              <p className="text-xl font-bold text-green-600">
                R$ {stats.totalValue.toLocaleString('pt-BR')}
              </p>
            </div>
          </div>

          {stats.topClients.length > 0 && (
            <>
              <p className="text-xs font-semibold text-indigo-800 mb-2">Top 5 Clientes</p>
              <div className="space-y-2">
                {stats.topClients.map((client, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs bg-white p-2 rounded">
                    <span className="font-medium text-slate-700">{client.name}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{client.count} pedidos</Badge>
                      <span className="text-green-600 font-semibold">
                        R$ {client.value.toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>

        {/* Lista de Pedidos */}
        {filteredOrders.length === 0 ? (
          <Card className="p-8 text-center">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 mb-4">
              {search ? 'Nenhum pedido encontrado' : 'Nenhum pedido registrado'}
            </p>
            <Button onClick={() => setAddDialog(true)} variant="outline">
              Registrar Primeiro Pedido
            </Button>
          </Card>
        ) : (
          filteredOrders.map((order) => (
            <Card key={order.id} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <button
                    onClick={() => navigate(createPageUrl(`ClientProfile?id=${order.client_id}`))}
                    className="font-semibold text-indigo-600 hover:underline"
                  >
                    {order.client_name}
                  </button>
                  <p className="text-sm text-slate-600 mt-1">{order.consumable_name}</p>
                </div>
                <Badge className={
                  order.status === 'entregue' ? 'bg-green-100 text-green-700' :
                  order.status === 'processando' ? 'bg-blue-100 text-blue-700' :
                  order.status === 'cancelado' ? 'bg-red-100 text-red-700' :
                  'bg-yellow-100 text-yellow-700'
                }>
                  {order.status}
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-2">
                <div>
                  <p className="text-xs text-slate-500">Quantidade</p>
                  <p className="font-semibold text-slate-800">{order.quantity}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Valor Total</p>
                  <p className="font-semibold text-green-600">
                    R$ {order.total_value?.toLocaleString('pt-BR')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Data</p>
                  <p className="font-semibold text-slate-800">
                    {format(new Date(order.order_date), 'dd/MM/yy')}
                  </p>
                </div>
              </div>

              {order.notes && (
                <p className="text-xs text-slate-600 mt-2 p-2 bg-slate-50 rounded">
                  {order.notes}
                </p>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Add Order Dialog */}
      <Dialog open={addDialog} onOpenChange={setAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Novo Pedido</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Cliente *</Label>
              <Select
                value={newOrder.client_id}
                onValueChange={(v) => setNewOrder({...newOrder, client_id: v})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.first_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Insumo *</Label>
              <Select
                value={newOrder.consumable_id}
                onValueChange={(v) => setNewOrder({...newOrder, consumable_id: v})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o insumo" />
                </SelectTrigger>
                <SelectContent>
                  {consumables.map((consumable) => (
                    <SelectItem key={consumable.id} value={consumable.id}>
                      {consumable.name} - R$ {consumable.unit_price?.toLocaleString('pt-BR')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Quantidade *</Label>
              <Input
                type="number"
                min="1"
                value={newOrder.quantity}
                onChange={(e) => setNewOrder({...newOrder, quantity: parseInt(e.target.value)})}
              />
            </div>

            <div>
              <Label>Data do Pedido *</Label>
              <Input
                type="date"
                value={newOrder.order_date}
                onChange={(e) => setNewOrder({...newOrder, order_date: e.target.value})}
              />
            </div>

            <Button
              onClick={handleSave}
              disabled={createMutation.isPending || !newOrder.client_id || !newOrder.consumable_id}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              {createMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Registrar Pedido
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
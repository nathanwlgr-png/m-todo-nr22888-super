import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Plus, Eye, Edit2, Truck, CheckCircle2, Clock, XCircle, 
  Filter, Search, Download, Mail, Phone
} from 'lucide-react';
import { toast } from 'sonner';

const STATUS_CONFIG = {
  pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  confirmed: { label: 'Confirmado', color: 'bg-blue-100 text-blue-800', icon: CheckCircle2 },
  processing: { label: 'Processando', color: 'bg-purple-100 text-purple-800', icon: Truck },
  shipped: { label: 'Enviado', color: 'bg-indigo-100 text-indigo-800', icon: Truck },
  in_transit: { label: 'Em Trânsito', color: 'bg-orange-100 text-orange-800', icon: Truck },
  delivered: { label: 'Entregue', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800', icon: XCircle }
};

export default function OrderManagement() {
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => base44.entities.Order?.list().catch(() => []),
  });

  const updateStatusMutation = useMutation({
    mutationFn: (params) => base44.entities.Order.update(params.id, {
      status: params.newStatus,
      status_history: [
        ...(params.oldData.status_history || []),
        {
          status: params.newStatus,
          changed_date: new Date().toISOString(),
          notes: params.notes || ''
        }
      ]
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('✅ Status atualizado!');
    }
  });

  const filteredOrders = orders.filter(order => {
    const matchStatus = filterStatus === 'all' || order.status === filterStatus;
    const matchSearch = !searchTerm || 
      order.order_number?.includes(searchTerm) ||
      order.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.client_email?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchStatus && matchSearch;
  });

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    processing: orders.filter(o => o.status === 'processing' || o.status === 'confirmed').length,
    shipped: orders.filter(o => ['shipped', 'in_transit'].includes(o.status)).length,
    delivered: orders.filter(o => o.status === 'delivered').length,
  };

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">📦 Gestão de Pedidos</h1>
          <p className="text-slate-600 mt-1">Acompanhe equipamentos e painéis PCR</p>
        </div>
        <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 h-11">
          <Plus className="w-5 h-5 mr-2" />
          Novo Pedido
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4">
        <Card className="bg-white border-l-4 border-l-slate-400">
          <CardContent className="pt-6">
            <p className="text-xs font-semibold text-slate-600 uppercase">Total</p>
            <p className="text-3xl font-bold text-slate-800 mt-1">{stats.total}</p>
            <p className="text-xs text-slate-500 mt-2">Pedidos</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-l-4 border-l-yellow-400">
          <CardContent className="pt-6">
            <p className="text-xs font-semibold text-yellow-600 uppercase">Pendentes</p>
            <p className="text-3xl font-bold text-yellow-600 mt-1">{stats.pending}</p>
            <p className="text-xs text-slate-500 mt-2">Aguardando ação</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-l-4 border-l-blue-400">
          <CardContent className="pt-6">
            <p className="text-xs font-semibold text-blue-600 uppercase">Processando</p>
            <p className="text-3xl font-bold text-blue-600 mt-1">{stats.processing}</p>
            <p className="text-xs text-slate-500 mt-2">Em preparação</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-l-4 border-l-orange-400">
          <CardContent className="pt-6">
            <p className="text-xs font-semibold text-orange-600 uppercase">Enviados</p>
            <p className="text-3xl font-bold text-orange-600 mt-1">{stats.shipped}</p>
            <p className="text-xs text-slate-500 mt-2">Em trânsito</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-l-4 border-l-green-400">
          <CardContent className="pt-6">
            <p className="text-xs font-semibold text-green-600 uppercase">Entregues</p>
            <p className="text-3xl font-bold text-green-600 mt-1">{stats.delivered}</p>
            <p className="text-xs text-slate-500 mt-2">Concluídos</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar por número, cliente, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('all')}
                className="text-xs"
              >
                <Filter className="w-3 h-3 mr-1" /> Todos
              </Button>
              {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                <Button
                  key={key}
                  variant={filterStatus === key ? 'default' : 'outline'}
                  onClick={() => setFilterStatus(key)}
                  className={`text-xs ${filterStatus === key ? 'bg-slate-900' : ''}`}
                >
                  {config.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Pedidos */}
      <div className="space-y-3">
        {isLoading ? (
          <Card>
            <CardContent className="pt-6 text-center text-slate-500">
              Carregando pedidos...
            </CardContent>
          </Card>
        ) : filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-slate-500">
              Nenhum pedido encontrado
            </CardContent>
          </Card>
        ) : (
          filteredOrders.map((order) => <OrderCard key={order.id} order={order} onStatusChange={(newStatus) => updateStatusMutation.mutate({ id: order.id, newStatus, oldData: order })} />)
        )}
      </div>
    </div>
  );
}

function OrderCard({ order, onStatusChange }) {
  const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const StatusIcon = config.icon;

  return (
    <Card className="hover:shadow-lg transition">
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-lg font-bold text-slate-900">
                  Pedido #{order.order_number || order.id?.slice(0, 8)}
                </h3>
                <Badge className={config.color}>
                  <StatusIcon className="w-3 h-3 mr-1" />
                  {config.label}
                </Badge>
              </div>
              <p className="text-sm text-slate-600">
                {new Date(order.order_date).toLocaleDateString('pt-BR')}
              </p>
            </div>
            <p className="text-2xl font-bold text-green-600">
              R$ {order.total_value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>

          {/* Cliente */}
          <div className="bg-slate-50 rounded-lg p-4 space-y-2">
            <p className="font-semibold text-slate-900">{order.client_name}</p>
            <div className="flex gap-4 text-xs text-slate-600">
              {order.client_email && (
                <div className="flex items-center gap-1">
                  <Mail className="w-3 h-3" />
                  {order.client_email}
                </div>
              )}
              {order.client_phone && (
                <div className="flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {order.client_phone}
                </div>
              )}
            </div>
          </div>

          {/* Itens */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-600 uppercase">Itens</p>
            {order.items?.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span>{item.equipment_name} × {item.quantity}</span>
                <span className="font-semibold">R$ {item.item_total?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            ))}
          </div>

          {/* Timeline */}
          <div className="border-t pt-4 space-y-2">
            <p className="text-xs font-semibold text-slate-600 uppercase">Datas Importantes</p>
            <div className="grid grid-cols-4 gap-2 text-xs">
              {order.order_date && (
                <div>
                  <p className="text-slate-500">Criação</p>
                  <p className="font-semibold">{new Date(order.order_date).toLocaleDateString('pt-BR')}</p>
                </div>
              )}
              {order.shipping_date && (
                <div>
                  <p className="text-slate-500">Envio</p>
                  <p className="font-semibold">{new Date(order.shipping_date).toLocaleDateString('pt-BR')}</p>
                </div>
              )}
              {order.expected_delivery_date && (
                <div>
                  <p className="text-slate-500">Entrega Est.</p>
                  <p className="font-semibold">{new Date(order.expected_delivery_date).toLocaleDateString('pt-BR')}</p>
                </div>
              )}
              {order.tracking_number && (
                <div>
                  <p className="text-slate-500">Rastreio</p>
                  <p className="font-semibold text-blue-600">{order.tracking_number}</p>
                </div>
              )}
            </div>
          </div>

          {/* Ações */}
          <div className="flex gap-2 pt-4 border-t">
            <Button variant="outline" size="sm" className="text-xs">
              <Eye className="w-3 h-3 mr-1" /> Detalhes
            </Button>
            <Button variant="outline" size="sm" className="text-xs">
              <Edit2 className="w-3 h-3 mr-1" /> Editar
            </Button>
            {order.status !== 'delivered' && order.status !== 'cancelled' && (
              <Button
                size="sm"
                className="ml-auto bg-blue-600 hover:bg-blue-700 text-xs"
                onClick={() => {
                  const nextStatus = {
                    pending: 'confirmed',
                    confirmed: 'processing',
                    processing: 'shipped',
                    shipped: 'in_transit',
                    in_transit: 'delivered'
                  }[order.status] || order.status;
                  onStatusChange(nextStatus);
                }}
              >
                <Truck className="w-3 h-3 mr-1" />
                Próximo Status
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
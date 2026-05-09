import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation } from '@tanstack/react-query';
import { AlertTriangle, Package, Calendar, Zap, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const CONSUMABLE_TYPES = {
  'reagentes_hematologia': '🧪 Reagentes Hematologia',
  'rotor_hematologia': '🔄 Rotor Hematologia',
  'reagentes_bioquimica': '⚗️ Reagentes Bioquímica',
  'rotor_bioquimica': '🔄 Rotor Bioquímica',
  'calibrador': '⚙️ Calibrador',
  'controle': '📊 Controle',
  'eletrodos': '🔌 Eletrodos',
  'outro': '📦 Outro',
};

export default function GestaoInsumos() {
  const [selectedClient, setSelectedClient] = useState('');
  const [showNewOrder, setShowNewOrder] = useState(false);

  // Listar consumíveis
  const { data: consumables = [], refetch: refetchConsumables } = useQuery({
    queryKey: ['consumables-all'],
    queryFn: () => base44.entities.ConsumableOrder?.list('-next_reorder_date', 50).catch(() => []),
    staleTime: 5 * 60 * 1000,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients-for-consumables'],
    queryFn: () => base44.entities.Client.list('full_name', 50),
    staleTime: 5 * 60 * 1000,
  });

  // Gerar alertas de reposição
  const generateAlertsMutation = useMutation({
    mutationFn: async () => {
      toast.info('🔔 Gerando alertas de reposição...');
      const result = await base44.functions.invoke('generateConsumableAlerts', {
        consumables: consumables.filter(c => c.status === 'ativo'),
      });
      return result.data;
    },
    onSuccess: (data) => {
      refetchConsumables();
      toast.success(`✅ ${data.alerts_generated} alertas gerados!`);
    },
    onError: (err) => toast.error('Erro: ' + err.message),
  });

  // Criar novo consumível
  const createConsumableMutation = useMutation({
    mutationFn: async (formData) => {
      return base44.entities.ConsumableOrder.create(formData);
    },
    onSuccess: () => {
      refetchConsumables();
      toast.success('✅ Consumível adicionado!');
      setShowNewOrder(false);
    },
    onError: (err) => toast.error('Erro: ' + err.message),
  });

  // Separar por status
  const alertas = consumables.filter(c => c.next_reorder_date && new Date(c.next_reorder_date) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && !c.alert_generated);
  const proximosVencimentos = consumables.filter(c => c.next_reorder_date && new Date(c.next_reorder_date) > new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && c.status === 'ativo');

  return (
    <div className="space-y-6">

      {/* AÇÕES RÁPIDAS */}
      <div className="flex gap-2">
        <Button
          onClick={() => generateAlertsMutation.mutate()}
          disabled={generateAlertsMutation.isPending}
          className="flex-1 gap-2 bg-red-600 hover:bg-red-700"
        >
          {generateAlertsMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <AlertTriangle className="w-4 h-4" />
          )}
          Gerar Alertas
        </Button>
        <Button
          onClick={() => setShowNewOrder(true)}
          variant="outline"
          className="flex-1 gap-2"
        >
          <Package className="w-4 h-4" />
          Novo Consumível
        </Button>
      </div>

      {/* RESUMO */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-red-700 font-bold">⚠️ ALERTAS</p>
            <p className="text-2xl font-black text-red-600">{alertas.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-blue-700 font-bold">📅 PRÓXIMOS</p>
            <p className="text-2xl font-black text-blue-600">{proximosVencimentos.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-green-700 font-bold">💰 POTENCIAL</p>
            <p className="text-lg font-black text-green-600">
              R$ {(consumables.reduce((a, c) => a + (c.monthly_revenue_potential || 0), 0) / 1000).toFixed(0)}k
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ALERTAS PARA REPOSIÇÃO */}
      {alertas.length > 0 && (
        <Card className="border-red-300 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              ⚠️ REPOSIÇÃO URGENTE ({alertas.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {alertas.map(item => (
              <div key={item.id} className="p-3 rounded-lg bg-white border-2 border-red-200">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-bold text-slate-900">{item.client_name}</p>
                    <p className="text-xs text-slate-600">{CONSUMABLE_TYPES[item.consumable_type]}</p>
                  </div>
                  <Badge className="bg-red-600">
                    {item.equipment_model}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                  <p><span className="font-bold">Próximo pedido:</span> {item.next_reorder_date}</p>
                  <p><span className="font-bold">Potencial:</span> R$ {item.monthly_revenue_potential?.toLocaleString('pt-BR') || 0}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* PRÓXIMOS VENCIMENTOS */}
      {proximosVencimentos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              📅 Próximas Reposições
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-64 overflow-y-auto">
            {proximosVencimentos.slice(0, 10).map(item => (
              <div key={item.id} className="p-2 rounded bg-slate-50 border border-slate-200 text-sm">
                <div className="flex justify-between mb-1">
                  <p className="font-bold">{item.client_name}</p>
                  <p className="text-xs text-slate-600">{item.next_reorder_date}</p>
                </div>
                <p className="text-xs text-slate-600">{CONSUMABLE_TYPES[item.consumable_type]}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* NOVO CONSUMÍVEL */}
      {showNewOrder && (
        <Card className="border-blue-300 bg-blue-50">
          <CardHeader>
            <CardTitle>Novo Consumível</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="w-full px-3 py-2 rounded border border-slate-300"
            >
              <option value="">Selecione cliente</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.full_name}</option>
              ))}
            </select>

            <select
              className="w-full px-3 py-2 rounded border border-slate-300"
              id="consumable_type"
            >
              <option value="">Tipo de consumível</option>
              {Object.entries(CONSUMABLE_TYPES).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Modelo equipamento"
              className="w-full px-3 py-2 rounded border border-slate-300"
              id="equipment_model"
            />

            <input
              type="number"
              placeholder="Consumo/dia (unidades)"
              className="w-full px-3 py-2 rounded border border-slate-300"
              id="consumption"
            />

            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={() => {
                  const client = clients.find(c => c.id === selectedClient);
                  createConsumableMutation.mutate({
                    client_id: selectedClient,
                    client_name: client?.full_name,
                    consumable_type: document.getElementById('consumable_type').value,
                    equipment_model: document.getElementById('equipment_model').value,
                    estimated_consumption_per_day: parseFloat(document.getElementById('consumption').value),
                    last_order_date: new Date().toISOString().split('T')[0],
                  });
                }}
              >
                Salvar
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowNewOrder(false)}
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
}
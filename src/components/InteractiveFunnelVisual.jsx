import React, { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Settings, TrendingUp, Users, DollarSign, Clock } from 'lucide-react';
import { toast } from 'sonner';

const DEFAULT_STAGES = [
  { name: 'Lead Qualificado', order: 1, color: '#6366f1', icon: '🎯', probability: 10 },
  { name: 'Oportunidade', order: 2, color: '#8b5cf6', icon: '💡', probability: 25 },
  { name: 'Proposta', order: 3, color: '#f59e0b', icon: '📄', probability: 50 },
  { name: 'Negociação', order: 4, color: '#ef4444', icon: '🤝', probability: 75 },
  { name: 'Fechado', order: 5, color: '#10b981', icon: '✅', probability: 100 }
];

function StageCard({ stage, clients, onClientDrop }) {
  const [dragOverStage, setDragOverStage] = useState(false);

  const stageClients = clients.filter(c => c.pipeline_stage === stage.name);
  const totalRevenue = stageClients.reduce((sum, c) => {
    const value = Number(c.projected_revenue);
    return sum + (Number.isFinite(value) ? value : 0);
  }, 0);
  const stageAges = stageClients
    .map(c => new Date(c.stage_entered_date || c.created_date).getTime())
    .filter(timestamp => Number.isFinite(timestamp))
    .map(timestamp => Math.max(0, (Date.now() - timestamp) / (1000 * 60 * 60 * 24)));
  const avgDaysInStage = stageAges.length > 0
    ? Math.round(stageAges.reduce((sum, days) => sum + days, 0) / stageAges.length)
    : 0;

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverStage(true);
  };

  const handleDragLeave = () => {
    setDragOverStage(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverStage(false);

    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'));
      onClientDrop(data.clientId, stage.name);
    } catch (err) {
      toast.error('Erro ao soltar cliente');
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`rounded-xl p-4 mb-3 transition-all ${
        dragOverStage ? 'shadow-2xl scale-105 bg-green-50' : 'shadow-md'
      }`}
      style={{ backgroundColor: dragOverStage ? '#dcfce7' : stage.color + '15', borderLeft: `4px solid ${stage.color}` }}
    >
      <div className="flex items-start gap-3 mb-3">
        <span className="text-2xl">{stage.icon}</span>
        
        <div className="flex-1 min-w-0">
          <div className="mb-2">
            <h4 className="font-bold text-slate-900 text-sm">{stage.name}</h4>
          </div>

          {/* Métricas */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-white/60 rounded p-2">
              <p className="text-slate-600">Clientes</p>
              <p className="font-bold text-slate-900">{stageClients.length}</p>
            </div>
            <div className="bg-white/60 rounded p-2">
              <p className="text-slate-600">Receita</p>
              <p className="font-bold text-slate-900">R$ {(totalRevenue / 1000).toFixed(0)}k</p>
            </div>
            <div className="bg-white/60 rounded p-2">
              <p className="text-slate-600">Dias Médios</p>
              <p className="font-bold text-slate-900">{avgDaysInStage}d</p>
            </div>
            <div className="bg-white/60 rounded p-2">
              <p className="text-slate-600">Taxa Conversão</p>
              <p className="font-bold text-slate-900">{stage.probability}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Clientes Droppable Area */}
      <div className="bg-white rounded-lg p-2 min-h-20 border-2 border-dashed" style={{ borderColor: dragOverStage ? '#10b981' : '#cbd5e1' }}>
        {stageClients.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-3">Arraste clientes aqui</p>
        ) : (
          <div className="space-y-1">
            {stageClients.slice(0, 3).map(client => (
              <div
                key={client.id}
                className="bg-slate-50 rounded p-1.5 text-xs truncate cursor-move hover:bg-slate-100"
                draggable
                onDragStart={(event) => event.dataTransfer.setData('application/json', JSON.stringify({ clientId: client.id }))}
              >
                <span className="font-semibold">{client.clinic_name || client.full_name}</span>
              </div>
            ))}
            {stageClients.length > 3 && (
              <p className="text-xs text-slate-500 text-center">+{stageClients.length - 3} mais</p>
            )}
          </div>
        )}
      </div>

      {stage.is_custom && (
        <Button size="sm" variant="ghost" className="w-full mt-2 h-7 text-xs">
          <Settings className="w-3 h-3 mr-1" /> Editar Etapa
        </Button>
      )}
    </div>
  );
}

export default function InteractiveFunnelVisual() {
  const [addingStage, setAddingStage] = useState(false);

  // Buscar clientes
  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-updated_date', 500).catch(() => [])
  });

  // Buscar estágios customizados
  const { data: customStages = [] } = useQuery({
    queryKey: ['funnelStages'],
    queryFn: () => base44.entities.FunnelStage.list('order', 100).catch(() => [])
  });

  // Combinar estágios
  const allStages = useMemo(() => {
    const baseStages = DEFAULT_STAGES.map((s, i) => ({
      id: `default-${i}`,
      ...s,
      is_custom: false
    }));
    const custom = customStages.map(s => ({ ...s, is_custom: true }));
    return [...baseStages, ...custom].sort((a, b) => a.order - b.order);
  }, [customStages]);

  // Registra apenas uma solicitação; nenhuma entidade comercial é alterada aqui.
  const updateClientMutation = useMutation({
    mutationFn: async ({ clientId, stageName }) => {
      const client = clients.find(c => c.id === clientId);
      return base44.entities.CRMUpdateQueue.create({
        origem: 'manual',
        texto_original: `Mover ${client?.clinic_name || client?.full_name || clientId} para ${stageName}`,
        comando_interpretado: 'Solicitação de alteração de etapa do funil',
        cliente_id: clientId,
        tipo_atualizacao: 'alterar_etapa_funil',
        campo_alvo: 'pipeline_stage',
        valor_novo: stageName,
        status: 'pendente',
        risco: 'medio',
        exige_aprovacao: true,
        agente_origem: 'InteractiveFunnelVisual',
        data_criacao: new Date().toISOString(),
        observacao: 'Solicitação criada por arrastar e soltar; requer aprovação antes de aplicar.'
      });
    },
    onSuccess: () => toast.success('Solicitação registrada para aprovação.'),
    onError: (error) => toast.error('Erro: ' + error.message)
  });

  const handleClientDrop = (clientId, stageName) => {
    updateClientMutation.mutate({ clientId, stageName });
  };

  // Estatísticas gerais
  const stats = useMemo(() => {
    const totalClients = clients.length;
    const totalRevenue = clients.reduce((sum, c) => {
      const value = Number(c.projected_revenue);
      return sum + (Number.isFinite(value) ? value : 0);
    }, 0);
    const probabilityTotal = allStages.reduce((sum, stage) => {
      const value = Number(stage.probability);
      return sum + (Number.isFinite(value) ? value : 0);
    }, 0);
    const avgConversionRate = allStages.length > 0 ? probabilityTotal / allStages.length : 0;
    const clientsByStage = allStages.map(stage => ({
      ...stage,
      count: clients.filter(c => c.pipeline_stage === stage.name).length
    }));

    return { totalClients, totalRevenue, avgConversionRate, clientsByStage };
  }, [clients, allStages]);

  return (
    <div className="space-y-6">
        {/* Header com Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-xs text-slate-600">Total Clientes</p>
                <p className="font-bold text-blue-900">{stats.totalClients}</p>
              </div>
            </div>
          </Card>

          <Card className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-xs text-slate-600">Receita Total</p>
                <p className="font-bold text-green-900">R$ {(stats.totalRevenue / 1000).toFixed(0)}k</p>
              </div>
            </div>
          </Card>

          <Card className="p-3 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-xs text-slate-600">Conversão Média</p>
                <p className="font-bold text-purple-900">{stats.avgConversionRate.toFixed(0)}%</p>
              </div>
            </div>
          </Card>

          <Card className="p-3 bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-xs text-slate-600">Etapas</p>
                <p className="font-bold text-orange-900">{allStages.length}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Funil Interativo */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" /> Funil de Vendas Interativo
            </h3>
            <Button size="sm" onClick={() => setAddingStage(!addingStage)}>
              <Plus className="w-4 h-4 mr-1" /> Nova Etapa
            </Button>
          </div>

          <p className="text-xs text-slate-600 mb-4">Arraste clientes entre as etapas para solicitar a atualização</p>

          {allStages.map(stage => (
            <StageCard
              key={stage.id}
              stage={stage}
              clients={clients}
              onClientDrop={handleClientDrop}
            />
          ))}
        </Card>

        {/* Análise de Gargalos */}
        <Card className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
          <h4 className="font-bold text-slate-900 mb-3">⚠️ Oportunidades de Otimização</h4>
          <div className="space-y-2">
            {stats.clientsByStage.map((stage, i) => {
              const nextStage = stats.clientsByStage[i + 1];
              const conversionRate = nextStage && stage.count > 0
                ? Math.round((nextStage.count / stage.count) * 100)
                : null;
              const isBottleneck = stage.count > 5 && conversionRate !== null && conversionRate < 50;

              return (
                <div key={stage.id} className="text-sm bg-white/60 rounded p-2">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">{stage.name}</span>
                    <div className="flex gap-2">
                      <Badge>{stage.count} clientes</Badge>
                      {nextStage && <Badge variant="outline">{conversionRate ?? 0}% conversão</Badge>}
                    </div>
                  </div>
                  {isBottleneck && (
                    <p className="text-xs text-orange-600 mt-1">
                      🔴 Gargalo detectado: muitos clientes sem avançar
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      </div>
  );
}
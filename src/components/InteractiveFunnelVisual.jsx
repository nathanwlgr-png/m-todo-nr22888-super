import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GripVertical, Plus, Settings, TrendingUp, Users, DollarSign, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const DEFAULT_STAGES = [
  { name: 'Lead Qualificado', order: 1, color: '#6366f1', icon: '🎯', probability: 10 },
  { name: 'Oportunidade', order: 2, color: '#8b5cf6', icon: '💡', probability: 25 },
  { name: 'Proposta', order: 3, color: '#f59e0b', icon: '📄', probability: 50 },
  { name: 'Negociação', order: 4, color: '#ef4444', icon: '🤝', probability: 75 },
  { name: 'Fechado', order: 5, color: '#10b981', icon: '✅', probability: 100 }
];

function DraggableStageCard({ stage, clients, onDrop, isSelected, onSelect }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: stage.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  const stageClients = clients.filter(c => c.current_stage_id === stage.id);
  const totalRevenue = stageClients.reduce((sum, c) => sum + (c.projected_revenue || 0), 0);
  const avgDaysInStage = stageClients.length > 0 
    ? Math.round(stageClients.reduce((sum, c) => {
        const daysSince = new Date(c.stage_entered_date || c.created_date);
        return sum + ((Date.now() - daysSince) / (1000 * 60 * 60 * 24));
      }, 0) / stageClients.length)
    : 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-xl p-4 mb-3 transition-all ${
        isDragging ? 'shadow-2xl scale-105' : 'shadow-md'
      }`}
      style={{ backgroundColor: stage.color + '15', borderLeft: `4px solid ${stage.color}` }}
    >
      <div className="flex items-start gap-3 mb-3">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing flex-shrink-0"
        >
          <GripVertical className="w-5 h-5 text-slate-400" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{stage.icon}</span>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">{stage.name}</h4>
              <p className="text-xs text-slate-600">{stage.description}</p>
            </div>
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
      <div className="bg-white rounded-lg p-2 min-h-20 border-2 border-dashed border-slate-300">
        {stageClients.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-3">Arraste clientes aqui</p>
        ) : (
          <div className="space-y-1">
            {stageClients.slice(0, 3).map(client => (
              <div key={client.id} className="bg-slate-50 rounded p-1.5 text-xs truncate">
                <span className="font-semibold">{client.clinic_name}</span>
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
  const queryClient = useQueryClient();
  const [stages, setStages] = useState(DEFAULT_STAGES);
  const [addingStage, setAddingStage] = useState(false);

  // Sensors para drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, { distance: 8 }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

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

  // Mutation para atualizar cliente
  const updateClientMutation = useMutation({
    mutationFn: async ({ clientId, stageId, stageName }) => {
      const client = clients.find(c => c.id === clientId);
      
      // Atualizar cliente
      await base44.entities.Client.update(clientId, {
        pipeline_stage: stageName,
        stage_entered_date: new Date().toISOString()
      });

      // Criar interação
      await base44.entities.Interaction.create({
        client_id: clientId,
        client_name: client?.clinic_name,
        type: 'other',
        direction: 'outbound',
        subject: `Movido para: ${stageName}`,
        notes: `Cliente avançou para a etapa "${stageName}" do funil`,
        outcome: 'positive',
        created_by_name: 'Sistema'
      }).catch(() => {});

      // Disparar automação se configurada
      const stage = allStages.find(s => s.id === stageId);
      if (stage?.automation_trigger) {
        await base44.functions.invoke('processAutomationRules', {
          trigger_type: 'pipeline_stage_change',
          event_data: {
            client_id: clientId,
            stage_id: stageId,
            stage_name: stageName
          }
        }).catch(() => {});
      }

      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success('Cliente movido com sucesso!');
    },
    onError: (error) => toast.error('Erro: ' + error.message)
  });

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;

    const clientId = active.id;
    const stageId = over.id;
    const stage = allStages.find(s => s.id === stageId);

    if (stage) {
      updateClientMutation.mutate({
        clientId,
        stageId,
        stageName: stage.name
      });
    }
  };

  // Estatísticas gerais
  const stats = useMemo(() => {
    const totalClients = clients.length;
    const totalRevenue = clients.reduce((sum, c) => sum + (c.projected_revenue || 0), 0);
    const avgConversionRate = allStages.reduce((sum, s) => sum + (s.probability || 0), 0) / allStages.length;
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

        <p className="text-xs text-slate-600 mb-4">Arraste clientes entre as etapas para atualizar automaticamente</p>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={allStages.map(s => s.id)} strategy={verticalListSortingStrategy}>
            {allStages.map(stage => (
              <DraggableStageCard
                key={stage.id}
                stage={stage}
                clients={clients}
                onDrop={(clientId) => updateClientMutation.mutate({ clientId, stageId: stage.id })}
              />
            ))}
          </SortableContext>
        </DndContext>
      </Card>

      {/* Análise de Gargalos */}
      <Card className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
        <h4 className="font-bold text-slate-900 mb-3">⚠️ Oportunidades de Otimização</h4>
        <div className="space-y-2">
          {stats.clientsByStage.map((stage, i) => {
            const nextStage = stats.clientsByStage[i + 1];
            const conversionRate = nextStage ? ((nextStage.count / stage.count) * 100).toFixed(0) : 'N/A';
            const isBottleneck = stage.count > 5 && conversionRate < 50;

            return (
              <div key={stage.id} className="text-sm bg-white/60 rounded p-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">{stage.name}</span>
                  <div className="flex gap-2">
                    <Badge>{stage.count} clientes</Badge>
                    {nextStage && <Badge variant="outline">{conversionRate}% conversão</Badge>}
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
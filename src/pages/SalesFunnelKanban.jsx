import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { MoreVertical, Trash2, Eye, RefreshCw } from 'lucide-react';

const STAGES = ['lead', 'qualificado', 'proposta', 'negociacao', 'fechado', 'perdido'];
const STAGE_COLORS = {
  lead: 'bg-blue-100',
  qualificado: 'bg-purple-100',
  proposta: 'bg-yellow-100',
  negociacao: 'bg-orange-100',
  fechado: 'bg-green-100',
  perdido: 'bg-red-100',
};

export default function SalesFunnelKanban() {
  const [leads, setLeads] = useState({});
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  // Fetch leads
  const { data: allLeads, refetch } = useQuery({
    queryKey: ['kanban-leads'],
    queryFn: async () => {
      const data = await base44.entities.Lead.list('-created_date', 500);
      return data;
    },
    staleTime: 60000,
  });

  // Organizar leads por estágio
  useEffect(() => {
    if (allLeads) {
      const organized = {};
      STAGES.forEach(stage => {
        organized[stage] = allLeads.filter(lead => lead.stage === stage);
      });
      setLeads(organized);
    }
  }, [allLeads]);

  // Mutation para mover lead
  const moveLeadMutation = useMutation({
    mutationFn: async ({ leadId, newStage }) => {
      await base44.entities.Lead.update(leadId, { stage: newStage });
      const res = await base44.functions.invoke('processFunnelMovement', {
        lead_id: leadId,
        from_stage: leads[Object.keys(leads).find(s => leads[s].find(l => l.id === leadId))],
        to_stage: newStage,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban-leads'] });
    },
  });

  const handleDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const leadId = draggableId;
    const newStage = destination.droppableId;

    try {
      await moveLeadMutation.mutateAsync({ leadId, newStage });
    } catch (error) {
      console.error('Erro ao mover lead:', error);
    }
  };

  // Calcular total por estágio
  const calculateTotal = (stageLeads) => {
    return stageLeads.reduce((sum, lead) => sum + (lead.estimated_deal_value || 0), 0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-full">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-slate-900 mb-2">🎯 Funil de Vendas (Kanban)</h1>
          <p className="text-slate-600">Arraste leads entre estágios para atualizar o pipeline</p>
        </div>

        {/* Controles */}
        <div className="mb-6 flex gap-3">
          <Button onClick={() => refetch()} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </Button>
        </div>

        {/* Kanban Board */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {STAGES.map(stage => (
              <div key={stage} className="min-h-[600px]">
                {/* Coluna Header */}
                <div className={`${STAGE_COLORS[stage]} rounded-t-lg p-4 border-b-2 border-slate-200`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-slate-900 capitalize">{stage}</h3>
                      <p className="text-sm text-slate-600">{leads[stage]?.length || 0} leads</p>
                    </div>
                    <span className="text-lg font-black text-slate-700">
                      R$ {(calculateTotal(leads[stage] || []) / 1000).toFixed(0)}k
                    </span>
                  </div>
                </div>

                {/* Coluna Cards */}
                <Droppable droppableId={stage}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`bg-white rounded-b-lg p-3 space-y-3 min-h-[500px] flex-1 ${
                        snapshot.isDraggingOver ? 'bg-slate-100' : ''
                      }`}
                    >
                      {(leads[stage] || []).map((lead, index) => (
                        <Draggable key={lead.id} draggableId={lead.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`bg-white border-2 border-slate-200 rounded-lg p-3 cursor-move hover:shadow-lg transition-all ${
                                snapshot.isDragging ? 'shadow-xl ring-2 ring-blue-500' : ''
                              }`}
                            >
                              {/* Lead Card */}
                              <div className="flex justify-between items-start gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-slate-900 truncate text-sm">{lead.full_name}</p>
                                  <p className="text-xs text-slate-500 truncate">{lead.company}</p>
                                  <p className="font-bold text-slate-900 mt-2 text-sm">
                                    R$ {lead.estimated_deal_value?.toLocaleString('pt-BR') || '0'}
                                  </p>
                                </div>
                                <div className="flex gap-1">
                                  <button className="p-1 hover:bg-slate-100 rounded">
                                    <Eye className="w-3 h-3 text-slate-500" />
                                  </button>
                                </div>
                              </div>

                              {/* Badges */}
                              {lead.priority_level && (
                                <div className="mt-2">
                                  <span className={`inline-block px-2 py-1 text-xs font-bold rounded ${
                                    lead.priority_level <= 2 ? 'bg-red-200 text-red-800' :
                                    lead.priority_level <= 3 ? 'bg-yellow-200 text-yellow-800' :
                                    'bg-green-200 text-green-800'
                                  }`}>
                                    P{lead.priority_level}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      
                      {(!leads[stage] || leads[stage].length === 0) && (
                        <div className="flex items-center justify-center h-32 text-slate-400">
                          <p className="text-sm text-center">Nenhum lead neste estágio</p>
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>

        {/* Pipeline Summary */}
        <Card className="mt-6 bg-gradient-to-r from-blue-50 to-purple-50 border-slate-200">
          <CardContent className="pt-6">
            <h3 className="font-bold text-slate-900 mb-4">📊 Resumo do Pipeline</h3>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              {STAGES.map(stage => (
                <div key={stage} className="text-center p-3 bg-white rounded-lg border border-slate-200">
                  <p className="text-xs text-slate-500 capitalize mb-1">{stage}</p>
                  <p className="text-xl font-bold text-slate-900">{leads[stage]?.length || 0}</p>
                  <p className="text-xs text-slate-600 mt-1">
                    R$ {(calculateTotal(leads[stage] || []) / 1000).toFixed(0)}k
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4 p-4 bg-blue-100 rounded-lg border border-blue-200">
              <p className="text-sm text-slate-600">
                <span className="font-bold text-blue-900">Pipeline Total:</span>{' '}
                R$ {(Object.values(leads).flat().reduce((sum, lead) => sum + (lead.estimated_deal_value || 0), 0) / 1000000).toFixed(2)}M
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { TrendingUp, Users, DollarSign, Target, ArrowRight } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { toast } from 'sonner';

const PIPELINE_STAGES = [
  { id: 'lead', label: 'Lead', color: 'bg-blue-50 border-l-blue-500' },
  { id: 'qualificado', label: 'Qualificado', color: 'bg-purple-50 border-l-purple-500' },
  { id: 'proposta', label: 'Proposta', color: 'bg-yellow-50 border-l-yellow-500' },
  { id: 'negociacao', label: 'Negociação', color: 'bg-orange-50 border-l-orange-500' },
  { id: 'fechado', label: 'Fechado', color: 'bg-green-50 border-l-green-500' },
];

export default function PipelineView() {
  const queryClient = useQueryClient();

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
  });

  const updateClientMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Client.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['clients']);
      toast.success('Cliente movido!');
    }
  });

  const handleDragEnd = (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;

    const newStage = destination.droppableId;
    const client = clients.find(c => c.id === draggableId);
    
    if (client && client.pipeline_stage !== newStage) {
      updateClientMutation.mutate({
        id: draggableId,
        data: { pipeline_stage: newStage }
      });
    }
  };

  const clientsByStage = useMemo(() => {
    const grouped = {};
    PIPELINE_STAGES.forEach(stage => {
      grouped[stage.id] = clients.filter(c => c.pipeline_stage === stage.id);
    });
    return grouped;
  }, [clients]);

  const totalPipelineValue = clients.reduce((sum, c) => sum + (c.projected_revenue || 0), 0);
  const closedDeals = clients.filter(c => c.pipeline_stage === 'fechado').length;

  return (
    <div className="space-y-6 p-6">
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg p-6">
        <div className="flex items-center gap-3 mb-2">
          <TrendingUp className="w-6 h-6" />
          <h1 className="text-3xl font-bold">Pipeline de Vendas</h1>
        </div>
        <p className="text-green-100">Gerencie o funil de vendas em tempo real</p>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">R$ {(totalPipelineValue / 1000).toFixed(0)}k</div>
              <p className="text-sm text-slate-600 mt-1">Valor Total do Pipeline</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Target className="w-8 h-8 text-red-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">{closedDeals}</div>
              <p className="text-sm text-slate-600 mt-1">Negócios Fechados</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">{clients.length}</div>
              <p className="text-sm text-slate-600 mt-1">Total de Clientes</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <ArrowRight className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">{clients.filter(c => c.pipeline_stage === 'negociacao').length}</div>
              <p className="text-sm text-slate-600 mt-1">Em Negociação</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid lg:grid-cols-5 gap-4">
          {PIPELINE_STAGES.map(stage => {
            const stageClients = clientsByStage[stage.id] || [];
            return (
              <Card key={stage.id} className="bg-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center justify-between">
                    {stage.label}
                    <span className="text-xs bg-slate-200 text-slate-700 px-2 py-1 rounded">
                      {stageClients.length}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Droppable droppableId={stage.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`min-h-[500px] space-y-2 p-2 rounded-lg ${
                          snapshot.isDraggingOver ? 'bg-slate-100' : 'bg-slate-50'
                        }`}
                      >
                        {stageClients.map((client, index) => (
                          <Draggable
                            key={client.id}
                            draggableId={client.id}
                            index={index}
                          >
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`p-3 rounded-lg border-l-4 cursor-move ${stage.color} ${
                                  snapshot.isDragging ? 'shadow-lg' : ''
                                }`}
                              >
                                <p className="font-semibold text-sm text-slate-800">
                                  {client.first_name}
                                </p>
                                <p className="text-xs text-slate-600 mt-1">
                                  {client.clinic_name}
                                </p>
                                {client.projected_revenue && (
                                  <p className="text-xs font-semibold text-green-700 mt-2">
                                    R$ {(client.projected_revenue / 1000).toFixed(1)}k
                                  </p>
                                )}
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
}
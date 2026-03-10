import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  User, Phone, Mail, Building2, TrendingUp, 
  DollarSign, Calendar, Target, Plus, Eye
} from 'lucide-react';
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';

const STAGES = [
  { id: 'lead', label: 'Prospecção', color: 'bg-slate-500', icon: Target },
  { id: 'qualificado', label: 'Qualificação', color: 'bg-blue-500', icon: User },
  { id: 'proposta', label: 'Proposta', color: 'bg-yellow-500', icon: DollarSign },
  { id: 'negociacao', label: 'Negociação', color: 'bg-orange-500', icon: TrendingUp },
  { id: 'fechado', label: 'Fechado', color: 'bg-green-500', icon: Calendar },
];

export default function SalesFunnelKanban() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedStage, setSelectedStage] = useState(null);

  // Buscar todos os leads
  const { data: allLeads = [], isLoading } = useQuery({
    queryKey: ['leads-kanban'],
    queryFn: () => base44.entities.Lead.list(),
  });

  // Organizar leads por estágio
  const leadsByStage = STAGES.reduce((acc, stage) => {
    acc[stage.id] = allLeads.filter(lead => lead.pipeline_stage === stage.id);
    return acc;
  }, {});

  // Mutation para atualizar estágio
  const updateStageMutation = useMutation({
    mutationFn: ({ leadId, newStage }) => 
      base44.entities.Lead.update(leadId, { pipeline_stage: newStage }),
    onSuccess: () => {
      queryClient.invalidateQueries(['leads-kanban']);
    },
  });

  const handleDragEnd = (result) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId) return;

    const leadId = draggableId;
    const newStage = destination.droppableId;

    updateStageMutation.mutate({ leadId, newStage });
  };

  const LeadCard = ({ lead, index }) => {
    const score = lead.predictive_score || 0;
    const scoreColor = score >= 70 ? 'text-green-600' : score >= 40 ? 'text-yellow-600' : 'text-red-600';

    return (
      <Draggable draggableId={lead.id} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={`mb-3 ${snapshot.isDragging ? 'opacity-50' : ''}`}
          >
            <Card className="cursor-move hover:shadow-lg transition-all border-l-4 border-l-indigo-500">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm mb-1">{lead.full_name}</h3>
                    {lead.company && (
                      <div className="flex items-center gap-1 text-xs text-slate-600 mb-1">
                        <Building2 className="w-3 h-3" />
                        <span>{lead.company}</span>
                      </div>
                    )}
                  </div>
                  <Badge className={scoreColor}>
                    {score}%
                  </Badge>
                </div>

                {lead.email && (
                  <div className="flex items-center gap-1 text-xs text-slate-600 mb-1">
                    <Mail className="w-3 h-3" />
                    <span className="truncate">{lead.email}</span>
                  </div>
                )}

                {lead.phone && (
                  <div className="flex items-center gap-1 text-xs text-slate-600 mb-2">
                    <Phone className="w-3 h-3" />
                    <span>{lead.phone}</span>
                  </div>
                )}

                {lead.estimated_deal_value && (
                  <div className="flex items-center gap-1 text-xs font-semibold text-green-600 mb-2">
                    <DollarSign className="w-3 h-3" />
                    <span>R$ {lead.estimated_deal_value.toLocaleString('pt-BR')}</span>
                  </div>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  className="w-full mt-2"
                  onClick={() => navigate(createPageUrl('LeadProfile') + `?id=${lead.id}`)}
                >
                  <Eye className="w-3 h-3 mr-1" />
                  Ver Detalhes
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </Draggable>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Carregando funil...</p>
        </div>
      </div>
    );
  }

  const totalValue = allLeads.reduce((sum, lead) => sum + (lead.estimated_deal_value || 0), 0);
  const conversionRate = allLeads.length > 0 
    ? ((leadsByStage.fechado?.length || 0) / allLeads.length * 100).toFixed(1)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Funil de Vendas - Kanban</h1>
          <p className="text-slate-600">Arraste os leads entre os estágios para atualizar o pipeline</p>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Total de Leads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{allLeads.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Valor Pipeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                R$ {totalValue.toLocaleString('pt-BR')}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Taxa de Conversão</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{conversionRate}%</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">Negociações Ativas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {leadsByStage.negociacao?.length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Kanban Board */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {STAGES.map((stage) => {
              const StageIcon = stage.icon;
              const stageLeads = leadsByStage[stage.id] || [];
              const stageValue = stageLeads.reduce((sum, lead) => sum + (lead.estimated_deal_value || 0), 0);

              return (
                <div key={stage.id} className="flex flex-col">
                  <div className={`${stage.color} text-white rounded-t-lg p-4 shadow-md`}>
                    <div className="flex items-center gap-2 mb-2">
                      <StageIcon className="w-5 h-5" />
                      <h2 className="font-bold text-sm">{stage.label}</h2>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span>{stageLeads.length} leads</span>
                      <span>R$ {stageValue.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
                    </div>
                  </div>

                  <Droppable droppableId={stage.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 bg-white rounded-b-lg p-3 shadow-md min-h-[500px] ${
                          snapshot.isDraggingOver ? 'bg-indigo-50 border-2 border-indigo-300' : ''
                        }`}
                      >
                        {stageLeads.length === 0 ? (
                          <div className="flex items-center justify-center h-32 text-slate-400 text-sm">
                            Nenhum lead neste estágio
                          </div>
                        ) : (
                          stageLeads.map((lead, index) => (
                            <LeadCard key={lead.id} lead={lead} index={index} />
                          ))
                        )}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>

        {/* Botão adicionar lead */}
        <div className="mt-6 text-center">
          <Button
            size="lg"
            onClick={() => navigate(createPageUrl('Leads'))}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="w-5 h-5 mr-2" />
            Adicionar Novo Lead
          </Button>
        </div>
      </div>
    </div>
  );
}
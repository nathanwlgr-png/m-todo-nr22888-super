import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Brain, TrendingUp, Zap } from 'lucide-react';
import { toast } from 'sonner';

const PIPELINE_STAGES = ['novo', 'em_contato', 'qualificado', 'negociacao', 'convertido', 'perdido'];

const STAGE_LABELS = {
  novo: '🆕 Novo',
  em_contato: '📞 Em Contato',
  qualificado: '✅ Qualificado',
  negociacao: '💰 Negociação',
  convertido: '🎉 Convertido',
  perdido: '❌ Perdido'
};

const STAGE_COLORS = {
  novo: 'bg-slate-50 border-slate-200',
  em_contato: 'bg-blue-50 border-blue-200',
  qualificado: 'bg-yellow-50 border-yellow-200',
  negociacao: 'bg-orange-50 border-orange-200',
  convertido: 'bg-green-50 border-green-200',
  perdido: 'bg-red-50 border-red-200'
};

export default function LeadKanbanBoard({ autoSuggestStage = true }) {
  const queryClient = useQueryClient();
  const [leads, setLeads] = useState([]);
  const [suggestions, setSuggestions] = useState({});
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Fetch leads
  const { data: allLeads = [] } = useQuery({
    queryKey: ['leads-kanban'],
    queryFn: () => base44.entities.Lead.list('-updated_date'),
  });

  // Update lead mutation
  const updateLeadMutation = useMutation({
    mutationFn: (data) => base44.entities.Lead.update(data.id, { stage: data.stage }),
    onSuccess: () => queryClient.invalidateQueries(['leads-kanban']),
  });

  // Organize leads by stage
  useEffect(() => {
    const organized = {};
    PIPELINE_STAGES.forEach(stage => {
      organized[stage] = allLeads.filter(l => l.stage === stage || (l.stage === 'convertido' && stage === 'convertido'));
    });
    setLeads(organized);
  }, [allLeads]);

  // Get IA suggestions
  const getSuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      const res = await base44.functions.invoke('suggestLeadStages', {
        leads: allLeads.slice(0, 20) // Limit to prevent rate limiting
      });
      if (res.data?.suggestions) {
        setSuggestions(res.data.suggestions);
      }
    } catch (error) {
      console.error('Error getting suggestions:', error);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // Handle drag and drop
  const handleDragEnd = (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;

    const newStage = destination.droppableId;
    const lead = allLeads.find(l => l.id === draggableId);
    
    if (lead && source.droppableId !== destination.droppableId) {
      updateLeadMutation.mutate({
        id: draggableId,
        stage: newStage
      });
      toast.success(`${lead.full_name} movido para ${STAGE_LABELS[newStage]}`);
    }
  };

  useEffect(() => {
    if (autoSuggestStage && allLeads.length > 0) {
      getSuggestions();
    }
  }, [autoSuggestStage, allLeads.length]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-lg text-slate-800">📊 Pipeline Kanban</h2>
        <Button
          onClick={getSuggestions}
          disabled={loadingSuggestions}
          size="sm"
          className="bg-gradient-to-r from-indigo-600 to-purple-600"
        >
          {loadingSuggestions ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Brain className="w-4 h-4 mr-2" />}
          Sugerir Estágios com IA
        </Button>
      </div>

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-6 gap-3 overflow-x-auto pb-4">
          {PIPELINE_STAGES.map(stage => (
            <Droppable key={stage} droppableId={stage}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`flex-1 min-w-[250px] rounded-lg border-2 p-3 transition-colors ${STAGE_COLORS[stage]} ${
                    snapshot.isDraggingOver ? 'bg-opacity-80 border-opacity-100' : ''
                  }`}
                >
                  {/* Stage Header */}
                  <div className="mb-3">
                    <h3 className="font-semibold text-sm text-slate-800">{STAGE_LABELS[stage]}</h3>
                    <p className="text-xs text-slate-500">{leads[stage]?.length || 0} leads</p>
                  </div>

                  {/* Lead Cards */}
                  <div className="space-y-2">
                    {leads[stage]?.map((lead, index) => {
                      const suggestion = suggestions[lead.id];
                      const shouldMove = suggestion && suggestion.recommended_stage !== stage;

                      return (
                        <Draggable key={lead.id} draggableId={lead.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`p-2.5 rounded-lg border bg-white shadow-sm hover:shadow-md transition-all ${
                                snapshot.isDragging ? 'shadow-lg rotate-3' : ''
                              } ${shouldMove ? 'border-indigo-300 border-2' : 'border-slate-200'}`}
                            >
                              {/* Lead Info */}
                              <div className="text-xs font-medium text-slate-800 truncate">
                                {lead.full_name}
                              </div>
                              <div className="text-[10px] text-slate-500 truncate">
                                {lead.company}
                              </div>

                              {/* Score and probability */}
                              <div className="flex gap-1 mt-1.5 flex-wrap">
                                {lead.predictive_score && (
                                  <Badge className="text-[9px] h-4 bg-blue-100 text-blue-700">
                                    {lead.predictive_score}%
                                  </Badge>
                                )}
                                {lead.conversion_probability && (
                                  <Badge className="text-[9px] h-4 bg-green-100 text-green-700">
                                    💰 {lead.conversion_probability}%
                                  </Badge>
                                )}
                              </div>

                              {/* IA Suggestion */}
                              {shouldMove && (
                                <div className="mt-2 p-1.5 bg-indigo-50 border border-indigo-200 rounded text-[9px]">
                                  <div className="flex items-center gap-1 text-indigo-700 font-semibold mb-0.5">
                                    <Brain className="w-3 h-3" />
                                    Mover para:
                                  </div>
                                  <div className="text-indigo-600">
                                    {STAGE_LABELS[suggestion.recommended_stage]}
                                  </div>
                                  {suggestion.reason && (
                                    <p className="text-indigo-500 mt-0.5">{suggestion.reason}</p>
                                  )}
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      updateLeadMutation.mutate({
                                        id: lead.id,
                                        stage: suggestion.recommended_stage
                                      })
                                    }
                                    disabled={updateLeadMutation.isPending}
                                    className="mt-1 w-full h-5 text-[9px] bg-indigo-600 hover:bg-indigo-700"
                                  >
                                    ✓ Aplicar
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                  </div>

                  {/* Drop zone placeholder */}
                  {provided.placeholder}
                  {(!leads[stage] || leads[stage].length === 0) && (
                    <div className="text-center py-8 text-slate-300">
                      <p className="text-[10px]">Arraste leads aqui</p>
                    </div>
                  )}
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  User, 
  Phone, 
  Mail, 
  TrendingUp, 
  Sparkles, 
  ArrowRight,
  Loader2,
  Target,
  AlertCircle,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const LEAD_STAGES = [
  { id: 'novo', label: 'Novo', color: 'bg-blue-100 text-blue-800', icon: '🆕' },
  { id: 'em_contato', label: 'Em Contato', color: 'bg-yellow-100 text-yellow-800', icon: '📞' },
  { id: 'qualificado', label: 'Qualificado', color: 'bg-green-100 text-green-800', icon: '✅' },
  { id: 'negociacao', label: 'Negociação', color: 'bg-purple-100 text-purple-800', icon: '💼' },
  { id: 'convertido', label: 'Convertido', color: 'bg-emerald-100 text-emerald-800', icon: '🎉' },
  { id: 'perdido', label: 'Perdido', color: 'bg-red-100 text-red-800', icon: '❌' }
];

function LeadCard({ lead, index }) {
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const analyzeWithAI = async () => {
    setAiAnalyzing(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `ANÁLISE RÁPIDA DE LEAD - PRÓXIMO PASSO IDEAL

LEAD: ${lead.name}
EMPRESA: ${lead.company || 'N/A'}
TELEFONE: ${lead.phone || 'N/A'}
EMAIL: ${lead.email || 'N/A'}
ORIGEM: ${lead.source || 'N/A'}
ESTÁGIO ATUAL: ${lead.stage || 'novo'}
SCORE ATUAL: ${lead.ai_score || 0}/100
INTERESSE: ${lead.interest_level || 'N/A'}
NOTAS: ${lead.notes || 'Sem notas'}

Baseado nestes dados, qual é o PRÓXIMO MELHOR PASSO?

Seja DIRETO e PRÁTICO (máximo 2 frases).`,
        add_context_from_internet: false,
        response_json_schema: {
          type: "object",
          properties: {
            next_action: { type: "string" },
            urgency: { type: "string" },
            reason: { type: "string" }
          }
        }
      });

      setAiSuggestion(result);
      toast.success('IA analisou o lead!');
    } catch (error) {
      toast.error('Erro ao analisar: ' + error.message);
    } finally {
      setAiAnalyzing(false);
    }
  };

  return (
    <Draggable draggableId={lead.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`mb-2 ${snapshot.isDragging ? 'opacity-50' : ''}`}
        >
          <Card className="p-3 bg-white hover:shadow-md transition-shadow cursor-move">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <Link to={createPageUrl(`LeadProfile?id=${lead.id}`)}>
                  <p className="font-bold text-sm text-slate-900 hover:text-indigo-600">
                    {lead.name}
                  </p>
                </Link>
                {lead.company && (
                  <p className="text-xs text-slate-600">{lead.company}</p>
                )}
              </div>
              {lead.ai_score && (
                <div className="flex items-center gap-1">
                  <TrendingUp className={`w-3 h-3 ${getScoreColor(lead.ai_score)}`} />
                  <span className={`text-xs font-bold ${getScoreColor(lead.ai_score)}`}>
                    {lead.ai_score}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-1 mb-2">
              {lead.phone && (
                <div className="flex items-center gap-1 text-xs text-slate-600">
                  <Phone className="w-3 h-3" />
                  <span>{lead.phone}</span>
                </div>
              )}
              {lead.email && (
                <div className="flex items-center gap-1 text-xs text-slate-600">
                  <Mail className="w-3 h-3" />
                  <span className="truncate">{lead.email}</span>
                </div>
              )}
            </div>

            {lead.interest_level && (
              <Badge variant="outline" className="text-xs mb-2">
                {lead.interest_level}
              </Badge>
            )}

            {aiSuggestion && (
              <div className="p-2 bg-indigo-50 rounded-lg border border-indigo-200 mb-2">
                <p className="text-xs font-bold text-indigo-900 mb-1">
                  {aiSuggestion.urgency === 'high' ? '🔥' : '💡'} {aiSuggestion.next_action}
                </p>
                <p className="text-xs text-indigo-700">{aiSuggestion.reason}</p>
              </div>
            )}

            <Button
              size="sm"
              variant="ghost"
              onClick={analyzeWithAI}
              disabled={aiAnalyzing}
              className="w-full h-7 text-xs"
            >
              {aiAnalyzing ? (
                <>
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  Analisando...
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3 mr-1" />
                  IA: Próximo Passo
                </>
              )}
            </Button>
          </Card>
        </div>
      )}
    </Draggable>
  );
}

export default function LeadKanbanBoard() {
  const queryClient = useQueryClient();
  const [scoringAll, setScoringAll] = useState(false);

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['leads'],
    queryFn: () => base44.entities.Lead.list('-updated_date', 200),
    initialData: []
  });

  const updateLeadMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Lead.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['leads']);
    }
  });

  const onDragEnd = async (result) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    
    if (source.droppableId === destination.droppableId) return;

    const lead = leads.find(l => l.id === draggableId);
    if (!lead) return;

    const newStage = destination.droppableId;
    
    toast.loading('Atualizando lead...', { id: 'drag-update' });
    
    try {
      await updateLeadMutation.mutateAsync({
        id: draggableId,
        data: { 
          stage: newStage,
          last_stage_change: new Date().toISOString()
        }
      });
      
      toast.success(`Lead movido para ${LEAD_STAGES.find(s => s.id === newStage)?.label}`, {
        id: 'drag-update'
      });
    } catch (error) {
      toast.error('Erro ao mover lead', { id: 'drag-update' });
    }
  };

  const scoreAllLeads = async () => {
    setScoringAll(true);
    
    const leadsToScore = leads.filter(l => !l.ai_score || l.ai_score === 0);
    
    if (leadsToScore.length === 0) {
      toast.info('Todos os leads já foram pontuados!');
      setScoringAll(false);
      return;
    }

    toast.info(`Pontuando ${leadsToScore.length} leads com IA...`);

    for (const lead of leadsToScore) {
      try {
        const result = await base44.integrations.Core.InvokeLLM({
          prompt: `SCORING AUTOMÁTICO DE LEAD

LEAD: ${lead.name}
EMPRESA: ${lead.company || 'N/A'}
TELEFONE: ${lead.phone ? 'Sim' : 'Não'}
EMAIL: ${lead.email ? 'Sim' : 'Não'}
ORIGEM: ${lead.source || 'N/A'}
INTERESSE: ${lead.interest_level || 'N/A'}
ESTÁGIO: ${lead.stage || 'novo'}

Calcule um SCORE de 0 a 100 baseado em:
- Qualidade dos dados (30%)
- Nível de interesse (30%)
- Origem do lead (20%)
- Estágio atual (20%)

Retorne APENAS o número do score.`,
          add_context_from_internet: false,
          response_json_schema: {
            type: "object",
            properties: {
              score: { type: "number" },
              factors: { type: "string" }
            }
          }
        });

        await updateLeadMutation.mutateAsync({
          id: lead.id,
          data: { 
            ai_score: result.score,
            ai_score_factors: result.factors,
            ai_scored_at: new Date().toISOString()
          }
        });

        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.error('Erro ao pontuar lead:', error);
      }
    }

    setScoringAll(false);
    toast.success('Todos os leads foram pontuados!');
  };

  const groupedLeads = LEAD_STAGES.reduce((acc, stage) => {
    acc[stage.id] = leads.filter(l => (l.stage || 'novo') === stage.id);
    return acc;
  }, {});

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Pipeline de Leads</h2>
          <p className="text-sm text-slate-600">{leads.length} leads no total</p>
        </div>
        <Button
          onClick={scoreAllLeads}
          disabled={scoringAll}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          {scoringAll ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Pontuando...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Pontuar Todos com IA
            </>
          )}
        </Button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {LEAD_STAGES.map((stage) => (
            <div key={stage.id} className="flex-shrink-0 w-72">
              <div className="mb-3">
                <Badge className={`${stage.color} mb-2`}>
                  {stage.icon} {stage.label}
                </Badge>
                <p className="text-xs text-slate-600">
                  {groupedLeads[stage.id]?.length || 0} leads
                </p>
              </div>

              <Droppable droppableId={stage.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`min-h-[400px] p-3 rounded-lg border-2 border-dashed transition-colors ${
                      snapshot.isDraggingOver
                        ? 'border-indigo-400 bg-indigo-50'
                        : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    {groupedLeads[stage.id]?.map((lead, index) => (
                      <LeadCard key={lead.id} lead={lead} index={index} />
                    ))}
                    {provided.placeholder}
                    
                    {groupedLeads[stage.id]?.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-32 text-slate-400">
                        <Target className="w-8 h-8 mb-2" />
                        <p className="text-xs">Arraste leads aqui</p>
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}
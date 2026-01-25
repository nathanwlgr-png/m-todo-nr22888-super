import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Zap, 
  Mail, 
  Phone, 
  MessageSquare,
  Clock,
  CheckCircle2,
  Loader2,
  Target,
  TrendingUp,
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';

export default function AIFollowUpSequenceGenerator() {
  const [selectedClient, setSelectedClient] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [sequence, setSequence] = useState(null);
  const [creatingTasks, setCreatingTasks] = useState(false);

  const queryClient = useQueryClient();

  const { data: clients = [] } = useQuery({
    queryKey: ['clients-followup'],
    queryFn: () => base44.entities.Client.list('-updated_date', 100)
  });

  const { data: interactions = [] } = useQuery({
    queryKey: ['interactions-followup'],
    queryFn: () => base44.entities.Interaction.list('-created_date', 100)
  });

  const createTaskMutation = useMutation({
    mutationFn: (taskData) => base44.entities.Task.create(taskData),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
    }
  });

  const generateSequence = async () => {
    if (!selectedClient) {
      toast.error('Selecione um cliente');
      return;
    }

    setGenerating(true);
    try {
      const clientInteractions = interactions.filter(i => i.client_id === selectedClient.id);
      const lastInteraction = clientInteractions[0];
      const daysSinceLastContact = lastInteraction 
        ? Math.floor((Date.now() - new Date(lastInteraction.created_date).getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `SEQUÊNCIA DE FOLLOW-UP INTELIGENTE - PRIMORI

═══════════════════════════════════════
📊 PERFIL DO LEAD/CLIENTE
═══════════════════════════════════════
Nome: ${selectedClient.first_name}
Clínica: ${selectedClient.clinic_name || 'N/A'}
Status: ${selectedClient.status || 'morno'}
Score: ${selectedClient.purchase_score || 50}%
Pipeline: ${selectedClient.pipeline_stage || 'lead'}
Segmento IA: ${selectedClient.ai_segment || 'N/A'}

NUMEROLOGIA:
- Número: ${selectedClient.numerology_number || 'N/A'}
- Perfil: ${selectedClient.behavioral_profile || 'N/A'}
- Estilo Decisão: ${selectedClient.decision_style || 'N/A'}

ENGAJAMENTO:
- Interações totais: ${clientInteractions.length}
- Dias sem contato: ${daysSinceLastContact}
- Engagement Score: ${selectedClient.engagement_score || 0}
- Última interação: ${lastInteraction?.type || 'Nenhuma'}

DORES & OBJEÇÕES:
- Dores: ${selectedClient.main_pains?.join(', ') || 'Não identificadas'}
- Objeções: ${selectedClient.real_objections?.join(', ') || 'Nenhuma'}

CONTEXTO:
- Equipamento interesse: ${selectedClient.equipment_interest || 'A definir'}
- Canal preferido: ${selectedClient.communication_preferences?.preferred_channel || 'Não definido'}
- Tom ideal: ${selectedClient.recommended_communication || 'Profissional'}

═══════════════════════════════════════
🎯 MISSÃO: SEQUÊNCIA PERFEITA
═══════════════════════════════════════

Crie uma sequência ULTRA-PERSONALIZADA de 5-7 follow-ups para nutrir este lead/cliente:

Para cada follow-up na sequência:

**FOLLOW-UP #1, #2, #3... até #7**

1. **TIMING**: 
   - Dias após ação anterior (ex: +2 dias, +5 dias)
   - Melhor horário do dia (manhã/tarde/noite)
   - Justificativa (por que esse timing?)

2. **CANAL**:
   - Email/WhatsApp/Telefone/Visita
   - Por que este canal neste momento?

3. **OBJETIVO**:
   - Qual o objetivo específico desta interação?

4. **CONTEÚDO COMPLETO**:
   - Se EMAIL: Assunto + Corpo completo (200-300 palavras)
   - Se WHATSAPP: Mensagem pronta (3-5 linhas + emojis)
   - Se TELEFONE: Script completo com abertura, perguntas, objeções, fechamento
   - Se VISITA: Objetivo + checklist do que levar

5. **GATILHOS APLICADOS**:
   - Quais técnicas Primori usar (SPIN/Numerologia/Cialdini)

6. **PRÓXIMA AÇÃO**:
   - Se responder: fazer X
   - Se não responder: fazer Y

**ESTRATÉGIA GERAL:**
- Adapte completamente ao perfil numerológico ${selectedClient.numerology_number}
- Use o tom ${selectedClient.recommended_communication}
- Considere o pipeline stage "${selectedClient.pipeline_stage || 'lead'}"
- Aborde as dores: ${selectedClient.main_pains?.join(', ') || 'genéricas'}

**CRITÉRIOS DE SUCESSO:**
- Como saber se a sequência está funcionando?
- Quando escalar ou mudar estratégia?`,
        response_json_schema: {
          type: "object",
          properties: {
            sequencia: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  numero: { type: "number" },
                  dias_apos: { type: "number" },
                  melhor_horario: { type: "string" },
                  justificativa_timing: { type: "string" },
                  canal: { type: "string" },
                  justificativa_canal: { type: "string" },
                  objetivo: { type: "string" },
                  conteudo: { type: "string" },
                  assunto_email: { type: "string" },
                  gatilhos_aplicados: { type: "array", items: { type: "string" } },
                  se_responder: { type: "string" },
                  se_nao_responder: { type: "string" }
                }
              }
            },
            estrategia_geral: { type: "string" },
            criterios_sucesso: { type: "string" },
            quando_escalar: { type: "string" },
            probabilidade_conversao: { type: "number" }
          }
        }
      });

      setSequence(result);
      toast.success('Sequência gerada com IA!');
    } catch (error) {
      toast.error('Erro ao gerar sequência');
      console.error(error);
    } finally {
      setGenerating(false);
    }
  };

  const createAllTasks = async () => {
    if (!sequence || !selectedClient) return;

    setCreatingTasks(true);
    try {
      const today = new Date();
      let previousDate = today;

      for (const step of sequence.sequencia) {
        const dueDate = new Date(previousDate);
        dueDate.setDate(dueDate.getDate() + step.dias_apos);

        await createTaskMutation.mutateAsync({
          client_id: selectedClient.id,
          client_name: selectedClient.first_name,
          title: `Follow-up #${step.numero} - ${step.canal}`,
          description: step.conteudo,
          type: step.canal === 'Email' ? 'email' : 
                step.canal === 'Telefone' ? 'ligacao' : 
                step.canal === 'WhatsApp' ? 'follow_up' : 'outro',
          priority: step.numero <= 2 ? 'alta' : 'media',
          due_date: dueDate.toISOString().split('T')[0],
          status: 'pendente',
          auto_created: true
        });

        previousDate = dueDate;
        await new Promise(r => setTimeout(r, 100));
      }

      toast.success(`${sequence.sequencia.length} tarefas criadas!`);
    } catch (error) {
      toast.error('Erro ao criar tarefas');
      console.error(error);
    } finally {
      setCreatingTasks(false);
    }
  };

  const getChannelIcon = (channel) => {
    switch(channel?.toLowerCase()) {
      case 'email': return Mail;
      case 'telefone': return Phone;
      case 'whatsapp': return MessageSquare;
      case 'visita': return Target;
      default: return MessageSquare;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-300">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-slate-800">Sequências Follow-Up IA</h3>
            <p className="text-xs text-indigo-700">Nurturing personalizado automatizado</p>
          </div>
        </div>

        <select
          value={selectedClient?.id || ''}
          onChange={(e) => setSelectedClient(clients.find(c => c.id === e.target.value))}
          className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm mb-2"
        >
          <option value="">Selecione um cliente...</option>
          {clients.map(client => (
            <option key={client.id} value={client.id}>
              {client.first_name} - {client.clinic_name || 'Sem clínica'} ({client.pipeline_stage || 'lead'})
            </option>
          ))}
        </select>

        <Button
          onClick={generateSequence}
          disabled={!selectedClient || generating}
          className="w-full bg-indigo-600 hover:bg-indigo-700"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Gerando Sequência...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 mr-2" />
              Gerar Sequência Personalizada
            </>
          )}
        </Button>
      </Card>

      {/* Client Info */}
      {selectedClient && (
        <Card className="p-3 bg-slate-50 border border-slate-200">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-600">Pipeline:</span>
              <span className="ml-1 font-semibold">{selectedClient.pipeline_stage || 'lead'}</span>
            </div>
            <div>
              <span className="text-slate-600">Score:</span>
              <span className="ml-1 font-semibold">{selectedClient.purchase_score || 50}%</span>
            </div>
            <div>
              <span className="text-slate-600">Status:</span>
              <Badge className="ml-1 text-xs">{selectedClient.status}</Badge>
            </div>
            <div>
              <span className="text-slate-600">Numerologia:</span>
              <span className="ml-1 font-semibold">{selectedClient.numerology_number || 'N/A'}</span>
            </div>
          </div>
        </Card>
      )}

      {/* Sequence Display */}
      {sequence && (
        <>
          {/* Overview */}
          <Card className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-green-900">📊 Visão Geral da Sequência</h4>
              <Badge className="bg-green-600 text-white">
                {sequence.probabilidade_conversao}% conversão
              </Badge>
            </div>
            <p className="text-xs text-slate-700 mb-2">
              <span className="font-semibold">Estratégia:</span> {sequence.estrategia_geral}
            </p>
            <p className="text-xs text-slate-700 mb-2">
              <span className="font-semibold">Critérios Sucesso:</span> {sequence.criterios_sucesso}
            </p>
            <p className="text-xs text-slate-700">
              <span className="font-semibold">Quando Escalar:</span> {sequence.quando_escalar}
            </p>
          </Card>

          {/* Create Tasks Button */}
          <Button
            onClick={createAllTasks}
            disabled={creatingTasks}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {creatingTasks ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Criando {sequence.sequencia.length} tarefas...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Criar Todas as Tarefas Automaticamente
              </>
            )}
          </Button>

          {/* Sequence Steps */}
          <div className="space-y-3">
            {sequence.sequencia?.map((step, i) => {
              const ChannelIcon = getChannelIcon(step.canal);
              return (
                <Card key={i} className="p-4 border-2 border-blue-300 bg-blue-50">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                        {step.numero}
                      </div>
                      <div>
                        <p className="font-bold text-blue-900">Follow-up #{step.numero}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className="bg-blue-100 text-blue-700 text-xs">
                            <ChannelIcon className="w-3 h-3 mr-1" />
                            {step.canal}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            <Clock className="w-3 h-3 mr-1" />
                            +{step.dias_apos} dias
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Timing */}
                  <div className="mb-3 p-2 bg-white rounded border border-blue-200">
                    <p className="text-xs font-semibold text-blue-800 mb-1">
                      ⏰ Timing: {step.melhor_horario}
                    </p>
                    <p className="text-xs text-slate-600">{step.justificativa_timing}</p>
                  </div>

                  {/* Channel Justification */}
                  <div className="mb-3 p-2 bg-white rounded border border-blue-200">
                    <p className="text-xs font-semibold text-blue-800 mb-1">
                      📱 Por que {step.canal}?
                    </p>
                    <p className="text-xs text-slate-600">{step.justificativa_canal}</p>
                  </div>

                  {/* Objective */}
                  <div className="mb-3 p-2 bg-purple-100 rounded border border-purple-300">
                    <p className="text-xs font-semibold text-purple-800 mb-1">🎯 Objetivo:</p>
                    <p className="text-xs text-slate-700">{step.objetivo}</p>
                  </div>

                  {/* Content */}
                  <div className="mb-3 p-3 bg-white rounded border border-green-300">
                    <p className="text-xs font-semibold text-green-800 mb-2">
                      ✉️ Conteúdo Pronto:
                    </p>
                    {step.assunto_email && (
                      <div className="mb-2">
                        <p className="text-xs font-semibold text-slate-700">Assunto:</p>
                        <p className="text-xs text-slate-800">{step.assunto_email}</p>
                      </div>
                    )}
                    <p className="text-xs text-slate-700 whitespace-pre-wrap">{step.conteudo}</p>
                  </div>

                  {/* Gatilhos */}
                  <div className="mb-3 p-2 bg-orange-100 rounded border border-orange-300">
                    <p className="text-xs font-semibold text-orange-800 mb-1">⚡ Gatilhos:</p>
                    <div className="flex flex-wrap gap-1">
                      {step.gatilhos_aplicados?.map((g, j) => (
                        <Badge key={j} className="bg-orange-200 text-orange-800 text-xs">
                          {g}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Next Actions */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 bg-green-100 rounded border border-green-300">
                      <p className="text-xs font-semibold text-green-700 mb-1">✅ Se responder:</p>
                      <p className="text-xs text-slate-700">{step.se_responder}</p>
                    </div>
                    <div className="p-2 bg-red-100 rounded border border-red-300">
                      <p className="text-xs font-semibold text-red-700 mb-1">❌ Se não responder:</p>
                      <p className="text-xs text-slate-700">{step.se_nao_responder}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Zap,
  Loader2,
  CheckCircle2,
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  Target,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';

export default function AINextBestActionsCard({ client, interactions = [], sales = [], visits = [] }) {
  const [loading, setLoading] = useState(false);
  const [actions, setActions] = useState(null);
  const [executingAction, setExecutingAction] = useState(null);

  const queryClient = useQueryClient();

  const createTaskMutation = useMutation({
    mutationFn: (taskData) => base44.entities.Task.create(taskData),
    onSuccess: () => {
      queryClient.invalidateQueries(['client-tasks']);
      toast.success('Tarefa criada!');
    }
  });

  const generateActions = async () => {
    setLoading(true);
    try {
      const daysSinceLastContact = client.last_contact_date 
        ? Math.floor((Date.now() - new Date(client.last_contact_date).getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `NEXT BEST ACTIONS - PRIMORI

═══════════════════════════════════════
📊 CONTEXTO DO CLIENTE
═══════════════════════════════════════
Nome: ${client.first_name}
Status: ${client.status}
Pipeline: ${client.pipeline_stage || 'lead'}
Score: ${client.purchase_score || 50}%
Segmento: ${client.ai_segment || 'N/A'}

ENGAJAMENTO:
- Interações: ${interactions.length}
- Dias sem contato: ${daysSinceLastContact}
- Última interação: ${interactions[0]?.type || 'Nenhuma'}
- Visitas: ${visits.length}
- Vendas: ${sales.length}

PERFIL:
- Numerologia: ${client.numerology_number}
- Estilo decisão: ${client.decision_style}
- Canal preferido: ${client.communication_preferences?.preferred_channel || 'N/A'}
- Equipamento interesse: ${client.equipment_interest || 'N/A'}

DORES & OBJEÇÕES:
- Dores: ${client.main_pains?.join(', ') || 'Não identificadas'}
- Objeções: ${client.real_objections?.join(', ') || 'Nenhuma'}

═══════════════════════════════════════
🎯 MISSÃO: TOP 5 NEXT BEST ACTIONS
═══════════════════════════════════════

Para CADA ação (total 5 ações):

1. **TÍTULO**: Nome claro da ação
2. **TIPO**: whatsapp/email/telefone/visita/tarefa
3. **PRIORIDADE**: Alta/Média/Baixa
4. **URGÊNCIA**: Imediato/Esta semana/Este mês
5. **IMPACTO**: Score previsto (0-100)
6. **RACIONAL**: Por que fazer isso AGORA?
7. **CONTEÚDO**: Script/mensagem pronto para usar
8. **RESULTADO ESPERADO**: O que vai acontecer
9. **TIMING**: Quando fazer (dia da semana, horário)

Critérios:
- Ações devem ser ESPECÍFICAS e PRÁTICAS
- Considere numerologia e perfil
- Adapte ao pipeline stage
- Maximize probabilidade de conversão
- Sequência lógica (ação 1 -> ação 2 -> ação 3...)`,
        response_json_schema: {
          type: "object",
          properties: {
            acoes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  titulo: { type: "string" },
                  tipo: { type: "string" },
                  prioridade: { type: "string" },
                  urgencia: { type: "string" },
                  impacto_score: { type: "number" },
                  racional: { type: "string" },
                  conteudo: { type: "string" },
                  resultado_esperado: { type: "string" },
                  timing: { type: "string" }
                }
              }
            },
            estrategia_geral: { type: "string" }
          }
        }
      });

      setActions(result);
      toast.success('Ações geradas!');
    } catch (error) {
      toast.error('Erro ao gerar ações');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const executeAction = async (action, index) => {
    setExecutingAction(index);
    try {
      // Criar tarefa automaticamente
      const dueDate = new Date();
      if (action.urgencia === 'Imediato') {
        dueDate.setDate(dueDate.getDate() + 1);
      } else if (action.urgencia === 'Esta semana') {
        dueDate.setDate(dueDate.getDate() + 3);
      } else {
        dueDate.setDate(dueDate.getDate() + 7);
      }

      await createTaskMutation.mutateAsync({
        client_id: client.id,
        client_name: client.first_name,
        title: action.titulo,
        description: action.conteudo,
        type: action.tipo === 'whatsapp' || action.tipo === 'email' ? 'follow_up' : 
              action.tipo === 'telefone' ? 'ligacao' : 
              action.tipo === 'visita' ? 'visita' : 'outro',
        priority: action.prioridade === 'Alta' ? 'alta' : 
                  action.prioridade === 'Média' ? 'media' : 'baixa',
        due_date: dueDate.toISOString().split('T')[0],
        status: 'pendente',
        auto_created: true
      });

      // Se for WhatsApp e tiver telefone, abrir
      if (action.tipo === 'whatsapp' && client.phone) {
        window.open(`https://wa.me/${client.phone}?text=${encodeURIComponent(action.conteudo)}`, '_blank');
      }

      toast.success('Ação executada!');
    } catch (error) {
      toast.error('Erro ao executar ação');
      console.error(error);
    } finally {
      setExecutingAction(null);
    }
  };

  const getActionIcon = (tipo) => {
    switch(tipo?.toLowerCase()) {
      case 'whatsapp': return MessageSquare;
      case 'email': return Mail;
      case 'telefone': return Phone;
      case 'visita': return Calendar;
      default: return Target;
    }
  };

  return (
    <Card className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-300">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-600 to-amber-600 flex items-center justify-center">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-slate-800">Next Best Actions IA</h3>
          <p className="text-xs text-orange-700">Ações otimizadas para conversão</p>
        </div>
      </div>

      {!actions && (
        <Button
          onClick={generateActions}
          disabled={loading}
          className="w-full bg-orange-600 hover:bg-orange-700"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Analisando próximas ações...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 mr-2" />
              Gerar Next Best Actions
            </>
          )}
        </Button>
      )}

      {actions && (
        <div className="space-y-3">
          {/* Estratégia Geral */}
          <Card className="p-3 bg-white border border-orange-200">
            <p className="text-xs font-semibold text-orange-800 mb-1">🎯 Estratégia:</p>
            <p className="text-xs text-slate-700">{actions.estrategia_geral}</p>
          </Card>

          {/* Ações */}
          <div className="space-y-2">
            {actions.acoes?.map((acao, i) => {
              const ActionIcon = getActionIcon(acao.tipo);
              return (
                <Card key={i} className={`p-3 border-2 ${
                  acao.prioridade === 'Alta' ? 'bg-red-50 border-red-300' :
                  acao.prioridade === 'Média' ? 'bg-yellow-50 border-yellow-300' :
                  'bg-blue-50 border-blue-300'
                }`}>
                  <div className="flex items-start gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-orange-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-800 text-sm">{acao.titulo}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Badge className={
                          acao.prioridade === 'Alta' ? 'bg-red-500' :
                          acao.prioridade === 'Média' ? 'bg-yellow-500' : 'bg-blue-500'
                        }>
                          {acao.prioridade}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          <ActionIcon className="w-3 h-3 mr-1" />
                          {acao.tipo}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {acao.urgencia}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="p-2 bg-white rounded border border-slate-200 mb-2">
                    <p className="text-xs font-semibold text-slate-700 mb-1">Por quê agora?</p>
                    <p className="text-xs text-slate-600">{acao.racional}</p>
                  </div>

                  <div className="p-2 bg-white rounded border border-slate-200 mb-2">
                    <p className="text-xs font-semibold text-slate-700 mb-1">Conteúdo:</p>
                    <p className="text-xs text-slate-600 whitespace-pre-wrap">{acao.conteudo}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div className="p-2 bg-white rounded border border-green-200">
                      <p className="text-xs text-green-700">Impacto: +{acao.impacto_score} pontos</p>
                    </div>
                    <div className="p-2 bg-white rounded border border-blue-200">
                      <p className="text-xs text-blue-700">Timing: {acao.timing}</p>
                    </div>
                  </div>

                  <div className="p-2 bg-green-100 rounded border border-green-200 mb-2">
                    <p className="text-xs font-semibold text-green-800 mb-1">✅ Resultado Esperado:</p>
                    <p className="text-xs text-green-700">{acao.resultado_esperado}</p>
                  </div>

                  <Button
                    onClick={() => executeAction(acao, i)}
                    disabled={executingAction === i}
                    size="sm"
                    className="w-full bg-orange-600 hover:bg-orange-700"
                  >
                    {executingAction === i ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin mr-1" />
                        Executando...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Executar Ação
                      </>
                    )}
                  </Button>
                </Card>
              );
            })}
          </div>

          <Button
            onClick={generateActions}
            variant="outline"
            size="sm"
            className="w-full"
          >
            Gerar Novas Ações
          </Button>
        </div>
      )}
    </Card>
  );
}
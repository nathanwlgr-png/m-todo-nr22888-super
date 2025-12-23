import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, Send, Loader2, Eye, MousePointer, MessageCircle, Calendar, FileText, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

export default function CampaignSequenceAutomation({ campaign, clients }) {
  const queryClient = useQueryClient();
  const [executing, setExecuting] = useState(false);
  const [monitoring, setMonitoring] = useState(null);

  const createTaskMutation = useMutation({
    mutationFn: (data) => base44.entities.Task.create(data),
  });

  const executeSequence = async () => {
    setExecuting(true);
    try {
      const targetClients = clients.filter(c => 
        campaign.target_clients?.includes(c.id) && 
        !campaign.sent_to?.some(s => s.client_id === c.id)
      );

      for (const client of targetClients) {
        // Análise IA para personalizar mensagem
        const personalization = await base44.integrations.Core.InvokeLLM({
          prompt: `Personalize a mensagem da campanha para este cliente:

CLIENTE: ${client.first_name}
- Perfil: ${client.behavioral_profile || 'N/A'}
- Tom: ${client.client_tone || 'N/A'}
- Status: ${client.status}
- Score: ${client.purchase_score}
- Necessidades: ${client.lab_needs?.join(', ') || 'N/A'}

CAMPANHA: ${campaign.name}
EQUIPAMENTO: ${campaign.equipment_focus}
MENSAGEM BASE: ${campaign.automated_content?.whatsapp_message || 'N/A'}

Retorne:
1. whatsapp_message: Mensagem personalizada considerando perfil
2. email_subject: Assunto de email impactante
3. email_body: Email completo personalizado
4. best_send_time: Melhor horário para enviar (manhã/tarde/noite)
5. engagement_prediction: Probabilidade de engajamento (0-100)
6. next_action_if_opens: O que fazer se abrir
7. next_action_if_clicks: O que fazer se clicar
8. next_action_if_replies: O que fazer se responder
9. fallback_sequence: Sequência de follow-up se não responder (3 passos)`,
          response_json_schema: {
            type: "object",
            properties: {
              whatsapp_message: { type: "string" },
              email_subject: { type: "string" },
              email_body: { type: "string" },
              best_send_time: { type: "string" },
              engagement_prediction: { type: "number" },
              next_action_if_opens: { type: "string" },
              next_action_if_clicks: { type: "string" },
              next_action_if_replies: { type: "string" },
              fallback_sequence: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    day: { type: "number" },
                    action: { type: "string" },
                    message: { type: "string" }
                  }
                }
              }
            }
          }
        });

        // Registrar envio na campanha
        const updatedSentTo = [
          ...(campaign.sent_to || []),
          {
            client_id: client.id,
            sent_date: new Date().toISOString(),
            channel: 'whatsapp',
            status: 'enviado',
            personalization: personalization,
            engagement_score: 0,
            opened: false,
            clicked: false,
            replied: false
          }
        ];

        await base44.entities.Campaign.update(campaign.id, {
          sent_to: updatedSentTo
        });

        // Criar tarefas de follow-up automático
        for (const step of personalization.fallback_sequence || []) {
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + step.day);

          await createTaskMutation.mutateAsync({
            client_id: client.id,
            client_name: client.first_name,
            title: `[Auto] ${step.action}`,
            description: `Campanha: ${campaign.name}\n\n${step.message}`,
            type: 'follow_up',
            priority: 'media',
            due_date: dueDate.toISOString().split('T')[0],
            auto_created: true
          });
        }
      }

      toast.success(`Sequência iniciada para ${targetClients.length} clientes!`);
      queryClient.invalidateQueries(['campaigns']);
      queryClient.invalidateQueries(['tasks']);

    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao executar sequência');
    } finally {
      setExecuting(false);
    }
  };

  const monitorInteractions = async () => {
    setMonitoring({ analyzing: true });
    try {
      const sentClients = campaign.sent_to || [];
      
      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `Analise as interações da campanha e sugira próximos passos:

CAMPANHA: ${campaign.name}
ENVIADOS: ${sentClients.length}

INTERAÇÕES:
${sentClients.map(s => `- Cliente: ${s.client_id}, Canal: ${s.channel}, Status: ${s.status}, Abriu: ${s.opened || false}, Clicou: ${s.clicked || false}, Respondeu: ${s.replied || false}`).join('\n')}

Retorne análise:
1. overall_engagement_rate: Taxa de engajamento geral (%)
2. open_rate: Taxa de abertura (%)
3. click_rate: Taxa de cliques (%)
4. reply_rate: Taxa de resposta (%)
5. hot_leads: Clientes que estão MUITO engajados (IDs)
6. cold_leads: Clientes que NÃO engajaram (IDs)
7. recommended_adjustments: Ajustes recomendados na campanha
8. next_steps_per_client: Próximos passos por cliente engajado`,
        response_json_schema: {
          type: "object",
          properties: {
            overall_engagement_rate: { type: "number" },
            open_rate: { type: "number" },
            click_rate: { type: "number" },
            reply_rate: { type: "number" },
            hot_leads: { type: "array", items: { type: "string" } },
            cold_leads: { type: "array", items: { type: "string" } },
            recommended_adjustments: { type: "array", items: { type: "string" } },
            next_steps_per_client: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  client_id: { type: "string" },
                  engagement_level: { type: "string" },
                  recommended_action: { type: "string" },
                  urgency: { type: "string" }
                }
              }
            }
          }
        }
      });

      setMonitoring({ analyzing: false, data: analysis });
      toast.success('Análise de interações concluída!');

    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao monitorar interações');
      setMonitoring(null);
    }
  };

  const applyDynamicAdjustments = async () => {
    if (!monitoring?.data) return;

    try {
      // Para leads quentes: criar tarefas urgentes
      for (const leadId of monitoring.data.hot_leads || []) {
        const client = clients.find(c => c.id === leadId);
        if (client) {
          await createTaskMutation.mutateAsync({
            client_id: client.id,
            client_name: client.first_name,
            title: '🔥 LEAD QUENTE - Contato IMEDIATO',
            description: `Cliente muito engajado na campanha "${campaign.name}".\n\nAção: Ligar/WhatsApp HOJE para fechar venda!`,
            type: 'follow_up',
            priority: 'alta',
            due_date: new Date().toISOString().split('T')[0],
            auto_created: true
          });
        }
      }

      // Para leads frios: sequência de reengajamento
      for (const leadId of monitoring.data.cold_leads || []) {
        const client = clients.find(c => c.id === leadId);
        if (client) {
          const reengagement = await base44.integrations.Core.InvokeLLM({
            prompt: `Cliente ${client.first_name} não engajou. Crie mensagem de REENGAJAMENTO criativa e diferente.`,
            response_json_schema: {
              type: "object",
              properties: {
                message: { type: "string" },
                angle: { type: "string" }
              }
            }
          });

          await createTaskMutation.mutateAsync({
            client_id: client.id,
            client_name: client.first_name,
            title: '❄️ Reengajar Lead Frio',
            description: `Abordagem: ${reengagement.angle}\n\nMensagem:\n${reengagement.message}`,
            type: 'follow_up',
            priority: 'media',
            due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            auto_created: true
          });
        }
      }

      toast.success('Ajustes dinâmicos aplicados!');
      queryClient.invalidateQueries(['tasks']);

    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao aplicar ajustes');
    }
  };

  return (
    <Card className="p-5 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white">
      <div className="flex items-center gap-3 mb-4">
        <Zap className="w-6 h-6 text-yellow-300" />
        <div>
          <h3 className="font-bold">Automação de Sequências</h3>
          <p className="text-xs text-purple-200">Monitoramento e ajuste em tempo real</p>
        </div>
      </div>

      <div className="space-y-3">
        {/* Executar Sequência */}
        <Button
          onClick={executeSequence}
          disabled={executing}
          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
        >
          {executing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Executando...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Iniciar Sequência Personalizada
            </>
          )}
        </Button>

        {/* Monitorar */}
        <Button
          onClick={monitorInteractions}
          disabled={monitoring?.analyzing}
          variant="outline"
          className="w-full border-white/30 hover:bg-white/10"
        >
          {monitoring?.analyzing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analisando...
            </>
          ) : (
            <>
              <Eye className="w-4 h-4 mr-2" />
              Monitorar Interações
            </>
          )}
        </Button>

        {/* Resultados do Monitoramento */}
        {monitoring?.data && (
          <div className="space-y-3 mt-4">
            {/* Métricas */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 bg-white/10 rounded-lg backdrop-blur">
                <div className="flex items-center gap-2 mb-1">
                  <Eye className="w-3 h-3" />
                  <span className="text-xs">Abertura</span>
                </div>
                <p className="text-xl font-bold">{monitoring.data.open_rate}%</p>
              </div>
              <div className="p-3 bg-white/10 rounded-lg backdrop-blur">
                <div className="flex items-center gap-2 mb-1">
                  <MousePointer className="w-3 h-3" />
                  <span className="text-xs">Cliques</span>
                </div>
                <p className="text-xl font-bold">{monitoring.data.click_rate}%</p>
              </div>
              <div className="p-3 bg-white/10 rounded-lg backdrop-blur">
                <div className="flex items-center gap-2 mb-1">
                  <MessageCircle className="w-3 h-3" />
                  <span className="text-xs">Respostas</span>
                </div>
                <p className="text-xl font-bold">{monitoring.data.reply_rate}%</p>
              </div>
              <div className="p-3 bg-white/10 rounded-lg backdrop-blur">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-3 h-3" />
                  <span className="text-xs">Engajamento</span>
                </div>
                <p className="text-xl font-bold">{monitoring.data.overall_engagement_rate}%</p>
              </div>
            </div>

            {/* Leads Quentes */}
            {monitoring.data.hot_leads?.length > 0 && (
              <div className="p-3 bg-red-500/20 rounded-lg border border-red-400/30">
                <p className="text-sm font-semibold mb-2">🔥 {monitoring.data.hot_leads.length} Leads QUENTES</p>
                <p className="text-xs">Muito engajados - contato URGENTE!</p>
              </div>
            )}

            {/* Ajustes Recomendados */}
            {monitoring.data.recommended_adjustments?.length > 0 && (
              <div className="p-3 bg-yellow-500/20 rounded-lg border border-yellow-400/30">
                <p className="text-sm font-semibold mb-2">💡 Ajustes Recomendados</p>
                {monitoring.data.recommended_adjustments.slice(0, 3).map((adj, i) => (
                  <p key={i} className="text-xs mb-1">• {adj}</p>
                ))}
              </div>
            )}

            {/* Aplicar Ajustes */}
            <Button
              onClick={applyDynamicAdjustments}
              className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
            >
              <Zap className="w-4 h-4 mr-2" />
              Aplicar Ajustes Dinâmicos
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
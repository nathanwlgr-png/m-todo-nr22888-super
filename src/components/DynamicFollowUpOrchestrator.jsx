import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, MessageSquare, CheckCircle2 } from 'lucide-react';
import { executeWithRateLimit } from '@/components/rateLimitManager';
import { toast } from 'sonner';

export default function DynamicFollowUpOrchestrator({ client, interactions = [], sales = [] }) {
  const [loading, setLoading] = useState(false);
  const [followups, setFollowups] = useState(null);

  const generateFollowups = async () => {
    setLoading(true);
    try {
      const prompt = `Crie uma ESTRATÉGIA DINÂMICA DE FOLLOW-UP para este cliente:

SITUAÇÃO ATUAL:
- Nome: ${client.first_name}
- Status: ${client.status}
- Estágio: ${client.pipeline_stage || 'Não definido'}
- Score: ${client.purchase_score}%

PROGRESSO DA VENDA:
- Visitado: ${client.total_visits_count || 0}x
- Vendido: ${client.equipment_sold ? 'SIM' : 'NÃO'}
- Interessado em: ${client.equipment_interest}

OBJEÇÕES LEVANTADAS:
${client.real_objections?.map(o => `- ${o}`).join('\n') || '- Nenhuma registrada'}

COMUNICAÇÃO:
- Última interação: ${interactions[0]?.created_date ? 'Recente' : 'Atrasada'}
- Preferência: ${client.communication_preferences?.preferred_channel || 'Não informada'}
- Melhor horário: ${client.communication_preferences?.preferred_time || 'Qualquer'}

TAREFA:
Crie um plano de follow-up com 5 passos progressivos:
1. Próximo passo IMEDIATO (hoje/amanhã)
2. Follow-up em 2-3 dias (superar objeção 1)
3. Follow-up em 1 semana (oferecer valor)
4. Follow-up em 2 semanas (criar urgência)
5. Última chance/encaminhamento (decisão final)

Para CADA passo forneça:
- Canal recomendado (email/whatsapp/ligação/visita)
- Mensagem-chave (curta e impactante)
- Gatilho psicológico (urgência, prova social, escassez)
- Tratamento de objeção esperada
- Tempo ideal de envio`;

      const result = await executeWithRateLimit(async () => {
        return await base44.integrations.Core.InvokeLLM({
          prompt,
          response_json_schema: {
            type: "object",
            properties: {
              followups: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    step: { type: "number" },
                    timing: { type: "string" },
                    channel: { type: "string" },
                    subject: { type: "string" },
                    message: { type: "string" },
                    psychological_trigger: { type: "string" },
                    objection_handling: { type: "string" },
                    cta: { type: "string" },
                    best_time: { type: "string" }
                  }
                }
              },
              overall_strategy: { type: "string" },
              success_indicators: { type: "array", items: { type: "string" } }
            }
          }
        });
      }, 'high');

      setFollowups(result);
      toast.success('Plano de follow-up gerado!');
    } catch (error) {
      toast.error('Erro ao gerar follow-ups');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-slate-800">🎯 Orquestrador de Follow-Ups</h3>
          <p className="text-xs text-slate-600">Roteiros dinâmicos com base no progresso da venda</p>
        </div>
      </div>

      {!followups ? (
        <Button
          onClick={generateFollowups}
          disabled={loading}
          className="w-full bg-purple-600 hover:bg-purple-700"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Gerando...
            </>
          ) : (
            'Gerar Plano de Follow-Up'
          )}
        </Button>
      ) : (
        <div className="space-y-3">
          {followups.overall_strategy && (
            <div className="bg-white rounded-lg p-3 border border-purple-200">
              <p className="text-xs font-semibold text-purple-700 mb-1">Estratégia Geral</p>
              <p className="text-sm text-slate-700">{followups.overall_strategy}</p>
            </div>
          )}

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {followups.followups?.map((fu, idx) => (
              <Card key={idx} className="p-3 bg-white border-l-4 border-l-purple-500">
                <div className="flex items-start justify-between mb-2">
                  <Badge className="bg-purple-600 text-white">Passo {fu.step}</Badge>
                  <Badge variant="outline">{fu.channel}</Badge>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <p className="font-semibold text-slate-800">⏰ {fu.timing}</p>
                  </div>

                  <div className="bg-slate-50 p-2 rounded">
                    <p className="font-semibold text-slate-700">Assunto: {fu.subject}</p>
                  </div>

                  <div className="bg-slate-50 p-2 rounded">
                    <p className="text-slate-600 whitespace-pre-wrap">{fu.message}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-green-50 p-2 rounded border border-green-200">
                      <p className="font-semibold text-green-700">🎯 Gatilho</p>
                      <p className="text-slate-600">{fu.psychological_trigger}</p>
                    </div>
                    <div className="bg-yellow-50 p-2 rounded border border-yellow-200">
                      <p className="font-semibold text-yellow-700">⚠️ Objeção</p>
                      <p className="text-slate-600">{fu.objection_handling}</p>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-2 rounded border border-blue-200">
                    <p className="font-semibold text-blue-700">CTA: {fu.cta}</p>
                    <p className="text-slate-600">Horário: {fu.best_time}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {followups.success_indicators && (
            <div className="bg-green-50 rounded-lg p-3 border border-green-200">
              <p className="text-xs font-semibold text-green-700 mb-2">✓ Indicadores de Sucesso</p>
              <div className="space-y-1">
                {followups.success_indicators.map((indicator, i) => (
                  <p key={i} className="text-xs text-slate-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-green-600" />
                    {indicator}
                  </p>
                ))}
              </div>
            </div>
          )}

          <Button
            size="sm"
            onClick={() => setFollowups(null)}
            variant="outline"
          >
            Novo Plano
          </Button>
        </div>
      )}
    </Card>
  );
}
import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { base44 } from '@/api/base44Client';
import { Loader2, Send, Copy, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AutoFollowUpGenerator({ client, lastInteraction }) {
  const [loading, setLoading] = useState(false);
  const [followUp, setFollowUp] = useState(null);

  const generateFollowUp = async () => {
    setLoading(true);
    try {
      const daysSinceLastContact = lastInteraction 
        ? Math.floor((new Date() - new Date(lastInteraction.created_date)) / (1000 * 60 * 60 * 24))
        : 999;

      const prompt = `Você é um especialista em follow-up de vendas. Gere uma mensagem de follow-up PERSONALIZADA e EFICAZ.

**CLIENTE:** ${client.first_name}
**PERFIL:** ${client.behavioral_profile}
**STATUS:** ${client.status}
**ÚLTIMA INTERAÇÃO:** ${lastInteraction?.type || 'Nenhuma'} - há ${daysSinceLastContact} dias
**ÚLTIMA VISITA:** ${client.last_visit_date || 'Nenhuma'}
**EQUIPAMENTO INTERESSE:** ${client.equipment_interest || 'Não definido'}
**DORES:** ${client.main_pains?.join(', ') || 'Não identificadas'}
**MOTIVADORES:** ${client.purchase_motivators?.join(', ') || 'Não identificados'}

**CONTEXTO DA ÚLTIMA INTERAÇÃO:**
${lastInteraction?.notes || 'Sem notas'}

**TAREFA:**
Gere um follow-up que:
1. Seja personalizado ao perfil numerológico
2. Retome o contexto da última conversa
3. Agregue valor (não seja só cobrança)
4. Tenha call-to-action claro
5. Seja natural e humano

Também sugira:
- Melhor horário para enviar
- Canal recomendado (WhatsApp/Email)
- Probabilidade de resposta`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            subject: { type: "string" },
            message: { type: "string" },
            best_time: { type: "string" },
            recommended_channel: { type: "string" },
            response_probability: { type: "number" },
            alternative_message: { type: "string" }
          }
        }
      });

      setFollowUp(result);
      toast.success('Follow-up gerado!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao gerar follow-up');
    } finally {
      setLoading(false);
    }
  };

  const copyMessage = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado!');
  };

  return (
    <Card className="p-5 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-green-600 flex items-center justify-center">
          <Send className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-slate-800">Follow-up Automático IA</h3>
          <p className="text-xs text-slate-600">Mensagem personalizada e contextual</p>
        </div>
      </div>

      {!followUp && (
        <Button
          onClick={generateFollowUp}
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Gerando...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Gerar Follow-up Personalizado
            </>
          )}
        </Button>
      )}

      {followUp && (
        <div className="space-y-3">
          {/* Probabilidade */}
          <div className="p-3 bg-white rounded-lg border-2 border-green-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-green-700">PROBABILIDADE DE RESPOSTA</span>
              <span className="text-2xl font-bold text-green-600">{followUp.response_probability}%</span>
            </div>
            <div className="h-2 bg-green-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 transition-all"
                style={{ width: `${followUp.response_probability}%` }}
              />
            </div>
          </div>

          {/* Recomendações */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 bg-blue-50 rounded border border-blue-200">
              <p className="text-xs text-blue-600 mb-1">📱 Canal</p>
              <p className="text-sm font-semibold text-slate-800">{followUp.recommended_channel}</p>
            </div>
            <div className="p-2 bg-purple-50 rounded border border-purple-200">
              <p className="text-xs text-purple-600 mb-1">⏰ Horário</p>
              <p className="text-sm font-semibold text-slate-800">{followUp.best_time}</p>
            </div>
          </div>

          {/* Assunto */}
          {followUp.subject && (
            <div className="p-3 bg-white rounded-lg border border-slate-200">
              <p className="text-xs text-slate-600 mb-1">Assunto</p>
              <p className="font-semibold text-slate-800">{followUp.subject}</p>
            </div>
          )}

          {/* Mensagem Principal */}
          <div className="p-4 bg-white rounded-xl border-2 border-green-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-green-700">MENSAGEM PRINCIPAL</p>
              <Button size="sm" variant="ghost" onClick={() => copyMessage(followUp.message)}>
                <Copy className="w-3 h-3" />
              </Button>
            </div>
            <p className="text-sm text-slate-700 whitespace-pre-line">{followUp.message}</p>
          </div>

          {/* Alternativa */}
          {followUp.alternative_message && (
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-slate-600">MENSAGEM ALTERNATIVA</p>
                <Button size="sm" variant="ghost" onClick={() => copyMessage(followUp.alternative_message)}>
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
              <p className="text-sm text-slate-700 whitespace-pre-line">{followUp.alternative_message}</p>
            </div>
          )}

          {/* Ações */}
          <div className="grid grid-cols-2 gap-2">
            {client.phone && (
              <Button
                size="sm"
                onClick={() => window.open(`https://wa.me/${client.phone}?text=${encodeURIComponent(followUp.message)}`, '_blank')}
                className="bg-green-600 hover:bg-green-700"
              >
                <Send className="w-3 h-3 mr-1" />
                WhatsApp
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={generateFollowUp}
              disabled={loading}
            >
              Nova Mensagem
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Mail, Copy, Send } from 'lucide-react';
import { executeWithRateLimit } from '@/components/rateLimitManager';
import { toast } from 'sonner';

export default function AutoFollowUpEmailGenerator({ client, interactions = [], sales = [], market_trends = [] }) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState(null);

  const generateFollowUpEmail = async () => {
    setLoading(true);
    try {
      const lastInteraction = interactions?.[0];
      const lastSale = sales?.filter(s => s.status === 'fechada')?.[0];

      const prompt = `Gere um EMAIL DE ACOMPANHAMENTO personalizado e estratégico:

CLIENTE:
- Nome: ${client.first_name}
- Status: ${client.status}
- Numerologia: ${client.numerology_number} - ${client.behavioral_profile}
- Estágio: ${client.pipeline_stage}
- Equipamento interesse: ${client.equipment_interest}

HISTÓRICO RECENTE:
- Última interação: ${lastInteraction?.type || 'nenhuma'} - ${lastInteraction?.notes || ''}
- Data: ${lastInteraction?.created_date}
- Dias desde contato: ${lastInteraction ? Math.floor((Date.now() - new Date(lastInteraction.created_date)) / (1000 * 60 * 60 * 24)) : 'desconhecido'}
- Última venda: ${lastSale?.equipment_name || 'nenhuma'}

TENDÊNCIAS MERCADO:
- ${market_trends?.slice(0, 2).join('\n- ') || 'Mercado em crescimento'}

TAREFA:
Crie um email que:
1. Referencie ESPECÍFICAMENTE a última interação
2. Agregue valor com insight de mercado/tendência
3. Use tom baseado no perfil numerológico
4. Inclua CTA claro e não-pressionoso
5. Seja conciso (máx 4 parágrafos)

Retorne JSON com:
{
  "subject": "Assunto otimizado",
  "preview": "Preview do email",
  "body": "Corpo completo do email formatado",
  "cta": "Texto do botão de ação",
  "timing": "Melhor hora para enviar (e.g., terça-feira 09:00)",
  "why_this_approach": "Por que esse email é efetivo"
}`;

      const result = await executeWithRateLimit(async () => {
        return await base44.integrations.Core.InvokeLLM({
          prompt,
          response_json_schema: {
            type: "object",
            properties: {
              subject: { type: "string" },
              preview: { type: "string" },
              body: { type: "string" },
              cta: { type: "string" },
              timing: { type: "string" },
              why_this_approach: { type: "string" }
            }
          }
        });
      }, 'normal');

      setEmail(result);
      toast.success('Email gerado!');
    } catch (error) {
      toast.error('Erro ao gerar email');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
          <Mail className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-slate-800">📧 Email de Acompanhamento IA</h3>
          <p className="text-xs text-slate-600">Personalizado com base em interações recentes</p>
        </div>
      </div>

      {!email ? (
        <Button
          onClick={generateFollowUpEmail}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Gerando...
            </>
          ) : (
            'Gerar Email'
          )}
        </Button>
      ) : (
        <div className="space-y-3">
          <div className="bg-white p-3 rounded-lg border border-blue-200">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <p className="text-xs font-semibold text-blue-700 mb-1">Assunto</p>
                <p className="text-sm font-bold text-slate-800">{email.subject}</p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  navigator.clipboard.writeText(email.subject);
                  toast.success('Copiado!');
                }}
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>
            <p className="text-xs text-slate-600 italic">Preview: {email.preview}</p>
          </div>

          <div className="bg-white p-3 rounded-lg border border-blue-200">
            <p className="text-xs font-semibold text-blue-700 mb-2">Corpo do Email</p>
            <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">{email.body}</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-green-50 p-2 rounded-lg border border-green-200">
              <p className="text-xs font-semibold text-green-700">🎯 CTA</p>
              <p className="text-sm font-bold text-green-900">{email.cta}</p>
            </div>
            <div className="bg-orange-50 p-2 rounded-lg border border-orange-200">
              <p className="text-xs font-semibold text-orange-700">⏰ Timing</p>
              <p className="text-sm font-bold text-orange-900">{email.timing}</p>
            </div>
          </div>

          <div className="bg-purple-50 p-2 rounded-lg border border-purple-200">
            <p className="text-xs font-semibold text-purple-700">💡 Por que funciona</p>
            <p className="text-xs text-slate-700">{email.why_this_approach}</p>
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(`${email.subject}\n\n${email.body}`);
                toast.success('Email copiado!');
              }}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <Copy className="w-3 h-3 mr-1" />
              Copiar Tudo
            </Button>
            <Button
              size="sm"
              onClick={() => setEmail(null)}
              variant="outline"
            >
              Gerar Novo
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
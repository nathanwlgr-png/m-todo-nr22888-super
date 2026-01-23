import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send, Copy, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function AILeadMessenger({ lead }) {
  const [message, setMessage] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [messageType, setMessageType] = useState('');

  const generateMessage = async (type) => {
    setIsGenerating(true);
    setMessageType(type);
    try {
      const context = `
LEAD: ${lead.full_name}
Empresa: ${lead.company || 'N/A'}
Cidade: ${lead.city || 'N/A'}
Interesse: ${lead.interest || 'Geral'}
Orçamento: ${lead.budget_range || 'N/A'}
Urgência: ${lead.urgency || 'N/A'}
Origem: ${lead.source}
Status: ${lead.status}
Notas: ${lead.notes || 'Sem notas'}

TIPO: ${type}

Gere uma mensagem PERFEITA e PERSONALIZADA para este lead.
${type === 'prospeccao' ? 'Primeira abordagem, desperte interesse sem ser vendedor.' : ''}
${type === 'followup' ? 'Follow-up após primeiro contato, agregue valor.' : ''}
${type === 'qualificacao' ? 'Qualifique o lead fazendo perguntas estratégicas.' : ''}
${type === 'agendamento' ? 'Agende uma reunião/demonstração de forma natural.' : ''}
`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: context,
        response_json_schema: {
          type: "object",
          properties: {
            subject: { type: "string" },
            message: { type: "string" },
            tone: { type: "string" },
            best_channel: { type: "string" },
            best_time: { type: "string" },
            expected_response_rate: { type: "number" },
            key_points: { type: "array", items: { type: "string" } }
          }
        }
      });

      setMessage(result);
      toast.success('Mensagem gerada!');
    } catch (error) {
      toast.error('Erro ao gerar mensagem');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyMessage = () => {
    navigator.clipboard.writeText(message.message);
    toast.success('Mensagem copiada!');
  };

  const sendWhatsApp = () => {
    if (!lead.phone) {
      toast.error('Lead sem WhatsApp');
      return;
    }
    window.open(`https://wa.me/${lead.phone}?text=${encodeURIComponent(message.message)}`, '_blank');
  };

  return (
    <Card className="border-2 border-blue-200">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageSquare className="w-5 h-5 text-blue-600" />
          Mensagens Personalizadas IA
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {!message ? (
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={() => generateMessage('prospeccao')}
              disabled={isGenerating}
              size="sm"
              variant="outline"
            >
              Prospecção
            </Button>
            <Button
              onClick={() => generateMessage('followup')}
              disabled={isGenerating}
              size="sm"
              variant="outline"
            >
              Follow-up
            </Button>
            <Button
              onClick={() => generateMessage('qualificacao')}
              disabled={isGenerating}
              size="sm"
              variant="outline"
            >
              Qualificação
            </Button>
            <Button
              onClick={() => generateMessage('agendamento')}
              disabled={isGenerating}
              size="sm"
              variant="outline"
            >
              Agendamento
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Badge className="bg-blue-600 text-white">
                {messageType.toUpperCase()}
              </Badge>
              <span className="text-xs text-slate-500">
                Taxa esperada: {message.expected_response_rate}%
              </span>
            </div>

            {message.subject && (
              <div className="bg-slate-50 p-2 rounded">
                <p className="text-xs text-slate-500">Assunto</p>
                <p className="font-semibold text-sm">{message.subject}</p>
              </div>
            )}

            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <p className="text-sm whitespace-pre-wrap">{message.message}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-slate-50 p-2 rounded">
                <p className="text-slate-500">Tom</p>
                <p className="font-semibold">{message.tone}</p>
              </div>
              <div className="bg-slate-50 p-2 rounded">
                <p className="text-slate-500">Melhor horário</p>
                <p className="font-semibold">{message.best_time}</p>
              </div>
            </div>

            {message.key_points?.length > 0 && (
              <div className="bg-green-50 p-2 rounded border border-green-200">
                <p className="text-xs font-semibold text-green-700 mb-1">💡 Pontos-chave</p>
                <ul className="text-xs text-green-600 space-y-1">
                  {message.key_points.map((p, i) => (
                    <li key={i}>• {p}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <Button onClick={copyMessage} size="sm" variant="outline">
                <Copy className="w-4 h-4 mr-1" />
                Copiar
              </Button>
              {lead.phone && (
                <Button onClick={sendWhatsApp} size="sm" className="bg-green-600">
                  <Send className="w-4 h-4 mr-1" />
                  WhatsApp
                </Button>
              )}
            </div>

            <Button
              onClick={() => setMessage(null)}
              variant="ghost"
              size="sm"
              className="w-full"
            >
              Nova Mensagem
            </Button>
          </div>
        )}

        {isGenerating && (
          <div className="flex justify-center py-4">
            <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
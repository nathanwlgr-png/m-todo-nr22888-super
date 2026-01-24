import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, Send, Mail, MessageSquare, Clock, Target, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AIFollowUpGenerator({ client }) {
  const [generating, setGenerating] = useState(false);
  const [sequence, setSequence] = useState(null);
  const [sending, setSending] = useState(false);

  const generateSequence = async (sendNow = false) => {
    if (!client?.id) {
      toast.error('Cliente não encontrado');
      return;
    }

    setGenerating(true);
    try {
      const result = await base44.functions.invoke('generateAIFollowUpSequence', {
        client_id: client.id,
        send_immediately: sendNow
      });

      setSequence(result.sequence);
      
      if (result.first_message_sent) {
        toast.success('Primeira mensagem enviada!');
      } else {
        toast.success('Sequência gerada com sucesso!');
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao gerar sequência: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  const sendFirstMessage = async () => {
    if (!sequence?.messages?.[0]) return;

    setSending(true);
    try {
      const firstMsg = sequence.messages[0];
      
      if (firstMsg.channel === 'email' && client.email) {
        await base44.integrations.Core.SendEmail({
          to: client.email,
          subject: firstMsg.subject,
          body: firstMsg.body
        });
        toast.success('Email enviado!');
      } else if (firstMsg.channel === 'whatsapp' && client.phone) {
        const whatsappMsg = encodeURIComponent(firstMsg.body);
        window.open(`https://wa.me/${client.phone}?text=${whatsappMsg}`, '_blank');
        toast.success('WhatsApp aberto!');
      } else {
        toast.error('Canal não disponível para este cliente');
      }
    } catch (error) {
      toast.error('Erro ao enviar: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-900">
          <Sparkles className="w-5 h-5" />
          Sequência Follow-Up IA
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!sequence ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-700">
              A IA vai criar uma sequência de follow-up personalizada baseada no perfil, histórico e estágio do pipeline.
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => generateSequence(false)}
                disabled={generating}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                {generating ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                Gerar Sequência
              </Button>
              <Button
                onClick={() => generateSequence(true)}
                disabled={generating}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {generating ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Gerar + Enviar
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3 bg-white rounded-lg border-2 border-purple-200">
              <h4 className="font-bold text-purple-900 mb-2">{sequence.sequence_name}</h4>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Target className="w-4 h-4" />
                  {sequence.total_messages} mensagens
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {sequence.estimated_duration_days} dias
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {sequence.messages?.map((msg, idx) => (
                <div key={idx} className="p-3 bg-white rounded-lg border">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-purple-600">Dia {msg.day_offset}</Badge>
                      <Badge variant="outline">
                        {msg.channel === 'email' ? (
                          <Mail className="w-3 h-3 mr-1" />
                        ) : (
                          <MessageSquare className="w-3 h-3 mr-1" />
                        )}
                        {msg.channel}
                      </Badge>
                    </div>
                  </div>
                  
                  {msg.subject && (
                    <p className="text-sm font-semibold text-gray-800 mb-1">
                      📧 {msg.subject}
                    </p>
                  )}
                  
                  <p className="text-sm text-gray-700 whitespace-pre-line mb-2">
                    {msg.body}
                  </p>
                  
                  <div className="flex items-start gap-2 text-xs text-gray-500 border-t pt-2">
                    <Target className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Objetivo: {msg.objective}</p>
                      <p>CTA: {msg.cta}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {sequence.reasoning && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs font-semibold text-blue-800 mb-1">Raciocínio da IA:</p>
                <p className="text-xs text-gray-700">{sequence.reasoning}</p>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={sendFirstMessage}
                disabled={sending}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {sending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                Enviar 1ª Mensagem
              </Button>
              <Button
                onClick={() => {
                  setSequence(null);
                  toast.info('Gere uma nova sequência');
                }}
                variant="outline"
              >
                Nova Sequência
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
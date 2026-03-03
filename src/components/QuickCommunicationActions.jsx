import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle, Mail, Sparkles, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function QuickCommunicationActions({ client }) {
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const generateMessage = async (type) => {
    setGenerating(true);
    setMessageType(type);
    
    try {
      const intelligence = client.ai_sales_intelligence || {};
      const opportunities = [
        ...(intelligence.cross_sell_opportunities || []),
        ...(intelligence.upsell_opportunities || [])
      ];

      const context = `
CLIENTE: ${client.first_name} ${client.full_name || ''}
CLÍNICA: ${client.clinic_name || 'N/A'}
STATUS: ${client.status}
PIPELINE: ${client.pipeline_stage}
LTV 24m: R$ ${intelligence.ltv_24_months || 0}
TAXA DE ADOÇÃO: ${intelligence.product_adoption_rate || 0}%
OPORTUNIDADES: ${opportunities.length}
${opportunities.length > 0 ? `TOP OPORTUNIDADE: ${opportunities[0].product} (${opportunities[0].probability}%)` : ''}
`;

      const prompt = type === 'whatsapp' 
        ? `Crie uma mensagem curta e direta para WhatsApp (máx 3 parágrafos) para ${client.first_name}, com base em:\n${context}\nSeja amigável, objetivo e inclua um CTA claro. Use emojis apropriados.`
        : `Crie um email profissional para ${client.first_name}, com base em:\n${context}\nInclua assunto e corpo do email. Seja consultivo e mostre valor.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            subject: { type: "string" },
            message: { type: "string" }
          }
        }
      });

      setMessage(type === 'whatsapp' ? result.message : `Assunto: ${result.subject}\n\n${result.message}`);
      toast.success('Mensagem gerada com sucesso!');
    } catch (error) {
      toast.error('Erro ao gerar mensagem: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  const sendWhatsApp = () => {
    if (!client.phone) {
      toast.error('Cliente não tem WhatsApp cadastrado');
      return;
    }
    const clean = client.phone.replace(/\D/g, '');
    const phone = clean.startsWith('55') ? clean : `55${clean}`;
    const encodedMsg = encodeURIComponent(message);
    window.open(`https://wa.me/${phone}?text=${encodedMsg}`, '_blank');
  };

  const sendEmail = () => {
    if (!client.email) {
      toast.error('Cliente não tem email cadastrado');
      return;
    }
    const [subject, ...body] = message.split('\n\n');
    const subjectLine = subject.replace('Assunto: ', '');
    const encodedSubject = encodeURIComponent(subjectLine);
    const encodedBody = encodeURIComponent(body.join('\n\n'));
    window.open(`mailto:${client.email}?subject=${encodedSubject}&body=${encodedBody}`, '_blank');
  };

  return (
    <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-800">
          <Sparkles className="w-5 h-5" />
          Comunicação Inteligente
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            onClick={() => generateMessage('whatsapp')}
            disabled={generating}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            {generating && messageType === 'whatsapp' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <MessageCircle className="w-4 h-4" />
            )}
            <span className="ml-2">Gerar WhatsApp</span>
          </Button>
          <Button
            onClick={() => generateMessage('email')}
            disabled={generating}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            {generating && messageType === 'email' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Mail className="w-4 h-4" />
            )}
            <span className="ml-2">Gerar Email</span>
          </Button>
        </div>

        {message && (
          <>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={8}
              className="font-mono text-sm"
            />
            <div className="flex gap-2">
              <Button
                onClick={messageType === 'whatsapp' ? sendWhatsApp : sendEmail}
                className="flex-1"
              >
                <Send className="w-4 h-4 mr-2" />
                Enviar {messageType === 'whatsapp' ? 'WhatsApp' : 'Email'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setMessage('')}
              >
                Limpar
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
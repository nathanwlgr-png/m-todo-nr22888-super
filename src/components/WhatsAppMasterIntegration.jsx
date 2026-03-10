import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { MessageSquare, Send, Sparkles, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const WhatsAppMasterIntegration = ({ clientId, clientName, clientPhone }) => {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);

  const generateAIMessage = async () => {
    setAiGenerating(true);
    try {
      const response = await base44.functions.invoke('generateAIMessageSuggestion', {
        client_id: clientId,
        context: 'follow_up'
      });
      
      if (response.data?.message) {
        setMessage(response.data.message);
        toast.success('Mensagem gerada pela IA!');
      }
    } catch (error) {
      toast.error('Erro ao gerar mensagem: ' + error.message);
    } finally {
      setAiGenerating(false);
    }
  };

  const sendMessage = async () => {
    if (!message.trim()) {
      toast.error('Digite uma mensagem');
      return;
    }

    setLoading(true);
    try {
      await base44.functions.invoke('whatsappSendDirect', {
        phone: clientPhone,
        message: message,
        client_id: clientId
      });

      toast.success('Mensagem enviada via WhatsApp!');
      setMessage('');
      
      // Registrar interação
      await base44.entities.WhatsAppMessage.create({
        contact_id: clientId,
        contact_name: clientName,
        contact_phone: clientPhone,
        direction: 'sent',
        message: message,
        status: 'sent',
        automated: false
      });
    } catch (error) {
      toast.error('Erro ao enviar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-green-600" />
          WhatsApp Master Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Destinatário</label>
          <Input value={`${clientName} - ${clientPhone || 'Sem telefone'}`} disabled />
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Mensagem</label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Digite sua mensagem..."
            rows={4}
            className="resize-none"
          />
        </div>

        <div className="flex gap-2">
          <Button
            onClick={generateAIMessage}
            disabled={aiGenerating}
            variant="outline"
            className="flex-1"
          >
            {aiGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Gerar com IA
              </>
            )}
          </Button>

          <Button
            onClick={sendMessage}
            disabled={loading || !clientPhone}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Enviar WhatsApp
              </>
            )}
          </Button>
        </div>

        {!clientPhone && (
          <p className="text-xs text-amber-600">⚠️ Cliente sem número de WhatsApp cadastrado</p>
        )}
      </CardContent>
    </Card>
  );
};

export default WhatsAppMasterIntegration;
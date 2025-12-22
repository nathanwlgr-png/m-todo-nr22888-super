import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MessageCircle, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const MESSAGE_TEMPLATES = {
  saudacao: 'Olá {nome}, tudo bem? Sou {vendedor} da Método NR. Vi seu interesse em nossos equipamentos!',
  followup: 'Olá {nome}! Passando para saber se teve chance de avaliar nossa proposta. Posso ajudar com algo?',
  agradecimento: 'Obrigado pela reunião, {nome}! Foi ótimo conversar com você. Qualquer dúvida, estou à disposição!',
  lembrete: 'Oi {nome}! Lembrete: temos uma visita agendada para {data}. Confirma para mim?',
  proposta: '{nome}, enviei a proposta por email. Dá uma olhada e me conta o que achou!',
  custom: ''
};

export default function QuickWhatsAppSend({ contactId, contactName, contactPhone, onSuccess }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [template, setTemplate] = useState('saudacao');
  const [message, setMessage] = useState('');
  const [generatingAI, setGeneratingAI] = useState(false);

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const sendMutation = useMutation({
    mutationFn: async (messageText) => {
      return base44.entities.WhatsAppMessage.create({
        contact_id: contactId,
        contact_name: contactName,
        contact_phone: contactPhone,
        direction: 'sent',
        message: messageText,
        status: 'sent',
        sent_by: currentUser.email,
        sent_by_name: currentUser.full_name,
        automated: false
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['whatsapp-messages']);
      toast.success('Mensagem enviada!');
      setOpen(false);
      setMessage('');
      if (onSuccess) onSuccess();
    }
  });

  const handleTemplateChange = (value) => {
    setTemplate(value);
    if (value !== 'custom') {
      const msg = MESSAGE_TEMPLATES[value]
        .replace('{nome}', contactName)
        .replace('{vendedor}', currentUser?.full_name || 'seu vendedor')
        .replace('{data}', new Date().toLocaleDateString());
      setMessage(msg);
    } else {
      setMessage('');
    }
  };

  const generateWithAI = async () => {
    setGeneratingAI(true);
    try {
      const personalityContext = currentUser.communication_style || currentUser.personality_traits?.length > 0
        ? `
PERSONALIDADE DO VENDEDOR (${currentUser.full_name}):
- Estilo: ${currentUser.communication_style || 'Profissional e consultivo'}
- Características: ${currentUser.personality_traits?.join(', ') || 'empático, direto'}
- Abordagem: ${currentUser.sales_approach || 'Foco em relacionamento e entendimento das dores'}
${currentUser.signature_phrases?.length > 0 ? `- Frases típicas: ${currentUser.signature_phrases.slice(0, 2).join(', ')}` : ''}

IMPORTANTE: Escreva EXATAMENTE como ${currentUser.full_name} escreveria, usando o estilo dele.`
        : '';

      const aiMessage = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é ${currentUser.full_name}, vendedor de equipamentos de diagnóstico veterinário POCT.

${personalityContext}

Crie uma mensagem WhatsApp CURTA para ${contactName}.
- Máximo 2-3 linhas
- Use SEU estilo pessoal de comunicação
- Seja autêntico, como você realmente fala
- Em português brasileiro`
      });
      setMessage(aiMessage);
    } catch (error) {
      toast.error('Erro ao gerar mensagem');
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error('Digite uma mensagem');
      return;
    }
    
    // Salvar e abrir WhatsApp
    await sendMutation.mutateAsync(message);
    
    // Abrir WhatsApp
    const cleanPhone = contactPhone.replace(/\D/g, '');
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
    
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile) {
      window.location.href = `whatsapp://send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
      setTimeout(() => {
        window.open(whatsappUrl, '_blank');
      }, 1000);
    } else {
      window.open(whatsappUrl, '_blank');
    }
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="w-full bg-green-500 hover:bg-green-600"
      >
        <MessageCircle className="w-4 h-4 mr-2" />
        Enviar WhatsApp
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Enviar WhatsApp</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <p className="text-sm font-medium mb-1">Para:</p>
              <p className="text-slate-700">{contactName} - {contactPhone}</p>
            </div>

            <div>
              <p className="text-sm font-medium mb-2">Template:</p>
              <Select value={template} onValueChange={handleTemplateChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="saudacao">Saudação Inicial</SelectItem>
                  <SelectItem value="followup">Follow-up</SelectItem>
                  <SelectItem value="agradecimento">Agradecimento</SelectItem>
                  <SelectItem value="lembrete">Lembrete</SelectItem>
                  <SelectItem value="proposta">Envio de Proposta</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">Mensagem:</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={generateWithAI}
                  disabled={generatingAI}
                  className="h-7 text-xs"
                >
                  {generatingAI ? (
                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                  ) : (
                    <Sparkles className="w-3 h-3 mr-1" />
                  )}
                  Gerar com IA
                </Button>
              </div>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Digite sua mensagem..."
                rows={4}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSend}
                disabled={sendMutation.isPending}
                className="flex-1 bg-green-500 hover:bg-green-600"
              >
                {sendMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Enviar'
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
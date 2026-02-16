import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Sparkles, Send, Loader, Download, MessageSquare } from 'lucide-react';

export default function WhatsAppAIProposalGenerator({ client, conversationHistory = [] }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [proposalContent, setProposalContent] = useState('');
  const [isSending, setIsSending] = useState(false);

  if (!client) {
    return (
      <div className="text-center py-8 text-slate-500">
        <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Selecione um cliente para gerar proposta</p>
      </div>
    );
  }

  const generateProposal = async () => {
    setIsGenerating(true);
    try {
      // Estruturar histórico da conversa
      const conversationContext = conversationHistory
        .slice(-10) // Últimas 10 mensagens
        .map(msg => `${msg.role}: ${msg.content}`)
        .join('\n');

      // Dados do cliente
      const clientContext = `
CLIENTE:
- Nome: ${client.first_name} ${client.last_name || ''}
- Empresa: ${client.clinic_name || 'Não informado'}
- Telefone: ${client.phone}
- Cidade: ${client.city}
- Equipamento de Interesse: ${client.equipment_interest || 'Não especificado'}
- Orçamento: ${client.available_budget ? `R$ ${client.available_budget}` : 'Não informado'}
- Necessidades Técnicas: ${client.lab_needs?.join(', ') || 'Não especificadas'}
- Status: ${client.status || 'Novo'}
- Dores Identificadas: ${client.main_pains?.slice(0, 3).join(', ') || 'Não identificadas'}
`;

      // Usar IA para gerar proposta personalizada
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um especialista em vendas de equipamentos laboratoriais. Crie uma PROPOSTA DE VENDA personalizada e profissional.

${clientContext}

HISTÓRICO DA CONVERSA:
${conversationContext || 'Nenhuma conversa prévia'}

TAREFA:
1. Analise as necessidades do cliente baseado em: equipamento de interesse, orçamento, dores e histórico
2. Gere uma proposta profissional estruturada com:
   - Saudação personalizada
   - 2-3 parágrafos descrevendo a solução (equipamento/serviço)
   - Lista de benefícios específicos para suas necessidades
   - Proposta comercial (quantidade, valores estimados - use o orçamento disponível)
   - Call-to-action claro (próximos passos)
   - Fechamento profissional

3. Mantenha um tom profissional mas amigável
4. Use dados reais do cliente (nome, empresa, cidade)
5. Referencia as dores/necessidades mencionadas

Gere a proposta em MARKDOWN para fácil leitura no WhatsApp.`,
        add_context_from_internet: false
      });

      setProposalContent(response);
      toast.success('✅ Proposta gerada com sucesso!');
    } catch (error) {
      toast.error('❌ Erro ao gerar proposta: ' + error.message);
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const sendViaWhatsApp = async () => {
    if (!proposalContent) {
      toast.error('Gere uma proposta primeiro');
      return;
    }

    setIsSending(true);
    try {
      // Dividir em mensagens menores (WhatsApp tem limite)
      const messages = proposalContent.split('\n\n');
      const maxCharsPerMsg = 4096;

      let currentMsg = '';
      const msgsToSend = [];

      for (const section of messages) {
        if ((currentMsg + section).length > maxCharsPerMsg) {
          if (currentMsg) msgsToSend.push(currentMsg);
          currentMsg = section;
        } else {
          currentMsg += (currentMsg ? '\n\n' : '') + section;
        }
      }
      if (currentMsg) msgsToSend.push(currentMsg);

      // Enviar mensagens via WhatsApp
      for (const msg of msgsToSend) {
        await base44.functions.invoke('sendWhatsAppMessage', {
          phone: client.phone,
          message: msg,
          clientId: client.id
        });

        // Pequeno delay entre mensagens
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Registrar log
      await base44.entities.AutomatedMessageLog.create({
        client_id: client.id,
        client_name: client.first_name,
        client_phone: client.phone,
        message_type: 'proposta',
        message_content: proposalContent.substring(0, 500) + '...',
        sent_status: 'enviada',
        sent_at: new Date().toISOString(),
        response_received: false
      }).catch(() => null);

      // Criar tarefa para acompanhamento
      await base44.entities.Task.create({
        title: `Acompanhar Proposta - ${client.first_name}`,
        description: 'Proposta enviada via WhatsApp. Aguardar feedback do cliente.',
        client_id: client.id,
        status: 'pending'
      }).catch(() => null);

      toast.success('✅ Proposta enviada via WhatsApp!');
      setProposalContent('');
    } catch (error) {
      toast.error('❌ Erro ao enviar: ' + error.message);
      console.error(error);
    } finally {
      setIsSending(false);
    }
  };

  const downloadProposal = () => {
    if (!proposalContent) return;

    const element = document.createElement('a');
    const file = new Blob([proposalContent], { type: 'text/markdown' });
    element.href = URL.createObjectURL(file);
    element.download = `Proposta_${client.first_name}_${new Date().getTime()}.md`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success('✅ Proposta baixada');
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
      <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-purple-600" />
        Gerador IA de Propostas
      </h3>

      {/* Info Cliente */}
      <div className="bg-white p-3 rounded-lg mb-4 text-sm border border-purple-200">
        <p className="font-semibold text-slate-900">{client.first_name}</p>
        <p className="text-xs text-slate-600">
          {client.clinic_name} • {client.city} • Orçamento: {client.available_budget ? `R$ ${client.available_budget}` : 'Não informado'}
        </p>
      </div>

      {/* Botão Gerar */}
      {!proposalContent && (
        <Button
          onClick={generateProposal}
          disabled={isGenerating}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 mb-4"
        >
          {isGenerating ? (
            <>
              <Loader className="w-4 h-4 mr-2 animate-spin" />
              Analisando dados...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Gerar Proposta com IA
            </>
          )}
        </Button>
      )}

      {/* Preview Proposta */}
      {proposalContent && (
        <>
          <div className="bg-white border rounded-lg p-4 mb-4 max-h-64 overflow-y-auto text-sm text-slate-700 whitespace-pre-wrap">
            {proposalContent}
          </div>

          {/* Botões de Ação */}
          <div className="grid grid-cols-1 gap-2">
            <Button
              onClick={sendViaWhatsApp}
              disabled={isSending}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSending ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Enviar via WhatsApp
                </>
              )}
            </Button>

            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={downloadProposal}
                variant="outline"
              >
                <Download className="w-4 h-4 mr-2" />
                Baixar
              </Button>
              <Button
                onClick={() => setProposalContent('')}
                variant="outline"
              >
                Gerar Novo
              </Button>
            </div>
          </div>
        </>
      )}
    </Card>
  );
}
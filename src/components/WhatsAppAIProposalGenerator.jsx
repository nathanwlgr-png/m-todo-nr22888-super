import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Sparkles, Send, Loader, Download, MessageSquare } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

export default function WhatsAppAIProposalGenerator({ client, conversationHistory = [] }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [proposalContent, setProposalContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState('');
  const [includePayment, setIncludePayment] = useState(false);
  const [includeCalibration, setIncludeCalibration] = useState(false);

  // Buscar equipamentos disponíveis
  const { data: equipments = [] } = useQuery({
    queryKey: ['seamaty-equipment'],
    queryFn: () => base44.entities.SeamatyPriceTable.list().catch(() => []),
    enabled: !!client
  });

  if (!client) {
    return (
      <div className="text-center py-8 text-slate-500">
        <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Selecione um cliente para gerar proposta</p>
      </div>
    );
  }

  const generateProposal = async () => {
    if (!selectedEquipment) {
      toast.error('Selecione um equipamento');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await base44.functions.invoke('generateWhatsAppProposal', {
        client_id: client.id,
        equipment_code: selectedEquipment,
        include_payment_terms: includePayment,
        include_calibration: includeCalibration
      });

      if (response.data.success) {
        setProposalContent(response.data.proposal_content);
        toast.success('✅ Proposta gerada com dados reais!');
      } else {
        toast.error('❌ ' + response.data.error);
      }
    } catch (error) {
      toast.error('❌ Erro: ' + error.message);
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

      {/* Seleção de Equipamento */}
      {!proposalContent && (
        <div className="space-y-3 mb-4">
          <label className="text-sm font-semibold text-slate-900">Equipamento</label>
          <Select value={selectedEquipment} onValueChange={setSelectedEquipment}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione um equipamento..." />
            </SelectTrigger>
            <SelectContent>
              {equipments.map(eq => (
                <SelectItem key={eq.id} value={eq.product_code}>
                  {eq.product_name} (R$ {eq.price_cash?.toLocaleString('pt-BR') || 'N/A'})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="space-y-2 text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={includePayment} 
                onChange={(e) => setIncludePayment(e.target.checked)}
                className="w-4 h-4"
              />
              <span>Incluir formas de pagamento</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={includeCalibration} 
                onChange={(e) => setIncludeCalibration(e.target.checked)}
                className="w-4 h-4"
              />
              <span>Incluir calibração (R$ 500)</span>
            </label>
          </div>
        </div>
      )}

      {/* Botão Gerar */}
      {!proposalContent && (
        <Button
          onClick={generateProposal}
          disabled={isGenerating || !selectedEquipment}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 mb-4"
        >
          {isGenerating ? (
            <>
              <Loader className="w-4 h-4 mr-2 animate-spin" />
              Gerando...
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
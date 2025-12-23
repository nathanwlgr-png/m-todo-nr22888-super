import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Download, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ProposalGeneratorAI() {
  const [generating, setGenerating] = useState(false);
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState('');
  const [proposal, setProposal] = useState(null);
  const queryClient = useQueryClient();

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-updated_date', 100)
  });

  const { data: equipment = [] } = useQuery({
    queryKey: ['equipment'],
    queryFn: () => base44.entities.Equipment.list()
  });

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const saveDocumentMutation = useMutation({
    mutationFn: (data) => base44.entities.ClientDocument.create(data),
    onSuccess: () => queryClient.invalidateQueries(['all-documents'])
  });

  const generateProposal = async () => {
    if (!selectedClient || !selectedEquipment) {
      toast.error('Selecione cliente e equipamento');
      return;
    }

    setGenerating(true);

    try {
      const client = clients.find(c => c.id === selectedClient);
      const equip = equipment.find(e => e.id === selectedEquipment);

      const proposalPrompt = `Gere uma PROPOSTA COMERCIAL profissional e persuasiva.

CLIENTE:
Nome: ${client.first_name}
Clínica: ${client.clinic_name}
Cidade: ${client.city}
Tipo: ${client.client_type}
Perfil Numerológico: ${client.numerology_number} - ${client.behavioral_profile}

EQUIPAMENTO:
Nome: ${equip.name}
Categoria: ${equip.category}
Preço: R$ ${equip.price.toLocaleString('pt-BR')}
Bonificação: ${equip.monthly_bonus}
Especificações: ${equip.specifications}

CONDIÇÕES:
✓ À vista com desconto
✓ PICS em até 36x sem juros
✓ Financiamento Santander até 36x
✓ Treinamento incluso
✓ Garantia de 12 meses
✓ Suporte técnico vitalício

A proposta DEVE:
1. Ser PERSONALIZADA ao perfil do cliente
2. Destacar benefícios ESPECÍFICOS para o tipo de clínica
3. Incluir ROI estimado
4. Usar gatilhos mentais (escassez, urgência, prova social)
5. Ter call-to-action forte
6. Formato profissional com seções claras

Estrutura:
- APRESENTAÇÃO
- EQUIPAMENTO E ESPECIFICAÇÕES
- BENEFÍCIOS PARA SUA CLÍNICA
- INVESTIMENTO E CONDIÇÕES
- ROI ESTIMADO
- DIFERENCIAIS
- PRÓXIMOS PASSOS`;

      const proposalText = await base44.integrations.Core.InvokeLLM({
        prompt: proposalPrompt
      });

      setProposal(proposalText);

      // Salvar documento
      await saveDocumentMutation.mutateAsync({
        client_id: client.id,
        client_name: client.first_name,
        title: `Proposta ${equip.name} - ${client.first_name} - ${new Date().toLocaleDateString('pt-BR')}`,
        type: 'proposta',
        notes: proposalText
      });

      toast.success('✅ Proposta gerada!');

    } catch (error) {
      toast.error('Erro ao gerar proposta');
      console.error(error);
    } finally {
      setGenerating(false);
    }
  };

  const downloadProposal = () => {
    const blob = new Blob([proposal], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Proposta_${selectedClient}_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sendToWhatsApp = async () => {
    if (!user?.phone) {
      toast.error('Configure WhatsApp em Configurações');
      return;
    }

    const message = `📋 *PROPOSTA COMERCIAL*\n\n${proposal.substring(0, 500)}...\n\n[Proposta completa copiada para área de transferência]`;
    await navigator.clipboard.writeText(proposal);
    window.open(`https://wa.me/${user.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <Card className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 shadow-lg">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-xl bg-green-600 flex items-center justify-center">
          <FileText className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-slate-800">Gerador de Propostas</h3>
          <p className="text-xs text-slate-600">Personalizada por IA</p>
        </div>
      </div>

      <div className="space-y-3">
        <Select value={selectedClient} onValueChange={setSelectedClient}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o cliente" />
          </SelectTrigger>
          <SelectContent>
            {clients.map(c => (
              <SelectItem key={c.id} value={c.id}>
                {c.external_code ? `[${c.external_code}] ` : ''}{c.first_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedEquipment} onValueChange={setSelectedEquipment}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o equipamento" />
          </SelectTrigger>
          <SelectContent>
            {equipment.map(e => (
              <SelectItem key={e.id} value={e.id}>
                {e.name} - R$ {e.price.toLocaleString('pt-BR')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          onClick={generateProposal}
          disabled={generating || !selectedClient || !selectedEquipment}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Gerando...
            </>
          ) : (
            <>
              <FileText className="w-4 h-4 mr-2" />
              Gerar Proposta
            </>
          )}
        </Button>

        {proposal && (
          <div className="space-y-2">
            <div className="bg-white rounded-lg p-3 border border-green-200 max-h-48 overflow-auto">
              <pre className="text-xs whitespace-pre-wrap">{proposal.substring(0, 500)}...</pre>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" variant="outline" onClick={downloadProposal}>
                <Download className="w-3 h-3 mr-1" />
                Baixar
              </Button>
              <Button size="sm" variant="outline" onClick={sendToWhatsApp}>
                <Send className="w-3 h-3 mr-1" />
                WhatsApp
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
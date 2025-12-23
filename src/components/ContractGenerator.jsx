import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Download, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ContractGenerator() {
  const [generating, setGenerating] = useState(false);
  const [selectedClient, setSelectedClient] = useState('');
  const [contract, setContract] = useState(null);
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

  const generateContract = async () => {
    if (!selectedClient) {
      toast.error('Selecione um cliente');
      return;
    }

    setGenerating(true);

    try {
      const client = clients.find(c => c.id === selectedClient);
      const equipmentList = equipment.map(e => `${e.name} - R$ ${e.price.toLocaleString('pt-BR')}`).join('\n');

      const contractPrompt = `Gere um CONTRATO DE COMPRA E VENDA DE EQUIPAMENTOS profissional e completo.

DADOS DO CLIENTE:
Nome/Razão Social: ${client.razao_social || client.first_name}
CNPJ: ${client.cnpj || 'Não informado'}
Endereço: ${client.address}
Cidade: ${client.city}
Email: ${client.contract_signature_email || client.email}

EQUIPAMENTOS DISPONÍVEIS:
${equipmentList}

CONDIÇÕES DE PAGAMENTO:
✓ À vista
✓ PICS em até 36x
✓ Financiamento Santander até 36x

O contrato DEVE incluir:
1. QUALIFICAÇÃO DAS PARTES (vendedor e comprador)
2. OBJETO DO CONTRATO (equipamento a ser vendido)
3. VALOR E CONDIÇÕES DE PAGAMENTO
4. PRAZO DE ENTREGA (30 dias úteis)
5. GARANTIA (12 meses)
6. TREINAMENTO (incluso)
7. CLÁUSULAS DE RESPONSABILIDADE
8. FORO (comarca de ${client.city})
9. DATA E ASSINATURAS

Formato profissional com cláusulas numeradas.
Linguagem jurídica adequada mas clara.`;

      const contractText = await base44.integrations.Core.InvokeLLM({
        prompt: contractPrompt
      });

      setContract(contractText);

      // Salvar documento
      await saveDocumentMutation.mutateAsync({
        client_id: client.id,
        client_name: client.first_name,
        title: `Contrato - ${client.first_name} - ${new Date().toLocaleDateString('pt-BR')}`,
        type: 'contrato',
        notes: contractText
      });

      toast.success('✅ Contrato gerado!');

    } catch (error) {
      toast.error('Erro ao gerar contrato');
      console.error(error);
    } finally {
      setGenerating(false);
    }
  };

  const downloadContract = () => {
    const blob = new Blob([contract], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Contrato_${selectedClient}_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sendToWhatsApp = async () => {
    if (!user?.phone) {
      toast.error('Configure WhatsApp em Configurações');
      return;
    }

    const message = `📄 *CONTRATO GERADO*\n\n${contract.substring(0, 500)}...\n\n[Documento completo copiado para área de transferência]`;
    await navigator.clipboard.writeText(contract);
    window.open(`https://wa.me/${user.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 shadow-lg">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center">
          <FileText className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-slate-800">Gerador de Contratos</h3>
          <p className="text-xs text-slate-600">Profissional e automático</p>
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

        <Button
          onClick={generateContract}
          disabled={generating || !selectedClient}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Gerando...
            </>
          ) : (
            <>
              <FileText className="w-4 h-4 mr-2" />
              Gerar Contrato
            </>
          )}
        </Button>

        {contract && (
          <div className="space-y-2">
            <div className="bg-white rounded-lg p-3 border border-blue-200 max-h-48 overflow-auto">
              <pre className="text-xs whitespace-pre-wrap">{contract.substring(0, 500)}...</pre>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" variant="outline" onClick={downloadContract}>
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
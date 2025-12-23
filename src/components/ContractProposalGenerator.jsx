import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Send, Loader2, Download } from 'lucide-react';
import { toast } from 'sonner';

export default function ContractProposalGenerator() {
  const [generating, setGenerating] = useState(false);
  const [selectedClient, setSelectedClient] = useState('');
  const [docType, setDocType] = useState('contract');
  const [generatedDoc, setGeneratedDoc] = useState(null);

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-updated_date', 100)
  });

  const { data: equipment = [] } = useQuery({
    queryKey: ['equipment'],
    queryFn: () => base44.entities.Equipment.list('-created_date', 20)
  });

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const generateDocument = async () => {
    if (!selectedClient) {
      toast.error('Selecione um cliente');
      return;
    }

    setGenerating(true);
    try {
      const client = clients.find(c => c.id === selectedClient);
      const mainEquipment = equipment[0] || { name: 'Analisador Hematológico', price: 45000 };

      const prompt = docType === 'contract' ? `
Gere um CONTRATO DE COMPRA E VENDA DE EQUIPAMENTO profissional e completo:

DADOS DO CONTRATO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONTRATANTE (COMPRADOR):
Nome/Razão Social: ${client.clinic_name || client.first_name}
CNPJ: ${client.cnpj || 'A ser preenchido'}
Endereço: ${client.address || 'A ser preenchido'}
Cidade: ${client.city || ''}
Email: ${client.email || ''}

CONTRATADA (VENDEDOR):
Empresa: [SUA EMPRESA]
CNPJ: [SEU CNPJ]

OBJETO DO CONTRATO:
Equipamento: ${mainEquipment.name}
Valor: R$ ${mainEquipment.price?.toLocaleString('pt-BR') || '45.000,00'}

CONDIÇÕES DE PAGAMENTO:
- À vista com desconto
- PICS em até 36x
- Financiamento Santander até 36x

BONIFICAÇÃO:
${mainEquipment.monthly_bonus || '20% em reagentes no primeiro mês'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Gere um contrato COMPLETO com todas as cláusulas legais necessárias:
1. Qualificação das partes
2. Objeto do contrato
3. Preço e forma de pagamento
4. Prazo de entrega
5. Garantias
6. Penalidades
7. Rescisão
8. Foro
9. Assinaturas

Formato profissional, linguagem jurídica adequada.
` : `
Gere uma PROPOSTA COMERCIAL profissional e persuasiva:

PARA:
Cliente: ${client.clinic_name || client.first_name}
Contato: ${client.first_name}
Email: ${client.email || ''}
Cidade: ${client.city || ''}

EQUIPAMENTO PROPOSTO:
${mainEquipment.name}
Valor: R$ ${mainEquipment.price?.toLocaleString('pt-BR')}

BENEFÍCIOS:
${mainEquipment.specifications || 'Alta precisão, resultados em minutos, interface intuitiva'}

BONIFICAÇÃO EXCLUSIVA:
${mainEquipment.monthly_bonus || '20% em reagentes'}

CONDIÇÕES DE PAGAMENTO:
✓ À vista com desconto especial
✓ PICS em até 36x sem juros
✓ Financiamento Santander pré-aprovado

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Crie uma proposta COMPLETA com:
1. Apresentação da empresa
2. Apresentação do equipamento
3. Diferenciais competitivos
4. Especificações técnicas
5. Benefícios para a clínica
6. Condições comerciais
7. Bonificações
8. Garantias e suporte
9. Próximos passos
10. Validade da proposta (30 dias)

Seja PERSUASIVO e PROFISSIONAL. Use gatilhos mentais (escassez, urgência).
`;

      const document = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        add_context_from_internet: false
      });

      setGeneratedDoc(document);

      // Enviar por WhatsApp
      if (user?.phone) {
        const whatsappMsg = `📄 *${docType === 'contract' ? 'CONTRATO' : 'PROPOSTA'} GERADO*\n\n` +
          `Cliente: ${client.clinic_name || client.first_name}\n` +
          `Equipamento: ${mainEquipment.name}\n` +
          `Valor: R$ ${mainEquipment.price?.toLocaleString('pt-BR')}\n\n` +
          `O documento foi copiado para a área de transferência. Cole em um arquivo Word.`;

        await navigator.clipboard.writeText(document);
        window.open(`https://wa.me/${user.phone.replace(/\D/g, '')}?text=${encodeURIComponent(whatsappMsg)}`, '_blank');
      }

      toast.success('✅ Documento gerado e copiado!');

    } catch (error) {
      toast.error('Erro ao gerar documento');
    } finally {
      setGenerating(false);
    }
  };

  const downloadDoc = () => {
    const blob = new Blob([generatedDoc], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${docType === 'contract' ? 'contrato' : 'proposta'}_${Date.now()}.txt`;
    a.click();
  };

  return (
    <Card className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50 border-2 border-indigo-300 shadow-lg">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center">
          <FileText className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-slate-800">Gerar Documentos</h3>
          <p className="text-xs text-slate-600">Contratos e Propostas Automáticas</p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-xs text-slate-600 mb-1 block">Tipo de Documento</label>
          <Select value={docType} onValueChange={setDocType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="contract">📜 Contrato de Compra e Venda</SelectItem>
              <SelectItem value="proposal">📋 Proposta Comercial</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-xs text-slate-600 mb-1 block">Cliente</label>
          <Select value={selectedClient} onValueChange={setSelectedClient}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {clients.map(c => (
                <SelectItem key={c.id} value={c.id}>
                  {c.clinic_name || c.first_name} - {c.city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={generateDocument}
          disabled={generating || !selectedClient}
          className="w-full bg-indigo-600 hover:bg-indigo-700"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Gerando...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Gerar e Enviar WhatsApp
            </>
          )}
        </Button>

        {generatedDoc && (
          <div className="p-3 bg-white rounded-lg border border-indigo-200">
            <p className="text-xs font-semibold text-indigo-700 mb-2">✅ Documento gerado!</p>
            <Button
              onClick={downloadDoc}
              variant="outline"
              className="w-full"
              size="sm"
            >
              <Download className="w-3 h-3 mr-1" />
              Baixar como TXT
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
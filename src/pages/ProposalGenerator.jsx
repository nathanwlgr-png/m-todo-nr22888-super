import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { FileText, Sparkles, Copy, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ProposalGenerator() {
  const [clientName, setClientName] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [generating, setGenerating] = useState(false);
  const [proposal, setProposal] = useState('');

  const { data: documents = [] } = useQuery({
    queryKey: ['ai-knowledge-docs-active'],
    queryFn: () => base44.entities.AIKnowledgeDocument.filter({ is_active: true }),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients-simple'],
    queryFn: () => base44.entities.Client.list(),
  });

  // Extrair produtos de catálogos
  const products = documents
    .filter(d => (d.document_type === 'catalogo_produtos' || d.document_type === 'manual_tecnico') && d.key_data?.produtos)
    .flatMap(d => d.key_data.produtos || []);

  // Extrair preços
  const prices = documents
    .filter(d => d.document_type === 'tabela_precos' && d.key_data?.precos)
    .flatMap(d => d.key_data.precos || []);

  const generateProposal = async () => {
    if (!clientName || !selectedProduct) {
      toast.error('Selecione cliente e produto');
      return;
    }

    setGenerating(true);
    try {
      const product = products.find(p => p.nome === selectedProduct);
      const price = prices.find(p => p.produto?.includes(selectedProduct));

      const prompt = `Gere uma proposta comercial profissional para:

CLIENTE: ${clientName}

PRODUTO: ${product?.nome || selectedProduct}

ESPECIFICAÇÕES TÉCNICAS:
- Tempo de processamento: ${product?.tempo_processamento || 'N/A'}
- Volume da amostra: ${product?.volume_amostra || 'N/A'}
- Parâmetros medidos: ${product?.parametros_medidos || 'N/A'}
- Tecnologia: ${product?.tecnologia || 'N/A'}
- Rotor: ${product?.rotor || 'N/A'}

COMPONENTES INCLUSOS:
${product?.componentes?.map(c => `- ${c}`).join('\n') || 'N/A'}

REAGENTES/ENZIMAS:
${product?.enzimas_reagentes?.map(e => `- ${e}`).join('\n') || 'N/A'}

DIFERENCIAIS:
${product?.diferenciais?.map(d => `- ${d}`).join('\n') || 'N/A'}

${price ? `
INVESTIMENTO:
- À vista: R$ ${price.preco_vista?.toLocaleString('pt-BR')}
- Parcelado: ${price.preco_parcelado}
- Condições: ${price.condicoes}
- Bonificação: ${price.bonificacao}
- Garantia: ${price.garantia}
` : ''}

Use formato profissional, com introdução, benefícios, especificações técnicas detalhadas, investimento e próximos passos.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt
      });

      setProposal(result);
      toast.success('Proposta gerada!');
    } catch (error) {
      toast.error('Erro ao gerar proposta');
    } finally {
      setGenerating(false);
    }
  };

  const copyProposal = () => {
    navigator.clipboard.writeText(proposal);
    toast.success('Proposta copiada!');
  };

  const sendProposal = async () => {
    if (!proposal) return;

    try {
      const client = clients.find(c => c.first_name === clientName);
      if (!client?.phone) {
        toast.error('Cliente sem WhatsApp cadastrado');
        return;
      }

      await base44.entities.PendingMessage.create({
        recipient_id: client.id,
        recipient_name: client.first_name,
        recipient_phone: client.phone,
        channel: 'whatsapp',
        message_content: proposal,
        context: `Proposta ${selectedProduct}`,
        ai_reasoning: 'Proposta gerada automaticamente com dados dos catálogos',
        priority: 'alta',
        status: 'pending'
      });

      toast.success('Proposta enviada para aprovação!');
    } catch (error) {
      toast.error('Erro ao enviar');
    }
  };

  return (
    <div className="space-y-4 pb-20">
      <Card className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <FileText className="w-6 h-6" />
            Gerador de Propostas Inteligente
          </CardTitle>
          <p className="text-indigo-100">
            Usa dados reais dos catálogos carregados
          </p>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dados da Proposta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Cliente</Label>
            <Select value={clientName} onValueChange={setClientName}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map(c => (
                  <SelectItem key={c.id} value={c.first_name}>
                    {c.first_name} - {c.clinic_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Produto</Label>
            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o produto" />
              </SelectTrigger>
              <SelectContent>
                {products.map((p, idx) => (
                  <SelectItem key={idx} value={p.nome}>
                    {p.nome} {p.modelo && `(${p.modelo})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedProduct && products.find(p => p.nome === selectedProduct) && (
            <Card className="bg-slate-50">
              <CardContent className="pt-4">
                <h4 className="font-semibold mb-2">Informações Extraídas:</h4>
                {(() => {
                  const prod = products.find(p => p.nome === selectedProduct);
                  return (
                    <div className="text-sm space-y-1">
                      {prod.tempo_processamento && <p>⏱️ Tempo: {prod.tempo_processamento}</p>}
                      {prod.volume_amostra && <p>💧 Volume: {prod.volume_amostra}</p>}
                      {prod.rotor && <p>🔄 Rotor: {prod.rotor}</p>}
                      {prod.enzimas_reagentes && prod.enzimas_reagentes.length > 0 && (
                        <p>🧪 Reagentes: {prod.enzimas_reagentes.join(', ')}</p>
                      )}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}

          <Button 
            onClick={generateProposal}
            className="w-full bg-indigo-600 hover:bg-indigo-700"
            disabled={generating || !clientName || !selectedProduct}
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Gerando proposta...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Gerar Proposta Completa
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {proposal && (
        <Card className="border-2 border-green-500">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Proposta Gerada</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={copyProposal}>
                  <Copy className="w-4 h-4 mr-1" />
                  Copiar
                </Button>
                <Button size="sm" onClick={sendProposal} className="bg-green-600 hover:bg-green-700">
                  <Send className="w-4 h-4 mr-1" />
                  Enviar WhatsApp
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea 
              value={proposal}
              onChange={(e) => setProposal(e.target.value)}
              className="min-h-[400px] font-mono text-sm"
            />
          </CardContent>
        </Card>
      )}

      {products.length === 0 && (
        <Card className="border-2 border-orange-500 bg-orange-50">
          <CardContent className="pt-6 text-center">
            <p className="text-orange-800">
              ⚠️ Nenhum catálogo carregado!<br/>
              Vá em "Base IA" para fazer upload de catálogos.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
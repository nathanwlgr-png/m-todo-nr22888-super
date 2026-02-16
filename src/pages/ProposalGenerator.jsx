import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { FileText, Sparkles, Copy, Send, Loader2, Plus, X, MapPin, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

export default function ProposalGenerator() {
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [generating, setGenerating] = useState(false);
  const [proposal, setProposal] = useState('');
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ name: '', content_template: '' });
  const queryClient = useQueryClient();

  const { data: documents = [] } = useQuery({
    queryKey: ['ai-knowledge-docs-active'],
    queryFn: () => base44.entities.AIKnowledgeDocument.filter({ is_active: true }),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients-simple'],
    queryFn: () => base44.entities.Client.list('-updated_date'),
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['proposal-templates'],
    queryFn: () => base44.entities.ProposalTemplate.list(),
  });

  const { data: interactions = [] } = useQuery({
    queryKey: ['client-interactions', selectedClientId],
    queryFn: () => selectedClientId ? base44.entities.Interaction.filter({ client_id: selectedClientId }) : [],
    enabled: !!selectedClientId
  });

  const { data: visits = [] } = useQuery({
    queryKey: ['client-visits', selectedClientId],
    queryFn: () => selectedClientId ? base44.entities.Visit.filter({ client_id: selectedClientId }) : [],
    enabled: !!selectedClientId
  });

  const createTemplateMutation = useMutation({
    mutationFn: (data) => base44.entities.ProposalTemplate.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['proposal-templates']);
      toast.success('Template criado!');
      setTemplateDialogOpen(false);
      setNewTemplate({ name: '', content_template: '' });
    }
  });

  // Extrair produtos de catálogos
  const products = documents
    .filter(d => (d.document_type === 'catalogo_produtos' || d.document_type === 'manual_tecnico') && d.key_data?.produtos)
    .flatMap(d => d.key_data.produtos || []);

  // Extrair preços
  const prices = documents
    .filter(d => d.document_type === 'tabela_precos' && d.key_data?.precos)
    .flatMap(d => d.key_data.precos || []);

  // Clientes da região Laranja (Marília e 200km)
  const cidadesLaranja = [
    'Marília', 'Garça', 'Assis', 'Tupã', 'Ourinhos', 'Bauru', 'Lins', 'Jaú',
    'Botucatu', 'Avaré', 'Presidente Prudente', 'Adamantina', 'Dracena'
  ];
  
  const clientesLaranja = clients.filter(c => 
    c.city && cidadesLaranja.some(cidade => c.city.toLowerCase().includes(cidade.toLowerCase()))
  );

  const selectedClient = clients.find(c => c.id === selectedClientId);

  const toggleProduct = (productName) => {
    setSelectedProducts(prev => 
      prev.includes(productName) 
        ? prev.filter(p => p !== productName)
        : [...prev, productName]
    );
  };

  const generateProposal = async () => {
    if (!selectedClientId || selectedProducts.length === 0) {
      toast.error('Selecione cliente e pelo menos um produto');
      return;
    }

    setGenerating(true);
    try {
      const selectedProds = selectedProducts.map(prodName => products.find(p => p.nome === prodName));
      const selectedPrices = selectedProducts.map(prodName => prices.find(p => p.produto?.includes(prodName)));

      // Dados do cliente para personalização
      const clientHistory = interactions.slice(0, 5).map(i => `- ${i.type}: ${i.notes}`).join('\n');
      const recentVisits = visits.slice(0, 3).map(v => `- ${v.visit_type} em ${new Date(v.scheduled_date).toLocaleDateString()}`).join('\n');

      const template = templates.find(t => t.id === selectedTemplate);

      let prompt = `Gere uma proposta comercial ALTAMENTE PERSONALIZADA para:

═══════════════════════════════════════
INFORMAÇÕES DO CLIENTE
═══════════════════════════════════════
Nome: ${selectedClient.first_name}
Clínica: ${selectedClient.clinic_name || 'N/A'}
Cidade: ${selectedClient.city || 'N/A'}
Tipo: ${selectedClient.client_type || 'N/A'}
Volume mensal: ${selectedClient.current_volume || 'N/A'}
Equipamento atual: ${selectedClient.current_equipment || 'Não possui'}
Necessidades identificadas: ${selectedClient.lab_needs?.join(', ') || 'N/A'}
Dores principais: ${selectedClient.main_pains?.join(', ') || 'N/A'}
Orçamento: ${selectedClient.available_budget ? `R$ ${selectedClient.available_budget.toLocaleString('pt-BR')}` : 'A definir'}

HISTÓRICO DE INTERAÇÕES:
${clientHistory || 'Primeiro contato'}

VISITAS REALIZADAS:
${recentVisits || 'Nenhuma visita ainda'}

═══════════════════════════════════════
PRODUTOS PROPOSTOS (${selectedProducts.length})
═══════════════════════════════════════
`;

      selectedProds.forEach((product, idx) => {
        const price = selectedPrices[idx];
        prompt += `

--- PRODUTO ${idx + 1}: ${product?.nome || 'N/A'} ---

ESPECIFICAÇÕES TÉCNICAS:
- Tempo de processamento: ${product?.tempo_processamento || 'N/A'}
- Volume da amostra: ${product?.volume_amostra || 'N/A'}
- Parâmetros medidos: ${product?.parametros_medidos || 'N/A'}
- Tecnologia: ${product?.tecnologia || 'N/A'}
- Rotor: ${product?.rotor || 'N/A'}

COMPONENTES INCLUSOS:
${product?.componentes?.map(c => `  ✓ ${c}`).join('\n') || 'N/A'}

REAGENTES/ENZIMAS:
${product?.enzimas_reagentes?.map(e => `  🧪 ${e}`).join('\n') || 'N/A'}

DIFERENCIAIS COMPETITIVOS:
${product?.diferenciais?.map(d => `  ★ ${d}`).join('\n') || 'N/A'}

${price ? `INVESTIMENTO:
  • À vista: R$ ${price.preco_vista?.toLocaleString('pt-BR')}
  • Parcelado: ${price.preco_parcelado}
  • Condições: ${price.condicoes}
  • Bonificação: ${price.bonificacao}
  • Garantia: ${price.garantia}
` : ''}`;
      });

      if (template) {
        prompt += `\n\n═══════════════════════════════════════
FORMATO/TEMPLATE:
═══════════════════════════════════════
Siga este formato:
${template.content_template}

Use as variáveis:
{{cliente}} = ${selectedClient.first_name}
{{clinica}} = ${selectedClient.clinic_name}
{{produtos}} = Lista dos produtos acima
{{necessidades}} = ${selectedClient.lab_needs?.join(', ')}`;
      }

      prompt += `\n\nGere uma proposta PROFISSIONAL E PERSUASIVA que:
1. Aborde especificamente as necessidades do cliente
2. Conecte os produtos às dores identificadas
3. Use os dados do histórico para criar rapport
4. Mostre ROI e benefícios tangíveis
5. Tenha tom personalizado e consultivo
6. Inclua próximos passos claros`;

      const result = await base44.integrations.Core.InvokeLLM({ prompt });

      setProposal(result);
      toast.success('Proposta personalizada gerada!');
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
    if (!proposal || !selectedClient) return;

    try {
      if (!selectedClient.phone) {
        toast.error('Cliente sem WhatsApp cadastrado');
        return;
      }

      await base44.entities.PendingMessage.create({
        recipient_id: selectedClient.id,
        recipient_name: selectedClient.first_name,
        recipient_phone: selectedClient.phone,
        channel: 'whatsapp',
        message_content: proposal,
        context: `Proposta: ${selectedProducts.join(', ')}`,
        ai_reasoning: `Proposta personalizada com dados do cliente e ${selectedProducts.length} produto(s)`,
        priority: 'alta',
        status: 'pending'
      });

      toast.success('Proposta enviada para aprovação!');
    } catch (error) {
      toast.error('Erro ao enviar');
    }
  };

  const createTemplate = () => {
    if (!newTemplate.name || !newTemplate.content_template) {
      toast.error('Preencha nome e conteúdo do template');
      return;
    }
    createTemplateMutation.mutate(newTemplate);
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
            Múltiplos produtos + Dados do cliente + Templates personalizados
          </p>
        </CardHeader>
      </Card>

      <Tabs defaultValue="proposta" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="proposta">Gerar Proposta</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="regiao">Região Laranja</TabsTrigger>
        </TabsList>

        <TabsContent value="proposta" className="space-y-4"

          <Card>
            <CardHeader>
              <CardTitle>1. Selecione o Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Buscar cliente..." />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.first_name} - {c.clinic_name} ({c.city})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedClient && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-4">
                    <h4 className="font-semibold mb-2">📊 Dados do Cliente:</h4>
                    <div className="text-sm space-y-1">
                      <p>🏥 {selectedClient.clinic_name}</p>
                      <p>📍 {selectedClient.city}</p>
                      <p>📊 Volume: {selectedClient.current_volume || 'N/A'}</p>
                      <p>⚙️ Equipamento atual: {selectedClient.current_equipment || 'Nenhum'}</p>
                      {selectedClient.lab_needs?.length > 0 && (
                        <p>🎯 Necessidades: {selectedClient.lab_needs.join(', ')}</p>
                      )}
                      {interactions.length > 0 && (
                        <p className="text-green-600">✅ {interactions.length} interações registradas</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>2. Selecione Produtos</span>
                <Badge>{selectedProducts.length} selecionados</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {products.map((p, idx) => (
                <div key={idx} className="flex items-center space-x-2 p-2 border rounded hover:bg-slate-50">
                  <Checkbox 
                    checked={selectedProducts.includes(p.nome)}
                    onCheckedChange={() => toggleProduct(p.nome)}
                  />
                  <div className="flex-1">
                    <p className="font-medium">{p.nome}</p>
                    <p className="text-xs text-slate-600">
                      {p.tempo_processamento && `⏱️ ${p.tempo_processamento} | `}
                      {p.rotor && `🔄 ${p.rotor}`}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3. Template (Opcional)</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Usar template padrão IA" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Template padrão IA</SelectItem>
                  {templates.map(t => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Button 
            onClick={generateProposal}
            className="w-full bg-indigo-600 hover:bg-indigo-700"
            disabled={generating || !selectedClientId || selectedProducts.length === 0}
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Gerando proposta personalizada...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Gerar Proposta com {selectedProducts.length} Produto(s)
              </>
            )}
          </Button>

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

        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Templates de Proposta</span>
                <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="w-4 h-4 mr-1" />
                      Novo Template
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Criar Template de Proposta</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Nome do Template</Label>
                        <Input 
                          value={newTemplate.name}
                          onChange={(e) => setNewTemplate({...newTemplate, name: e.target.value})}
                          placeholder="Ex: Proposta Premium Veterinária"
                        />
                      </div>
                      <div>
                        <Label>Conteúdo do Template</Label>
                        <p className="text-xs text-slate-600 mb-2">
                          Use variáveis: {`{{cliente}}, {{clinica}}, {{produtos}}, {{necessidades}}`}
                        </p>
                        <Textarea 
                          value={newTemplate.content_template}
                          onChange={(e) => setNewTemplate({...newTemplate, content_template: e.target.value})}
                          className="min-h-[300px] font-mono text-sm"
                          placeholder={`Prezado(a) {{cliente}},

É com grande satisfação que apresentamos nossa proposta para {{clinica}}.

PRODUTOS PROPOSTOS:
{{produtos}}

NECESSIDADES IDENTIFICADAS:
{{necessidades}}

...`}
                        />
                      </div>
                      <Button onClick={createTemplate} className="w-full">
                        Criar Template
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {templates.length === 0 ? (
                <p className="text-slate-600 text-center py-4">
                  Nenhum template criado ainda
                </p>
              ) : (
                templates.map(t => (
                  <Card key={t.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold">{t.name}</h4>
                        <p className="text-xs text-slate-600 mt-1">
                          {t.content_template.substring(0, 100)}...
                        </p>
                      </div>
                      <Badge variant={t.is_default ? 'default' : 'outline'}>
                        {t.is_default ? 'Padrão' : 'Customizado'}
                      </Badge>
                    </div>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="regiao" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-orange-600" />
                Clientes da Região Laranja
              </CardTitle>
              <p className="text-sm text-slate-600">
                Marília e região (200km) - {clientesLaranja.length} clientes cadastrados
              </p>
            </CardHeader>
            <CardContent className="space-y-2">
              {clientesLaranja.length === 0 ? (
                <p className="text-center text-slate-600 py-4">
                  Nenhum cliente cadastrado na região Laranja
                </p>
              ) : (
                clientesLaranja.map(c => (
                  <Card key={c.id} className="p-3 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => {
                      setSelectedClientId(c.id);
                      document.querySelector('[value="proposta"]')?.click();
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold">{c.first_name}</h4>
                        <p className="text-sm text-slate-600">{c.clinic_name}</p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            📍 {c.city}
                          </Badge>
                          <Badge variant="outline" className={
                            c.status === 'quente' ? 'bg-red-50 text-red-700' :
                            c.status === 'morno' ? 'bg-yellow-50 text-yellow-700' :
                            'bg-blue-50 text-blue-700'
                          }>
                            {c.status || 'morno'}
                          </Badge>
                        </div>
                      </div>
                      <Button size="sm" variant="ghost">
                        Criar Proposta →
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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
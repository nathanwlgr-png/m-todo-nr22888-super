import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  ArrowLeft, 
  FileText, 
  Copy, 
  Check,
  Download,
  Send,
  Search,
  Sparkles,
  Loader2,
  MessageSquare,
  FolderOpen,
  File
} from 'lucide-react';
import { toast } from 'sonner';

export default function DocumentCenter() {
  const navigate = useNavigate();
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [docType, setDocType] = useState('proposal');
  const [generating, setGenerating] = useState(false);
  const [generatedDoc, setGeneratedDoc] = useState('');
  const [copied, setCopied] = useState(false);

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-updated_date', 500)
  });

  const { data: clientVisits = [] } = useQuery({
    queryKey: ['client-visits', selectedClient?.id],
    queryFn: () => base44.entities.Visit.filter({ client_id: selectedClient?.id }),
    enabled: !!selectedClient
  });

  const { data: clientSales = [] } = useQuery({
    queryKey: ['client-sales', selectedClient?.id],
    queryFn: () => base44.entities.Sale.filter({ client_id: selectedClient?.id }),
    enabled: !!selectedClient
  });

  const { data: clientInteractions = [] } = useQuery({
    queryKey: ['client-interactions', selectedClient?.id],
    queryFn: () => base44.entities.Interaction.filter({ client_id: selectedClient?.id }),
    enabled: !!selectedClient
  });

  const filteredClients = clients.filter(c => 
    c.first_name?.toLowerCase().includes(clientSearch.toLowerCase()) ||
    c.clinic_name?.toLowerCase().includes(clientSearch.toLowerCase()) ||
    c.email?.toLowerCase().includes(clientSearch.toLowerCase())
  );

  const generateDocument = async () => {
    if (!selectedClient) {
      toast.error('Selecione um cliente primeiro');
      return;
    }

    setGenerating(true);

    const prompts = {
      proposal: `# GERAÇÃO DE PROPOSTA COMERCIAL SEAMATY - FORMATO PROFISSIONAL

Você é um especialista em propostas comerciais. Prepare uma proposta COMPLETA e PROFISSIONAL pronta para enviar ao cliente.

════════════════════════════════════════
📋 DADOS DO CLIENTE
════════════════════════════════════════
- Nome: ${selectedClient.first_name}
- Clínica: ${selectedClient.clinic_name || 'Não informada'}
- Email: ${selectedClient.email || 'Não informado'}
- Telefone: ${selectedClient.phone || 'Não informado'}
- Tipo: ${selectedClient.client_type}
- Equipamento Atual: ${selectedClient.current_equipment || 'Nenhum'}
- Necessidades Lab: ${selectedClient.lab_needs?.join(', ') || 'Não informadas'}

════════════════════════════════════════
💼 HISTÓRICO COMERCIAL
════════════════════════════════════════
- Visitas realizadas: ${clientVisits.length}
- Vendas anteriores: ${clientSales.length}
- Interações registradas: ${clientInteractions.length}
- Status: ${selectedClient.status}
- Score de Compra: ${selectedClient.purchase_score}%
- Dores identificadas: ${selectedClient.main_pains?.join(', ') || 'Não identificadas'}

════════════════════════════════════════
🧠 PERFIL COMPORTAMENTAL
════════════════════════════════════════
- Numerologia: ${selectedClient.numerology_number} - ${selectedClient.behavioral_profile}
- Estilo de Decisão: ${selectedClient.decision_style}
- Tom de Comunicação: ${selectedClient.client_tone || 'Profissional'}

════════════════════════════════════════
🎯 EQUIPAMENTOS SEAMATY DISPONÍVEIS
════════════════════════════════════════

**ANALISADORES BIOQUÍMICOS:**
- SMT-120VP: Totalmente automático, última geração
- QT3: Parâmetros individuais ou combinados

**GASES SANGUÍNEOS E ELETRÓLITOS:**
- VG1: Portátil e fácil de usar
- VG2: Com imunofluorescência integrada

**HEMATOLOGIA:**
- VBC-50A: 5 partes, automático

**PCR:**
- VQ1: PCR quantitativo em tempo real

**IMUNOFLUORESCÊNCIA:**
- VI1: Analisador veterinário

════════════════════════════════════════
⭐ DIFERENCIAIS SEAMATY (SEMPRE INCLUIR)
════════════════════════════════════════
✅ 25 MESES DE GARANTIA (mercado oferece 12)
✅ MANUTENÇÃO VITALÍCIA INCLUSA
✅ BONIFICAÇÃO EM INSUMOS (não damos desconto no equipamento)
✅ Certificação ISO 13485:2016
✅ Tecnologia POCT de ponta
✅ Suporte técnico especializado

════════════════════════════════════════
📝 ESTRUTURA DA PROPOSTA
════════════════════════════════════════

Gere uma proposta no seguinte formato MARKDOWN:

\`\`\`markdown
# PROPOSTA COMERCIAL - SEAMATY BRASIL

**Data:** [Data de hoje]  
**Cliente:** ${selectedClient.first_name}  
**Clínica:** ${selectedClient.clinic_name || 'N/A'}  
**Preparado por:** [Nome do vendedor]

---

## 👋 APRESENTAÇÃO

Prezado(a) ${selectedClient.first_name},

[Parágrafo personalizado baseado no perfil comportamental e histórico]

---

## 🎯 SOLUÇÃO PROPOSTA

Com base em nossa análise e nas necessidades da ${selectedClient.clinic_name || 'sua clínica'}, recomendamos:

### [Nome do Equipamento Ideal]

**Especificações:**
- [Listar especificações técnicas relevantes]
- [Considerar as necessidades lab do cliente]
- [Adaptar ao tipo de clínica]

**Aplicações:**
- [Listar aplicações práticas]
- [Conectar com dores identificadas]

---

## 💰 INVESTIMENTO

| Item | Detalhes |
|------|----------|
| **Equipamento** | [Equipamento recomendado] |
| **Valor** | R$ [Valor estimado] |
| **Condições** | [Condições de pagamento] |
| **Bonificação** | [% em insumos no primeiro ano] |

---

## ⭐ POR QUE SEAMATY?

### 🛡️ GARANTIA ESTENDIDA
✅ **25 meses de garantia** (mercado oferece apenas 12 meses)  
✅ Manutenção vitalícia inclusa sem custo adicional

### 🎁 BONIFICAÇÃO EM INSUMOS
✅ [X]% de bonificação em insumos no primeiro ano  
✅ Sem desconto no equipamento, investimento protegido

### 🏆 CERTIFICAÇÃO INTERNACIONAL
✅ ISO 13485:2016  
✅ Aprovado em 120+ países  
✅ Subsidiárias em 10 países

### 🔬 TECNOLOGIA POCT
✅ Point of Care Testing de última geração  
✅ Resultados rápidos e confiáveis  
✅ Interface intuitiva

---

## 📈 BENEFÍCIOS PARA SUA CLÍNICA

1. **[Benefício 1 personalizado baseado em dores]**
2. **[Benefício 2 conectado ao perfil do cliente]**
3. **[Benefício 3 focado em ROI ou qualidade]**

---

## 🚀 PRÓXIMOS PASSOS

1. **Agendamento:** [Sugestão de data para demonstração/reunião]
2. **Demonstração:** [Se aplicável]
3. **Fechamento:** [Timeline sugerido]

---

## 📞 CONTATO

**Seamaty Brasil**  
Site: https://seamaty.com.br  
Instagram: @seamatybrasil  
Email: contato@seamaty.com.br

---

*Proposta válida por 30 dias. Valores sujeitos a alteração sem aviso prévio.*

**Certificação:** ISO 13485:2016  
**Fundada:** 2012 | **120+ países atendidos**
\`\`\`

════════════════════════════════════════
⚡ INSTRUÇÕES CRÍTICAS
════════════════════════════════════════

1. Escolha o equipamento IDEAL baseado em:
   - Necessidades lab do cliente (${selectedClient.lab_needs?.join(', ')})
   - Tipo de clínica (${selectedClient.client_type})
   - Equipamento atual (${selectedClient.current_equipment || 'Nenhum'})

2. Personalize o tom baseado em:
   - Perfil numerológico (${selectedClient.numerology_number})
   - Estilo de decisão (${selectedClient.decision_style})

3. Conecte com as dores:
   ${selectedClient.main_pains?.map(p => `- ${p}`).join('\n   ') || '- Melhorar eficiência diagnóstica'}

4. Use valores REALISTAS (R$ 30k a R$ 150k dependendo do equipamento)

5. Mantenha tom PROFISSIONAL mas ACESSÍVEL

6. SEMPRE inclua os 3 diferenciais principais

Gere APENAS o conteúdo markdown da proposta, sem comentários adicionais.`,

      analysis: `Prepare uma ANÁLISE COMPLETA de ${selectedClient.first_name} formatada em MARKDOWN profissional.

Inclua:

# ANÁLISE COMPLETA - ${selectedClient.first_name}

## 📊 DADOS CADASTRAIS
[Todos os dados do cliente formatados]

## 💼 HISTÓRICO COMERCIAL
- Visitas: ${clientVisits.length} realizadas
- Vendas: ${clientSales.length} concluídas
- Interações: ${clientInteractions.length} registradas
- Status: ${selectedClient.status}
- Score: ${selectedClient.purchase_score}%

## 🧠 PERFIL COMPORTAMENTAL
- Numerologia: ${selectedClient.numerology_number}
- Perfil: ${selectedClient.behavioral_profile}
- Estilo: ${selectedClient.decision_style}

## 📈 OPORTUNIDADES IDENTIFICADAS
[Liste 3-5 oportunidades específicas]

## ⚡ PRÓXIMAS AÇÕES RECOMENDADAS
1. [Ação 1 com prazo]
2. [Ação 2 com prazo]
3. [Ação 3 com prazo]

Seja DETALHADO e ESTRATÉGICO.`,

      technical: `Prepare um DOCUMENTO TÉCNICO sobre equipamentos Seamaty formatado em MARKDOWN.

Baseado nas necessidades de ${selectedClient.first_name}:
- Necessidades: ${selectedClient.lab_needs?.join(', ') || 'Gerais'}
- Tipo: ${selectedClient.client_type}

Estruture:

# ESPECIFICAÇÕES TÉCNICAS SEAMATY

## EQUIPAMENTOS RECOMENDADOS
[Lista de 2-3 equipamentos ideais]

## ESPECIFICAÇÕES DETALHADAS
[Para cada equipamento]

## APLICAÇÕES PRÁTICAS
[Casos de uso específicos]

## DIFERENCIAIS TÉCNICOS
✅ 25 meses de garantia
✅ Manutenção vitalícia
✅ Certificação ISO 13485:2016

## INVESTIMENTO
[Faixa de valores]

Seja TÉCNICO mas ACESSÍVEL.`
    };

    try {
      const doc = await base44.integrations.Core.InvokeLLM({
        prompt: prompts[docType]
      });

      setGeneratedDoc(doc);
      toast.success('Documento gerado com sucesso!');
    } catch (error) {
      toast.error('Erro ao gerar documento: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedDoc);
    setCopied(true);
    toast.success('Copiado para área de transferência!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([generatedDoc], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedClient?.first_name || 'documento'}_${docType}_${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Documento baixado!');
  };

  const handleSendWhatsApp = () => {
    if (selectedClient?.phone && generatedDoc) {
      const message = encodeURIComponent(generatedDoc);
      window.open(`https://wa.me/${selectedClient.phone}?text=${message}`, '_blank');
      toast.success('Abrindo WhatsApp...');
    } else {
      toast.error('Cliente sem telefone cadastrado');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b px-4 py-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-slate-100">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <FolderOpen className="w-6 h-6 text-indigo-600" />
              Central de Documentos
            </h1>
            <p className="text-sm text-slate-600">Propostas, análises e documentos prontos para envio</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Client Selection */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="p-4">
              <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Search className="w-5 h-5 text-indigo-600" />
                Selecionar Cliente
              </h3>
              
              <Input
                placeholder="Buscar cliente..."
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                className="mb-3"
              />

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredClients.slice(0, 20).map(client => (
                  <button
                    key={client.id}
                    onClick={() => setSelectedClient(client)}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                      selectedClient?.id === client.id
                        ? 'bg-indigo-50 border-indigo-500'
                        : 'bg-white border-slate-200 hover:border-indigo-300'
                    }`}
                  >
                    <p className="font-semibold text-slate-900">{client.first_name}</p>
                    {client.clinic_name && (
                      <p className="text-xs text-slate-600">{client.clinic_name}</p>
                    )}
                    <p className="text-xs text-slate-500">Score: {client.purchase_score}%</p>
                  </button>
                ))}
              </div>
            </Card>

            {selectedClient && (
              <Card className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50">
                <h4 className="font-bold text-slate-900 mb-2">Cliente Selecionado</h4>
                <p className="text-sm text-slate-700">{selectedClient.first_name}</p>
                <p className="text-xs text-slate-600">{selectedClient.clinic_name}</p>
                <p className="text-xs text-slate-500 mt-2">
                  {selectedClient.client_type} • {selectedClient.status}
                </p>
              </Card>
            )}
          </div>

          {/* Right Panel - Document Generation */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="p-6">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                Gerar Documento
              </h3>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <button
                  onClick={() => setDocType('proposal')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    docType === 'proposal'
                      ? 'bg-indigo-50 border-indigo-500'
                      : 'bg-white border-slate-200 hover:border-indigo-300'
                  }`}
                >
                  <File className="w-6 h-6 mx-auto mb-2 text-indigo-600" />
                  <p className="text-sm font-semibold">Proposta Comercial</p>
                </button>

                <button
                  onClick={() => setDocType('analysis')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    docType === 'analysis'
                      ? 'bg-purple-50 border-purple-500'
                      : 'bg-white border-slate-200 hover:border-purple-300'
                  }`}
                >
                  <Sparkles className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                  <p className="text-sm font-semibold">Análise Completa</p>
                </button>

                <button
                  onClick={() => setDocType('technical')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    docType === 'technical'
                      ? 'bg-emerald-50 border-emerald-500'
                      : 'bg-white border-slate-200 hover:border-emerald-300'
                  }`}
                >
                  <FileText className="w-6 h-6 mx-auto mb-2 text-emerald-600" />
                  <p className="text-sm font-semibold">Doc. Técnico</p>
                </button>
              </div>

              <Button
                onClick={generateDocument}
                disabled={!selectedClient || generating}
                className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Gerando documento...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Gerar Documento Completo
                  </>
                )}
              </Button>
            </Card>

            {generatedDoc && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-600" />
                    Documento Gerado
                  </h3>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleCopy}
                      size="sm"
                      variant="outline"
                      className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4 mr-1" />
                          Copiado!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-1" />
                          Copiar
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={handleDownload}
                      size="sm"
                      variant="outline"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Baixar
                    </Button>
                    {selectedClient?.phone && (
                      <Button
                        onClick={handleSendWhatsApp}
                        size="sm"
                        className="bg-green-500 hover:bg-green-600"
                      >
                        <MessageSquare className="w-4 h-4 mr-1" />
                        WhatsApp
                      </Button>
                    )}
                  </div>
                </div>

                <Textarea
                  value={generatedDoc}
                  onChange={(e) => setGeneratedDoc(e.target.value)}
                  className="min-h-[500px] font-mono text-sm"
                />
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
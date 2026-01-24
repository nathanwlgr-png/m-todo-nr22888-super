import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  Sparkles, Mail, MessageSquare, FileText, ArrowLeft, 
  Loader2, Save, Send, Copy, TrendingUp, Target
} from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function AIContentGenerator() {
  const queryClient = useQueryClient();
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState(null);
  const [contentType, setContentType] = useState('email');
  
  const [emailData, setEmailData] = useState({
    client_id: '',
    segment: '',
    funnel_stage: 'lead',
    product: '',
    tone: 'profissional'
  });

  const [socialData, setSocialData] = useState({
    segment: '',
    product: '',
    platform: 'facebook',
    objective: 'engajamento'
  });

  const [productData, setProductData] = useState({
    equipment_id: '',
    target_audience: 'clinicas_pequenas',
    content_type: 'descricao_completa'
  });

  const [followUpData, setFollowUpData] = useState({
    client_id: '',
    funnel_stage: 'proposta',
    previous_interaction: ''
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-updated_date', 500)
  });

  const { data: equipment = [] } = useQuery({
    queryKey: ['equipment'],
    queryFn: async () => {
      try {
        return await base44.entities.Equipment.list();
      } catch {
        return [];
      }
    }
  });

  const { data: equipmentMaterials = [] } = useQuery({
    queryKey: ['equipment-materials'],
    queryFn: async () => {
      try {
        return await base44.entities.EquipmentMaterial.list();
      } catch {
        return [];
      }
    }
  });

  const generateEmailCampaign = async () => {
    setGenerating(true);
    try {
      const client = clients.find(c => c.id === emailData.client_id);
      const selectedProduct = equipment.find(e => e.id === emailData.product) || 
                              equipmentMaterials.find(e => e.id === emailData.product);

      const prompt = `Crie um EMAIL DE VENDAS personalizado e persuasivo:

CLIENTE:
${client ? `- Nome: ${client.first_name}
- Clínica: ${client.clinic_name || 'N/A'}
- Cidade: ${client.city || 'N/A'}
- Status: ${client.status}
- Perfil Numerológico: ${client.numerology_number || 'N/A'}
- Dores: ${client.main_pains?.join(', ') || 'N/A'}` : `- Segmento: ${emailData.segment}`}

PRODUTO:
${selectedProduct ? `- Nome: ${selectedProduct.name || selectedProduct.equipment_name}
- Especificações: ${selectedProduct.technical_specs || selectedProduct.specifications || 'N/A'}
- Benefícios: ${selectedProduct.benefits?.join(', ') || 'N/A'}` : emailData.product}

ESTÁGIO: ${emailData.funnel_stage}
TOM: ${emailData.tone}

ESTRUTURA OBRIGATÓRIA:
1. ASSUNTO impactante (máx 60 caracteres)
2. SAUDAÇÃO personalizada
3. GANCHO - problema/necessidade do cliente
4. SOLUÇÃO - como o produto resolve
5. BENEFÍCIOS específicos (3-4 bullets)
6. GATILHOS de Cialdini (escassez, prova social, autoridade)
7. CTA claro e urgente
8. ASSINATURA profissional

Use SPIN Selling e gatilhos mentais. Personalize com dados do cliente.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            subject: { type: "string" },
            body: { type: "string" },
            cta: { type: "string" },
            best_time_to_send: { type: "string" }
          }
        }
      });

      setGeneratedContent({
        type: 'email',
        data: result,
        client_name: client?.first_name || emailData.segment,
        product_name: selectedProduct?.name || selectedProduct?.equipment_name || emailData.product
      });

      toast.success('Email gerado com sucesso!');
    } catch (error) {
      toast.error('Erro ao gerar email');
    } finally {
      setGenerating(false);
    }
  };

  const generateSocialPost = async () => {
    setGenerating(true);
    try {
      const selectedProduct = equipment.find(e => e.name === socialData.product) || 
                              equipmentMaterials.find(e => e.equipment_name === socialData.product);

      const prompt = `Crie POST para ${socialData.platform.toUpperCase()}:

PRODUTO: ${selectedProduct ? `${selectedProduct.name || selectedProduct.equipment_name}
Specs: ${selectedProduct.technical_specs || selectedProduct.specifications || 'N/A'}
Benefícios: ${selectedProduct.benefits?.join(', ') || 'N/A'}` : socialData.product}

SEGMENTO: ${socialData.segment}
OBJETIVO: ${socialData.objective}

FORMATO ${socialData.platform}:
- ${socialData.platform === 'instagram' ? 'Emojis, hashtags (10-15), visual' : ''}
- ${socialData.platform === 'facebook' ? 'Texto médio, envolvente' : ''}
- ${socialData.platform === 'linkedin' ? 'Profissional, técnico, case' : ''}

ESTRUTURA:
1. GANCHO viral (primeira linha)
2. PROBLEMA que o público enfrenta
3. SOLUÇÃO com o produto
4. BENEFÍCIOS tangíveis
5. PROVA SOCIAL ou estatística
6. CTA claro
${socialData.platform === 'instagram' || socialData.platform === 'facebook' ? '7. HASHTAGS estratégicas' : ''}

Tom: ${socialData.platform === 'linkedin' ? 'profissional e técnico' : 'envolvente e emocional'}`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            post_text: { type: "string" },
            hashtags: { type: "array", items: { type: "string" } },
            suggested_image_description: { type: "string" },
            best_time_to_post: { type: "string" }
          }
        }
      });

      setGeneratedContent({
        type: 'social',
        data: result,
        platform: socialData.platform,
        product_name: selectedProduct?.name || selectedProduct?.equipment_name || socialData.product
      });

      toast.success('Post gerado com sucesso!');
    } catch (error) {
      toast.error('Erro ao gerar post');
    } finally {
      setGenerating(false);
    }
  };

  const generateProductDescription = async () => {
    setGenerating(true);
    try {
      const selectedEquipment = equipment.find(e => e.id === productData.equipment_id) ||
                                equipmentMaterials.find(e => e.id === productData.equipment_id);

      if (!selectedEquipment) {
        toast.error('Selecione um produto');
        setGenerating(false);
        return;
      }

      const prompt = `Crie ${productData.content_type} para:

PRODUTO: ${selectedEquipment.name || selectedEquipment.equipment_name}
ESPECIFICAÇÕES: ${selectedEquipment.technical_specs || selectedEquipment.specifications || 'Equipamento veterinário avançado'}
PREÇO: R$ ${selectedEquipment.price || 'Consultar'}
PÚBLICO: ${productData.target_audience}

CONTEÚDO NECESSÁRIO:
${productData.content_type === 'descricao_completa' ? `
1. TÍTULO impactante
2. DESCRIÇÃO EXECUTIVA (2 parágrafos)
3. ESPECIFICAÇÕES TÉCNICAS detalhadas
4. BENEFÍCIOS PRINCIPAIS (5-7 itens)
5. APLICAÇÕES PRÁTICAS
6. DIFERENCIAIS COMPETITIVOS
7. CASOS DE USO
8. GARANTIA E SUPORTE
9. CTA forte` : ''}

${productData.content_type === 'ficha_tecnica' ? `
1. DADOS TÉCNICOS completos
2. PERFORMANCE
3. CAPACIDADE
4. DIMENSÕES
5. CONSUMO
6. REQUISITOS
7. CERTIFICAÇÕES` : ''}

${productData.content_type === 'pitch_vendas' ? `
1. PROBLEMA que resolve
2. SOLUÇÃO única
3. BENEFÍCIOS imediatos
4. ROI estimado
5. PROVA SOCIAL
6. URGÊNCIA
7. FECHAMENTO poderoso` : ''}

Use linguagem técnica e persuasiva. Adapte ao público ${productData.target_audience}.`;

      const result = await base44.integrations.Core.InvokeLLM({ prompt });

      setGeneratedContent({
        type: 'product',
        data: { content: result },
        product_name: selectedEquipment.name || selectedEquipment.equipment_name,
        content_type: productData.content_type
      });

      toast.success('Descrição gerada!');
    } catch (error) {
      toast.error('Erro ao gerar descrição');
    } finally {
      setGenerating(false);
    }
  };

  const generateFollowUp = async () => {
    setGenerating(true);
    try {
      const client = clients.find(c => c.id === followUpData.client_id);

      const prompt = `Crie SEQUÊNCIA DE FOLLOW-UP personalizada:

CLIENTE:
- Nome: ${client?.first_name || 'Cliente'}
- Clínica: ${client?.clinic_name || 'N/A'}
- Status: ${client?.status}
- Score: ${client?.purchase_score || 50}/100
- Última visita: ${client?.last_visit_date || 'N/A'}
- Objeções: ${client?.real_objections?.join(', ') || 'N/A'}

ESTÁGIO FUNIL: ${followUpData.funnel_stage}
INTERAÇÃO ANTERIOR: ${followUpData.previous_interaction || 'Primeira abordagem'}

Gere 3 MENSAGENS de follow-up espaçadas:

MENSAGEM 1 (Imediata - 24h após interação):
- Agradecer contato/reunião
- Reforçar valor discutido
- Pequeno insight adicional
- CTA leve

MENSAGEM 2 (3-5 dias):
- Caso de sucesso similar
- Novo benefício/informação
- Responder objeção prevista
- CTA médio

MENSAGEM 3 (7-10 dias):
- Urgência/escassez
- Proposta concreta
- Facilidade de decisão
- CTA forte

Use SPIN, gatilhos Cialdini, dados do cliente. Tom: ${client?.client_tone || 'profissional'}.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            message_1: {
              type: "object",
              properties: {
                timing: { type: "string" },
                subject: { type: "string" },
                body: { type: "string" },
                channel: { type: "string" }
              }
            },
            message_2: {
              type: "object",
              properties: {
                timing: { type: "string" },
                subject: { type: "string" },
                body: { type: "string" },
                channel: { type: "string" }
              }
            },
            message_3: {
              type: "object",
              properties: {
                timing: { type: "string" },
                subject: { type: "string" },
                body: { type: "string" },
                channel: { type: "string" }
              }
            }
          }
        }
      });

      setGeneratedContent({
        type: 'followup',
        data: result,
        client_name: client?.first_name,
        funnel_stage: followUpData.funnel_stage
      });

      toast.success('Sequência de follow-up gerada!');
    } catch (error) {
      toast.error('Erro ao gerar follow-up');
    } finally {
      setGenerating(false);
    }
  };

  const saveContent = async () => {
    try {
      let content = '';
      let title = '';

      if (generatedContent.type === 'email') {
        content = `ASSUNTO: ${generatedContent.data.subject}\n\n${generatedContent.data.body}\n\nMelhor horário: ${generatedContent.data.best_time_to_send}`;
        title = `Email - ${generatedContent.client_name}`;
      } else if (generatedContent.type === 'social') {
        content = `${generatedContent.data.post_text}\n\n${generatedContent.data.hashtags?.join(' ')}\n\nImagem sugerida: ${generatedContent.data.suggested_image_description}`;
        title = `Post ${generatedContent.platform} - ${generatedContent.product_name}`;
      } else if (generatedContent.type === 'product') {
        content = generatedContent.data.content;
        title = `${generatedContent.content_type} - ${generatedContent.product_name}`;
      } else if (generatedContent.type === 'followup') {
        content = `MENSAGEM 1 (${generatedContent.data.message_1.timing}):\n${generatedContent.data.message_1.body}\n\nMENSAGEM 2 (${generatedContent.data.message_2.timing}):\n${generatedContent.data.message_2.body}\n\nMENSAGEM 3 (${generatedContent.data.message_3.timing}):\n${generatedContent.data.message_3.body}`;
        title = `Follow-up - ${generatedContent.client_name}`;
      }

      await base44.entities.ClientDocument.create({
        client_id: 'system',
        client_name: generatedContent.client_name || 'Marketing',
        title,
        type: 'outros',
        file_url: 'data:text/plain;base64,' + btoa(content),
        notes: content.substring(0, 200)
      });

      queryClient.invalidateQueries(['all-documents']);
      toast.success('Conteúdo salvo!');
    } catch (error) {
      toast.error('Erro ao salvar');
    }
  };

  const copyContent = () => {
    let textToCopy = '';
    
    if (generatedContent.type === 'email') {
      textToCopy = `${generatedContent.data.subject}\n\n${generatedContent.data.body}`;
    } else if (generatedContent.type === 'social') {
      textToCopy = `${generatedContent.data.post_text}\n\n${generatedContent.data.hashtags?.join(' ')}`;
    } else if (generatedContent.type === 'product') {
      textToCopy = generatedContent.data.content;
    } else if (generatedContent.type === 'followup') {
      textToCopy = `MSG 1:\n${generatedContent.data.message_1.body}\n\nMSG 2:\n${generatedContent.data.message_2.body}\n\nMSG 3:\n${generatedContent.data.message_3.body}`;
    }

    navigator.clipboard.writeText(textToCopy);
    toast.success('Copiado!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 pb-20">
      <div className="sticky top-0 z-40 bg-gradient-to-br from-purple-900 via-pink-900 to-purple-900 px-4 py-4 shadow-lg">
        <div className="flex items-center gap-3">
          <Link to={createPageUrl('Home')}>
            <Button size="sm" variant="ghost" className="text-white">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Gerador de Conteúdo IA
            </h1>
            <p className="text-xs text-purple-300">Marketing e vendas automatizado</p>
          </div>
        </div>
      </div>

      <div className="p-4">
        <Tabs value={contentType} onValueChange={setContentType} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="email">
              <Mail className="w-4 h-4 mr-1" />
              Email
            </TabsTrigger>
            <TabsTrigger value="social">
              <MessageSquare className="w-4 h-4 mr-1" />
              Social
            </TabsTrigger>
            <TabsTrigger value="product">
              <FileText className="w-4 h-4 mr-1" />
              Produto
            </TabsTrigger>
            <TabsTrigger value="followup">
              <TrendingUp className="w-4 h-4 mr-1" />
              Follow-up
            </TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="space-y-4">
            <Card className="p-4">
              <h3 className="font-bold mb-3">Campanha de Email</h3>
              <div className="space-y-3">
                <Select value={emailData.client_id} onValueChange={(v) => setEmailData({...emailData, client_id: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Cliente específico (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.first_name} - {c.clinic_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input placeholder="Segmento (ex: clínicas pequenas)" value={emailData.segment} onChange={(e) => setEmailData({...emailData, segment: e.target.value})} />
                <Select value={emailData.funnel_stage} onValueChange={(v) => setEmailData({...emailData, funnel_stage: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lead">Lead (primeiro contato)</SelectItem>
                    <SelectItem value="qualificado">Qualificado</SelectItem>
                    <SelectItem value="proposta">Proposta enviada</SelectItem>
                    <SelectItem value="negociacao">Negociação</SelectItem>
                    <SelectItem value="fechamento">Fechamento</SelectItem>
                  </SelectContent>
                </Select>
                <Input placeholder="Produto/Equipamento" value={emailData.product} onChange={(e) => setEmailData({...emailData, product: e.target.value})} />
                <Select value={emailData.tone} onValueChange={(v) => setEmailData({...emailData, tone: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="profissional">Profissional</SelectItem>
                    <SelectItem value="amigavel">Amigável</SelectItem>
                    <SelectItem value="tecnico">Técnico</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={generateEmailCampaign} disabled={generating} className="w-full bg-purple-600">
                  {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                  Gerar Email
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="social" className="space-y-4">
            <Card className="p-4">
              <h3 className="font-bold mb-3">Post Redes Sociais</h3>
              <div className="space-y-3">
                <Select value={socialData.platform} onValueChange={(v) => setSocialData({...socialData, platform: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="instagram">Instagram</SelectItem>
                    <SelectItem value="facebook">Facebook</SelectItem>
                    <SelectItem value="linkedin">LinkedIn</SelectItem>
                  </SelectContent>
                </Select>
                <Input placeholder="Produto" value={socialData.product} onChange={(e) => setSocialData({...socialData, product: e.target.value})} />
                <Input placeholder="Segmento alvo" value={socialData.segment} onChange={(e) => setSocialData({...socialData, segment: e.target.value})} />
                <Select value={socialData.objective} onValueChange={(v) => setSocialData({...socialData, objective: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="engajamento">Engajamento</SelectItem>
                    <SelectItem value="vendas">Vendas diretas</SelectItem>
                    <SelectItem value="educacao">Educação</SelectItem>
                    <SelectItem value="promocao">Promoção</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={generateSocialPost} disabled={generating} className="w-full bg-pink-600">
                  {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                  Gerar Post
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="product" className="space-y-4">
            <Card className="p-4">
              <h3 className="font-bold mb-3">Descrição de Produto</h3>
              <div className="space-y-3">
                <Select value={productData.equipment_id} onValueChange={(v) => setProductData({...productData, equipment_id: v})}>
                  <SelectTrigger><SelectValue placeholder="Selecione o equipamento" /></SelectTrigger>
                  <SelectContent>
                    {[...equipment, ...equipmentMaterials].map(e => (
                      <SelectItem key={e.id} value={e.id}>{e.name || e.equipment_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={productData.target_audience} onValueChange={(v) => setProductData({...productData, target_audience: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clinicas_pequenas">Clínicas Pequenas</SelectItem>
                    <SelectItem value="clinicas_medias">Clínicas Médias</SelectItem>
                    <SelectItem value="hospitais">Hospitais</SelectItem>
                    <SelectItem value="laboratorios">Laboratórios</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={productData.content_type} onValueChange={(v) => setProductData({...productData, content_type: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="descricao_completa">Descrição Completa</SelectItem>
                    <SelectItem value="ficha_tecnica">Ficha Técnica</SelectItem>
                    <SelectItem value="pitch_vendas">Pitch de Vendas</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={generateProductDescription} disabled={generating} className="w-full bg-indigo-600">
                  {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                  Gerar Descrição
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="followup" className="space-y-4">
            <Card className="p-4">
              <h3 className="font-bold mb-3">Sequência Follow-up</h3>
              <div className="space-y-3">
                <Select value={followUpData.client_id} onValueChange={(v) => setFollowUpData({...followUpData, client_id: v})}>
                  <SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger>
                  <SelectContent>
                    {clients.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.first_name} - {c.clinic_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={followUpData.funnel_stage} onValueChange={(v) => setFollowUpData({...followUpData, funnel_stage: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="qualificado">Qualificado</SelectItem>
                    <SelectItem value="proposta">Proposta</SelectItem>
                    <SelectItem value="negociacao">Negociação</SelectItem>
                  </SelectContent>
                </Select>
                <Textarea placeholder="Última interação (opcional)" value={followUpData.previous_interaction} onChange={(e) => setFollowUpData({...followUpData, previous_interaction: e.target.value})} rows={3} />
                <Button onClick={generateFollowUp} disabled={generating} className="w-full bg-blue-600">
                  {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                  Gerar Sequência
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {generatedContent && (
          <Card className="p-4 mt-4 bg-white">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold">✨ Conteúdo Gerado</h3>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={copyContent}>
                  <Copy className="w-3 h-3" />
                </Button>
                <Button size="sm" variant="outline" onClick={saveContent}>
                  <Save className="w-3 h-3" />
                </Button>
              </div>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg max-h-96 overflow-y-auto">
              {generatedContent.type === 'email' && (
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-600 mb-1">ASSUNTO:</p>
                    <p className="font-bold">{generatedContent.data.subject}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-600 mb-1">MENSAGEM:</p>
                    <p className="whitespace-pre-line text-sm">{generatedContent.data.body}</p>
                  </div>
                  <Badge className="bg-green-600">Enviar: {generatedContent.data.best_time_to_send}</Badge>
                </div>
              )}
              {generatedContent.type === 'social' && (
                <div className="space-y-3">
                  <p className="whitespace-pre-line text-sm">{generatedContent.data.post_text}</p>
                  <p className="text-blue-600 text-sm">{generatedContent.data.hashtags?.join(' ')}</p>
                  <div className="p-2 bg-slate-100 rounded text-xs">
                    <strong>Imagem:</strong> {generatedContent.data.suggested_image_description}
                  </div>
                </div>
              )}
              {generatedContent.type === 'product' && (
                <p className="whitespace-pre-line text-sm">{generatedContent.data.content}</p>
              )}
              {generatedContent.type === 'followup' && (
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50 rounded">
                    <Badge className="mb-2">MSG 1 - {generatedContent.data.message_1.timing}</Badge>
                    <p className="text-xs font-semibold mb-1">{generatedContent.data.message_1.subject}</p>
                    <p className="text-sm whitespace-pre-line">{generatedContent.data.message_1.body}</p>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded">
                    <Badge className="mb-2">MSG 2 - {generatedContent.data.message_2.timing}</Badge>
                    <p className="text-xs font-semibold mb-1">{generatedContent.data.message_2.subject}</p>
                    <p className="text-sm whitespace-pre-line">{generatedContent.data.message_2.body}</p>
                  </div>
                  <div className="p-3 bg-red-50 rounded">
                    <Badge className="mb-2">MSG 3 - {generatedContent.data.message_3.timing}</Badge>
                    <p className="text-xs font-semibold mb-1">{generatedContent.data.message_3.subject}</p>
                    <p className="text-sm whitespace-pre-line">{generatedContent.data.message_3.body}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
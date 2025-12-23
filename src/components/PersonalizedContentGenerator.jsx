import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Sparkles, Copy, Send } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Gerador de Conteúdo Personalizado por Cliente
 * Cria mensagens, propostas e materiais adaptados ao perfil específico
 */
export default function PersonalizedContentGenerator() {
  const [selectedClient, setSelectedClient] = useState('');
  const [contentType, setContentType] = useState('whatsapp');
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState(null);

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-updated_date', 100),
  });

  const generateContent = async () => {
    if (!selectedClient) {
      toast.error('Selecione um cliente');
      return;
    }

    setGenerating(true);
    try {
      const client = clients.find(c => c.id === selectedClient);
      if (!client) {
        toast.error('Cliente não encontrado');
        setSelectedClient('');
        setGenerating(false);
        return;
      }
      
      const content = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um especialista em vendas consultivas B2B para medicina veterinária.

📋 PERFIL DO CLIENTE:
Nome: ${client.first_name}
Empresa: ${client.clinic_name || 'N/A'}
Porte: ${client.company_size || 'N/A'}
Tipo: ${client.client_type || 'N/A'}
Status: ${client.status}
Score: ${client.purchase_score}%
Numerologia: ${client.numerology_number} - ${client.behavioral_profile}
Estilo de comunicação: ${client.client_tone || 'profissional'}
Dores: ${client.main_pains?.join(', ') || 'N/A'}
Objeções: ${client.real_objections?.join(', ') || 'N/A'}
Equipamento atual: ${client.current_equipment || 'N/A'}

🎯 TIPO DE CONTEÚDO: ${contentType === 'whatsapp' ? 'Mensagem WhatsApp' : contentType === 'email' ? 'Email comercial' : contentType === 'proposta' ? 'Proposta comercial' : 'Apresentação executiva'}

Gere conteúdo ALTAMENTE PERSONALIZADO considerando:
1. Perfil numerológico (adapte tom e abordagem)
2. Porte da empresa (linguagem apropriada)
3. Dores específicas identificadas
4. Objeções prévias (antecipe e resolva)
5. Equipamento atual (compare vantagens)
6. Status atual (urgência adequada)

${contentType === 'whatsapp' ? `
MENSAGEM WHATSAPP (200-300 palavras):
- Saudação personalizada
- Gancho baseado em dor específica
- Proposta de valor clara
- CTA direto mas respeitoso
- Emoji estratégicos (sem exagero)
` : contentType === 'email' ? `
EMAIL COMERCIAL:
- Subject line magnético
- Abertura personalizada
- 3 parágrafos curtos
- Bullets de benefícios
- CTA claro
- Assinatura profissional
` : contentType === 'proposta' ? `
ESTRUTURA DE PROPOSTA:
- Executive summary
- Situação atual vs desejada
- Solução proposta
- Investimento e ROI
- Próximos passos
` : `
APRESENTAÇÃO EXECUTIVA:
- Slide 1: Problema identificado
- Slide 2: Solução
- Slide 3: Diferenciais
- Slide 4: Cases similares
- Slide 5: Proposta de valor
`}`,
        response_json_schema: {
          type: "object",
          properties: {
            content: { type: "string" },
            subject: { type: "string" },
            reasoning: { type: "string" },
            best_time_to_send: { type: "string" },
            follow_up_suggestion: { type: "string" }
          }
        }
      });

      setGeneratedContent(content);
      toast.success('✨ Conteúdo personalizado gerado!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao gerar conteúdo');
    } finally {
      setGenerating(false);
    }
  };

  const copyContent = async () => {
    await navigator.clipboard.writeText(generatedContent.content);
    toast.success('📋 Copiado!');
  };

  const sendWhatsApp = () => {
    const client = clients.find(c => c.id === selectedClient);
    if (!client) {
      toast.error('Cliente não encontrado');
      setSelectedClient('');
      return;
    }
    if (client.phone) {
      window.open(`https://wa.me/${client.phone}?text=${encodeURIComponent(generatedContent.content)}`, '_blank');
    } else {
      toast.error('Cliente sem WhatsApp cadastrado');
    }
  };

  return (
    <Card className="p-5 bg-gradient-to-br from-violet-50 to-purple-50 border-violet-200 shadow-lg">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-slate-800">Conteúdo Personalizado IA</h3>
          <p className="text-xs text-slate-600">Mensagens adaptadas ao perfil do cliente</p>
        </div>
      </div>

      <div className="space-y-3">
        <Select value={selectedClient} onValueChange={setSelectedClient}>
          <SelectTrigger>
            <SelectValue placeholder="Selecionar cliente..." />
          </SelectTrigger>
          <SelectContent>
            {clients.map(c => (
              <SelectItem key={c.id} value={c.id}>
                {c.first_name} - {c.clinic_name || 'N/A'} ({c.status})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={contentType} onValueChange={setContentType}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="whatsapp">💬 WhatsApp</SelectItem>
            <SelectItem value="email">📧 Email</SelectItem>
            <SelectItem value="proposta">📄 Proposta</SelectItem>
            <SelectItem value="apresentacao">📊 Apresentação</SelectItem>
          </SelectContent>
        </Select>

        <Button
          onClick={generateContent}
          disabled={generating || !selectedClient}
          className="w-full bg-violet-600 hover:bg-violet-700"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Gerando...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Gerar Conteúdo
            </>
          )}
        </Button>

        {generatedContent && (
          <div className="space-y-3 pt-3 border-t border-violet-200">
            {generatedContent.subject && (
              <div className="p-3 bg-white rounded-lg">
                <p className="text-xs font-semibold text-violet-600 mb-1">Assunto:</p>
                <p className="text-sm font-semibold">{generatedContent.subject}</p>
              </div>
            )}

            <div className="p-3 bg-white rounded-lg max-h-60 overflow-y-auto">
              <p className="text-sm whitespace-pre-line">{generatedContent.content}</p>
            </div>

            <div className="p-3 bg-violet-100 rounded-lg">
              <p className="text-xs font-semibold text-violet-800 mb-1">💡 Estratégia:</p>
              <p className="text-xs text-slate-700">{generatedContent.reasoning}</p>
              <p className="text-xs text-violet-600 mt-2">⏰ Melhor horário: {generatedContent.best_time_to_send}</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button size="sm" variant="outline" onClick={copyContent}>
                <Copy className="w-3 h-3 mr-1" />
                Copiar
              </Button>
              {contentType === 'whatsapp' && (
                <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={sendWhatsApp}>
                  <Send className="w-3 h-3 mr-1" />
                  Enviar
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Calendar as CalendarIcon, Sparkles, Loader2, Target, Zap } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import CampaignAIGenerator from '@/components/CampaignAIGenerator';

export default function NewCampaign() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [generating, setGenerating] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    objective: '',
    equipment_focus: '',
    budget: '',
    start_date: null,
    end_date: null,
    channels: [],
    target_audience: {
      client_types: [],
      status: [],
      cities: [],
      min_score: 0
    },
    metrics: {
      target_leads: 0,
      target_meetings: 0,
      target_sales: 0,
      target_revenue: 0
    }
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-updated_date', 500),
  });

  const { data: equipmentMaterials = [] } = useQuery({
    queryKey: ['equipment-materials'],
    queryFn: () => base44.entities.EquipmentMaterial.list('-created_date', 100),
  });

  const createCampaignMutation = useMutation({
    mutationFn: (data) => base44.entities.Campaign.create(data),
    onSuccess: (campaign) => {
      queryClient.invalidateQueries(['campaigns']);
      toast.success('Campanha criada com sucesso!');
      navigate(createPageUrl(`CampaignDetails?id=${campaign.id}`));
    },
  });

  const generateWithAI = async () => {
    if (!formData.name || !formData.equipment_focus) {
      toast.error('Preencha nome e equipamento foco');
      return;
    }

    setGenerating(true);
    try {
      // Buscar clientes que se encaixam no perfil
      const targetClients = clients.filter(c => {
        if (formData.target_audience.status.length && !formData.target_audience.status.includes(c.status)) return false;
        if (formData.target_audience.min_score && (c.purchase_score || 0) < formData.target_audience.min_score) return false;
        if (formData.target_audience.cities.length && !formData.target_audience.cities.includes(c.city)) return false;
        return true;
      });

      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um especialista em marketing veterinário. Crie conteúdo COMPLETO para uma campanha de vendas:

CAMPANHA: ${formData.name}
OBJETIVO: ${formData.objective}
EQUIPAMENTO FOCO: ${formData.equipment_focus}
PÚBLICO-ALVO: ${targetClients.length} clientes qualificados
CANAIS: ${formData.channels.join(', ')}

Para CADA cliente nesta lista, crie conteúdo personalizado:
${targetClients.slice(0, 10).map(c => `- ${c.first_name} (${c.clinic_name || 'N/A'}) - Status: ${c.status}, Score: ${c.purchase_score || 0}`).join('\n')}

GERE PARA CADA CLIENTE:

1. MENSAGEM WHATSAPP (100-150 palavras):
   - Saudação personalizada com nome
   - Mencionar necessidade específica da clínica
   - Apresentar o equipamento ${formData.equipment_focus}
   - Frases de impacto
   - Call-to-action claro

2. EMAIL COMPLETO:
   - Assunto impactante
   - Corpo do email (200-300 palavras)
   - Benefícios técnicos
   - Oferta especial da campanha
   - Link para agendar reunião

3. FRASES DE EFEITO (5 frases):
   - Curtas e impactantes
   - Focadas em benefícios
   - Criativas para vídeos/posts

4. MATERIAL TÉCNICO RESUMIDO:
   - Principais especificações
   - Diferenciais competitivos
   - ROI estimado

Seja criativo, persuasivo e técnico ao mesmo tempo!`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            whatsapp_template: { type: "string" },
            email_subject: { type: "string" },
            email_body: { type: "string" },
            catchphrases: { type: "array", items: { type: "string" } },
            technical_summary: { type: "string" },
            personalized_messages: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  client_name: { type: "string" },
                  whatsapp_message: { type: "string" },
                  email_body: { type: "string" },
                  recommended_approach: { type: "string" }
                }
              }
            },
            campaign_strategy: { type: "string" },
            best_send_time: { type: "string" }
          }
        }
      });

      const campaignData = {
        ...formData,
        budget: parseFloat(formData.budget) || 0,
        start_date: format(formData.start_date, 'yyyy-MM-dd'),
        end_date: format(formData.end_date, 'yyyy-MM-dd'),
        status: 'rascunho',
        automated_content: {
          whatsapp_message: analysis.whatsapp_template,
          email_subject: analysis.email_subject,
          email_body: analysis.email_body,
          catchphrases: analysis.catchphrases,
          technical_material_url: analysis.technical_summary,
        },
        target_clients: targetClients.map(c => c.id),
        metrics: {
          ...formData.metrics,
          current_leads: 0,
          current_meetings: 0,
          current_sales: 0,
          current_revenue: 0
        }
      };

      await createCampaignMutation.mutateAsync(campaignData);

    } catch (error) {
      console.error('Erro ao gerar campanha:', error);
      toast.error('Erro ao gerar conteúdo da campanha');
    } finally {
      setGenerating(false);
    }
  };

  const toggleChannel = (channel) => {
    setFormData(prev => ({
      ...prev,
      channels: prev.channels.includes(channel)
        ? prev.channels.filter(c => c !== channel)
        : [...prev.channels, channel]
    }));
  };

  const toggleStatus = (status) => {
    setFormData(prev => ({
      ...prev,
      target_audience: {
        ...prev.target_audience,
        status: prev.target_audience.status.includes(status)
          ? prev.target_audience.status.filter(s => s !== status)
          : [...prev.target_audience.status, status]
      }
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="bg-gradient-to-br from-purple-900 to-indigo-900 px-4 pt-4 pb-8">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full glass hover:bg-white/10">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-white">Nova Campanha</h1>
            <p className="text-sm text-purple-200">Passo {step} de 3</p>
          </div>
        </div>

        <div className="flex gap-2">
          {[1, 2, 3].map(s => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full ${s <= step ? 'bg-white' : 'bg-white/20'}`}
            />
          ))}
        </div>
      </div>

      <div className="px-4 -mt-4 space-y-4">
        {/* AI Strategy Generator */}
        <CampaignAIGenerator
          onStrategyGenerated={(aiStrategy) => {
            setFormData({
              ...formData,
              ...aiStrategy
            });
            toast.success('Formulário preenchido com estratégia IA!');
            setStep(1);
          }}
        />

        {step === 1 && (
          <Card className="p-6 space-y-4">
            <h2 className="font-semibold text-lg flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-600" />
              Informações Básicas
            </h2>

            <div>
              <Label>Nome da Campanha *</Label>
              <Input
                placeholder="Ex: Lançamento BC-2800 Q2 2025"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <Label>Objetivo *</Label>
              <Textarea
                placeholder="Descreva o objetivo da campanha..."
                value={formData.objective}
                onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
                rows={3}
              />
            </div>

            <div>
              <Label>Equipamento Foco *</Label>
              <Select
                value={formData.equipment_focus}
                onValueChange={(value) => setFormData({ ...formData, equipment_focus: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o equipamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BC-2800">BC-2800 - Analisador Hematológico</SelectItem>
                  <SelectItem value="VBC30">VBC30 - Analisador Veterinário</SelectItem>
                  <SelectItem value="VBC50A">VBC50A - Analisador Avançado</SelectItem>
                  <SelectItem value="SMT-120VP">SMT-120VP - Sistema Completo</SelectItem>
                  <SelectItem value="VG1">VG1 - Gasometria</SelectItem>
                  <SelectItem value="VG2">VG2 - Gasometria Avançada</SelectItem>
                  <SelectItem value="Vi1">Vi1 - Imunofluorescência</SelectItem>
                  <SelectItem value="QT3">QT3 - Bioquímico</SelectItem>
                  <SelectItem value="3DX">3DX - Diagnóstico Rápido</SelectItem>
                  <SelectItem value="VQ1">VQ1 - PCR</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Data Início *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      {formData.start_date ? format(formData.start_date, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecione'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent>
                    <Calendar
                      mode="single"
                      selected={formData.start_date}
                      onSelect={(date) => setFormData({ ...formData, start_date: date })}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label>Data Fim *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      {formData.end_date ? format(formData.end_date, 'dd/MM/yyyy', { locale: ptBR }) : 'Selecione'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent>
                    <Calendar
                      mode="single"
                      selected={formData.end_date}
                      onSelect={(date) => setFormData({ ...formData, end_date: date })}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div>
              <Label>Orçamento (R$)</Label>
              <Input
                type="number"
                placeholder="0"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
              />
            </div>

            <Button
              onClick={() => setStep(2)}
              disabled={!formData.name || !formData.objective || !formData.equipment_focus || !formData.start_date || !formData.end_date}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              Próximo
            </Button>
          </Card>
        )}

        {step === 2 && (
          <Card className="p-6 space-y-4">
            <h2 className="font-semibold text-lg">Público-Alvo</h2>

            <div>
              <Label className="mb-2 block">Status dos Clientes</Label>
              <div className="space-y-2">
                {['quente', 'morno', 'frio'].map(status => (
                  <div key={status} className="flex items-center gap-2">
                    <Checkbox
                      checked={formData.target_audience.status.includes(status)}
                      onCheckedChange={() => toggleStatus(status)}
                    />
                    <span className="capitalize">{status}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>Score Mínimo</Label>
              <Input
                type="number"
                placeholder="0-100"
                value={formData.target_audience.min_score}
                onChange={(e) => setFormData({
                  ...formData,
                  target_audience: { ...formData.target_audience, min_score: parseInt(e.target.value) || 0 }
                })}
              />
            </div>

            <div>
              <Label className="mb-2 block">Canais de Comunicação</Label>
              <div className="space-y-2">
                {['whatsapp', 'email', 'telefone', 'visita'].map(channel => (
                  <div key={channel} className="flex items-center gap-2">
                    <Checkbox
                      checked={formData.channels.includes(channel)}
                      onCheckedChange={() => toggleChannel(channel)}
                    />
                    <span className="capitalize">{channel}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Voltar
              </Button>
              <Button onClick={() => setStep(3)} className="flex-1 bg-purple-600 hover:bg-purple-700">
                Próximo
              </Button>
            </div>
          </Card>
        )}

        {step === 3 && (
          <Card className="p-6 space-y-4">
            <h2 className="font-semibold text-lg">Métricas de Sucesso</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Meta de Leads</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={formData.metrics.target_leads}
                  onChange={(e) => setFormData({
                    ...formData,
                    metrics: { ...formData.metrics, target_leads: parseInt(e.target.value) || 0 }
                  })}
                />
              </div>

              <div>
                <Label>Meta de Reuniões</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={formData.metrics.target_meetings}
                  onChange={(e) => setFormData({
                    ...formData,
                    metrics: { ...formData.metrics, target_meetings: parseInt(e.target.value) || 0 }
                  })}
                />
              </div>

              <div>
                <Label>Meta de Vendas</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={formData.metrics.target_sales}
                  onChange={(e) => setFormData({
                    ...formData,
                    metrics: { ...formData.metrics, target_sales: parseInt(e.target.value) || 0 }
                  })}
                />
              </div>

              <div>
                <Label>Meta de Receita (R$)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={formData.metrics.target_revenue}
                  onChange={(e) => setFormData({
                    ...formData,
                    metrics: { ...formData.metrics, target_revenue: parseInt(e.target.value) || 0 }
                  })}
                />
              </div>
            </div>

            <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg">
              <h3 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Geração Automática com IA
              </h3>
              <p className="text-sm text-purple-700 mb-3">
                Nossa IA vai criar mensagens personalizadas de WhatsApp, emails, frases de efeito e material técnico para cada cliente!
              </p>
              <Button
                onClick={generateWithAI}
                disabled={generating}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Gerando Campanha...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Gerar Campanha com IA
                  </>
                )}
              </Button>
            </div>

            <Button variant="outline" onClick={() => setStep(2)} className="w-full">
              Voltar
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
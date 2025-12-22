import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ArrowLeft, 
  Save,
  AlertCircle,
  Lightbulb,
  ArrowRight,
  Loader2,
  Check,
  ThermometerSun,
  Sparkles,
  TrendingUp,
  Target,
  MessageCircle
} from 'lucide-react';
import ScoreBar from '@/components/ScoreBar';

export default function VisitSummary() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const clientId = urlParams.get('id');
  
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [insights, setInsights] = useState(null);
  const [analyzingInsights, setAnalyzingInsights] = useState(false);
  const [formData, setFormData] = useState({
    main_pains: [],
    triggers_used: [],
    next_action: '',
    status: '',
    purchase_score: 50,
    notes: '',
    client_tone: '',
    recommended_communication: ''
  });

  const { data: client, isLoading } = useQuery({
    queryKey: ['client', clientId],
    queryFn: async () => {
      if (!clientId) return null;
      const clients = await base44.entities.Client.filter({ id: clientId });
      const c = clients[0];
      if (c) {
        setFormData({
          main_pains: c.main_pains || [],
          triggers_used: c.triggers_used || [],
          next_action: c.next_action || '',
          status: c.status || 'morno',
          purchase_score: c.purchase_score || 50,
          notes: c.notes || '',
          client_tone: c.client_tone || '',
          recommended_communication: c.recommended_communication || ''
        });
      }
      return c;
    },
    enabled: !!clientId
  });

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      if (!clientId) throw new Error('Client ID not found');
      await base44.entities.Client.update(clientId, data);
      
      // AUTOMAÇÃO: Criar tarefa de follow-up após visita realizada
      try {
        const followUpDate = new Date();
        followUpDate.setDate(followUpDate.getDate() + 2);
        
        await base44.entities.Task.create({
          client_id: clientId,
          client_name: client?.first_name || 'Cliente',
          title: 'Follow-up após visita',
          description: `Fazer follow-up da visita realizada. Status atual: ${data.status}`,
          due_date: followUpDate.toISOString().split('T')[0],
          status: 'pendente',
          priority: data.status === 'quente' ? 'alta' : 'media',
          type: 'follow_up',
          auto_created: true
        });
      } catch (error) {
        console.log('Follow-up task automation failed');
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['client', clientId]);
      setSaved(true);
      setTimeout(() => {
        navigate(createPageUrl(`PostVisitAnalysis?id=${clientId}`));
      }, 1500);
    }
  });

  const handleSave = async () => {
    setSaving(true);
    await updateMutation.mutateAsync({
      ...formData,
      last_visit_date: new Date().toISOString().split('T')[0]
    });
    setSaving(false);
  };

  const commonPains = [
    'Demora nos resultados (terceirização)',
    'Custo alto de envio para laboratórios',
    'Perda de clientes por espera',
    'Equipamento atual desatualizado',
    'Resultados imprecisos/duvidosos',
    'Falta de autonomia diagnóstica',
    'Necessidade de repetir exames',
    'Custos de reagentes elevados'
  ];

  const commonTriggers = [
    'ROI e economia comprovada',
    'Casos de sucesso de clínicas similares',
    'Agilidade no diagnóstico',
    'Autonomia e independência',
    'Fidelização de clientes',
    'Diferencial competitivo'
  ];

  const togglePain = (pain) => {
    setFormData(prev => ({
      ...prev,
      main_pains: prev.main_pains.includes(pain)
        ? prev.main_pains.filter(p => p !== pain)
        : [...prev.main_pains, pain]
    }));
  };

  const toggleTrigger = (trigger) => {
    setFormData(prev => ({
      ...prev,
      triggers_used: prev.triggers_used.includes(trigger)
        ? prev.triggers_used.filter(t => t !== trigger)
        : [...prev.triggers_used, trigger]
    }));
  };

  const generateInsights = async () => {
    setAnalyzingInsights(true);
    
    const prompt = `
Analise este resumo de visita de vendas de EQUIPAMENTOS LABORATORIAIS VETERINÁRIOS (analisadores hematológicos, bioquímicos, contadores de células) e forneça insights estratégicos:

Cliente: ${client?.first_name}
Tipo: ${client?.client_type}
Perfil: ${client?.behavioral_profile}
Status: ${formData.status}
Score: ${formData.purchase_score}%

Dores identificadas: ${formData.main_pains.join(', ') || 'Nenhuma'}
Gatilhos utilizados: ${formData.triggers_used.join(', ') || 'Nenhum'}
Observações: ${formData.notes || 'Sem observações'}

Forneça em português brasileiro:
1. key_takeaways: Array com 3 pontos principais da visita (frases curtas e objetivas)
2. strategy_adjustments: Array com 2-3 ajustes estratégicos recomendados (foco em equipamentos laboratoriais)
3. opportunities: Array com 2-3 oportunidades específicas de equipamentos complementares (ex: se tem analisador bioquímico, sugerir hematológico; reagentes; manutenção; treinamento; upgrades)
4. projected_revenue: Número estimado de receita potencial desta venda em R$ (considere equipamentos entre 15k-80k)
5. probability_percentage: Porcentagem de probabilidade de fechamento (0-100) baseado no status e observações
6. recommended_next_steps: Array com 2-3 próximos passos específicos e práticos

Seja direto, prático e focado em ação. Pense em ROI, economia com terceirização, agilidade diagnóstica.
    `;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: prompt,
      response_json_schema: {
        type: "object",
        properties: {
          key_takeaways: { type: "array", items: { type: "string" } },
          strategy_adjustments: { type: "array", items: { type: "string" } },
          opportunities: { type: "array", items: { type: "string" } },
          projected_revenue: { type: "number" },
          probability_percentage: { type: "number" },
          recommended_next_steps: { type: "array", items: { type: "string" } }
        }
      }
    });

    setInsights(response);
    setAnalyzingInsights(false);
  };

  if (!clientId) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">ID do cliente não encontrado</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-500 mb-4">Cliente não encontrado</p>
          <Button onClick={() => navigate(createPageUrl('Home'))}>
            Voltar para Home
          </Button>
        </div>
      </div>
    );
  }

  if (saved) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-emerald-100 rounded-full flex items-center justify-center">
            <Check className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Cliente Salvo!</h2>
          <p className="text-slate-500 mt-2">Redirecionando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* Header */}
      <div className="bg-white border-b px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-slate-100">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-slate-800">Resumo da Visita</h1>
            <p className="text-sm text-slate-500">{client?.first_name}</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-5">
        {/* Status */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <ThermometerSun className="w-5 h-5 text-slate-600" />
            <h3 className="font-semibold text-slate-700">Status do Cliente</h3>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {['quente', 'morno', 'frio'].map((status) => (
              <Button
                key={status}
                variant={formData.status === status ? 'default' : 'outline'}
                onClick={() => setFormData(prev => ({ ...prev, status }))}
                className={`h-12 ${
                  formData.status === status
                    ? status === 'quente' ? 'bg-red-500 hover:bg-red-600' :
                      status === 'morno' ? 'bg-yellow-500 hover:bg-yellow-600' :
                      'bg-blue-400 hover:bg-blue-500'
                    : ''
                }`}
              >
                {status === 'quente' ? '🔥' : status === 'morno' ? '🌡️' : '❄️'}
                <span className="ml-1 capitalize">{status}</span>
              </Button>
            ))}
          </div>
        </Card>

        {/* Score */}
        <Card className="p-4">
          <ScoreBar score={formData.purchase_score} />
          <input
            type="range"
            min="0"
            max="100"
            value={formData.purchase_score}
            onChange={(e) => setFormData(prev => ({ ...prev, purchase_score: parseInt(e.target.value) }))}
            className="w-full mt-4 accent-indigo-600"
          />
        </Card>

        {/* Main Pains */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5 text-slate-600" />
            <h3 className="font-semibold text-slate-700">Principais Dores</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {commonPains.map((pain) => (
              <Badge
                key={pain}
                variant={formData.main_pains.includes(pain) ? 'default' : 'outline'}
                className={`cursor-pointer py-2 px-3 ${
                  formData.main_pains.includes(pain)
                    ? 'bg-red-100 text-red-700 border-red-200'
                    : 'hover:bg-slate-50'
                }`}
                onClick={() => togglePain(pain)}
              >
                {pain}
              </Badge>
            ))}
          </div>
        </Card>

        {/* Triggers Used */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-5 h-5 text-slate-600" />
            <h3 className="font-semibold text-slate-700">Gatilhos Utilizados</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {commonTriggers.map((trigger) => (
              <Badge
                key={trigger}
                variant={formData.triggers_used.includes(trigger) ? 'default' : 'outline'}
                className={`cursor-pointer py-2 px-3 ${
                  formData.triggers_used.includes(trigger)
                    ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                    : 'hover:bg-slate-50'
                }`}
                onClick={() => toggleTrigger(trigger)}
              >
                {trigger}
              </Badge>
            ))}
          </div>
        </Card>

        {/* Next Action */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <ArrowRight className="w-5 h-5 text-slate-600" />
            <h3 className="font-semibold text-slate-700">Próxima Ação</h3>
          </div>
          <Select
            value={formData.next_action}
            onValueChange={(value) => setFormData(prev => ({ ...prev, next_action: value }))}
          >
            <SelectTrigger className="h-12 rounded-xl">
              <SelectValue placeholder="Selecione a próxima ação" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Enviar proposta comercial detalhada">Enviar proposta comercial detalhada</SelectItem>
              <SelectItem value="Agendar demonstração técnica in loco">Agendar demonstração técnica in loco</SelectItem>
              <SelectItem value="Enviar especificações técnicas e estudos">Enviar especificações técnicas e estudos</SelectItem>
              <SelectItem value="Calcular ROI personalizado">Calcular ROI personalizado</SelectItem>
              <SelectItem value="Follow-up em 3 dias">Follow-up em 3 dias</SelectItem>
              <SelectItem value="Follow-up em 1 semana">Follow-up em 1 semana</SelectItem>
              <SelectItem value="Agendar visita de fechamento">Agendar visita de fechamento</SelectItem>
              <SelectItem value="Aguardar aprovação do orçamento">Aguardar aprovação do orçamento</SelectItem>
            </SelectContent>
          </Select>
        </Card>

        {/* Client Tone */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <MessageCircle className="w-5 h-5 text-slate-600" />
            <h3 className="font-semibold text-slate-700">Tom de Voz do Cliente</h3>
          </div>
          <Select
            value={formData.client_tone}
            onValueChange={async (value) => {
              setFormData(prev => ({ ...prev, client_tone: value }));
              
              // Gerar sugestão de comunicação automaticamente
              const prompt = `
Cliente: ${client?.first_name}
Número Numerológico: ${client?.numerology_number}
Perfil: ${client?.behavioral_profile}
Tom de voz observado: ${value}

Com base na Numerologia Pitagórica e no tom de voz, sugira em 2-3 frases:
- O melhor estilo de comunicação para esse cliente
- Como adaptar a abordagem de vendas
- Tipo de linguagem ideal (técnica, emocional, visual, etc)
              `;
              
              const response = await base44.integrations.Core.InvokeLLM({ prompt });
              setFormData(prev => ({ ...prev, recommended_communication: response }));
            }}
          >
            <SelectTrigger className="h-12 rounded-xl">
              <SelectValue placeholder="Como o cliente se comunicou?" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="assertivo">Assertivo - Direto e objetivo</SelectItem>
              <SelectItem value="analitico">Analítico - Detalhista e questionador</SelectItem>
              <SelectItem value="receptivo">Receptivo - Aberto e colaborativo</SelectItem>
              <SelectItem value="entusiasmado">Entusiasmado - Energético e animado</SelectItem>
              <SelectItem value="cauteloso">Cauteloso - Cuidadoso e ponderado</SelectItem>
              <SelectItem value="direto">Direto - Prático e sem rodeios</SelectItem>
              <SelectItem value="emocional">Emocional - Valoriza relacionamento</SelectItem>
            </SelectContent>
          </Select>
        </Card>

        {/* Recommended Communication */}
        {formData.recommended_communication && (
          <Card className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-slate-800">Sugestão de Comunicação</h3>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">
              {formData.recommended_communication}
            </p>
          </Card>
        )}

        {/* Notes */}
        <Card className="p-4">
          <h3 className="font-semibold text-slate-700 mb-3">Observações</h3>
          <Textarea
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Anotações importantes da visita..."
            className="min-h-[100px] rounded-xl border-2"
          />
        </Card>

        {/* AI Insights Button */}
        {!insights && (
          <Button
            onClick={generateInsights}
            disabled={analyzingInsights || formData.main_pains.length === 0}
            variant="outline"
            className="w-full h-12 border-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
          >
            {analyzingInsights ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <Sparkles className="w-5 h-5 mr-2" />
            )}
            {analyzingInsights ? 'Analisando Visita...' : 'Gerar Insights com IA'}
          </Button>
        )}

        {/* AI Insights */}
        {insights && (
          <>
            {/* Key Takeaways */}
            <Card className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <h3 className="font-semibold text-slate-800">Principais Conclusões</h3>
              </div>
              <ul className="space-y-2">
                {insights.key_takeaways?.map((takeaway, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="text-indigo-500 mt-0.5 font-bold">•</span>
                    {takeaway}
                  </li>
                ))}
              </ul>
            </Card>

            {/* Strategy Adjustments */}
            <Card className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-5 h-5 text-amber-600" />
                <h3 className="font-semibold text-slate-800">Ajustes de Estratégia</h3>
              </div>
              <ul className="space-y-2">
                {insights.strategy_adjustments?.map((adjustment, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="text-amber-600 mt-0.5 font-bold">{i + 1}.</span>
                    {adjustment}
                  </li>
                ))}
              </ul>
            </Card>

            {/* Opportunities */}
            <Card className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                <h3 className="font-semibold text-slate-800">Oportunidades</h3>
              </div>
              <ul className="space-y-2">
                {insights.opportunities?.map((opportunity, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="text-emerald-600 mt-0.5 font-bold">→</span>
                    {opportunity}
                  </li>
                ))}
              </ul>
            </Card>

            {/* Sales Projection */}
            {insights.projected_revenue && (
              <Card className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600">Receita Projetada</span>
                  <span className="text-2xl font-bold text-green-700">
                    R$ {insights.projected_revenue.toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Probabilidade de Fechamento</span>
                  <span className="text-lg font-semibold text-green-600">
                    {insights.probability_percentage}%
                  </span>
                </div>
                <div className="mt-2 h-2 bg-green-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 transition-all duration-500"
                    style={{ width: `${insights.probability_percentage}%` }}
                  />
                </div>
              </Card>
            )}

            {/* Next Steps */}
            {insights.recommended_next_steps && (
              <Card className="p-4 bg-gradient-to-r from-violet-50 to-purple-50 border-violet-200">
                <h3 className="font-semibold text-slate-800 mb-3">Próximos Passos Recomendados</h3>
                <ul className="space-y-2">
                  {insights.recommended_next_steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                      <span className="text-violet-600 mt-0.5 font-bold">{i + 1}.</span>
                      {step}
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            <Button
              onClick={() => setInsights(null)}
              variant="ghost"
              className="w-full"
            >
              Gerar Novos Insights
            </Button>
          </>
        )}
      </div>

      {/* Fixed Bottom */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full h-14 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl text-base font-semibold"
        >
          {saving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Save className="w-5 h-5 mr-2" />
              Salvar Cliente
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
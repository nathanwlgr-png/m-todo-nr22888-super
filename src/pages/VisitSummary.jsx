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
  Target
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
    notes: ''
  });

  const { data: client, isLoading } = useQuery({
    queryKey: ['client', clientId],
    queryFn: async () => {
      const clients = await base44.entities.Client.filter({ id: clientId });
      const c = clients[0];
      if (c) {
        setFormData({
          main_pains: c.main_pains || [],
          triggers_used: c.triggers_used || [],
          next_action: c.next_action || '',
          status: c.status || 'morno',
          purchase_score: c.purchase_score || 50,
          notes: c.notes || ''
        });
      }
      return c;
    },
    enabled: !!clientId
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Client.update(clientId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['client', clientId]);
      setSaved(true);
      setTimeout(() => {
        navigate(createPageUrl(`ClientProfile?id=${clientId}`));
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
    'Resultados demorados',
    'Terceirização cara',
    'Falta de confiabilidade',
    'Equipamento obsoleto',
    'Perda de clientes',
    'Falta de treinamento'
  ];

  const commonTriggers = [
    'Prova social',
    'Reciprocidade',
    'Segurança',
    'Autoridade',
    'Escassez'
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
Analise este resumo de visita de vendas de equipamentos veterinários e forneça insights estratégicos:

Cliente: ${client?.first_name}
Tipo: ${client?.client_type}
Perfil: ${client?.behavioral_profile}
Status: ${formData.status}
Score: ${formData.purchase_score}%

Dores identificadas: ${formData.main_pains.join(', ') || 'Nenhuma'}
Gatilhos utilizados: ${formData.triggers_used.join(', ') || 'Nenhum'}
Observações: ${formData.notes || 'Sem observações'}

Forneça em português brasileiro:
1. key_takeaways: Array com 3 pontos principais da visita (frases curtas)
2. strategy_adjustments: Array com 2-3 ajustes estratégicos recomendados
3. opportunities: Array com 2-3 oportunidades de upsell/cross-sell específicas de equipamentos veterinários

Seja direto, prático e focado em ação.
    `;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: prompt,
      response_json_schema: {
        type: "object",
        properties: {
          key_takeaways: { type: "array", items: { type: "string" } },
          strategy_adjustments: { type: "array", items: { type: "string" } },
          opportunities: { type: "array", items: { type: "string" } }
        }
      }
    });

    setInsights(response);
    setAnalyzingInsights(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
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
              <SelectItem value="Enviar proposta comercial">Enviar proposta comercial</SelectItem>
              <SelectItem value="Agendar demonstração">Agendar demonstração</SelectItem>
              <SelectItem value="Enviar material técnico">Enviar material técnico</SelectItem>
              <SelectItem value="Follow-up em 3 dias">Follow-up em 3 dias</SelectItem>
              <SelectItem value="Follow-up em 1 semana">Follow-up em 1 semana</SelectItem>
              <SelectItem value="Aguardar retorno">Aguardar retorno</SelectItem>
              <SelectItem value="Visita de fechamento">Visita de fechamento</SelectItem>
            </SelectContent>
          </Select>
        </Card>

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
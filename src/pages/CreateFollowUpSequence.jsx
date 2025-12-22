import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ArrowLeft, 
  Plus,
  Trash2,
  Mail,
  Bell,
  Save,
  Sparkles,
  Loader2
} from 'lucide-react';

export default function CreateFollowUpSequence() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: '',
    trigger_type: 'no_response_days',
    trigger_days: 3,
    target_status: ['morno'],
    active: true,
    steps: [
      {
        day_offset: 0,
        channel: 'email',
        subject: '',
        message_template: '',
        use_numerology: true
      }
    ]
  });

  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.FollowUpSequence.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['followup-sequences']);
      navigate(createPageUrl('FollowUpSequences'));
    }
  });

  const addStep = () => {
    setFormData({
      ...formData,
      steps: [
        ...formData.steps,
        {
          day_offset: (formData.steps[formData.steps.length - 1]?.day_offset || 0) + 1,
          channel: 'email',
          subject: '',
          message_template: '',
          use_numerology: true
        }
      ]
    });
  };

  const removeStep = (index) => {
    setFormData({
      ...formData,
      steps: formData.steps.filter((_, i) => i !== index)
    });
  };

  const updateStep = (index, field, value) => {
    const newSteps = [...formData.steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setFormData({ ...formData, steps: newSteps });
  };

  const toggleStatus = (status) => {
    const current = formData.target_status;
    if (current.includes(status)) {
      setFormData({ ...formData, target_status: current.filter(s => s !== status) });
    } else {
      setFormData({ ...formData, target_status: [...current, status] });
    }
  };

  const handleSave = () => {
    if (!formData.name || formData.target_status.length === 0) {
      alert('Preencha nome e selecione pelo menos um status');
      return;
    }
    createMutation.mutate(formData);
  };

  const generateAITemplate = async (index, type) => {
    const prompt = `
Crie uma mensagem de follow-up para vendas de equipamentos veterinários.
Tipo de mensagem: ${type === 'first' ? 'Primeiro contato após visita' : type === 'reminder' ? 'Lembrete gentil' : 'Follow-up final'}
Gatilho: ${formData.trigger_type === 'no_response_days' ? `Sem resposta há ${formData.trigger_days} dias` : formData.trigger_type}

A mensagem deve:
- Ser profissional e empática
- Usar variáveis: {{client_name}}, {{client_type}}, {{behavioral_profile}}
- Incluir call-to-action claro
- Ser personalizada com numerologia (mencionando estilo de decisão)

Gere APENAS a mensagem, sem explicações. Português brasileiro.
    `;

    const response = await base44.integrations.Core.InvokeLLM({ prompt });
    updateStep(index, 'message_template', response);
  };

  const generateAIOptimalTiming = async () => {
    setLoadingAI(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um especialista em timing de vendas e psicologia do consumidor.

CONTEXTO DA SEQUÊNCIA:
- Gatilho: ${formData.trigger_type}
- Status dos clientes: ${formData.target_status.join(', ')}
- Dias sem contato: ${formData.trigger_days || 'N/A'}

Com base em:
1. Psicologia do consumidor (não pressionar demais, manter top-of-mind)
2. Numerologia comportamental (diferentes perfis respondem melhor em dias diferentes)
3. Best practices de vendas B2B veterinário

Sugira uma SEQUÊNCIA OTIMIZADA de follow-ups em formato JSON:

{
  "optimal_days": [0, 2, 5, 10],
  "reasoning": "Explicação concisa de por que esses intervalos",
  "best_time_of_day": "Melhor horário do dia (manhã/tarde/noite)",
  "message_tones": ["tom do 1º", "tom do 2º", "tom do 3º", "tom do 4º"]
}

Retorne APENAS o JSON, sem markdown ou explicações.`
      });

      const suggestions = JSON.parse(response);
      setAiSuggestions(suggestions);

      // Auto-apply suggestions
      const newSteps = suggestions.optimal_days.map((day, i) => ({
        day_offset: day,
        channel: 'email',
        subject: '',
        message_template: `[Tom: ${suggestions.message_tones[i]}]\n\nOlá {{client_name}},\n\n...`,
        use_numerology: true
      }));
      setFormData({ ...formData, steps: newSteps });
    } catch (error) {
      console.error('Erro ao gerar timing:', error);
      alert('Erro ao gerar sugestões. Tente novamente.');
    } finally {
      setLoadingAI(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* Header */}
      <div className="bg-white border-b px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-slate-100">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <h1 className="text-lg font-semibold text-slate-800">Nova Sequência</h1>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* Basic Info */}
        <Card className="p-4">
          <Label>Nome da Sequência *</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ex: Follow-up Proposta Enviada"
            className="mt-2"
          />
        </Card>

        {/* Trigger */}
        <Card className="p-4">
          <Label>Gatilho</Label>
          <Select
            value={formData.trigger_type}
            onValueChange={(value) => setFormData({ ...formData, trigger_type: value })}
          >
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="no_response_days">Sem resposta há X dias</SelectItem>
              <SelectItem value="proposal_sent">Proposta enviada</SelectItem>
              <SelectItem value="first_visit_done">Primeira visita realizada</SelectItem>
              <SelectItem value="status_change">Mudança de status</SelectItem>
            </SelectContent>
          </Select>

          {formData.trigger_type === 'no_response_days' && (
            <div className="mt-3">
              <Label>Dias sem contato</Label>
              <Input
                type="number"
                value={formData.trigger_days}
                onChange={(e) => setFormData({ ...formData, trigger_days: parseInt(e.target.value) })}
                className="mt-2"
              />
            </div>
          )}
        </Card>

        {/* Target Status */}
        <Card className="p-4">
          <Label className="mb-3 block">Status dos Clientes *</Label>
          <div className="flex gap-2">
            {['quente', 'morno', 'frio'].map((status) => (
              <Button
                key={status}
                variant={formData.target_status.includes(status) ? 'default' : 'outline'}
                onClick={() => toggleStatus(status)}
                className="flex-1"
              >
                {status}
              </Button>
            ))}
          </div>
        </Card>

        {/* AI Optimization */}
        <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-purple-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-slate-800 mb-1">Otimização por IA</p>
              <p className="text-xs text-slate-600 mb-3">
                A IA sugere os melhores dias e horários baseado em psicologia do consumidor e numerologia
              </p>
              <Button
                onClick={generateAIOptimalTiming}
                disabled={loadingAI}
                variant="outline"
                size="sm"
                className="border-purple-300 text-purple-700"
              >
                {loadingAI ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                Gerar Timing Otimizado
              </Button>
            </div>
          </div>
          
          {aiSuggestions && (
            <div className="mt-3 pt-3 border-t border-purple-200">
              <p className="text-xs font-semibold text-purple-700 mb-1">Sugestões:</p>
              <p className="text-xs text-slate-600 mb-2">{aiSuggestions.reasoning}</p>
              <Badge className="bg-purple-100 text-purple-700 text-xs">
                ⏰ Melhor horário: {aiSuggestions.best_time_of_day}
              </Badge>
            </div>
          )}
        </Card>

        {/* Steps */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <Label>Passos da Sequência</Label>
            <Button onClick={addStep} size="sm" variant="outline">
              <Plus className="w-4 h-4 mr-1" />
              Adicionar Passo
            </Button>
          </div>

          {formData.steps.map((step, index) => (
            <Card key={index} className="p-4 mb-3">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-800">Passo {index + 1}</h3>
                {formData.steps.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeStep(index)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                )}
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Dia</Label>
                    <Input
                      type="number"
                      value={step.day_offset}
                      onChange={(e) => updateStep(index, 'day_offset', parseInt(e.target.value))}
                      placeholder="0"
                    />
                    <p className="text-xs text-slate-500 mt-1">Dias após o gatilho</p>
                  </div>

                  <div>
                    <Label>Canal</Label>
                    <Select
                      value={step.channel}
                      onValueChange={(value) => updateStep(index, 'channel', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">
                          <Mail className="w-4 h-4 inline mr-2" />
                          Email
                        </SelectItem>
                        <SelectItem value="notification">
                          <Bell className="w-4 h-4 inline mr-2" />
                          Notificação
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {step.channel === 'email' && (
                  <div>
                    <Label>Assunto do Email</Label>
                    <Input
                      value={step.subject}
                      onChange={(e) => updateStep(index, 'subject', e.target.value)}
                      placeholder="Ex: Seguimento da nossa conversa"
                    />
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Mensagem</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => generateAITemplate(index, index === 0 ? 'first' : 'reminder')}
                    >
                      <Sparkles className="w-3 h-3 mr-1" />
                      Gerar com IA
                    </Button>
                  </div>
                  <Textarea
                    value={step.message_template}
                    onChange={(e) => updateStep(index, 'message_template', e.target.value)}
                    placeholder="Use variáveis: {{client_name}}, {{client_type}}, {{behavioral_profile}}"
                    rows={6}
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Variáveis disponíveis: {'{'}{'{'} client_name {'}'}{'}'}, {'{'}{'{'} behavioral_profile {'}'}{'}'}, {'{'}{'{'} decision_style {'}'}{'}'}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <Label>Personalizar com Numerologia</Label>
                  <Switch
                    checked={step.use_numerology}
                    onCheckedChange={(value) => updateStep(index, 'use_numerology', value)}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Fixed Bottom */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t">
        <Button
          onClick={handleSave}
          disabled={createMutation.isPending}
          className="w-full h-14 bg-indigo-600 hover:bg-indigo-700"
        >
          {createMutation.isPending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Save className="w-5 h-5 mr-2" />
              Criar Sequência
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
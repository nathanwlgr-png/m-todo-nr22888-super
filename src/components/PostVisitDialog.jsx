import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, CheckCircle2, Calendar, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import VoiceRecorderButton from '@/components/VoiceRecorderButton';

export default function PostVisitDialog({ client, visitId, open, onOpenChange }) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [generating, setGenerating] = useState(false);
  const [visitData, setVisitData] = useState({
    result_notes: '',
    new_pains: [],
    new_motivators: [],
    new_objections: [],
    equipment_interest: '',
    interest_level: 5,
    budget_confirmed: client.available_budget || '',
    next_step: '',
    schedule_next: false,
    next_visit_date: '',
    next_visit_type: 'followup',
    triggers_used: [],
    techniques_used: [],
    objections_presented: [],
    sale_closed: false,
    equipment_sold: '',
    contract_signature_date: ''
  });

  const { data: equipments = [] } = useQuery({
    queryKey: ['equipments'],
    queryFn: () => base44.entities.Equipment.list()
  });

  const updateVisitMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Visit.update(id, data),
    onSuccess: () => queryClient.invalidateQueries(['client-visits'])
  });

  const updateClientMutation = useMutation({
    mutationFn: (data) => base44.entities.Client.update(client.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['client', client.id]);
      toast.success('Perfil atualizado automaticamente');
    }
  });

  const createVisitMutation = useMutation({
    mutationFn: (data) => base44.entities.Visit.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['client-visits']);
      toast.success('Próxima visita agendada!');
    }
  });

  const generateEquipmentSuggestion = async () => {
    setGenerating(true);
    try {
      const prompt = `Você é um especialista em equipamentos de diagnóstico veterinário.

PERFIL COMPLETO DO CLIENTE:
- Nome: ${client.first_name}
- Tipo: ${client.client_type}
- Numerologia: ${client.numerology_number} - ${client.behavioral_profile}
- Necessidades Lab: ${client.lab_needs?.join(', ') || 'Não especificadas'}
- Equipamento Atual: ${client.current_equipment || 'Nenhum'}
- Orçamento: ${visitData.budget_confirmed || client.available_budget || 'Não informado'}
- Dores: ${[...(client.main_pains || []), ...(visitData.new_pains || [])].join(', ')}

PÓS-VISITA:
- Notas: ${visitData.result_notes}
- Interesse em: ${visitData.equipment_interest || 'Não especificado'}

EQUIPAMENTOS DISPONÍVEIS:
${equipments.map(e => `- ${e.name} (${e.category}): R$ ${e.price?.toLocaleString('pt-BR')}`).join('\n')}

TAREFA:
Sugira o equipamento IDEAL para este cliente considerando:
1. Necessidades do laboratório
2. Orçamento disponível
3. Perfil comportamental (decisão rápida vs analítica)
4. Equipamento atual (upgrade ou complemento)
5. Dores identificadas

Retorne JSON:
{
  "suggested_equipment": "nome do equipamento",
  "reason": "Explicação em 2-3 linhas de POR QUÊ este equipamento é perfeito",
  "alternative": "nome alternativo (se budget menor)",
  "next_action": "Próximo passo específico para fechar a venda"
}`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            suggested_equipment: { type: "string" },
            reason: { type: "string" },
            alternative: { type: "string" },
            next_action: { type: "string" }
          }
        }
      });

      setVisitData({
        ...visitData,
        next_step: result.next_action
      });

      // Atualizar cliente com sugestão
      await updateClientMutation.mutateAsync({
        equipment_suggestion: result.suggested_equipment,
        equipment_suggestion_reason: result.reason,
        equipment_suggestion_alternative: result.alternative
      });

      toast.success('Sugestão de equipamento gerada!');
      return result;
    } catch (error) {
      toast.error('Erro ao gerar sugestão');
    } finally {
      setGenerating(false);
    }
  };

  const handleComplete = async () => {
    try {
      // 1. Salvar histórico da visita no cliente
      const visitHistory = client.visit_history || [];
      const newVisitRecord = {
        date: new Date().toISOString(),
        notes: visitData.result_notes,
        triggers_used: visitData.triggers_used,
        techniques_used: visitData.techniques_used,
        objections_presented: visitData.objections_presented,
        equipment_interest: visitData.equipment_interest,
        budget_confirmed: visitData.budget_confirmed,
        next_action: visitData.next_step
      };
      visitHistory.push(newVisitRecord);

      // 2. Atualizar visita como realizada
      if (visitId) {
        await updateVisitMutation.mutateAsync({
          id: visitId,
          data: {
            status: 'realizada',
            result_notes: visitData.result_notes
          }
        });
      }

      // 3. Atualizar perfil do cliente automaticamente
      const updatedPains = [...(client.main_pains || []), ...visitData.new_pains];
      const updatedMotivators = [...(client.purchase_motivators || []), ...visitData.new_motivators];
      const updatedObjections = [...(client.real_objections || []), ...visitData.new_objections, ...visitData.objections_presented];

      const updateData = {
        main_pains: updatedPains,
        purchase_motivators: updatedMotivators,
        real_objections: updatedObjections,
        available_budget: visitData.budget_confirmed,
        last_visit_date: new Date().toISOString().split('T')[0],
        notes: `${client.notes || ''}\n\n[${new Date().toLocaleDateString()}] ${visitData.result_notes}`.trim(),
        visit_history: visitHistory,
        visit_objective: 'fechar_venda'
      };

      // Atualizar score baseado no interesse
      if (visitData.interest_level) {
        updateData.purchase_score = Math.min(100, Math.round((visitData.interest_level * 10) + (client.purchase_score || 0) * 0.3));
      }

      // Se venda fechada
      if (autoClosedSale || visitData.sale_closed) {
        updateData.sale_closed = true;
        updateData.equipment_sold = autoClosedSale ? visitData.equipment_interest : visitData.equipment_sold;
        updateData.contract_signature_date = visitData.contract_signature_date;
        updateData.status = 'quente';
        updateData.visit_objective = 'fechar_venda';
      }

      await updateClientMutation.mutateAsync(updateData);

      // 4. Gerar sugestão de equipamento
      await generateEquipmentSuggestion();

      // 5. Agendar próxima visita se solicitado
      if (visitData.schedule_next && visitData.next_visit_date) {
        await createVisitMutation.mutateAsync({
          client_id: client.id,
          client_name: client.first_name,
          scheduled_date: new Date(visitData.next_visit_date).toISOString(),
          visit_type: visitData.next_visit_type,
          duration_minutes: 60,
          location: client.address || client.city,
          status: 'agendada',
          notes: `Follow-up: ${visitData.next_step}`
        });
      }

      // 6. Se venda fechada, criar lembrete de assinatura
      if ((autoClosedSale || visitData.sale_closed) && visitData.contract_signature_date) {
        await createVisitMutation.mutateAsync({
          client_id: client.id,
          client_name: client.first_name,
          scheduled_date: new Date(visitData.contract_signature_date).toISOString(),
          visit_type: 'fechamento',
          duration_minutes: 60,
          location: client.address || client.city,
          status: 'agendada',
          notes: `🎉 ASSINATURA DE CONTRATO - ${autoClosedSale ? visitData.equipment_interest : visitData.equipment_sold}`
        });
        toast.success('Lembrete de assinatura criado!');
      }

      setStep(3);
    } catch (error) {
      toast.error('Erro ao salvar');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step === 1 && '📝 Informações da Visita'}
            {step === 2 && '📅 Agendar Próxima Visita?'}
            {step === 3 && '✅ Visita Registrada'}
          </DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Resumo da Visita *</Label>
                <VoiceRecorderButton
                  onTranscript={(transcript) => setVisitData({ ...visitData, result_notes: transcript })}
                  size="sm"
                />
              </div>
              <Textarea
                value={visitData.result_notes}
                onChange={(e) => setVisitData({ ...visitData, result_notes: e.target.value })}
                placeholder="O que aconteceu na visita? Pontos importantes... (ou grave áudio)"
                rows={4}
                className="resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label>Gatilhos Mentais Usados</Label>
              <Input
                placeholder="Ex: Escassez, Autoridade, Prova Social..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && e.target.value.trim()) {
                    setVisitData({
                      ...visitData,
                      triggers_used: [...visitData.triggers_used, e.target.value.trim()]
                    });
                    e.target.value = '';
                  }
                }}
              />
              {visitData.triggers_used.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {visitData.triggers_used.map((trigger, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm cursor-pointer"
                      onClick={() => setVisitData({
                        ...visitData,
                        triggers_used: visitData.triggers_used.filter((_, i) => i !== idx)
                      })}
                    >
                      {trigger} ×
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Técnicas de Vendas Usadas</Label>
              <Input
                placeholder="Ex: SPIN, BANT, Storytelling..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && e.target.value.trim()) {
                    setVisitData({
                      ...visitData,
                      techniques_used: [...visitData.techniques_used, e.target.value.trim()]
                    });
                    e.target.value = '';
                  }
                }}
              />
              {visitData.techniques_used.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {visitData.techniques_used.map((tech, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm cursor-pointer"
                      onClick={() => setVisitData({
                        ...visitData,
                        techniques_used: visitData.techniques_used.filter((_, i) => i !== idx)
                      })}
                    >
                      {tech} ×
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Objeções Apresentadas pelo Cliente</Label>
              <Input
                placeholder="Ex: Preço muito alto, preciso pensar..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && e.target.value.trim()) {
                    setVisitData({
                      ...visitData,
                      objections_presented: [...visitData.objections_presented, e.target.value.trim()]
                    });
                    e.target.value = '';
                  }
                }}
              />
              {visitData.objections_presented.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {visitData.objections_presented.map((obj, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-red-100 text-red-700 rounded text-sm cursor-pointer"
                      onClick={() => setVisitData({
                        ...visitData,
                        objections_presented: visitData.objections_presented.filter((_, i) => i !== idx)
                      })}
                    >
                      {obj} ×
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Novas Dores Identificadas</Label>
              <Input
                placeholder="Ex: Alto custo com terceirização"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && e.target.value.trim()) {
                    setVisitData({
                      ...visitData,
                      new_pains: [...visitData.new_pains, e.target.value.trim()]
                    });
                    e.target.value = '';
                  }
                }}
              />
              {visitData.new_pains.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {visitData.new_pains.map((pain, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-red-100 text-red-700 rounded text-sm cursor-pointer"
                      onClick={() => setVisitData({
                        ...visitData,
                        new_pains: visitData.new_pains.filter((_, i) => i !== idx)
                      })}
                    >
                      {pain} ×
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Interesse em Equipamento</Label>
              <Select
                value={visitData.equipment_interest}
                onValueChange={(value) => setVisitData({ ...visitData, equipment_interest: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {equipments.map(eq => (
                    <SelectItem key={eq.id} value={eq.name}>
                      {eq.name} - R$ {eq.price?.toLocaleString('pt-BR')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Nível de Interesse (1-10)</Label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={visitData.interest_level}
                  onChange={(e) => setVisitData({ ...visitData, interest_level: parseInt(e.target.value) })}
                  className="flex-1 h-2 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, 
                      rgb(254 202 202) 0%, 
                      rgb(254 249 195) 50%, 
                      rgb(34 197 94) 100%)`
                  }}
                />
                <span className="text-2xl font-bold text-slate-800 w-12 text-center">
                  {visitData.interest_level}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {visitData.interest_level <= 3 && '❄️ Interesse baixo'}
                {visitData.interest_level >= 4 && visitData.interest_level <= 7 && '🌡️ Interesse moderado'}
                {visitData.interest_level >= 8 && '🔥 Interesse alto'}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Orçamento Confirmado (R$)</Label>
              <Input
                type="number"
                value={visitData.budget_confirmed}
                onChange={(e) => setVisitData({ ...visitData, budget_confirmed: e.target.value })}
                placeholder="0"
              />
            </div>

            <div className="p-4 bg-green-50 rounded-lg border-2 border-green-200 space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={visitData.sale_closed}
                  onCheckedChange={(checked) => setVisitData({ ...visitData, sale_closed: checked })}
                />
                <Label className="text-green-700 font-semibold">✅ Cliente Fechou Equipamento</Label>
              </div>

              {visitData.sale_closed && (
                <>
                  <div className="space-y-2">
                    <Label>Equipamento Vendido *</Label>
                    <Select
                      value={visitData.equipment_sold}
                      onValueChange={(value) => setVisitData({ ...visitData, equipment_sold: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {equipments.map(eq => (
                          <SelectItem key={eq.id} value={eq.name}>
                            {eq.name} - R$ {eq.price?.toLocaleString('pt-BR')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Data de Assinatura do Contrato *</Label>
                    <Input
                      type="date"
                      value={visitData.contract_signature_date}
                      onChange={(e) => setVisitData({ ...visitData, contract_signature_date: e.target.value })}
                    />
                    <p className="text-xs text-green-600">
                      💡 Lembrete criado na agenda
                    </p>
                  </div>
                </>
              )}
            </div>

            <Button
              onClick={() => setStep(2)}
              disabled={!visitData.result_notes || (visitData.sale_closed && (!visitData.equipment_sold || !visitData.contract_signature_date))}
              className="w-full"
            >
              Continuar
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 py-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={visitData.schedule_next}
                onCheckedChange={(checked) => setVisitData({ ...visitData, schedule_next: checked })}
              />
              <Label>Agendar próxima visita agora</Label>
            </div>

            {visitData.schedule_next && (
              <>
                <div className="space-y-2">
                  <Label>Data da Próxima Visita</Label>
                  <Input
                    type="date"
                    value={visitData.next_visit_date}
                    onChange={(e) => setVisitData({ ...visitData, next_visit_date: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tipo de Visita</Label>
                  <Select
                    value={visitData.next_visit_type}
                    onValueChange={(value) => setVisitData({ ...visitData, next_visit_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="followup">Follow-up</SelectItem>
                      <SelectItem value="demonstracao">Demonstração</SelectItem>
                      <SelectItem value="fechamento">Fechamento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <Button
              onClick={handleComplete}
              disabled={generating || (visitData.schedule_next && !visitData.next_visit_date)}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analisando...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Finalizar e Gerar Análise IA
                </>
              )}
            </Button>
          </div>
        )}

        {step === 3 && (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Visita Registrada!</h3>
              <p className="text-sm text-slate-600 mt-2">
                Perfil do cliente atualizado automaticamente com as novas informações.
              </p>
              {visitData.schedule_next && (
                <p className="text-sm text-green-600 mt-2">
                  ✓ Próxima visita agendada
                </p>
              )}
            </div>
            <Button onClick={() => onOpenChange(false)} className="w-full">
              Fechar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
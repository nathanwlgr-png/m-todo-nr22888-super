import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { MessageSquare, Plus, Trash2, Edit2, Play, Settings, Zap, Target } from 'lucide-react';

const TRIGGER_TYPES = [
  { id: 'score_drop', label: 'Queda de Score', icon: '📉', color: 'bg-red-100 text-red-800' },
  { id: 'no_contact', label: 'Sem Contato (dias)', icon: '⏰', color: 'bg-yellow-100 text-yellow-800' },
  { id: 'status_change', label: 'Mudança de Status', icon: '🔄', color: 'bg-blue-100 text-blue-800' },
  { id: 'visit_completed', label: 'Visita Completada', icon: '✅', color: 'bg-green-100 text-green-800' },
  { id: 'proposal_sent', label: 'Proposta Enviada', icon: '📄', color: 'bg-purple-100 text-purple-800' },
];

export default function WhatsAppAutomationTriggers() {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    trigger_type: 'score_drop',
    trigger_condition: '',
    message_template: '',
    enabled: true,
    score_brackets: [],
  });
  const queryClient = useQueryClient();

  // Fetch automation triggers
  const { data: triggers = [] } = useQuery({
    queryKey: ['whatsapp-triggers'],
    queryFn: async () => {
      try {
        const data = await base44.entities.FollowUpSequence?.list('-created_date', 100) || [];
        return data;
      } catch {
        return [];
      }
    },
    staleTime: 60000,
  });

  // Create/Update trigger
  const saveTriggerMutation = useMutation({
    mutationFn: async (data) => {
      if (editingId) {
        await base44.entities.FollowUpSequence.update(editingId, data);
      } else {
        await base44.entities.FollowUpSequence.create(data);
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-triggers'] });
      resetForm();
    },
  });

  // Delete trigger
  const deleteTriggerMutation = useMutation({
    mutationFn: async (id) => {
      await base44.entities.FollowUpSequence.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-triggers'] });
    },
  });

  // Test trigger
  const testTriggerMutation = useMutation({
    mutationFn: async (triggerId) => {
      const res = await base44.functions.invoke('generateAIFollowUpSequence', {
        trigger_id: triggerId,
        test_mode: true,
      });
      return res.data;
    },
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      name: '',
      trigger_type: 'score_drop',
      trigger_condition: '',
      message_template: '',
      enabled: true,
      score_brackets: [],
    });
  };

  const handleSave = async () => {
    await saveTriggerMutation.mutateAsync({
      ...formData,
      trigger_type: formData.trigger_type,
      active: formData.enabled,
    });
  };

  const handleEdit = (trigger) => {
    setEditingId(trigger.id);
    setFormData({
      name: trigger.name,
      trigger_type: trigger.trigger_type,
      trigger_condition: trigger.trigger_condition || '',
      message_template: trigger.message_template || '',
      enabled: trigger.active || trigger.enabled,
      score_brackets: trigger.score_brackets || [],
    });
    setShowForm(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-black text-white mb-2 flex items-center gap-3">
              <MessageSquare className="w-10 h-10 text-green-400" />
              Automação WhatsApp
            </h1>
            <p className="text-slate-400">Configure gatilhos inteligentes baseados no score do cliente</p>
          </div>
          <Button 
            onClick={() => setShowForm(!showForm)}
            className="bg-green-600 hover:bg-green-700 gap-2"
          >
            <Plus className="w-4 h-4" />
            Novo Gatilho
          </Button>
        </div>

        {/* Form */}
        {showForm && (
          <Card className="bg-slate-800 border-slate-700 mb-8">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-400" />
                {editingId ? 'Editar Gatilho' : 'Criar Novo Gatilho'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Informações Básicas */}
              <div className="space-y-3">
                <label className="block text-sm font-bold text-slate-300">Nome do Gatilho</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Follow-up clientes quentes"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              {/* Tipo de Gatilho */}
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-3">Tipo de Gatilho</label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {TRIGGER_TYPES.map(trigger => (
                    <button
                      key={trigger.id}
                      onClick={() => setFormData({ ...formData, trigger_type: trigger.id })}
                      className={`p-3 rounded-lg text-center transition-all border-2 ${
                        formData.trigger_type === trigger.id
                          ? 'border-green-500 bg-green-500/20'
                          : 'border-slate-600 hover:border-slate-500'
                      }`}
                    >
                      <p className="text-2xl mb-1">{trigger.icon}</p>
                      <p className="text-xs font-bold text-white">{trigger.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Condição do Gatilho */}
              <div className="space-y-3">
                <label className="block text-sm font-bold text-slate-300">Condição Específica</label>
                <Input
                  value={formData.trigger_condition}
                  onChange={(e) => setFormData({ ...formData, trigger_condition: e.target.value })}
                  placeholder={
                    formData.trigger_type === 'score_drop' ? 'Ex: queda > 30 pontos' :
                    formData.trigger_type === 'no_contact' ? 'Ex: 7 dias sem contato' :
                    'Descreva a condição específica'
                  }
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              {/* Template de Mensagem */}
              <div className="space-y-3">
                <label className="block text-sm font-bold text-slate-300">Template de Mensagem</label>
                <textarea
                  value={formData.message_template}
                  onChange={(e) => setFormData({ ...formData, message_template: e.target.value })}
                  placeholder="Deixe em branco para usar IA personalizada por score. Use {{cliente}} para inserir nome do cliente."
                  className="w-full bg-slate-700 border border-slate-600 text-white rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500 min-h-24"
                />
                <p className="text-xs text-slate-400">💡 Deixar vazio = IA gera automaticamente baseado no score</p>
              </div>

              {/* Score Brackets */}
              <div className="space-y-3">
                <label className="block text-sm font-bold text-slate-300">Configuração por Faixa de Score</label>
                <div className="space-y-2 p-3 bg-slate-700/50 rounded-lg">
                  <div className="grid grid-cols-3 gap-2 text-xs text-slate-400">
                    <span>Score</span>
                    <span>Frequência</span>
                    <span>Tom</span>
                  </div>
                  {[
                    { range: '80-100', frequency: 'Imediato', tone: 'Urgente' },
                    { range: '60-80', frequency: '2x/semana', tone: 'Consultivo' },
                    { range: '40-60', frequency: '1x/semana', tone: 'Informativo' },
                    { range: '0-40', frequency: '1x/mês', tone: 'Suportivo' },
                  ].map((bracket, idx) => (
                    <div key={idx} className="grid grid-cols-3 gap-2 text-sm text-slate-300">
                      <span className="font-bold">{bracket.range}</span>
                      <span>{bracket.frequency}</span>
                      <span className="text-xs text-slate-400">{bracket.tone}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                <span className="text-sm font-bold text-slate-300">Ativar Automaticamente</span>
                <Switch
                  checked={formData.enabled}
                  onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
                />
              </div>

              {/* Ações */}
              <div className="flex gap-3">
                <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700 flex-1 gap-2">
                  <Zap className="w-4 h-4" />
                  {editingId ? 'Atualizar' : 'Criar'} Gatilho
                </Button>
                <Button onClick={resetForm} variant="outline" className="flex-1">
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de Gatilhos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {triggers.map(trigger => {
            const triggerType = TRIGGER_TYPES.find(t => t.id === trigger.trigger_type);
            return (
              <Card key={trigger.id} className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-all">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-white flex items-center gap-2">
                        <span>{triggerType?.icon}</span>
                        {trigger.name}
                      </CardTitle>
                      <p className="text-sm text-slate-400 mt-1">{triggerType?.label}</p>
                    </div>
                    <Badge variant={trigger.active || trigger.enabled ? 'default' : 'secondary'}>
                      {trigger.active || trigger.enabled ? '🟢 Ativo' : '⚪ Inativo'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Condição */}
                  {trigger.trigger_condition && (
                    <div className="p-3 bg-slate-700/50 rounded-lg">
                      <p className="text-xs text-slate-400">Condição</p>
                      <p className="text-sm text-white font-mono">{trigger.trigger_condition}</p>
                    </div>
                  )}

                  {/* Template Preview */}
                  {trigger.message_template && (
                    <div className="p-3 bg-green-900/30 rounded-lg border border-green-700">
                      <p className="text-xs text-slate-400">Mensagem Template</p>
                      <p className="text-sm text-green-200 mt-1 line-clamp-2">{trigger.message_template}</p>
                    </div>
                  )}

                  {/* Steps */}
                  {trigger.steps && trigger.steps.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-slate-300">Sequência ({trigger.steps.length} passos)</p>
                      <div className="space-y-1">
                        {trigger.steps.slice(0, 2).map((step, idx) => (
                          <div key={idx} className="text-xs text-slate-400 flex items-center gap-2">
                            <span className="font-bold text-slate-500">Dia {step.day_offset}:</span>
                            <span>{step.channel === 'email' ? '📧' : '💬'} {step.subject || 'Mensagem automática'}</span>
                          </div>
                        ))}
                        {trigger.steps.length > 2 && (
                          <p className="text-xs text-slate-500">+{trigger.steps.length - 2} mais passos</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Ações */}
                  <div className="flex gap-2 pt-3 border-t border-slate-700">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => testTriggerMutation.mutate(trigger.id)}
                      className="flex-1 gap-2 text-xs"
                    >
                      <Play className="w-3 h-3" />
                      Testar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(trigger)}
                      className="flex-1 gap-2 text-xs"
                    >
                      <Edit2 className="w-3 h-3" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteTriggerMutation.mutate(trigger.id)}
                      className="flex-1 gap-2 text-xs"
                    >
                      <Trash2 className="w-3 h-3" />
                      Deletar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {triggers.length === 0 && !showForm && (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-12 pb-12 text-center">
              <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 mb-4">Nenhum gatilho criado ainda</p>
              <Button onClick={() => setShowForm(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Criar Primeiro Gatilho
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Informações de Score */}
        <Card className="bg-gradient-to-r from-blue-900 to-purple-900 border-slate-700 mt-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-400" />
              Estratégia por Faixa de Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { score: '80-100', label: 'Quente', emoji: '🔥', strategy: 'Abordagem urgente, fechamento imediato' },
                { score: '60-80', label: 'Morno', emoji: '🟡', strategy: 'Consultivo, educar sobre valor' },
                { score: '40-60', label: 'Frio', emoji: '❄️', strategy: 'Informativo, apresentar soluções' },
                { score: '0-40', label: 'Dormindo', emoji: '😴', strategy: 'Reativação gradual, suporte' },
              ].map((item, idx) => (
                <div key={idx} className="p-4 bg-slate-800 rounded-lg border border-slate-700">
                  <p className="text-2xl mb-1">{item.emoji}</p>
                  <p className="text-xs font-bold text-slate-300">{item.score}</p>
                  <p className="text-sm font-bold text-white mt-1">{item.label}</p>
                  <p className="text-xs text-slate-400 mt-2">{item.strategy}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const TRIGGER_TYPES = [
  { value: 'visit_completed', label: 'Visita Realizada' },
  { value: 'days_without_interaction', label: 'Dias sem Interação' },
  { value: 'score_threshold', label: 'Limite de Score' },
  { value: 'lead_created', label: 'Lead Criado' },
  { value: 'status_change', label: 'Mudança de Status' },
  { value: 'client_created', label: 'Cliente Criado' }
];

const ACTION_TYPES = [
  { value: 'send_email', label: 'Enviar Email' },
  { value: 'send_whatsapp', label: 'Enviar WhatsApp' },
  { value: 'create_task', label: 'Criar Tarefa' },
  { value: 'update_client_status', label: 'Atualizar Status do Cliente' },
  { value: 'send_alert', label: 'Enviar Alerta' },
  { value: 'assign_to_user', label: 'Atribuir a Usuário' }
];

export default function AutomationBuilder({ rule, onSave, onCancel, isLoading }) {
  const [formData, setFormData] = useState({
    name: rule?.name || '',
    description: rule?.description || '',
    trigger_type: rule?.trigger_type || '',
    trigger_condition: rule?.trigger_condition || {},
    action_type: rule?.action_type || '',
    action_config: rule?.action_config || {},
    active: rule?.active !== undefined ? rule.active : true,
    target_client_types: rule?.target_client_types || []
  });

  const handleSave = () => {
    if (!formData.name || !formData.trigger_type || !formData.action_type) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }
    onSave(formData);
  };

  return (
    <div className="space-y-6">
      {/* Básico */}
      <div className="space-y-4">
        <h3 className="font-bold text-lg text-slate-900">Configuração Básica</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-semibold text-slate-700 mb-2 block">Nome da Automação *</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Follow-up após visita"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700 mb-2 block">Status</label>
            <Select value={formData.active ? 'true' : 'false'} onValueChange={(v) => setFormData({ ...formData, active: v === 'true' })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">✓ Ativa</SelectItem>
                <SelectItem value="false">✗ Desativada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <label className="text-sm font-semibold text-slate-700 mb-2 block">Descrição</label>
          <Textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Descreva o que essa automação faz..."
            className="h-20"
          />
        </div>
      </div>

      {/* Gatilho */}
      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
        <CardContent className="p-4 space-y-4">
          <h3 className="font-bold text-slate-900">🎯 Gatilho</h3>
          <div>
            <label className="text-sm font-semibold text-slate-700 mb-2 block">Tipo de Gatilho *</label>
            <Select value={formData.trigger_type} onValueChange={(v) => setFormData({ ...formData, trigger_type: v, trigger_condition: {} })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um gatilho..." />
              </SelectTrigger>
              <SelectContent>
                {TRIGGER_TYPES.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Condições Dinâmicas do Gatilho */}
          <TriggerConditionFields triggerType={formData.trigger_type} condition={formData.trigger_condition} onChange={(cond) => setFormData({ ...formData, trigger_condition: cond })} />
        </CardContent>
      </Card>

      {/* Ação */}
      <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
        <CardContent className="p-4 space-y-4">
          <h3 className="font-bold text-slate-900">⚡ Ação</h3>
          <div>
            <label className="text-sm font-semibold text-slate-700 mb-2 block">Tipo de Ação *</label>
            <Select value={formData.action_type} onValueChange={(v) => setFormData({ ...formData, action_type: v, action_config: {} })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma ação..." />
              </SelectTrigger>
              <SelectContent>
                {ACTION_TYPES.map(a => (
                  <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Configurações Dinâmicas da Ação */}
          <ActionConfigFields actionType={formData.action_type} config={formData.action_config} onChange={(cfg) => setFormData({ ...formData, action_config: cfg })} />
        </CardContent>
      </Card>

      {/* Botões */}
      <div className="flex gap-3 justify-end">
        <Button
          onClick={onCancel}
          variant="outline"
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          {isLoading ? 'Salvando...' : 'Salvar Automação'}
        </Button>
      </div>
    </div>
  );
}

function TriggerConditionFields({ triggerType, condition, onChange }) {
  switch (triggerType) {
    case 'days_without_interaction':
      return (
        <div>
          <label className="text-sm font-semibold text-slate-700 mb-2 block">Dias sem Interação</label>
          <Input
            type="number"
            min="1"
            value={condition.days || 30}
            onChange={(e) => onChange({ ...condition, days: parseInt(e.target.value) })}
            placeholder="30"
          />
        </div>
      );
    case 'score_threshold':
      return (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-semibold text-slate-700 mb-2 block">Score Mínimo</label>
            <Input
              type="number"
              min="0"
              max="100"
              value={condition.min_score || 0}
              onChange={(e) => onChange({ ...condition, min_score: parseInt(e.target.value) })}
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700 mb-2 block">Score Máximo</label>
            <Input
              type="number"
              min="0"
              max="100"
              value={condition.max_score || 100}
              onChange={(e) => onChange({ ...condition, max_score: parseInt(e.target.value) })}
            />
          </div>
        </div>
      );
    case 'visit_completed':
      return (
        <div>
          <label className="text-sm font-semibold text-slate-700 mb-2 block">Dias após a Visita</label>
          <Input
            type="number"
            min="0"
            value={condition.days_offset || 2}
            onChange={(e) => onChange({ ...condition, days_offset: parseInt(e.target.value) })}
          />
        </div>
      );
    default:
      return <p className="text-sm text-slate-600">Selecione um tipo de gatilho</p>;
  }
}

function ActionConfigFields({ actionType, config, onChange }) {
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const generateAISuggestion = async (template, channel) => {
    setAiLoading(true);
    try {
      const response = await base44.functions.invoke('generateAIMessageSuggestion', {
        clientId: 'sample', // Será dinâmico quando usado em automação real
        channel,
        template,
        actionType: template
      });
      setAiSuggestion(response.data.suggestion?.body || response.data.suggestion);
      toast.success('Sugestão gerada com sucesso!');
    } catch (error) {
      toast.error('Erro ao gerar sugestão');
    } finally {
      setAiLoading(false);
    }
  };

  switch (actionType) {
    case 'send_email':
      return (
        <div className="space-y-3">
          <div>
            <label className="text-sm font-semibold text-slate-700 mb-2 block">Template Email</label>
            <Select value={config.template || ''} onValueChange={(v) => onChange({ ...config, template: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="followup_after_visit">Follow-up após Visita</SelectItem>
                <SelectItem value="welcome_new_client">Bem-vindo Novo Cliente</SelectItem>
                <SelectItem value="reactivation">Reativação de Cliente</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {config.template && (
            <Button
              onClick={() => generateAISuggestion(config.template, 'email')}
              disabled={aiLoading}
              variant="outline"
              className="w-full text-xs"
            >
              {aiLoading ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Sparkles className="w-3 h-3 mr-2" />}
              Gerar Texto com IA
            </Button>
          )}
          {aiSuggestion && (
            <div className="bg-indigo-50 border border-indigo-200 rounded p-3">
              <p className="text-xs font-semibold text-indigo-900 mb-2">Sugestão IA:</p>
              <p className="text-xs text-indigo-800">{aiSuggestion}</p>
              <Button
                onClick={() => onChange({ ...config, aiSuggestedText: aiSuggestion })}
                size="sm"
                className="mt-2 w-full text-xs bg-indigo-600 hover:bg-indigo-700"
              >
                ✓ Usar esta sugestão
              </Button>
            </div>
          )}
        </div>
      );
    case 'create_task':
      return (
        <div className="space-y-3">
          <div>
            <label className="text-sm font-semibold text-slate-700 mb-2 block">Título da Tarefa</label>
            <Input
              value={config.title || ''}
              onChange={(e) => onChange({ ...config, title: e.target.value })}
              placeholder="Ex: Follow-up com cliente"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">Tipo</label>
              <Select value={config.type || ''} onValueChange={(v) => onChange({ ...config, type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="follow_up">Follow-up</SelectItem>
                  <SelectItem value="ligacao">Ligação</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="visita">Visita</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-semibold text-slate-700 mb-2 block">Prioridade</label>
              <Select value={config.priority || ''} onValueChange={(v) => onChange({ ...config, priority: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      );
    case 'update_client_status':
      return (
        <div>
          <label className="text-sm font-semibold text-slate-700 mb-2 block">Novo Status</label>
          <Select value={config.status || ''} onValueChange={(v) => onChange({ ...config, status: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="quente">🔥 Quente</SelectItem>
              <SelectItem value="morno">🌡️ Morno</SelectItem>
              <SelectItem value="frio">❄️ Frio</SelectItem>
            </SelectContent>
          </Select>
        </div>
      );
    case 'send_whatsapp':
      return <SendWhatsAppConfig config={config} onChange={onChange} />;
    default:
      return null;
  }
}

function SendWhatsAppConfig({ config, onChange }) {
  const [whatsappSuggestion, setWhatsappSuggestion] = useState('');
  const [whatsappLoading, setWhatsappLoading] = useState(false);

  const generateWhatsAppSuggestion = async (template) => {
    setWhatsappLoading(true);
    try {
      const response = await base44.functions.invoke('generateAIMessageSuggestion', {
        clientId: 'sample',
        channel: 'whatsapp',
        template,
        actionType: template
      });
      setWhatsappSuggestion(response.data.suggestion);
      toast.success('Sugestão gerada!');
    } catch (error) {
      toast.error('Erro ao gerar sugestão');
    } finally {
      setWhatsappLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-semibold text-slate-700 mb-2 block">Template WhatsApp</label>
        <Select value={config.template || ''} onValueChange={(v) => onChange({ ...config, template: v })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="welcome_new_lead">Bem-vindo Lead</SelectItem>
            <SelectItem value="followup_visit">Follow-up Visita</SelectItem>
            <SelectItem value="proposal_reminder">Lembrete Proposta</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {config.template && (
        <Button
          onClick={() => generateWhatsAppSuggestion(config.template)}
          disabled={whatsappLoading}
          variant="outline"
          className="w-full text-xs"
        >
          {whatsappLoading ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Sparkles className="w-3 h-3 mr-2" />}
          Gerar Mensagem com IA
        </Button>
      )}
      {whatsappSuggestion && (
        <div className="bg-green-50 border border-green-200 rounded p-3">
          <p className="text-xs font-semibold text-green-900 mb-2">Sugestão IA:</p>
          <p className="text-xs text-green-800">{whatsappSuggestion}</p>
          <Button
            onClick={() => onChange({ ...config, aiSuggestedText: whatsappSuggestion })}
            size="sm"
            className="mt-2 w-full text-xs bg-green-600 hover:bg-green-700"
          >
            ✓ Usar esta sugestão
          </Button>
        </div>
      )}
    </div>
  );
}
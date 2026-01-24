import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, Zap, Mail, MessageCircle, Bell, Play, Pause, Trash2, 
  Edit2, Save, X, TrendingUp, Clock, CheckCircle2, AlertCircle, Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

export default function AutoFollowUpManager() {
  const queryClient = useQueryClient();
  const [editingRule, setEditingRule] = useState(null);
  const [creating, setCreating] = useState(false);
  const [executing, setExecuting] = useState(false);

  const { data: rules = [] } = useQuery({
    queryKey: ['autoFollowUpRules'],
    queryFn: () => base44.entities.AutoFollowUpRule.list('-created_date')
  });

  const { data: executions = [] } = useQuery({
    queryKey: ['autoFollowUpExecutions'],
    queryFn: () => base44.entities.AutoFollowUpExecution.list('-created_date', 50)
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.AutoFollowUpRule.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['autoFollowUpRules']);
      setCreating(false);
      setEditingRule(null);
      toast.success('Regra criada!');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.AutoFollowUpRule.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['autoFollowUpRules']);
      setEditingRule(null);
      toast.success('Regra atualizada!');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.AutoFollowUpRule.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['autoFollowUpRules']);
      toast.success('Regra removida!');
    }
  });

  const executeNow = async () => {
    setExecuting(true);
    try {
      const result = await base44.functions.invoke('processAutoFollowUps', {});
      queryClient.invalidateQueries(['autoFollowUpExecutions']);
      toast.success(`${result.data.total_executed} follow-ups enviados!`);
    } catch (error) {
      toast.error('Erro ao executar: ' + error.message);
    } finally {
      setExecuting(false);
    }
  };

  const RuleForm = ({ rule, onSave, onCancel }) => {
    const [formData, setFormData] = useState(rule || {
      name: '',
      description: '',
      trigger_type: 'inactivity_days',
      trigger_config: { days_threshold: 7, target_status: [] },
      channels: [],
      use_ai_personalization: true,
      message_template: '',
      email_subject_template: '',
      priority: 'media',
      create_task: false,
      task_config: {},
      active: true
    });

    return (
      <Card className="border-2 border-purple-300">
        <CardContent className="pt-6 space-y-4">
          <div>
            <Label>Nome da Regra *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Follow-up após 7 dias sem contato"
            />
          </div>

          <div>
            <Label>Descrição</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descreva quando e por que esta regra será disparada"
              rows={2}
            />
          </div>

          <div>
            <Label>Tipo de Gatilho *</Label>
            <Select value={formData.trigger_type} onValueChange={(v) => setFormData({ ...formData, trigger_type: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inactivity_days">⏰ Dias sem interação</SelectItem>
                <SelectItem value="after_visit">📅 Após visita</SelectItem>
                <SelectItem value="score_drop">📉 Queda no score</SelectItem>
                <SelectItem value="status_change">🔄 Mudança de status</SelectItem>
                <SelectItem value="approaching_deadline">⚠️ Prazo se aproximando</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(formData.trigger_type === 'inactivity_days' || 
            formData.trigger_type === 'after_visit' ||
            formData.trigger_type === 'approaching_deadline') && (
            <div>
              <Label>Dias (threshold)</Label>
              <Input
                type="number"
                value={formData.trigger_config?.days_threshold || 7}
                onChange={(e) => setFormData({
                  ...formData,
                  trigger_config: { ...formData.trigger_config, days_threshold: parseInt(e.target.value) }
                })}
              />
            </div>
          )}

          <div>
            <Label>Canais de Envio *</Label>
            <div className="space-y-2 mt-2">
              {['email', 'whatsapp', 'notification'].map(channel => (
                <div key={channel} className="flex items-center gap-2">
                  <Checkbox
                    checked={formData.channels?.includes(channel)}
                    onCheckedChange={(checked) => {
                      const newChannels = checked
                        ? [...(formData.channels || []), channel]
                        : (formData.channels || []).filter(c => c !== channel);
                      setFormData({ ...formData, channels: newChannels });
                    }}
                  />
                  <label className="text-sm flex items-center gap-2">
                    {channel === 'email' && <Mail className="w-4 h-4" />}
                    {channel === 'whatsapp' && <MessageCircle className="w-4 h-4" />}
                    {channel === 'notification' && <Bell className="w-4 h-4" />}
                    {channel === 'email' ? 'Email' : channel === 'whatsapp' ? 'WhatsApp' : 'Notificação Interna'}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={formData.use_ai_personalization}
              onCheckedChange={(checked) => setFormData({ ...formData, use_ai_personalization: checked })}
            />
            <Label className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              Personalizar com IA
            </Label>
          </div>

          <div>
            <Label>Template da Mensagem</Label>
            <Textarea
              value={formData.message_template}
              onChange={(e) => setFormData({ ...formData, message_template: e.target.value })}
              placeholder="Olá {nome}, notamos que não conversamos há {dias} dias..."
              rows={4}
            />
          </div>

          {formData.channels?.includes('email') && (
            <div>
              <Label>Assunto do Email</Label>
              <Input
                value={formData.email_subject_template}
                onChange={(e) => setFormData({ ...formData, email_subject_template: e.target.value })}
                placeholder="Ex: Seguindo nossa conversa sobre {equipamento}"
              />
            </div>
          )}

          <div className="flex items-center gap-2">
            <Switch
              checked={formData.create_task}
              onCheckedChange={(checked) => setFormData({ ...formData, create_task: checked })}
            />
            <Label>Criar tarefa automaticamente</Label>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => onSave(formData)} className="flex-1">
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>
            <Button onClick={onCancel} variant="outline">
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-600" />
            Sistema de Follow-Up Automatizado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Button
              onClick={() => setCreating(true)}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Regra
            </Button>
            <Button
              onClick={executeNow}
              disabled={executing}
              variant="outline"
              className="flex-1"
            >
              {executing ? (
                <Clock className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              Executar Agora
            </Button>
          </div>

          <Tabs defaultValue="rules">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="rules">Regras ({rules.length})</TabsTrigger>
              <TabsTrigger value="executions">Histórico ({executions.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="rules" className="space-y-3 mt-4">
              {creating && (
                <RuleForm
                  onSave={(data) => createMutation.mutate(data)}
                  onCancel={() => setCreating(false)}
                />
              )}

              {rules.map(rule => (
                <Card key={rule.id} className={`${rule.active ? 'border-green-200' : 'border-gray-200'}`}>
                  {editingRule === rule.id ? (
                    <RuleForm
                      rule={rule}
                      onSave={(data) => updateMutation.mutate({ id: rule.id, data })}
                      onCancel={() => setEditingRule(null)}
                    />
                  ) : (
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-gray-800">{rule.name}</h4>
                            {!rule.active && <Badge variant="outline">Pausada</Badge>}
                          </div>
                          <p className="text-sm text-gray-600">{rule.description}</p>
                        </div>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="flex gap-2">
                          {rule.channels?.map(ch => (
                            <Badge key={ch} variant="outline" className="flex items-center gap-1">
                              {ch === 'email' && <Mail className="w-3 h-3" />}
                              {ch === 'whatsapp' && <MessageCircle className="w-3 h-3" />}
                              {ch === 'notification' && <Bell className="w-3 h-3" />}
                              {ch}
                            </Badge>
                          ))}
                          {rule.use_ai_personalization && (
                            <Badge className="bg-purple-600 text-white flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              IA
                            </Badge>
                          )}
                        </div>

                        <div className="flex gap-4 text-gray-600">
                          <span>Execuções: {rule.execution_count || 0}</span>
                          <span>Sucesso: {rule.success_count || 0}</span>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingRule(rule.id)}
                        >
                          <Edit2 className="w-3 h-3 mr-1" />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            updateMutation.mutate({
                              id: rule.id,
                              data: { active: !rule.active }
                            });
                          }}
                        >
                          {rule.active ? (
                            <><Pause className="w-3 h-3 mr-1" />Pausar</>
                          ) : (
                            <><Play className="w-3 h-3 mr-1" />Ativar</>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (confirm('Remover regra?')) {
                              deleteMutation.mutate(rule.id);
                            }
                          }}
                          className="text-red-600"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}

              {rules.length === 0 && !creating && (
                <div className="text-center py-8 text-gray-500">
                  <Zap className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>Nenhuma regra criada ainda</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="executions" className="space-y-2 mt-4">
              {executions.map(exec => (
                <Card key={exec.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold text-gray-800">{exec.client_name}</p>
                        <p className="text-xs text-gray-600">{exec.rule_name}</p>
                      </div>
                      <Badge className={
                        exec.status === 'success' ? 'bg-green-600' :
                        exec.status === 'failed' ? 'bg-red-600' : 'bg-yellow-600'
                      }>
                        {exec.status === 'success' ? <CheckCircle2 className="w-3 h-3 mr-1" /> :
                         exec.status === 'failed' ? <AlertCircle className="w-3 h-3 mr-1" /> : null}
                        {exec.status}
                      </Badge>
                    </div>

                    <div className="text-xs text-gray-600 space-y-1">
                      <p><strong>Razão:</strong> {exec.trigger_reason}</p>
                      <div className="flex gap-2">
                        {exec.channels_used?.map(ch => (
                          <Badge key={ch} variant="outline" className="text-xs">
                            {ch}
                          </Badge>
                        ))}
                        {exec.ai_personalized && (
                          <Badge className="bg-purple-100 text-purple-700 text-xs">
                            <Sparkles className="w-3 h-3 mr-1" />
                            IA
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-500">
                        {new Date(exec.created_date).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Plus,
  Zap,
  Play,
  Pause,
  Trash2,
  Edit2,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

export default function AutomationRules() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    trigger_type: 'lead_score_threshold',
    trigger_condition: {},
    action_type: 'send_alert',
    action_config: {},
    active: true
  });

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['automation-rules'],
    queryFn: () => base44.entities.LeadAutomationRule.list('-created_date', 50)
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.LeadAutomationRule.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['automation-rules']);
      setDialogOpen(false);
      resetForm();
      toast.success('Regra criada!');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.LeadAutomationRule.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['automation-rules']);
      setDialogOpen(false);
      setEditingRule(null);
      resetForm();
      toast.success('Regra atualizada!');
    }
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }) => base44.entities.LeadAutomationRule.update(id, { active }),
    onSuccess: () => queryClient.invalidateQueries(['automation-rules'])
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.LeadAutomationRule.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['automation-rules']);
      toast.success('Regra removida!');
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      trigger_type: 'lead_score_threshold',
      trigger_condition: {},
      action_type: 'send_alert',
      action_config: {},
      active: true
    });
  };

  const handleSubmit = () => {
    if (!formData.name) {
      toast.error('Nome é obrigatório');
      return;
    }

    if (editingRule) {
      updateMutation.mutate({ id: editingRule.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (rule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      trigger_type: rule.trigger_type,
      trigger_condition: rule.trigger_condition || {},
      action_type: rule.action_type,
      action_config: rule.action_config || {},
      active: rule.active
    });
    setDialogOpen(true);
  };

  const triggerLabels = {
    lead_created: 'Lead Criado',
    lead_status_change: 'Status do Lead Alterado',
    lead_score_threshold: 'Score do Lead Acima de',
    lead_inactive_days: 'Lead Inativo por X Dias',
    client_status_change: 'Status do Cliente Alterado'
  };

  const actionLabels = {
    create_task: 'Criar Tarefa',
    send_whatsapp: 'Enviar WhatsApp',
    send_alert: 'Enviar Alerta',
    assign_to_user: 'Atribuir a Vendedor'
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="bg-gradient-to-br from-indigo-600 to-purple-600 px-4 pt-4 pb-16 rounded-b-[2rem]">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-white/10">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-white">Automações</h1>
            <p className="text-sm text-indigo-100">Regras de fluxo de trabalho</p>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setEditingRule(null);
              setDialogOpen(true);
            }}
            size="sm"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <Plus className="w-4 h-4 mr-1" />
            Nova
          </Button>
        </div>
      </div>

      <div className="px-4 -mt-8 space-y-3">
        {rules.length === 0 ? (
          <Card className="p-12 text-center">
            <Zap className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500 mb-4">Nenhuma automação configurada</p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeira Automação
            </Button>
          </Card>
        ) : (
          rules.map(rule => (
            <Card key={rule.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-slate-800">{rule.name}</h3>
                    {rule.active ? (
                      <Badge className="bg-green-100 text-green-700">Ativa</Badge>
                    ) : (
                      <Badge variant="outline" className="text-slate-500">Pausada</Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                      {triggerLabels[rule.trigger_type]}
                    </Badge>
                    <Badge variant="outline" className="bg-purple-50 text-purple-700">
                      → {actionLabels[rule.action_type]}
                    </Badge>
                  </div>
                </div>

                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleMutation.mutate({ id: rule.id, active: !rule.active })}
                    className="h-8 w-8"
                  >
                    {rule.active ? (
                      <Pause className="w-4 h-4 text-amber-600" />
                    ) : (
                      <Play className="w-4 h-4 text-green-600" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(rule)}
                    className="h-8 w-8"
                  >
                    <Edit2 className="w-4 h-4 text-blue-600" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (window.confirm('Remover esta automação?')) {
                        deleteMutation.mutate(rule.id);
                      }
                    }}
                    className="h-8 w-8"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>

              {/* Detalhes da configuração */}
              <div className="mt-2 p-2 bg-slate-50 rounded text-xs text-slate-600">
                {rule.trigger_type === 'lead_score_threshold' && rule.trigger_condition?.score_threshold && (
                  <p>• Score ≥ {rule.trigger_condition.score_threshold}</p>
                )}
                {rule.trigger_type === 'lead_inactive_days' && rule.trigger_condition?.days && (
                  <p>• Inativo por {rule.trigger_condition.days} dias</p>
                )}
                {rule.action_type === 'create_task' && rule.action_config?.task_title && (
                  <p>• Tarefa: "{rule.action_config.task_title}"</p>
                )}
                {rule.action_type === 'send_alert' && rule.action_config?.alert_title && (
                  <p>• Alerta: "{rule.action_config.alert_title}"</p>
                )}
              </div>
            </Card>
          ))
        )}

        {/* Info Card */}
        <Card className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
          <div className="flex items-start gap-3">
            <Zap className="w-5 h-5 text-indigo-600 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-800 mb-1">Como Funciona</p>
              <ul className="text-xs text-slate-600 space-y-1">
                <li>• Automações monitoram leads e clientes continuamente</li>
                <li>• Quando o gatilho é ativado, a ação é executada</li>
                <li>• Cada regra executa no máximo 1x por dia por entidade</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRule ? 'Editar' : 'Nova'} Automação</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Nome da Regra *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Alertar sobre lead quente"
              />
            </div>

            <div>
              <Label>Gatilho *</Label>
              <Select value={formData.trigger_type} onValueChange={(v) => setFormData({ ...formData, trigger_type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lead_created">Lead Criado</SelectItem>
                  <SelectItem value="lead_score_threshold">Score Alto</SelectItem>
                  <SelectItem value="lead_inactive_days">Lead Inativo</SelectItem>
                  <SelectItem value="client_status_change">Cliente Mudou Status</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Trigger Config */}
            {formData.trigger_type === 'lead_score_threshold' && (
              <div>
                <Label>Score Mínimo</Label>
                <Input
                  type="number"
                  value={formData.trigger_condition?.score_threshold || 70}
                  onChange={(e) => setFormData({
                    ...formData,
                    trigger_condition: { score_threshold: parseInt(e.target.value) }
                  })}
                />
              </div>
            )}

            {formData.trigger_type === 'lead_inactive_days' && (
              <div>
                <Label>Dias de Inatividade</Label>
                <Input
                  type="number"
                  value={formData.trigger_condition?.days || 7}
                  onChange={(e) => setFormData({
                    ...formData,
                    trigger_condition: { days: parseInt(e.target.value) }
                  })}
                />
              </div>
            )}

            <div>
              <Label>Ação *</Label>
              <Select value={formData.action_type} onValueChange={(v) => setFormData({ ...formData, action_type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="send_alert">Enviar Alerta</SelectItem>
                  <SelectItem value="create_task">Criar Tarefa</SelectItem>
                  <SelectItem value="send_whatsapp">Enviar WhatsApp</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Action Config */}
            {formData.action_type === 'send_alert' && (
              <>
                <div>
                  <Label>Título do Alerta</Label>
                  <Input
                    value={formData.action_config?.alert_title || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      action_config: { ...formData.action_config, alert_title: e.target.value }
                    })}
                    placeholder="🔥 Lead Quente!"
                  />
                </div>
                <div>
                  <Label>Mensagem</Label>
                  <Input
                    value={formData.action_config?.alert_message || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      action_config: { ...formData.action_config, alert_message: e.target.value }
                    })}
                    placeholder="Lead com alta pontuação precisa de atenção"
                  />
                </div>
              </>
            )}

            {formData.action_type === 'create_task' && (
              <>
                <div>
                  <Label>Título da Tarefa</Label>
                  <Input
                    value={formData.action_config?.task_title || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      action_config: { ...formData.action_config, task_title: e.target.value }
                    })}
                    placeholder="Entrar em contato com lead"
                  />
                </div>
                <div>
                  <Label>Prioridade</Label>
                  <Select
                    value={formData.action_config?.priority || 'alta'}
                    onValueChange={(v) => setFormData({
                      ...formData,
                      action_config: { ...formData.action_config, priority: v }
                    })}
                  >
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
                <div>
                  <Label>Prazo (dias a partir de hoje)</Label>
                  <Input
                    type="number"
                    value={formData.action_config?.days_offset || 1}
                    onChange={(e) => setFormData({
                      ...formData,
                      action_config: { ...formData.action_config, days_offset: parseInt(e.target.value) }
                    })}
                  />
                </div>
              </>
            )}

            {formData.action_type === 'send_whatsapp' && (
              <div>
                <Label>Mensagem WhatsApp</Label>
                <Input
                  value={formData.action_config?.whatsapp_message || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    action_config: { ...formData.action_config, whatsapp_message: e.target.value }
                  })}
                  placeholder="Olá! Vimos que você tem interesse em..."
                />
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700"
              >
                {(createMutation.isPending || updateMutation.isPending) ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  editingRule ? 'Salvar' : 'Criar'
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setDialogOpen(false);
                  setEditingRule(null);
                  resetForm();
                }}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
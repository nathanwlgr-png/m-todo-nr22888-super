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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
  Trash2,
  Play,
  Pause,
  Loader2,
  Save
} from 'lucide-react';

const triggerLabels = {
  status_change: 'Mudança de Status',
  days_without_contact: 'Dias sem Contato',
  visit_completed: 'Visita Realizada',
  proposal_sent: 'Proposta Enviada',
  score_drop: 'Queda no Score',
  new_client: 'Novo Cliente'
};

export default function TaskAutomation() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    trigger_type: 'days_without_contact',
    trigger_condition: {},
    task_template: {
      title: '',
      description: '',
      type: 'follow_up',
      priority: 'media',
      days_offset: 0
    },
    active: true,
    target_client_types: []
  });

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['task-automation-rules'],
    queryFn: () => base44.entities.TaskAutomationRule.list('-created_date', 50)
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.TaskAutomationRule.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['task-automation-rules']);
      setDialogOpen(false);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.TaskAutomationRule.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['task-automation-rules']);
      setDialogOpen(false);
      setEditingRule(null);
      resetForm();
    }
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, active }) => base44.entities.TaskAutomationRule.update(id, { active }),
    onSuccess: () => queryClient.invalidateQueries(['task-automation-rules'])
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.TaskAutomationRule.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['task-automation-rules'])
  });

  const resetForm = () => {
    setFormData({
      name: '',
      trigger_type: 'days_without_contact',
      trigger_condition: {},
      task_template: {
        title: '',
        description: '',
        type: 'follow_up',
        priority: 'media',
        days_offset: 0
      },
      active: true,
      target_client_types: []
    });
  };

  const handleEdit = (rule) => {
    setEditingRule(rule);
    setFormData(rule);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.task_template.title) {
      alert('Preencha nome e título da tarefa');
      return;
    }

    if (editingRule) {
      updateMutation.mutate({ id: editingRule.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-900 to-indigo-900 px-4 pt-4 pb-16 rounded-b-[2rem]">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full glass hover:bg-white/10">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-white">Automação de Tarefas</h1>
            <p className="text-sm text-purple-200">Regras inteligentes</p>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setEditingRule(null);
              setDialogOpen(true);
            }}
            className="bg-orange-600 hover:bg-orange-700"
          >
            <Plus className="w-4 h-4 mr-1" />
            Nova
          </Button>
        </div>
      </div>

      <div className="px-6 -mt-8 space-y-3">
        {rules.length === 0 ? (
          <Card className="p-8 text-center">
            <Zap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 mb-4">Nenhuma regra criada</p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeira Regra
            </Button>
          </Card>
        ) : (
          rules.map((rule) => (
            <Card key={rule.id} className="p-4 bg-white">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-slate-800">{rule.name}</h3>
                    {rule.active ? (
                      <Badge className="bg-green-100 text-green-700">Ativa</Badge>
                    ) : (
                      <Badge variant="outline" className="text-slate-500">Pausada</Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">{triggerLabels[rule.trigger_type]}</p>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(rule)}
                  >
                    <Zap className="w-4 h-4 text-indigo-600" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleActiveMutation.mutate({ 
                      id: rule.id, 
                      active: !rule.active 
                    })}
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
                    onClick={() => {
                      if (window.confirm('Remover regra?')) {
                        deleteMutation.mutate(rule.id);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t text-sm text-slate-600">
                <p><strong>Tarefa criada:</strong> {rule.task_template?.title}</p>
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline">{rule.task_template?.priority}</Badge>
                  <Badge variant="outline">{rule.task_template?.type}</Badge>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRule ? 'Editar Regra' : 'Nova Regra'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Nome da Regra *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Reengajar clientes frios"
              />
            </div>

            <div>
              <Label>Gatilho</Label>
              <Select
                value={formData.trigger_type}
                onValueChange={(value) => setFormData({ ...formData, trigger_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(triggerLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {formData.trigger_type === 'days_without_contact' && (
              <div>
                <Label>Dias sem contato</Label>
                <Input
                  type="number"
                  value={formData.trigger_condition?.days || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    trigger_condition: { days: parseInt(e.target.value) }
                  })}
                  placeholder="7"
                />
              </div>
            )}

            {formData.trigger_type === 'status_change' && (
              <div>
                <Label>Para o status</Label>
                <Select
                  value={formData.trigger_condition?.to_status || ''}
                  onValueChange={(value) => setFormData({
                    ...formData,
                    trigger_condition: { to_status: value }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="quente">Quente</SelectItem>
                    <SelectItem value="morno">Morno</SelectItem>
                    <SelectItem value="frio">Frio</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="border-t pt-4">
              <h4 className="font-semibold text-slate-800 mb-3">Tarefa a Criar</h4>

              <div className="space-y-3">
                <div>
                  <Label>Título da Tarefa *</Label>
                  <Input
                    value={formData.task_template?.title}
                    onChange={(e) => setFormData({
                      ...formData,
                      task_template: { ...formData.task_template, title: e.target.value }
                    })}
                    placeholder="Ex: Ligar para reengajar cliente"
                  />
                </div>

                <div>
                  <Label>Descrição</Label>
                  <Textarea
                    value={formData.task_template?.description}
                    onChange={(e) => setFormData({
                      ...formData,
                      task_template: { ...formData.task_template, description: e.target.value }
                    })}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Tipo</Label>
                    <Select
                      value={formData.task_template?.type}
                      onValueChange={(value) => setFormData({
                        ...formData,
                        task_template: { ...formData.task_template, type: value }
                      })}
                    >
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
                    <Label>Prioridade</Label>
                    <Select
                      value={formData.task_template?.priority}
                      onValueChange={(value) => setFormData({
                        ...formData,
                        task_template: { ...formData.task_template, priority: value }
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
                </div>

                <div>
                  <Label>Criar tarefa após (dias)</Label>
                  <Input
                    type="number"
                    value={formData.task_template?.days_offset}
                    onChange={(e) => setFormData({
                      ...formData,
                      task_template: { ...formData.task_template, days_offset: parseInt(e.target.value) }
                    })}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4">
              <Label>Regra ativa</Label>
              <Switch
                checked={formData.active}
                onCheckedChange={(value) => setFormData({ ...formData, active: value })}
              />
            </div>

            <Button
              onClick={handleSave}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {editingRule ? 'Atualizar' : 'Criar'} Regra
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
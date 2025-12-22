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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Zap,
  Mail,
  FileText,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  Settings,
  Play
} from 'lucide-react';
import { format } from 'date-fns';

const taskTypeLabels = {
  email_followup: 'E-mail de Follow-up',
  monthly_report: 'Relatório Mensal',
  stock_alert: 'Alerta de Estoque',
  consumable_reorder_reminder: 'Lembrete de Reposição'
};

const taskTypeIcons = {
  email_followup: Mail,
  monthly_report: FileText,
  stock_alert: Package,
  consumable_reorder_reminder: Clock
};

const frequencyLabels = {
  daily: 'Diariamente',
  weekly: 'Semanalmente',
  monthly: 'Mensalmente',
  on_trigger: 'Por Gatilho'
};

export default function AutomationManager() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [dialog, setDialog] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  const { data: automations = [] } = useQuery({
    queryKey: ['automation-tasks'],
    queryFn: () => base44.entities.AutomationTask.list('-created_date')
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.AutomationTask.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['automation-tasks']);
      setDialog(false);
      setEditingTask(null);
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.AutomationTask.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['automation-tasks']);
      setDialog(false);
      setEditingTask(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.AutomationTask.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['automation-tasks']);
    }
  });

  const handleNew = () => {
    setEditingTask({
      name: '',
      task_type: 'email_followup',
      frequency: 'weekly',
      active: true,
      config: {}
    });
    setDialog(true);
  };

  const handleEdit = (automation) => {
    setEditingTask(automation);
    setDialog(true);
  };

  const handleSave = () => {
    if (editingTask.id) {
      updateMutation.mutate({ id: editingTask.id, data: editingTask });
    } else {
      createMutation.mutate(editingTask);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Deseja realmente excluir esta automação?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleToggleActive = (automation) => {
    updateMutation.mutate({
      id: automation.id,
      data: { active: !automation.active }
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-slate-100">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-slate-800">Automações</h1>
            <p className="text-xs text-slate-500">{automations.length} configuradas</p>
          </div>
          <Button size="sm" onClick={handleNew} className="bg-purple-600 hover:bg-purple-700">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {automations.map((automation) => {
          const Icon = taskTypeIcons[automation.task_type] || Zap;
          const isActive = automation.active;
          const lastResult = automation.last_result;

          return (
            <Card key={automation.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    isActive ? 'bg-purple-100' : 'bg-slate-100'
                  }`}>
                    <Icon className={`w-5 h-5 ${isActive ? 'text-purple-600' : 'text-slate-400'}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-800">{automation.name}</h3>
                      <Badge variant="outline" className="text-xs">
                        {taskTypeLabels[automation.task_type]}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-600">
                      {frequencyLabels[automation.frequency]}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={isActive}
                  onCheckedChange={() => handleToggleActive(automation)}
                />
              </div>

              {automation.last_execution && (
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="text-slate-600">
                    Última execução: {format(new Date(automation.last_execution), 'dd/MM/yyyy HH:mm')}
                  </span>
                  {lastResult && (
                    <div className="flex items-center gap-1">
                      {lastResult.status === 'success' ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600" />
                      )}
                      <span className={lastResult.status === 'success' ? 'text-green-600' : 'text-red-600'}>
                        {lastResult.details}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {automation.execution_count > 0 && (
                <p className="text-xs text-slate-500 mb-3">
                  Executada {automation.execution_count}x
                </p>
              )}

              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(automation)}
                  className="flex-1"
                >
                  <Settings className="w-4 h-4 mr-1" />
                  Configurar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(automation.id)}
                  className="text-red-600 border-red-200"
                >
                  Excluir
                </Button>
              </div>
            </Card>
          );
        })}

        {automations.length === 0 && (
          <Card className="p-8 text-center">
            <Zap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 mb-4">Nenhuma automação configurada</p>
            <Button onClick={handleNew} variant="outline">
              Criar Primeira Automação
            </Button>
          </Card>
        )}
      </div>

      {/* Dialog de Configuração */}
      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTask?.id ? 'Editar' : 'Nova'} Automação</DialogTitle>
          </DialogHeader>

          {editingTask && (
            <div className="space-y-4 py-4">
              <div>
                <Label>Nome *</Label>
                <Input
                  value={editingTask.name}
                  onChange={(e) => setEditingTask({ ...editingTask, name: e.target.value })}
                  placeholder="Ex: Follow-up clientes mornos"
                />
              </div>

              <div>
                <Label>Tipo de Automação *</Label>
                <Select
                  value={editingTask.task_type}
                  onValueChange={(v) => setEditingTask({ ...editingTask, task_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email_followup">E-mail de Follow-up</SelectItem>
                    <SelectItem value="monthly_report">Relatório Mensal</SelectItem>
                    <SelectItem value="stock_alert">Alerta de Estoque</SelectItem>
                    <SelectItem value="consumable_reorder_reminder">Lembrete de Reposição</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Frequência *</Label>
                <Select
                  value={editingTask.frequency}
                  onValueChange={(v) => setEditingTask({ ...editingTask, frequency: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Diariamente</SelectItem>
                    <SelectItem value="weekly">Semanalmente</SelectItem>
                    <SelectItem value="monthly">Mensalmente</SelectItem>
                    <SelectItem value="on_trigger">Por Gatilho</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Configurações específicas por tipo */}
              {editingTask.task_type === 'email_followup' && (
                <>
                  <div>
                    <Label>Status do Cliente</Label>
                    <Select
                      value={editingTask.config?.trigger_conditions?.status}
                      onValueChange={(v) => setEditingTask({
                        ...editingTask,
                        config: {
                          ...editingTask.config,
                          trigger_conditions: {
                            ...editingTask.config?.trigger_conditions,
                            status: v
                          }
                        }
                      })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="quente">Quente</SelectItem>
                        <SelectItem value="morno">Morno</SelectItem>
                        <SelectItem value="frio">Frio</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Dias sem contato (mínimo)</Label>
                    <Input
                      type="number"
                      value={editingTask.config?.trigger_conditions?.days_without_contact || ''}
                      onChange={(e) => setEditingTask({
                        ...editingTask,
                        config: {
                          ...editingTask.config,
                          trigger_conditions: {
                            ...editingTask.config?.trigger_conditions,
                            days_without_contact: parseInt(e.target.value)
                          }
                        }
                      })}
                      placeholder="Ex: 7"
                    />
                  </div>

                  <div>
                    <Label>Assunto do E-mail</Label>
                    <Input
                      value={editingTask.config?.email_subject || ''}
                      onChange={(e) => setEditingTask({
                        ...editingTask,
                        config: { ...editingTask.config, email_subject: e.target.value }
                      })}
                      placeholder="Ex: Olá {{nome}}, vamos conversar?"
                    />
                  </div>

                  <div>
                    <Label>Mensagem</Label>
                    <Textarea
                      value={editingTask.config?.email_template || ''}
                      onChange={(e) => setEditingTask({
                        ...editingTask,
                        config: { ...editingTask.config, email_template: e.target.value }
                      })}
                      rows={5}
                      placeholder="Use {{nome}}, {{clinica}}, {{cidade}} para personalizar"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Variáveis: {'{{'}}nome{'}}'}, {'{{'}}clinica{'}}'}, {'{{'}}cidade{'}}'}
                    </p>
                  </div>
                </>
              )}

              {editingTask.task_type === 'monthly_report' && (
                <div>
                  <Label>Destinatários (um por linha)</Label>
                  <Textarea
                    value={editingTask.config?.recipients?.join('\n') || ''}
                    onChange={(e) => setEditingTask({
                      ...editingTask,
                      config: {
                        ...editingTask.config,
                        recipients: e.target.value.split('\n').filter(Boolean)
                      }
                    })}
                    rows={3}
                    placeholder="email1@exemplo.com&#10;email2@exemplo.com"
                  />
                </div>
              )}

              {editingTask.task_type === 'stock_alert' && (
                <>
                  <div>
                    <Label>Limite de Estoque</Label>
                    <Input
                      type="number"
                      value={editingTask.config?.stock_threshold || 10}
                      onChange={(e) => setEditingTask({
                        ...editingTask,
                        config: { ...editingTask.config, stock_threshold: parseInt(e.target.value) }
                      })}
                    />
                  </div>
                  <div>
                    <Label>Destinatários (um por linha)</Label>
                    <Textarea
                      value={editingTask.config?.recipients?.join('\n') || ''}
                      onChange={(e) => setEditingTask({
                        ...editingTask,
                        config: {
                          ...editingTask.config,
                          recipients: e.target.value.split('\n').filter(Boolean)
                        }
                      })}
                      rows={3}
                      placeholder="email1@exemplo.com&#10;email2@exemplo.com"
                    />
                  </div>
                </>
              )}

              <Button
                onClick={handleSave}
                disabled={createMutation.isPending || updateMutation.isPending || !editingTask.name}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                Salvar Automação
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
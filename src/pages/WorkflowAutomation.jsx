import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Zap, Plus, Trash2, Power, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function WorkflowAutomation() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const queryClient = useQueryClient();

  const { data: rules = [] } = useQuery({
    queryKey: ['workflow-rules'],
    queryFn: () => base44.entities.WorkflowRule.list('-created_date'),
  });

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.WorkflowRule.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['workflow-rules']);
      toast.success('Workflow removido');
    }
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }) => base44.entities.WorkflowRule.update(id, { is_active: !isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries(['workflow-rules']);
      toast.success('Status atualizado');
    }
  });

  const templates = [
    {
      name: '🔥 Follow-up Cliente Quente',
      trigger_type: 'status_change',
      trigger_conditions: { to_status: 'quente' },
      actions: [
        {
          action_type: 'create_task',
          action_data: {
            title: 'Follow-up urgente - Cliente QUENTE',
            description: 'Cliente mudou para status QUENTE. Entrar em contato imediatamente!',
            priority: 'alta',
            due_date_days: 1
          }
        },
        {
          action_type: 'create_alert',
          action_data: {
            title: '🔥 Novo Cliente Quente!',
            type: 'opportunity',
            priority: 'alta'
          }
        }
      ]
    },
    {
      name: '❄️ Reativar Cliente Frio',
      trigger_type: 'no_contact_days',
      trigger_conditions: { days_without_contact: 30 },
      actions: [
        {
          action_type: 'create_task',
          action_data: {
            title: 'Reativar cliente inativo',
            description: 'Cliente sem contato há 30 dias',
            priority: 'media'
          }
        },
        {
          action_type: 'send_message',
          action_data: {
            channel: 'whatsapp',
            template: 'Olá {nome}! Tudo bem? Faz tempo que não conversamos...'
          }
        }
      ]
    },
    {
      name: '⚠️ Alerta Sentimento Negativo',
      trigger_type: 'sentiment_negative',
      trigger_conditions: {},
      actions: [
        {
          action_type: 'create_alert',
          action_data: {
            title: '⚠️ Cliente insatisfeito!',
            type: 'negative_sentiment',
            priority: 'urgente'
          }
        },
        {
          action_type: 'notify_user',
          action_data: {
            message: 'Cliente demonstrou sentimento negativo'
          }
        }
      ]
    },
    {
      name: '📅 Task Pós-Visita',
      trigger_type: 'visit_scheduled',
      trigger_conditions: {},
      actions: [
        {
          action_type: 'create_task',
          action_data: {
            title: 'Follow-up pós-visita',
            description: 'Registrar resultado da visita',
            due_date_days: 0,
            priority: 'alta'
          }
        }
      ]
    }
  ];

  const createFromTemplate = async (template) => {
    try {
      await base44.entities.WorkflowRule.create(template);
      queryClient.invalidateQueries(['workflow-rules']);
      toast.success('Workflow criado!');
      setDialogOpen(false);
    } catch (error) {
      toast.error('Erro ao criar workflow');
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="p-6 text-center">
        <p className="text-slate-600">⚠️ Apenas administradores podem configurar workflows</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      <Card className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Zap className="w-6 h-6" />
            Automação de Workflows
          </CardTitle>
          <p className="text-purple-100">
            Configure ações automáticas baseadas em eventos do CRM
          </p>
        </CardHeader>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>
          <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 mr-2" />
            Novo Workflow
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Escolha um Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {templates.map((template, idx) => (
              <Card key={idx} className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold mb-1">{template.name}</h4>
                      <p className="text-xs text-slate-600 mb-2">
                        Gatilho: {template.trigger_type.replace('_', ' ')}
                      </p>
                      <div className="space-y-1">
                        {template.actions.map((action, i) => (
                          <Badge key={i} variant="outline" className="text-xs mr-1">
                            {action.action_type.replace('_', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => createFromTemplate(template)}
                      className="bg-indigo-600 hover:bg-indigo-700"
                    >
                      Usar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <div className="space-y-3">
        <h3 className="font-semibold text-slate-800">
          Workflows Ativos ({rules.filter(r => r.is_active).length})
        </h3>
        
        {rules.map(rule => (
          <Card key={rule.id} className={rule.is_active ? 'border-l-4 border-l-green-500' : 'opacity-50'}>
            <CardContent className="pt-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold">{rule.name}</h4>
                    <Badge variant={rule.is_active ? 'default' : 'secondary'}>
                      {rule.is_active ? 'Ativo' : 'Pausado'}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600">
                    Gatilho: {rule.trigger_type.replace('_', ' ')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleMutation.mutate({ id: rule.id, isActive: rule.is_active })}
                  >
                    <Power className={`w-4 h-4 ${rule.is_active ? 'text-green-600' : 'text-slate-400'}`} />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteMutation.mutate(rule.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-700">Ações:</p>
                <div className="flex flex-wrap gap-1">
                  {rule.actions?.map((action, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {action.action_type.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              </div>

              {rule.execution_count > 0 && (
                <p className="text-xs text-slate-500 mt-2">
                  ✅ Executado {rule.execution_count}x
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit2, Trash2, Check, X, AlertCircle, Zap } from 'lucide-react';
import { toast } from 'sonner';

const TRIGGER_TYPES = {
  low_stock: 'Estoque Baixo',
  low_score: 'Score Baixo de Cliente',
  sales_goal: 'Meta de Vendas',
  campaign_expiring: 'Campanha Expirando',
  client_status_change: 'Mudança de Status',
  new_interaction: 'Nova Interação',
  task_overdue: 'Tarefa Vencida',
  equipment_issue: 'Problema Equipamento',
  revenue_threshold: 'Limite Receita',
  custom_event: 'Evento Customizado'
};

const ACTION_TYPES = {
  create_task: 'Criar Tarefa',
  send_notification: 'Enviar Notificação',
  send_email: 'Enviar Email',
  update_client: 'Atualizar Cliente',
  webhook_call: 'Chamar Webhook'
};

export default function AutomationRuleBuilder() {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState(getEmptyForm());

  // Buscar regras
  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['automationRules'],
    queryFn: () => base44.entities.AutomationRule.list('-created_date', 100).catch(() => [])
  });

  // Criar/atualizar regra
  const mutation = useMutation({
    mutationFn: async (data) => {
      if (editingId) {
        return await base44.entities.AutomationRule.update(editingId, data);
      } else {
        return await base44.entities.AutomationRule.create({
          ...data,
          created_by_name: 'Admin'
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automationRules'] });
      toast.success(editingId ? 'Regra atualizada!' : 'Regra criada!');
      resetForm();
    },
    onError: (error) => toast.error('Erro: ' + error.message)
  });

  // Deletar regra
  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.AutomationRule.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automationRules'] });
      toast.success('Regra deletada!');
    }
  });

  const handleSave = () => {
    if (!formData.name || !formData.trigger_type || !formData.action_type) {
      toast.error('Preencha campos obrigatórios');
      return;
    }
    mutation.mutate(formData);
  };

  const resetForm = () => {
    setFormData(getEmptyForm());
    setIsCreating(false);
    setEditingId(null);
  };

  const startEdit = (rule) => {
    setFormData(rule);
    setEditingId(rule.id);
    setIsCreating(true);
  };

  return (
    <div className="space-y-6">
      {/* Form Criação */}
      {isCreating && (
        <Card className="border-2 border-blue-300 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-600" />
              {editingId ? 'Editar Regra' : 'Nova Regra de Automação'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Básico */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-slate-700">Nome *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nome da regra"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">Tipo *</label>
                <Select value={formData.rule_type} onValueChange={(v) => setFormData({ ...formData, rule_type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="task_creation">Criar Tarefas</SelectItem>
                    <SelectItem value="alert_notification">Enviar Alertas</SelectItem>
                    <SelectItem value="workflow_trigger">Disparar Workflow</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Gatilho e Ação */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-slate-700">Gatilho *</label>
                <Select value={formData.trigger_type} onValueChange={(v) => setFormData({ ...formData, trigger_type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TRIGGER_TYPES).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">Ação *</label>
                <Select value={formData.action_type} onValueChange={(v) => setFormData({ ...formData, action_type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ACTION_TYPES).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Frequência */}
            <div>
              <label className="text-sm font-semibold text-slate-700">Frequência</label>
              <Select value={formData.frequency} onValueChange={(v) => setFormData({ ...formData, frequency: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="on_each_event">Cada Evento</SelectItem>
                  <SelectItem value="daily">Diariamente</SelectItem>
                  <SelectItem value="weekly">Semanalmente</SelectItem>
                  <SelectItem value="once">Uma Vez</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Descrição */}
            <div>
              <label className="text-sm font-semibold text-slate-700">Descrição</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva o objetivo da regra"
              />
            </div>

            {/* Botões */}
            <div className="flex gap-3">
              <Button
                onClick={handleSave}
                disabled={mutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {mutation.isPending ? 'Salvando...' : 'Salvar Regra'}
              </Button>
              <Button
                onClick={resetForm}
                variant="outline"
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botão Criar */}
      {!isCreating && (
        <Button onClick={() => setIsCreating(true)} className="w-full bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Nova Regra de Automação
        </Button>
      )}

      {/* Lista de Regras */}
      <div className="space-y-3">
        <h3 className="font-bold text-slate-900">Regras Configuradas</h3>
        
        {isLoading ? (
          <p className="text-slate-600">Carregando regras...</p>
        ) : rules.length === 0 ? (
          <Card className="p-6 text-center text-slate-600">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-400" />
            Nenhuma regra configurada ainda
          </Card>
        ) : (
          rules.map((rule) => (
            <Card key={rule.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-bold text-slate-900">{rule.name}</h4>
                    <Badge variant={rule.enabled ? 'default' : 'outline'}>
                      {rule.enabled ? '✓ Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm text-slate-600 mb-2">
                    <p><strong>Gatilho:</strong> {TRIGGER_TYPES[rule.trigger_type]}</p>
                    <p><strong>Ação:</strong> {ACTION_TYPES[rule.action_type]}</p>
                    <p><strong>Frequência:</strong> {rule.frequency}</p>
                    <p><strong>Execuções:</strong> {rule.execution_count || 0} (✓ {rule.success_count || 0})</p>
                  </div>

                  {rule.description && (
                    <p className="text-sm text-slate-600 italic">{rule.description}</p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => startEdit(rule)}
                  >
                    <Edit2 className="w-4 h-4 text-blue-600" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => deleteMutation.mutate(rule.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

function getEmptyForm() {
  return {
    name: '',
    description: '',
    rule_type: 'task_creation',
    trigger_type: 'low_stock',
    action_type: 'create_task',
    trigger_conditions: {},
    action_config: {},
    enabled: true,
    frequency: 'on_each_event',
    tags: []
  };
}
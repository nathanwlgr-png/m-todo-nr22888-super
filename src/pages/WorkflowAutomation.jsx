import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Zap, Plus, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import AutomationBuilder from '@/components/AutomationBuilder.jsx';
import AutomationRulesList from '@/components/AutomationRulesList.jsx';
import AIAutomationSuggestions from '@/components/AIAutomationSuggestions.jsx';
import PredictiveSalesAnalysis from '@/components/PredictiveSalesAnalysis.jsx';
import { toast } from 'sonner';

export default function WorkflowAutomation() {
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [activeTab, setActiveTab] = useState('rules');
  const queryClient = useQueryClient();

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['automationRules'],
    queryFn: () => base44.entities.AutomationRule?.list('-updated_date', 100).catch(() => [])
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.AutomationRule.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automationRules'] });
      setShowBuilder(false);
      toast.success('Automação criada com sucesso!');
    },
    onError: () => toast.error('Erro ao criar automação')
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.AutomationRule.update(editingRule.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automationRules'] });
      setEditingRule(null);
      setShowBuilder(false);
      toast.success('Automação atualizada com sucesso!');
    },
    onError: () => toast.error('Erro ao atualizar automação')
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.AutomationRule.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automationRules'] });
      toast.success('Automação removida!');
    },
    onError: () => toast.error('Erro ao remover automação')
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, active }) => base44.entities.AutomationRule.update(id, { active: !active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automationRules'] });
    }
  });

  const handleSave = (data) => {
    if (editingRule) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const activeCount = rules.filter(r => r.active).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-black text-slate-900">Automações</h1>
                <p className="text-sm text-slate-600 mt-1">{activeCount} de {rules.length} automações ativas</p>
              </div>
            </div>
            <Button
              onClick={() => {
                setEditingRule(null);
                setShowBuilder(true);
              }}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Automação
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white shadow-lg rounded-xl p-1">
            <TabsTrigger value="rules" className="flex-1">
              📋 Minhas Automações
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex-1">
              ⭐ Templates
            </TabsTrigger>
            <TabsTrigger value="logs" className="flex-1">
              📊 Histórico
            </TabsTrigger>
          </TabsList>

          {/* Automações */}
          {activeTab === 'rules' && (
            <>
              {showBuilder ? (
                <Card className="bg-white shadow-xl border-0">
                  <CardHeader className="border-b">
                    <CardTitle>
                      {editingRule ? 'Editar Automação' : 'Criar Nova Automação'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <AutomationBuilder
                      rule={editingRule}
                      onSave={handleSave}
                      onCancel={() => {
                        setShowBuilder(false);
                        setEditingRule(null);
                      }}
                      isLoading={createMutation.isPending || updateMutation.isPending}
                    />
                  </CardContent>
                </Card>
              ) : (
                <AutomationRulesList
                  rules={rules}
                  isLoading={isLoading}
                  onEdit={(rule) => {
                    setEditingRule(rule);
                    setShowBuilder(true);
                  }}
                  onDelete={(id) => deleteMutation.mutate(id)}
                  onToggle={(rule) => toggleMutation.mutate({ id: rule.id, active: rule.active })}
                  isDeleting={deleteMutation.isPending}
                  isToggling={toggleMutation.isPending}
                />
              )}
            </>
          )}

          {/* Templates */}
          {activeTab === 'templates' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {TEMPLATES.map((template) => (
                <Card key={template.id} className="bg-white shadow-lg border-0 hover:shadow-xl transition-all cursor-pointer"
                  onClick={() => {
                    setEditingRule(template);
                    setShowBuilder(true);
                  }}>
                  <CardContent className="p-6">
                    <h3 className="font-bold text-lg mb-2">{template.name}</h3>
                    <p className="text-sm text-slate-600 mb-4">{template.description}</p>
                    <div className="space-y-2 mb-4">
                      <div className="text-xs">
                        <span className="font-semibold text-purple-600">Gatilho:</span> {template.trigger_type}
                      </div>
                      <div className="text-xs">
                        <span className="font-semibold text-indigo-600">Ação:</span> {template.action_type}
                      </div>
                    </div>
                    <Button size="sm" className="w-full bg-purple-600 hover:bg-purple-700">
                      <Plus className="w-3 h-3 mr-1" />
                      Usar Template
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Histórico */}
          {activeTab === 'logs' && (
            <Card className="bg-white shadow-lg border-0">
              <CardHeader>
                <CardTitle>Execuções Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="font-semibold text-slate-900">Enviado Follow-up de Cliente Quente</p>
                        <p className="text-xs text-slate-600">12:45 - Hoje</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-green-600">Sucesso</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="font-semibold text-slate-900">Status Atualizado para Frio</p>
                        <p className="text-xs text-slate-600">08:20 - Hoje</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-blue-600">3 clientes</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </Tabs>
      </div>
    </div>
  );
}

const TEMPLATES = [
  {
    id: 1,
    name: 'Follow-up 2 Dias após Visita',
    description: 'Envia email de acompanhamento 2 dias após uma visita realizada',
    trigger_type: 'visit_completed',
    action_type: 'send_email',
    trigger_condition: { days_offset: 2 },
    action_config: { template: 'followup_after_visit' }
  },
  {
    id: 2,
    name: 'Cliente Inativo 30 Dias',
    description: 'Marca cliente como frio se sem interação há 30 dias',
    trigger_type: 'days_without_interaction',
    action_type: 'update_client_status',
    trigger_condition: { days: 30 },
    action_config: { status: 'frio' }
  },
  {
    id: 3,
    name: 'Follow-up Score Alto',
    description: 'Cria tarefa de follow-up a cada 15 dias para clientes com score alto',
    trigger_type: 'score_threshold',
    action_type: 'create_task',
    trigger_condition: { min_score: 70 },
    action_config: { priority: 'alta', type: 'follow_up', days_offset: 15 }
  },
  {
    id: 4,
    name: 'WhatsApp para Lead Novo',
    description: 'Envia mensagem WhatsApp automática para novo lead',
    trigger_type: 'lead_created',
    action_type: 'send_whatsapp',
    trigger_condition: {},
    action_config: { template: 'welcome_new_lead' }
  },
  {
    id: 5,
    name: 'Alerta Score Critico',
    description: 'Notifica quando cliente tem score baixo e risco de churn',
    trigger_type: 'score_threshold',
    action_type: 'send_alert',
    trigger_condition: { max_score: 30 },
    action_config: { priority: 'alta' }
  },
  {
    id: 6,
    name: 'Criar Tarefa de Proposta',
    description: 'Cria tarefa de proposta quando cliente muda para etapa de negociação',
    trigger_type: 'status_change',
    action_type: 'create_task',
    trigger_condition: { from_status: 'qualificado', to_status: 'negociacao' },
    action_config: { title: 'Enviar Proposta', type: 'proposta', priority: 'alta' }
  }
];
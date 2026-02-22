import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Edit2, Trash2, Power, AlertCircle } from 'lucide-react';

export default function AutomationRulesList({ rules, isLoading, onEdit, onDelete, onToggle, isDeleting, isToggling }) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (rules.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200 shadow-lg">
        <CardContent className="p-12 text-center">
          <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-900 mb-2">Nenhuma automação criada</h3>
          <p className="text-slate-600">Crie sua primeira automação para começar a otimizar seu workflow</p>
        </CardContent>
      </Card>
    );
  }

  const triggerLabels = {
    visit_completed: '📍 Visita Realizada',
    days_without_interaction: '⏰ Dias sem Interação',
    score_threshold: '📊 Limite de Score',
    lead_created: '🆕 Lead Criado',
    status_change: '🔄 Mudança de Status',
    client_created: '👤 Cliente Criado'
  };

  const actionLabels = {
    send_email: '📧 Enviar Email',
    send_whatsapp: '💬 Enviar WhatsApp',
    create_task: '✅ Criar Tarefa',
    update_client_status: '🏷️ Atualizar Status',
    send_alert: '🚨 Enviar Alerta',
    assign_to_user: '👥 Atribuir Usuário'
  };

  return (
    <div className="grid grid-cols-1 gap-4">
      {rules.map((rule) => (
        <Card key={rule.id} className={`shadow-lg border-0 transition-all ${rule.active ? 'bg-white' : 'bg-slate-100 opacity-75'}`}>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center mb-4">
              {/* Nome e Status */}
              <div className="col-span-1 md:col-span-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-bold text-slate-900">{rule.name}</h3>
                  <Badge variant={rule.active ? 'default' : 'secondary'} className={rule.active ? 'bg-green-600' : 'bg-slate-400'}>
                    {rule.active ? '✓ Ativa' : '✗ Inativa'}
                  </Badge>
                </div>
                {rule.description && (
                  <p className="text-xs text-slate-600">{rule.description}</p>
                )}
              </div>

              {/* Gatilho */}
              <div className="col-span-1 md:col-span-1 bg-purple-50 rounded-lg p-3 border border-purple-200">
                <p className="text-xs font-semibold text-slate-700 mb-1">Gatilho</p>
                <p className="text-sm font-bold text-purple-700">{triggerLabels[rule.trigger_type] || rule.trigger_type}</p>
              </div>

              {/* Ação */}
              <div className="col-span-1 md:col-span-1 bg-indigo-50 rounded-lg p-3 border border-indigo-200">
                <p className="text-xs font-semibold text-slate-700 mb-1">Ação</p>
                <p className="text-sm font-bold text-indigo-700">{actionLabels[rule.action_type] || rule.action_type}</p>
              </div>

              {/* Botões */}
              <div className="col-span-1 md:col-span-1 flex gap-2 justify-end">
                <Button
                  onClick={() => onToggle(rule)}
                  variant="outline"
                  size="sm"
                  disabled={isToggling}
                  className="flex-1"
                >
                  <Power className="w-4 h-4 mr-1" />
                  {isToggling ? 'Alterando...' : rule.active ? 'Desativar' : 'Ativar'}
                </Button>
                <Button
                  onClick={() => onEdit(rule)}
                  variant="outline"
                  size="sm"
                  disabled={isToggling}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => onDelete(rule.id)}
                  variant="destructive"
                  size="sm"
                  disabled={isDeleting}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Detalhes Expandidos */}
            {rule.trigger_condition && Object.keys(rule.trigger_condition).length > 0 && (
              <div className="border-t pt-3 mt-3">
                <p className="text-xs font-semibold text-slate-600 mb-2">Condições do Gatilho:</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  {Object.entries(rule.trigger_condition).map(([key, value]) => (
                    <div key={key} className="bg-slate-50 p-2 rounded border border-slate-200">
                      <span className="font-semibold text-slate-700">{key}:</span> {String(value)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Histórico de Execução */}
            {rule.last_execution && (
              <div className="border-t pt-3 mt-3">
                <p className="text-xs text-slate-600">
                  Última execução: {new Date(rule.last_execution).toLocaleDateString('pt-BR')} às {new Date(rule.last_execution).toLocaleTimeString('pt-BR')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
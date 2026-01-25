import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { 
  Zap, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle,
  FileText,
  Calendar,
  MessageSquare,
  TrendingUp,
  Target,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

export default function AIAutomationEngine({ client, onTaskCreated }) {
  const [automations, setAutomations] = useState(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const runAutomation = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('aiAutomationEngine', {
        client_id: client.id
      });

      if (response.data.success) {
        setAutomations(response.data.automation_data);
        toast.success('Automações IA geradas!');
      } else {
        toast.error(response.data.error || 'Erro ao gerar automações');
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao processar automação');
    } finally {
      setLoading(false);
    }
  };

  const createAllTasks = async () => {
    if (!automations?.follow_up_tasks?.length) return;
    
    setCreating(true);
    try {
      const tasksToCreate = automations.follow_up_tasks.map(task => {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + task.due_days);

        return {
          client_id: client.id,
          client_name: client.first_name,
          title: task.title,
          description: `${task.description}\n\n📊 Motivo estratégico: ${task.strategic_reason}`,
          priority: task.priority,
          type: task.type,
          due_date: dueDate.toISOString().split('T')[0],
          status: 'pendente',
          auto_created: true
        };
      });

      await Promise.all(
        tasksToCreate.map(task => base44.entities.Task.create(task))
      );

      toast.success(`${tasksToCreate.length} tarefas criadas automaticamente!`);
      if (onTaskCreated) onTaskCreated();
    } catch (error) {
      console.error('Erro ao criar tarefas:', error);
      toast.error('Erro ao criar tarefas');
    } finally {
      setCreating(false);
    }
  };

  const getRiskColor = (risk) => {
    if (risk < 30) return 'bg-green-100 text-green-700 border-green-300';
    if (risk < 60) return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    return 'bg-red-100 text-red-700 border-red-300';
  };

  const getPriorityColor = (priority) => {
    if (priority === 'alta') return 'bg-red-100 text-red-700';
    if (priority === 'media') return 'bg-yellow-100 text-yellow-700';
    return 'bg-blue-100 text-blue-700';
  };

  if (!automations) {
    return (
      <Card className="border-2 border-dashed border-purple-300 bg-gradient-to-br from-purple-50 to-indigo-50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle>Motor de Automação IA</CardTitle>
              <p className="text-sm text-muted-foreground">Follow-ups + Material + Análise de Churn</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={runAutomation} 
            disabled={loading}
            className="w-full h-12 bg-gradient-to-r from-purple-600 to-indigo-600"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Ativar Automação Inteligente
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Automação IA Ativa</h3>
            <p className="text-sm text-muted-foreground">
              Gerado em {new Date(automations.generated_at).toLocaleString()}
            </p>
          </div>
        </div>
        <Button 
          onClick={runAutomation} 
          disabled={loading}
          size="sm"
          variant="outline"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Atualizar'}
        </Button>
      </div>

      {/* Recomendação Geral */}
      <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
        <CardContent className="pt-4">
          <div className="flex items-start gap-2">
            <Target className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-slate-700 leading-relaxed">{automations.overall_recommendation}</p>
          </div>
        </CardContent>
      </Card>

      {/* Análise de Risco de Churn */}
      <Card className={`border-2 ${getRiskColor(automations.churn_analysis.risk_score)}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              <CardTitle className="text-sm">Análise de Churn</CardTitle>
            </div>
            <Badge className={getRiskColor(automations.churn_analysis.risk_score)}>
              Risco: {automations.churn_analysis.risk_score}%
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Sinais de Alerta */}
          {automations.churn_analysis.alert_signals?.length > 0 && (
            <div>
              <p className="text-xs font-semibold mb-2">🚨 Sinais de Alerta:</p>
              <div className="space-y-1">
                {automations.churn_analysis.alert_signals.map((signal, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm">
                    <span>•</span>
                    <span>{signal}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Estratégias de Reengajamento */}
          {automations.churn_analysis.reengagement_strategies?.length > 0 && (
            <div>
              <p className="text-xs font-semibold mb-2">💡 Estratégias de Reengajamento:</p>
              <div className="space-y-3">
                {automations.churn_analysis.reengagement_strategies.map((strategy, idx) => (
                  <Card key={idx} className="bg-white/50 p-3">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <p className="font-semibold text-sm">{strategy.action}</p>
                        <Badge variant="outline" className="text-xs">
                          {strategy.channel}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">⏰ {strategy.timing}</p>
                      <div className="p-2 bg-slate-50 rounded text-xs italic">
                        "{strategy.suggested_message}"
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tarefas de Follow-up */}
      {automations.follow_up_tasks?.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <CardTitle className="text-sm">Tarefas Sugeridas ({automations.follow_up_tasks.length})</CardTitle>
              </div>
              <Button 
                onClick={createAllTasks}
                disabled={creating}
                size="sm"
                className="bg-green-600 hover:bg-green-700"
              >
                {creating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>Criar Todas</>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {automations.follow_up_tasks.map((task, idx) => (
              <Card key={idx} className="bg-slate-50 p-3">
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold">{task.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                    </div>
                    <Badge className={getPriorityColor(task.priority)}>
                      {task.priority}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {task.due_days} dias
                    </div>
                    <div className="flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      {task.type}
                    </div>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-xs text-purple-600">
                      💡 {task.strategic_reason}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Material de Vendas */}
      {automations.sales_collateral?.length > 0 && (
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <CardTitle className="text-sm">Material Recomendado ({automations.sales_collateral.length})</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {automations.sales_collateral.map((material, idx) => (
              <div key={idx} className="p-3 bg-white rounded-lg border border-blue-200">
                <div className="flex items-start justify-between mb-2">
                  <p className="font-semibold text-sm">{material.material_name}</p>
                  <Badge className="bg-blue-100 text-blue-700">
                    {material.channel}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mb-2">📅 {material.when_to_send}</p>
                <p className="text-xs text-slate-700">{material.reason}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
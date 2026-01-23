import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Check, AlertCircle, TrendingUp, Clock, Zap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AutomationMonitor() {
  const [filter, setFilter] = useState('all');

  // Logs de automação
  const { data: logs = [] } = useQuery({
    queryKey: ['automationLogs'],
    queryFn: () => base44.entities.AutomationLog.list('-created_date', 50).catch(() => []),
    refetchInterval: 5000 // Atualizar a cada 5s
  });

  // Regras
  const { data: rules = [] } = useQuery({
    queryKey: ['automationRules'],
    queryFn: () => base44.entities.AutomationRule.list('-created_date', 100).catch(() => [])
  });

  // Estatísticas
  const stats = {
    total_executions: logs.length,
    success_rate: logs.length > 0 ? Math.round((logs.filter(l => l.status === 'success').length / logs.length) * 100) : 0,
    total_tasks: logs.reduce((sum, l) => sum + (l.affected_entities?.tasks_created || 0), 0),
    total_notifications: logs.reduce((sum, l) => sum + (l.affected_entities?.notifications_sent || 0), 0),
    active_rules: rules.filter(r => r.enabled).length
  };

  const filteredLogs = filter === 'all' ? logs : logs.filter(l => l.status === filter);

  return (
    <div className="space-y-6">
      {/* Cards Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-4">
            <p className="text-xs text-blue-600 font-semibold">Execuções</p>
            <p className="text-2xl font-bold text-blue-900">{stats.total_executions}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-4">
            <p className="text-xs text-green-600 font-semibold">Taxa Sucesso</p>
            <p className="text-2xl font-bold text-green-900">{stats.success_rate}%</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-4">
            <p className="text-xs text-purple-600 font-semibold">Tarefas</p>
            <p className="text-2xl font-bold text-purple-900">{stats.total_tasks}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100">
          <CardContent className="p-4">
            <p className="text-xs text-orange-600 font-semibold">Notificações</p>
            <p className="text-2xl font-bold text-orange-900">{stats.total_notifications}</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-50 to-slate-100">
          <CardContent className="p-4">
            <p className="text-xs text-slate-600 font-semibold">Regras Ativas</p>
            <p className="text-2xl font-bold text-slate-900">{stats.active_rules}</p>
          </CardContent>
        </Card>
      </div>

      {/* Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-orange-600" />
            Histórico de Execuções
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" onValueChange={setFilter}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="success">✓ Sucesso</TabsTrigger>
              <TabsTrigger value="failed">✗ Falha</TabsTrigger>
            </TabsList>

            <TabsContent value={filter} className="space-y-2">
              {filteredLogs.length === 0 ? (
                <p className="text-slate-600 text-center py-6">Nenhuma execução registrada</p>
              ) : (
                filteredLogs.map((log) => (
                  <div key={log.id} className="border rounded-lg p-3 hover:bg-slate-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-slate-900">{log.rule_name}</h4>
                          <Badge variant={log.status === 'success' ? 'default' : 'destructive'}>
                            {log.status === 'success' ? '✓ Sucesso' : log.status === 'failed' ? '✗ Falha' : '~ Parcial'}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mb-2">
                          <p><strong>Gatilho:</strong> {log.trigger_type}</p>
                          <p><strong>Ação:</strong> {log.action_type}</p>
                          <p><strong>Tempo:</strong> {log.execution_time_ms}ms</p>
                          <p><strong>Criado:</strong> {formatDistanceToNow(new Date(log.created_date), { locale: ptBR, addSuffix: true })}</p>
                        </div>

                        {/* Resultados */}
                        {log.affected_entities && (
                          <div className="flex gap-3 text-xs">
                            {log.affected_entities.tasks_created > 0 && (
                              <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                                📋 {log.affected_entities.tasks_created} tarefa(s)
                              </span>
                            )}
                            {log.affected_entities.notifications_sent > 0 && (
                              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                🔔 {log.affected_entities.notifications_sent} notificação(ões)
                              </span>
                            )}
                            {log.affected_entities.emails_sent > 0 && (
                              <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded">
                                ✉️ {log.affected_entities.emails_sent} email(s)
                              </span>
                            )}
                          </div>
                        )}

                        {log.error_message && (
                          <p className="text-xs text-red-600 mt-2">❌ {log.error_message}</p>
                        )}
                      </div>

                      {log.status === 'success' ? (
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                      ) : log.status === 'failed' ? (
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                      ) : null}
                    </div>
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
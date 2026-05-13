import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Command, Zap, TrendingUp, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

export default function GlobalCommandCenter() {
  const [search, setSearch] = useState('');

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list(),
  });

  const { data: leads = [] } = useQuery({
    queryKey: ['leads'],
    queryFn: () => base44.entities.Lead.list(),
  });

  const pendingTasks = tasks.filter(t => t.status === 'pendente');
  const hotClients = clients.filter(c => c.status === 'quente');
  const qualifiedLeads = leads.filter(l => l.stage === 'qualificado');

  return (
    <div className="space-y-6 p-6">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg p-6">
        <div className="flex items-center gap-3 mb-2">
          <Command className="w-6 h-6" />
          <h1 className="text-3xl font-bold">Central de Comando</h1>
        </div>
        <p className="text-indigo-100">Visão consolidada de todas as operações</p>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-600">{hotClients.length}</div>
              <p className="text-sm text-slate-600 mt-1">🔥 Clientes Quentes</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">{pendingTasks.length}</div>
              <p className="text-sm text-slate-600 mt-1">📋 Tarefas Pendentes</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{qualifiedLeads.length}</div>
              <p className="text-sm text-slate-600 mt-1">⭐ Leads Qualificados</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{clients.length}</div>
              <p className="text-sm text-slate-600 mt-1">👥 Total de Clientes</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Ações Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-3">
            <Button className="bg-indigo-600 hover:bg-indigo-700">Novo Cliente</Button>
            <Button className="bg-orange-600 hover:bg-orange-700">Nova Tarefa</Button>
            <Button className="bg-blue-600 hover:bg-blue-700">Novo Lead</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Atividades Críticas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {pendingTasks.slice(0, 5).map(task => (
              <div key={task.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm">{task.title}</p>
                    <p className="text-xs text-slate-500">{task.client_name}</p>
                  </div>
                  <Clock className="w-4 h-4 text-orange-500" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
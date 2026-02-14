import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Zap, 
  Calendar, 
  MessageSquare, 
  CheckCircle2, 
  Clock,
  TrendingUp,
  Mail,
  Phone,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

export default function AutomaticClientFollowUp() {
  const [autoMode, setAutoMode] = useState(true);
  const queryClient = useQueryClient();

  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-updated_date', 500)
  });

  const { data: interactions = [] } = useQuery({
    queryKey: ['interactions'],
    queryFn: () => base44.entities.Interaction.list('-created_date', 500)
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list('-created_date', 500)
  });

  const createTaskMutation = useMutation({
    mutationFn: (taskData) => base44.entities.Task.create(taskData),
    onSuccess: () => {
      queryClient.invalidateQueries(['tasks']);
      toast.success('Tarefa criada automaticamente');
    }
  });

  const createInteractionMutation = useMutation({
    mutationFn: (data) => base44.entities.Interaction.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['interactions']);
    }
  });

  // Identificar clientes que precisam de follow-up
  const clientsNeedingFollowUp = clients.filter(client => {
    const lastInteraction = interactions
      .filter(i => i.client_id === client.id)
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];

    const daysSinceLastContact = lastInteraction 
      ? Math.floor((new Date() - new Date(lastInteraction.created_date)) / (1000 * 60 * 60 * 24))
      : 999;

    const hasOpenTask = tasks.some(t => t.client_id === client.id && t.status === 'pendente');

    // Critérios: mais de 7 dias sem contato E status quente/morno E sem tarefa aberta
    return daysSinceLastContact > 7 && 
           (client.status === 'quente' || client.status === 'morno') && 
           !hasOpenTask;
  });

  // Criar follow-ups automaticamente
  const handleAutoFollowUp = async (client) => {
    try {
      const lastInteraction = interactions
        .filter(i => i.client_id === client.id)
        .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];

      const daysSinceContact = lastInteraction 
        ? Math.floor((new Date() - new Date(lastInteraction.created_date)) / (1000 * 60 * 60 * 24))
        : 999;

      // Criar tarefa de follow-up
      await createTaskMutation.mutateAsync({
        client_id: client.id,
        client_name: client.clinic_name || client.full_name,
        title: `Follow-up Automático - ${client.clinic_name || client.full_name}`,
        description: `Cliente sem contato há ${daysSinceContact} dias. Status: ${client.status}. Score: ${client.purchase_score || 0}`,
        type: 'follow_up',
        priority: client.status === 'quente' ? 'alta' : 'media',
        due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        auto_created: true
      });

      toast.success(`Follow-up criado para ${client.clinic_name || client.full_name}`);
    } catch (error) {
      toast.error('Erro ao criar follow-up');
    }
  };

  // Auto-criar follow-ups para todos
  const handleBulkFollowUp = async () => {
    toast.info(`Criando ${clientsNeedingFollowUp.length} follow-ups...`);
    for (const client of clientsNeedingFollowUp.slice(0, 10)) {
      await handleAutoFollowUp(client);
    }
  };

  if (clientsLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <Card className="p-6 bg-white shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
            <Zap className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Follow-up Automático</h2>
            <p className="text-sm text-slate-500">Sistema inteligente de acompanhamento</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Label className="text-sm text-slate-600">Auto-Modo</Label>
          <Switch checked={autoMode} onCheckedChange={setAutoMode} />
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="p-3 bg-orange-50 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-orange-600" />
            <span className="text-xs text-orange-600 font-medium">Precisam Follow-up</span>
          </div>
          <p className="text-2xl font-bold text-orange-700">{clientsNeedingFollowUp.length}</p>
        </div>

        <div className="p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <MessageSquare className="w-4 h-4 text-blue-600" />
            <span className="text-xs text-blue-600 font-medium">Tarefas Abertas</span>
          </div>
          <p className="text-2xl font-bold text-blue-700">
            {tasks.filter(t => t.status === 'pendente').length}
          </p>
        </div>

        <div className="p-3 bg-green-50 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span className="text-xs text-green-600 font-medium">Concluídas Hoje</span>
          </div>
          <p className="text-2xl font-bold text-green-700">
            {tasks.filter(t => 
              t.status === 'concluida' && 
              new Date(t.updated_date).toDateString() === new Date().toDateString()
            ).length}
          </p>
        </div>
      </div>

      {/* Ação em Massa */}
      {clientsNeedingFollowUp.length > 0 && (
        <div className="mb-6">
          <Button 
            onClick={handleBulkFollowUp}
            className="w-full bg-indigo-600 hover:bg-indigo-700"
          >
            <Zap className="w-4 h-4 mr-2" />
            Criar Follow-ups Automáticos para {Math.min(clientsNeedingFollowUp.length, 10)} Clientes
          </Button>
        </div>
      )}

      {/* Lista de Clientes */}
      <ScrollArea className="h-[400px]">
        <div className="space-y-3">
          {clientsNeedingFollowUp.map(client => {
            const lastInteraction = interactions
              .filter(i => i.client_id === client.id)
              .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];

            const daysSinceContact = lastInteraction 
              ? Math.floor((new Date() - new Date(lastInteraction.created_date)) / (1000 * 60 * 60 * 24))
              : 999;

            return (
              <div 
                key={client.id}
                className="p-4 border border-slate-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50/30 transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold text-slate-800">
                      {client.clinic_name || client.full_name}
                    </h3>
                    <p className="text-sm text-slate-600">{client.city}</p>
                  </div>
                  <Badge className={
                    client.status === 'quente' ? 'bg-red-100 text-red-700' :
                    'bg-orange-100 text-orange-700'
                  }>
                    {client.status}
                  </Badge>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-600 mb-3">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {daysSinceContact} dias sem contato
                  </span>
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Score: {client.purchase_score || 0}
                  </span>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleAutoFollowUp(client)}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Calendar className="w-3 h-3 mr-1" />
                    Criar Follow-up
                  </Button>
                  <Button size="sm" variant="outline">
                    <MessageSquare className="w-3 h-3" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Phone className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </Card>
  );
}
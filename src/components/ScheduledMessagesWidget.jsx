import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, Clock, TrendingUp, Copy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

export default function ScheduledMessagesWidget() {
  const navigate = useNavigate();

  const { data: tasks = [] } = useQuery({
    queryKey: ['scheduled-messages'],
    queryFn: () => base44.entities.Task.list('-created_date', 100),
  });

  const messageTasks = tasks.filter(
    t => t.title.includes('📱 Mensagem Estruturada') && t.status === 'pendente'
  ).slice(0, 3);

  if (messageTasks.length === 0) return null;

  const copyMessage = (task) => {
    // Extrair a mensagem do description
    const messageMatch = task.description.match(/📝 MENSAGEM PRONTA PARA ENVIAR:\n([\s\S]*?)(?:\n\n|$)/);
    if (messageMatch) {
      navigator.clipboard.writeText(messageMatch[1]);
      toast.success('Mensagem copiada!');
    }
  };

  return (
    <Card className="p-5 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-green-600" />
          <h3 className="font-semibold text-green-900">Mensagens Estruturadas Prontas</h3>
        </div>
        <span className="text-xs bg-green-600 text-white px-2 py-1 rounded-full">
          {messageTasks.length}
        </span>
      </div>

      <div className="space-y-3">
        {messageTasks.map((task) => {
          const priorityMatch = task.description.match(/🎯 Prioridade: (\w+)/);
          const probabilityMatch = task.description.match(/📊 Probabilidade de Resposta: (\d+)%/);
          const momentMatch = task.description.match(/⏰ Melhor Momento: ([^\n]+)/);
          
          return (
            <div
              key={task.id}
              className="p-3 bg-white rounded-lg border border-green-200 hover:border-green-400 transition-all cursor-pointer"
              onClick={() => navigate(createPageUrl(`ClientProfile?id=${task.client_id}`))}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-slate-800">{task.client_name}</p>
                  <p className="text-xs text-slate-500">{momentMatch?.[1] || 'Enviar agora'}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  {probabilityMatch && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {probabilityMatch[1]}%
                    </span>
                  )}
                  {priorityMatch && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      priorityMatch[1] === 'URGENTE' ? 'bg-red-100 text-red-700' :
                      priorityMatch[1] === 'ALTA' ? 'bg-orange-100 text-orange-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {priorityMatch[1]}
                    </span>
                  )}
                </div>
              </div>
              
              <Button
                size="sm"
                variant="outline"
                className="w-full mt-2"
                onClick={(e) => {
                  e.stopPropagation();
                  copyMessage(task);
                }}
              >
                <Copy className="w-3 h-3 mr-2" />
                Copiar Mensagem
              </Button>
            </div>
          );
        })}
      </div>

      {messageTasks.length > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full mt-3 text-green-700"
          onClick={() => navigate(createPageUrl('Tasks'))}
        >
          Ver todas as mensagens →
        </Button>
      )}
    </Card>
  );
}
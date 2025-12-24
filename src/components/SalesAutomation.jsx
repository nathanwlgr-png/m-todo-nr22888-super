import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { base44 } from '@/api/base44Client';
import { Loader2, Zap, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SalesAutomation() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);

  const runAutomation = async () => {
    setRunning(true);
    try {
      const clients = await base44.entities.Client.list();
      const now = new Date();
      const automated = [];

      for (const client of clients) {
        // Automação 1: Criar tarefa se sem contato há 7+ dias
        const lastContact = client.last_contact_date ? new Date(client.last_contact_date) : null;
        const daysSinceContact = lastContact ? Math.floor((now - lastContact) / (1000 * 60 * 60 * 24)) : 999;

        if (daysSinceContact >= 7 && client.status === 'quente') {
          const existingTasks = await base44.entities.Task.filter({ 
            client_id: client.id,
            status: 'pendente'
          });

          if (existingTasks.length === 0) {
            await base44.entities.Task.create({
              client_id: client.id,
              client_name: client.first_name,
              title: `Follow-up: ${client.first_name}`,
              description: `Cliente quente sem contato há ${daysSinceContact} dias. Fazer follow-up urgente.`,
              due_date: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              status: 'pendente',
              priority: 'alta',
              type: 'follow_up',
              auto_created: true
            });
            automated.push({ type: 'task', client: client.first_name });
          }
        }

        // Automação 2: Atualizar score baseado em atividade recente
        if (client.status === 'quente' && (!client.purchase_score || client.purchase_score < 70)) {
          await base44.entities.Client.update(client.id, {
            purchase_score: Math.min((client.purchase_score || 50) + 5, 90)
          });
          automated.push({ type: 'score', client: client.first_name });
        }

        // Automação 3: Agendar visita para clientes com score alto sem visita
        if (client.purchase_score >= 75 && !client.last_visit_date) {
          const existingVisits = await base44.entities.Visit.filter({ 
            client_id: client.id,
            status: 'agendada'
          });

          if (existingVisits.length === 0) {
            const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            await base44.entities.Visit.create({
              client_id: client.id,
              client_name: client.first_name,
              scheduled_date: nextWeek.toISOString(),
              duration_minutes: 60,
              visit_type: 'primeira_visita',
              status: 'agendada',
              notes: 'Visita agendada automaticamente - cliente com alto score'
            });
            automated.push({ type: 'visit', client: client.first_name });
          }
        }
      }

      setResult({
        total: automated.length,
        tasks: automated.filter(a => a.type === 'task').length,
        scores: automated.filter(a => a.type === 'score').length,
        visits: automated.filter(a => a.type === 'visit').length
      });

      toast.success(`${automated.length} ações automatizadas!`);
    } catch (error) {
      console.error(error);
      toast.error('Erro na automação');
    } finally {
      setRunning(false);
    }
  };

  return (
    <Card className="p-5 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center">
          <Zap className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-slate-800">Automação de Vendas</h3>
          <p className="text-xs text-slate-600">Tarefas automáticas inteligentes</p>
        </div>
      </div>

      <Button
        onClick={runAutomation}
        disabled={running}
        className="w-full bg-purple-600 hover:bg-purple-700 mb-3"
      >
        {running ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Executando...
          </>
        ) : (
          <>
            <Zap className="w-4 h-4 mr-2" />
            Executar Automação
          </>
        )}
      </Button>

      {result && (
        <div className="p-4 bg-white rounded-xl border-2 border-purple-200">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-5 h-5 text-purple-600" />
            <p className="font-semibold text-slate-800">{result.total} ações executadas</p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="p-2 bg-blue-50 rounded text-center">
              <p className="text-lg font-bold text-blue-700">{result.tasks}</p>
              <p className="text-xs text-slate-600">Tarefas</p>
            </div>
            <div className="p-2 bg-green-50 rounded text-center">
              <p className="text-lg font-bold text-green-700">{result.scores}</p>
              <p className="text-xs text-slate-600">Scores</p>
            </div>
            <div className="p-2 bg-purple-50 rounded text-center">
              <p className="text-lg font-bold text-purple-700">{result.visits}</p>
              <p className="text-xs text-slate-600">Visitas</p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
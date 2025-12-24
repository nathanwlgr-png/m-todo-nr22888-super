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
      const allVisits = await base44.entities.Visit.list();
      const allInteractions = await base44.entities.Interaction.list();
      const now = new Date();
      const automated = [];

      for (const client of clients) {
        const clientVisits = allVisits.filter(v => v.client_id === client.id);
        const clientInteractions = allInteractions.filter(i => i.client_id === client.id);
        const lastInteraction = clientInteractions.sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];
        const daysSinceInteraction = lastInteraction ? Math.floor((now - new Date(lastInteraction.created_date)) / (1000 * 60 * 60 * 24)) : 999;

        // Regra 1: Follow-up inteligente baseado em score + inatividade
        if (client.status === 'quente' && daysSinceInteraction >= 5 && client.purchase_score >= 60) {
          const existingTasks = await base44.entities.Task.filter({ 
            client_id: client.id,
            status: 'pendente',
            type: 'follow_up'
          });

          if (existingTasks.length === 0) {
            await base44.entities.Task.create({
              client_id: client.id,
              client_name: client.first_name,
              title: `Follow-up Prioritário: ${client.first_name}`,
              description: `Cliente quente (score ${client.purchase_score}%) sem interação há ${daysSinceInteraction} dias. Ação urgente.`,
              due_date: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              status: 'pendente',
              priority: 'alta',
              type: 'follow_up',
              auto_created: true
            });
            automated.push({ type: 'task', client: client.first_name, reason: 'follow_up_quente' });
          }
        } else if (client.status === 'morno' && daysSinceInteraction >= 10) {
          const existingTasks = await base44.entities.Task.filter({ 
            client_id: client.id,
            status: 'pendente',
            type: 'follow_up'
          });

          if (existingTasks.length === 0) {
            await base44.entities.Task.create({
              client_id: client.id,
              client_name: client.first_name,
              title: `Reativar: ${client.first_name}`,
              description: `Cliente morno sem interação há ${daysSinceInteraction} dias. Considerar nova abordagem.`,
              due_date: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              status: 'pendente',
              priority: 'media',
              type: 'follow_up',
              auto_created: true
            });
            automated.push({ type: 'task', client: client.first_name, reason: 'reativacao' });
          }
        }

        // Regra 2: Agendamento automático baseado em score + pipeline
        if (client.purchase_score >= 70 && !client.last_visit_date && client.status !== 'frio') {
          const existingVisits = clientVisits.filter(v => v.status === 'agendada');

          if (existingVisits.length === 0) {
            const daysOffset = client.status === 'quente' ? 3 : 7;
            const visitDate = new Date(now.getTime() + daysOffset * 24 * 60 * 60 * 1000);
            
            await base44.entities.Visit.create({
              client_id: client.id,
              client_name: client.first_name,
              scheduled_date: visitDate.toISOString(),
              duration_minutes: 60,
              visit_type: 'primeira_visita',
              status: 'agendada',
              notes: `Auto-agendada: score ${client.purchase_score}%, perfil ${client.behavioral_profile || 'padrão'}`
            });
            automated.push({ type: 'visit', client: client.first_name, reason: 'alto_score' });
          }
        }

        // Regra 3: Ajuste dinâmico de score baseado em engajamento
        const recentInteractions = clientInteractions.filter(i => {
          const days = Math.floor((now - new Date(i.created_date)) / (1000 * 60 * 60 * 24));
          return days <= 30;
        });

        if (recentInteractions.length >= 3 && client.purchase_score < 80) {
          const newScore = Math.min(client.purchase_score + 10, 90);
          await base44.entities.Client.update(client.id, {
            purchase_score: newScore,
            engagement_score: recentInteractions.length * 10
          });
          automated.push({ type: 'score', client: client.first_name, reason: 'engajamento' });
        } else if (recentInteractions.length === 0 && daysSinceInteraction > 30 && client.purchase_score > 40) {
          const newScore = Math.max(client.purchase_score - 15, 30);
          await base44.entities.Client.update(client.id, {
            purchase_score: newScore
          });
          automated.push({ type: 'score', client: client.first_name, reason: 'inatividade' });
        }

        // Regra 4: Sugestão de produto baseado em perfil + histórico
        if (client.purchase_score >= 65 && !client.equipment_suggestion) {
          const suggestion = await base44.integrations.Core.InvokeLLM({
            prompt: `Cliente: ${client.first_name}
Perfil: ${client.behavioral_profile || 'padrão'}
Tipo: ${client.client_type}
Score: ${client.purchase_score}%
Equipamento atual: ${client.current_equipment || 'nenhum'}
Dores: ${client.main_pains?.join(', ') || 'não identificadas'}

Sugira 1 equipamento Seamaty ideal (VG2, VG1, SMT-120VP, QT3, VI1, VQ1) e motivo em 1 frase.`,
            response_json_schema: {
              type: "object",
              properties: {
                equipment: { type: "string" },
                reason: { type: "string" }
              }
            }
          });

          await base44.entities.Client.update(client.id, {
            equipment_suggestion: suggestion.equipment,
            equipment_suggestion_reason: suggestion.reason
          });
          automated.push({ type: 'suggestion', client: client.first_name, equipment: suggestion.equipment });
        }
      }

      setResult({
        total: automated.length,
        tasks: automated.filter(a => a.type === 'task').length,
        scores: automated.filter(a => a.type === 'score').length,
        visits: automated.filter(a => a.type === 'visit').length,
        suggestions: automated.filter(a => a.type === 'suggestion').length
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

          <div className="grid grid-cols-2 gap-2">
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
            <div className="p-2 bg-orange-50 rounded text-center">
              <p className="text-lg font-bold text-orange-700">{result.suggestions || 0}</p>
              <p className="text-xs text-slate-600">Sugestões</p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
import React, { useMemo } from 'react';
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Clock } from 'lucide-react';

const pipelineStages = [
  { key: 'diagnosticar_necessidades', label: 'Diagnóstico', color: 'bg-blue-500' },
  { key: 'apresentar_equipamento', label: 'Apresentação', color: 'bg-indigo-500' },
  { key: 'demonstracao_tecnica', label: 'Demonstração', color: 'bg-purple-500' },
  { key: 'negociar_proposta', label: 'Negociação', color: 'bg-orange-500' },
  { key: 'fechar_venda', label: 'Fechamento', color: 'bg-green-500' }
];

export default function PipelineAnalysis({ clients = [], interactions = [] }) {
  const stats = useMemo(() => {
    // Contar clientes por etapa
    const stageCount = {};
    pipelineStages.forEach(stage => {
      stageCount[stage.key] = clients.filter(c => c.visit_objective === stage.key).length;
    });

    // Calcular tempo médio em cada etapa (baseado em interações)
    const stageTime = {};
    pipelineStages.forEach((stage, index) => {
      const clientsInStage = clients.filter(c => c.visit_objective === stage.key);
      let totalDays = 0;
      let count = 0;

      clientsInStage.forEach(client => {
        const clientInteractions = interactions
          .filter(i => i.client_id === client.id)
          .sort((a, b) => new Date(a.created_date) - new Date(b.created_date));

        if (clientInteractions.length > 1) {
          const firstInteraction = new Date(clientInteractions[0].created_date);
          const lastInteraction = new Date(clientInteractions[clientInteractions.length - 1].created_date);
          const days = (lastInteraction - firstInteraction) / (1000 * 60 * 60 * 24);
          totalDays += days;
          count++;
        }
      });

      stageTime[stage.key] = count > 0 ? Math.round(totalDays / count) : 0;
    });

    return { stageCount, stageTime };
  }, [clients, interactions]);

  const totalClients = Object.values(stats.stageCount).reduce((sum, count) => sum + count, 0);

  return (
    <div className="space-y-3">
      {pipelineStages.map((stage) => {
        const count = stats.stageCount[stage.key] || 0;
        const avgDays = stats.stageTime[stage.key] || 0;
        const percentage = totalClients > 0 ? (count / totalClients) * 100 : 0;

        return (
          <Card key={stage.key} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg ${stage.color} flex items-center justify-center`}>
                  <span className="text-white font-bold text-sm">{count}</span>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800">{stage.label}</h4>
                  <p className="text-xs text-slate-500">{percentage.toFixed(0)}% do pipeline</p>
                </div>
              </div>
              
              {avgDays > 0 && (
                <div className="text-right">
                  <div className="flex items-center gap-1 text-slate-600">
                    <Clock className="w-3 h-3" />
                    <span className="text-xs font-medium">{avgDays} dias</span>
                  </div>
                  <p className="text-xs text-slate-400">tempo médio</p>
                </div>
              )}
            </div>
            
            <Progress value={percentage} className="h-2" />
          </Card>
        );
      })}

      <Card className="p-4 bg-indigo-50 border-indigo-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-indigo-800">Total no Pipeline</p>
            <p className="text-xs text-indigo-600">Clientes em processo de venda</p>
          </div>
          <div className="text-2xl font-bold text-indigo-700">{totalClients}</div>
        </div>
      </Card>
    </div>
  );
}
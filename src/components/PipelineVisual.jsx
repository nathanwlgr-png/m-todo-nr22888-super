import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp } from 'lucide-react';

const pipelineStages = [
  { key: 'diagnosticar_necessidades', label: 'Diagnóstico', color: 'bg-blue-500' },
  { key: 'apresentar_equipamento', label: 'Apresentação', color: 'bg-indigo-500' },
  { key: 'demonstracao_tecnica', label: 'Demonstração Técnica', color: 'bg-purple-500' },
  { key: 'negociar_proposta', label: 'Negociação', color: 'bg-orange-500' },
  { key: 'fechar_venda', label: 'Fechamento', color: 'bg-green-500' }
];

export default function PipelineVisual({ client, onStageClick }) {
  const currentStageIndex = pipelineStages.findIndex(s => s.key === client.visit_objective);

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-indigo-600" />
        <h3 className="font-semibold text-slate-800">Pipeline de Vendas</h3>
      </div>

      <div className="space-y-2">
        {pipelineStages.map((stage, index) => {
          const isActive = index === currentStageIndex;
          const isCompleted = index < currentStageIndex;
          const isNext = index === currentStageIndex + 1;

          return (
            <button
              key={stage.key}
              onClick={() => onStageClick?.(stage.key)}
              className={`w-full p-3 rounded-xl border-2 transition-all text-left ${
                isActive
                  ? 'border-indigo-500 bg-indigo-50 shadow-md'
                  : isCompleted
                  ? 'border-green-300 bg-green-50'
                  : isNext
                  ? 'border-orange-300 bg-orange-50 hover:shadow-md'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full ${stage.color} flex items-center justify-center text-white font-bold text-sm`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className={`font-semibold ${isActive ? 'text-indigo-700' : 'text-slate-700'}`}>
                      {stage.label}
                    </p>
                    {isActive && (
                      <p className="text-xs text-indigo-600 mt-0.5">Etapa atual</p>
                    )}
                    {isCompleted && (
                      <p className="text-xs text-green-600 mt-0.5">✓ Concluída</p>
                    )}
                    {isNext && (
                      <p className="text-xs text-orange-600 mt-0.5">→ Próxima etapa</p>
                    )}
                  </div>
                </div>
                {isActive && (
                  <Badge className="bg-indigo-600">
                    Atual
                  </Badge>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-4 p-3 bg-slate-50 rounded-lg">
        <p className="text-xs text-slate-600">
          💡 <strong>Dica:</strong> Clique em uma etapa para avançar o cliente no pipeline
        </p>
      </div>
    </Card>
  );
}
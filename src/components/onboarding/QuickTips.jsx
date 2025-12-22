import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, X, ChevronRight } from 'lucide-react';

const TIPS = [
  {
    title: 'Score Automático',
    description: 'O sistema calcula automaticamente o score de cada cliente baseado em visitas, interações e tempo sem contato.'
  },
  {
    title: 'Numerologia',
    description: 'Usamos numerologia pitagórica para entender o perfil comportamental e sugerir a melhor abordagem.'
  },
  {
    title: 'IA no Pipeline',
    description: 'A IA analisa histórico e perfil para sugerir a próxima melhor etapa no pipeline de vendas.'
  },
  {
    title: 'Follow-up Automático',
    description: 'Se um cliente ficar inativo em uma etapa, o sistema cria tarefas de follow-up automaticamente.'
  },
  {
    title: 'Previsão de Receita',
    description: 'A previsão considera probabilidade real baseada em etapa do pipeline, status e score do cliente.'
  }
];

export default function QuickTips() {
  const [currentTip, setCurrentTip] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const tip = TIPS[currentTip];

  const nextTip = () => {
    if (currentTip < TIPS.length - 1) {
      setCurrentTip(currentTip + 1);
    } else {
      setDismissed(true);
    }
  };

  return (
    <Card className="p-4 bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center flex-shrink-0">
          <Lightbulb className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-semibold text-amber-900">
              💡 Dica Rápida
            </h4>
            <button
              onClick={() => setDismissed(true)}
              className="p-1 hover:bg-amber-100 rounded transition-colors"
            >
              <X className="w-4 h-4 text-amber-600" />
            </button>
          </div>
          <p className="text-sm font-medium text-slate-800 mb-1">{tip.title}</p>
          <p className="text-xs text-slate-600 leading-relaxed mb-3">
            {tip.description}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-amber-700">
              {currentTip + 1} de {TIPS.length}
            </span>
            <Button
              size="sm"
              onClick={nextTip}
              className="h-7 bg-amber-500 hover:bg-amber-600 text-xs"
            >
              {currentTip === TIPS.length - 1 ? 'Entendi' : 'Próxima'}
              <ChevronRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
import React, { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Clock, TrendingUp } from 'lucide-react';

export default function AITaskPrioritizer({ task, clientData }) {
  const smartPriority = useMemo(() => {
    if (!task || !clientData) return { level: 'media', score: 50, reason: '' };

    let score = 0;
    let reasons = [];

    // Score do cliente (peso 40)
    const clientScore = clientData.purchase_score || 0;
    score += (clientScore / 100) * 40;
    if (clientScore >= 80) reasons.push('Cliente com alto score');

    // Status do cliente (peso 30)
    if (clientData.status === 'quente') {
      score += 30;
      reasons.push('Cliente quente');
    } else if (clientData.status === 'morno') {
      score += 15;
    }

    // Pipeline (peso 20)
    const pipeline = clientData.pipeline_stage;
    if (pipeline === 'negociacao' || pipeline === 'proposta') {
      score += 20;
      reasons.push('Em fase crítica do pipeline');
    } else if (pipeline === 'qualificado') {
      score += 10;
    }

    // Urgência por data (peso 10)
    if (task.due_date) {
      const dueDate = new Date(task.due_date);
      const today = new Date();
      const daysUntil = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
      
      if (daysUntil <= 1) {
        score += 10;
        reasons.push('Vence hoje/amanhã');
      } else if (daysUntil <= 3) {
        score += 5;
      }
    }

    let level = 'baixa';
    if (score >= 70) level = 'alta';
    else if (score >= 40) level = 'media';

    return {
      level,
      score: Math.round(score),
      reason: reasons.join(' • ')
    };
  }, [task, clientData]);

  const priorityConfig = {
    alta: { color: 'bg-red-500', textColor: 'text-red-700', icon: AlertCircle },
    media: { color: 'bg-yellow-500', textColor: 'text-yellow-700', icon: Clock },
    baixa: { color: 'bg-blue-500', textColor: 'text-blue-700', icon: TrendingUp }
  };

  const config = priorityConfig[smartPriority.level];
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-2">
      <Badge className={`${config.color} text-white`}>
        <Icon className="w-3 h-3 mr-1" />
        {smartPriority.level.toUpperCase()}
      </Badge>
      <span className="text-xs text-slate-600">
        Score: {smartPriority.score}
      </span>
      {smartPriority.reason && (
        <span className="text-xs text-slate-500 italic">
          • {smartPriority.reason}
        </span>
      )}
    </div>
  );
}
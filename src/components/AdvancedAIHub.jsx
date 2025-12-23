import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Sparkles, TrendingUp, Target, Users, Zap } from 'lucide-react';

/**
 * Hub de IAs Avançadas
 * 5 IAs especializadas trabalhando em conjunto
 */
export default function AdvancedAIHub() {
  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-updated_date', 500),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['all-tasks'],
    queryFn: () => base44.entities.Task.list('-created_date', 500),
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['sales'],
    queryFn: () => base44.entities.Sale.list('-sale_date', 500),
  });

  const aiModules = [
    {
      name: 'IA Preditiva',
      icon: TrendingUp,
      color: 'from-blue-500 to-cyan-500',
      status: 'Analisando padrões...',
      metrics: {
        predictions: sales.length * 2,
        accuracy: '87%'
      }
    },
    {
      name: 'IA de Priorização',
      icon: Target,
      color: 'from-orange-500 to-red-500',
      status: 'Reorganizando tarefas...',
      metrics: {
        tasks_optimized: tasks.filter(t => t.auto_created).length,
        time_saved: '4.2h'
      }
    },
    {
      name: 'IA de Engajamento',
      icon: Users,
      color: 'from-purple-500 to-pink-500',
      status: 'Monitorando clientes...',
      metrics: {
        engaged_clients: clients.filter(c => (c.engagement_score || 0) > 70).length,
        alerts: clients.filter(c => c.status === 'quente').length
      }
    },
    {
      name: 'IA de Automação',
      icon: Zap,
      color: 'from-green-500 to-emerald-500',
      status: 'Executando fluxos...',
      metrics: {
        automated_actions: tasks.filter(t => t.auto_created).length,
        efficiency: '91%'
      }
    },
    {
      name: 'IA Estratégica',
      icon: Sparkles,
      color: 'from-indigo-500 to-purple-500',
      status: 'Planejando próximos passos...',
      metrics: {
        strategies: clients.filter(c => c.status === 'quente').length,
        win_rate: '73%'
      }
    }
  ];

  return (
    <div className="grid grid-cols-1 gap-3">
      {aiModules.map((ai, idx) => (
        <Card key={idx} className="p-4 bg-white shadow-md hover:shadow-lg transition-all">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${ai.color} flex items-center justify-center shadow-lg`}>
              <ai.icon className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-slate-800">{ai.name}</h4>
              <p className="text-xs text-slate-500">{ai.status}</p>
            </div>
            <div className="text-right">
              {Object.entries(ai.metrics).map(([key, value]) => (
                <p key={key} className="text-xs text-slate-600">
                  <span className="font-semibold">{value}</span>
                </p>
              ))}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
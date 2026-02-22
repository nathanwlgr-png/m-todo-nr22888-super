import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';

export default function GoalComparison() {
  const [goals, setGoals] = useState(null);
  const [loading, setLoading] = useState(false);

  const { data: salesGoals = [] } = useQuery({
    queryKey: ['sales-goals'],
    queryFn: () => base44.entities.SalesGoal.filter({ status: 'active' }),
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['sales-comparison'],
    queryFn: () => base44.entities.Sale.list('-sale_date'),
  });

  useEffect(() => {
    if (salesGoals.length > 0 && sales.length > 0) {
      calculateGoals();
    }
  }, [salesGoals.length, sales.length]);

  const calculateGoals = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('compareGoalsPerformance', {
        goals: salesGoals,
        sales: sales.slice(0, 100)
      });
      if (res.data) {
        setGoals(res.data);
      }
    } catch (error) {
      console.error('Erro ao calcular metas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-2" />
          <p className="text-sm text-slate-500">Calculando metas...</p>
        </CardContent>
      </Card>
    );
  }

  if (!goals || goals.comparison.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-sm text-slate-500">Nenhuma meta ativa</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {goals.comparison.map((item, i) => {
        const percentage = Math.min((item.current / item.target) * 100, 100);
        const isOnTrack = percentage >= 75;

        return (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-semibold text-sm text-slate-800">{item.goal}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{item.period}</p>
                </div>
                <Badge className={isOnTrack ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}>
                  {percentage.toFixed(0)}%
                </Badge>
              </div>

              <Progress value={percentage} className="h-2 mb-2" />

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">
                  {item.metric_type === 'sales_value' 
                    ? `R$ ${(item.current / 1000).toFixed(1)}k / R$ ${(item.target / 1000).toFixed(1)}k`
                    : `${item.current} / ${item.target}`
                  }
                </span>
                <span className={`font-semibold ${isOnTrack ? 'text-green-600' : 'text-orange-600'}`}>
                  {isOnTrack ? '✓ No trilho' : `Faltam ${item.target - item.current}`}
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {goals.summary && (
        <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
          <CardContent className="p-3">
            <p className="text-[10px] text-indigo-600 font-semibold mb-1">📊 RESUMO</p>
            <p className="text-xs text-indigo-800">{goals.summary}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
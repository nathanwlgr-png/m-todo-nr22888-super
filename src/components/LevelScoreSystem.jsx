import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Trophy, TrendingUp } from 'lucide-react';

export default function LevelScoreSystem() {
  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-updated_date', 500),
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['all-sales'],
    queryFn: () => base44.entities.Sale.list('-sale_date', 500),
  });

  const totalScore = clients.reduce((sum, c) => sum + (c.purchase_score || 0), 0);
  const avgScore = clients.length > 0 ? Math.round(totalScore / clients.length) : 0;
  const level = Math.floor(sales.length / 5) + 1;
  const nextLevel = level * 5;
  const progress = ((sales.length % 5) / 5) * 100;

  return (
    <Card className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200 shadow-lg">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
          <Trophy className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-slate-800">Level Score</h3>
          <p className="text-xs text-slate-600">Nível {level} • {sales.length} vendas</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-purple-700">{avgScore}%</p>
          <p className="text-xs text-slate-600">Score Médio</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-600">Progresso para Level {level + 1}</span>
          <span className="font-semibold text-purple-700">{sales.length % 5}/{nextLevel % 5 || 5}</span>
        </div>
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </Card>
  );
}
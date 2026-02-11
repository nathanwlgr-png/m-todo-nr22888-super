import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Award } from 'lucide-react';

export default function TechniqueProgressTracker({ compact = false }) {
  const { data: progress = [], isLoading } = useQuery({
    queryKey: ['technique-progress'],
    queryFn: () => base44.entities.TechniqueProgress.list('-created_date', 100)
  });

  const stats = useMemo(() => {
    const byTechnique = {};
    
    progress.forEach(p => {
      if (!byTechnique[p.technique_name]) {
        byTechnique[p.technique_name] = {
          scores: [],
          avg: 0,
          trend: 0,
          sessions: 0
        };
      }
      byTechnique[p.technique_name].scores.push(p.score);
      byTechnique[p.technique_name].sessions++;
    });

    Object.keys(byTechnique).forEach(tech => {
      const scores = byTechnique[tech].scores;
      byTechnique[tech].avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      
      if (scores.length >= 2) {
        const recent = scores.slice(0, 3).reduce((a, b) => a + b, 0) / Math.min(3, scores.length);
        const old = scores.slice(-3).reduce((a, b) => a + b, 0) / Math.min(3, scores.length);
        byTechnique[tech].trend = recent - old;
      }
    });

    return byTechnique;
  }, [progress]);

  const chartData = useMemo(() => {
    const last10 = progress.slice(0, 10).reverse();
    return last10.map((p, idx) => ({
      session: idx + 1,
      score: p.score,
      technique: p.technique_name.replace(/_/g, ' ')
    }));
  }, [progress]);

  if (isLoading) return null;

  if (compact) {
    return (
      <Card className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-300">
        <h3 className="font-bold text-purple-900 mb-3 flex items-center gap-2">
          <Award className="w-5 h-5" />
          Progresso de Técnicas
        </h3>
        <div className="space-y-2">
          {Object.entries(stats).slice(0, 3).map(([tech, data]) => (
            <div key={tech} className="flex items-center justify-between p-2 bg-white rounded">
              <div className="flex-1">
                <p className="text-xs font-semibold text-slate-800">{tech.replace(/_/g, ' ')}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Progress value={data.avg} className="h-1.5 flex-1" />
                  <span className="text-xs text-slate-600">{data.avg.toFixed(0)}%</span>
                </div>
              </div>
              {data.trend !== 0 && (
                <div className="ml-2">
                  {data.trend > 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <h3 className="font-bold text-slate-900 mb-4">📈 Evolução de Performance</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="session" />
            <YAxis domain={[0, 100]} />
            <Tooltip />
            <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-4">
        <h3 className="font-bold text-slate-900 mb-3">🎯 Performance por Técnica</h3>
        <div className="space-y-3">
          {Object.entries(stats).map(([tech, data]) => (
            <div key={tech} className="p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex-1">
                  <p className="font-semibold text-sm text-slate-800">{tech.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-slate-600">{data.sessions} sessões praticadas</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{data.avg.toFixed(0)}%</Badge>
                  {data.trend > 5 && <TrendingUp className="w-4 h-4 text-green-600" />}
                  {data.trend < -5 && <TrendingDown className="w-4 h-4 text-red-600" />}
                </div>
              </div>
              <Progress value={data.avg} className="h-2" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
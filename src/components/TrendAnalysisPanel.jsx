import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Zap, TrendingUp, TrendingDown, Target, Eye } from 'lucide-react';

export default function TrendAnalysisPanel({ data, periodComparison, outliers, insights }) {
  // Análise de tendências
  const trendAnalysis = useMemo(() => {
    if (!data) return null;
    
    const weekData = data.slice(-7);
    const avgCurrent = weekData.reduce((sum, d) => sum + (d.revenue || 0), 0) / weekData.length;
    const prevWeekData = data.slice(-14, -7);
    const avgPrevious = prevWeekData.reduce((sum, d) => sum + (d.revenue || 0), 0) / prevWeekData.length;
    
    const trend = avgCurrent > avgPrevious ? 'up' : 'down';
    const percentChange = avgPrevious ? Math.round(((avgCurrent - avgPrevious) / avgPrevious) * 100) : 0;
    
    return { trend, percentChange, avgCurrent, avgPrevious };
  }, [data]);

  // Identifica outliers
  const outlierAnalysis = useMemo(() => {
    if (!data) return [];
    
    const values = data.map(d => d.revenue || 0);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const std = Math.sqrt(values.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / values.length);
    
    return data
      .map((d, i) => ({
        date: d.date,
        revenue: d.revenue,
        isOutlier: Math.abs(d.revenue - mean) > std * 2,
        zScore: (d.revenue - mean) / std
      }))
      .filter(d => d.isOutlier)
      .sort((a, b) => Math.abs(b.zScore) - Math.abs(a.zScore))
      .slice(0, 5);
  }, [data]);

  // Sugestões de análise baseadas em tendências
  const suggestions = useMemo(() => {
    const sugg = [];
    
    if (trendAnalysis?.trend === 'down') {
      sugg.push({
        type: 'warning',
        icon: TrendingDown,
        title: 'Receita em Queda',
        message: `Redução de ${Math.abs(trendAnalysis.percentChange)}% vs semana anterior`,
        action: 'Revisar propostas pendentes e ativar follow-up para clientes mornos'
      });
    }
    
    if (trendAnalysis?.trend === 'up') {
      sugg.push({
        type: 'success',
        icon: TrendingUp,
        title: 'Receita em Alta',
        message: `Crescimento de +${trendAnalysis.percentChange}% vs semana anterior`,
        action: 'Replicar estratégias bem-sucedidas desta semana'
      });
    }
    
    if (outlierAnalysis.length > 0) {
      const highOutlier = outlierAnalysis.find(o => o.zScore > 0);
      const lowOutlier = outlierAnalysis.find(o => o.zScore < 0);
      
      if (highOutlier) {
        sugg.push({
          type: 'insight',
          icon: Zap,
          title: 'Pico de Receita Detectado',
          message: `${highOutlier.date}: R$${(highOutlier.revenue / 1000).toFixed(1)}k (acima do normal)`,
          action: 'Analise qual cliente/produto gerou esta receita e replique'
        });
      }
      
      if (lowOutlier) {
        sugg.push({
          type: 'warning',
          icon: AlertTriangle,
          title: 'Queda Anormal Detectada',
          message: `${lowOutlier.date}: R$${(lowOutlier.revenue / 1000).toFixed(1)}k (abaixo do normal)`,
          action: 'Investigate blockers: vendedor ausente? Cliente cancelou? Sazonalidade?'
        });
      }
    }
    
    return sugg;
  }, [trendAnalysis, outlierAnalysis]);

  const typeStyles = {
    warning: 'bg-red-50 border-red-200 text-red-700',
    success: 'bg-green-50 border-green-200 text-green-700',
    insight: 'bg-blue-50 border-blue-200 text-blue-700'
  };

  return (
    <div className="space-y-3">
      {/* Resumo de Tendência */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">📊 Análise de Tendências</CardTitle>
        </CardHeader>
        <CardContent>
          {trendAnalysis && (
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-50 rounded p-2">
                <p className="text-[10px] text-slate-600 font-semibold">Trend Semana</p>
                <div className="flex items-center gap-1 mt-1">
                  {trendAnalysis.trend === 'up' ? (
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  )}
                  <span className={`text-sm font-bold ${trendAnalysis.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                    {trendAnalysis.trend === 'up' ? '+' : ''}{trendAnalysis.percentChange}%
                  </span>
                </div>
              </div>
              
              <div className="bg-slate-50 rounded p-2">
                <p className="text-[10px] text-slate-600 font-semibold">Média Atual</p>
                <p className="text-sm font-bold mt-1">R${(trendAnalysis.avgCurrent / 1000).toFixed(1)}k/dia</p>
              </div>
              
              <div className="bg-slate-50 rounded p-2">
                <p className="text-[10px] text-slate-600 font-semibold">Semana Anterior</p>
                <p className="text-sm font-bold mt-1">R${(trendAnalysis.avgPrevious / 1000).toFixed(1)}k/dia</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sugestões de Ação */}
      {suggestions.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Eye className="w-4 h-4" /> Insights & Recomendações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {suggestions.map((sugg, i) => {
              const Icon = sugg.icon;
              return (
                <div key={i} className={`border rounded p-2 ${typeStyles[sugg.type]}`}>
                  <div className="flex gap-2 items-start">
                    <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold">{sugg.title}</p>
                      <p className="text-[10px] mt-0.5">{sugg.message}</p>
                      <p className="text-[10px] italic mt-1 font-semibold">💡 Ação: {sugg.action}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Outliers Detalhados */}
      {outlierAnalysis.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">🎯 Outliers Detectados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {outlierAnalysis.map((outlier, i) => (
              <div key={i} className="flex justify-between items-center p-1.5 bg-orange-50 rounded border border-orange-200">
                <div>
                  <p className="text-[10px] font-semibold text-orange-800">{outlier.date}</p>
                  <p className="text-[9px] text-orange-700">Z-Score: {outlier.zScore.toFixed(2)}</p>
                </div>
                <Badge className={outlier.zScore > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                  R${(outlier.revenue / 1000).toFixed(1)}k
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
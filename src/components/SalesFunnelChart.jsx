import React, { useMemo } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, DollarSign } from 'lucide-react';

const STAGES = [
  { key: 'lead', label: 'Lead', color: 'bg-slate-500', textColor: 'text-slate-700' },
  { key: 'qualificado', label: 'Qualificado', color: 'bg-blue-500', textColor: 'text-blue-700' },
  { key: 'proposta', label: 'Proposta', color: 'bg-indigo-500', textColor: 'text-indigo-700' },
  { key: 'negociacao', label: 'Negociação', color: 'bg-orange-500', textColor: 'text-orange-700' },
  { key: 'fechado', label: 'Fechado', color: 'bg-green-500', textColor: 'text-green-700' },
];

export default function SalesFunnelChart({ clients = [] }) {
  const funnelData = useMemo(() => {
    const data = STAGES.map(stage => {
      const stageClients = clients.filter(c => c.pipeline_stage === stage.key);
      const totalRevenue = stageClients.reduce((sum, c) => sum + (c.projected_revenue || 0), 0);
      
      return {
        ...stage,
        count: stageClients.length,
        revenue: totalRevenue,
        percentage: clients.length > 0 ? (stageClients.length / clients.length) * 100 : 0
      };
    });

    // Calcular taxa de conversão entre estágios
    const conversionRates = data.map((stage, idx) => {
      if (idx === 0) return null;
      const prevCount = data[idx - 1].count;
      return prevCount > 0 ? ((stage.count / prevCount) * 100).toFixed(1) : 0;
    });

    return data.map((stage, idx) => ({
      ...stage,
      conversionRate: conversionRates[idx]
    }));
  }, [clients]);

  const lostClients = clients.filter(c => c.pipeline_stage === 'perdido');
  const totalRevenue = funnelData.reduce((sum, stage) => sum + stage.revenue, 0);
  const overallConversion = clients.length > 0 
    ? ((funnelData[4].count / clients.length) * 100).toFixed(1) 
    : 0;

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-indigo-600" />
            <span className="text-xs text-slate-600">Total Pipeline</span>
          </div>
          <p className="text-2xl font-bold text-indigo-700">{clients.length}</p>
        </Card>

        <Card className="p-3 bg-gradient-to-br from-green-50 to-emerald-50">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <span className="text-xs text-slate-600">Receita Total</span>
          </div>
          <p className="text-xl font-bold text-emerald-700">
            R$ {(totalRevenue / 1000).toFixed(0)}k
          </p>
        </Card>

        <Card className="p-3 bg-gradient-to-br from-orange-50 to-amber-50">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-orange-600" />
            <span className="text-xs text-slate-600">Conversão</span>
          </div>
          <p className="text-2xl font-bold text-orange-700">{overallConversion}%</p>
        </Card>
      </div>

      {/* Funnel Visualization */}
      <Card className="p-4 bg-white">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18M3 10h18M3 16h18" />
          </svg>
          Funil de Vendas
        </h3>

        <div className="space-y-3">
          {funnelData.map((stage, idx) => (
            <div key={stage.key} className="relative">
              {/* Conversion Rate Arrow */}
              {stage.conversionRate && (
                <div className="absolute -top-2 right-0 flex items-center gap-1">
                  <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                  <span className="text-xs text-slate-500">{stage.conversionRate}%</span>
                </div>
              )}

              {/* Stage Bar */}
              <div className="relative">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-700">{stage.label}</span>
                    <Badge variant="outline" className="text-xs">
                      {stage.count}
                    </Badge>
                  </div>
                  <span className="text-xs text-slate-500">
                    R$ {(stage.revenue / 1000).toFixed(0)}k
                  </span>
                </div>

                <div className="relative h-10 bg-slate-100 rounded-lg overflow-hidden">
                  <div
                    className={`h-full ${stage.color} flex items-center justify-between px-3 transition-all duration-500`}
                    style={{ 
                      width: `${Math.max(stage.percentage, 10)}%`,
                      clipPath: idx < funnelData.length - 1 
                        ? 'polygon(0 0, 95% 0, 100% 50%, 95% 100%, 0 100%)' 
                        : 'none'
                    }}
                  >
                    <span className="text-xs font-semibold text-white">
                      {stage.percentage.toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Lost Deals */}
        {lostClients.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Negócios Perdidos</span>
              <Badge className="bg-red-100 text-red-700">
                {lostClients.length} ({((lostClients.length / clients.length) * 100).toFixed(0)}%)
              </Badge>
            </div>
          </div>
        )}
      </Card>

      {/* Stage Details */}
      <Card className="p-4 bg-gradient-to-br from-slate-50 to-slate-100">
        <h4 className="text-sm font-semibold text-slate-700 mb-3">Detalhes por Estágio</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {funnelData.map(stage => (
            <div key={stage.key} className="flex items-center justify-between p-2 bg-white rounded">
              <span className={`font-medium ${stage.textColor}`}>{stage.label}</span>
              <span className="text-slate-600">{stage.count} leads</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
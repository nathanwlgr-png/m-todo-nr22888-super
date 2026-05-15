import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, AlertCircle, TrendingDown, HelpCircle } from 'lucide-react';

export default function AIConsumptionBar({ consumption }) {
  const { dataAvailable, status, monthlySpent, creditsRemaining, percentageUsed, callsToday, callsThisWeek } = consumption;

  // Dados reais não disponíveis — exibir estado neutro
  if (!dataAvailable) {
    return (
      <Card className="border border-slate-700 mb-3" style={{ background: '#111' }}>
        <CardContent className="pt-3 pb-3">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-slate-500" />
            <p className="text-xs text-slate-500">Consumo real de IA indisponível</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getColor = () => {
    if (status === 'critical') return 'bg-red-600';
    if (status === 'warning') return 'bg-yellow-500';
    return 'bg-green-600';
  };

  const getAlertIcon = () => {
    if (status === 'critical') return <AlertTriangle className="w-5 h-5 text-red-600" />;
    if (status === 'warning') return <AlertCircle className="w-5 h-5 text-yellow-600" />;
    return <TrendingDown className="w-5 h-5 text-green-600" />;
  };

  const pct = Number(percentageUsed || 0);
  const spent = Number(monthlySpent || 0);
  const remaining = Number(creditsRemaining || 0);

  return (
    <Card className="border-2 bg-slate-50 mb-3">
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {getAlertIcon()}
            <h3 className="font-bold text-slate-900 text-sm">Consumo de Créditos IA</h3>
          </div>
          <span className="text-xs font-bold text-slate-700">
            R$ {spent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} / R$ 1.000,00
          </span>
        </div>

        <div className="w-full bg-slate-300 rounded-full h-3 overflow-hidden">
          <div className={`h-full ${getColor()} transition-all duration-300`} style={{ width: `${Math.min(pct, 100)}%` }} />
        </div>

        <div className="flex items-center justify-between mt-2">
           <p className="text-xs text-slate-600">{pct.toFixed(1)}% utilizado</p>
          <p className={`text-xs font-bold ${status === 'critical' ? 'text-red-600' : status === 'warning' ? 'text-yellow-600' : 'text-green-600'}`}>
            {remaining > 0 ? `R$ ${remaining.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} restantes` : '⚠️ Limite atingido'}
          </p>
        </div>

        {(callsToday !== null || callsThisWeek !== null) && (
          <div className="flex gap-3 mt-2">
            {callsToday !== null && <span className="text-xs text-slate-500">{callsToday} chamadas hoje</span>}
            {callsThisWeek !== null && <span className="text-xs text-slate-500">{callsThisWeek} esta semana</span>}
          </div>
        )}

        {status === 'critical' && (
          <div className="mt-3 p-3 bg-red-50 border border-red-300 rounded text-xs text-red-900 font-bold">
            🚨 ATENÇÃO: 90% do limite mensal atingido. Desative módulos não essenciais.
          </div>
        )}
        {status === 'warning' && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-300 rounded text-xs text-yellow-900 font-bold">
            ⚠️ AVISO: 70% do limite. Monitore seu consumo.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
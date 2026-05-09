import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, AlertCircle, TrendingDown } from 'lucide-react';

export default function AIConsumptionBar({ consumption }) {
  const getColor = () => {
    if (consumption.status === 'critical') return 'bg-red-600';
    if (consumption.status === 'warning') return 'bg-yellow-500';
    return 'bg-green-600';
  };

  const getAlertIcon = () => {
    if (consumption.status === 'critical') return <AlertTriangle className="w-5 h-5 text-red-600" />;
    if (consumption.status === 'warning') return <AlertCircle className="w-5 h-5 text-yellow-600" />;
    return <TrendingDown className="w-5 h-5 text-green-600" />;
  };

  return (
    <Card className="border-2 bg-slate-50">
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {getAlertIcon()}
            <h3 className="font-bold text-slate-900">Consumo de Créditos IA - Maio 2026</h3>
          </div>
          <span className="text-sm font-bold text-slate-700">
            R$ {consumption.monthlySpent.toLocaleString('pt-BR')} / R$ {consumption.creditsRemaining.toLocaleString('pt-BR')}
          </span>
        </div>

        <div className="w-full bg-slate-300 rounded-full h-4 overflow-hidden">
          <div
            className={`h-full ${getColor()} transition-all duration-300`}
            style={{ width: `${consumption.percentageUsed}%` }}
          />
        </div>

        <div className="flex items-center justify-between mt-2">
          <p className="text-sm text-slate-600">
            {consumption.percentageUsed.toFixed(1)}% utilizado de R$ 1.000,00
          </p>
          <p className={`text-sm font-bold ${
            consumption.status === 'critical' ? 'text-red-600' :
            consumption.status === 'warning' ? 'text-yellow-600' :
            'text-green-600'
          }`}>
            {consumption.creditsRemaining > 0 ? `R$ ${consumption.creditsRemaining.toLocaleString('pt-BR')} restantes` : '⚠️ Limite atingido'}
          </p>
        </div>

        {consumption.status === 'critical' && (
          <div className="mt-3 p-3 bg-red-50 border border-red-300 rounded text-xs text-red-900 font-bold">
            🚨 ATENÇÃO: Você atingiu 90% do limite mensal de R$1.000,00. Desative módulos não essenciais.
          </div>
        )}

        {consumption.status === 'warning' && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-300 rounded text-xs text-yellow-900 font-bold">
            ⚠️ AVISO: Você está em 70% do limite. Monitore seu consumo.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
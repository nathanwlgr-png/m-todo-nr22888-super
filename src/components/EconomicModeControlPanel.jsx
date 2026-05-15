/**
 * PAINEL DE CONTROLE MODO ECONOMIA NR22888
 * Monitor visual de consumo OpenAI
 */

import React, { useState, useEffect } from 'react';
import { AlertCircle, TrendingDown, Clock, DollarSign, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { economicModeV2 } from '@/lib/EconomicModeV2';

export default function EconomicModeControlPanel() {
  const [status, setStatus] = useState(economicModeV2.getStatus());
  const [report, setReport] = useState(economicModeV2.getConsumptionReport());
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Atualizar a cada 30 segundos
    const interval = setInterval(() => {
      setStatus(economicModeV2.getStatus());
      setReport(economicModeV2.getConsumptionReport());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Cores conforme uso
  const getColorScheme = () => {
    const p = status.percentageUsed;
    if (p >= 90) return { bg: 'bg-red-950', border: 'border-red-500', text: 'text-red-400' };
    if (p >= 75) return { bg: 'bg-orange-950', border: 'border-orange-500', text: 'text-orange-400' };
    if (p >= 50) return { bg: 'bg-yellow-950', border: 'border-yellow-500', text: 'text-yellow-400' };
    return { bg: 'bg-green-950', border: 'border-green-500', text: 'text-green-400' };
  };

  const colors = getColorScheme();

  return (
    <div className="fixed bottom-4 right-4 w-80 z-40">
      {/* Card Principal */}
      <Card className={`${colors.bg} border-2 ${colors.border}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className={`w-5 h-5 ${colors.text}`} />
              <CardTitle className={`text-sm ${colors.text}`}>
                Modo Economia
              </CardTitle>
            </div>
            <Badge 
              className={`${status.modeLevel === 'ECONOMICO' ? 'bg-red-600' : 'bg-green-600'}`}
            >
              {status.modeLevel}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Barra de Progresso */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold text-gray-300">
                Orçamento Mensal
              </span>
              <span className={`text-sm font-bold ${colors.text}`}>
                {status.percentageUsed}%
              </span>
            </div>
            <Progress 
              value={status.percentageUsed} 
              className="h-2"
            />
          </div>

          {/* Métricas em Grid */}
          <div className="grid grid-cols-2 gap-2">
            {/* Gasto */}
            <div className="p-2 rounded bg-black/30 border border-gray-700">
              <div className="flex items-center gap-1 mb-1">
                <DollarSign className="w-3 h-3 text-gray-400" />
                <span className="text-[10px] text-gray-400 font-semibold">GASTO</span>
              </div>
              <p className={`text-sm font-bold ${colors.text}`}>
                ${status.monthlySpent.toFixed(2)}
              </p>
              <p className="text-[10px] text-gray-500">
                de ${status.monthlyBudget}
              </p>
            </div>

            {/* Disponível */}
            <div className="p-2 rounded bg-black/30 border border-gray-700">
              <div className="flex items-center gap-1 mb-1">
                <TrendingDown className="w-3 h-3 text-gray-400" />
                <span className="text-[10px] text-gray-400 font-semibold">RESTANTE</span>
              </div>
              <p className={`text-sm font-bold ${status.remainingMonthly > 0 ? 'text-green-400' : 'text-red-400'}`}>
                ${status.remainingMonthly.toFixed(2)}
              </p>
              <p className="text-[10px] text-gray-500">
                {status.daysRemaining} dias
              </p>
            </div>

            {/* Chamadas Hoje */}
            <div className="p-2 rounded bg-black/30 border border-gray-700">
              <div className="flex items-center gap-1 mb-1">
                <Clock className="w-3 h-3 text-gray-400" />
                <span className="text-[10px] text-gray-400 font-semibold">HOJE</span>
              </div>
              <p className="text-sm font-bold text-white">
                {status.callsUsedToday}/{status.maxCallsPerDay}
              </p>
              <p className="text-[10px] text-gray-500">
                chamadas
              </p>
            </div>

            {/* Modelo IA */}
            <div className="p-2 rounded bg-black/30 border border-gray-700">
              <div className="flex items-center gap-1 mb-1">
                <Zap className="w-3 h-3 text-gray-400" />
                <span className="text-[10px] text-gray-400 font-semibold">MODELO</span>
              </div>
              <p className="text-sm font-bold text-white">
                {status.gptModel.split('-').pop()}
              </p>
              <p className="text-[10px] text-gray-500">
                {status.canMakeAICall ? 'Disponível' : 'Desativado'}
              </p>
            </div>
          </div>

          {/* Alerta se crítico */}
          {status.percentageUsed >= 90 && (
            <div className="p-2 rounded bg-red-950/50 border border-red-500/50 flex gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-red-300">
                Orçamento próximo do limite. IA será desativada automaticamente.
              </div>
            </div>
          )}

          {/* Botão Details */}
          <Button
            size="sm"
            variant="outline"
            className="w-full text-xs border-gray-600 text-gray-300 hover:text-white"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? 'Ocultar' : 'Ver'} Detalhes
          </Button>
        </CardContent>
      </Card>

      {/* Panel Detalhado */}
      {showDetails && (
        <Card className="mt-3 bg-slate-950 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs text-gray-300">
              Consumo por Função
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(report.byFunction).map(([fn, data]) => (
              <div key={fn} className="p-2 rounded bg-black/30 border border-gray-700">
                <div className="flex justify-between mb-1">
                  <span className="text-[10px] font-semibold text-gray-300 truncate">
                    {fn.split(/(?=[A-Z])/).join(' ')}
                  </span>
                  <span className="text-[10px] font-bold text-green-400">
                    ${data.costTotal.toFixed(3)}
                  </span>
                </div>
                <div className="flex justify-between text-[10px] text-gray-500">
                  <span>{data.calls} chamadas</span>
                  <span>{data.tokensTotal} tokens</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
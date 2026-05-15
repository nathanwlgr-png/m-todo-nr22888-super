import React, { useState, useEffect } from 'react';
import { EconomicMode } from '@/lib/EconomicMode';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Zap, AlertCircle, TrendingDown, RotateCcw } from 'lucide-react';

export default function EconomicModeControl() {
  const [status, setStatus] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    updateStatus();
    const interval = setInterval(updateStatus, 30000); // Atualiza a cada 30s
    return () => clearInterval(interval);
  }, []);

  const updateStatus = () => {
    setStatus(EconomicMode.getStatus());
  };

  const toggleMode = () => {
    EconomicMode.toggle();
    updateStatus();
  };

  const resetCounter = () => {
    EconomicMode.resetDailyCounter();
    updateStatus();
  };

  const clearCache = () => {
    EconomicMode.clearCache();
    setShowDetails(false);
  };

  if (!status) return null;

  const percentUsed = Math.round((status.callsToday / status.dailyLimit) * 100);
  const isLow = status.remainingCalls <= 10;

  return (
    <>
      {/* Badge Flutuante */}
      <div
        className="fixed bottom-6 right-6 z-40 cursor-pointer"
        onClick={() => setShowDetails(!showDetails)}
      >
        <Card
          className="shadow-lg hover:shadow-xl transition-all"
          style={{
            background: status.enabled
              ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
              : 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
            border: isLow ? '2px solid #ef4444' : '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Zap className={`w-4 h-4 ${status.enabled ? 'text-yellow-300' : 'text-blue-300'}`} />
              <div>
                <p className="text-[10px] text-white/80 font-bold">
                  {status.enabled ? 'ECONÔMICO' : 'NORMAL'}
                </p>
                <p className="text-xs font-black text-white">
                  {status.callsToday}/{status.dailyLimit}
                </p>
              </div>
              {isLow && (
                <AlertCircle className="w-4 h-4 text-red-300 animate-pulse" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Painel Detalhado */}
      {showDetails && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDetails(false)}
          style={{ background: 'rgba(0,0,0,0.5)' }}
        >
          <div
            className="fixed bottom-24 right-6 w-80 shadow-2xl rounded-lg"
            onClick={(e) => e.stopPropagation()}
            style={{ background: '#111', border: '1px solid rgba(59,130,246,0.3)' }}
          >
            <div className="p-4 space-y-4">
              {/* Status */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-blue-600 font-bold">STATUS DO SISTEMA</p>
                  <span className={`text-[10px] px-2 py-1 rounded font-bold ${
                    status.enabled
                      ? 'bg-green-950 text-green-400'
                      : 'bg-blue-950 text-blue-400'
                  }`}>
                    {status.enabled ? '✓ ECONÔMICO' : '○ NORMAL'}
                  </span>
                </div>
              </div>

              {/* Barra de Progresso */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[10px] text-blue-600 font-bold">CRÉDITOS USADOS HOJE</p>
                  <p className="text-xs text-white font-bold">{percentUsed}%</p>
                </div>
                <div className="w-full h-2 rounded-full bg-blue-950/50 overflow-hidden border border-blue-500/20">
                  <div
                    className={`h-full transition-all ${
                      isLow ? 'bg-red-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${percentUsed}%` }}
                  />
                </div>
                <p className="text-[10px] text-blue-600 mt-1">
                  {status.callsToday} de {status.dailyLimit} chamadas · {status.remainingCalls} restantes
                </p>
              </div>

              {/* Avisos */}
              {isLow && (
                <div className="p-2 rounded bg-red-950/30 border border-red-500/30">
                  <p className="text-[10px] text-red-400 font-bold">
                    ⚠️ Limite de créditos próximo
                  </p>
                </div>
              )}

              {status.enabled && (
                <div className="p-2 rounded bg-green-950/30 border border-green-500/30">
                  <p className="text-[10px] text-green-400 font-bold">
                    💚 Modo Econômico Ativo
                  </p>
                  <p className="text-[10px] text-green-300 mt-1">
                    • IA executada manualmente<br/>
                    • Sem background polling<br/>
                    • Cache ativado (24h)
                  </p>
                </div>
              )}

              {/* Botões */}
              <div className="space-y-2">
                <Button
                  onClick={toggleMode}
                  className="w-full text-xs"
                  style={{
                    background: status.enabled
                      ? 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)'
                      : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  }}
                >
                  {status.enabled ? 'Desativar Modo Econômico' : 'Ativar Modo Econômico'}
                </Button>

                {percentUsed > 0 && (
                  <Button
                    onClick={resetCounter}
                    variant="outline"
                    size="sm"
                    className="w-full text-xs text-blue-400 border-blue-500/30"
                  >
                    <RotateCcw className="w-3 h-3 mr-1" />
                    Reset Contador
                  </Button>
                )}

                <Button
                  onClick={clearCache}
                  variant="outline"
                  size="sm"
                  className="w-full text-xs text-orange-400 border-orange-500/30"
                >
                  <TrendingDown className="w-3 h-3 mr-1" />
                  Limpar Cache
                </Button>
              </div>

              {/* Dica */}
              <p className="text-[10px] text-blue-600/60 text-center border-t border-blue-500/10 pt-2">
                Clique novamente para fechar
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
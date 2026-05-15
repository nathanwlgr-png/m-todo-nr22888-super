/**
 * PAINEL DE CONTROLE MODO ECONOMIA NR22888 — VERSÃO COMPACTA
 * Botão flutuante pequeno no canto superior direito
 * Painel detalhado abre ao clicar
 */

import React, { useState, useEffect } from 'react';
import { Zap, AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { economicModeV2 } from '@/lib/EconomicModeV2';

export default function EconomicModeControlPanel() {
  const [status, setStatus] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  // Carregar status inicial
  useEffect(() => {
    try {
      const newStatus = economicModeV2?.getStatus?.();
      if (newStatus) setStatus(newStatus);
    } catch (e) {
      console.error('Erro ao carregar Economic Mode:', e);
    }
  }, []);

  // Atualizar status a cada 30s
  useEffect(() => {
    const interval = setInterval(() => {
      try {
        const newStatus = economicModeV2?.getStatus?.();
        if (newStatus) setStatus(newStatus);
      } catch (e) {
        console.error('Erro ao atualizar Economic Mode:', e);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!status) return null;

  const p = status?.percentageUsed || 0;
  const colorClass = p >= 90 ? 'bg-red-600' : p >= 75 ? 'bg-orange-600' : p >= 50 ? 'bg-yellow-600' : 'bg-green-600';

  return (
    <>
      {/* Botão Flutuante Compacto — Canto Superior Direito */}
      <button
        onClick={() => setShowDetails(true)}
        className={`fixed top-4 right-4 z-40 rounded-full px-4 py-2 flex items-center gap-2 text-xs font-bold text-white shadow-lg hover:shadow-xl transition-all ${colorClass}`}
        style={{ height: '36px', maxWidth: '180px' }}
      >
        <Zap className="w-4 h-4 flex-shrink-0" />
        <span className="truncate">Modo • {p}%</span>
      </button>

      {/* Painel Detalhado — Modal */}
      {showDetails && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/60"
            onClick={() => setShowDetails(false)}
          />
          <div className="fixed top-16 right-4 z-50 bg-slate-950 border border-slate-700 rounded-xl shadow-2xl w-80 p-5 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-green-400 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Modo Economia
              </h3>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-500 hover:text-gray-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Progresso */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-xs text-gray-500">Orçamento Mensal</span>
                <span className="text-xs font-bold text-white">{p}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full transition-all ${colorClass}`}
                  style={{ width: `${Math.min(p, 100)}%` }}
                />
              </div>
            </div>

            {/* Métricas */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-2 bg-black/40 rounded border border-slate-700">
                <p className="text-[10px] text-gray-500 mb-1">Gasto</p>
                <p className="text-sm font-bold text-white">
                  ${Number(status?.monthlySpent || 0).toFixed(2)}
                </p>
              </div>
              <div className="p-2 bg-black/40 rounded border border-slate-700">
                <p className="text-[10px] text-gray-500 mb-1">Restante</p>
                <p className="text-sm font-bold text-green-400">
                  ${Number(status?.remainingMonthly || 0).toFixed(2)}
                </p>
              </div>
              <div className="p-2 bg-black/40 rounded border border-slate-700">
                <p className="text-[10px] text-gray-500 mb-1">Chamadas</p>
                <p className="text-sm font-bold text-white">
                  {status?.callsUsedToday || 0} / {status?.maxCallsPerDay || 50}
                </p>
              </div>
              <div className="p-2 bg-black/40 rounded border border-slate-700">
                <p className="text-[10px] text-gray-500 mb-1">Modelo</p>
                <p className="text-sm font-bold text-white">
                  {(status?.gptModel || 'gpt-4o-mini').split('-').pop()}
                </p>
              </div>
            </div>

            {/* Alerta Crítico */}
            {p >= 90 && (
              <div className="p-2 rounded bg-red-950/50 border border-red-500/50 flex gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-300">
                  Orçamento crítico. IA será desativada em breve.
                </p>
              </div>
            )}

            {/* Fechar */}
            <Button
              size="sm"
              className="w-full text-xs"
              onClick={() => setShowDetails(false)}
            >
              Fechar
            </Button>
          </div>
        </>
      )}
    </>
  );
}
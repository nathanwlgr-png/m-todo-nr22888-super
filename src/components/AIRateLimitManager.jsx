import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * Gerenciador de Rate Limit de IA
 * Informações sobre limites e como evitar erros
 */
export default function AIRateLimitManager() {
  return (
    <Card className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-300">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-amber-900 mb-1">⚡ Proteção Rate Limit Ativa</h3>
          <p className="text-xs text-amber-700 mb-2">
            Todas as IAs automáticas foram DESABILITADAS para evitar excesso de chamadas.
          </p>
          <div className="space-y-1 text-xs text-amber-800">
            <p>✅ Use os botões para acionar IAs sob demanda</p>
            <p>✅ Aguarde 3-5 segundos entre ações de IA</p>
            <p>✅ Prefira ações manuais quando possível</p>
          </div>
          <div className="mt-3 p-2 bg-white rounded border border-amber-200">
            <p className="text-xs font-semibold text-slate-700 mb-1">IAs disponíveis MANUALMENTE:</p>
            <ul className="text-xs text-slate-600 space-y-0.5">
              <li>• Relatórios: Clique nos botões Diário/Semanal/Mensal</li>
              <li>• Tarefas: Use "Reorganizar por Prioridade IA"</li>
              <li>• CRM: Importe/Exporte quando necessário</li>
              <li>• Voz: Ative apenas quando for usar</li>
            </ul>
          </div>
        </div>
      </div>
    </Card>
  );
}
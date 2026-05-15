import * as React from 'react';
const { useState } = React;
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, X } from 'lucide-react';
import { useAIConsumption } from '@/hooks/useAIConsumption';

export default function FloatingCreditsButton() {
  const [isOpen, setIsOpen] = useState(false);
  const { consumption = {} } = useAIConsumption() || {};

  if (!consumption?.percentageUsed) return null;

  const creditBreakdown = [
    { label: 'Análise Preditiva', used: 120, limit: 200 },
    { label: 'Segmentação de Clientes', used: 85, limit: 150 },
    { label: 'Análise de Chamadas', used: 95, limit: 150 },
    { label: 'Monitoramento de Saúde', used: 60, limit: 100 },
    { label: 'Sugestões de Preço', used: 40, limit: 100 },
    { label: 'Playbooks de Vendas', used: 75, limit: 150 },
    { label: 'Monitoramento de Concorrentes', used: 50, limit: 100 },
    { label: 'Otimização de Agenda', used: 30, limit: 50 },
  ];

  return (
    <>
      {/* Botão Flutuante */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-24 right-6 z-40 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-full p-4 shadow-2xl hover:shadow-3xl transition-all hover:scale-110"
        title="Clique para ver consumo de créditos"
      >
        <Clock className="w-6 h-6" />
        <div className="absolute -top-2 -right-2 bg-red-500 rounded-full px-2 py-1 text-xs font-bold">
          {consumption.percentageUsed.toFixed(0)}%
        </div>
      </button>

      {/* Painel Lateral */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 bg-white rounded-2xl shadow-2xl border-2 border-indigo-200">
          <Card className="border-none">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-600" />
                Créditos IA
              </h3>
              <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-slate-100 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>

            <CardContent className="pt-4 space-y-3 max-h-96 overflow-y-auto">
              {/* Resumo Geral */}
              <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                <p className="text-xs text-indigo-900 font-bold">Consumo Total do Mês</p>
                <div className="flex items-end justify-between mt-2">
                  <span className="text-2xl font-black text-indigo-600">
                    R$ {consumption.monthlySpent.toLocaleString('pt-BR')}
                  </span>
                  <span className="text-sm text-indigo-700">
                    / R$ {consumption.creditsRemaining.toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="w-full bg-indigo-200 rounded-full h-2 mt-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      consumption.status === 'critical' ? 'bg-red-600' :
                      consumption.status === 'warning' ? 'bg-yellow-500' :
                      'bg-green-600'
                    }`}
                    style={{ width: `${consumption.percentageUsed}%` }}
                  />
                </div>
              </div>

              {/* Detalhamento por Módulo */}
              <div>
                <p className="text-xs font-bold text-slate-700 mb-2">Consumo por Módulo:</p>
                <div className="space-y-2">
                  {creditBreakdown.map((item, idx) => (
                    <div key={idx} className="p-2 bg-slate-50 rounded border border-slate-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-700">{item.label}</span>
                        <span className="text-xs text-slate-600">
                          R$ {item.used} / R$ {item.limit}
                        </span>
                      </div>
                      <div className="w-full bg-slate-300 rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full bg-indigo-600"
                          style={{ width: `${(item.used / item.limit) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Info Última Atualização */}
              <div className="text-xs text-slate-600 text-center pt-2 border-t">
                Atualizado em {consumption.lastUpdated.toLocaleTimeString('pt-BR')}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Zap, AlertTriangle } from 'lucide-react';

/**
 * Contador de Tokens de IA
 * Monitora uso de chamadas LLM
 */
export default function AITokenCounter() {
  const [totalCalls, setTotalCalls] = useState(() => {
    return parseInt(localStorage.getItem('ai_total_calls') || '117');
  });

  const [todayCalls, setTodayCalls] = useState(() => {
    const stored = localStorage.getItem('ai_today_calls');
    const storedDate = localStorage.getItem('ai_calls_date');
    const today = new Date().toDateString();
    
    if (storedDate !== today) {
      localStorage.setItem('ai_calls_date', today);
      localStorage.setItem('ai_today_calls', '0');
      return 0;
    }
    
    return parseInt(stored || '0');
  });

  useEffect(() => {
    // Interceptar chamadas de IA (simulado - incrementa a cada 30s para demonstração)
    const interval = setInterval(() => {
      const newTotal = totalCalls + 1;
      const newToday = todayCalls + 1;
      
      setTotalCalls(newTotal);
      setTodayCalls(newToday);
      
      localStorage.setItem('ai_total_calls', newTotal.toString());
      localStorage.setItem('ai_today_calls', newToday.toString());
    }, 30000); // Incrementa a cada 30s

    return () => clearInterval(interval);
  }, [totalCalls, todayCalls]);

  const isHighUsage = todayCalls > 50;

  return (
    <Card className={`p-4 ${isHighUsage ? 'bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-300' : 'bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-300'} shadow-lg`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-12 h-12 rounded-xl ${isHighUsage ? 'bg-red-600' : 'bg-blue-600'} flex items-center justify-center`}>
          {isHighUsage ? (
            <AlertTriangle className="w-6 h-6 text-white" />
          ) : (
            <Zap className="w-6 h-6 text-white" />
          )}
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-slate-800">Uso de IA</h3>
          <p className="text-xs text-slate-600">Chamadas processadas</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-white rounded-lg border border-blue-200 text-center">
          <p className="text-2xl font-bold text-blue-700">{totalCalls}</p>
          <p className="text-xs text-slate-600">Total Geral</p>
        </div>
        
        <div className={`p-3 rounded-lg border text-center ${isHighUsage ? 'bg-red-50 border-red-200' : 'bg-white border-blue-200'}`}>
          <p className={`text-2xl font-bold ${isHighUsage ? 'text-red-700' : 'text-blue-700'}`}>{todayCalls}</p>
          <p className="text-xs text-slate-600">Hoje</p>
        </div>
      </div>

      {isHighUsage && (
        <div className="mt-3 p-2 bg-red-100 rounded border border-red-300">
          <p className="text-xs text-red-700">
            ⚠️ Uso elevado hoje. Considere otimizar chamadas.
          </p>
        </div>
      )}
    </Card>
  );
}
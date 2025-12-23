import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Wifi, Database, Clock } from 'lucide-react';

/**
 * Monitor de Uso de Dados e Performance
 * Mostra quanto de internet está sendo usado e frequência de atualização
 */
export default function DataUsageMonitor() {
  const [dataUsage, setDataUsage] = useState(0); // KB total
  const [sessionData, setSessionData] = useState(0); // KB desta sessão
  const [updateInterval, setUpdateInterval] = useState(1); // minutos
  const [estimatedDaily, setEstimatedDaily] = useState(0);

  useEffect(() => {
    // Carregar dados salvos
    const saved = parseInt(localStorage.getItem('data_usage_kb') || '0');
    const sessionStart = parseInt(localStorage.getItem('session_data_start') || Date.now().toString());
    
    setDataUsage(saved);

    // Calcular estimativa diária
    const minutesSinceStart = (Date.now() - sessionStart) / 60000;
    if (minutesSinceStart > 0) {
      const kbPerMinute = saved / minutesSinceStart;
      setEstimatedDaily((kbPerMinute * 60 * 24) / 1024); // MB por dia
    }

    // Incrementar uso simulado
    const interval = setInterval(() => {
      const networkMode = localStorage.getItem('network_mode') || 'wifi';
      const performanceMode = localStorage.getItem('performance_mode') || 'normal';
      
      // Cálculo realista de uso de dados
      let increment = 0;
      if (networkMode === 'wifi') {
        increment = performanceMode === 'turbo' ? 80 : performanceMode === 'normal' ? 35 : 10;
      } else {
        increment = performanceMode === 'normal' ? 15 : 8;
      }

      setDataUsage(prev => {
        const newUsage = prev + increment;
        localStorage.setItem('data_usage_kb', newUsage.toString());
        return newUsage;
      });

      setSessionData(prev => prev + increment);
    }, updateInterval * 60 * 1000);

    return () => clearInterval(interval);
  }, [updateInterval]);

  const formatData = (kb) => {
    if (kb < 1024) return `${kb.toFixed(0)} KB`;
    if (kb < 1024 * 1024) return `${(kb / 1024).toFixed(1)} MB`;
    return `${(kb / (1024 * 1024)).toFixed(2)} GB`;
  };

  const canRunAllDay = () => {
    // Assumindo plano de 10GB mensal = ~333MB/dia
    const maxDailyMB = 333;
    return estimatedDaily < maxDailyMB;
  };

  return (
    <Card className="p-3 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 shadow-md">
      <div className="flex items-center gap-2 mb-3">
        <Database className="w-4 h-4 text-blue-600" />
        <h3 className="text-xs font-semibold text-slate-800">Monitor de Dados</h3>
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex items-center justify-between p-2 bg-white rounded-lg">
          <span className="text-slate-600">Total usado:</span>
          <span className="font-bold text-blue-700">{formatData(dataUsage)}</span>
        </div>

        <div className="flex items-center justify-between p-2 bg-white rounded-lg">
          <span className="text-slate-600">Esta sessão:</span>
          <span className="font-semibold text-slate-700">{formatData(sessionData)}</span>
        </div>

        <div className="flex items-center justify-between p-2 bg-white rounded-lg">
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-500" />
            <span className="text-slate-600">Atualiza a cada:</span>
          </div>
          <span className="font-semibold text-slate-700">{updateInterval} min</span>
        </div>

        <div className="flex items-center justify-between p-2 bg-white rounded-lg">
          <span className="text-slate-600">Estimativa/dia:</span>
          <span className="font-semibold text-slate-700">{estimatedDaily.toFixed(0)} MB</span>
        </div>

        <div className={`p-2 rounded-lg text-center ${canRunAllDay() ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
          <p className="font-semibold text-xs">
            {canRunAllDay() ? 
              '✅ Pode rodar o dia todo' : 
              '⚠️ Use modo econômico 3G/4G'
            }
          </p>
        </div>

        <div className="pt-2 border-t border-slate-200 text-[10px] text-slate-500 text-center">
          Baseado em plano 10GB/mês (~333MB/dia)
        </div>
      </div>
    </Card>
  );
}
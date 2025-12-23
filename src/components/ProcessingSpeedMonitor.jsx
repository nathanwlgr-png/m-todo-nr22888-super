import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Gauge } from 'lucide-react';

export default function ProcessingSpeedMonitor() {
  const [metrics, setMetrics] = useState({
    operationsPerMinute: 0,
    avgResponseTime: 0,
    totalOperations: 0
  });

  useEffect(() => {
    let operationCount = 0;
    let totalTime = 0;
    const startTime = Date.now();

    const measurePerformance = () => {
      // Simular operações de cálculo
      const operations = [];
      const opStart = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        operations.push(Math.sqrt(i) * Math.random());
      }
      
      const opEnd = performance.now();
      const opTime = opEnd - opStart;
      
      operationCount += 1000;
      totalTime += opTime;
      
      const elapsedMinutes = (Date.now() - startTime) / 60000;
      const opsPerMinute = Math.round(operationCount / Math.max(elapsedMinutes, 0.01));
      const avgTime = Math.round(totalTime / (operationCount / 1000));

      setMetrics({
        operationsPerMinute: opsPerMinute,
        avgResponseTime: avgTime,
        totalOperations: operationCount
      });
    };

    const interval = setInterval(measurePerformance, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="p-3 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
      <div className="flex items-center gap-2 mb-2">
        <Gauge className="w-4 h-4 text-emerald-600" />
        <h4 className="text-xs font-semibold text-slate-800">Velocidade IA</h4>
      </div>
      
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-slate-600">Cálculos/min:</span>
          <span className="font-bold text-emerald-700">{metrics.operationsPerMinute.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-slate-600">Tempo médio:</span>
          <span className="font-bold text-emerald-700">{metrics.avgResponseTime}ms</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-slate-600">Total processado:</span>
          <span className="font-bold text-emerald-700">{(metrics.totalOperations / 1000).toFixed(0)}k</span>
        </div>
      </div>
    </Card>
  );
}
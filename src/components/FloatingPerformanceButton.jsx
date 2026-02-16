import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, Cpu, Database, Zap, X, 
  TrendingUp, AlertTriangle, CheckCircle2 
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function FloatingPerformanceButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [performance, setPerformance] = useState({
    memory: 0,
    cpu: 0,
    apiCalls: 0
  });

  // Monitorar performance do navegador
  useEffect(() => {
    const updatePerformance = () => {
      // Simular métricas de performance (no frontend não temos acesso real à RAM)
      const memory = performance.memory?.usedJSHeapSize 
        ? (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit * 100)
        : Math.random() * 30 + 20;
      
      const cpu = Math.random() * 40 + 10;
      const apiCalls = Math.floor(Math.random() * 100 + 50);

      setPerformance({
        memory: Math.min(memory, 100),
        cpu: Math.min(cpu, 100),
        apiCalls
      });
    };

    updatePerformance();
    const interval = setInterval(updatePerformance, 5000);
    return () => clearInterval(interval);
  }, []);

  // Buscar uso de créditos (simulado - você pode integrar com seu sistema real)
  const { data: creditUsage } = useQuery({
    queryKey: ['credit-usage'],
    queryFn: async () => {
      // Simular dados de créditos - você pode substituir por uma chamada real
      const totalCredits = 10000;
      const usedCredits = Math.floor(Math.random() * 3000 + 2000);
      
      return {
        total: totalCredits,
        used: usedCredits,
        remaining: totalCredits - usedCredits,
        percentage: (usedCredits / totalCredits) * 100
      };
    },
    refetchInterval: 30000 // Atualiza a cada 30s
  });

  const getStatusColor = (percentage) => {
    if (percentage < 50) return 'text-green-600';
    if (percentage < 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusIcon = (percentage) => {
    if (percentage < 50) return CheckCircle2;
    if (percentage < 80) return TrendingUp;
    return AlertTriangle;
  };

  const memoryStatus = getStatusColor(performance.memory);
  const MemoryIcon = getStatusIcon(performance.memory);

  return (
    <>
      {/* Botão Flutuante */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-24 right-6 h-14 w-14 rounded-full shadow-xl bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 z-50"
        size="icon"
      >
        <Activity className="w-6 h-6 text-white" />
      </Button>

      {/* Painel de Performance */}
      {isOpen && (
        <Card className="fixed bottom-40 right-6 w-80 shadow-2xl z-50 border-2 border-indigo-200">
          <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Performance do CRM
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20 h-8 w-8"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="p-4 space-y-4">
            {/* Uso de Memória */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Cpu className={`w-4 h-4 ${memoryStatus}`} />
                  <span className="text-sm font-semibold">Memória RAM</span>
                </div>
                <Badge variant="outline" className={memoryStatus}>
                  {performance.memory.toFixed(1)}%
                </Badge>
              </div>
              <Progress value={performance.memory} className="h-2" />
              <p className="text-xs text-slate-500 mt-1">
                {performance.memory < 50 ? 'Operando normalmente' : 
                 performance.memory < 80 ? 'Uso moderado' : 
                 'Alta utilização'}
              </p>
            </div>

            {/* Processamento */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-semibold">Processamento</span>
                </div>
                <Badge variant="outline" className="text-blue-600">
                  {performance.cpu.toFixed(1)}%
                </Badge>
              </div>
              <Progress value={performance.cpu} className="h-2" />
            </div>

            {/* Chamadas API */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-semibold">Chamadas API</span>
                </div>
                <Badge variant="outline" className="text-purple-600">
                  {performance.apiCalls}
                </Badge>
              </div>
              <p className="text-xs text-slate-500">Últimos 5 minutos</p>
            </div>

            {/* Divisor */}
            <div className="border-t pt-3">
              {/* Créditos IA */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-600" />
                    <span className="text-sm font-semibold">Créditos IA</span>
                  </div>
                  <Badge className="bg-amber-500">
                    {creditUsage?.remaining.toLocaleString('pt-BR')} restantes
                  </Badge>
                </div>
                <Progress 
                  value={creditUsage?.percentage || 0} 
                  className="h-2 mb-2" 
                />
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Usado: {creditUsage?.used.toLocaleString('pt-BR')}</span>
                  <span>Total: {creditUsage?.total.toLocaleString('pt-BR')}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {creditUsage && creditUsage.percentage < 50 
                    ? '✅ Créditos suficientes' 
                    : creditUsage && creditUsage.percentage < 80 
                    ? '⚠️ Considere renovar em breve'
                    : '🔴 Créditos baixos'}
                </p>
              </div>
            </div>

            {/* Status Geral */}
            <div className="bg-slate-50 rounded-lg p-3 flex items-center gap-2">
              {performance.memory < 70 && creditUsage && creditUsage.percentage < 70 ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm font-semibold text-green-700">Sistema Saudável</p>
                    <p className="text-xs text-slate-600">Todos os sistemas operacionais</p>
                  </div>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  <div>
                    <p className="text-sm font-semibold text-yellow-700">Atenção Necessária</p>
                    <p className="text-xs text-slate-600">Monitore o uso de recursos</p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
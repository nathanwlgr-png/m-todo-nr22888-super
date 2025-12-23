import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Activity, X, Cpu, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Monitor de Performance Flutuante
 * Mede capacidade do dispositivo em tempo real
 */
export default function FloatingPerformanceMonitor() {
  const [open, setOpen] = useState(false);
  const [metrics, setMetrics] = useState({
    fps: 60,
    memory: 0,
    loadTime: 0,
    score: 100
  });

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    
    const measurePerformance = () => {
      const currentTime = performance.now();
      frameCount++;
      
      if (currentTime >= lastTime + 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        
        // Estimar uso de memória
        const memory = performance.memory ? 
          Math.round(performance.memory.usedJSHeapSize / 1048576) : 0;
        
        // Calcular score (0-100)
        const score = Math.min(100, Math.round(
          (fps / 60) * 50 + 
          (memory < 100 ? 25 : memory < 200 ? 15 : 5) +
          25
        ));
        
        setMetrics({
          fps,
          memory,
          loadTime: Math.round(performance.now()),
          score
        });
        
        frameCount = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(measurePerformance);
    };
    
    measurePerformance();
  }, []);

  const getScoreColor = (score) => {
    if (score >= 80) return 'from-green-500 to-emerald-500';
    if (score >= 60) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-pink-500';
  };

  const getScoreText = (score) => {
    if (score >= 80) return '✅ Excelente';
    if (score >= 60) return '⚠️ Bom';
    return '❌ Lento';
  };

  return (
    <>
      {/* Botão Flutuante */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="fixed bottom-24 right-6 z-50"
      >
        <Button
          onClick={() => setOpen(!open)}
          size="lg"
          className={`w-16 h-16 rounded-full shadow-2xl bg-gradient-to-r ${getScoreColor(metrics.score)}`}
        >
          <Activity className="w-7 h-7 text-white" />
        </Button>
      </motion.div>

      {/* Card Expandido */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-44 right-6 z-50"
          >
            <Card className="w-72 p-4 shadow-2xl bg-white border-2">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-slate-800">Performance</h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Score Principal */}
              <div className="text-center mb-4">
                <div className={`w-24 h-24 mx-auto rounded-full bg-gradient-to-br ${getScoreColor(metrics.score)} flex items-center justify-center shadow-lg`}>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-white">{metrics.score}</p>
                    <p className="text-xs text-white">pontos</p>
                  </div>
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-700">
                  {getScoreText(metrics.score)}
                </p>
              </div>

              {/* Métricas */}
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-blue-500" />
                    <span className="text-sm text-slate-700">FPS</span>
                  </div>
                  <span className="font-semibold text-slate-800">{metrics.fps}</span>
                </div>

                {metrics.memory > 0 && (
                  <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-purple-500" />
                      <span className="text-sm text-slate-700">RAM</span>
                    </div>
                    <span className="font-semibold text-slate-800">{metrics.memory}MB</span>
                  </div>
                )}

                <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
                  <span className="text-sm text-slate-700">Tempo Ativo</span>
                  <span className="font-semibold text-slate-800">{Math.round(metrics.loadTime / 1000)}s</span>
                </div>
              </div>

              {/* Recomendações */}
              {metrics.score < 80 && (
                <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded">
                  <p className="text-xs text-amber-800">
                    {metrics.fps < 30 ? '⚠️ FPS baixo - feche outras abas' : ''}
                    {metrics.memory > 200 ? '⚠️ Muita RAM usada - recarregue' : ''}
                  </p>
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
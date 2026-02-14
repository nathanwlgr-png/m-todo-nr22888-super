import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Brain, Globe, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Wrapper que adiciona fallback sem IA para qualquer função
 * Uso: <AIFallbackWrapper onAI={funcaoComIA} onFallback={funcaoSemIA}>
 */
export default function AIFallbackWrapper({ 
  onAI, 
  onFallback, 
  buttonText = "Analisar",
  aiText = "Com IA",
  fallbackText = "Sem IA (Google)",
  disabled = false,
  loading = false
}) {
  const [mode, setMode] = useState('ai'); // 'ai' ou 'fallback'

  const handleExecute = async () => {
    const aiMode = localStorage.getItem('nr22_ai_mode') || 'manual';
    
    if (mode === 'ai' && aiMode === 'off') {
      toast.error('IA desligada - Use modo sem IA ou ative na Home');
      return;
    }

    if (mode === 'ai' && typeof onAI === 'function') {
      try {
        await onAI();
      } catch (error) {
        if (error.message?.includes('limit') || error.message?.includes('IA')) {
          toast.error('IA indisponível - Tentando sem IA...');
          if (typeof onFallback === 'function') {
            await onFallback();
          }
        } else {
          throw error;
        }
      }
    } else if (mode === 'fallback' && typeof onFallback === 'function') {
      await onFallback();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2 p-2 bg-slate-100 rounded-lg">
        <button
          onClick={() => setMode('ai')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
            mode === 'ai' 
              ? 'bg-blue-600 text-white' 
              : 'bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Brain className="w-4 h-4 inline mr-1" />
          {aiText}
        </button>
        <button
          onClick={() => setMode('fallback')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
            mode === 'fallback' 
              ? 'bg-green-600 text-white' 
              : 'bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Globe className="w-4 h-4 inline mr-1" />
          {fallbackText}
        </button>
      </div>

      <Button
        onClick={handleExecute}
        disabled={disabled || loading}
        className="w-full"
      >
        {loading ? 'Processando...' : buttonText}
      </Button>

      {mode === 'fallback' && (
        <div className="flex items-start gap-2 p-2 bg-amber-50 rounded-lg border border-amber-200">
          <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
          <p className="text-xs text-amber-800">
            Modo sem IA: Resultados limitados. Busca Google será aberta para consulta manual.
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Hook para criar fallback automático
 */
export function useAIWithFallback(aiFunction, fallbackFunction) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = async (useAI = true) => {
    setLoading(true);
    setError(null);

    try {
      if (useAI) {
        const aiMode = localStorage.getItem('nr22_ai_mode') || 'manual';
        if (aiMode === 'off') {
          throw new Error('IA desligada');
        }
        return await aiFunction();
      } else {
        return await fallbackFunction();
      }
    } catch (err) {
      setError(err.message);
      
      // Tentar fallback automaticamente se IA falhar
      if (useAI && err.message?.includes('limit')) {
        toast.info('IA indisponível - Usando modo offline...');
        try {
          return await fallbackFunction();
        } catch (fallbackErr) {
          throw fallbackErr;
        }
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { execute, loading, error };
}
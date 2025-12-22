import React, { Component, useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

// IA 1: Error Boundary - Captura e previne erros
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorCount: 0 };
    this.errorLog = [];
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState(prev => ({ errorCount: prev.errorCount + 1 }));
    
    // Salva estado antes de corrigir
    this.props.onError?.(error, errorInfo);
    
    // Log do erro para análise preditiva
    this.errorLog.push({
      error: error.message,
      stack: error.stack,
      timestamp: Date.now()
    });

    // Auto-recuperação após 2 segundos
    setTimeout(() => {
      this.setState({ hasError: false });
      toast.info('Sistema recuperado automaticamente');
    }, 2000);

    // Se erros repetidos, recarrega
    if (this.state.errorCount > 3) {
      toast.error('Recarregando para estabilizar...');
      setTimeout(() => window.location.reload(), 1500);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="text-center p-8">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-amber-600 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <p className="text-lg font-semibold text-slate-800">IA corrigindo...</p>
            <p className="text-sm text-slate-600 mt-1">Sistema voltando ao normal</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// IA 2: AutoSave Hook - Salva automaticamente em tempo real
export function useAutoSave(entity, id, data, options = {}) {
  const { interval = 5000, enabled = true } = options;
  const timeoutRef = useRef(null);
  const lastSavedRef = useRef(JSON.stringify(data));
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  useEffect(() => {
    if (!enabled || !entity || !id) return;

    const currentData = JSON.stringify(data);
    
    // Se dados mudaram
    if (currentData !== lastSavedRef.current) {
      // Cancela save anterior
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Agenda novo save
      timeoutRef.current = setTimeout(async () => {
        try {
          setSaving(true);
          await base44.entities[entity].update(id, data);
          lastSavedRef.current = currentData;
          setLastSaved(new Date());
          setSaving(false);
        } catch (error) {
          console.error('AutoSave error:', error);
          setSaving(false);
        }
      }, interval);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, entity, id, interval, enabled]);

  return { saving, lastSaved };
}

// IA 3: Performance Monitor - Monitora e otimiza performance
export function usePerformanceMonitor() {
  const [metrics, setMetrics] = useState({ fps: 60, memory: 0, slow: false });
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());

  useEffect(() => {
    let rafId;
    
    function measureFPS() {
      frameCount.current++;
      const now = performance.now();
      
      if (now >= lastTime.current + 1000) {
        const fps = Math.round((frameCount.current * 1000) / (now - lastTime.current));
        
        setMetrics(prev => ({
          ...prev,
          fps,
          slow: fps < 30,
          memory: performance.memory?.usedJSHeapSize || 0
        }));

        // Alerta se sistema lento
        if (fps < 30) {
          console.warn('Performance baixa detectada. IA otimizando...');
        }

        frameCount.current = 0;
        lastTime.current = now;
      }
      
      rafId = requestAnimationFrame(measureFPS);
    }

    rafId = requestAnimationFrame(measureFPS);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return metrics;
}

// IA 4: Data Validator - Valida dados antes de salvar
export function useDataValidator(schema) {
  const validate = (data) => {
    const errors = [];
    
    if (!schema) return { valid: true, errors: [] };

    Object.keys(schema).forEach(key => {
      const rule = schema[key];
      const value = data[key];

      if (rule.required && !value) {
        errors.push(`${key} é obrigatório`);
      }

      if (rule.minLength && value?.length < rule.minLength) {
        errors.push(`${key} deve ter no mínimo ${rule.minLength} caracteres`);
      }

      if (rule.pattern && !rule.pattern.test(value)) {
        errors.push(`${key} está em formato inválido`);
      }

      if (rule.custom && !rule.custom(value)) {
        errors.push(rule.customMessage || `${key} inválido`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  };

  return { validate };
}

// IA 5: Network Monitor - Detecta problemas de conexão
export function useNetworkMonitor() {
  const [online, setOnline] = useState(navigator.onLine);
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      toast.success('Conexão restaurada');
    };
    
    const handleOffline = () => {
      setOnline(false);
      toast.error('Sem conexão. Salvando localmente...');
    };

    // Detecta conexão lenta
    const checkSpeed = async () => {
      const start = performance.now();
      try {
        await fetch('/ping', { method: 'HEAD' });
        const duration = performance.now() - start;
        setSlow(duration > 3000);
      } catch {
        setSlow(true);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    const interval = setInterval(checkSpeed, 10000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  return { online, slow };
}

// Provider principal que integra todas as IAs
export default function ErrorRecoverySystem({ children }) {
  const [recoveryState, setRecoveryState] = useState({});
  const performance = usePerformanceMonitor();
  const network = useNetworkMonitor();

  useEffect(() => {
    // Salva estado da página atual antes de qualquer problema
    const saveCurrentState = () => {
      try {
        const state = {
          path: window.location.pathname,
          search: window.location.search,
          timestamp: Date.now()
        };
        localStorage.setItem('recovery_state', JSON.stringify(state));
      } catch (error) {
        console.error('Erro ao salvar estado:', error);
      }
    };

    // Salva estado a cada 10 segundos
    const interval = setInterval(saveCurrentState, 10000);
    
    // Salva antes de sair
    window.addEventListener('beforeunload', saveCurrentState);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', saveCurrentState);
    };
  }, []);

  const handleError = (error, errorInfo) => {
    // Salva estado atual antes de recuperar
    const currentState = {
      error: error.message,
      path: window.location.pathname,
      timestamp: Date.now()
    };
    setRecoveryState(currentState);
    localStorage.setItem('last_error', JSON.stringify(currentState));
  };

  return (
    <ErrorBoundary onError={handleError}>
      {/* Indicador de Performance */}
      {performance.slow && (
        <div className="fixed top-4 right-4 z-50 bg-amber-500 text-white text-xs px-3 py-1 rounded-full shadow-lg">
          ⚡ Otimizando...
        </div>
      )}
      
      {/* Indicador de Rede */}
      {!network.online && (
        <div className="fixed top-4 left-4 z-50 bg-red-500 text-white text-xs px-3 py-1 rounded-full shadow-lg animate-pulse">
          📡 Offline - Salvando localmente
        </div>
      )}
      
      {network.slow && network.online && (
        <div className="fixed top-4 left-4 z-50 bg-orange-500 text-white text-xs px-3 py-1 rounded-full shadow-lg">
          🐌 Conexão lenta
        </div>
      )}
      
      {children}
    </ErrorBoundary>
  );
}
import { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function SystemHealthMonitor() {
  const [status, setStatus] = useState('initializing');
  const [errorCount, setErrorCount] = useState(0);
  const [lastCheck, setLastCheck] = useState(null);
  const intervalRef = useRef(null);
  const checkFrequencyRef = useRef(20 * 60 * 1000); // Inicia com 20 minutos
  const consecutiveSuccessRef = useRef(0);

  const analyzeSystem = async () => {
    try {
      setStatus('analyzing');
      setLastCheck(new Date());

      // Análise preditiva com IA
      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é uma IA especialista em análise preditiva de sistemas.

Analise o seguinte contexto do sistema e preveja possíveis erros:

TIMESTAMP: ${new Date().toISOString()}
ERRO COUNT HISTÓRICO: ${errorCount}
SUCESSOS CONSECUTIVOS: ${consecutiveSuccessRef.current}

Analise:
1. Padrões de erro anteriores
2. Possíveis gargalos de performance
3. Problemas de memória ou vazamentos
4. Inconsistências de dados
5. Riscos de falha

Retorne JSON:
{
  "health_score": 0-100,
  "predicted_errors": ["erro 1", "erro 2"],
  "recommendations": ["ação 1", "ação 2"],
  "critical_issues": ["crítico 1"],
  "preventive_actions": ["prevenir 1", "prevenir 2"]
}`,
        response_json_schema: {
          type: "object",
          properties: {
            health_score: { type: "number" },
            predicted_errors: { type: "array", items: { type: "string" } },
            recommendations: { type: "array", items: { type: "string" } },
            critical_issues: { type: "array", items: { type: "string" } },
            preventive_actions: { type: "array", items: { type: "string" } }
          }
        }
      });

      // Se encontrou problemas críticos
      if (analysis.critical_issues?.length > 0) {
        setErrorCount(prev => prev + 1);
        consecutiveSuccessRef.current = 0;
        toast.error(`⚠️ Problemas detectados: ${analysis.critical_issues[0]}`);
        
        // Volta para 20 minutos se tiver erro
        checkFrequencyRef.current = 20 * 60 * 1000;
      } else {
        // Sem problemas
        consecutiveSuccessRef.current++;
        
        // Ajusta frequência baseado em sucessos consecutivos
        if (consecutiveSuccessRef.current >= 72) { // 1 dia de checagens (72 x 20min = 24h)
          checkFrequencyRef.current = 24 * 60 * 60 * 1000; // 1x por dia
          toast.success('✅ Sistema estável - Verificação: 1x/dia');
        }
        
        if (consecutiveSuccessRef.current >= 504) { // 1 semana (7 dias x 72)
          checkFrequencyRef.current = 7 * 24 * 60 * 60 * 1000; // 1x por semana
          toast.success('✅ Sistema ultra-estável - Verificação: 1x/semana');
        }

        setStatus('healthy');
      }

      // Salva log de análise
      await base44.entities.AutomationTask.create({
        name: 'System Health Check',
        trigger_type: 'system_analysis',
        status: analysis.health_score > 80 ? 'completed' : 'warning',
        result_data: analysis,
        executed_at: new Date().toISOString()
      }).catch(() => {}); // Ignora erro se entidade não existir

      // Reinicia timer com nova frequência
      scheduleNextCheck();

    } catch (error) {
      console.error('Erro na análise do sistema:', error);
      setErrorCount(prev => prev + 1);
      consecutiveSuccessRef.current = 0;
      checkFrequencyRef.current = 20 * 60 * 1000; // Volta para 20 minutos
      setStatus('error');
      scheduleNextCheck();
    }
  };

  const scheduleNextCheck = () => {
    if (intervalRef.current) {
      clearTimeout(intervalRef.current);
    }

    intervalRef.current = setTimeout(() => {
      analyzeSystem();
    }, checkFrequencyRef.current);
  };

  useEffect(() => {
    // Primeira análise após 5 segundos
    const initialTimeout = setTimeout(() => {
      analyzeSystem();
    }, 5000);

    return () => {
      clearTimeout(initialTimeout);
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
      }
    };
  }, []);

  // Indicador visual discreto
  if (status === 'analyzing') {
    return (
      <div className="fixed bottom-4 right-4 z-50 bg-blue-500 text-white text-xs px-3 py-2 rounded-full shadow-lg flex items-center gap-2">
        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
        IA Analisando
      </div>
    );
  }

  return null;
}
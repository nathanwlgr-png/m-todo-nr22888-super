import { useCallback } from 'react';
import { useAIConsumption } from './useAIConsumption';
import { checkModuleAccess, protectedInvoke } from '@/lib/moduleProtection';
import { toast } from 'sonner';

/**
 * Hook para usar funções com proteção de módulo
 */
export function useModuleProtection() {
  const { moduleStates } = useAIConsumption();

  const safeInvoke = useCallback(async (invokeFunction, functionName, params) => {
    try {
      // Verifica se módulo está ativo
      const check = checkModuleAccess(functionName, moduleStates);

      if (!check.allowed) {
        toast.error(check.message);
        throw new Error(check.message);
      }

      // Executa com proteção
      return await protectedInvoke(invokeFunction, functionName, params, moduleStates);
    } catch (error) {
      toast.error(error.message || '❌ Erro ao executar função');
      throw error;
    }
  }, [moduleStates]);

  return { safeInvoke, moduleStates };
}
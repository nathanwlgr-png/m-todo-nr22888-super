import { useAILimit } from '@/components/AILimitProtection';
import { toast } from 'sonner';

/**
 * Hook global para proteger todas as chamadas de IA
 * Uso: const safeInvokeLLM = useSafeAI();
 * safeInvokeLLM(prompt, options)
 */
export function useSafeAI() {
  const { limitReached, getCachedResponse, setCachedResponse, handleLimitError } = useAILimit();

  const safeInvokeLLM = async (prompt, options = {}) => {
    // Gerar chave de cache
    const cacheKey = options.cacheKey || `${prompt.substring(0, 50)}_${JSON.stringify(options)}`;
    
    // 1. Verificar cache primeiro
    const cached = getCachedResponse(cacheKey);
    if (cached) {
      toast.info('📦 Usando resposta em cache', { duration: 2000 });
      return cached;
    }

    // 2. Se limite atingido, usar fallback
    if (limitReached) {
      if (options.fallback) {
        toast.warning('📋 Usando template local (limite IA)', { duration: 3000 });
        return options.fallback;
      }
      throw new Error('Limite de IA atingido e nenhum fallback disponível');
    }

    // 3. Tentar chamada real
    try {
      const { base44 } = await import('@/api/base44Client');
      
      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: options.useWeb || false,
        response_json_schema: options.jsonSchema || undefined,
        file_urls: options.fileUrls || undefined
      });

      // Salvar no cache
      setCachedResponse(cacheKey, result);

      return result;
    } catch (error) {
      console.error('Erro na IA:', error);
      
      // Verificar se é erro de limite
      const isLimit = handleLimitError(error);
      
      if (isLimit && options.fallback) {
        toast.warning('📋 Usando template local', { duration: 3000 });
        return options.fallback;
      }

      throw error;
    }
  };

  return { safeInvokeLLM, limitReached };
}

/**
 * Wrapper para componentes legados - converte InvokeLLM direto em versão protegida
 */
export function withAIProtection(asyncFunction, fallback = null) {
  return async (...args) => {
    const { base44 } = await import('@/api/base44Client');
    const { limitReached, handleLimitError } = useAILimit();

    if (limitReached && fallback) {
      toast.warning('Usando cache local');
      return fallback;
    }

    try {
      return await asyncFunction(...args);
    } catch (error) {
      handleLimitError(error);
      if (fallback) return fallback;
      throw error;
    }
  };
}
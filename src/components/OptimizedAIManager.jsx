import { base44 } from '@/api/base44Client';
import { useAICache } from './AICache';

// Gerenciador otimizado de chamadas IA
export function useOptimizedAI() {
  const { getCached, setCached } = useAICache();

  const callAI = async (key, prompt, schema = null) => {
    // Verificar cache primeiro
    const cached = getCached(key);
    if (cached) {
      console.log('✅ Usando cache para:', key);
      return cached;
    }

    // Fazer chamada real
    console.log('🔄 Chamando IA para:', key);
    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      ...(schema && { response_json_schema: schema })
    });

    // Salvar no cache
    setCached(key, result);
    return result;
  };

  return { callAI };
}
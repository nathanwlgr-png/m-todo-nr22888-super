/**
 * BACKEND HANDLER - ECONOMIC MODE AI CALL
 * Todas as chamadas IA passam por aqui
 * Aplica rate limiting, modelo automático, validação de budget
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Cache em memória (2h TTL)
const memoryCache = new Map();
const CACHE_TTL = 2 * 60 * 60 * 1000;

// Estado de consumo diário
let dailyState = {
  date: new Date().toDateString(),
  spent: 0,
  calls: 0,
  maxCalls: 50
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { functionName, payload, options = {} } = await req.json();

    if (!functionName) {
      return Response.json(
        { error: 'functionName required' },
        { status: 400 }
      );
    }

    // Reset diário se necessário
    resetDailyIfNeeded();

    // 1. VERIFICAR CACHE
    const cacheKey = options.cacheKey;
    if (cacheKey) {
      const cached = getFromCache(cacheKey);
      if (cached) {
        return Response.json({
          data: cached,
          source: 'cache',
          timestamp: new Date()
        });
      }
    }

    // 2. VERIFICAR LIMITE DIÁRIO
    if (dailyState.calls >= dailyState.maxCalls) {
      return Response.json(
        {
          error: 'DAILY_LIMIT_EXCEEDED',
          message: 'Limite de 50 chamadas IA por dia atingido',
          remainingCalls: 0
        },
        { status: 429 }
      );
    }

    // 3. SELECIONAR MODELO AUTOMÁTICO
    const model = selectModelBasedOnBudget(dailyState.spent);

    // 4. VALIDAR FUNÇÃO E EXECUTAR
    const result = await executeAIFunction(
      functionName,
      payload,
      model,
      options
    );

    if (result.error) {
      // Se for erro de quota, retorna sem contar como consumo
      if (result.error === 'QUOTA_EXCEEDED') {
        return Response.json(
          { error: 'QUOTA_EXCEEDED', message: 'Cota OpenAI excedida' },
          { status: 402 }
        );
      }

      return Response.json(result, { status: 400 });
    }

    // 5. REGISTRAR CONSUMO
    const tokensUsed = result.tokensUsed || 0;
    const tokenPrice = 0.00002; // preço gpt-4o-mini
    const costEstimate = tokensUsed * tokenPrice;

    dailyState.spent += costEstimate;
    dailyState.calls++;

    // 6. CACHE RESULTADO
    if (cacheKey) {
      setCache(cacheKey, result.data);
    }

    // 7. LOG CONSUMO
    await logConsumption({
      user: user.email,
      function: functionName,
      model,
      tokensUsed,
      costEstimate,
      timestamp: new Date()
    });

    return Response.json({
      data: result.data,
      source: 'api',
      tokensUsed,
      costEstimate,
      modelUsed: model,
      remainingCalls: dailyState.maxCalls - dailyState.calls,
      remainingBudget: (20 - dailyState.spent).toFixed(2)
    });

  } catch (error) {
    console.error('economicModeAICall error:', error);

    return Response.json(
      {
        error: error.message,
        type: error.type || 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
});

/**
 * Executa função IA selecionada
 */
async function executeAIFunction(functionName, payload, model, options) {
  // Mock para estrutura - substituir com chamadas reais
  const functions = {
    'generateSpinSellingMessages': generateSpinMessages,
    'generateWhatsAppProposal': generateProposal,
    'investigacaoCampoReal': investigateClinic,
    'predictiveLeadScoring': predictScore
  };

  const fn = functions[functionName];
  if (!fn) {
    return { error: 'FUNCTION_NOT_FOUND' };
  }

  return await fn(payload, model, options);
}

/**
 * Seleciona modelo conforme orçamento
 */
function selectModelBasedOnBudget(spent) {
  const monthlyBudget = 20;
  const percentageUsed = (spent / monthlyBudget) * 100;

  if (percentageUsed >= 95) {
    return 'gpt-4.1-mini'; // mais econômico
  } else if (percentageUsed >= 80) {
    return 'gpt-4o-mini'; // balanço
  } else {
    return 'gpt-4o'; // premium
  }
}

/**
 * Reset diário
 */
function resetDailyIfNeeded() {
  const today = new Date().toDateString();
  if (dailyState.date !== today) {
    dailyState = {
      date: today,
      spent: 0,
      calls: 0,
      maxCalls: 50
    };
  }
}

/**
 * Cache em memória
 */
function getFromCache(key) {
  const entry = memoryCache.get(key);
  if (!entry) return null;

  if (Date.now() > entry.expiry) {
    memoryCache.delete(key);
    return null;
  }

  return entry.value;
}

function setCache(key, value) {
  memoryCache.set(key, {
    value,
    expiry: Date.now() + CACHE_TTL
  });
}

/**
 * Log de consumo
 */
async function logConsumption(data) {
  // TODO: Integrar com AIInteractionLog entity
  console.log('[CONSUMPTION LOG]', data);
}

/**
 * Funções stub - implementar conforme necessário
 */

async function generateSpinMessages(payload, model, options) {
  // TODO: Implementar chamada real
  return {
    data: { messages: [] },
    tokensUsed: 300,
    costEstimate: 0.006
  };
}

async function generateProposal(payload, model, options) {
  // TODO: Implementar chamada real
  return {
    data: { proposal: '' },
    tokensUsed: 500,
    costEstimate: 0.01
  };
}

async function investigateClinic(payload, model, options) {
  // TODO: Implementar chamada real
  return {
    data: { analysis: {} },
    tokensUsed: 800,
    costEstimate: 0.016
  };
}

async function predictScore(payload, model, options) {
  // TODO: Implementar chamada real
  return {
    data: { score: 0 },
    tokensUsed: 200,
    costEstimate: 0.004
  };
}
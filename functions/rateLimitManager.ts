// Rate Limit Manager - Gerencia requisições à IA para evitar rate limits
class RateLimitManager {
  constructor(requestsPerMinute = 10, burstSize = 3) {
    this.requestsPerMinute = requestsPerMinute;
    this.burstSize = burstSize;
    this.queue = [];
    this.activeRequests = 0;
    this.lastRequestTime = 0;
    this.minDelayBetweenRequests = (60000 / requestsPerMinute);
  }

  async execute(fn, priority = 'normal') {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject, priority });
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.queue.length === 0 || this.activeRequests >= this.burstSize) {
      return;
    }

    // Sort by priority (high priority first)
    this.queue.sort((a, b) => {
      const priorityMap = { high: 0, normal: 1, low: 2 };
      return priorityMap[a.priority] - priorityMap[b.priority];
    });

    const task = this.queue.shift();
    this.activeRequests++;

    // Respeitar delay mínimo entre requisições
    const timeSinceLastRequest = Date.now() - this.lastRequestTime;
    if (timeSinceLastRequest < this.minDelayBetweenRequests) {
      await new Promise(resolve => 
        setTimeout(resolve, this.minDelayBetweenRequests - timeSinceLastRequest)
      );
    }

    try {
      this.lastRequestTime = Date.now();
      const result = await task.fn();
      task.resolve(result);
    } catch (error) {
      // Se rate limit, voltar para fila com delay exponencial
      if (error.message?.includes('rate limit')) {
        this.queue.unshift(task);
        await new Promise(resolve => setTimeout(resolve, 2000)); // 2s de backoff
      } else {
        task.reject(error);
      }
    } finally {
      this.activeRequests--;
      this.processQueue();
    }
  }
}

export const rateLimitManager = new RateLimitManager(10, 2);

export async function executeWithRateLimit(fn, priority = 'normal') {
  return rateLimitManager.execute(fn, priority);
}
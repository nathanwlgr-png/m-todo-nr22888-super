import { useEffect } from 'react';
import { toast } from 'sonner';

/**
 * Interceptor global para capturar erros não tratados
 */
export default function GlobalErrorInterceptor() {
  useEffect(() => {
    const handleError = (event) => {
      const error = event.error || event.reason;
      const message = error?.message || '';

      // Erro de rate limit - aguardar e notificar
      if (message.includes('Rate limit exceeded') || message.includes('Too many requests')) {
        event.preventDefault();
        console.warn('Rate limit atingido, aguardando...');
        
        toast.warning('Muitas requisições', {
          description: 'Aguarde alguns segundos e tente novamente',
          duration: 5000
        });
        return;
      }

      // Erro de entidade não encontrada - redireciona silenciosamente
      if (message.includes('not found') && message.includes('Entity')) {
        event.preventDefault();
        console.warn('Entidade não encontrada interceptada:', message);
        
        // Redirecionar para home após 500ms
        setTimeout(() => {
          if (window.location.pathname !== '/') {
            window.location.href = '/';
          }
        }, 500);
        return;
      }

      // Erro de rede - mostrar toast
      if (message.includes('Network Error')) {
        event.preventDefault();
        toast.error('Erro de conexão', {
          description: 'Verifique sua internet'
        });
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleError);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleError);
    };
  }, []);

  return null;
}
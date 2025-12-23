import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function SystemHealthChecker() {
  const [checkCount, setCheckCount] = useState(0);
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    const runHealthCheck = async () => {
      const foundErrors = [];

      try {
        // CHECK 1: Verificar se base44 está disponível
        if (!base44 || !base44.entities) {
          foundErrors.push('Base44 SDK não carregado corretamente');
        }

        // CHECK 2: Verificar localStorage
        try {
          localStorage.setItem('health_check', 'test');
          localStorage.removeItem('health_check');
        } catch (error) {
          foundErrors.push('LocalStorage com problemas');
        }

        // CHECK 3: Verificar reconhecimento de voz
        if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
          foundErrors.push('Reconhecimento de voz não suportado neste navegador');
        }

        // CHECK 4: Verificar geolocalização
        if (!navigator.geolocation) {
          foundErrors.push('Geolocalização não suportada');
        }

        // CHECK 5: Verificar crypto API
        if (!window.crypto || !window.crypto.getRandomValues) {
          foundErrors.push('Crypto API não disponível');
        }

        // CHECK 6: Verificar entidades principais
        try {
          await base44.entities.Client.list('-updated_date', 1);
        } catch (error) {
          foundErrors.push('Erro ao acessar entidade Client');
        }

        setErrors(foundErrors);
        setCheckCount(prev => prev + 1);

        if (foundErrors.length > 0) {
          console.warn('🔧 Health Check - Problemas encontrados:', foundErrors);
        } else {
          console.log('✅ Health Check #' + (checkCount + 1) + ' - Sistema OK');
        }

      } catch (error) {
        console.error('Erro no Health Check:', error);
      }
    };

    // Roda 3 vezes com intervalo de 5 segundos
    const intervals = [0, 5000, 10000];
    const timeouts = intervals.map(delay => 
      setTimeout(runHealthCheck, delay)
    );

    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  // Não renderiza nada visualmente (apenas logs)
  return null;
}
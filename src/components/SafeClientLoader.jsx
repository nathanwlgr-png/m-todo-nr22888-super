import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

/**
 * HOC para proteger componentes de IDs inválidos
 */
export function useSafeClientId(clientId) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!clientId || clientId.length < 20 || clientId === 'undefined' || clientId === 'null') {
      navigate(createPageUrl('Home'));
    }
  }, [clientId, navigate]);

  return clientId && clientId.length >= 20 && clientId !== 'undefined' && clientId !== 'null';
}

export default useSafeClientId;
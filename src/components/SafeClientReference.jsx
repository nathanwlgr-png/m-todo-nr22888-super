import React from 'react';
import { useSafeEntity } from './SafeDataFetcher';

/**
 * Componente seguro para renderizar referências a clientes
 * Previne erros quando o cliente foi deletado
 */
export default function SafeClientReference({ clientId, children, fallback = <span className="text-slate-400">Cliente removido</span> }) {
  const { data: client, isLoading } = useSafeEntity('Client', clientId);

  if (isLoading) {
    return <span className="text-slate-400">Carregando...</span>;
  }

  if (!client) {
    return fallback;
  }

  return typeof children === 'function' ? children(client) : children;
}

/**
 * Hook para validar e buscar cliente com segurança
 */
export function useSafeClient(clientId) {
  return useSafeEntity('Client', clientId);
}
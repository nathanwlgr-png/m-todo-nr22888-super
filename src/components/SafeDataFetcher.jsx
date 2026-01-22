import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

/**
 * Validador e filtro robusto de dados
 */
export const validateClient = (client) => {
  return (
    client &&
    typeof client === 'object' &&
    client.id &&
    client.id.length > 15 &&
    !client.is_deleted &&
    client.first_name
  );
};

export const validateEntity = (entity) => {
  return (
    entity &&
    typeof entity === 'object' &&
    entity.id &&
    entity.id.length > 15 &&
    !entity.is_deleted
  );
};

/**
 * Hook seguro para buscar clientes
 */
export function useSafeClients(options = {}) {
  return useQuery({
    queryKey: ['safe-clients', options],
    queryFn: async () => {
      try {
        const data = await base44.entities.Client.list();
        return (data || []).filter(validateClient);
      } catch (error) {
        console.warn('Erro ao buscar clientes:', error);
        return [];
      }
    },
    retry: 2,
    retryDelay: 1000,
    staleTime: 30000,
    ...options
  });
}

/**
 * Hook seguro para buscar uma entidade específica
 */
export function useSafeEntity(entityName, entityId, options = {}) {
  return useQuery({
    queryKey: ['safe-entity', entityName, entityId],
    queryFn: async () => {
      if (!entityId || entityId === 'undefined' || entityId.length < 15) {
        throw new Error('ID inválido');
      }
      
      try {
        const data = await base44.entities[entityName].get(entityId);
        if (!validateEntity(data)) {
          throw new Error('Entidade inválida ou deletada');
        }
        return data;
      } catch (error) {
        console.warn(`Erro ao buscar ${entityName}:`, error);
        throw error;
      }
    },
    enabled: !!entityId && entityId !== 'undefined' && entityId.length > 15,
    retry: 1,
    ...options
  });
}

/**
 * Hook seguro para buscar lista de qualquer entidade
 */
export function useSafeEntityList(entityName, options = {}) {
  return useQuery({
    queryKey: ['safe-entity-list', entityName, options],
    queryFn: async () => {
      try {
        const data = await base44.entities[entityName].list();
        return (data || []).filter(validateEntity);
      } catch (error) {
        console.warn(`Erro ao buscar ${entityName}:`, error);
        return [];
      }
    },
    retry: 2,
    retryDelay: 1000,
    staleTime: 30000,
    ...options
  });
}

/**
 * Componente que renderiza apenas se o ID for válido
 */
export function SafeRender({ entityId, fallback = null, children }) {
  if (!entityId || entityId === 'undefined' || entityId.length < 15) {
    return fallback;
  }
  return children;
}

export default {
  useSafeClients,
  useSafeEntity,
  useSafeEntityList,
  validateClient,
  validateEntity,
  SafeRender
};
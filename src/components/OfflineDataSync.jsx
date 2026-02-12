import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const EDIT_QUEUE_KEY = 'nr22_edit_queue';

/**
 * Sistema de fila de edições offline
 * Salva edições localmente e sincroniza quando online
 */
export function useOfflineEdits() {
  const [pendingEdits, setPendingEdits] = useState([]);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadQueue();
    
    const handleOnline = () => {
      toast.info('🌐 Conexão restaurada - sincronizando edições...');
      syncPendingEdits();
    };
    
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  const loadQueue = () => {
    try {
      const queue = localStorage.getItem(EDIT_QUEUE_KEY);
      if (queue) {
        setPendingEdits(JSON.parse(queue));
      }
    } catch (error) {
      console.error('Erro ao carregar fila:', error);
    }
  };

  const addToQueue = (entityName, entityId, updateData, clientName) => {
    const edit = {
      id: Date.now() + Math.random(),
      entityName,
      entityId,
      updateData,
      clientName,
      timestamp: new Date().toISOString(),
      synced: false
    };

    const newQueue = [...pendingEdits, edit];
    setPendingEdits(newQueue);
    localStorage.setItem(EDIT_QUEUE_KEY, JSON.stringify(newQueue));
    
    toast.info(`📝 Edição salva offline: ${clientName || 'Cliente'}`);
    
    return edit;
  };

  const syncPendingEdits = async () => {
    if (pendingEdits.length === 0 || !navigator.onLine) return;
    
    setSyncing(true);
    let successCount = 0;
    let failedEdits = [];

    try {
      for (const edit of pendingEdits) {
        if (edit.synced) continue;
        
        try {
          await base44.entities[edit.entityName].update(edit.entityId, edit.updateData);
          edit.synced = true;
          successCount++;
        } catch (error) {
          console.error('Erro ao sincronizar edit:', error);
          failedEdits.push(edit);
        }
      }

      const remaining = pendingEdits.filter(e => !e.synced);
      setPendingEdits(remaining);
      localStorage.setItem(EDIT_QUEUE_KEY, JSON.stringify(remaining));

      if (successCount > 0) {
        toast.success(`✅ ${successCount} edições sincronizadas!`);
      }
      
      if (failedEdits.length > 0) {
        toast.warning(`⚠️ ${failedEdits.length} edições falharam`);
      }
    } finally {
      setSyncing(false);
    }
  };

  const clearQueue = () => {
    setPendingEdits([]);
    localStorage.removeItem(EDIT_QUEUE_KEY);
    toast.success('Fila de edições limpa');
  };

  return {
    pendingEdits,
    addToQueue,
    syncPendingEdits,
    clearQueue,
    syncing,
    hasPendingEdits: pendingEdits.length > 0
  };
}

/**
 * Hook para edição offline de cliente
 */
export function useOfflineClientEdit() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const { addToQueue } = useOfflineEdits();

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const updateClient = async (clientId, updateData, clientName) => {
    if (isOffline) {
      // Atualizar cache local
      try {
        const cacheKey = 'nr22_offline_clients';
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const data = JSON.parse(cached);
          const clientIndex = data.clients.findIndex(c => c.id === clientId);
          if (clientIndex !== -1) {
            data.clients[clientIndex] = { ...data.clients[clientIndex], ...updateData };
            localStorage.setItem(cacheKey, JSON.stringify(data));
          }
        }
      } catch (error) {
        console.error('Erro ao atualizar cache:', error);
      }

      // Adicionar à fila
      addToQueue('Client', clientId, updateData, clientName);
      return { offline: true };
    } else {
      // Online - atualizar normalmente
      return await base44.entities.Client.update(clientId, updateData);
    }
  };

  return {
    isOffline,
    updateClient
  };
}
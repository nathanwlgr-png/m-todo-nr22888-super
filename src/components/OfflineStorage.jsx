import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Upload, Wifi, WifiOff, Loader2, CheckCircle2, Database } from 'lucide-react';
import { toast } from 'sonner';

export default function OfflineStorage() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [offlineData, setOfflineData] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Internet conectada! Sincronizando...');
      autoSync();
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('Modo offline ativado');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Carregar dados offline ao montar
    loadOfflineData();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadOfflineData = () => {
    try {
      const stored = localStorage.getItem('venda_nr_offline_data');
      if (stored) {
        const data = JSON.parse(stored);
        setOfflineData(data);
        setLastSync(data.last_sync ? new Date(data.last_sync) : null);
      }
    } catch (error) {
      console.error('Erro ao carregar dados offline:', error);
    }
  };

  const downloadForOffline = async () => {
    setSyncing(true);
    try {
      toast.info('Baixando dados para modo offline...');

      // Buscar TODOS os dados essenciais
      const [clients, campaigns, equipmentMaterials, sales, visits, tasks] = await Promise.all([
        base44.entities.Client.list('-updated_date', 500),
        base44.entities.Campaign.list('-created_date', 100),
        base44.entities.EquipmentMaterial.list('-created_date', 100),
        base44.entities.Sale.list('-sale_date', 200),
        base44.entities.Visit.list('-scheduled_date', 300),
        base44.entities.Task.list('-created_date', 300)
      ]);

      // Compactar dados (apenas essenciais)
      const compactedClients = clients.map(c => ({
        id: c.id,
        name: c.first_name,
        clinic: c.clinic_name,
        city: c.city,
        phone: c.phone,
        status: c.status,
        score: c.purchase_score,
        profile: c.behavioral_profile,
        tone: c.client_tone,
        needs: c.lab_needs,
        budget: c.available_budget,
        notes: c.notes?.substring(0, 200) // Limitar notas
      }));

      const compactedCampaigns = campaigns.map(camp => ({
        id: camp.id,
        name: camp.name,
        equipment: camp.equipment_focus,
        status: camp.status,
        content: camp.automated_content,
        targets: camp.target_clients
      }));

      const compactedMaterials = equipmentMaterials.map(eq => ({
        name: eq.equipment_name,
        summary: eq.summary,
        benefits: eq.benefits,
        catchphrases: eq.catchphrases?.slice(0, 3),
        whatsapp: eq.whatsapp_templates?.[0]
      }));

      const offlinePackage = {
        clients: compactedClients,
        campaigns: compactedCampaigns,
        materials: compactedMaterials,
        sales_summary: {
          total: sales.filter(s => s.status === 'fechada').length,
          revenue: sales.reduce((sum, s) => sum + (s.sale_value || 0), 0)
        },
        visits_upcoming: visits.filter(v => v.status === 'agendada').map(v => ({
          client: v.client_name,
          date: v.scheduled_date,
          type: v.visit_type
        })),
        tasks_pending: tasks.filter(t => t.status === 'pendente').map(t => ({
          client: t.client_name,
          title: t.title,
          due: t.due_date,
          priority: t.priority
        })),
        last_sync: new Date().toISOString(),
        version: '1.0'
      };

      // Salvar no localStorage
      localStorage.setItem('venda_nr_offline_data', JSON.stringify(offlinePackage));
      
      setOfflineData(offlinePackage);
      setLastSync(new Date());
      
      toast.success(`✅ ${compactedClients.length} clientes baixados para offline!`);

    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao baixar dados');
    } finally {
      setSyncing(false);
    }
  };

  const autoSync = async () => {
    if (!isOnline) return;
    await downloadForOffline();
  };

  const exportToJSON = () => {
    if (!offlineData) return;
    
    const blob = new Blob([JSON.stringify(offlineData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `venda-nr-offline-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    toast.success('Arquivo baixado! Guarde no celular.');
  };

  return (
    <Card className="p-5 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur">
          {isOnline ? <Wifi className="w-6 h-6 text-green-300" /> : <WifiOff className="w-6 h-6 text-red-300" />}
        </div>
        <div className="flex-1">
          <h3 className="font-bold">📦 Modo Offline</h3>
          <p className="text-xs text-blue-200">Trabalhe sem internet na estrada</p>
        </div>
        <Badge className={isOnline ? 'bg-green-500' : 'bg-red-500'}>
          {isOnline ? 'Online' : 'Offline'}
        </Badge>
      </div>

      {/* Status */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="p-3 bg-white/10 rounded-lg backdrop-blur">
          <p className="text-xs text-blue-200 mb-1">Última Sincronização</p>
          <p className="font-semibold text-sm">
            {lastSync ? lastSync.toLocaleString('pt-BR', { 
              day: '2-digit', 
              month: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            }) : 'Nunca'}
          </p>
        </div>
        <div className="p-3 bg-white/10 rounded-lg backdrop-blur">
          <p className="text-xs text-blue-200 mb-1">Dados Salvos</p>
          <p className="font-semibold text-sm">
            {offlineData ? `${offlineData.clients?.length || 0} clientes` : 'Nenhum'}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-2">
        <Button
          onClick={downloadForOffline}
          disabled={syncing || !isOnline}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          {syncing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Baixando...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Baixar Tudo para Offline
            </>
          )}
        </Button>

        {offlineData && (
          <Button
            onClick={exportToJSON}
            variant="outline"
            className="w-full border-white/30 hover:bg-white/10"
          >
            <Database className="w-4 h-4 mr-2" />
            Exportar Arquivo (.json)
          </Button>
        )}
      </div>

      {/* Conteúdo Offline */}
      {offlineData && (
        <div className="mt-4 p-3 bg-white/10 rounded-lg backdrop-blur">
          <p className="text-xs text-blue-200 mb-2">📂 Disponível Offline:</p>
          <div className="space-y-1 text-xs">
            <p>✓ {offlineData.clients?.length} Clientes completos</p>
            <p>✓ {offlineData.campaigns?.length} Campanhas ativas</p>
            <p>✓ {offlineData.materials?.length} Materiais de vendas</p>
            <p>✓ {offlineData.visits_upcoming?.length} Visitas agendadas</p>
            <p>✓ {offlineData.tasks_pending?.length} Tarefas pendentes</p>
          </div>
        </div>
      )}
    </Card>
  );
}
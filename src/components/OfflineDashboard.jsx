import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useOfflineSync } from '@/components/hooks/useOfflineSync';
import { base44 } from '@/api/base44Client';
import {
  WifiOff, Wifi, RefreshCw, Users, TrendingUp, CheckSquare,
  DollarSign, Search, Building2, Phone, MapPin, AlertTriangle,
  Calendar, Zap, Clock, Target, Database
} from 'lucide-react';
import { toast } from 'sonner';

export default function OfflineDashboard() {
  const { isOnline, isSyncing, lastSyncTime, offlineStats, syncFullSnapshot, loadOfflineSnapshot, isSnapshotStale } = useOfflineSync();
  const [snapshot, setSnapshot] = useState(null);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [syncing, setSyncing] = useState(false);

  // Carregar snapshot local ao montar
  useEffect(() => {
    const local = loadOfflineSnapshot();
    if (local) setSnapshot(local);
  }, []);

  // Ouvir atualizações de snapshot
  useEffect(() => {
    const handler = () => {
      const local = loadOfflineSnapshot();
      if (local) setSnapshot(local);
    };
    window.addEventListener('offline-snapshot-updated', handler);
    return () => window.removeEventListener('offline-snapshot-updated', handler);
  }, []);

  const handleSync = async () => {
    if (!isOnline) { toast.error('Sem conexão. Conecte-se à internet.'); return; }
    setSyncing(true);
    toast.info('Sincronizando dados completos...');
    const result = await syncFullSnapshot();
    if (result.success) {
      toast.success(`Sync completo! ${result.clients_synced} clientes, ${result.sales_synced} vendas`);
      const local = loadOfflineSnapshot();
      if (local) setSnapshot(local);
    } else {
      toast.error('Erro no sync: ' + (result.error || 'tente novamente'));
    }
    setSyncing(false);
  };

  const stats = snapshot?.stats || offlineStats;
  const clients = snapshot?.clients || [];
  const sales = snapshot?.sales || [];
  const tasks = snapshot?.tasks || [];
  const attention = snapshot?.attention || {};

  // Filtro de busca
  const filteredClients = clients.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.first_name?.toLowerCase().includes(q) ||
      c.clinic_name?.toLowerCase().includes(q) ||
      c.city?.toLowerCase().includes(q) ||
      c.phone?.includes(q) ||
      c.equipment_interest?.toLowerCase().includes(q) ||
      c.status?.toLowerCase().includes(q) ||
      c.pipeline_stage?.toLowerCase().includes(q)
    );
  });

  const tabs = [
    { id: 'dashboard', label: '📊 Dashboard' },
    { id: 'clients', label: '👥 Clientes' },
    { id: 'sales', label: '💰 Vendas' },
    { id: 'tasks', label: '✅ Tarefas' },
    { id: 'alerts', label: '🚨 Alertas' },
  ];

  return (
    <div className="space-y-4">
      {/* Header Status */}
      <Card className={`${isOnline ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'}`}>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3">
              {isOnline
                ? <Wifi className="w-5 h-5 text-green-600" />
                : <WifiOff className="w-5 h-5 text-orange-600" />}
              <div>
                <p className={`font-semibold text-sm ${isOnline ? 'text-green-800' : 'text-orange-800'}`}>
                  {isOnline ? 'Online' : 'Modo Offline'}
                </p>
                <p className="text-xs text-slate-500">
                  {lastSyncTime
                    ? `Último sync: ${lastSyncTime.toLocaleString('pt-BR')}`
                    : 'Nenhum sync realizado'}
                  {isSnapshotStale() && lastSyncTime && (
                    <span className="text-orange-500 ml-2">⚠️ Dados desatualizados</span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {snapshot && (
                <Badge variant="outline" className="text-xs">
                  <Database className="w-3 h-3 mr-1" />
                  {clients.length} clientes em cache
                </Badge>
              )}
              <Button
                size="sm"
                onClick={handleSync}
                disabled={!isOnline || syncing || isSyncing}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <RefreshCw className={`w-4 h-4 mr-1 ${(syncing || isSyncing) ? 'animate-spin' : ''}`} />
                {syncing || isSyncing ? 'Sincronizando...' : 'Sincronizar Agora'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && stats && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Clientes', value: stats.total_clients, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
              { label: 'Quentes', value: stats.hot_clients, icon: Target, color: 'text-red-600', bg: 'bg-red-50' },
              { label: 'Vendas', value: stats.closed_sales, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
              { label: 'Tarefas', value: stats.pending_tasks, icon: CheckSquare, color: 'text-orange-600', bg: 'bg-orange-50' },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <Card key={label} className={bg}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-600">{label}</p>
                      <p className={`text-2xl font-bold ${color}`}>{value}</p>
                    </div>
                    <Icon className={`w-6 h-6 ${color}`} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Pipeline</CardTitle></CardHeader>
            <CardContent>
              <div className="flex gap-2 flex-wrap">
                {Object.entries(stats.pipeline || {}).map(([stage, count]) => (
                  <div key={stage} className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded">
                    <span className="text-xs text-slate-500 capitalize">{stage}</span>
                    <Badge className="text-xs h-4">{count}</Badge>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                <span className="text-sm font-semibold">Receita mensal: R$ {(stats.monthly_revenue || 0).toLocaleString('pt-BR')}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Clients Tab */}
      {activeTab === 'clients' && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Buscar por nome, clínica, cidade, status, equipamento..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <p className="text-xs text-slate-500">{filteredClients.length} clientes encontrados</p>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {filteredClients.slice(0, 100).map(c => (
              <Card key={c.id} className="hover:bg-slate-50">
                <CardContent className="pt-3 pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">{c.first_name} {c.full_name ? `(${c.full_name})` : ''}</span>
                        <Badge className={c.status === 'quente' ? 'bg-red-500' : c.status === 'morno' ? 'bg-yellow-500' : 'bg-slate-400'}>
                          {c.status}
                        </Badge>
                        {c.pipeline_stage && (
                          <Badge variant="outline" className="text-xs">{c.pipeline_stage}</Badge>
                        )}
                      </div>
                      {c.clinic_name && (
                        <div className="flex items-center gap-1 mt-0.5 text-xs text-slate-600">
                          <Building2 className="w-3 h-3" />{c.clinic_name}
                        </div>
                      )}
                      <div className="flex gap-3 mt-0.5 text-xs text-slate-500 flex-wrap">
                        {c.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{c.city}</span>}
                        {c.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{c.phone}</span>}
                        {c.purchase_score > 0 && <span className="text-indigo-600">Score: {c.purchase_score}%</span>}
                      </div>
                      {/* Histórico de vendas inline */}
                      {c._sales?.length > 0 && (
                        <div className="mt-1 text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded">
                          💰 {c._sales.length} venda(s) · R$ {c._total_revenue?.toLocaleString('pt-BR')}
                          {c._last_sale && ` · Último: ${c._last_sale.equipment_name}`}
                        </div>
                      )}
                      {c._tasks?.length > 0 && (
                        <div className="mt-0.5 text-xs text-orange-700">
                          ✅ {c._tasks.length} tarefa(s) pendente(s)
                        </div>
                      )}
                    </div>
                    {c.phone && (
                      <a href={`https://wa.me/${c.phone}`} target="_blank" rel="noreferrer" className="shrink-0">
                        <Button size="sm" variant="outline" className="h-7 text-xs border-green-300 text-green-700">
                          WhatsApp
                        </Button>
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Sales Tab */}
      {activeTab === 'sales' && (
        <div className="space-y-2 max-h-[70vh] overflow-y-auto">
          {sales.length === 0 ? (
            <p className="text-center text-slate-500 py-8">Nenhuma venda em cache. Faça um sync.</p>
          ) : sales.slice(0, 100).map(s => (
            <Card key={s.id}>
              <CardContent className="pt-3 pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">{s.client_name}</p>
                    <p className="text-xs text-slate-600">{s.equipment_name}</p>
                    <p className="text-xs text-slate-500">{s.sale_date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">R$ {(s.sale_value || 0).toLocaleString('pt-BR')}</p>
                    <Badge className={s.status === 'fechada' ? 'bg-green-500 text-xs' : 'bg-yellow-500 text-xs'}>
                      {s.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Tasks Tab */}
      {activeTab === 'tasks' && (
        <div className="space-y-2 max-h-[70vh] overflow-y-auto">
          {tasks.length === 0 ? (
            <p className="text-center text-slate-500 py-8">Nenhuma tarefa pendente.</p>
          ) : tasks.slice(0, 100).map(t => (
            <Card key={t.id} className={t.priority === 'alta' ? 'border-red-200' : ''}>
              <CardContent className="pt-3 pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">{t.title}</p>
                    <p className="text-xs text-slate-600">{t.client_name}</p>
                    {t.due_date && (
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />{t.due_date}
                      </p>
                    )}
                  </div>
                  <Badge className={t.priority === 'alta' ? 'bg-red-500' : t.priority === 'media' ? 'bg-yellow-500' : 'bg-slate-400'}>
                    {t.priority}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Alerts Tab */}
      {activeTab === 'alerts' && (
        <div className="space-y-3">
          {attention.overdue_tasks?.length > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-red-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> Tarefas Atrasadas ({attention.overdue_tasks.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {attention.overdue_tasks.slice(0, 5).map(t => (
                  <p key={t.id} className="text-xs text-red-700">• {t.title} - {t.client_name} ({t.due_date})</p>
                ))}
              </CardContent>
            </Card>
          )}
          {attention.cold_no_contact?.length > 0 && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-blue-800 flex items-center gap-2">
                  <Zap className="w-4 h-4" /> Clientes Frios sem Contato ({attention.cold_no_contact.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {attention.cold_no_contact.slice(0, 5).map(c => (
                  <p key={c.id} className="text-xs text-blue-700">• {c.first_name} {c.clinic_name ? `- ${c.clinic_name}` : ''} ({c.city})</p>
                ))}
              </CardContent>
            </Card>
          )}
          {attention.birthdays_today?.length > 0 && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-yellow-800 flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Aniversários Hoje
                </CardTitle>
              </CardHeader>
              <CardContent>
                {attention.birthdays_today.map(c => (
                  <p key={c.id} className="text-xs text-yellow-700">🎂 {c.first_name} - {c.clinic_name}</p>
                ))}
              </CardContent>
            </Card>
          )}
          {!attention.overdue_tasks?.length && !attention.cold_no_contact?.length && !attention.birthdays_today?.length && (
            <div className="text-center py-8 text-slate-500">
              <Zap className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-sm">Nenhum alerta no momento.</p>
              {!snapshot && <p className="text-xs mt-1">Faça um sync para ver os alertas.</p>}
            </div>
          )}
        </div>
      )}

      {/* No snapshot warning */}
      {!snapshot && !stats && (
        <Card className="border-dashed border-slate-300">
          <CardContent className="pt-6 text-center">
            <Database className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            <p className="text-sm font-medium text-slate-600">Nenhum dado offline disponível</p>
            <p className="text-xs text-slate-400 mt-1">Clique em "Sincronizar Agora" para baixar os dados</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
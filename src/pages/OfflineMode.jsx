/**
 * OfflineMode — Painel completo de modo offline
 * - Lista clientes, leads e tarefas do IndexedDB
 * - Botão de sincronização manual
 * - Status do PWA e Service Worker
 */
import { useState, useEffect } from 'react';
import { WifiOff, Users, Target, CheckSquare, Calendar, ShoppingCart, RefreshCw, Database, CloudDownload, CheckCircle2, AlertTriangle, Smartphone } from 'lucide-react';
import { OfflineManager, OFFLINE_ENTITIES } from '@/lib/OfflineManager';
import OfflineSyncButton from '@/components/OfflineSyncButton';
import { AICache } from '@/lib/AICache';

const ENTITY_ICONS = {
  Client: Users,
  Lead: Target,
  Task: CheckSquare,
  Visit: Calendar,
  Sale: ShoppingCart,
  Equipment: Database,
  ConsumableOrder: RefreshCw,
};

const ENTITY_LABELS = {
  Client: 'Clientes',
  Lead: 'Leads',
  Task: 'Tarefas',
  Visit: 'Visitas',
  Sale: 'Vendas',
  Equipment: 'Equipamentos',
  ConsumableOrder: 'Pedidos',
};

export default function OfflineModePage() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('clients');
  const [records, setRecords] = useState([]);
  const [pwaInstalled, setPwaInstalled] = useState(false);
  const [swActive, setSwActive] = useState(false);
  const [aiCaches, setAiCaches] = useState([]);

  useEffect(() => {
    loadStatus();
    checkPWA();
    setAiCaches(AICache.listAll());
  }, []);

  const loadStatus = async () => {
    setLoading(true);
    const s = await OfflineManager.getOfflineStatus();
    setStatus(s);
    setLoading(false);
  };

  const checkPWA = () => {
    setPwaInstalled(window.matchMedia('(display-mode: standalone)').matches);
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(reg => {
        setSwActive(!!(reg && reg.active));
      });
    }
  };

  const loadEntity = async (entity) => {
    setActiveTab(entity.toLowerCase());
    const data = await OfflineManager.listEntities(entity);
    setRecords(data);
  };

  const tabs = ['Client', 'Lead', 'Task'];

  return (
    <div className="min-h-screen p-4 pb-28" style={{ background: '#0a0a0a' }}>
      <div className="max-w-2xl mx-auto space-y-4">

        {/* Header */}
        <div className="flex items-center gap-3 pt-2">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,107,0,0.15)' }}>
            <WifiOff className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">Modo Offline</h1>
            <p className="text-xs text-slate-500">Dados locais · Sem internet necessária</p>
          </div>
        </div>

        {/* PWA Status */}
        <div className="rounded-2xl p-4 space-y-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="text-xs font-black text-slate-400 uppercase tracking-wide mb-3">Status do Sistema</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'App Instalado (PWA)', ok: pwaInstalled },
              { label: 'Service Worker', ok: swActive },
              { label: 'IndexedDB', ok: true },
              { label: 'IA sob demanda', ok: true },
            ].map(({ label, ok }) => (
              <div key={label} className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
                {ok ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" /> : <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 shrink-0" />}
                <span className="text-[11px] text-slate-300">{label}</span>
              </div>
            ))}
          </div>
          {!pwaInstalled && (
            <div className="mt-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(255,107,0,0.08)', border: '1px solid rgba(255,107,0,0.2)' }}>
              <p className="text-[11px] text-orange-300">
                <span className="font-black">Para instalar:</span> Abra no Chrome → Menu ⋮ → "Instalar aplicativo" ou "Adicionar à tela inicial"
              </p>
            </div>
          )}
        </div>

        {/* Sync Button */}
        <OfflineSyncButton />

        {/* Contagens */}
        {status && (
          <div className="grid grid-cols-3 gap-2">
            {OFFLINE_ENTITIES.map(entity => {
              const Icon = ENTITY_ICONS[entity];
              const count = status.counts[entity] || 0;
              return (
                <button
                  key={entity}
                  onClick={() => loadEntity(entity)}
                  className="rounded-xl p-3 text-left transition-all"
                  style={{
                    background: activeTab === entity.toLowerCase() ? 'rgba(255,107,0,0.15)' : 'rgba(255,255,255,0.04)',
                    border: activeTab === entity.toLowerCase() ? '1px solid rgba(255,107,0,0.4)' : '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <Icon className="w-4 h-4 mb-1" style={{ color: count > 0 ? '#ff9500' : '#444' }} />
                  <p className="text-xs font-black" style={{ color: count > 0 ? '#fff' : '#555' }}>{count}</p>
                  <p className="text-[10px] text-slate-500">{ENTITY_LABELS[entity]}</p>
                </button>
              );
            })}
          </div>
        )}

        {/* Lista de registros da entidade selecionada */}
        {records.length > 0 && (
          <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="px-4 py-3 flex items-center justify-between" style={{ background: 'rgba(255,107,0,0.08)' }}>
              <p className="text-xs font-black text-orange-400">{records.length} registros offline</p>
              <span className="text-[10px] text-slate-500">leitura somente</span>
            </div>
            <div className="max-h-64 overflow-y-auto divide-y" style={{ divideColor: 'rgba(255,255,255,0.04)' }}>
              {records.slice(0, 50).map((r, i) => (
                <div key={r.id || i} className="px-4 py-2.5">
                  <p className="text-sm font-bold text-white truncate">
                    {r.full_name || r.first_name || r.clinic_name || r.title || r.client_name || r.name || `Registro ${i + 1}`}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {r.city || r.status || r.phone || ''}
                    {r._cached_at && ` · Cached: ${new Date(r._cached_at).toLocaleDateString('pt-BR')}`}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cache de IA */}
        {aiCaches.length > 0 && (
          <div className="rounded-2xl p-4 space-y-2" style={{ background: 'rgba(120,80,255,0.06)', border: '1px solid rgba(120,80,255,0.2)' }}>
            <p className="text-xs font-black text-purple-400 uppercase tracking-wide">Cache de IA</p>
            {aiCaches.map(c => (
              <div key={c.key} className="flex items-center justify-between">
                <span className="text-[11px] text-slate-300">{c.type}</span>
                <span className="text-[10px] text-purple-400 font-bold">{c.days_left}d restantes</span>
              </div>
            ))}
            <button
              onClick={() => { AICache.clearAll(); setAiCaches([]); }}
              className="text-[10px] text-red-400 underline mt-1"
            >
              Limpar todos os caches
            </button>
          </div>
        )}

        {/* Última sync */}
        {status?.lastSync && (
          <p className="text-[10px] text-slate-600 text-center">
            Última sincronização: {new Date(status.lastSync).toLocaleString('pt-BR')}
          </p>
        )}
      </div>
    </div>
  );
}
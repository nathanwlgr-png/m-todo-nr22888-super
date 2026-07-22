import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, ChevronRight, ShieldCheck, Briefcase, Zap } from 'lucide-react';
import { getModo, setModo, VENDEDOR_PAGES } from '@/lib/ModoVendedor';

// Categorias Admin — ordenadas pelo FLUXO COMERCIAL. Apenas rotas VERIFICADAS no App.jsx (zero 404)
const ADMIN_CATEGORIES = [
  {
    label: '1. ⚡ Meu Dia',
    pages: [
      { page: 'Clients', label: '👥 Clientes' },
      { page: 'MapaSeamatyBrasil', label: '📍 Mapa de Clientes' },
      { page: 'SmartRouteOptimizer', label: '🗺️ Rota do Dia' },
      { page: 'VisitManager', label: '📋 Visitas' },
      { page: 'TasksUnified', label: '✅ Tarefas' },
      { page: 'ScheduledAgenda', label: '📅 Agenda' },
    ],
  },
  {
    label: '2. 🔍 Investigar',
    pages: [
      { page: 'ModoInvestigativoSupremo', label: '🕵️ Análise de Cliente' },
      { page: 'ModoCacaComercial', label: '🎯 Prospecção' },
      { page: 'PainelConcorrencia', label: '🧭 Concorrentes' },
      { page: 'InvestigacaoDeCampoReal', label: '🔎 Campo Real' },
    ],
  },
  {
    label: '3. 💬 Abordar',
    pages: [
      { page: 'GenerateWhatsAppIntegrated', label: '⚡ Gerar SPIN' },
      { page: 'MessageApproval', label: '✅ Aprovar Mensagens' },
      { page: 'WhatsAppHub', label: '💬 WhatsApp Hub' },
    ],
  },
  {
    label: '4. 🏁 Fechar',
    pages: [
      { page: 'ProposalGenerator', label: '📄 Gerar Proposta' },
      { page: 'ModoInsumos', label: '📦 Recorrência de Insumos' },
      { page: 'EquipmentConsumables', label: '📦 Estoque de Insumos' },
      { page: 'SalesFunnel', label: '🏁 Funil & Fechamento' },
    ],
  },
  {
    label: '5. 📊 Análise',
    pages: [
      { page: 'RankingAndConsumables', label: '🏆 Ranking & Insumos' },
      { page: 'SalesFunnelKanban', label: '📊 Funil Kanban' },
      { page: 'ExecutiveSalesAnalysis', label: '📈 Análise Executiva' },
      { page: 'CentralIAMaster', label: '🧠 Central IA' },
      { page: 'Reports', label: '📊 Central de Relatórios' },
    ],
  },
  {
    label: '6. ⚙️ Sistema',
    pages: [
      { page: 'GlobalSearch', label: '🔍 Busca Global' },
      { page: 'OfflineMode', label: '📴 Modo Offline' },
      { page: 'NotificationSettings', label: '🔔 Notificações' },
      { page: 'Integrations', label: '🔗 Integrações' },
      { page: 'ArquivoMasterConsulta', label: '🗄️ Arquivo Master / Consulta (legado)' },
    ],
  },
  {
    label: '7. 🛠️ Ferramentas Avançadas (uso consciente)',
    pages: [
      { page: 'DeepHunter', label: '🎯 Deep Hunter' },
      { page: 'SeamatyHunter', label: '📡 Seamaty Hunter' },
      { page: 'InvestigacaoDeCampoReal', label: '🔎 Investigação de Campo Real' },
      { page: 'CompetitiveIntelligenceDashboard', label: '🧭 Inteligência Competitiva' },
      { page: 'MarketingAIStudio', label: '🎨 Marketing IA' },
      { page: 'MobVendedorSecureImport', label: '📥 Importação Mob Vendedor' },
      { page: 'EquipmentCatalog', label: '🔬 Catálogo Seamaty' },
      { page: 'DuplicateManager', label: '🧹 Duplicados' },
    ],
  },
];

const VENDEDOR_CATEGORY_ICONS = {};

export default function VendedorMenu({ isOpen, onClose }) {
  const [modo, setModoState] = useState(getModo());

  useEffect(() => {
    setModoState(getModo());
  }, [isOpen]);

  const toggleModo = () => {
    const novo = modo === 'vendedor' ? 'admin' : 'vendedor';
    setModo(novo);
    setModoState(novo);
  };

  if (!isOpen) return null;

  const grouped = VENDEDOR_PAGES.reduce((acc, p) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-[100] flex">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div
        className="relative w-[85vw] max-w-sm h-full flex flex-col overflow-hidden"
        style={{ background: '#0d0d0d', borderRight: '1px solid rgba(255,107,0,0.2)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 shrink-0"
          style={{ borderBottom: '1px solid rgba(255,107,0,0.15)' }}>
          <div>
            <p className="text-sm font-black text-orange-400">Painel Comercial</p>
            <p className="text-[10px] text-slate-500">SEAMATY Brasil • Modo consulta/arquivo</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleModo}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-black transition-all"
              style={{
                background: modo === 'vendedor' ? 'rgba(255,107,0,0.15)' : 'rgba(139,92,246,0.15)',
                border: `1px solid ${modo === 'vendedor' ? 'rgba(255,107,0,0.4)' : 'rgba(139,92,246,0.4)'}`,
                color: modo === 'vendedor' ? '#ff9500' : '#a78bfa',
              }}
            >
              {modo === 'vendedor'
                ? <Briefcase className="w-3 h-3" />
                : <ShieldCheck className="w-3 h-3" />}
              {modo === 'vendedor' ? 'Vendedor' : 'Admin'}
            </button>
            <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.06)' }}>
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Nav scroll */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          {modo === 'vendedor' ? (
            Object.entries(grouped).map(([cat, pages]) => (
              <div key={cat}>
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1.5 px-1">{cat}</p>
                <div className="space-y-1">
                  {pages.map(({ page, label }) => (
                    <Link key={page} to={`/${page}`} onClick={onClose}>
                      <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:opacity-80 transition-opacity"
                        style={{ background: 'rgba(255,255,255,0.04)' }}>
                        <Zap className="w-4 h-4 text-orange-400 shrink-0" />
                        <span className="text-sm font-bold text-white">{label}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-600 ml-auto" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))
          ) : (
            ADMIN_CATEGORIES.map(({ label, pages }) => (
              <div key={label}>
                <p className="text-[10px] font-black text-purple-500 uppercase tracking-widest mb-1.5 px-1">{label}</p>
                <div className="space-y-1">
                  {pages.map(({ page, label: lbl }) => (
                    <Link key={page} to={`/${page}`} onClick={onClose}>
                      <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:opacity-80 transition-opacity"
                        style={{ background: 'rgba(139,92,246,0.05)' }}>
                        <Zap className="w-4 h-4 text-purple-400 shrink-0" />
                        <span className="text-sm font-bold text-slate-200">{lbl}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-600 ml-auto" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 shrink-0" style={{ borderTop: '1px solid rgba(255,107,0,0.1)' }}>
          <p className="text-[10px] text-slate-600 text-center">
            {modo === 'vendedor' ? '🔥 Modo Vendedor' : '🛡️ Modo Admin — acesso total'}
          </p>
        </div>
      </div>
    </div>
  );
}
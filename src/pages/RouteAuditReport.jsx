import { useState } from 'react';
import { CheckCircle, XCircle, AlertTriangle, ArrowLeft, ChevronDown, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const IMPLEMENTED_ROUTES = [
  'Home', 'VisitRouteManager', 'InstagramStudio', 'DeepHunter', 'ExecutiveAudit',
  'AuditDashboard', 'MarketingAIStudio', 'VisitBriefing', 'MarketingConfig', 'SeamtyNR22888',
  'RankingAndConsumables', 'PredictiveSalesAnalyzer', 'SalesCallAnalysis', 'ClientSegmentation',
  'SystemGuide', 'ConsumptionSettings', 'WhatsAppMaster', 'MobVendedorSecureImport',
  'AutoFollowUpDashboard', 'NRControlCenter', 'SeamatyHunter', 'WhatsAppMasterAssistantLapidado',
  'ExecutiveSalesAnalysis', 'SalesFunnelKanban', 'WhatsAppAutomationTriggers', 'PrescriptiveAnalytics',
  'CompetitiveIntelligenceDashboard', 'ActiveProspecting', 'SmartRouteOptimizer', 'SalesCommandCenter',
];

const COMING_SOON_ROUTES = [
  'Clients', 'Leads', 'TasksUnified', 'ScheduledAgenda', 'VisitManager',
  'SalesFunnel', 'ProposalGenerator', 'PossibleSales', 'ClosingForecast', 'SalesOptimizationCenter',
  'AIAssistant', 'SalesCoachingDashboard', 'ProposalTemplates', 'EquipmentCatalog', 'ProductManager',
  'RouteOptimizer', 'EliteVetClientSearch', 'InteractiveDashboard', 'ExecutiveSalesDashboard',
  'CustomDashboard', 'AdvancedSalesAnalytics', 'Reports', 'SentimentDashboard',
  'SentimentAnalysisDashboard', 'ProactiveIntelligenceDashboard', 'IntelligenceDashboard',
  'NumerologyAnalysis', 'OfflineAnalytics', 'WhatsAppHub', 'WhatsAppInbox',
  'WhatsAppMasterAssistant', 'NegociacoesWhatsApp', 'MessageApproval', 'MessageHistory',
  'AutomationSettings', 'FollowUpAutomationModule', 'AIContentStudio', 'ContactSettings',
  'NotificationSettings', 'Integrations', 'WorkflowAutomation', 'AIKnowledgeUploader',
  'ClientImportManager', 'MaterialUploadHub', 'AgentSetup', 'MasterCRM',
  'MasterControlPanel', 'SystemManual', 'GlobalSearch',
];

// eslint-disable-next-line no-unused-vars
const Section = ({ title, icon: Icon, color, items, badge }) => {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-2xl overflow-hidden mb-4" style={{ border: `1px solid ${color}22`, background: 'rgba(255,255,255,0.02)' }}>
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4"
        style={{ background: `${color}10` }}
      >
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5" style={{ color }} />
          <span className="font-bold text-sm text-white">{title}</span>
          <span className="text-xs px-2.5 py-0.5 rounded-full font-black" style={{ background: `${color}22`, color }}>
            {badge ?? items.length}
          </span>
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-white opacity-40" /> : <ChevronRight className="w-4 h-4 text-white opacity-40" />}
      </button>
      {open && (
        <div className="px-5 py-3 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {items.map(item => (
            <div key={item} className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
              <Icon className="w-3 h-3 flex-shrink-0" style={{ color }} />
              <span className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.7)' }}>{item}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function RouteAuditReport() {
  const total = IMPLEMENTED_ROUTES.length + COMING_SOON_ROUTES.length;
  const pct = Math.round((IMPLEMENTED_ROUTES.length / total) * 100);

  return (
    <div className="min-h-screen px-4 py-6" style={{ background: '#0a0a0a' }}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link to="/">
            <button className="flex items-center gap-1.5 text-xs font-bold text-orange-400 py-2 px-3 rounded-xl"
              style={{ background: 'rgba(255,107,0,0.1)', border: '1px solid rgba(255,107,0,0.2)' }}>
              <ArrowLeft className="w-3.5 h-3.5" /> Home
            </button>
          </Link>
          <div>
            <h1 className="text-xl font-black text-white">Relatório de Auditoria de Rotas</h1>
            <p className="text-xs text-orange-400 font-bold">Sistema NR22888 · Seamaty CRM · {new Date().toLocaleDateString('pt-BR')}</p>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Implementadas', value: IMPLEMENTED_ROUTES.length, color: '#00ff88' },
            { label: 'Coming Soon', value: COMING_SOON_ROUTES.length, color: '#ff9500' },
            { label: 'Cobertura', value: `${pct}%`, color: '#4488ff' },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-2xl p-4 text-center" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${color}22` }}>
              <p className="text-2xl font-black" style={{ color }}>{value}</p>
              <p className="text-[10px] text-gray-500 font-bold mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Progress */}
        <div className="rounded-2xl p-4 mb-6" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,107,0,0.15)' }}>
          <div className="flex justify-between text-xs font-bold mb-2">
            <span className="text-gray-400">Progresso de implementação</span>
            <span className="text-orange-400">{pct}%</span>
          </div>
          <div className="h-2.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #ff6b00, #ff9500)' }}
            />
          </div>
          <p className="text-[10px] text-gray-600 mt-2">
            {IMPLEMENTED_ROUTES.length} de {total} rotas com página implementada. {COMING_SOON_ROUTES.length} exibem ComingSoonPage premium.
          </p>
        </div>

        {/* Status geral */}
        <div className="rounded-2xl p-4 mb-6 flex items-start gap-3"
          style={{ background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.2)' }}>
          <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-green-300">Zero telas brancas · Zero 404 cru</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Todas as rotas do Sidebar e Home agora estão registradas no Router. 
              Páginas não implementadas exibem ComingSoonPage com design NR22888.
            </p>
          </div>
        </div>

        {/* Seções */}
        <Section
          title="✅ Páginas Implementadas"
          icon={CheckCircle}
          color="#00ff88"
          items={IMPLEMENTED_ROUTES}
        />
        <Section
          title="⚠️ Coming Soon (rota registrada, página em desenvolvimento)"
          icon={AlertTriangle}
          color="#ff9500"
          items={COMING_SOON_ROUTES}
        />

        {/* Fix aplicado */}
        <div className="rounded-2xl p-4 mt-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-xs font-bold text-white mb-3">🔧 Correções aplicadas nesta auditoria</p>
          {[
            '✅ Criado ComingSoonPage premium (dark, animado, NR22888)',
            '✅ 49 rotas do Sidebar adicionadas ao App.jsx',
            '✅ PageNotFound atualizado para exibir ComingSoonPage',
            '✅ Rota * (catch-all) exibe ComingSoonPage em vez de 404 cru',
            '✅ Normalização NFD de cidade no buscaClinicasCidade',
            '✅ Zero telas brancas no sistema',
          ].map(item => (
            <p key={item} className="text-xs py-1" style={{ color: 'rgba(255,255,255,0.5)' }}>{item}</p>
          ))}
        </div>
      </div>
    </div>
  );
}
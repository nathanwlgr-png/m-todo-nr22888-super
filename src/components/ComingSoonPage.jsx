import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Clock, Zap, Star } from 'lucide-react';
import { useEffect, useState } from 'react';

// Mapa de nomes legíveis por página
const PAGE_LABELS = {
  Clients: 'Clientes',
  Leads: 'Leads',
  TasksUnified: 'Tarefas',
  ScheduledAgenda: 'Agenda',
  VisitManager: 'Visitas',
  SalesFunnel: 'Funil de Vendas',
  ProposalGenerator: 'Gerador de Propostas',
  PossibleSales: 'Possíveis Vendas',
  ClosingForecast: 'Previsão de Fechamento',
  SalesOptimizationCenter: 'Otimização de Vendas',
  AIAssistant: 'Assistente IA Vendas',
  SalesCoachingDashboard: 'Coaching IA',
  ProposalTemplates: 'Templates de Proposta',
  EquipmentCatalog: 'Catálogo de Equipamentos',
  ProductManager: 'Gestão de Produtos',
  RouteOptimizer: 'Otimizador de Rotas',
  EliteVetClientSearch: 'Busca Elite Vet',
  InteractiveDashboard: 'Dashboard Interativo',
  ExecutiveSalesDashboard: 'Dashboard Executivo',
  CustomDashboard: 'Analytics Geral',
  AdvancedSalesAnalytics: 'Analytics Avançado',
  Reports: 'Relatórios',
  SentimentDashboard: 'Dashboard Sentimento',
  SentimentAnalysisDashboard: 'Análise de Sentimento',
  ProactiveIntelligenceDashboard: 'Inteligência 360°',
  IntelligenceDashboard: 'Dashboard IA',
  NumerologyAnalysis: 'Análise Numerológica',
  OfflineAnalytics: 'Analytics Offline',
  WhatsAppHub: 'WhatsApp Hub',
  WhatsAppInbox: 'WhatsApp Inbox',
  WhatsAppMasterAssistant: 'WhatsApp Master Assistant',
  NegociacoesWhatsApp: 'Negociações + Cobrança',
  MessageApproval: 'Aprovação de Mensagens',
  MessageHistory: 'Histórico de Mensagens',
  AutomationSettings: 'Automação de Mensagens',
  FollowUpAutomationModule: 'Follow-up Automático',
  AIContentStudio: 'Conteúdo IA Studio',
  ContactSettings: 'Configurações de Contato',
  NotificationSettings: 'Notificações',
  Integrations: 'Integrações',
  WorkflowAutomation: 'Automação de Workflows',
  AIKnowledgeUploader: 'Base de Conhecimento IA',
  ClientImportManager: 'Importar Clientes',
  MaterialUploadHub: 'Envio de Materiais',
  AgentSetup: 'Configuração de Agentes',
  MasterCRM: 'Master CRM NR22',
  MasterControlPanel: 'Painel Master NR22888',
  SystemManual: 'Manual do Sistema',
  GlobalSearch: 'Busca Global',
};

export default function ComingSoonPage({ moduleName }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [dots, setDots] = useState('');
  const [pulse, setPulse] = useState(false);

  // Deriva o nome do módulo a partir da URL se não passado como prop
  const rawPage = moduleName || location.pathname.replace('/', '');
  const label = PAGE_LABELS[rawPage] || rawPage || 'Módulo';

  useEffect(() => {
    const t = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setPulse(true), 300);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 py-12"
      style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #111111 50%, #0d0d0d 100%)' }}
    >
      {/* Partículas de fundo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full opacity-10"
            style={{
              width: `${Math.random() * 4 + 1}px`,
              height: `${Math.random() * 4 + 1}px`,
              background: '#ff6b00',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animation: `float ${3 + Math.random() * 4}s ease-in-out infinite alternate`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      <div
        className="relative z-10 w-full max-w-md text-center"
        style={{
          opacity: pulse ? 1 : 0,
          transform: pulse ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Ícone central */}
        <div className="flex justify-center mb-8">
          <div
            className="w-24 h-24 rounded-3xl flex items-center justify-center relative"
            style={{
              background: 'linear-gradient(135deg, rgba(255,107,0,0.15), rgba(255,107,0,0.05))',
              border: '1px solid rgba(255,107,0,0.3)',
              boxShadow: '0 0 40px rgba(255,107,0,0.1), inset 0 0 20px rgba(255,107,0,0.05)',
            }}
          >
            <Zap className="w-10 h-10 text-orange-500" style={{ filter: 'drop-shadow(0 0 8px rgba(255,107,0,0.6))' }} />
            {/* Badge pulsante */}
            <div
              className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #ff6b00, #ff9500)', boxShadow: '0 0 12px rgba(255,107,0,0.5)' }}
            >
              <Clock className="w-3.5 h-3.5 text-white" />
            </div>
          </div>
        </div>

        {/* Status badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6"
          style={{ background: 'rgba(255,107,0,0.1)', border: '1px solid rgba(255,107,0,0.25)' }}>
          <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
          <span className="text-xs font-bold text-orange-400 tracking-widest uppercase">Em Desenvolvimento</span>
        </div>

        {/* Nome do módulo */}
        <h1
          className="text-3xl font-black mb-3 leading-tight"
          style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #ff9500 60%, #ff6b00 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {label}
        </h1>

        <p className="text-sm mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Este módulo está sendo construído{dots}
        </p>
        <p className="text-xs mb-10" style={{ color: 'rgba(255,107,0,0.5)' }}>
          Sistema NR22888 · Seamaty CRM
        </p>

        {/* Info card */}
        <div
          className="rounded-2xl p-5 mb-8 text-left"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,107,0,0.12)',
          }}
        >
          <div className="flex items-start gap-3">
            <Star className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold text-orange-300 mb-1">Em breve disponível</p>
              <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Nosso time está desenvolvendo este módulo com alta prioridade.
                Você será notificado quando estiver pronto.
              </p>
            </div>
          </div>
        </div>

        {/* Botão voltar */}
        <button
          onClick={() => navigate('/')}
          className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-95"
          style={{
            background: 'linear-gradient(135deg, rgba(255,107,0,0.2), rgba(255,107,0,0.1))',
            border: '1px solid rgba(255,107,0,0.35)',
            color: '#ff9500',
            boxShadow: '0 4px 20px rgba(255,107,0,0.1)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,107,0,0.3), rgba(255,107,0,0.15))';
            e.currentTarget.style.boxShadow = '0 4px 24px rgba(255,107,0,0.25)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255,107,0,0.2), rgba(255,107,0,0.1))';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(255,107,0,0.1)';
          }}
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao Dashboard
        </button>
      </div>

      <style>{`
        @keyframes float {
          from { transform: translateY(0px) rotate(0deg); }
          to   { transform: translateY(-20px) rotate(180deg); }
        }
      `}</style>
    </div>
  );
}
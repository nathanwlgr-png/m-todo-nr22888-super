import React, { lazy as reactLazy, Suspense, useEffect } from 'react';

const recoverFromStaleBuild = async () => {
  const KEY = 'nr22888_stale_build_recovered';
  if (sessionStorage.getItem(KEY)) return false;
  sessionStorage.setItem(KEY, '1');
  try {
    if ('caches' in window) {
      const names = await caches.keys();
      await Promise.all(names.map((name) => caches.delete(name)));
    }
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.update()));
    }
  } catch (_) {
    // recuperação silenciosa para cache antigo do PWA
  }
  window.location.reload();
  return true;
};

// Recupera automaticamente de chunk antigo/estale (PWA no tablet cacheia agressivo).
// Se um módulo dinâmico falhar ao carregar, limpa cache e recarrega UMA vez para buscar o build novo.
const lazy = (importer) =>
  reactLazy(() =>
    importer().catch(async (err) => {
      const recovered = await recoverFromStaleBuild();
      if (recovered) return new Promise(() => {}); // segura o render até o reload
      throw err;
    })
  );
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import PWAInstallButtonFloating from '@/components/PWAInstallButtonFloating';
import OfflineIndicator from '@/components/OfflineIndicator';
import OfflineBanner from '@/components/OfflineBanner';
import AppLoadingScreen from '@/components/AppLoadingScreen';
import { Toaster as ToasterComponent } from '@/components/ui/toaster';
import Layout from '@/components/AppLayout';
import TabletAppLayout from '@/components/TabletAppLayout';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useTabletOptimizations } from '@/hooks/useTabletOptimizations';
import { AIGlobalProvider } from '@/lib/AIGlobalContext';

// Páginas carregadas imediatamente (acesso crítico)

// Páginas com lazy loading
const VisitRouteManager = lazy(() => import('./pages/VisitRouteManager'));
const InstagramStudio = lazy(() => import('./pages/InstagramStudio'));
const DeepHunter = lazy(() => import('./pages/DeepHunter'));
const ExecutiveAudit = lazy(() => import('./pages/ExecutiveAudit'));
const AuditDashboard = lazy(() => import('./pages/AuditDashboard'));
const MarketingAIStudio = lazy(() => import('./pages/MarketingAIStudio'));
const VisitBriefing = lazy(() => import('./pages/VisitBriefing'));
const MarketingConfig = lazy(() => import('./pages/MarketingConfig'));
const SeamtyNR22888 = lazy(() => import('./pages/SeamtyNR22888'));
const RankingAndConsumables = lazy(() => import('./pages/RankingAndConsumables'));
const PredictiveSalesAnalyzer = lazy(() => import('./pages/PredictiveSalesAnalyzer'));
const SalesCallAnalysis = lazy(() => import('./pages/SalesCallAnalysis'));
const ClientSegmentation = lazy(() => import('./pages/ClientSegmentation'));
const SystemGuide = lazy(() => import('./pages/SystemGuide'));
const ConsumptionSettings = lazy(() => import('./pages/ConsumptionSettings'));
const WhatsAppMaster = lazy(() => import('./pages/WhatsAppMaster'));
const MobVendedorSecureImport = lazy(() => import('./pages/MobVendedorSecureImport'));
const AutoFollowUpDashboard = lazy(() => import('./pages/AutoFollowUpDashboard'));
const NRControlCenter = lazy(() => import('./pages/NRControlCenter'));
const SeamatyHunter = lazy(() => import('./pages/SeamatyHunter'));
const WhatsAppMasterAssistantLapidado = lazy(() => import('./pages/WhatsAppMasterAssistantLapidado'));
const ExecutiveSalesAnalysis = lazy(() => import('./pages/ExecutiveSalesAnalysis'));
const SalesFunnelKanban = lazy(() => import('./pages/SalesFunnelKanban'));
const WhatsAppAutomationTriggers = lazy(() => import('./pages/WhatsAppAutomationTriggers'));
const NewClient = lazy(() => import('./pages/NewClient'));
const NewCampaign = lazy(() => import('./pages/NewCampaign'));
const CampaignDetails = lazy(() => import('./pages/CampaignDetails'));
const ModoCacaComercial = lazy(() => import('./pages/ModoCacaComercial'));
const ModoInsumos = lazy(() => import('./pages/ModoInsumos'));
const PrescriptiveAnalytics = lazy(() => import('./pages/PrescriptiveAnalytics'));
const CompetitiveIntelligenceDashboard = lazy(() => import('./pages/CompetitiveIntelligenceDashboard'));
const ActiveProspecting = lazy(() => import('./pages/ActiveProspecting'));
const SmartRouteOptimizer = lazy(() => import('./pages/SmartRouteOptimizer'));
const OfflineModePage = lazy(() => import('./pages/OfflineMode'));
const SalesCommandCenter = lazy(() => import('./pages/SalesCommandCenter'));
const RouteAuditReport = lazy(() => import('./pages/RouteAuditReport'));
const CentralIAMaster = lazy(() => import('./pages/CentralIAMaster'));
const ModoInvestigativoSupremo = lazy(() => import('./pages/ModoInvestigativoSupremo'));
const DashboardSniper = lazy(() => import('./pages/DashboardSniper'));
const HojeModoRuaNR22888 = lazy(() => import('./pages/HojeModoRuaNR22888'));
const DebugCaca = lazy(() => import('./pages/DebugCaca'));
const RelatorioRicardo = lazy(() => import('./pages/RelatorioRicardo'));
const Reports = lazy(() => import('./pages/Reports'));
const AracatubaClinics = lazy(() => import('./pages/AracatubaClinics'));
const MessageApproval = lazy(() => import('./pages/MessageApproval'));
const EquipmentConsumables = lazy(() => import('./pages/EquipmentConsumables'));
const DocumentTracking = lazy(() => import('./pages/DocumentTracking'));
const PreVisitChecklist = lazy(() => import('./pages/PreVisitChecklist'));
const PostVisitAnalysis = lazy(() => import('./pages/PostVisitAnalysis'));
const AgendaMensal = lazy(() => import('./pages/AgendaMensal'));
const WeeklyReportSettings = lazy(() => import('./pages/WeeklyReportSettings'));
const RankingOportunidades = lazy(() => import('./pages/RankingOportunidades'));
const TesteAgentes = lazy(() => import('./pages/TesteAgentes'));
const VozCampo = lazy(() => import('./pages/VozCampo'));
const PainelConcorrencia = lazy(() => import('./pages/PainelConcorrencia'));
const CatalogoCliente = lazy(() => import('./pages/CatalogoCliente'));

// ── PÁGINAS REAIS — conectadas definitivamente ──
const Clients = lazy(() => import('./pages/Clients'));
const Leads = lazy(() => import('./pages/Leads'));
const LeadsDashboard = lazy(() => import('./pages/LeadsDashboard'));
const CaptureLeads = lazy(() => import('./pages/CaptureLeads'));
const ImportLeads = lazy(() => import('./pages/ImportLeads'));
const LeadProfile = lazy(() => import('./pages/LeadProfile'));
const ScoreElite = lazy(() => import('./pages/ScoreElite.jsx'));
const TasksUnified = lazy(() => import('./pages/TasksUnified'));
const ScheduledAgenda = lazy(() => import('./pages/ScheduledAgenda'));
const VisitManager = lazy(() => import('./pages/VisitManager'));
const SalesFunnel = lazy(() => import('./pages/SalesFunnel'));
const ProposalGenerator = lazy(() => import('./pages/ProposalGenerator'));
const EquipmentCatalog = lazy(() => import('./pages/EquipmentCatalog'));
const ProductManager = lazy(() => import('./pages/ProductManager'));
const RouteOptimizer = lazy(() => import('./pages/RouteOptimizer'));
const WhatsAppHub = lazy(() => import('./pages/WhatsAppHub'));
const WhatsAppInbox = lazy(() => import('./pages/WhatsAppInbox'));
const AutomationSettings = lazy(() => import('./pages/AutomationSettings'));
const ContactSettings = lazy(() => import('./pages/ContactSettings'));
const NotificationSettings = lazy(() => import('./pages/NotificationSettings'));
const Integrations = lazy(() => import('./pages/Integrations'));
const SystemManual = lazy(() => import('./pages/SystemManual'));
const GlobalSearch = lazy(() => import('./pages/GlobalSearch'));
const GlobalCommandCenter = lazy(() => import('./pages/GlobalCommandCenter'));
const NotificationsCenter = lazy(() => import('./pages/NotificationsCenter'));
const PipelineView = lazy(() => import('./pages/PipelineView'));
const GenerateWhatsAppIntegrated = lazy(() => import('./pages/GenerateWhatsAppIntegrated'));
const InvestigacaoDeCampoReal = lazy(() => import('./pages/InvestigacaoDeCampoReal'));
const ClientProfile = lazy(() => import('./pages/ClientProfile.jsx'));
const DayFieldView = lazy(() => import('./pages/DayFieldView.jsx'));
const ExecutiveLayerCEO = lazy(() => import('./pages/ExecutiveLayerCEO.jsx'));
const ClientLocationMap = lazy(() => import('./pages/ClientLocationMap.jsx'));
const MapaSeamatyBrasil = lazy(() => import('./pages/MapaSeamatyBrasil.jsx'));
const ClienteDetalhe360 = lazy(() => import('./pages/ClienteDetalhe360.jsx'));
const ArquivoMasterConsulta = lazy(() => import('./pages/ArquivoMasterConsulta.jsx'));
const DuplicateManager = lazy(() => import('./pages/DuplicateManager.jsx'));


const PageLoader = () => <AppLoadingScreen />;

const LayoutWrapper = ({ children, currentPageName }) => {
  const { isTablet } = useTabletOptimizations();
  const LayoutComponent = isTablet ? TabletAppLayout : Layout;
  return <LayoutComponent currentPageName={currentPageName}>{children}</LayoutComponent>;
};

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const isPublicCatalog = window.location.pathname === '/CatalogoCliente';

  if (isPublicCatalog) {
    return <Suspense fallback={<PageLoader />}><Routes><Route path="/CatalogoCliente" element={<CatalogoCliente />} /></Routes></Suspense>;
  }

  if (isLoadingPublicSettings || isLoadingAuth) {
    return <AppLoadingScreen />;
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Suspense fallback={<PageLoader />}>
       <Routes>
         {/* ── HOME — Dashboard Sniper ── */}
         <Route path="/" element={<LayoutWrapper currentPageName="HojeModoRuaNR22888"><HojeModoRuaNR22888 /></LayoutWrapper>} />
         <Route path="/DashboardSniper" element={<LayoutWrapper currentPageName="DashboardSniper"><DashboardSniper /></LayoutWrapper>} />

        {/* ── MÓDULOS EXISTENTES (originais) ── */}
        <Route path="/VisitRouteManager" element={<LayoutWrapper currentPageName="VisitRouteManager"><VisitRouteManager /></LayoutWrapper>} />
        <Route path="/InstagramStudio" element={<LayoutWrapper currentPageName="InstagramStudio"><InstagramStudio /></LayoutWrapper>} />
        <Route path="/DeepHunter" element={<LayoutWrapper currentPageName="DeepHunter"><DeepHunter /></LayoutWrapper>} />
        <Route path="/ExecutiveAudit" element={<LayoutWrapper currentPageName="ExecutiveAudit"><ExecutiveAudit /></LayoutWrapper>} />
        <Route path="/AuditDashboard" element={<LayoutWrapper currentPageName="AuditDashboard"><AuditDashboard /></LayoutWrapper>} />
        <Route path="/MarketingAIStudio" element={<LayoutWrapper currentPageName="MarketingAIStudio"><MarketingAIStudio /></LayoutWrapper>} />
        <Route path="/VisitBriefing" element={<LayoutWrapper currentPageName="VisitBriefing"><VisitBriefing /></LayoutWrapper>} />
        <Route path="/MarketingConfig" element={<LayoutWrapper currentPageName="MarketingConfig"><MarketingConfig /></LayoutWrapper>} />
        <Route path="/SeamtyNR22888" element={<LayoutWrapper currentPageName="SeamtyNR22888"><SeamtyNR22888 /></LayoutWrapper>} />
        <Route path="/RankingAndConsumables" element={<LayoutWrapper currentPageName="RankingAndConsumables"><RankingAndConsumables /></LayoutWrapper>} />
        <Route path="/PredictiveSalesAnalyzer" element={<LayoutWrapper currentPageName="PredictiveSalesAnalyzer"><PredictiveSalesAnalyzer /></LayoutWrapper>} />
        <Route path="/SalesCallAnalysis" element={<LayoutWrapper currentPageName="SalesCallAnalysis"><SalesCallAnalysis /></LayoutWrapper>} />
        <Route path="/ClientSegmentation" element={<LayoutWrapper currentPageName="ClientSegmentation"><ClientSegmentation /></LayoutWrapper>} />
        <Route path="/SystemGuide" element={<LayoutWrapper currentPageName="SystemGuide"><SystemGuide /></LayoutWrapper>} />
        <Route path="/ConsumptionSettings" element={<LayoutWrapper currentPageName="ConsumptionSettings"><ConsumptionSettings /></LayoutWrapper>} />
        <Route path="/WhatsAppMaster" element={<LayoutWrapper currentPageName="WhatsAppMaster"><WhatsAppMaster /></LayoutWrapper>} />
        <Route path="/MobVendedorSecureImport" element={<LayoutWrapper currentPageName="MobVendedorSecureImport"><MobVendedorSecureImport /></LayoutWrapper>} />
        <Route path="/AutoFollowUpDashboard" element={<LayoutWrapper currentPageName="AutoFollowUpDashboard"><AutoFollowUpDashboard /></LayoutWrapper>} />
        <Route path="/NRControlCenter" element={<LayoutWrapper currentPageName="NRControlCenter"><NRControlCenter /></LayoutWrapper>} />
        <Route path="/SeamatyHunter" element={<LayoutWrapper currentPageName="SeamatyHunter"><SeamatyHunter /></LayoutWrapper>} />
        <Route path="/WhatsAppMasterAssistantLapidado" element={<LayoutWrapper currentPageName="WhatsAppMasterAssistantLapidado"><WhatsAppMasterAssistantLapidado /></LayoutWrapper>} />
        <Route path="/ExecutiveSalesAnalysis" element={<LayoutWrapper currentPageName="ExecutiveSalesAnalysis"><ExecutiveSalesAnalysis /></LayoutWrapper>} />
        <Route path="/SalesFunnelKanban" element={<LayoutWrapper currentPageName="SalesFunnelKanban"><SalesFunnelKanban /></LayoutWrapper>} />
        <Route path="/WhatsAppAutomationTriggers" element={<LayoutWrapper currentPageName="WhatsAppAutomationTriggers"><WhatsAppAutomationTriggers /></LayoutWrapper>} />
        <Route path="/NewClient" element={<LayoutWrapper currentPageName="NewClient"><NewClient /></LayoutWrapper>} />
        <Route path="/ClientRegistration" element={<LayoutWrapper currentPageName="NewClient"><NewClient /></LayoutWrapper>} />
        <Route path="/NewCampaign" element={<LayoutWrapper currentPageName="NewCampaign"><NewCampaign /></LayoutWrapper>} />
        <Route path="/CampaignBuilder" element={<LayoutWrapper currentPageName="NewCampaign"><NewCampaign /></LayoutWrapper>} />
        <Route path="/CampaignDetails" element={<LayoutWrapper currentPageName="CampaignDetails"><CampaignDetails /></LayoutWrapper>} />
        <Route path="/PrescriptiveAnalytics" element={<LayoutWrapper currentPageName="PrescriptiveAnalytics"><PrescriptiveAnalytics /></LayoutWrapper>} />
        <Route path="/CompetitiveIntelligenceDashboard" element={<LayoutWrapper currentPageName="CompetitiveIntelligenceDashboard"><CompetitiveIntelligenceDashboard /></LayoutWrapper>} />
        <Route path="/ActiveProspecting" element={<LayoutWrapper currentPageName="ActiveProspecting"><ActiveProspecting /></LayoutWrapper>} />
        <Route path="/SmartRouteOptimizer" element={<LayoutWrapper currentPageName="SmartRouteOptimizer"><SmartRouteOptimizer /></LayoutWrapper>} />
        <Route path="/SalesCommandCenter" element={<LayoutWrapper currentPageName="SalesCommandCenter"><SalesCommandCenter /></LayoutWrapper>} />
        <Route path="/RouteAuditReport" element={<LayoutWrapper currentPageName="RouteAuditReport"><RouteAuditReport /></LayoutWrapper>} />
        <Route path="/CentralIAMaster" element={<LayoutWrapper currentPageName="CentralIAMaster"><CentralIAMaster /></LayoutWrapper>} />
        <Route path="/ModoCacaComercial" element={<LayoutWrapper currentPageName="ModoCacaComercial"><ModoCacaComercial /></LayoutWrapper>} />
        <Route path="/ModoInsumos" element={<LayoutWrapper currentPageName="ModoInsumos"><ModoInsumos /></LayoutWrapper>} />
        <Route path="/OfflineMode" element={<LayoutWrapper currentPageName="OfflineMode"><OfflineModePage /></LayoutWrapper>} />
        <Route path="/offline" element={<LayoutWrapper currentPageName="OfflineMode"><OfflineModePage /></LayoutWrapper>} />

        {/* ── PÁGINAS REAIS CONECTADAS ── */}
        <Route path="/Clients" element={<LayoutWrapper currentPageName="Clients"><Clients /></LayoutWrapper>} />
        <Route path="/Leads" element={<LayoutWrapper currentPageName="Leads"><Leads /></LayoutWrapper>} />
        <Route path="/LeadsDashboard" element={<LayoutWrapper currentPageName="LeadsDashboard"><LeadsDashboard /></LayoutWrapper>} />
        <Route path="/CaptureLeads" element={<LayoutWrapper currentPageName="CaptureLeads"><CaptureLeads /></LayoutWrapper>} />
        <Route path="/ImportLeads" element={<LayoutWrapper currentPageName="ImportLeads"><ImportLeads /></LayoutWrapper>} />
        <Route path="/LeadProfile" element={<LayoutWrapper currentPageName="LeadProfile"><LeadProfile /></LayoutWrapper>} />
        <Route path="/ScoreElite" element={<LayoutWrapper currentPageName="ScoreElite"><ScoreElite /></LayoutWrapper>} />
        <Route path="/TasksUnified" element={<LayoutWrapper currentPageName="TasksUnified"><TasksUnified /></LayoutWrapper>} />
        <Route path="/ScheduledAgenda" element={<LayoutWrapper currentPageName="ScheduledAgenda"><ScheduledAgenda /></LayoutWrapper>} />
        <Route path="/VisitManager" element={<LayoutWrapper currentPageName="VisitManager"><VisitManager /></LayoutWrapper>} />
        <Route path="/SalesFunnel" element={<LayoutWrapper currentPageName="SalesFunnel"><SalesFunnel /></LayoutWrapper>} />
        <Route path="/ProposalGenerator" element={<LayoutWrapper currentPageName="ProposalGenerator"><ProposalGenerator /></LayoutWrapper>} />
        <Route path="/EquipmentCatalog" element={<LayoutWrapper currentPageName="EquipmentCatalog"><EquipmentCatalog /></LayoutWrapper>} />
        <Route path="/ProductManager" element={<LayoutWrapper currentPageName="ProductManager"><ProductManager /></LayoutWrapper>} />
        <Route path="/RouteOptimizer" element={<LayoutWrapper currentPageName="RouteOptimizer"><RouteOptimizer /></LayoutWrapper>} />
        <Route path="/WhatsAppHub" element={<LayoutWrapper currentPageName="WhatsAppHub"><WhatsAppHub /></LayoutWrapper>} />
        <Route path="/WhatsAppInbox" element={<LayoutWrapper currentPageName="WhatsAppInbox"><WhatsAppInbox /></LayoutWrapper>} />
        <Route path="/AutomationSettings" element={<LayoutWrapper currentPageName="AutomationSettings"><AutomationSettings /></LayoutWrapper>} />
        <Route path="/ContactSettings" element={<LayoutWrapper currentPageName="ContactSettings"><ContactSettings /></LayoutWrapper>} />
        <Route path="/NotificationSettings" element={<LayoutWrapper currentPageName="NotificationSettings"><NotificationSettings /></LayoutWrapper>} />
        <Route path="/Integrations" element={<LayoutWrapper currentPageName="Integrations"><Integrations /></LayoutWrapper>} />
        <Route path="/SystemManual" element={<LayoutWrapper currentPageName="SystemManual"><SystemManual /></LayoutWrapper>} />
        <Route path="/GlobalSearch" element={<LayoutWrapper currentPageName="GlobalSearch"><GlobalSearch /></LayoutWrapper>} />
        <Route path="/GlobalCommandCenter" element={<LayoutWrapper currentPageName="GlobalCommandCenter"><GlobalCommandCenter /></LayoutWrapper>} />
        <Route path="/NotificationsCenter" element={<LayoutWrapper currentPageName="NotificationsCenter"><NotificationsCenter /></LayoutWrapper>} />
        <Route path="/PipelineView" element={<LayoutWrapper currentPageName="PipelineView"><PipelineView /></LayoutWrapper>} />
        <Route path="/GenerateWhatsAppIntegrated" element={<LayoutWrapper currentPageName="GenerateWhatsAppIntegrated"><GenerateWhatsAppIntegrated /></LayoutWrapper>} />
        <Route path="/InvestigacaoDeCampoReal" element={<LayoutWrapper currentPageName="InvestigacaoDeCampoReal"><InvestigacaoDeCampoReal /></LayoutWrapper>} />
        <Route path="/ClientProfile" element={<LayoutWrapper currentPageName="ClientProfile"><ClientProfile /></LayoutWrapper>} />
        <Route path="/DayFieldView" element={<LayoutWrapper currentPageName="DayFieldView"><DayFieldView /></LayoutWrapper>} />
        <Route path="/ExecutiveLayerCEO" element={<LayoutWrapper currentPageName="ExecutiveLayerCEO"><ExecutiveLayerCEO /></LayoutWrapper>} />
        <Route path="/ClientLocationMap" element={<LayoutWrapper currentPageName="ClientLocationMap"><ClientLocationMap /></LayoutWrapper>} />
        <Route path="/MapaSeamatyBrasil" element={<LayoutWrapper currentPageName="MapaSeamatyBrasil"><MapaSeamatyBrasil /></LayoutWrapper>} />
        <Route path="/ClienteDetalhe360" element={<LayoutWrapper currentPageName="ClienteDetalhe360"><ClienteDetalhe360 /></LayoutWrapper>} />
        <Route path="/ArquivoMasterConsulta" element={<LayoutWrapper currentPageName="ArquivoMasterConsulta"><ArquivoMasterConsulta /></LayoutWrapper>} />
        <Route path="/DuplicateManager" element={<LayoutWrapper currentPageName="DuplicateManager"><DuplicateManager /></LayoutWrapper>} />
        <Route path="/debug-caca" element={<DebugCaca />} />
        <Route path="/RelatorioRicardo" element={<LayoutWrapper currentPageName="RelatorioRicardo"><RelatorioRicardo /></LayoutWrapper>} />
        <Route path="/AgendaMensal" element={<LayoutWrapper currentPageName="AgendaMensal"><AgendaMensal /></LayoutWrapper>} />
        <Route path="/WeeklyReportSettings" element={<LayoutWrapper currentPageName="WeeklyReportSettings"><WeeklyReportSettings /></LayoutWrapper>} />
        <Route path="/RankingOportunidades" element={<LayoutWrapper currentPageName="RankingOportunidades"><RankingOportunidades /></LayoutWrapper>} />
        <Route path="/TesteAgentes" element={<LayoutWrapper currentPageName="TesteAgentes"><TesteAgentes /></LayoutWrapper>} />
        <Route path="/VozCampo" element={<LayoutWrapper currentPageName="VozCampo"><VozCampo /></LayoutWrapper>} />
        <Route path="/PainelConcorrencia" element={<LayoutWrapper currentPageName="PainelConcorrencia"><PainelConcorrencia /></LayoutWrapper>} />
        <Route path="/AracatubaClinics" element={<LayoutWrapper currentPageName="AracatubaClinics"><AracatubaClinics /></LayoutWrapper>} />
        <Route path="/MessageApproval" element={<LayoutWrapper currentPageName="MessageApproval"><MessageApproval /></LayoutWrapper>} />
        <Route path="/EquipmentConsumables" element={<LayoutWrapper currentPageName="EquipmentConsumables"><EquipmentConsumables /></LayoutWrapper>} />
        <Route path="/DocumentTracking" element={<DocumentTracking />} />
        <Route path="/PreVisitChecklist" element={<LayoutWrapper currentPageName="PreVisitChecklist"><PreVisitChecklist /></LayoutWrapper>} />
        <Route path="/PostVisitAnalysis" element={<LayoutWrapper currentPageName="PostVisitAnalysis"><PostVisitAnalysis /></LayoutWrapper>} />

         {/* ── ROTAS LEGACY → Consolidadas ── */}
        <Route path="/PossibleSales" element={<Navigate to="/" replace />} />
        <Route path="/AIAssistant" element={<Navigate to="/CentralIAMaster" replace />} />
        <Route path="/ProposalTemplates" element={<Navigate to="/ProposalGenerator" replace />} />
        <Route path="/EliteVetClientSearch" element={<Navigate to="/ModoInvestigativoSupremo" replace />} />
        <Route path="/Reports" element={<LayoutWrapper currentPageName="Reports"><Reports /></LayoutWrapper>} />
        <Route path="/NumerologyAnalysis" element={<Navigate to="/CentralIAMaster" replace />} />
        <Route path="/WhatsAppMasterAssistant" element={<Navigate to="/WhatsAppHub" replace />} />
        <Route path="/FollowUpAutomationModule" element={<Navigate to="/AutoFollowUpDashboard" replace />} />
        <Route path="/AIContentStudio" element={<Navigate to="/CentralIAMaster" replace />} />
        <Route path="/AIKnowledgeUploader" element={<Navigate to="/CentralIAMaster" replace />} />
        <Route path="/ClientImportManager" element={<Navigate to="/Clients" replace />} />
        <Route path="/MasterCRM" element={<Navigate to="/Clients" replace />} />
        <Route path="/ProspeccaoSeamaty" element={<Navigate to="/Clients" replace />} />
        <Route path="/PipelineNegociacao" element={<Navigate to="/SalesFunnelKanban" replace />} />
        <Route path="/PropostaCliente" element={<Navigate to="/ProposalGenerator" replace />} />
        <Route path="/MaterialPersonalizadoSeamaty" element={<Navigate to="/ProposalGenerator" replace />} />
        <Route path="/FilaAprovacaoMensagem" element={<Navigate to="/MessageApproval" replace />} />
        <Route path="/InsumoRecorrencia" element={<Navigate to="/ModoInsumos" replace />} />
        <Route path="/EstoqueInsumo" element={<Navigate to="/EquipmentConsumables" replace />} />
        <Route path="/VisitaComercial" element={<Navigate to="/VisitManager" replace />} />
        <Route path="/PlanejamentoMensal" element={<Navigate to="/AgendaMensal" replace />} />
        <Route path="/PropostaEnvioTracking" element={<Navigate to="/DocumentTracking" replace />} />
        <Route path="/EventoPropostaTracking" element={<Navigate to="/DocumentTracking" replace />} />
        <Route path="/ResumoTrackingCliente" element={<Navigate to="/DocumentTracking" replace />} />

        {/* ── INTELIGÊNCIA DE CAMPO ── */}
        <Route path="/ModoInvestigativoSupremo" element={<LayoutWrapper currentPageName="ModoInvestigativoSupremo"><ModoInvestigativoSupremo /></LayoutWrapper>} />

        <Route path="*" element={<Navigate to="/SalesCommandCenter" replace />} />
      </Routes>
    </Suspense>
  );
};

// ── REBUILD TRIGGER: 2026-06-06T00:00 ──
function App() {
  useEffect(() => {
    const shouldRecover = (event) => {
      const message = String(event?.message || event?.reason?.message || event?.error?.message || '');
      return message.includes('Invalid or unexpected token') || message.includes('Failed to fetch dynamically imported module');
    };

    const handleRecoverableError = (event) => {
      if (shouldRecover(event)) recoverFromStaleBuild();
    };

    window.addEventListener('error', handleRecoverableError);
    window.addEventListener('unhandledrejection', handleRecoverableError);
    return () => {
      window.removeEventListener('error', handleRecoverableError);
      window.removeEventListener('unhandledrejection', handleRecoverableError);
    };
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClientInstance}>
        <AIGlobalProvider>
          <Router>
            <AuthProvider>
              <NavigationTracker />
              <OfflineIndicator />
              <OfflineBanner />
              <AuthenticatedApp />
              <PWAInstallPrompt />
              <PWAInstallButtonFloating />
            </AuthProvider>
          </Router>
        </AIGlobalProvider>
        <ToasterComponent />
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
import React, { lazy, Suspense } from 'react';
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
import HomePageWithLayout from '@/components/HomePageWithLayout';
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
const DebugCaca = lazy(() => import('./pages/DebugCaca'));
const RelatorioRicardo = lazy(() => import('./pages/RelatorioRicardo'));
const AgendaMensal = lazy(() => import('./pages/AgendaMensal'));
const WeeklyReportSettings = lazy(() => import('./pages/WeeklyReportSettings'));
const RankingOportunidades = lazy(() => import('./pages/RankingOportunidades'));

// ── PÁGINAS REAIS — conectadas definitivamente ──
const Clients = lazy(() => import('./pages/Clients'));
const Leads = lazy(() => import('./pages/Leads'));
const TasksUnified = lazy(() => import('./pages/TasksUnified'));
const ScheduledAgenda = lazy(() => import('./pages/ScheduledAgenda'));
const VisitManager = lazy(() => import('./pages/VisitManager'));
const SalesFunnel = lazy(() => import('./pages/SalesFunnel'));
const ProposalGenerator = lazy(() => import('./pages/ProposalGenerator'));
const EquipmentCatalog = lazy(() => import('./pages/EquipmentCatalog'));
const ProductManager = lazy(() => import('./pages/ProductManager'));
const RouteOptimization = lazy(() => import('./pages/RouteOptimization'));
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


const PageLoader = () => <AppLoadingScreen />;

const LayoutWrapper = ({ children, currentPageName }) => {
  const { isTablet } = useTabletOptimizations();
  const LayoutComponent = isTablet ? TabletAppLayout : Layout;
  return <LayoutComponent currentPageName={currentPageName}>{children}</LayoutComponent>;
};

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

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
         <Route path="/" element={<LayoutWrapper currentPageName="DashboardSniper"><DashboardSniper /></LayoutWrapper>} />

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
        <Route path="/debug-caca" element={<DebugCaca />} />
        <Route path="/RelatorioRicardo" element={<LayoutWrapper currentPageName="RelatorioRicardo"><RelatorioRicardo /></LayoutWrapper>} />
        <Route path="/AgendaMensal" element={<LayoutWrapper currentPageName="AgendaMensal"><AgendaMensal /></LayoutWrapper>} />
        <Route path="/WeeklyReportSettings" element={<LayoutWrapper currentPageName="WeeklyReportSettings"><WeeklyReportSettings /></LayoutWrapper>} />
        <Route path="/RankingOportunidades" element={<LayoutWrapper currentPageName="RankingOportunidades"><RankingOportunidades /></LayoutWrapper>} />

        {/* ── ROTAS LEGACY → Consolidadas ── */}
        <Route path="/PossibleSales" element={<Navigate to="/" replace />} />
        <Route path="/AIAssistant" element={<Navigate to="/CentralIAMaster" replace />} />
        <Route path="/ProposalTemplates" element={<Navigate to="/ProposalGenerator" replace />} />
        <Route path="/EliteVetClientSearch" element={<Navigate to="/ModoInvestigativoSupremo" replace />} />
        <Route path="/Reports" element={<Navigate to="/" replace />} />
        <Route path="/NumerologyAnalysis" element={<Navigate to="/CentralIAMaster" replace />} />
        <Route path="/WhatsAppMasterAssistant" element={<Navigate to="/WhatsAppHub" replace />} />
        <Route path="/FollowUpAutomationModule" element={<Navigate to="/AutoFollowUpDashboard" replace />} />
        <Route path="/AIContentStudio" element={<Navigate to="/CentralIAMaster" replace />} />
        <Route path="/AIKnowledgeUploader" element={<Navigate to="/CentralIAMaster" replace />} />
        <Route path="/ClientImportManager" element={<Navigate to="/Clients" replace />} />
        <Route path="/MasterCRM" element={<Navigate to="/Clients" replace />} />

        {/* ── INTELIGÊNCIA DE CAMPO ── */}
        <Route path="/ModoInvestigativoSupremo" element={<LayoutWrapper currentPageName="ModoInvestigativoSupremo"><ModoInvestigativoSupremo /></LayoutWrapper>} />

        <Route path="*" element={<Navigate to="/SalesCommandCenter" replace />} />
      </Routes>
    </Suspense>
  );
};

// ── REBUILD TRIGGER: 2026-06-06T00:00 ──
function App() {
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
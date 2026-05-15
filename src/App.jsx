import React, { lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
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
import ComingSoonPage from '@/components/ComingSoonPage';
import HomePageWithLayout from '@/components/HomePageWithLayout';
import { useTabletOptimizations } from '@/hooks/useTabletOptimizations';
import { AIGlobalProvider } from '@/lib/AIGlobalContext';

// Home carrega imediatamente (página principal)
import Home from './pages/Home';
import HomeTablet from './pages/HomeTablet';

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
const PrescriptiveAnalytics = lazy(() => import('./pages/PrescriptiveAnalytics'));
const CompetitiveIntelligenceDashboard = lazy(() => import('./pages/CompetitiveIntelligenceDashboard'));
const ActiveProspecting = lazy(() => import('./pages/ActiveProspecting'));
const SmartRouteOptimizer = lazy(() => import('./pages/SmartRouteOptimizer'));
const OfflineModePage = lazy(() => import('./pages/OfflineMode'));
const SalesCommandCenter = lazy(() => import('./pages/SalesCommandCenter'));
const RouteAuditReport = lazy(() => import('./pages/RouteAuditReport'));
const CentralIAMaster = lazy(() => import('./pages/CentralIAMaster'));

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
        {/* ── HOME ── */}
        <Route path="/" element={<HomePageWithLayout />} />

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
        <Route path="/OfflineMode" element={<LayoutWrapper currentPageName="OfflineMode"><OfflineModePage /></LayoutWrapper>} />
        <Route path="/offline" element={<LayoutWrapper currentPageName="OfflineMode"><OfflineModePage /></LayoutWrapper>} />

        {/* ── PÁGINAS REAIS CONECTADAS ── */}
        <Route path="/Clients" element={<LayoutWrapper currentPageName="Clients"><Clients /></LayoutWrapper>} />
        <Route path="/clients" element={<LayoutWrapper currentPageName="Clients"><Clients /></LayoutWrapper>} />
        <Route path="/Leads" element={<LayoutWrapper currentPageName="Leads"><Leads /></LayoutWrapper>} />
        <Route path="/leads" element={<LayoutWrapper currentPageName="Leads"><Leads /></LayoutWrapper>} />
        <Route path="/TasksUnified" element={<LayoutWrapper currentPageName="TasksUnified"><TasksUnified /></LayoutWrapper>} />
        <Route path="/ScheduledAgenda" element={<LayoutWrapper currentPageName="ScheduledAgenda"><ScheduledAgenda /></LayoutWrapper>} />
        <Route path="/VisitManager" element={<LayoutWrapper currentPageName="VisitManager"><VisitManager /></LayoutWrapper>} />
        <Route path="/SalesFunnel" element={<LayoutWrapper currentPageName="SalesFunnel"><SalesFunnel /></LayoutWrapper>} />
        <Route path="/ProposalGenerator" element={<LayoutWrapper currentPageName="ProposalGenerator"><ProposalGenerator /></LayoutWrapper>} />
        <Route path="/EquipmentCatalog" element={<LayoutWrapper currentPageName="EquipmentCatalog"><EquipmentCatalog /></LayoutWrapper>} />
        <Route path="/ProductManager" element={<LayoutWrapper currentPageName="ProductManager"><ProductManager /></LayoutWrapper>} />
        <Route path="/RouteOptimization" element={<LayoutWrapper currentPageName="RouteOptimization"><RouteOptimization /></LayoutWrapper>} />
        <Route path="/RouteOptimizer" element={<LayoutWrapper currentPageName="RouteOptimizer"><RouteOptimizer /></LayoutWrapper>} />
        <Route path="/WhatsAppHub" element={<LayoutWrapper currentPageName="WhatsAppHub"><WhatsAppHub /></LayoutWrapper>} />
        <Route path="/WhatsAppInbox" element={<LayoutWrapper currentPageName="WhatsAppInbox"><WhatsAppInbox /></LayoutWrapper>} />
        <Route path="/AutomationSettings" element={<LayoutWrapper currentPageName="AutomationSettings"><AutomationSettings /></LayoutWrapper>} />
        <Route path="/ContactSettings" element={<LayoutWrapper currentPageName="ContactSettings"><ContactSettings /></LayoutWrapper>} />
        <Route path="/NotificationSettings" element={<LayoutWrapper currentPageName="NotificationSettings"><NotificationSettings /></LayoutWrapper>} />
        <Route path="/notificationSettings" element={<LayoutWrapper currentPageName="NotificationSettings"><NotificationSettings /></LayoutWrapper>} />
        <Route path="/notifications" element={<LayoutWrapper currentPageName="NotificationSettings"><NotificationSettings /></LayoutWrapper>} />
        <Route path="/notification-settings" element={<LayoutWrapper currentPageName="NotificationSettings"><NotificationSettings /></LayoutWrapper>} />
        <Route path="/Integrations" element={<LayoutWrapper currentPageName="Integrations"><Integrations /></LayoutWrapper>} />
        <Route path="/SystemManual" element={<LayoutWrapper currentPageName="SystemManual"><SystemManual /></LayoutWrapper>} />
        <Route path="/GlobalSearch" element={<LayoutWrapper currentPageName="GlobalSearch"><GlobalSearch /></LayoutWrapper>} />
        <Route path="/GlobalCommandCenter" element={<LayoutWrapper currentPageName="GlobalCommandCenter"><GlobalCommandCenter /></LayoutWrapper>} />
        <Route path="/NotificationsCenter" element={<LayoutWrapper currentPageName="NotificationsCenter"><NotificationsCenter /></LayoutWrapper>} />
        <Route path="/PipelineView" element={<LayoutWrapper currentPageName="PipelineView"><PipelineView /></LayoutWrapper>} />
        <Route path="/GenerateWhatsAppIntegrated" element={<LayoutWrapper currentPageName="GenerateWhatsAppIntegrated"><GenerateWhatsAppIntegrated /></LayoutWrapper>} />
        <Route path="/InvestigacaoDeCampoReal" element={<LayoutWrapper currentPageName="InvestigacaoDeCampoReal"><InvestigacaoDeCampoReal /></LayoutWrapper>} />

        {/* ── COMING SOON — ainda não implementadas ── */}
        <Route path="/PossibleSales" element={<LayoutWrapper currentPageName="PossibleSales"><ComingSoonPage /></LayoutWrapper>} />
        <Route path="/ClosingForecast" element={<LayoutWrapper currentPageName="ClosingForecast"><ComingSoonPage /></LayoutWrapper>} />
        <Route path="/SalesOptimizationCenter" element={<LayoutWrapper currentPageName="SalesOptimizationCenter"><ComingSoonPage /></LayoutWrapper>} />
        <Route path="/AIAssistant" element={<LayoutWrapper currentPageName="AIAssistant"><ComingSoonPage /></LayoutWrapper>} />
        <Route path="/SalesCoachingDashboard" element={<LayoutWrapper currentPageName="SalesCoachingDashboard"><ComingSoonPage /></LayoutWrapper>} />
        <Route path="/ProposalTemplates" element={<LayoutWrapper currentPageName="ProposalTemplates"><ComingSoonPage /></LayoutWrapper>} />
        <Route path="/EliteVetClientSearch" element={<LayoutWrapper currentPageName="EliteVetClientSearch"><ComingSoonPage /></LayoutWrapper>} />
        <Route path="/InteractiveDashboard" element={<LayoutWrapper currentPageName="InteractiveDashboard"><ComingSoonPage /></LayoutWrapper>} />
        <Route path="/ExecutiveSalesDashboard" element={<LayoutWrapper currentPageName="ExecutiveSalesDashboard"><ComingSoonPage /></LayoutWrapper>} />
        <Route path="/CustomDashboard" element={<LayoutWrapper currentPageName="CustomDashboard"><ComingSoonPage /></LayoutWrapper>} />
        <Route path="/AdvancedSalesAnalytics" element={<LayoutWrapper currentPageName="AdvancedSalesAnalytics"><ComingSoonPage /></LayoutWrapper>} />
        <Route path="/Reports" element={<LayoutWrapper currentPageName="Reports"><ComingSoonPage /></LayoutWrapper>} />
        <Route path="/SentimentDashboard" element={<LayoutWrapper currentPageName="SentimentDashboard"><ComingSoonPage /></LayoutWrapper>} />
        <Route path="/SentimentAnalysisDashboard" element={<LayoutWrapper currentPageName="SentimentAnalysisDashboard"><ComingSoonPage /></LayoutWrapper>} />
        <Route path="/ProactiveIntelligenceDashboard" element={<LayoutWrapper currentPageName="ProactiveIntelligenceDashboard"><ComingSoonPage /></LayoutWrapper>} />
        <Route path="/IntelligenceDashboard" element={<LayoutWrapper currentPageName="IntelligenceDashboard"><ComingSoonPage /></LayoutWrapper>} />
        <Route path="/NumerologyAnalysis" element={<LayoutWrapper currentPageName="NumerologyAnalysis"><ComingSoonPage /></LayoutWrapper>} />
        <Route path="/OfflineAnalytics" element={<LayoutWrapper currentPageName="OfflineAnalytics"><ComingSoonPage /></LayoutWrapper>} />
        <Route path="/WhatsAppMasterAssistant" element={<LayoutWrapper currentPageName="WhatsAppMasterAssistant"><ComingSoonPage /></LayoutWrapper>} />
        <Route path="/NegociacoesWhatsApp" element={<LayoutWrapper currentPageName="NegociacoesWhatsApp"><ComingSoonPage /></LayoutWrapper>} />
        <Route path="/MessageApproval" element={<LayoutWrapper currentPageName="MessageApproval"><ComingSoonPage /></LayoutWrapper>} />
        <Route path="/MessageHistory" element={<LayoutWrapper currentPageName="MessageHistory"><ComingSoonPage /></LayoutWrapper>} />
        <Route path="/FollowUpAutomationModule" element={<LayoutWrapper currentPageName="FollowUpAutomationModule"><ComingSoonPage /></LayoutWrapper>} />
        <Route path="/AIContentStudio" element={<LayoutWrapper currentPageName="AIContentStudio"><ComingSoonPage /></LayoutWrapper>} />
        <Route path="/WorkflowAutomation" element={<LayoutWrapper currentPageName="WorkflowAutomation"><ComingSoonPage /></LayoutWrapper>} />
        <Route path="/AIKnowledgeUploader" element={<LayoutWrapper currentPageName="AIKnowledgeUploader"><ComingSoonPage /></LayoutWrapper>} />
        <Route path="/ClientImportManager" element={<LayoutWrapper currentPageName="ClientImportManager"><ComingSoonPage /></LayoutWrapper>} />
        <Route path="/MaterialUploadHub" element={<LayoutWrapper currentPageName="MaterialUploadHub"><ComingSoonPage /></LayoutWrapper>} />
        <Route path="/AgentSetup" element={<LayoutWrapper currentPageName="AgentSetup"><ComingSoonPage /></LayoutWrapper>} />
        <Route path="/MasterCRM" element={<LayoutWrapper currentPageName="MasterCRM"><ComingSoonPage /></LayoutWrapper>} />
        <Route path="/MasterControlPanel" element={<LayoutWrapper currentPageName="MasterControlPanel"><ComingSoonPage /></LayoutWrapper>} />

        <Route path="*" element={<LayoutWrapper currentPageName="404"><ComingSoonPage moduleName="404" /></LayoutWrapper>} />
      </Routes>
    </Suspense>
  );
};

// ── REBUILD TRIGGER: 2026-05-15T13:40 ──
function App() {
  return (
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
  )
}

export default App
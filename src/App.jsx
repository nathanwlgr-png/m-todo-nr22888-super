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
import PasswordGate from '@/components/PasswordGate';
import { useState, lazy, Suspense } from 'react';
import Layout from '@/components/AppLayout';
import ComingSoonPage from '@/components/ComingSoonPage';
const RouteAuditReport = lazy(() => import('./pages/RouteAuditReport'));

// Home carrega imediatamente (página principal)
import Home from './pages/Home';

// Todas as outras páginas carregam sob demanda (code splitting)
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
const SalesCommandCenter = lazy(() => import('./pages/SalesCommandCenter'));

// Spinner fora do componente — evita re-criação a cada render
const PageLoader = () => (
  <div className="fixed inset-0 flex items-center justify-center" style={{ background: '#0a0a0a' }}>
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-2 border-orange-800 border-t-orange-500 rounded-full animate-spin" />
      <p className="text-xs text-orange-700 font-bold">Carregando...</p>
    </div>
  </div>
);

const LayoutWrapper = ({ children, currentPageName }) => 
  <Layout currentPageName={currentPageName}>{children}</Layout>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const [passwordUnlocked, setPasswordUnlocked] = useState(() => {
    // Usar sessionStorage — expira quando o navegador fecha (mais seguro que localStorage)
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('seamaty_authenticated') === 'true';
    }
    return false;
  });

  // Verificação 3: Se não desbloqueado, mostrar gate
  if (!passwordUnlocked) {
    return (
      <PasswordGate
        onUnlock={() => {
          setPasswordUnlocked(true);
        }}
      />
    );
  }

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
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
      <Route path="/" element={
        <LayoutWrapper currentPageName="Home">
          <Home />
        </LayoutWrapper>
      } />
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

      {/* ── ROTAS COMING SOON — páginas referenciadas no menu/sidebar mas ainda não implementadas ── */}
      {/* Variações minúsculo / alternativas para segurança no PWA */}
      <Route path="/clients" element={<LayoutWrapper currentPageName="Clients"><ComingSoonPage /></LayoutWrapper>} />
      <Route path="/leads" element={<LayoutWrapper currentPageName="Leads"><ComingSoonPage /></LayoutWrapper>} />
      <Route path="/notifications" element={<LayoutWrapper currentPageName="NotificationSettings"><ComingSoonPage /></LayoutWrapper>} />
      <Route path="/notification-settings" element={<LayoutWrapper currentPageName="NotificationSettings"><ComingSoonPage /></LayoutWrapper>} />

      <Route path="/Clients" element={<LayoutWrapper currentPageName="Clients"><ComingSoonPage /></LayoutWrapper>} />
      <Route path="/Leads" element={<LayoutWrapper currentPageName="Leads"><ComingSoonPage /></LayoutWrapper>} />
      <Route path="/TasksUnified" element={<LayoutWrapper currentPageName="TasksUnified"><ComingSoonPage /></LayoutWrapper>} />
      <Route path="/ScheduledAgenda" element={<LayoutWrapper currentPageName="ScheduledAgenda"><ComingSoonPage /></LayoutWrapper>} />
      <Route path="/VisitManager" element={<LayoutWrapper currentPageName="VisitManager"><ComingSoonPage /></LayoutWrapper>} />
      <Route path="/SalesFunnel" element={<LayoutWrapper currentPageName="SalesFunnel"><ComingSoonPage /></LayoutWrapper>} />
      <Route path="/ProposalGenerator" element={<LayoutWrapper currentPageName="ProposalGenerator"><ComingSoonPage /></LayoutWrapper>} />
      <Route path="/PossibleSales" element={<LayoutWrapper currentPageName="PossibleSales"><ComingSoonPage /></LayoutWrapper>} />
      <Route path="/ClosingForecast" element={<LayoutWrapper currentPageName="ClosingForecast"><ComingSoonPage /></LayoutWrapper>} />
      <Route path="/SalesOptimizationCenter" element={<LayoutWrapper currentPageName="SalesOptimizationCenter"><ComingSoonPage /></LayoutWrapper>} />
      <Route path="/AIAssistant" element={<LayoutWrapper currentPageName="AIAssistant"><ComingSoonPage /></LayoutWrapper>} />
      <Route path="/SalesCoachingDashboard" element={<LayoutWrapper currentPageName="SalesCoachingDashboard"><ComingSoonPage /></LayoutWrapper>} />
      <Route path="/ProposalTemplates" element={<LayoutWrapper currentPageName="ProposalTemplates"><ComingSoonPage /></LayoutWrapper>} />
      <Route path="/EquipmentCatalog" element={<LayoutWrapper currentPageName="EquipmentCatalog"><ComingSoonPage /></LayoutWrapper>} />
      <Route path="/ProductManager" element={<LayoutWrapper currentPageName="ProductManager"><ComingSoonPage /></LayoutWrapper>} />
      <Route path="/RouteOptimizer" element={<LayoutWrapper currentPageName="RouteOptimizer"><ComingSoonPage /></LayoutWrapper>} />
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
      <Route path="/WhatsAppHub" element={<LayoutWrapper currentPageName="WhatsAppHub"><ComingSoonPage /></LayoutWrapper>} />
      <Route path="/WhatsAppInbox" element={<LayoutWrapper currentPageName="WhatsAppInbox"><ComingSoonPage /></LayoutWrapper>} />
      <Route path="/WhatsAppMasterAssistant" element={<LayoutWrapper currentPageName="WhatsAppMasterAssistant"><ComingSoonPage /></LayoutWrapper>} />
      <Route path="/NegociacoesWhatsApp" element={<LayoutWrapper currentPageName="NegociacoesWhatsApp"><ComingSoonPage /></LayoutWrapper>} />
      <Route path="/MessageApproval" element={<LayoutWrapper currentPageName="MessageApproval"><ComingSoonPage /></LayoutWrapper>} />
      <Route path="/MessageHistory" element={<LayoutWrapper currentPageName="MessageHistory"><ComingSoonPage /></LayoutWrapper>} />
      <Route path="/AutomationSettings" element={<LayoutWrapper currentPageName="AutomationSettings"><ComingSoonPage /></LayoutWrapper>} />
      <Route path="/FollowUpAutomationModule" element={<LayoutWrapper currentPageName="FollowUpAutomationModule"><ComingSoonPage /></LayoutWrapper>} />
      <Route path="/AIContentStudio" element={<LayoutWrapper currentPageName="AIContentStudio"><ComingSoonPage /></LayoutWrapper>} />
      <Route path="/ContactSettings" element={<LayoutWrapper currentPageName="ContactSettings"><ComingSoonPage /></LayoutWrapper>} />
      <Route path="/NotificationSettings" element={<LayoutWrapper currentPageName="NotificationSettings"><ComingSoonPage /></LayoutWrapper>} />
      <Route path="/notificationSettings" element={<LayoutWrapper currentPageName="NotificationSettings"><ComingSoonPage /></LayoutWrapper>} />
      <Route path="/Integrations" element={<LayoutWrapper currentPageName="Integrations"><ComingSoonPage /></LayoutWrapper>} />
      <Route path="/WorkflowAutomation" element={<LayoutWrapper currentPageName="WorkflowAutomation"><ComingSoonPage /></LayoutWrapper>} />
      <Route path="/AIKnowledgeUploader" element={<LayoutWrapper currentPageName="AIKnowledgeUploader"><ComingSoonPage /></LayoutWrapper>} />
      <Route path="/ClientImportManager" element={<LayoutWrapper currentPageName="ClientImportManager"><ComingSoonPage /></LayoutWrapper>} />
      <Route path="/MaterialUploadHub" element={<LayoutWrapper currentPageName="MaterialUploadHub"><ComingSoonPage /></LayoutWrapper>} />
      <Route path="/AgentSetup" element={<LayoutWrapper currentPageName="AgentSetup"><ComingSoonPage /></LayoutWrapper>} />
      <Route path="/MasterCRM" element={<LayoutWrapper currentPageName="MasterCRM"><ComingSoonPage /></LayoutWrapper>} />
      <Route path="/MasterControlPanel" element={<LayoutWrapper currentPageName="MasterControlPanel"><ComingSoonPage /></LayoutWrapper>} />
      <Route path="/SystemManual" element={<LayoutWrapper currentPageName="SystemManual"><ComingSoonPage /></LayoutWrapper>} />
      <Route path="/GlobalSearch" element={<LayoutWrapper currentPageName="GlobalSearch"><ComingSoonPage /></LayoutWrapper>} />
      <Route path="/RouteAuditReport" element={<LayoutWrapper currentPageName="RouteAuditReport"><RouteAuditReport /></LayoutWrapper>} />

      <Route path="*" element={<LayoutWrapper currentPageName="404"><ComingSoonPage moduleName="404" /></LayoutWrapper>} />
    </Routes>
    </Suspense>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationTracker />
          <OfflineIndicator />
          <AuthenticatedApp />
          <PWAInstallPrompt />
          <PWAInstallButtonFloating />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

// Logout helper — mantido como função exportável (não no escopo window)
export function logoutSeamaty() {
  sessionStorage.removeItem('seamaty_authenticated');
  window.location.reload();
}

export default App
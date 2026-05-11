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
      <Route path="*" element={<PageNotFound />} />
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
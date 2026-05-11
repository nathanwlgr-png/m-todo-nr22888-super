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
import { useState, useEffect } from 'react';

import VisitRouteManager from './pages/VisitRouteManager';
import InstagramStudio from './pages/InstagramStudio';
import DeepHunter from './pages/DeepHunter';
import ExecutiveAudit from './pages/ExecutiveAudit';
import AuditDashboard from './pages/AuditDashboard';
import MarketingAIStudio from './pages/MarketingAIStudio';
import VisitBriefing from './pages/VisitBriefing';
import MarketingConfig from './pages/MarketingConfig';
import SeamtyNR22888 from './pages/SeamtyNR22888';
import RankingAndConsumables from './pages/RankingAndConsumables';
import PredictiveSalesAnalyzer from './pages/PredictiveSalesAnalyzer';
import SalesCallAnalysis from './pages/SalesCallAnalysis';
import ClientSegmentation from './pages/ClientSegmentation';
import SystemGuide from './pages/SystemGuide';
import ConsumptionSettings from './pages/ConsumptionSettings';
import WhatsAppMaster from './pages/WhatsAppMaster';
import MobVendedorSecureImport from './pages/MobVendedorSecureImport';
import AutoFollowUpDashboard from './pages/AutoFollowUpDashboard';
import NRControlCenter from './pages/NRControlCenter';
import SeamatyHunter from './pages/SeamatyHunter';
import WhatsAppMasterAssistantLapidado from './pages/WhatsAppMasterAssistantLapidado';
import ExecutiveSalesAnalysis from './pages/ExecutiveSalesAnalysis';
import SalesFunnelKanban from './pages/SalesFunnelKanban';
import WhatsAppAutomationTriggers from './pages/WhatsAppAutomationTriggers';
import PrescriptiveAnalytics from './pages/PrescriptiveAnalytics';
import CompetitiveIntelligenceDashboard from './pages/CompetitiveIntelligenceDashboard';
import ActiveProspecting from './pages/ActiveProspecting';
import SmartRouteOptimizer from './pages/SmartRouteOptimizer';
import Home from './pages/Home';
import Layout from '@/components/AppLayout';

const LayoutWrapper = ({ children, currentPageName }) => 
  <Layout currentPageName={currentPageName}>{children}</Layout>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const [passwordUnlocked, setPasswordUnlocked] = useState(() => {
    // Verificação 1: Checar localStorage
    if (typeof window !== 'undefined') {
      return localStorage.getItem('seamaty_authenticated') === 'true';
    }
    return false;
  });

  // Verificação 2: Checar se sessionStorage também confirma
  useEffect(() => {
    if (passwordUnlocked) {
      sessionStorage.setItem('seamaty_session_active', 'true');
    }
  }, [passwordUnlocked]);

  // Verificação 3: Se não desbloqueado, mostrar gate
  if (!passwordUnlocked) {
    return (
      <PasswordGate
        onUnlock={() => {
          setPasswordUnlocked(true);
          // Verificação 4: Double check
          if (localStorage.getItem('seamaty_authenticated') === 'true') {
            console.log('✅ Sistema desbloqueado com sucesso');
          }
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

// Logout helper (para sair da sessão)
window.logoutSeamaty = () => {
  localStorage.removeItem('seamaty_authenticated');
  sessionStorage.removeItem('seamaty_session_active');
  window.location.reload();
};

export default App
import React from 'react';
import ErrorRecoverySystem from './components/ErrorRecoverySystem';
import EntityNotFoundHandler from './components/EntityNotFoundHandler';
import NetworkErrorBoundary from './components/NetworkErrorBoundary';
import GlobalErrorInterceptor from './components/GlobalErrorInterceptor';
import SystemHealthMonitor from './components/SystemHealthMonitor';
import SecurityLayerSystem from './components/SecurityLayerSystem';
import VoiceCommandAI from './components/VoiceCommandAI';
import GoogleSheetsIntegration from './components/GoogleSheetsIntegration';
import SystemHealthChecker from './components/SystemHealthChecker';
import TestFlowSimulator from './components/TestFlowSimulator';
import FollowUpAutomation from './components/FollowUpAutomation';
import WhatsAppNotificationService from './components/WhatsAppNotificationService';
import DocumentAIAnalyzer from './components/DocumentAIAnalyzer';

export default function Layout({ children, currentPageName }) {
  return (
    <ErrorRecoverySystem>
      <GlobalErrorInterceptor />
      <EntityNotFoundHandler>
        <NetworkErrorBoundary>
          <SystemHealthChecker />
          <TestFlowSimulator />
          <SystemHealthMonitor />
          <SecurityLayerSystem />
          <VoiceCommandAI />
          <GoogleSheetsIntegration />
          <FollowUpAutomation />
          <WhatsAppNotificationService />
          <div className="pb-20">
            {children}
          </div>
          <DocumentAIAnalyzer />
        </NetworkErrorBoundary>
      </EntityNotFoundHandler>
    </ErrorRecoverySystem>
  );
}
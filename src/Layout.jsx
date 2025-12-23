import React from 'react';
import ErrorRecoverySystem from './components/ErrorRecoverySystem';
import SystemHealthMonitor from './components/SystemHealthMonitor';
import SecurityLayerSystem from './components/SecurityLayerSystem';
import VoiceCommandAI from './components/VoiceCommandAI';
import GoogleSheetsIntegration from './components/GoogleSheetsIntegration';
import SystemHealthChecker from './components/SystemHealthChecker';
import TestFlowSimulator from './components/TestFlowSimulator';
import FollowUpAutomation from './components/FollowUpAutomation';
import WhatsAppNotificationService from './components/WhatsAppNotificationService';
import TopToolbar from './components/TopToolbar';
import DocumentAIAnalyzer from './components/DocumentAIAnalyzer';

export default function Layout({ children }) {
  return (
    <ErrorRecoverySystem>
      <TopToolbar />
      <SystemHealthChecker />
      <TestFlowSimulator />
      <SystemHealthMonitor />
      <SecurityLayerSystem />
      <VoiceCommandAI />
      <GoogleSheetsIntegration />
      <FollowUpAutomation />
      <WhatsAppNotificationService />
      <div className="pt-14 pb-20">
        {children}
      </div>
      <DocumentAIAnalyzer />
    </ErrorRecoverySystem>
  );
}
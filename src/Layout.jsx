import React from 'react';
import ErrorRecoverySystem from './components/ErrorRecoverySystem';
import SystemHealthMonitor from './components/SystemHealthMonitor';
import SecurityLayerSystem from './components/SecurityLayerSystem';
import VoiceCommandAI from './components/VoiceCommandAI';
import GoogleSheetsIntegration from './components/GoogleSheetsIntegration';
import SystemHealthChecker from './components/SystemHealthChecker';
import TestFlowSimulator from './components/TestFlowSimulator';
import FollowUpAutomation from './components/FollowUpAutomation';

export default function Layout({ children }) {
  return (
    <ErrorRecoverySystem>
      <SystemHealthChecker />
      <TestFlowSimulator />
      <SystemHealthMonitor />
      <SecurityLayerSystem />
      <VoiceCommandAI />
      <GoogleSheetsIntegration />
      <FollowUpAutomation />
      {children}
    </ErrorRecoverySystem>
  );
}
import React from 'react';
import ErrorRecoverySystem from './components/ErrorRecoverySystem';
import SystemHealthMonitor from './components/SystemHealthMonitor';
import SecurityLayerSystem from './components/SecurityLayerSystem';
import VoiceCommandAI from './components/VoiceCommandAI';
import GoogleSheetsIntegration from './components/GoogleSheetsIntegration';
import SystemHealthChecker from './components/SystemHealthChecker';

export default function Layout({ children }) {
  return (
    <ErrorRecoverySystem>
      <SystemHealthChecker />
      <SystemHealthMonitor />
      <SecurityLayerSystem />
      <VoiceCommandAI />
      <GoogleSheetsIntegration />
      {children}
    </ErrorRecoverySystem>
  );
}
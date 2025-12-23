import React from 'react';
import ErrorRecoverySystem from './components/ErrorRecoverySystem';
import SystemHealthMonitor from './components/SystemHealthMonitor';
import SecurityLayerSystem from './components/SecurityLayerSystem';
import VoiceCommandAI from './components/VoiceCommandAI';
import GoogleSheetsIntegration from './components/GoogleSheetsIntegration';

export default function Layout({ children }) {
  return (
    <ErrorRecoverySystem>
      <SystemHealthMonitor />
      <SecurityLayerSystem />
      <VoiceCommandAI />
      <GoogleSheetsIntegration />
      {children}
    </ErrorRecoverySystem>
  );
}
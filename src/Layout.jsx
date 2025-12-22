import React from 'react';
import ErrorRecoverySystem from './components/ErrorRecoverySystem';
import SystemHealthMonitor from './components/SystemHealthMonitor';
import SecurityLayerSystem from './components/SecurityLayerSystem';
import VoiceCommandAI from './components/VoiceCommandAI';

export default function Layout({ children }) {
  return (
    <ErrorRecoverySystem>
      <SystemHealthMonitor />
      <SecurityLayerSystem />
      <VoiceCommandAI />
      {children}
    </ErrorRecoverySystem>
  );
}
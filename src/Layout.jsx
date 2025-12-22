import React from 'react';
import ErrorRecoverySystem from './components/ErrorRecoverySystem';
import SystemHealthMonitor from './components/SystemHealthMonitor';

export default function Layout({ children }) {
  return (
    <ErrorRecoverySystem>
      <SystemHealthMonitor />
      {children}
    </ErrorRecoverySystem>
  );
}
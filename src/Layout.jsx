import React from 'react';
import ErrorRecoverySystem from './components/ErrorRecoverySystem';

export default function Layout({ children }) {
  return (
    <ErrorRecoverySystem>
      {children}
    </ErrorRecoverySystem>
  );
}
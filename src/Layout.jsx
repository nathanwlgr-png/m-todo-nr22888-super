import React from 'react';
import { AILimitProtection } from '@/components/AILimitProtection';
import AIUsageIndicator from '@/components/AIUsageIndicator';

export default function Layout({ children, currentPageName }) {
  return (
    <AILimitProtection>
      <div className="pb-20">
        {children}
      </div>
      <AIUsageIndicator />
    </AILimitProtection>
  );
}
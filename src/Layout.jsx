import React, { useEffect } from 'react';
import { AILimitProtection } from '@/components/AILimitProtection';
import AIUsageIndicator from '@/components/AIUsageIndicator';
import FloatingExportButton from '@/components/FloatingExportButton';

export default function Layout({ children, currentPageName }) {
  // Restaurar posição de scroll ao voltar
  useEffect(() => {
    const savedPosition = sessionStorage.getItem(`scroll_${currentPageName}`);
    if (savedPosition) {
      window.scrollTo(0, parseInt(savedPosition));
    }
    
    const handleScroll = () => {
      sessionStorage.setItem(`scroll_${currentPageName}`, window.scrollY.toString());
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentPageName]);

  return (
    <AILimitProtection>
      <div className="pb-20">
        {children}
      </div>
      <FloatingExportButton />
      <AIUsageIndicator />
    </AILimitProtection>
  );
}
import React from 'react';
import TaskNotifications from '@/components/TaskNotifications';
import AlertNotifications from '@/components/AlertNotifications';
import LeadAutomationEngine from '@/components/LeadAutomationEngine';
import ClientScoringEngine from '@/components/ClientScoringEngine';
import PipelineInactivityMonitor from '@/components/PipelineInactivityMonitor';
import OnboardingTutorial from '@/components/onboarding/OnboardingTutorial';

export default function Layout({ children, currentPageName }) {
  // Full-screen layout without navigation for mobile-first experience
  return (
    <div className="min-h-screen bg-slate-50">
      <OnboardingTutorial />
      <TaskNotifications />
      <AlertNotifications />
      <LeadAutomationEngine />
      <ClientScoringEngine />
      <PipelineInactivityMonitor />
      <style>{`
        :root {
          --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          --primary-blue: #0f172a;
          --secondary-blue: #1e293b;
          --accent-orange: #f97316;
          --accent-orange-light: #fb923c;
        }

        body {
          font-family: var(--font-sans);
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
        }

        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }

        ::-webkit-scrollbar-track {
          background: transparent;
        }

        ::-webkit-scrollbar-thumb {
          background: #f97316;
          border-radius: 4px;
        }

        /* Smooth transitions */
        * {
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Glow effects */
        .glow-orange {
          box-shadow: 0 0 20px rgba(249, 115, 22, 0.3);
        }

        .glow-blue {
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.3);
        }

        .glow-green {
          box-shadow: 0 0 20px rgba(34, 197, 94, 0.3);
        }

        /* Tech grid background */
        .tech-grid {
          background-image: 
            linear-gradient(rgba(249, 115, 22, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(249, 115, 22, 0.03) 1px, transparent 1px);
          background-size: 20px 20px;
        }

        /* Glassmorphism */
        .glass {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        /* Safe area for mobile */
        .safe-bottom {
          padding-bottom: env(safe-area-inset-bottom);
        }
      `}</style>
      {children}
    </div>
  );
}
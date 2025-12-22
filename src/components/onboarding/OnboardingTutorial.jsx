import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, ArrowRight, Check, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const TUTORIAL_STEPS = [
  {
    id: 'welcome',
    title: 'Bem-vindo ao Método NR! 🎉',
    description: 'Vamos fazer um tour rápido pelas principais funcionalidades do sistema.',
    page: 'Home',
    action: 'Começar Tutorial',
    highlight: null
  },
  {
    id: 'home_overview',
    title: 'Dashboard Principal',
    description: 'Aqui você vê métricas importantes: total de clientes, quentes, pipeline e score médio.',
    page: 'Home',
    highlight: '.dashboard-metrics',
    position: 'bottom'
  },
  {
    id: 'add_client',
    title: 'Adicionar Cliente',
    description: 'Clique aqui para cadastrar uma nova possível venda. A numerologia é calculada automaticamente!',
    page: 'Home',
    highlight: '[href*="NewClient"]',
    position: 'bottom'
  },
  {
    id: 'client_profile',
    title: 'Perfil do Cliente',
    description: 'Ao abrir um cliente, você tem acesso ao perfil numerológico, histórico de interações, pipeline e IA.',
    page: 'Clients',
    action: 'Ver Clientes'
  },
  {
    id: 'pipeline',
    title: 'Pipeline de Vendas',
    description: 'O pipeline visual mostra a etapa atual. A IA sugere automaticamente o próximo passo ideal.',
    page: 'ClientProfile',
    highlight: '.pipeline-visual',
    position: 'top'
  },
  {
    id: 'interactions',
    title: 'Histórico de Interações',
    description: 'Registre todas as ligações, emails e reuniões. Isso alimenta a IA para melhores sugestões.',
    page: 'ClientProfile',
    highlight: '[data-tutorial="interactions"]',
    position: 'top'
  },
  {
    id: 'reports',
    title: 'Relatórios Avançados',
    description: 'Analise performance por vendedor, pipeline, produtos e status. Com filtros por data.',
    page: 'Home',
    action: 'Ver Relatórios',
    highlight: '[href*="ReportsAdvanced"]',
    position: 'left'
  },
  {
    id: 'forecast',
    title: 'Previsão de Receita',
    description: 'Veja previsões realistas baseadas em probabilidade de cada cliente fechar.',
    page: 'Home',
    highlight: '[href*="RevenueForecastPage"]',
    position: 'left'
  },
  {
    id: 'complete',
    title: 'Tudo Pronto! ✨',
    description: 'Você está pronto para usar o sistema. Pode refazer o tutorial a qualquer momento no seu perfil.',
    page: 'Home',
    action: 'Finalizar'
  }
];

export default function OnboardingTutorial() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isActive, setIsActive] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const updateUserMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data)
  });

  useEffect(() => {
    if (user && !user.onboarding_completed) {
      setIsActive(true);
    }
  }, [user]);

  const step = TUTORIAL_STEPS[currentStep];

  const nextStep = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      const nextStepData = TUTORIAL_STEPS[currentStep + 1];
      
      if (nextStepData.action) {
        if (nextStepData.id === 'client_profile') {
          navigate(createPageUrl('Clients'));
        } else if (nextStepData.id === 'reports') {
          // Stay on home, just highlight
        }
      }
      
      setCurrentStep(currentStep + 1);
    } else {
      completeTutorial();
    }
  };

  const skipTutorial = () => {
    completeTutorial();
  };

  const completeTutorial = () => {
    setIsActive(false);
    updateUserMutation.mutate({ onboarding_completed: true });
  };

  const restartTutorial = () => {
    setCurrentStep(0);
    setIsActive(true);
    navigate(createPageUrl('Home'));
  };

  // Expor função global para reiniciar
  useEffect(() => {
    window.restartOnboarding = restartTutorial;
    return () => delete window.restartOnboarding;
  }, []);

  if (!isActive || !step) return null;

  const progress = ((currentStep + 1) / TUTORIAL_STEPS.length) * 100;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-[100] backdrop-blur-sm" />

      {/* Tutorial Card */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-[90%] max-w-md">
        <Card className="p-6 shadow-2xl border-2 border-indigo-300">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-indigo-600 font-medium">
                  Passo {currentStep + 1} de {TUTORIAL_STEPS.length}
                </p>
                <div className="w-32 h-1 bg-slate-200 rounded-full mt-1 overflow-hidden">
                  <div 
                    className="h-full bg-indigo-600 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
            <button
              onClick={skipTutorial}
              className="p-1 hover:bg-slate-100 rounded transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            {step.title}
          </h2>
          <p className="text-slate-600 leading-relaxed mb-6">
            {step.description}
          </p>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={skipTutorial}
              className="flex-1"
            >
              Pular Tutorial
            </Button>
            <Button
              onClick={nextStep}
              className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            >
              {currentStep === TUTORIAL_STEPS.length - 1 ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Finalizar
                </>
              ) : (
                <>
                  {step.action || 'Próximo'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>

      {/* Highlight Element (if specified) */}
      {step.highlight && (
        <style>{`
          ${step.highlight} {
            position: relative;
            z-index: 102 !important;
            box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.5), 0 0 20px rgba(99, 102, 241, 0.3) !important;
            border-radius: 12px !important;
            animation: pulse-highlight 2s infinite;
          }
          
          @keyframes pulse-highlight {
            0%, 100% {
              box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.5), 0 0 20px rgba(99, 102, 241, 0.3);
            }
            50% {
              box-shadow: 0 0 0 8px rgba(99, 102, 241, 0.3), 0 0 30px rgba(99, 102, 241, 0.5);
            }
          }
        `}</style>
      )}
    </>
  );
}
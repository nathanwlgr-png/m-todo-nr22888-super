import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function OnboardingTour({ userRole = 'vendedor' }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showTour, setShowTour] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: onboarding } = useQuery({
    queryKey: ['onboarding', user?.email],
    queryFn: () => base44.entities.UserOnboarding.filter({ user_email: user.email }).then(r => r[0]),
    enabled: !!user,
  });

  const updateOnboardingMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.UserOnboarding.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['onboarding']);
    }
  });

  const createOnboardingMutation = useMutation({
    mutationFn: (data) => base44.entities.UserOnboarding.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['onboarding']);
    }
  });

  useEffect(() => {
    if (user && !onboarding) {
      createOnboardingMutation.mutate({
        user_email: user.email,
        user_role: user.role === 'admin' ? 'admin' : userRole,
        current_step: 0,
        steps_completed: []
      });
    }
    
    if (onboarding && !onboarding.completed && !onboarding.skipped) {
      setShowTour(true);
      setCurrentStep(onboarding.current_step || 0);
    }
  }, [user, onboarding]);

  const tourSteps = {
    vendedor: [
      {
        target: '[data-tour="dashboard"]',
        title: '🏠 Bem-vindo ao Dashboard!',
        content: 'Aqui você vê um resumo de todas as suas atividades: clientes, leads, tarefas e performance.',
        video: 'https://www.youtube.com/embed/demo1'
      },
      {
        target: '[data-tour="clients"]',
        title: '👥 Gestão de Clientes',
        content: 'Acesse todos seus clientes, veja perfis detalhados com IA, numerologia e histórico completo.',
        video: 'https://www.youtube.com/embed/demo2'
      },
      {
        target: '[data-tour="leads"]',
        title: '🎯 Captura de Leads',
        content: 'Qualifique leads automaticamente, capture novos clientes e converta em vendas.',
        video: 'https://www.youtube.com/embed/demo3'
      },
      {
        target: '[data-tour="tasks"]',
        title: '✅ Tarefas Inteligentes',
        content: 'Gerencie suas tarefas com priorização por IA, visualização Kanban e calendário.',
        video: 'https://www.youtube.com/embed/demo4'
      },
      {
        target: '[data-tour="routes"]',
        title: '🗺️ Otimização de Rotas',
        content: 'Planeje suas visitas com rotas otimizadas e integração com Google Maps.',
        video: 'https://www.youtube.com/embed/demo5'
      },
      {
        target: '[data-tour="whatsapp"]',
        title: '💬 WhatsApp Master',
        content: 'Chatbot de vendas avançado com IA para qualificar leads e fechar vendas automaticamente.',
        video: 'https://www.youtube.com/embed/demo6'
      }
    ],
    gerente: [
      {
        target: '[data-tour="dashboard"]',
        title: '📊 Dashboard Gerencial',
        content: 'Acompanhe KPIs, metas da equipe, previsões de vendas e performance geral.',
        video: 'https://www.youtube.com/embed/demo7'
      },
      {
        target: '[data-tour="analytics"]',
        title: '📈 Analytics Avançado',
        content: 'Relatórios completos, dashboards customizáveis e insights de IA sobre a equipe.',
        video: 'https://www.youtube.com/embed/demo8'
      },
      {
        target: '[data-tour="integrations"]',
        title: '🔗 Integrações',
        content: 'Conecte com Mailchimp, Calendly, Slack, ERPs e mais para otimizar o workflow.',
        video: 'https://www.youtube.com/embed/demo9'
      },
      {
        target: '[data-tour="automation"]',
        title: '⚡ Automações',
        content: 'Configure regras de automação para tarefas, follow-ups e notificações.',
        video: 'https://www.youtube.com/embed/demo10'
      }
    ]
  };

  const steps = tourSteps[onboarding?.user_role || userRole] || tourSteps.vendedor;
  const step = steps[currentStep];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      const newStep = currentStep + 1;
      setCurrentStep(newStep);
      if (onboarding) {
        updateOnboardingMutation.mutate({
          id: onboarding.id,
          data: {
            current_step: newStep,
            steps_completed: [...(onboarding.steps_completed || []), step.title]
          }
        });
      }
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    if (onboarding) {
      updateOnboardingMutation.mutate({
        id: onboarding.id,
        data: {
          completed: true,
          checklist: {
            ...onboarding.checklist,
            tour_completed: true
          }
        }
      });
    }
    setShowTour(false);
    toast.success('🎉 Tour concluído! Explore o CRM à vontade.');
  };

  const handleSkip = () => {
    if (onboarding) {
      updateOnboardingMutation.mutate({
        id: onboarding.id,
        data: { skipped: true }
      });
    }
    setShowTour(false);
  };

  if (!showTour || !step) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
        >
          <Card className="max-w-2xl w-full">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-indigo-600">
                      Passo {currentStep + 1} de {steps.length}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold mb-2">{step.title}</h2>
                  <p className="text-slate-600">{step.content}</p>
                </div>
                <Button variant="ghost" size="icon" onClick={handleSkip}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {step.video && (
                <div className="aspect-video bg-slate-100 rounded-lg overflow-hidden">
                  <iframe
                    src={step.video}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}

              <div className="flex items-center gap-2">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`h-2 flex-1 rounded-full ${
                      index <= currentStep ? 'bg-indigo-600' : 'bg-slate-200'
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={currentStep === 0}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>

                <Button onClick={handleSkip} variant="ghost">
                  Pular Tour
                </Button>

                {currentStep < steps.length - 1 ? (
                  <Button onClick={handleNext} className="bg-indigo-600">
                    Próximo
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button onClick={handleComplete} className="bg-green-600">
                    Concluir
                    <CheckCircle className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
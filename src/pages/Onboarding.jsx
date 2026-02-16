import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { 
  CheckCircle, Circle, ArrowRight, Sparkles, 
  Users, CheckSquare, Zap, Play, BookOpen, Video
} from 'lucide-react';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import OnboardingTour from '@/components/onboarding/OnboardingTour';

export default function Onboarding() {
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

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list(),
  });

  const { data: integrations = [] } = useQuery({
    queryKey: ['integrations'],
    queryFn: () => base44.entities.Integration?.list().catch(() => []),
  });

  const updateOnboardingMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.UserOnboarding.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['onboarding']);
      toast.success('Progresso atualizado!');
    }
  });

  const checklist = [
    {
      id: 'profile_setup',
      title: 'Configure seu Perfil',
      description: 'Adicione suas informações básicas e preferências',
      icon: Users,
      completed: onboarding?.checklist?.profile_setup || false,
      link: 'MyProfile'
    },
    {
      id: 'first_client',
      title: 'Adicione seu Primeiro Cliente',
      description: 'Cadastre um cliente para começar a usar o CRM',
      icon: Users,
      completed: clients.length > 0,
      link: 'NewClient'
    },
    {
      id: 'first_task',
      title: 'Crie uma Tarefa',
      description: 'Organize seu trabalho criando tarefas',
      icon: CheckSquare,
      completed: tasks.length > 0,
      link: 'TasksUnified'
    },
    {
      id: 'integration_setup',
      title: 'Configure uma Integração',
      description: 'Conecte com ferramentas externas (Mailchimp, Slack, etc)',
      icon: Zap,
      completed: integrations.filter(i => i.status === 'active').length > 0,
      link: 'Integrations'
    },
    {
      id: 'tour_completed',
      title: 'Complete o Tour Guiado',
      description: 'Conheça todas as funcionalidades do CRM',
      icon: Sparkles,
      completed: onboarding?.checklist?.tour_completed || false,
      action: () => setShowTour(true)
    }
  ];

  const completedCount = checklist.filter(item => item.completed).length;
  const progress = (completedCount / checklist.length) * 100;

  const resources = {
    vendedor: [
      {
        title: 'Captura de Leads',
        description: 'Aprenda a capturar e qualificar leads automaticamente',
        video: 'https://www.youtube.com/embed/demo',
        duration: '5 min',
        category: 'Essencial'
      },
      {
        title: 'Gestão de Clientes',
        description: 'Como usar perfis, numerologia e IA para vender mais',
        video: 'https://www.youtube.com/embed/demo',
        duration: '8 min',
        category: 'Essencial'
      },
      {
        title: 'WhatsApp Master',
        description: 'Configure o chatbot de vendas inteligente',
        video: 'https://www.youtube.com/embed/demo',
        duration: '10 min',
        category: 'Avançado'
      },
      {
        title: 'Otimização de Rotas',
        description: 'Planeje visitas eficientes com IA',
        video: 'https://www.youtube.com/embed/demo',
        duration: '6 min',
        category: 'Essencial'
      }
    ],
    gerente: [
      {
        title: 'Dashboard e KPIs',
        description: 'Acompanhe a performance da equipe em tempo real',
        video: 'https://www.youtube.com/embed/demo',
        duration: '7 min',
        category: 'Essencial'
      },
      {
        title: 'Automações e Workflows',
        description: 'Configure regras de automação para otimizar processos',
        video: 'https://www.youtube.com/embed/demo',
        duration: '12 min',
        category: 'Avançado'
      },
      {
        title: 'Relatórios Personalizados',
        description: 'Crie dashboards customizados para análise',
        video: 'https://www.youtube.com/embed/demo',
        duration: '9 min',
        category: 'Essencial'
      },
      {
        title: 'Integrações Empresariais',
        description: 'Conecte com ERPs, Analytics e mais',
        video: 'https://www.youtube.com/embed/demo',
        duration: '11 min',
        category: 'Avançado'
      }
    ]
  };

  const userRole = onboarding?.user_role || (user?.role === 'admin' ? 'gerente' : 'vendedor');
  const recommendedResources = resources[userRole] || resources.vendedor;

  const handleCheckItem = (itemId) => {
    if (!onboarding) return;
    
    updateOnboardingMutation.mutate({
      id: onboarding.id,
      data: {
        checklist: {
          ...onboarding.checklist,
          [itemId]: true
        }
      }
    });
  };

  return (
    <div className="space-y-6 pb-20">
      <Card className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <CardHeader>
          <CardTitle className="text-2xl">Bem-vindo ao CRM NR22! 🎉</CardTitle>
          <p className="text-indigo-100">
            Complete os passos abaixo para aproveitar ao máximo o sistema
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Progresso do Onboarding</span>
              <span className="font-bold">{completedCount}/{checklist.length} concluídos</span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-indigo-600" />
            Checklist de Configuração
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {checklist.map((item) => (
            <Card key={item.id} className={item.completed ? 'bg-green-50 border-green-200' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {item.completed ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{item.title}</h3>
                    <p className="text-sm text-slate-600 mb-3">{item.description}</p>
                    {!item.completed && (
                      item.action ? (
                        <Button size="sm" onClick={item.action}>
                          <Play className="w-4 h-4 mr-2" />
                          Iniciar
                        </Button>
                      ) : item.link ? (
                        <Link to={createPageUrl(item.link)}>
                          <Button size="sm">
                            <ArrowRight className="w-4 h-4 mr-2" />
                            Ir para {item.title}
                          </Button>
                        </Link>
                      ) : (
                        <Button size="sm" onClick={() => handleCheckItem(item.id)}>
                          Marcar como Concluído
                        </Button>
                      )
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Video className="w-5 h-5 text-indigo-600" />
              Recursos Recomendados para {userRole === 'gerente' ? 'Gerentes' : 'Vendedores'}
            </CardTitle>
            <Badge>{userRole}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {recommendedResources.map((resource, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="w-24 h-16 bg-slate-200 rounded-lg flex items-center justify-center">
                    <Play className="w-8 h-8 text-slate-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-semibold">{resource.title}</h3>
                      <Badge variant="outline">{resource.category}</Badge>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">{resource.description}</p>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        {resource.duration}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button 
          onClick={() => setShowTour(true)} 
          className="flex-1 bg-indigo-600"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Iniciar Tour Guiado
        </Button>
        <Link to={createPageUrl('Home')} className="flex-1">
          <Button variant="outline" className="w-full">
            Pular e Explorar
          </Button>
        </Link>
      </div>

      {showTour && <OnboardingTour userRole={userRole} />}
    </div>
  );
}
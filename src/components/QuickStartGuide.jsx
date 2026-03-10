import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Play, CheckCircle2, ArrowRight, Sparkles, 
  MessageSquare, BarChart3, Route, Brain 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const QuickStartGuide = () => {
  const [completedSteps, setCompletedSteps] = useState([]);

  const steps = [
    {
      id: 1,
      title: 'Acesse o Dashboard Executivo',
      description: 'Visualize insights de IA e leads prioritários',
      icon: BarChart3,
      page: 'ExecutiveSalesDashboard',
      color: 'from-indigo-500 to-purple-600',
      action: 'Ir para Dashboard',
      estimatedTime: '5 min'
    },
    {
      id: 2,
      title: 'Teste WhatsApp Integration',
      description: 'Gere uma mensagem com IA e envie para um cliente',
      icon: MessageSquare,
      page: 'Clients',
      color: 'from-green-500 to-emerald-600',
      action: 'Abrir Clientes',
      estimatedTime: '3 min'
    },
    {
      id: 3,
      title: 'Otimize Sua Rota',
      description: 'Use o otimizador para planejar visitas do dia',
      icon: Route,
      page: 'ExecutiveSalesDashboard',
      color: 'from-blue-500 to-cyan-600',
      action: 'Otimizar Rotas',
      estimatedTime: '2 min'
    },
    {
      id: 4,
      title: 'Converse com Assistente IA',
      description: 'Peça estratégias para um cliente específico',
      icon: Brain,
      page: 'AIAssistant',
      color: 'from-orange-500 to-red-500',
      action: 'Abrir Assistente',
      estimatedTime: '5 min'
    }
  ];

  const toggleStep = (stepId) => {
    setCompletedSteps(prev => 
      prev.includes(stepId) 
        ? prev.filter(id => id !== stepId)
        : [...prev, stepId]
    );
  };

  const progress = (completedSteps.length / steps.length) * 100;

  return (
    <Card className="border-2 border-blue-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Play className="w-6 h-6" />
            Guia de Início Rápido
          </CardTitle>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{Math.round(progress)}%</div>
            <div className="text-xs text-muted-foreground">
              {completedSteps.length}/{steps.length} passos
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 h-2 bg-slate-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="space-y-3">
          {steps.map((step) => {
            const isCompleted = completedSteps.includes(step.id);
            
            return (
              <div 
                key={step.id} 
                className={`p-4 rounded-lg border-2 transition-all ${
                  isCompleted 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div 
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-r ${step.color}`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    ) : (
                      <step.icon className="w-5 h-5 text-white" />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-base text-slate-900">
                          Passo {step.id}: {step.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {step.description}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        ~{step.estimatedTime}
                      </Badge>
                    </div>

                    <div className="flex gap-2 mt-3">
                      <Link to={createPageUrl(step.page)} className="flex-1">
                        <Button 
                          size="sm" 
                          className={`w-full bg-gradient-to-r ${step.color}`}
                        >
                          {step.action}
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant={isCompleted ? "default" : "outline"}
                        onClick={() => toggleStep(step.id)}
                        className={isCompleted ? 'bg-green-600' : ''}
                      >
                        {isCompleted ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Feito
                          </>
                        ) : (
                          'Marcar'
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {completedSteps.length === steps.length && (
          <Card className="mt-4 bg-gradient-to-r from-green-500 to-emerald-600 border-0 text-white">
            <CardContent className="p-4 text-center">
              <Sparkles className="w-8 h-8 mx-auto mb-2" />
              <h3 className="font-bold text-lg mb-1">🎉 Parabéns!</h3>
              <p className="text-sm text-green-100">
                Você completou o guia de início rápido. Agora está pronto para maximizar seus fechamentos!
              </p>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
};

export default QuickStartGuide;
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Target, TrendingUp, Brain, MessageSquare, Route, 
  AlertCircle, Calendar, Award, Zap, ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const StrategicRecommendations = () => {
  const strategies = [
    {
      priority: 1,
      title: 'Foque nos 20% que Trazem 80% dos Resultados',
      icon: Target,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      actions: [
        'Use o Dashboard Executivo para identificar os TOP 10 leads com maior probabilidade',
        'Dedique 70% do seu tempo a leads com score >70%',
        'Ignore temporariamente leads com score <40% (deixe para automação)'
      ],
      impact: '+40% na taxa de conversão',
      page: 'ExecutiveSalesDashboard'
    },
    {
      priority: 2,
      title: 'Automatize TUDO que for Repetitivo',
      icon: Zap,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      actions: [
        'Use WhatsApp Integration para follow-ups automáticos',
        'Configure alertas proativos para não esquecer nenhum lead',
        'Deixe a IA gerar mensagens - você apenas revisa e envia'
      ],
      impact: '+3h produtivas por dia',
      page: 'Clients'
    },
    {
      priority: 3,
      title: 'Otimize Rotas para Visitas Estratégicas',
      icon: Route,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      actions: [
        'Use o Otimizador de Rotas ANTES de sair para visitas',
        'Priorize clientes com alta probabilidade na mesma região',
        'Evite perder tempo com visitas de baixo potencial'
      ],
      impact: '+2 visitas qualificadas por dia',
      page: 'ExecutiveSalesDashboard'
    },
    {
      priority: 4,
      title: 'Use o Assistente IA Como Seu Coach Pessoal',
      icon: Brain,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      actions: [
        'Antes de cada visita importante, consulte o Assistente',
        'Peça análise de objeções específicas do cliente',
        'Solicite scripts personalizados para cada etapa do funil'
      ],
      impact: '+25% precisão nas abordagens',
      page: 'AIAssistant'
    },
    {
      priority: 5,
      title: 'Monitore Alertas TODOS OS DIAS',
      icon: AlertCircle,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      actions: [
        'Primeiro passo da manhã: abra o Dashboard e veja alertas',
        'Clientes em risco precisam de ação IMEDIATA',
        'Leads quentes sem follow-up estão perdendo temperatura'
      ],
      impact: 'Evita perda de 15-20% dos negócios',
      page: 'ExecutiveSalesDashboard'
    }
  ];

  const protips = [
    '💡 A IA aprende com o histórico - quanto mais você usa, melhor ela fica',
    '💡 Numerologia não é magia - é ciência comportamental aplicada',
    '💡 Score alto + tempo sem contato = oportunidade perdendo calor',
    '💡 Mensagens curtas e personalizadas convertem 3x mais que genéricas',
    '💡 Uma visita bem planejada vale mais que 5 visitas aleatórias'
  ];

  return (
    <Card className="border-2 border-indigo-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-indigo-800">
          <Award className="w-6 h-6" />
          Plano Estratégico - Próximas 2 Semanas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Estratégias */}
        {strategies.map((strategy) => (
          <div 
            key={strategy.priority} 
            className={`${strategy.bgColor} rounded-lg p-4 border-2 ${strategy.borderColor}`}
          >
            <div className="flex items-start gap-3 mb-3">
              <div className={`w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0 border-2 ${strategy.borderColor}`}>
                <strategy.icon className={`w-5 h-5 ${strategy.color}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between mb-1">
                  <h3 className="font-bold text-base">{strategy.title}</h3>
                  <Badge className={strategy.color.replace('text', 'bg')}>
                    Prioridade {strategy.priority}
                  </Badge>
                </div>
                <div className="space-y-2 mt-3">
                  {strategy.actions.map((action, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <ChevronRight className={`w-4 h-4 ${strategy.color} flex-shrink-0 mt-0.5`} />
                      <span className="text-sm text-slate-700">{action}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-green-700">
                      📈 {strategy.impact}
                    </span>
                    <Link to={createPageUrl(strategy.page)}>
                      <Button size="sm" variant="outline" className={`${strategy.borderColor}`}>
                        Começar
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Pro Tips */}
        <Card className="bg-gradient-to-r from-purple-600 to-indigo-600 border-0 text-white">
          <CardContent className="p-4">
            <h3 className="font-bold text-base mb-3 flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Pro Tips NR22
            </h3>
            <div className="space-y-2">
              {protips.map((tip, index) => (
                <p key={index} className="text-sm text-indigo-100">{tip}</p>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Rotina Diária Sugerida */}
        <Card className="border-2 border-blue-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-blue-800">
              <Calendar className="w-5 h-5" />
              Rotina Diária Ideal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                  1
                </div>
                <div>
                  <p className="font-semibold text-sm">8h-9h: Planejamento</p>
                  <p className="text-xs text-muted-foreground">Dashboard → Alertas → Rota do dia</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                  2
                </div>
                <div>
                  <p className="font-semibold text-sm">9h-12h: Execução</p>
                  <p className="text-xs text-muted-foreground">Visitas + WhatsApp + Follow-ups</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-orange-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                  3
                </div>
                <div>
                  <p className="font-semibold text-sm">12h-14h: Almoço + Prospecção</p>
                  <p className="text-xs text-muted-foreground">IA gera mensagens → envio massivo</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                  4
                </div>
                <div>
                  <p className="font-semibold text-sm">14h-18h: Fechamentos</p>
                  <p className="text-xs text-muted-foreground">Foco em leads quentes do Dashboard</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-indigo-50 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                  5
                </div>
                <div>
                  <p className="font-semibold text-sm">18h-19h: Revisão</p>
                  <p className="text-xs text-muted-foreground">Registrar interações + planejar amanhã</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
};

export default StrategicRecommendations;
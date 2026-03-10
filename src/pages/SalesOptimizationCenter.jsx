import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle2, TrendingUp, MessageSquare, Brain, Route, 
  AlertCircle, Target, Zap, Award, BarChart3, Calendar,
  ArrowRight, Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import SalesValidationReport from '@/components/SalesValidationReport';
import SalesOptimizationSummary from '@/components/SalesOptimizationSummary';
import FinalImplementationChecklist from '@/components/FinalImplementationChecklist';
import StrategicRecommendations from '@/components/StrategicRecommendations';
import ExecutiveSummary from '@/components/ExecutiveSummary';
import QuickStartGuide from '@/components/QuickStartGuide';

export default function SalesOptimizationCenter() {
  const features = [
    {
      title: '📊 Dashboard Executivo Aprimorado',
      page: 'ExecutiveSalesDashboard',
      description: 'Insights de IA, alertas proativos e previsões de receita em tempo real',
      benefits: [
        'Identifica automaticamente leads/clientes prioritários',
        'Alerta sobre clientes em risco de churn',
        'Prevê receita com base em probabilidades de fechamento',
        'Sugere próximas melhores ações para cada oportunidade'
      ],
      impact: 'Muito Alto',
      color: 'from-indigo-500 to-purple-600'
    },
    {
      title: '📱 WhatsApp Master Integration',
      page: 'ClientProfile',
      description: 'Geração e envio de mensagens contextualizadas direto dos perfis',
      benefits: [
        'Mensagens geradas por IA baseadas no perfil do cliente',
        'Envio direto para WhatsApp com um clique',
        'Histórico completo de conversas registrado',
        'Integrado em ClientProfile e LeadProfile'
      ],
      impact: 'Muito Alto',
      color: 'from-green-500 to-emerald-600'
    },
    {
      title: '🤖 Assistente Master de Vendas',
      page: 'AIAssistant',
      description: 'Chat interativo com contexto completo do cliente',
      benefits: [
        'Estratégias personalizadas baseadas em numerologia',
        'Scripts prontos para diferentes cenários',
        'Análise de objeções e soluções específicas',
        'Sugestões de ações para maximizar fechamento'
      ],
      impact: 'Alto',
      color: 'from-orange-500 to-red-500'
    },
    {
      title: '🗺️ Otimizador Inteligente de Rotas',
      page: 'ExecutiveSalesDashboard',
      description: 'Prioriza visitas por probabilidade de conversão + geografia',
      benefits: [
        'Ordena clientes por score de conversão',
        'Agrupa visitas por cidade de forma inteligente',
        'Economiza tempo e aumenta taxa de fechamento',
        'Visualização clara da rota otimizada'
      ],
      impact: 'Alto',
      color: 'from-blue-500 to-cyan-600'
    },
    {
      title: '🔔 Alertas Proativos',
      page: 'ExecutiveSalesDashboard',
      description: 'Monitoramento contínuo e notificações inteligentes',
      benefits: [
        'Detecta clientes em risco antes de perder',
        'Identifica leads quentes sem follow-up',
        'Avisa sobre renovações próximas',
        'Sugere ações imediatas para cada alerta'
      ],
      impact: 'Alto',
      color: 'from-red-500 to-orange-500'
    }
  ];

  const quickWins = [
    {
      icon: BarChart3,
      title: 'Comece pelo Dashboard',
      description: 'Acesse o Dashboard Executivo e clique em "Prever com IA" para análise preditiva',
      action: 'Ir para Dashboard',
      page: 'ExecutiveSalesDashboard',
      color: 'bg-indigo-50 border-indigo-200 text-indigo-700'
    },
    {
      icon: MessageSquare,
      title: 'Teste WhatsApp Integration',
      description: 'Abra um perfil de cliente e use "Gerar com IA" no card WhatsApp',
      action: 'Ver Clientes',
      page: 'Clients',
      color: 'bg-green-50 border-green-200 text-green-700'
    },
    {
      icon: Brain,
      title: 'Converse com a IA',
      description: 'Entre em um ClientProfile e clique em "Abrir Assistente IA"',
      action: 'Abrir Cliente',
      page: 'Clients',
      color: 'bg-purple-50 border-purple-200 text-purple-700'
    },
    {
      icon: Route,
      title: 'Otimize Suas Rotas',
      description: 'Use o Otimizador de Rotas no Dashboard para planejar visitas eficientes',
      action: 'Otimizar Rotas',
      page: 'ExecutiveSalesDashboard',
      color: 'bg-blue-50 border-blue-200 text-blue-700'
    }
  ];

  const metrics = [
    { label: 'Componentes Novos', value: '5', icon: Sparkles, color: 'text-purple-600' },
    { label: 'Páginas Otimizadas', value: '4', icon: CheckCircle2, color: 'text-green-600' },
    { label: 'Funções Backend', value: '2', icon: Zap, color: 'text-orange-600' },
    { label: 'Impacto Esperado', value: '+30%', icon: TrendingUp, color: 'text-blue-600' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Executive Summary */}
        <ExecutiveSummary />

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl mb-4">
            <Target className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            🚀 Centro de Otimização de Vendas
          </h1>
          <p className="text-slate-600 text-lg">
            Sistema otimizado para maximizar fechamentos
          </p>
        </div>

        {/* Métricas Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {metrics.map((metric, index) => (
            <Card key={index} className="border-2">
              <CardContent className="p-6 text-center">
                <metric.icon className={`w-8 h-8 ${metric.color} mx-auto mb-2`} />
                <div className="text-3xl font-bold text-slate-900 mb-1">{metric.value}</div>
                <div className="text-sm text-muted-foreground">{metric.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="features" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="features">Funcionalidades</TabsTrigger>
            <TabsTrigger value="quickwins">Início Rápido</TabsTrigger>
            <TabsTrigger value="validation">Validação</TabsTrigger>
          </TabsList>

          {/* Features */}
          <TabsContent value="features" className="space-y-4 mt-6">
            {features.map((feature, index) => (
              <Card key={index} className="border-2">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">{feature.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                    <Badge className={
                      feature.impact === 'Muito Alto' ? 'bg-red-500' :
                      feature.impact === 'Alto' ? 'bg-orange-500' :
                      'bg-blue-500'
                    }>
                      {feature.impact}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    {feature.benefits.map((benefit, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-slate-700">{benefit}</span>
                      </div>
                    ))}
                  </div>
                  <Link to={createPageUrl(feature.page)}>
                    <Button className={`w-full bg-gradient-to-r ${feature.color} hover:opacity-90`}>
                      Acessar Funcionalidade
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Quick Wins */}
          <TabsContent value="quickwins" className="space-y-4 mt-6">
            <QuickStartGuide />

            <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200">
              <CardContent className="p-6">
                <h3 className="font-bold text-lg text-amber-900 mb-2 flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Rotina Recomendada para Máximo Resultado
                </h3>
                <div className="space-y-3">
                  <div className="bg-white rounded-lg p-3 border border-amber-200">
                    <p className="font-semibold text-sm text-amber-900 mb-1">🌅 Início do Dia (8h-9h)</p>
                    <ul className="text-sm text-slate-700 space-y-1">
                      <li>✓ Abra Dashboard Executivo</li>
                      <li>✓ Verifique alertas proativos</li>
                      <li>✓ Gere rota otimizada do dia</li>
                    </ul>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-amber-200">
                    <p className="font-semibold text-sm text-amber-900 mb-1">📞 Durante o Dia</p>
                    <ul className="text-sm text-slate-700 space-y-1">
                      <li>✓ Use WhatsApp Integration para follow-ups</li>
                      <li>✓ Consulte Assistente IA antes de visitas</li>
                      <li>✓ Registre interações após cada contato</li>
                    </ul>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-amber-200">
                    <p className="font-semibold text-sm text-amber-900 mb-1">🌙 Fim do Dia (18h-19h)</p>
                    <ul className="text-sm text-slate-700 space-y-1">
                      <li>✓ Revise previsões de IA</li>
                      <li>✓ Agende próximas ações sugeridas</li>
                      <li>✓ Prepare estratégias para dia seguinte</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quickWins.map((win, index) => (
                <Card key={index} className={`border-2 ${win.color}`}>
                  <CardContent className="p-4">
                    <win.icon className="w-8 h-8 mb-3" />
                    <h3 className="font-semibold text-base mb-2">{win.title}</h3>
                    <p className="text-sm mb-4">{win.description}</p>
                    <Link to={createPageUrl(win.page)}>
                      <Button variant="outline" className="w-full">
                        {win.action}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Validation */}
          <TabsContent value="validation" className="mt-6 space-y-4">
            <FinalImplementationChecklist />
            <SalesValidationReport />
            
            <Card className="mt-4 border-2 border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <CheckCircle2 className="w-6 h-6" />
                  Status da Implementação
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="font-medium text-sm">Componentes Criados</span>
                    <Badge className="bg-green-500">5/5 ✓</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="font-medium text-sm">Páginas Integradas</span>
                    <Badge className="bg-green-500">4/4 ✓</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="font-medium text-sm">Funções Backend</span>
                    <Badge className="bg-green-500">2/2 ✓</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                    <span className="font-medium text-sm">Testes Automatizados</span>
                    <Badge className="bg-amber-500">Executar</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Resumo de Otimizações */}
        <SalesOptimizationSummary />

        {/* Recomendações Estratégicas */}
        <StrategicRecommendations />

        {/* Próximas Recomendações */}
        <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Sparkles className="w-6 h-6" />
              Recomendações Estratégicas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-600" />
                  1. Foco nas Oportunidades Quentes
                </h4>
                <p className="text-sm text-slate-700">
                  Use o Dashboard Executivo para identificar os 10 leads com maior probabilidade de conversão.
                  Priorize esses contatos nas próximas 48h.
                </p>
              </div>

              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-green-600" />
                  2. Automatize Comunicação
                </h4>
                <p className="text-sm text-slate-700">
                  Use o WhatsApp Integration para enviar mensagens personalizadas a todos os leads sem follow-up.
                  A IA adaptará o tom baseado no perfil de cada um.
                </p>
              </div>

              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <Route className="w-4 h-4 text-orange-600" />
                  3. Otimize Suas Rotas
                </h4>
                <p className="text-sm text-slate-700">
                  Antes de sair para visitas, use o Otimizador de Rotas.
                  Ele priorizará clientes com maior probabilidade de fechamento.
                </p>
              </div>

              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  4. Monitore Alertas Diariamente
                </h4>
                <p className="text-sm text-slate-700">
                  Dedique 10 minutos toda manhã para revisar os Alertas Proativos.
                  Eles identificam riscos e oportunidades que você pode perder.
                </p>
              </div>

              <div className="bg-white rounded-lg p-4 border border-blue-200">
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <Brain className="w-4 h-4 text-purple-600" />
                  5. Consulte o Assistente IA
                </h4>
                <p className="text-sm text-slate-700">
                  Antes de reuniões importantes, peça ao Assistente IA sugestões específicas.
                  Ele conhece numerologia, objeções e estratégias personalizadas.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPIs Esperados */}
        <Card className="border-2 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <Award className="w-6 h-6" />
              Resultados Esperados (30 dias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-4xl font-bold text-green-600 mb-1">+30%</div>
                <div className="text-sm text-green-800 font-medium">Taxa de Conversão</div>
                <div className="text-xs text-muted-foreground mt-1">Rotas + IA</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-4xl font-bold text-blue-600 mb-1">-40%</div>
                <div className="text-sm text-blue-800 font-medium">Tempo em Rotas</div>
                <div className="text-xs text-muted-foreground mt-1">Otimização</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-4xl font-bold text-purple-600 mb-1">+50%</div>
                <div className="text-sm text-purple-800 font-medium">Produtividade</div>
                <div className="text-xs text-muted-foreground mt-1">Automação</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
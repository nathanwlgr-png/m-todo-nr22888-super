import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, TrendingUp, Zap, Target } from 'lucide-react';

const SalesOptimizationSummary = () => {
  const optimizations = [
    {
      category: '🎯 Dashboard Executivo',
      improvements: [
        'Insights de IA em tempo real para leads e clientes prioritários',
        'Alertas proativos de riscos e oportunidades',
        'Otimizador inteligente de rotas baseado em probabilidade',
        'Previsão de receita com análise preditiva'
      ],
      impact: 'Alto'
    },
    {
      category: '📱 WhatsApp Master',
      improvements: [
        'Geração automática de mensagens contextualizadas',
        'Integração direta em perfis de clientes e leads',
        'Sugestões de IA para follow-up e fechamento',
        'Histórico completo de conversas'
      ],
      impact: 'Muito Alto'
    },
    {
      category: '🤖 Assistente IA',
      improvements: [
        'Chat interativo para estratégias de vendas',
        'Análise de perfil numerológico em tempo real',
        'Sugestões de próximas ações baseadas em histórico',
        'Geração de propostas e scripts de vendas'
      ],
      impact: 'Alto'
    },
    {
      category: '🗺️ Rotas Inteligentes',
      improvements: [
        'Priorização por probabilidade de conversão',
        'Otimização geográfica inteligente',
        'Sugestões de melhor sequência de visitas',
        'Integração com calendário e tarefas'
      ],
      impact: 'Médio'
    },
    {
      category: '🔔 Alertas Proativos',
      improvements: [
        'Monitoramento de clientes em risco',
        'Detecção de leads quentes sem follow-up',
        'Notificações de renovações próximas',
        'Sugestões automáticas de ações'
      ],
      impact: 'Alto'
    }
  ];

  return (
    <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-800">
          <CheckCircle2 className="w-6 h-6 text-green-600" />
          Otimizações Implementadas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {optimizations.map((opt, index) => (
          <div key={index} className="bg-white rounded-lg p-4 border border-green-200">
            <div className="flex items-start justify-between mb-3">
              <h3 className="font-semibold text-slate-800">{opt.category}</h3>
              <Badge className={
                opt.impact === 'Muito Alto' ? 'bg-red-500' :
                opt.impact === 'Alto' ? 'bg-orange-500' :
                'bg-blue-500'
              }>
                Impacto {opt.impact}
              </Badge>
            </div>
            <ul className="space-y-2">
              {opt.improvements.map((improvement, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                  <Zap className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  {improvement}
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg p-4 text-white mt-6">
          <div className="flex items-center gap-3 mb-2">
            <Target className="w-6 h-6" />
            <h4 className="font-bold text-lg">Próximos Passos</h4>
          </div>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Teste o Dashboard Executivo para visualizar insights em tempo real
            </li>
            <li className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Use o WhatsApp Master Integration nos perfis de clientes
            </li>
            <li className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Converse com o Assistente IA para obter estratégias personalizadas
            </li>
            <li className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Configure alertas proativos para não perder oportunidades
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default SalesOptimizationSummary;
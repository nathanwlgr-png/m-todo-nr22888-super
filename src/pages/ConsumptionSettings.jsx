import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAIConsumption } from '@/hooks/useAIConsumption';
import { Zap, Settings, ToggleRight, ToggleLeft, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const MODULES = [
  {
    id: 'predictive',
    name: '📈 Análise Preditiva',
    desc: 'Calcula probabilidade de fechamento por oportunidade',
    estimatedCost: 50,
  },
  {
    id: 'segmentation',
    name: '👥 Segmentação de Clientes',
    desc: 'Agrupa clientes em 5 segmentos automáticos',
    estimatedCost: 40,
  },
  {
    id: 'callAnalysis',
    name: '🎙️ Análise de Chamadas',
    desc: 'Detecta padrões de objeção e sinais de fechamento',
    estimatedCost: 45,
  },
  {
    id: 'maintenancePrediction',
    name: '🔧 Predição de Manutenção',
    desc: 'Prevê quando equipamentos precisarão de manutenção',
    estimatedCost: 35,
  },
  {
    id: 'healthScoreMonitoring',
    name: '💚 Monitoramento de Health Score',
    desc: 'Acompanha saúde do cliente e alertas de churn',
    estimatedCost: 30,
  },
  {
    id: 'dynamicPricing',
    name: '💰 Sugestão Dinâmica de Preços',
    desc: 'Sugere preços ideais baseado em mercado e demanda',
    estimatedCost: 40,
  },
  {
    id: 'playbooks',
    name: '📚 Playbooks de Vendas',
    desc: 'Gera playbooks dinâmicos por segmento',
    estimatedCost: 35,
  },
  {
    id: 'followUpPrioritization',
    name: '⭐ Priorização de Follow-ups',
    desc: 'Prioriza tarefas por score e conversão',
    estimatedCost: 25,
  },
  {
    id: 'personalizedContent',
    name: '📧 Conteúdo Personalizado',
    desc: 'Email/WhatsApp com IA adaptado por cliente',
    estimatedCost: 45,
  },
  {
    id: 'competitorMonitoring',
    name: '🏆 Monitoramento de Concorrentes',
    desc: 'Alertas sobre atividades de concorrentes',
    estimatedCost: 50,
  },
  {
    id: 'visitOptimization',
    name: '🗺️ Otimização de Agenda',
    desc: 'Otimiza rotas e horários de visitas',
    estimatedCost: 40,
  },
  {
    id: 'kpiReports',
    name: '📊 Relatórios KPI Customizados',
    desc: 'Relatórios personalizados diários/semanais',
    estimatedCost: 20,
  },
  {
    id: 'proactiveAlerts',
    name: '🚨 Alertas Proativos',
    desc: 'Detecta anomalias em padrões de vendas',
    estimatedCost: 35,
  },
];

export default function ConsumptionSettings() {
  const { consumption, moduleStates, toggleModule, activateModule, MONTHLY_LIMIT } = useAIConsumption();
  const [searchTerm, setSearchTerm] = useState('');

  const handleToggle = (moduleName, estimatedCost) => {
    if (!moduleStates[moduleName]) {
      // Tentando ligar
      const result = activateModule(moduleName, estimatedCost);
      if (result.success) {
        toast.success(`✅ ${MODULES.find(m => m.id === moduleName).name} ativado`);
      } else {
        toast.error(result.message);
      }
    } else {
      // Desligando
      toggleModule(moduleName);
      toast.info(`❌ ${MODULES.find(m => m.id === moduleName).name} desativado`);
    }
  };

  const filteredModules = MODULES.filter(m =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.desc.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeModulesCount = Object.values(moduleStates).filter(Boolean).length;
  const totalEstimatedCost = MODULES.reduce((sum, m) => sum + (moduleStates[m.id] ? m.estimatedCost : 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50 pb-24 pt-4">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">

        {/* HEADER */}
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <Settings className="w-8 h-8 text-purple-600" />
            ⚙️ Configurações de Consumo de IA
          </h1>
          <p className="text-slate-600 mt-1">Controle ON/OFF de cada módulo · Monitore custos em tempo real</p>
        </div>

        {/* STATUS GERAL */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="pt-6 text-center">
              <p className="text-xs font-bold text-purple-900">MÓDULOS ATIVOS</p>
              <p className="text-3xl font-black text-purple-600 mt-1">{activeModulesCount}/{MODULES.length}</p>
            </CardContent>
          </Card>

          <Card className={`${
            consumption.status === 'critical' ? 'bg-red-50 border-red-200' :
            consumption.status === 'warning' ? 'bg-yellow-50 border-yellow-200' :
            'bg-green-50 border-green-200'
          }`}>
            <CardContent className="pt-6 text-center">
              <p className={`text-xs font-bold ${
                consumption.status === 'critical' ? 'text-red-900' :
                consumption.status === 'warning' ? 'text-yellow-900' :
                'text-green-900'
              }`}>CONSUMO TOTAL MÊS</p>
              <p className={`text-3xl font-black mt-1 ${
                consumption.status === 'critical' ? 'text-red-600' :
                consumption.status === 'warning' ? 'text-yellow-600' :
                'text-green-600'
              }`}>R$ {consumption.monthlySpent.toLocaleString('pt-BR')}</p>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6 text-center">
              <p className="text-xs font-bold text-blue-900">ESTIMADO (MÓDULOS ATIVOS)</p>
              <p className="text-3xl font-black text-blue-600 mt-1">R$ {totalEstimatedCost.toLocaleString('pt-BR')}</p>
              <p className="text-xs text-blue-700 mt-1">de R$ {MONTHLY_LIMIT.toLocaleString('pt-BR')}</p>
            </CardContent>
          </Card>
        </div>

        {/* ALERTA CRÍTICO */}
        {consumption.status === 'critical' && (
          <Card className="border-red-300 bg-red-50">
            <CardContent className="pt-4 flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />
              <div>
                <p className="font-bold text-red-900">🚨 Limite de Crédito Crítico</p>
                <p className="text-sm text-red-800">Você atingiu 90% do limite de R$1.000,00. Desative módulos não essenciais para continuar.</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* BUSCA */}
        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="pt-4">
            <input
              type="text"
              placeholder="🔍 Buscar módulo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 rounded border border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </CardContent>
        </Card>

        {/* GRID DE MÓDULOS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredModules.map((module) => (
            <Card
              key={module.id}
              className={`border-2 transition-all ${
                moduleStates[module.id]
                  ? 'border-purple-400 bg-purple-50'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{module.name}</CardTitle>
                  <Badge className={moduleStates[module.id] ? 'bg-green-600' : 'bg-slate-500'}>
                    {moduleStates[module.id] ? 'ON' : 'OFF'}
                  </Badge>
                </div>
                <p className="text-xs text-slate-600 mt-1">{module.desc}</p>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-700 font-bold">Custo Estimado:</span>
                  <span className="text-slate-900 font-black">R$ {module.estimatedCost}</span>
                </div>

                <Button
                  onClick={() => handleToggle(module.id, module.estimatedCost)}
                  className={`w-full gap-2 ${
                    moduleStates[module.id]
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                  disabled={consumption.status === 'critical' && !moduleStates[module.id]}
                >
                  {moduleStates[module.id] ? (
                    <>
                      <ToggleLeft className="w-4 h-4" />
                      Desativar
                    </>
                  ) : (
                    <>
                      <ToggleRight className="w-4 h-4" />
                      Ativar
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredModules.length === 0 && (
          <Card className="text-center py-12">
            <p className="text-slate-600">Nenhum módulo encontrado com "{searchTerm}"</p>
          </Card>
        )}

        {/* RESUMO FINAL */}
        <Card className="border-indigo-300 bg-indigo-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              💡 Dicas para Economizar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm">✅ Mantenha desativados os módulos que não usa frequentemente</p>
            <p className="text-sm">✅ Use "Análise Preditiva" + "Segmentação" como prioridade máxima</p>
            <p className="text-sm">✅ Ative "Monitoramento de Concorrentes" apenas 1x por semana</p>
            <p className="text-sm">✅ "Relatórios KPI" é o módulo mais barato (R$20)</p>
            <p className="text-sm">✅ Monitore consumo diariamente via botão flutuante ⏰</p>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
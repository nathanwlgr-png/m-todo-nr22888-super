import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  TrendingUp, AlertTriangle, Zap, Target, DollarSign, 
  Loader2, ArrowUp, ArrowDown, Eye, EyeOff, Settings
} from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, FunnelChart, Funnel, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Pie, PieChart
} from 'recharts';
import { toast } from 'sonner';
import { useModuleProtection } from '@/hooks/useModuleProtection';

export default function PredictiveSalesAnalyzer() {
  const [activeMode, setActiveMode] = useState('preditivo'); // preditivo | funil
  const [showDetails, setShowDetails] = useState(true);
  const [monthlyGoal, setMonthlyGoal] = useState(360000); // R$360k default
  const [isEnabled, setIsEnabled] = useState(true);
  const { safeInvoke, moduleStates } = useModuleProtection();

  const { data: clients = [] } = useQuery({
    queryKey: ['clients-predictive'],
    queryFn: () => base44.entities.Client.list('-updated_date', 200),
    staleTime: 5 * 60 * 1000,
    enabled: isEnabled,
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['sales-predictive'],
    queryFn: () => base44.entities.Sale.list('-sale_date', 100),
    staleTime: 5 * 60 * 1000,
    enabled: isEnabled,
  });

  const { data: leads = [] } = useQuery({
    queryKey: ['leads-predictive'],
    queryFn: () => base44.entities.Lead?.list('-created_date', 100).catch(() => []),
    staleTime: 5 * 60 * 1000,
    enabled: isEnabled,
  });

  // Calcular probabilidade de fechamento com proteção
  const computePredictions = useMutation({
    mutationFn: async () => {
      toast.info('🧠 Analisando probabilidades...');
      const result = await safeInvoke(
        (fn, p) => base44.functions.invoke(fn, p),
        'predictiveSalesAnalysis',
        {
          clients: clients.slice(0, 100),
          sales: sales.slice(0, 50),
          leads: leads.slice(0, 50),
          monthlyGoal,
        }
      );
      return result.data;
    },
    onSuccess: (data) => {
      toast.success('✅ Análise completa!');
    },
    onError: (err) => {
      // Erro já foi tratado pelo safeInvoke
      if (!err.message.includes('desativado')) {
        toast.error('Erro: ' + err.message);
      }
    },
  });

  // Dados do funil (simulação se sem função)
  const funnelData = useMemo(() => {
    if (computePredictions.data?.funnel) return computePredictions.data.funnel;
    
    const stages = {
      'novo': clients.filter(c => c.pipeline_stage === 'lead').length,
      'qualificado': clients.filter(c => c.pipeline_stage === 'qualificado').length,
      'proposta': clients.filter(c => c.pipeline_stage === 'proposta').length,
      'negociacao': clients.filter(c => c.pipeline_stage === 'negociacao').length,
      'fechado': sales.filter(s => s.status === 'fechada').length,
    };

    return [
      { name: 'Leads Novos', value: stages.novo, color: '#3b82f6', stage: 'novo' },
      { name: 'Qualificados', value: stages.qualificado, color: '#8b5cf6', stage: 'qualificado' },
      { name: 'Com Proposta', value: stages.proposta, color: '#f59e0b', stage: 'proposta' },
      { name: 'Negociação', value: stages.negociacao, color: '#ec4899', stage: 'negociacao' },
      { name: 'Fechados', value: stages.fechado, color: '#10b981', stage: 'fechado' },
    ];
  }, [clients, sales, computePredictions.data]);

  // Calcular taxa de conversão entre estágios
  const conversionMetrics = useMemo(() => {
    const total = funnelData.reduce((sum, s) => sum + s.value, 0);
    return funnelData.map((stage, idx) => {
      const prev = idx > 0 ? funnelData[idx - 1].value : total;
      const rate = prev > 0 ? ((stage.value / prev) * 100).toFixed(1) : 0;
      return { ...stage, conversionRate: parseFloat(rate) };
    });
  }, [funnelData]);

  // Identificar gargalos (estágios com baixa conversão)
  const bottlenecks = useMemo(() => {
    return conversionMetrics
      .filter(m => m.conversionRate < 50 && m.value > 0)
      .sort((a, b) => a.conversionRate - b.conversionRate);
  }, [conversionMetrics]);

  // Calculadora de gap até meta
  const goalAnalysis = useMemo(() => {
    const closedValue = sales
      .filter(s => s.status === 'fechada')
      .reduce((sum, s) => sum + (s.sale_value || 0), 0);

    const thisMonth = sales.filter(s => {
      const d = new Date(s.sale_date);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    const monthlyRealized = thisMonth.reduce((sum, s) => sum + (s.sale_value || 0), 0);
    const gap = Math.max(0, monthlyGoal - monthlyRealized);
    const daysLeft = 30 - new Date().getDate();
    const dailyNeeded = daysLeft > 0 ? gap / daysLeft : 0;

    // Oportunidades no pipeline com score alto
    const hotOpportunities = clients
      .filter(c => (c.purchase_score || 0) > 70 && c.pipeline_stage !== 'fechado')
      .reduce((sum, c) => sum + (c.projected_revenue || 0), 0);

    const canHitGoal = hotOpportunities >= gap;

    return {
      monthlyRealized,
      gap,
      percentageToGoal: ((monthlyRealized / monthlyGoal) * 100).toFixed(1),
      daysLeft,
      dailyNeeded: dailyNeeded.toFixed(0),
      hotOpportunities,
      canHitGoal,
    };
  }, [sales, monthlyGoal, clients]);

  // Oportunidades por probabilidade de fechamento
  const opportunitiesByProbability = useMemo(() => {
    return [
      {
        range: '80-100%',
        opportunities: clients.filter(c => (c.purchase_score || 0) >= 80).length,
        revenue: clients.filter(c => (c.purchase_score || 0) >= 80).reduce((s, c) => s + (c.projected_revenue || 0), 0),
        color: '#10b981'
      },
      {
        range: '60-80%',
        opportunities: clients.filter(c => (c.purchase_score || 0) >= 60 && (c.purchase_score || 0) < 80).length,
        revenue: clients.filter(c => (c.purchase_score || 0) >= 60 && (c.purchase_score || 0) < 80).reduce((s, c) => s + (c.projected_revenue || 0), 0),
        color: '#f59e0b'
      },
      {
        range: '40-60%',
        opportunities: clients.filter(c => (c.purchase_score || 0) >= 40 && (c.purchase_score || 0) < 60).length,
        revenue: clients.filter(c => (c.purchase_score || 0) >= 40 && (c.purchase_score || 0) < 60).reduce((s, c) => s + (c.projected_revenue || 0), 0),
        color: '#8b5cf6'
      },
      {
        range: '0-40%',
        opportunities: clients.filter(c => (c.purchase_score || 0) < 40).length,
        revenue: clients.filter(c => (c.purchase_score || 0) < 40).reduce((s, c) => s + (c.projected_revenue || 0), 0),
        color: '#6b7280'
      }
    ];
  }, [clients]);

  if (!isEnabled) {
    return (
      <Card className="border-slate-300 bg-slate-50">
        <CardContent className="pt-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <EyeOff className="w-6 h-6 text-slate-500" />
            <p className="text-lg font-bold text-slate-700">Módulo Desativado</p>
          </div>
          <p className="text-sm text-slate-600 mb-4">Para economizar recursos, este módulo está inativo.</p>
          <Button onClick={() => setIsEnabled(true)} className="gap-2">
            <Eye className="w-4 h-4" />
            Ativar Análise Preditiva
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 pb-24 pt-4">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">

        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-blue-600" />
              📊 Análise Preditiva de Vendas
            </h1>
            <p className="text-slate-600 text-sm mt-1">Probabilidades de fechamento + Detecção de gargalos no funil</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEnabled(false)}
            className="gap-2"
          >
            <EyeOff className="w-4 h-4" />
            Desativar
          </Button>
        </div>

        {/* CONFIGURAÇÃO */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-4">
            <div className="flex items-end gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <label className="text-xs font-bold text-blue-900">Meta Mensal (R$)</label>
                <input
                  type="number"
                  value={monthlyGoal}
                  onChange={(e) => setMonthlyGoal(parseInt(e.target.value))}
                  className="w-full px-3 py-2 rounded border border-blue-300 mt-1"
                />
              </div>
              <Button
                onClick={() => computePredictions.mutate()}
                disabled={computePredictions.isPending || !moduleStates.predictive}
                title={!moduleStates.predictive ? 'Ative em Configurações de Consumo' : ''}
                className={`gap-2 ${
                  !moduleStates.predictive 
                    ? 'bg-slate-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {!moduleStates.predictive ? (
                  <>❌ Módulo Desativado</>
                ) : computePredictions.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                {!moduleStates.predictive ? 'Ativar em Configs' : 'Calcular Probabilidades'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? 'Ocultar' : 'Mostrar'} Detalhes
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* MÉTRICAS DE META */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className={`${
            goalAnalysis.canHitGoal ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'
          }`}>
            <CardContent className="pt-4 text-center">
              <p className="text-xs font-bold text-slate-700">META MENSAL</p>
              <p className="text-2xl font-black text-slate-900">R$ {(monthlyGoal / 1000).toFixed(0)}k</p>
              <p className="text-xs text-slate-600 mt-1">{goalAnalysis.percentageToGoal}% atingido</p>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-blue-300">
            <CardContent className="pt-4 text-center">
              <p className="text-xs font-bold text-blue-900">REALIZADO MÊS</p>
              <p className="text-2xl font-black text-blue-600">R$ {(goalAnalysis.monthlyRealized / 1000).toFixed(0)}k</p>
              <p className="text-xs text-blue-700 mt-1">Até hoje</p>
            </CardContent>
          </Card>

          <Card className={`${goalAnalysis.gap > 0 ? 'bg-orange-50 border-orange-300' : 'bg-green-50 border-green-300'}`}>
            <CardContent className="pt-4 text-center">
              <p className="text-xs font-bold text-slate-700">GAP PARA META</p>
              <p className={`text-2xl font-black ${goalAnalysis.gap > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                R$ {(goalAnalysis.gap / 1000).toFixed(0)}k
              </p>
              <p className="text-xs text-slate-600 mt-1">{goalAnalysis.daysLeft} dias restantes</p>
            </CardContent>
          </Card>

          <Card className={`${
            goalAnalysis.hotOpportunities >= goalAnalysis.gap ? 'bg-green-50 border-green-300' : 'bg-yellow-50 border-yellow-300'
          }`}>
            <CardContent className="pt-4 text-center">
              <p className="text-xs font-bold text-slate-700">OPORTUNIDADES QUENTES</p>
              <p className="text-2xl font-black text-green-600">R$ {(goalAnalysis.hotOpportunities / 1000).toFixed(0)}k</p>
              <Badge className={goalAnalysis.canHitGoal ? 'bg-green-600' : 'bg-yellow-600'}>
                {goalAnalysis.canHitGoal ? '✅ Atingível' : '⚠️ Risco'}
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* MODO SELETOR */}
        <div className="flex gap-2">
          <Button
            variant={activeMode === 'preditivo' ? 'default' : 'outline'}
            onClick={() => setActiveMode('preditivo')}
            className="flex-1"
          >
            <Target className="w-4 h-4 mr-2" />
            Probabilidades
          </Button>
          <Button
            variant={activeMode === 'funil' ? 'default' : 'outline'}
            onClick={() => setActiveMode('funil')}
            className="flex-1"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Funil + Gargalos
          </Button>
        </div>

        {activeMode === 'preditivo' ? (
          <>
            {/* OPORTUNIDADES POR PROBABILIDADE */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Oportunidades por Probabilidade de Fechamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={opportunitiesByProbability}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ range, opportunities }) => `${range}: ${opportunities}`}
                        outerRadius={80}
                        dataKey="opportunities"
                      >
                        {opportunitiesByProbability.map((entry, idx) => (
                          <Cell key={idx} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value} oportunidades`} />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="space-y-3">
                    {opportunitiesByProbability.map((prob, idx) => (
                      <div key={idx} className="p-3 rounded-lg border border-slate-200">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded" style={{ background: prob.color }} />
                            <span className="font-bold text-sm">{prob.range} Probabilidade</span>
                          </div>
                          <Badge className="text-xs">{prob.opportunities}</Badge>
                        </div>
                        <p className="text-xs text-slate-600">
                          💰 Receita potencial: R$ {(prob.revenue / 1000).toFixed(0)}k
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* TOP OPORTUNIDADES */}
            {showDetails && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    Top Oportunidades Para Fechar
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {clients
                      .filter(c => (c.purchase_score || 0) > 60 && c.pipeline_stage !== 'fechado')
                      .sort((a, b) => (b.purchase_score || 0) - (a.purchase_score || 0))
                      .slice(0, 10)
                      .map((client, idx) => (
                        <div key={client.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 hover:border-blue-300 transition">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm">{idx + 1}.</span>
                              <p className="font-bold text-sm truncate">{client.full_name || client.clinic_name}</p>
                            </div>
                            <p className="text-xs text-slate-600">{client.city}</p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                            <div className="text-right">
                              <Badge className={`${
                                (client.purchase_score || 0) >= 80 ? 'bg-green-600' :
                                (client.purchase_score || 0) >= 60 ? 'bg-orange-600' : 'bg-blue-600'
                              }`}>
                                {Math.round(client.purchase_score || 0)}%
                              </Badge>
                              <p className="text-xs text-slate-600 mt-1">R$ {((client.projected_revenue || 0) / 1000).toFixed(0)}k</p>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <>
            {/* FUNIL COM CONVERSÃO */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Funil de Vendas - Taxa de Conversão
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <FunnelChart>
                    <Tooltip formatter={(value) => `${value} oportunidades`} />
                    <Funnel dataKey="value" data={conversionMetrics} isAnimationActive>
                      {conversionMetrics.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Funnel>
                  </FunnelChart>
                </ResponsiveContainer>

                <div className="grid grid-cols-2 gap-2 mt-4">
                  {conversionMetrics.map((metric, idx) => (
                    <div key={idx} className="p-3 rounded bg-slate-50 border border-slate-200">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sm">{metric.name}</span>
                        <span className="text-lg font-black" style={{ color: metric.color }}>{metric.value}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-600">Taxa:</span>
                        <span className={metric.conversionRate >= 50 ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                          {metric.conversionRate}%
                        </span>
                        {metric.conversionRate < 50 && <AlertTriangle className="w-3 h-3 text-red-500" />}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* GARGALOS IDENTIFICADOS */}
            {bottlenecks.length > 0 && (
              <Card className="border-red-300 bg-red-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-900">
                    <AlertTriangle className="w-5 h-5" />
                    ⚠️ Gargalos Detectados - Intervenção Necessária
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {bottlenecks.map((bottleneck, idx) => (
                    <div key={idx} className="p-4 bg-white border-2 border-red-300 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-slate-900">{bottleneck.name}</h4>
                        <Badge className="bg-red-600">🔴 {bottleneck.conversionRate}% conversão</Badge>
                      </div>
                      <p className="text-sm text-slate-600 mb-3">
                        {bottleneck.value} oportunidades neste estágio. {bottleneck.conversionRate < 30 ? 'Ação urgente recomendada.' : 'Considere interventions.'}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-300 hover:bg-red-50"
                          onClick={() => toast.info(`📞 Follow-up recomendado para ${bottleneck.value} oportunidades em "${bottleneck.name}"`)}
                        >
                          Disparar Follow-up
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-orange-600 border-orange-300 hover:bg-orange-50"
                          onClick={() => toast.info(`📊 Analisando razões do atraso em "${bottleneck.name}"...`)}
                        >
                          Analisar Motivos
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {bottlenecks.length === 0 && (
              <Card className="border-green-300 bg-green-50">
                <CardContent className="pt-6 text-center">
                  <p className="text-green-900 font-bold">✅ Funil saudável! Nenhum gargalo crítico detectado.</p>
                </CardContent>
              </Card>
            )}
          </>
        )}

      </div>
    </div>
  );
}
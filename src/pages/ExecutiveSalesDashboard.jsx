import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, TrendingDown, Target, DollarSign, 
  Users, Calendar, Zap, Brain, AlertCircle, Award,
  ChevronRight, RefreshCw, Eye
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';

export default function ExecutiveSalesDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [predicting, setPredicting] = useState(false);
  const [predictions, setPredictions] = useState([]);

  // Buscar dados
  const { data: leads = [] } = useQuery({
    queryKey: ['leads-dashboard'],
    queryFn: () => base44.entities.Lead.list(),
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['sales-dashboard'],
    queryFn: () => base44.entities.Sale.list(),
  });

  const { data: goals = [] } = useQuery({
    queryKey: ['goals-dashboard'],
    queryFn: () => base44.entities.SalesGoal.list(),
  });

  // Calcular probabilidade de fechamento com IA
  const predictClosingProbability = async () => {
    setPredicting(true);
    try {
      const leadsToPredict = leads.filter(l => 
        ['qualificado', 'proposta', 'negociacao'].includes(l.pipeline_stage)
      );

      const predictions = await Promise.all(
        leadsToPredict.slice(0, 20).map(async (lead) => {
          try {
            const prompt = `Analise este lead e retorne apenas um número de 0 a 100 representando a probabilidade de fechamento:
            
Lead: ${lead.full_name}
Empresa: ${lead.company || 'N/A'}
Estágio: ${lead.pipeline_stage}
Score Atual: ${lead.predictive_score || 0}
Valor Estimado: R$ ${lead.estimated_deal_value || 0}
Origem: ${lead.source}
Engajamento: ${lead.engagement_metrics ? JSON.stringify(lead.engagement_metrics) : 'Baixo'}

Considere: tempo no funil, engajamento, fit com ICP, valor do negócio.`;

            const result = await base44.integrations.Core.InvokeLLM({
              prompt,
              response_json_schema: {
                type: 'object',
                properties: {
                  probability: { type: 'number' },
                  reason: { type: 'string' },
                  risk_factors: { type: 'array', items: { type: 'string' } },
                  recommended_actions: { type: 'array', items: { type: 'string' } }
                }
              }
            });

            return {
              lead_id: lead.id,
              lead_name: lead.full_name,
              company: lead.company,
              current_stage: lead.pipeline_stage,
              estimated_value: lead.estimated_deal_value || 0,
              probability: result.probability || 0,
              reason: result.reason,
              risk_factors: result.risk_factors || [],
              recommended_actions: result.recommended_actions || []
            };
          } catch (e) {
            return null;
          }
        })
      );

      setPredictions(predictions.filter(p => p !== null));
    } catch (error) {
      console.error('Erro ao prever:', error);
    }
    setPredicting(false);
  };

  // Calcular métricas
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const salesThisMonth = sales.filter(s => {
    const saleDate = new Date(s.sale_date);
    return saleDate.getMonth() === currentMonth && saleDate.getFullYear() === currentYear && s.status === 'fechada';
  });

  const totalRevenue = salesThisMonth.reduce((sum, s) => sum + (s.sale_value || 0), 0);
  
  const activeGoal = goals.find(g => g.status === 'active' && g.goal_type === 'team' && g.metric_type === 'sales_value');
  const goalTarget = activeGoal?.target_value || 500000;
  const goalProgress = (totalRevenue / goalTarget) * 100;

  const hotLeads = leads.filter(l => 
    (l.predictive_score >= 70 || l.priority_level === 'critical') && 
    ['qualificado', 'proposta', 'negociacao'].includes(l.pipeline_stage)
  );

  const pipelineValue = leads
    .filter(l => ['qualificado', 'proposta', 'negociacao'].includes(l.pipeline_stage))
    .reduce((sum, l) => sum + (l.estimated_deal_value || 0), 0);

  const predictedRevenue = predictions.reduce((sum, p) => 
    sum + (p.estimated_value * (p.probability / 100)), 0
  );

  // Dados para gráficos
  const pipelineData = [
    { name: 'Qualificado', value: leads.filter(l => l.pipeline_stage === 'qualificado').length },
    { name: 'Proposta', value: leads.filter(l => l.pipeline_stage === 'proposta').length },
    { name: 'Negociação', value: leads.filter(l => l.pipeline_stage === 'negociacao').length },
    { name: 'Fechado', value: leads.filter(l => l.pipeline_stage === 'fechado').length },
  ];

  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const month = new Date();
    month.setMonth(month.getMonth() - (5 - i));
    const monthSales = sales.filter(s => {
      const d = new Date(s.sale_date);
      return d.getMonth() === month.getMonth() && d.getFullYear() === month.getFullYear() && s.status === 'fechada';
    });
    return {
      month: month.toLocaleDateString('pt-BR', { month: 'short' }),
      revenue: monthSales.reduce((sum, s) => sum + (s.sale_value || 0), 0)
    };
  });

  const COLORS = ['#3b82f6', '#f59e0b', '#ef4444', '#10b981'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">📊 Dashboard Executivo de Vendas</h1>
            <p className="text-slate-600">Performance em tempo real com previsões de IA</p>
          </div>
          <Button
            onClick={predictClosingProbability}
            disabled={predicting}
            className="bg-indigo-600 hover:bg-indigo-700 gap-2"
          >
            {predicting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Analisando...
              </>
            ) : (
              <>
                <Brain className="w-4 h-4" />
                Prever com IA
              </>
            )}
          </Button>
        </div>

        {/* KPIs Principais */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Receita Realizada
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600 mb-2">
                R$ {totalRevenue.toLocaleString('pt-BR')}
              </div>
              <div className="text-xs text-slate-500">{salesThisMonth.length} vendas fechadas</div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Target className="w-4 h-4" />
                Meta do Mês
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 mb-2">
                {goalProgress.toFixed(0)}%
              </div>
              <Progress value={goalProgress} className="h-2 mb-2" />
              <div className="text-xs text-slate-500">
                Meta: R$ {goalTarget.toLocaleString('pt-BR')}
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Pipeline Ativo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600 mb-2">
                R$ {pipelineValue.toLocaleString('pt-BR')}
              </div>
              <div className="text-xs text-slate-500">
                {leads.filter(l => l.pipeline_stage !== 'lead' && l.pipeline_stage !== 'fechado').length} oportunidades
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Brain className="w-4 h-4" />
                Receita Prevista (IA)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600 mb-2">
                R$ {predictedRevenue.toLocaleString('pt-BR')}
              </div>
              <div className="text-xs text-slate-500">
                {predictions.length} leads analisados
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Evolução de Receita (6 meses)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} name="Receita" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Distribuição do Pipeline</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pipelineData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pipelineData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Previsões de IA */}
        {predictions.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-600" />
                Análise Preditiva de Fechamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {predictions
                  .sort((a, b) => b.probability - a.probability)
                  .slice(0, 10)
                  .map((pred) => (
                    <div key={pred.lead_id} className="p-4 bg-slate-50 rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900 mb-1">{pred.lead_name}</h3>
                          <p className="text-sm text-slate-600">{pred.company}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className={`text-2xl font-bold ${
                              pred.probability >= 70 ? 'text-green-600' :
                              pred.probability >= 40 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {pred.probability}%
                            </div>
                            <div className="text-xs text-slate-500">probabilidade</div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(createPageUrl('LeadProfile') + `?id=${pred.lead_id}`)}
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="font-medium text-slate-700 mb-1">💰 Valor Estimado</div>
                          <div className="text-green-600 font-semibold">
                            R$ {pred.estimated_value.toLocaleString('pt-BR')}
                          </div>
                        </div>
                        <div>
                          <div className="font-medium text-slate-700 mb-1">📍 Estágio Atual</div>
                          <Badge>{pred.current_stage}</Badge>
                        </div>
                      </div>

                      {pred.reason && (
                        <div className="mt-3 p-3 bg-white rounded border">
                          <div className="font-medium text-slate-700 mb-1 text-xs">💡 Análise da IA:</div>
                          <p className="text-sm text-slate-600">{pred.reason}</p>
                        </div>
                      )}

                      {pred.risk_factors?.length > 0 && (
                        <div className="mt-2">
                          <div className="font-medium text-red-600 mb-1 text-xs flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Fatores de Risco:
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {pred.risk_factors.map((risk, i) => (
                              <Badge key={i} variant="outline" className="text-xs text-red-600">
                                {risk}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {pred.recommended_actions?.length > 0 && (
                        <div className="mt-2">
                          <div className="font-medium text-blue-600 mb-1 text-xs flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            Ações Recomendadas:
                          </div>
                          <ul className="text-xs text-slate-600 space-y-1">
                            {pred.recommended_actions.map((action, i) => (
                              <li key={i} className="flex items-start gap-1">
                                <ChevronRight className="w-3 h-3 mt-0.5 text-blue-600" />
                                {action}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Leads Quentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Award className="w-5 h-5 text-orange-600" />
                Leads Prioritários (Alta Conversão)
              </span>
              <Badge className="bg-red-500">{hotLeads.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {hotLeads.slice(0, 6).map((lead) => (
                <Card 
                  key={lead.id} 
                  className="cursor-pointer hover:shadow-lg transition-all"
                  onClick={() => navigate(createPageUrl('LeadProfile') + `?id=${lead.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-sm">{lead.full_name}</h3>
                        <p className="text-xs text-slate-600">{lead.company}</p>
                      </div>
                      <Badge className="bg-orange-500">{lead.predictive_score}%</Badge>
                    </div>
                    {lead.estimated_deal_value && (
                      <div className="text-green-600 font-semibold text-sm">
                        R$ {lead.estimated_deal_value.toLocaleString('pt-BR')}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
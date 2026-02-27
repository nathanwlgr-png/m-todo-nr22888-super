import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { TrendingUp, AlertCircle, Activity, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ScoreAnalyticsDashboard({ client }) {
  // Mock histórico de scores (em produção vinha do banco)
  const scoreHistory = useMemo(() => {
    if (!client) return [];
    
    // Simula histórico dos últimos 6 meses
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
    const variation = client.purchase_score || 50;
    
    return months.map((month, i) => ({
      month,
      purchase_score: Math.max(10, variation - (5 - i) * 2 + Math.random() * 10),
      health_score: Math.max(10, (client.health_score || 60) - (3 - i) * 3 + Math.random() * 8),
      engagement_score: Math.max(10, (client.engagement_score || 45) - (4 - i) * 2.5 + Math.random() * 7),
    }));
  }, [client]);

  // Cálculo de churn risk
  const churnRisk = useMemo(() => {
    if (!client) return { risk: 'low', percentage: 0, factors: [] };
    
    let riskScore = 0;
    const factors = [];
    
    // Fator 1: Score de compra baixo
    if ((client.purchase_score || 0) < 30) {
      riskScore += 30;
      factors.push('Score de compra muito baixo');
    } else if ((client.purchase_score || 0) < 50) {
      riskScore += 15;
      factors.push('Score de compra abaixo da média');
    }
    
    // Fator 2: Health score
    if ((client.health_score || 0) < 40) {
      riskScore += 25;
      factors.push('Health score crítico');
    } else if ((client.health_score || 0) < 60) {
      riskScore += 10;
      factors.push('Health score baixo');
    }
    
    // Fator 3: Status frio
    if (client.status === 'frio') {
      riskScore += 35;
      factors.push('Cliente em status frio');
    } else if (client.status === 'morno') {
      riskScore += 15;
      factors.push('Cliente em status morno');
    }
    
    // Fator 4: Sem contato recente
    if (client.last_contact_date) {
      const daysAgo = Math.floor((new Date() - new Date(client.last_contact_date)) / (1000 * 60 * 60 * 24));
      if (daysAgo > 90) {
        riskScore += 25;
        factors.push(`Sem contato há ${daysAgo} dias`);
      } else if (daysAgo > 30) {
        riskScore += 10;
        factors.push(`Contato há ${daysAgo} dias`);
      }
    }
    
    // Fator 5: Engagement baixo
    if ((client.engagement_score || 0) < 30) {
      riskScore += 20;
      factors.push('Engajamento muito baixo');
    }
    
    const percentage = Math.min(100, riskScore);
    let risk = 'low';
    if (percentage > 70) risk = 'high';
    else if (percentage > 40) risk = 'medium';
    
    return { risk, percentage, factors: factors.slice(0, 3) };
  }, [client]);

  if (!client) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-slate-500">
          Selecione um cliente para visualizar análises
        </CardContent>
      </Card>
    );
  }

  const riskColor = {
    low: 'bg-green-50 border-green-200',
    medium: 'bg-yellow-50 border-yellow-200',
    high: 'bg-red-50 border-red-200'
  };

  const riskBadgeColor = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800'
  };

  return (
    <div className="space-y-6">
      {/* Tendências de Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Tendências de Scores (6 meses)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={scoreHistory} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" />
              <YAxis domain={[0, 100]} />
              <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }} />
              <Legend />
              <Line type="monotone" dataKey="purchase_score" stroke="#6366f1" name="Score Compra" strokeWidth={2} />
              <Line type="monotone" dataKey="health_score" stroke="#10b981" name="Health Score" strokeWidth={2} />
              <Line type="monotone" dataKey="engagement_score" stroke="#f59e0b" name="Engagement" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Previsão de Churn */}
      <Card className={`border-2 ${riskColor[churnRisk.risk]}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Risco de Churn
            </CardTitle>
            <Badge className={riskBadgeColor[churnRisk.risk]}>
              {churnRisk.percentage}%
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Barra de Risco */}
          <div>
            <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full transition-all ${
                  churnRisk.risk === 'high'
                    ? 'bg-red-500'
                    : churnRisk.risk === 'medium'
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
                }`}
                style={{ width: `${churnRisk.percentage}%` }}
              />
            </div>
            <p className="text-xs text-slate-600 mt-1">
              {churnRisk.risk === 'high' && '🔴 Risco Alto - Ação imediata recomendada'}
              {churnRisk.risk === 'medium' && '🟡 Risco Médio - Monitorar de perto'}
              {churnRisk.risk === 'low' && '🟢 Risco Baixo - Cliente saudável'}
            </p>
          </div>

          {/* Fatores */}
          {churnRisk.factors.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-700">Fatores de Risco:</p>
              <ul className="space-y-1">
                {churnRisk.factors.map((factor, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <span className="text-red-600 mt-0.5">•</span>
                    <span className="text-slate-700">{factor}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recomendações */}
          <div className="bg-white/50 rounded p-3 space-y-2">
            <p className="text-sm font-semibold text-slate-700">Ações Recomendadas:</p>
            {churnRisk.risk === 'high' && (
              <ul className="text-xs space-y-1 text-slate-600">
                <li>✓ Agendar ligação de reactivação urgente</li>
                <li>✓ Oferecer incentivo ou desconto exclusivo</li>
                <li>✓ Revisar qualidade do serviço</li>
              </ul>
            )}
            {churnRisk.risk === 'medium' && (
              <ul className="text-xs space-y-1 text-slate-600">
                <li>✓ Enviar conteúdo personalizado esta semana</li>
                <li>✓ Monitorar próximas interações</li>
                <li>✓ Apresentar novos produtos/benefícios</li>
              </ul>
            )}
            {churnRisk.risk === 'low' && (
              <ul className="text-xs space-y-1 text-slate-600">
                <li>✓ Manter contato regular e consistente</li>
                <li>✓ Explorar oportunidades de cross-sell</li>
                <li>✓ Aprofundar relacionamento estratégico</li>
              </ul>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Radar de Saúde */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-600" />
            Perfil de Saúde do Cliente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={[
              {
                metric: 'Score Compra',
                value: Math.round(client.purchase_score || 0),
                fullMark: 100
              },
              {
                metric: 'Health Score',
                value: Math.round(client.health_score || 0),
                fullMark: 100
              },
              {
                metric: 'Engajamento',
                value: Math.round(client.engagement_score || 0),
                fullMark: 100
              },
              {
                metric: 'Frequência',
                value: Math.min(100, (client.total_visits_count || 0) * 10),
                fullMark: 100
              },
              {
                metric: 'Valor',
                value: Math.min(100, (client.average_purchase_value || 0) / 1000),
                fullMark: 100
              }
            ]}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} />
              <Radar name="Saúde" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.6} />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* KPIs Rápidos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-slate-600 mb-1">Score Compra</p>
            <p className="text-2xl font-bold text-indigo-600">{Math.round(client.purchase_score || 0)}%</p>
            <p className="text-xs text-slate-500 mt-1">
              {(client.purchase_score || 0) >= 70 ? '📈 Excelente' : (client.purchase_score || 0) >= 50 ? '📊 Bom' : '📉 Baixo'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-slate-600 mb-1">Health Score</p>
            <p className="text-2xl font-bold text-green-600">{Math.round(client.health_score || 0)}%</p>
            <p className="text-xs text-slate-500 mt-1">
              {(client.health_score || 0) >= 70 ? '💪 Saudável' : (client.health_score || 0) >= 50 ? '⚠️ Atenção' : '🚨 Crítico'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-slate-600 mb-1">Risco Churn</p>
            <p className={`text-2xl font-bold ${
              churnRisk.risk === 'high' ? 'text-red-600' : 
              churnRisk.risk === 'medium' ? 'text-yellow-600' : 
              'text-green-600'
            }`}>
              {churnRisk.percentage}%
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {churnRisk.risk === 'high' ? '🔴 Alto' : churnRisk.risk === 'medium' ? '🟡 Médio' : '🟢 Baixo'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-slate-600 mb-1">Engajamento</p>
            <p className="text-2xl font-bold text-orange-600">{Math.round(client.engagement_score || 0)}%</p>
            <p className="text-xs text-slate-500 mt-1">
              {(client.engagement_score || 0) >= 60 ? '⚡ Ativo' : (client.engagement_score || 0) >= 40 ? '🔋 Moderado' : '💤 Baixo'}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
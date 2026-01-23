import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, Loader2, Calendar, DollarSign, Target, Sparkles, LineChart } from 'lucide-react';
import { toast } from 'sonner';

export default function AdvancedSalesForecast() {
  const [forecasting, setForecasting] = useState(false);
  const [forecast, setForecast] = useState(null);
  const [timeframe, setTimeframe] = useState('30d');

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list()
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['sales'],
    queryFn: () => base44.entities.Sale.list()
  });

  const { data: visits = [] } = useQuery({
    queryKey: ['visits'],
    queryFn: () => base44.entities.Visit.list()
  });

  const generateForecast = async () => {
    setForecasting(true);
    try {
      // Calculate historical metrics
      const now = new Date();
      const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const last90Days = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

      const recentSales = sales.filter(s => new Date(s.created_date) > last90Days);
      const totalRevenue = recentSales.reduce((sum, s) => sum + (s.sale_value || 0), 0);
      const avgDealSize = recentSales.length > 0 ? totalRevenue / recentSales.length : 0;
      
      const hotClients = clients.filter(c => c.status === 'quente').length;
      const warmClients = clients.filter(c => c.status === 'morno').length;
      
      const recentVisits = visits.filter(v => new Date(v.created_date) > last30Days).length;
      const scheduledVisits = visits.filter(v => v.status === 'agendada').length;

      const prompt = `Você é um analista de vendas B2B veterinário especializado em previsão.

**DADOS HISTÓRICOS (90 dias):**
- Total Vendas: ${recentSales.length}
- Receita Total: R$ ${totalRevenue.toLocaleString('pt-BR')}
- Ticket Médio: R$ ${avgDealSize.toLocaleString('pt-BR')}
- Taxa Fechamento: ${recentSales.length > 0 ? ((recentSales.filter(s => s.status === 'fechada').length / recentSales.length) * 100).toFixed(1) : 0}%

**PIPELINE ATUAL:**
- Total Clientes: ${clients.length}
- Clientes Quentes: ${hotClients}
- Clientes Mornos: ${warmClients}
- Visitas (30d): ${recentVisits}
- Visitas Agendadas: ${scheduledVisits}

**EQUIPAMENTOS PRINCIPAIS:**
${[...new Set(sales.map(s => s.equipment_name))].filter(Boolean).slice(0, 5).join(', ')}

**TIMEFRAME:** ${timeframe === '30d' ? '30 dias' : timeframe === '60d' ? '60 dias' : '90 dias'}

Use machine learning e análise preditiva para gerar previsão de vendas.

Retorne JSON:
{
  "predicted_revenue": 450000,
  "predicted_deals": 12,
  "confidence_level": 85,
  "best_case": 550000,
  "worst_case": 350000,
  "top_opportunities": [
    {
      "client_segment": "Hospitais veterinários",
      "equipment": "VG2",
      "potential_value": 120000,
      "probability": 75,
      "expected_close_days": 30
    }
  ],
  "growth_vs_last_period": 25,
  "key_drivers": ["Driver 1", "Driver 2", "Driver 3"],
  "risk_factors": ["Risco 1", "Risco 2"],
  "recommended_actions": ["Ação 1", "Ação 2", "Ação 3"],
  "monthly_breakdown": [
    {"month": "Mês 1", "revenue": 150000, "deals": 4},
    {"month": "Mês 2", "revenue": 180000, "deals": 5},
    {"month": "Mês 3", "revenue": 120000, "deals": 3}
  ],
  "conversion_funnel": {
    "hot_to_close": 65,
    "warm_to_hot": 35,
    "cold_to_warm": 15
  }
}`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            predicted_revenue: { type: "number" },
            predicted_deals: { type: "number" },
            confidence_level: { type: "number" },
            best_case: { type: "number" },
            worst_case: { type: "number" },
            top_opportunities: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  client_segment: { type: "string" },
                  equipment: { type: "string" },
                  potential_value: { type: "number" },
                  probability: { type: "number" },
                  expected_close_days: { type: "number" }
                }
              }
            },
            growth_vs_last_period: { type: "number" },
            key_drivers: { type: "array", items: { type: "string" } },
            risk_factors: { type: "array", items: { type: "string" } },
            recommended_actions: { type: "array", items: { type: "string" } },
            monthly_breakdown: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  month: { type: "string" },
                  revenue: { type: "number" },
                  deals: { type: "number" }
                }
              }
            },
            conversion_funnel: { type: "object" }
          }
        }
      });

      setForecast(result);
      toast.success('Previsão gerada com sucesso!');
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao gerar previsão');
    } finally {
      setForecasting(false);
    }
  };

  if (!forecast) {
    return (
      <Card className="p-4 bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
            <LineChart className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="font-bold">Previsão Avançada de Vendas</h4>
            <p className="text-xs text-white/80">Machine Learning + IA Preditiva</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3">
          {['30d', '60d', '90d'].map(tf => (
            <Button
              key={tf}
              size="sm"
              variant={timeframe === tf ? "default" : "outline"}
              onClick={() => setTimeframe(tf)}
              className={timeframe === tf ? "bg-white text-purple-700" : "bg-white/20 text-white border-white/30"}
            >
              {tf}
            </Button>
          ))}
        </div>

        <Button
          onClick={generateForecast}
          disabled={forecasting}
          className="w-full bg-white text-purple-700 hover:bg-white/90 font-bold"
        >
          {forecasting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Gerando previsão...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Gerar Previsão
            </>
          )}
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {/* Main Forecast */}
      <Card className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-300 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <h4 className="font-bold text-purple-900">Previsão {timeframe}</h4>
          </div>
          <Badge className="bg-purple-600 text-white">{forecast.confidence_level}% confiança</Badge>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-white rounded-lg p-3 text-center">
            <p className="text-xs text-slate-600 mb-1">Receita Prevista</p>
            <p className="text-2xl font-black text-purple-900">R$ {(forecast.predicted_revenue || 0).toLocaleString('pt-BR')}</p>
            <p className="text-xs text-green-600 mt-1">
              +{forecast.growth_vs_last_period}% vs período anterior
            </p>
          </div>
          <div className="bg-white rounded-lg p-3 text-center">
            <p className="text-xs text-slate-600 mb-1">Vendas Previstas</p>
            <p className="text-2xl font-black text-purple-900">{forecast.predicted_deals}</p>
            <p className="text-xs text-slate-500 mt-1">negócios</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-green-50 rounded-lg p-2 border border-green-200">
            <p className="text-xs text-green-700">Melhor Cenário</p>
            <p className="text-sm font-bold text-green-900">R$ {(forecast.best_case || 0).toLocaleString('pt-BR')}</p>
          </div>
          <div className="bg-red-50 rounded-lg p-2 border border-red-200">
            <p className="text-xs text-red-700">Pior Cenário</p>
            <p className="text-sm font-bold text-red-900">R$ {(forecast.worst_case || 0).toLocaleString('pt-BR')}</p>
          </div>
        </div>
      </Card>

      {/* Top Opportunities */}
      <Card className="p-3 bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200">
        <p className="text-sm font-bold text-orange-800 mb-2 flex items-center gap-1">
          <Target className="w-4 h-4" />
          Top Oportunidades
        </p>
        <div className="space-y-2">
          {forecast.top_opportunities?.slice(0, 3).map((opp, i) => (
            <div key={i} className="bg-white rounded-lg p-2">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-semibold text-slate-800">{opp.equipment}</p>
                <Badge className="bg-orange-600 text-white text-xs">{opp.probability}%</Badge>
              </div>
              <p className="text-xs text-slate-600">{opp.client_segment}</p>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-green-700 font-bold">R$ {(opp.potential_value || 0).toLocaleString('pt-BR')}</p>
                <p className="text-xs text-slate-500">{opp.expected_close_days} dias</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Monthly Breakdown */}
      <Card className="p-3 bg-blue-50 border-blue-200">
        <p className="text-sm font-bold text-blue-800 mb-2 flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          Breakdown Mensal
        </p>
        <div className="space-y-2">
          {forecast.monthly_breakdown?.map((month, i) => (
            <div key={i} className="flex items-center justify-between bg-white rounded-lg p-2">
              <span className="text-sm font-semibold text-slate-800">{month.month}</span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-600">{month.deals} vendas</span>
                <span className="text-sm font-bold text-blue-700">R$ {(month.revenue || 0).toLocaleString('pt-BR')}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Conversion Funnel */}
      <Card className="p-3 bg-green-50 border-green-200">
        <p className="text-sm font-bold text-green-800 mb-2">Taxa de Conversão Prevista</p>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-600">Quente → Fechado</span>
            <Badge className="bg-green-600 text-white">{forecast.conversion_funnel?.hot_to_close}%</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-600">Morno → Quente</span>
            <Badge className="bg-yellow-600 text-white">{forecast.conversion_funnel?.warm_to_hot}%</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-600">Frio → Morno</span>
            <Badge className="bg-blue-600 text-white">{forecast.conversion_funnel?.cold_to_warm}%</Badge>
          </div>
        </div>
      </Card>

      {/* Key Drivers */}
      <Card className="p-3 bg-indigo-50 border-indigo-200">
        <p className="text-xs font-bold text-indigo-700 mb-2">🚀 Drivers de Crescimento</p>
        {forecast.key_drivers?.map((driver, i) => (
          <p key={i} className="text-xs text-indigo-600">✓ {driver}</p>
        ))}
      </Card>

      {/* Risk Factors */}
      {forecast.risk_factors?.length > 0 && (
        <Card className="p-3 bg-red-50 border-red-200">
          <p className="text-xs font-bold text-red-700 mb-2">⚠️ Fatores de Risco</p>
          {forecast.risk_factors.map((risk, i) => (
            <p key={i} className="text-xs text-red-600">• {risk}</p>
          ))}
        </Card>
      )}

      {/* Recommended Actions */}
      <Card className="p-3 bg-purple-50 border-purple-200">
        <p className="text-xs font-bold text-purple-700 mb-2">📋 Ações Recomendadas</p>
        {forecast.recommended_actions?.map((action, i) => (
          <p key={i} className="text-xs text-purple-600">→ {action}</p>
        ))}
      </Card>

      <Button
        onClick={() => setForecast(null)}
        variant="outline"
        size="sm"
        className="w-full"
      >
        Nova Previsão
      </Button>
    </div>
  );
}
import React, { useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Target, AlertCircle, CheckCircle2 } from 'lucide-react';

// Dados de mercado reais (2024)
const MARKET_DATA = {
  sao_paulo: {
    total_establishments: 322246, // Total Brasil 2024
    sao_paulo_percentage: 0.26, // SP representa ~26% do mercado pet brasileiro
    clinics_with_lab_equipment: 0.35, // Estimativa: 35% das clínicas têm equipamento próprio
    market_size_billions: 75.4, // R$ 75,4 bi faturamento pet 2024
    growth_rate: 0.095, // 9,5% CAGR mercado veterinário
    avg_equipment_investment: 80000, // Média R$ 80k por equipamento
  },
  segmentation: {
    small_clinics: { percentage: 0.55, avg_revenue: 30000 },
    medium_clinics: { percentage: 0.30, avg_revenue: 80000 },
    hospitals: { percentage: 0.15, avg_revenue: 200000 }
  }
};

export default function MarketBenchmarkAnalysis() {
  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['sales'],
    queryFn: () => base44.entities.Sale.list(),
  });

  const analysis = useMemo(() => {
    // Calcular totais SP
    const totalClinicsSP = Math.round(
      MARKET_DATA.sao_paulo.total_establishments * MARKET_DATA.sao_paulo.sao_paulo_percentage
    );
    const clinicsWithEquipment = Math.round(totalClinicsSP * MARKET_DATA.sao_paulo.clinics_with_lab_equipment);
    const potentialMarket = totalClinicsSP - clinicsWithEquipment;

    // Análise dos clientes atuais
    const clientsByType = {
      small: clients.filter(c => 
        c.client_type === 'clinica_pequena' || c.client_type === 'sem_equipamento'
      ).length,
      medium: clients.filter(c => 
        c.client_type === 'clinica_media' || c.client_type === 'clinica_especializada'
      ).length,
      large: clients.filter(c => 
        c.client_type === 'hospital_veterinario' || c.client_type === 'laboratorio_terceirizado'
      ).length
    };

    // Market share aproximado
    const totalClients = clients.length;
    const marketShare = (totalClients / potentialMarket) * 100;

    // Análise de conversão
    const closedSales = sales.filter(s => s.status === 'fechada').length;
    const conversionRate = totalClients > 0 ? (closedSales / totalClients) * 100 : 0;

    // Potencial de receita não explorado
    const avgDealSize = sales.reduce((sum, s) => sum + (s.sale_value || 0), 0) / (sales.length || 1);
    const unrealizedRevenue = potentialMarket * avgDealSize * (MARKET_DATA.sao_paulo.clinics_with_lab_equipment);

    // Segmentação ideal vs real
    const idealSegmentation = {
      small: MARKET_DATA.segmentation.small_clinics.percentage * 100,
      medium: MARKET_DATA.segmentation.medium_clinics.percentage * 100,
      large: MARKET_DATA.segmentation.hospitals.percentage * 100
    };

    const currentSegmentation = {
      small: (clientsByType.small / totalClients) * 100 || 0,
      medium: (clientsByType.medium / totalClients) * 100 || 0,
      large: (clientsByType.large / totalClients) * 100 || 0
    };

    return {
      totalClinicsSP,
      clinicsWithEquipment,
      potentialMarket,
      marketShare,
      totalClients,
      closedSales,
      conversionRate,
      avgDealSize,
      unrealizedRevenue,
      clientsByType,
      idealSegmentation,
      currentSegmentation,
      recommendations: generateRecommendations(
        currentSegmentation, 
        idealSegmentation, 
        marketShare, 
        conversionRate
      )
    };
  }, [clients, sales]);

  return (
    <div className="space-y-4">
      {/* Market Overview */}
      <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          Panorama do Mercado - São Paulo
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-slate-600">Total de Clínicas</p>
            <p className="text-2xl font-bold text-slate-800">
              {analysis.totalClinicsSP.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-600">Com Equipamento</p>
            <p className="text-2xl font-bold text-green-700">
              {MARKET_DATA.sao_paulo.clinics_with_lab_equipment * 100}%
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-600">Mercado Potencial</p>
            <p className="text-2xl font-bold text-orange-700">
              {analysis.potentialMarket.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-600">Seu Market Share</p>
            <p className="text-2xl font-bold text-indigo-700">
              {analysis.marketShare.toFixed(2)}%
            </p>
          </div>
        </div>
      </Card>

      {/* Performance Metrics */}
      <Card className="p-4 bg-white border-slate-200">
        <h3 className="font-semibold text-slate-800 mb-3">Suas Métricas vs Mercado</h3>
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-slate-600">Taxa de Conversão</span>
              <span className="text-sm font-bold text-slate-800">
                {analysis.conversionRate.toFixed(1)}%
              </span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500"
                style={{ width: `${Math.min(analysis.conversionRate, 100)}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Meta mercado: 15-25%
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-slate-600">Ticket Médio</span>
              <span className="text-sm font-bold text-slate-800">
                R$ {(analysis.avgDealSize / 1000).toFixed(0)}k
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Média mercado: R$ 80k
            </p>
          </div>
        </div>
      </Card>

      {/* Segmentation Analysis */}
      <Card className="p-4 bg-white border-slate-200">
        <h3 className="font-semibold text-slate-800 mb-3">Segmentação: Ideal vs Real</h3>
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-slate-600">Clínicas Pequenas</span>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  Real: {analysis.currentSegmentation.small.toFixed(0)}%
                </Badge>
                <Badge className="bg-blue-100 text-blue-700 text-xs">
                  Ideal: {analysis.idealSegmentation.small}%
                </Badge>
              </div>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex">
              <div 
                className="h-full bg-blue-500"
                style={{ width: `${analysis.currentSegmentation.small}%` }}
              />
              <div 
                className="h-full bg-blue-200"
                style={{ width: `${Math.max(0, analysis.idealSegmentation.small - analysis.currentSegmentation.small)}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-slate-600">Clínicas Médias</span>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  Real: {analysis.currentSegmentation.medium.toFixed(0)}%
                </Badge>
                <Badge className="bg-green-100 text-green-700 text-xs">
                  Ideal: {analysis.idealSegmentation.medium}%
                </Badge>
              </div>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex">
              <div 
                className="h-full bg-green-500"
                style={{ width: `${analysis.currentSegmentation.medium}%` }}
              />
              <div 
                className="h-full bg-green-200"
                style={{ width: `${Math.max(0, analysis.idealSegmentation.medium - analysis.currentSegmentation.medium)}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-slate-600">Hospitais/Labs</span>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  Real: {analysis.currentSegmentation.large.toFixed(0)}%
                </Badge>
                <Badge className="bg-purple-100 text-purple-700 text-xs">
                  Ideal: {analysis.idealSegmentation.large}%
                </Badge>
              </div>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex">
              <div 
                className="h-full bg-purple-500"
                style={{ width: `${analysis.currentSegmentation.large}%` }}
              />
              <div 
                className="h-full bg-purple-200"
                style={{ width: `${Math.max(0, analysis.idealSegmentation.large - analysis.currentSegmentation.large)}%` }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* AI Recommendations */}
      <Card className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
        <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
          <Target className="w-5 h-5 text-orange-600" />
          Recomendações Estratégicas
        </h3>
        <div className="space-y-2">
          {analysis.recommendations.map((rec, idx) => (
            <div key={idx} className="flex items-start gap-2">
              {rec.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
              )}
              <p className="text-sm text-slate-700">{rec.text}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Unrealized Revenue */}
      <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
        <h3 className="font-semibold text-green-800 mb-2">Potencial Não Explorado</h3>
        <p className="text-3xl font-bold text-green-900">
          R$ {(analysis.unrealizedRevenue / 1000000).toFixed(1)}M
        </p>
        <p className="text-sm text-slate-600 mt-1">
          Baseado em {analysis.potentialMarket.toLocaleString()} clínicas ainda sem equipamento em SP
        </p>
      </Card>
    </div>
  );
}

function generateRecommendations(current, ideal, marketShare, conversionRate) {
  const recommendations = [];

  // Market share analysis
  if (marketShare < 0.5) {
    recommendations.push({
      type: 'warning',
      text: `Com ${marketShare.toFixed(2)}% de market share, há enorme espaço para crescimento. Foque em prospecção ativa e parcerias estratégicas.`
    });
  }

  // Conversion rate analysis
  if (conversionRate < 15) {
    recommendations.push({
      type: 'warning',
      text: `Taxa de conversão de ${conversionRate.toFixed(1)}% está abaixo da meta (15-25%). Melhore qualificação de leads e follow-up.`
    });
  } else {
    recommendations.push({
      type: 'success',
      text: `Ótima taxa de conversão (${conversionRate.toFixed(1)}%). Continue otimizando o processo de vendas.`
    });
  }

  // Segmentation analysis
  if (Math.abs(current.small - ideal.small) > 15) {
    recommendations.push({
      type: 'warning',
      text: `Ajuste foco em clínicas pequenas: você tem ${current.small.toFixed(0)}% vs ideal ${ideal.small}%.`
    });
  }

  if (Math.abs(current.medium - ideal.medium) > 10) {
    recommendations.push({
      type: 'warning',
      text: `Oportunidade em clínicas médias: você tem ${current.medium.toFixed(0)}% vs ideal ${ideal.medium}%. Maior ticket médio e fidelização.`
    });
  }

  if (current.large < 10) {
    recommendations.push({
      type: 'warning',
      text: 'Baixa presença em hospitais/labs grandes. Considere estratégia enterprise para contratos maiores.'
    });
  }

  return recommendations;
}
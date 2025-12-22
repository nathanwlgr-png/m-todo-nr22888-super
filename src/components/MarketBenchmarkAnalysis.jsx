import React, { useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Target, AlertCircle, CheckCircle2, DollarSign, Users, Award } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

// Dados de mercado reais - Equipamentos Laboratoriais Veterinários (2024)
// Foco: Hemograma, Bioquímico, Hemogásio, Imunofluorescência, Urinálise, PCR
const MARKET_DATA = {
  sao_paulo: {
    total_establishments: 322246, // Total Brasil 2024
    sao_paulo_percentage: 0.26, // SP representa ~26% do mercado pet brasileiro
    clinics_with_lab_equipment: 0.18, // Apenas 18% têm equipamento laboratorial próprio
    market_size_billions: 4.97, // US$ 4.97 bi mercado lab veterinário global
    growth_rate: 0.0958, // 9,58% CAGR laboratórios veterinários
    avg_equipment_investment: 85000, // Média R$ 85k por equipamento laboratorial
    equipment_types: {
      hemograma: { penetration: 0.12, avg_price: 65000 },
      bioquimico: { penetration: 0.15, avg_price: 95000 },
      hemogasio: { penetration: 0.03, avg_price: 120000 },
      imunofluorescencia: { penetration: 0.02, avg_price: 150000 },
      urinalise: { penetration: 0.08, avg_price: 45000 },
      pcr: { penetration: 0.01, avg_price: 200000 }
    }
  },
  segmentation: {
    small_clinics: { percentage: 0.55, avg_revenue: 30000, lab_likelihood: 0.05 },
    medium_clinics: { percentage: 0.30, avg_revenue: 80000, lab_likelihood: 0.25 },
    hospitals: { percentage: 0.15, avg_revenue: 200000, lab_likelihood: 0.60 }
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

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => base44.entities.Task.list(),
  });

  const { data: visits = [] } = useQuery({
    queryKey: ['visits'],
    queryFn: () => base44.entities.Visit.list(),
  });

  const analysis = useMemo(() => {
    // Calcular totais SP
    const totalClinicsSP = Math.round(
      MARKET_DATA.sao_paulo.total_establishments * MARKET_DATA.sao_paulo.sao_paulo_percentage
    );
    const clinicsWithEquipment = Math.round(totalClinicsSP * MARKET_DATA.sao_paulo.clinics_with_lab_equipment);
    const potentialMarket = totalClinicsSP - clinicsWithEquipment;

    // CAC - Custo de Aquisição de Cliente
    const totalMarketingCost = tasks.filter(t => t.type === 'email' || t.type === 'ligacao').length * 50; // Custo estimado por atividade
    const totalVisitCost = visits.length * 300; // Custo estimado por visita
    const totalAcquisitionCost = totalMarketingCost + totalVisitCost;
    const closedSales = sales.filter(s => s.status === 'fechada' || s.status === 'entregue');
    const cac = closedSales.length > 0 ? totalAcquisitionCost / closedSales.length : 0;
    const marketCAC = 8500; // Benchmark mercado

    // LTV - Lifetime Value
    const avgOrderValue = closedSales.reduce((sum, s) => sum + (s.sale_value || 0), 0) / (closedSales.length || 1);
    const avgCustomerLifespan = 5; // Anos (equipamento dura ~5 anos)
    const avgAnnualRevenue = avgOrderValue * 0.15; // 15% receita anual em insumos
    const ltv = avgOrderValue + (avgAnnualRevenue * avgCustomerLifespan);
    const marketLTV = 150000; // Benchmark mercado

    // LTV/CAC Ratio
    const ltvCacRatio = cac > 0 ? ltv / cac : 0;
    const healthyRatio = 3; // 3:1 é considerado saudável

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
    const closedSalesCount = closedSales.length;
    const conversionRate = totalClients > 0 ? (closedSalesCount / totalClients) * 100 : 0;

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

    // Vendas por tipo de equipamento
    const salesByEquipment = sales.reduce((acc, sale) => {
      const name = sale.equipment_name?.toLowerCase() || 'outros';
      let category = 'outros';
      
      if (name.includes('hemograma') || name.includes('hematolog')) category = 'hemograma';
      else if (name.includes('bioquim') || name.includes('bioq')) category = 'bioquimico';
      else if (name.includes('hemog') || name.includes('gasometr')) category = 'hemogasio';
      else if (name.includes('imuno') || name.includes('fluoresc')) category = 'imunofluorescencia';
      else if (name.includes('urin') || name.includes('eas')) category = 'urinalise';
      else if (name.includes('pcr') || name.includes('molecular')) category = 'pcr';
      
      if (!acc[category]) acc[category] = { count: 0, revenue: 0 };
      acc[category].count++;
      acc[category].revenue += sale.sale_value || 0;
      return acc;
    }, {});

    // Vendas por região de SP
    const salesByRegion = clients.reduce((acc, client) => {
      const city = client.city || 'Outras';
      let region = 'Interior';
      
      // Regiões principais de SP
      if (['São Paulo', 'Guarulhos', 'Osasco', 'São Bernardo'].includes(city)) region = 'Capital';
      else if (['Campinas', 'Sorocaba', 'Jundiaí', 'Piracicaba'].includes(city)) region = 'Campinas';
      else if (['Santos', 'São Vicente', 'Guarujá'].includes(city)) region = 'Litoral';
      else if (['São José dos Campos', 'Taubaté', 'Jacareí'].includes(city)) region = 'Vale do Paraíba';
      else if (['Marília', 'Bauru', 'Jaú', 'Lins'].includes(city)) region = 'Centro-Oeste';
      
      if (!acc[region]) acc[region] = { clients: 0, sales: 0, revenue: 0 };
      acc[region].clients++;
      
      const clientSales = sales.filter(s => s.client_id === client.id && (s.status === 'fechada' || s.status === 'entregue'));
      acc[region].sales += clientSales.length;
      acc[region].revenue += clientSales.reduce((sum, s) => sum + (s.sale_value || 0), 0);
      
      return acc;
    }, {});

    // Benchmarking competitivo
    const benchmarkData = Object.entries(MARKET_DATA.sao_paulo.equipment_types).map(([type, data]) => {
      const userSales = salesByEquipment[type] || { count: 0, revenue: 0 };
      const marketAvg = data.avg_price;
      const userAvg = userSales.count > 0 ? userSales.revenue / userSales.count : 0;
      
      return {
        equipment: type === 'hemograma' ? 'Hemograma' :
                   type === 'bioquimico' ? 'Bioquímico' :
                   type === 'hemogasio' ? 'Hemogásio' :
                   type === 'imunofluorescencia' ? 'Imunofluor.' :
                   type === 'urinalise' ? 'Urinálise' : 'PCR',
        'Você': userAvg / 1000,
        'Mercado': marketAvg / 1000,
        userSales: userSales.count,
        performance: userAvg > marketAvg ? 'acima' : userAvg > marketAvg * 0.9 ? 'na média' : 'abaixo'
      };
    });

    return {
      totalClinicsSP,
      clinicsWithEquipment,
      potentialMarket,
      marketShare,
      totalClients,
      closedSales: closedSalesCount,
      conversionRate,
      avgDealSize,
      unrealizedRevenue,
      clientsByType,
      idealSegmentation,
      currentSegmentation,
      cac,
      marketCAC,
      ltv,
      marketLTV,
      ltvCacRatio,
      healthyRatio,
      salesByEquipment,
      salesByRegion,
      benchmarkData,
      recommendations: generateRecommendations(
        currentSegmentation, 
        idealSegmentation, 
        marketShare, 
        conversionRate
      )
    };
  }, [clients, sales, tasks, visits]);

  return (
    <div className="space-y-4">
      {/* Market Overview */}
      <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          Mercado de Equipamentos Laboratoriais - SP
        </h3>
        <p className="text-xs text-slate-500 mb-3">
          Hemograma • Bioquímico • Hemogásio • Imunofluorescência • Urinálise • PCR
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-slate-600">Total de Clínicas SP</p>
            <p className="text-2xl font-bold text-slate-800">
              {analysis.totalClinicsSP.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-600">Com Lab Próprio</p>
            <p className="text-2xl font-bold text-green-700">
              {(MARKET_DATA.sao_paulo.clinics_with_lab_equipment * 100).toFixed(0)}%
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-600">Sem Equipamento</p>
            <p className="text-2xl font-bold text-orange-700">
              {analysis.potentialMarket.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-600">Seu Market Share</p>
            <p className="text-2xl font-bold text-indigo-700">
              {analysis.marketShare.toFixed(3)}%
            </p>
          </div>
        </div>
      </Card>

      {/* CAC & LTV */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-purple-600" />
            <h3 className="text-sm font-semibold text-slate-800">CAC</h3>
          </div>
          <p className="text-2xl font-bold text-purple-700">
            R$ {(analysis.cac / 1000).toFixed(1)}k
          </p>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-xs text-slate-500">Mercado: R$ {(analysis.marketCAC / 1000).toFixed(1)}k</span>
            {analysis.cac < analysis.marketCAC && (
              <Badge className="bg-green-100 text-green-700 text-xs ml-auto">✓ Melhor</Badge>
            )}
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-cyan-50 to-blue-50 border-cyan-200">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-cyan-600" />
            <h3 className="text-sm font-semibold text-slate-800">LTV</h3>
          </div>
          <p className="text-2xl font-bold text-cyan-700">
            R$ {(analysis.ltv / 1000).toFixed(0)}k
          </p>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-xs text-slate-500">Mercado: R$ {(analysis.marketLTV / 1000).toFixed(0)}k</span>
            {analysis.ltv > analysis.marketLTV && (
              <Badge className="bg-green-100 text-green-700 text-xs ml-auto">✓ Melhor</Badge>
            )}
          </div>
        </Card>
      </div>

      {/* LTV/CAC Ratio */}
      <Card className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-600" />
            <h3 className="font-semibold text-slate-800">Razão LTV/CAC</h3>
          </div>
          <p className="text-3xl font-bold text-amber-700">
            {analysis.ltvCacRatio.toFixed(1)}:1
          </p>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className={`h-full ${analysis.ltvCacRatio >= analysis.healthyRatio ? 'bg-green-500' : 'bg-orange-500'}`}
            style={{ width: `${Math.min((analysis.ltvCacRatio / 5) * 100, 100)}%` }}
          />
        </div>
        <p className="text-xs text-slate-500 mt-2">
          {analysis.ltvCacRatio >= analysis.healthyRatio 
            ? `✓ Excelente! Acima dos ${analysis.healthyRatio}:1 recomendados` 
            : `Meta saudável: ${analysis.healthyRatio}:1 ou superior`}
        </p>
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

      {/* Sales by Equipment Type Chart */}
      <Card className="p-4 bg-white border-slate-200">
        <h3 className="font-semibold text-slate-800 mb-3">Suas Vendas por Tipo de Equipamento</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={Object.entries(analysis.salesByEquipment).map(([type, data]) => ({
            name: type === 'hemograma' ? 'Hemograma' :
                  type === 'bioquimico' ? 'Bioquímico' :
                  type === 'hemogasio' ? 'Hemogásio' :
                  type === 'imunofluorescencia' ? 'Imunofluor.' :
                  type === 'urinalise' ? 'Urinálise' :
                  type === 'pcr' ? 'PCR' : 'Outros',
            vendas: data.count,
            receita: data.revenue / 1000
          }))}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} style={{ fontSize: '11px' }} />
            <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
            <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
            <Tooltip />
            <Legend />
            <Bar yAxisId="left" dataKey="vendas" fill="#6366f1" name="Nº Vendas" />
            <Bar yAxisId="right" dataKey="receita" fill="#10b981" name="Receita (R$ mil)" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Sales by Region Chart */}
      <Card className="p-4 bg-white border-slate-200">
        <h3 className="font-semibold text-slate-800 mb-3">Performance por Região de SP</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={Object.entries(analysis.salesByRegion).map(([region, data]) => ({
            region,
            clientes: data.clients,
            vendas: data.sales,
            receita: data.revenue / 1000
          }))}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="region" style={{ fontSize: '11px' }} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="clientes" fill="#3b82f6" name="Clientes" />
            <Bar dataKey="vendas" fill="#8b5cf6" name="Vendas" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Competitive Benchmarking */}
      <Card className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
        <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
          <Award className="w-5 h-5 text-indigo-600" />
          Benchmarking Competitivo
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={analysis.benchmarkData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="equipment" angle={-45} textAnchor="end" height={80} style={{ fontSize: '11px' }} />
            <YAxis label={{ value: 'Ticket Médio (R$ mil)', angle: -90, position: 'insideLeft', style: { fontSize: '11px' } }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="Você" fill="#6366f1" />
            <Bar dataKey="Mercado" fill="#94a3b8" />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-3 space-y-2">
          {analysis.benchmarkData.filter(d => d.userSales > 0).map((item, idx) => (
            <div key={idx} className="flex items-center justify-between text-sm">
              <span className="text-slate-600">{item.equipment}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">{item.userSales} vendas</span>
                <Badge className={
                  item.performance === 'acima' ? 'bg-green-100 text-green-700' :
                  item.performance === 'na média' ? 'bg-blue-100 text-blue-700' :
                  'bg-orange-100 text-orange-700'
                }>
                  {item.performance === 'acima' ? '↑ Acima' :
                   item.performance === 'na média' ? '→ Na média' : '↓ Abaixo'}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Equipment Penetration */}
      <Card className="p-4 bg-white border-slate-200">
        <h3 className="font-semibold text-slate-800 mb-3">Penetração por Tipo de Equipamento (SP)</h3>
        <div className="space-y-2">
          {Object.entries(MARKET_DATA.sao_paulo.equipment_types).map(([type, data]) => (
            <div key={type}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-600 capitalize">
                  {type === 'hemograma' ? '🩸 Hemograma' :
                   type === 'bioquimico' ? '🧪 Bioquímico' :
                   type === 'hemogasio' ? '💨 Hemogásio' :
                   type === 'imunofluorescencia' ? '🔬 Imunofluorescência' :
                   type === 'urinalise' ? '💧 Urinálise' : '🧬 PCR'}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-700">
                    {(data.penetration * 100).toFixed(0)}%
                  </span>
                  <span className="text-xs text-slate-500">
                    R$ {(data.avg_price / 1000).toFixed(0)}k
                  </span>
                </div>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
                  style={{ width: `${data.penetration * 100}%` }}
                />
              </div>
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
          {analysis.potentialMarket.toLocaleString()} clínicas sem lab próprio em SP (82%)
        </p>
        <p className="text-xs text-slate-500 mt-2">
          Crescimento mercado lab vet: 9,58% ao ano
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
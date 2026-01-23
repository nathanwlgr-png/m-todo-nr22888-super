import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Loader2 } from 'lucide-react';

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'];

export default function SalesTrendAnalyzer() {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  const { data: inventory = [] } = useQuery({
    queryKey: ['inventory-trends'],
    queryFn: async () => {
      try {
        return await base44.entities.MobVendedorInventory.list('-monthly_sales');
      } catch (error) {
        console.error('Erro ao buscar inventário:', error);
        return [];
      }
    },
    staleTime: 10 * 60 * 1000,
  });

  const analyzeTraits = async () => {
    setLoading(true);
    try {
      const salesData = inventory.map(item => ({
        name: item.equipment_name,
        vendas_mes: item.monthly_sales || 0,
        vendas_trimestre: item.quarterly_sales || 0,
        vendas_ano: item.yearly_sales || 0,
        receita_total: item.total_revenue || 0,
        estoque: item.stock_quantity || 0,
        categoria: item.category || 'Sem categoria'
      }));

      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `Analise os dados de vendas do mobVendedor e identifique:

DADOS DE VENDAS:
${JSON.stringify(salesData, null, 2)}

ANALISE SOLICITADA:
1. Produtos com maior tendência de crescimento
2. Produtos com vendas consistentes
3. Sazonalidade identificada
4. Categorias com melhor performance
5. Insights estratégicos principais

Retorne JSON:
{
  "top_products": [
    {"name": "Produto X", "vendas_mes": 100, "trend": "crescimento", "motivo": "razão"}
  ],
  "consistent_sellers": [
    {"name": "Produto", "media_vendas": 50, "estabilidade": "alta"}
  ],
  "seasonal_insights": [
    {"padrao": "descrição", "impacto": "percentual"}
  ],
  "category_performance": {
    "categoria": "score 0-100"
  },
  "strategic_insights": ["insight 1", "insight 2", "insight 3"]
}`,
        response_json_schema: {
          type: "object",
          properties: {
            top_products: { type: "array" },
            consistent_sellers: { type: "array" },
            seasonal_insights: { type: "array" },
            category_performance: { type: "object" },
            strategic_insights: { type: "array", items: { type: "string" } }
          }
        }
      });

      setAnalysis(analysis);
    } catch (error) {
      console.error('Erro na análise:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = inventory.slice(0, 10).map(item => ({
    name: item.equipment_name?.substring(0, 15),
    'Mês': item.monthly_sales || 0,
    'Trimestre': item.quarterly_sales || 0,
    'Ano': item.yearly_sales || 0
  }));

  const categoryData = Array.from(
    new Map(inventory.map(item => [
      item.category || 'Sem categoria',
      (inventory.filter(i => i.category === item.category).reduce((sum, i) => sum + (i.monthly_sales || 0), 0))
    ])).entries()
  ).map(([category, total]) => ({ name: category, value: total }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-6 h-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-slate-900">Tendências de Vendas</h2>
        </div>
        <Button
          onClick={analyzeTraits}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analisando...
            </>
          ) : (
            'Analisar com IA'
          )}
        </Button>
      </div>

      {/* Gráfico de Vendas */}
      {chartData.length > 0 && (
        <Card className="p-6 bg-white shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-4">📊 Vendas por Período (Top 10)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Mês" fill="#3b82f6" />
              <Bar dataKey="Trimestre" fill="#10b981" />
              <Bar dataKey="Ano" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Gráfico por Categoria */}
      {categoryData.length > 0 && (
        <Card className="p-6 bg-white shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-4">🏷️ Performance por Categoria</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Análise IA */}
      {analysis && (
        <div className="space-y-4">
          {/* Produtos com Crescimento */}
          {analysis.top_products && analysis.top_products.length > 0 && (
            <Card className="p-5 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
              <p className="text-sm font-semibold text-green-700 mb-3">🚀 Maior Tendência de Crescimento</p>
              <div className="space-y-2">
                {analysis.top_products.slice(0, 3).map((product, idx) => (
                  <div key={idx} className="p-2 bg-white rounded">
                    <p className="font-medium text-slate-800">{product.name}</p>
                    <p className="text-xs text-slate-600">{product.motivo}</p>
                    <Badge className="mt-1 bg-green-100 text-green-700 text-xs">{product.trend}</Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Vendedores Consistentes */}
          {analysis.consistent_sellers && analysis.consistent_sellers.length > 0 && (
            <Card className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <p className="text-sm font-semibold text-blue-700 mb-3">📈 Vendedores Consistentes</p>
              <div className="space-y-2">
                {analysis.consistent_sellers.slice(0, 3).map((seller, idx) => (
                  <div key={idx} className="p-2 bg-white rounded flex justify-between items-center">
                    <div>
                      <p className="font-medium text-slate-800">{seller.name}</p>
                      <p className="text-xs text-slate-600">Média: {seller.media_vendas} vendas/mês</p>
                    </div>
                    <Badge className="bg-blue-100 text-blue-700">{seller.estabilidade}</Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Insights Estratégicos */}
          {analysis.strategic_insights && analysis.strategic_insights.length > 0 && (
            <Card className="p-5 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
              <p className="text-sm font-semibold text-purple-700 mb-3">💡 Insights Estratégicos</p>
              <ul className="space-y-2">
                {analysis.strategic_insights.map((insight, idx) => (
                  <li key={idx} className="text-sm text-slate-700 flex gap-2">
                    <span className="text-purple-600">•</span>
                    {insight}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Sazonalidade */}
          {analysis.seasonal_insights && analysis.seasonal_insights.length > 0 && (
            <Card className="p-5 bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200">
              <p className="text-sm font-semibold text-orange-700 mb-3">📅 Padrões Sazonais</p>
              <div className="space-y-2">
                {analysis.seasonal_insights.map((seasonal, idx) => (
                  <div key={idx} className="p-2 bg-white rounded">
                    <p className="font-medium text-slate-800">{seasonal.padrao}</p>
                    <p className="text-xs text-slate-600">Impacto: {seasonal.impacto}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
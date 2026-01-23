import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Zap, Loader2 } from 'lucide-react';

export default function SalesForecastAI() {
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);

  const { data: inventory = [] } = useQuery({
    queryKey: ['inventory-forecast'],
    queryFn: async () => {
      try {
        return await base44.entities.MobVendedorInventory.list();
      } catch (error) {
        return [];
      }
    },
    staleTime: 10 * 60 * 1000,
  });

  const generateForecast = async () => {
    setLoading(true);
    try {
      const topProducts = inventory
        .sort((a, b) => (b.monthly_sales || 0) - (a.monthly_sales || 0))
        .slice(0, 5);

      const forecast = await base44.integrations.Core.InvokeLLM({
        prompt: `Baseado nos dados de vendas do mobVendedor, gere previsões para os próximos 3 meses:

DADOS HISTÓRICOS:
${topProducts.map(p => `- ${p.equipment_name}: ${p.monthly_sales || 0} vendas/mês (Receita: R$ ${p.total_revenue || 0})`).join('\n')}

PREVISÕES SOLICITADAS:
1. Previsão de vendas para cada um dos próximos 3 meses
2. Margem de confiança da previsão
3. Fatores que podem impactar (positiva e negativamente)
4. Recomendações de ações

Retorne JSON:
{
  "previsoes_mensais": [
    {"mes": "Fevereiro", "mes_numero": 2, "vendas_previstas": 150, "confianca": 85, "intervalo": [140, 160]},
    {"mes": "Março", "mes_numero": 3, "vendas_previstas": 160, "confianca": 80, "intervalo": [145, 175]},
    {"mes": "Abril", "mes_numero": 4, "vendas_previstas": 170, "confianca": 75, "intervalo": [150, 190]}
  ],
  "crescimento_esperado": "5% ao mês",
  "fatores_positivos": ["fator 1", "fator 2"],
  "fatores_negativos": ["fator 1", "fator 2"],
  "recomendacoes": ["ação 1", "ação 2", "ação 3"],
  "receita_prevista_trimestre": 150000
}`,
        response_json_schema: {
          type: "object",
          properties: {
            previsoes_mensais: { type: "array" },
            crescimento_esperado: { type: "string" },
            fatores_positivos: { type: "array", items: { type: "string" } },
            fatores_negativos: { type: "array", items: { type: "string" } },
            recomendacoes: { type: "array", items: { type: "string" } },
            receita_prevista_trimestre: { type: "number" }
          }
        }
      });

      setForecast(forecast);
    } catch (error) {
      console.error('Erro na previsão:', error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = forecast?.previsoes_mensais?.map(p => ({
    mes: p.mes,
    previsto: p.vendas_previstas,
    minimo: p.intervalo?.[0],
    maximo: p.intervalo?.[1]
  })) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Zap className="w-6 h-6 text-amber-600" />
          <h2 className="text-2xl font-bold text-slate-900">Previsão de Vendas</h2>
        </div>
        <Button
          onClick={generateForecast}
          disabled={loading}
          className="bg-amber-600 hover:bg-amber-700"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Gerando...
            </>
          ) : (
            'Gerar Previsão'
          )}
        </Button>
      </div>

      {forecast && (
        <div className="space-y-4">
          {/* Gráfico */}
          {chartData.length > 0 && (
            <Card className="p-6 bg-white shadow-sm">
              <h3 className="font-semibold text-slate-800 mb-4">📈 Vendas Previstas (3 Meses)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="minimo" stroke="#ef4444" strokeDasharray="5 5" name="Mínimo" />
                  <Line type="monotone" dataKey="previsto" stroke="#3b82f6" strokeWidth={2} name="Previsto" />
                  <Line type="monotone" dataKey="maximo" stroke="#10b981" strokeDasharray="5 5" name="Máximo" />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* Resumo */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <p className="text-xs text-green-600 font-semibold mb-1">Crescimento Esperado</p>
              <p className="text-2xl font-bold text-green-700">{forecast.crescimento_esperado}</p>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <p className="text-xs text-blue-600 font-semibold mb-1">Receita Prevista (Trim)</p>
              <p className="text-2xl font-bold text-blue-700">
                R$ {(forecast.receita_prevista_trimestre / 1000).toFixed(0)}k
              </p>
            </Card>
          </div>

          {/* Detalhes Mensais */}
          <Card className="p-4 bg-white shadow-sm">
            <h3 className="font-semibold text-slate-800 mb-3">📅 Previsões Mensais</h3>
            <div className="space-y-2">
              {forecast.previsoes_mensais?.map((mes, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-lg flex justify-between items-center">
                  <div>
                    <p className="font-medium text-slate-800">{mes.mes}</p>
                    <p className="text-xs text-slate-600">
                      {mes.intervalo?.[0]} - {mes.intervalo?.[1]} vendas
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-slate-900">{mes.vendas_previstas}</p>
                    <p className="text-xs text-slate-600">Confiança: {mes.confianca}%</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Fatores */}
          <div className="grid grid-cols-2 gap-4">
            {forecast.fatores_positivos && (
              <Card className="p-4 bg-green-50 border-green-200">
                <p className="text-sm font-semibold text-green-700 mb-2">✓ Fatores Positivos</p>
                <ul className="text-xs text-green-700 space-y-1">
                  {forecast.fatores_positivos.map((f, i) => (
                    <li key={i}>• {f}</li>
                  ))}
                </ul>
              </Card>
            )}
            {forecast.fatores_negativos && (
              <Card className="p-4 bg-red-50 border-red-200">
                <p className="text-sm font-semibold text-red-700 mb-2">⚠ Fatores Negativos</p>
                <ul className="text-xs text-red-700 space-y-1">
                  {forecast.fatores_negativos.map((f, i) => (
                    <li key={i}>• {f}</li>
                  ))}
                </ul>
              </Card>
            )}
          </div>

          {/* Recomendações */}
          {forecast.recomendacoes && (
            <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
              <p className="text-sm font-semibold text-purple-700 mb-3">💡 Recomendações de Ação</p>
              <ol className="space-y-2 list-decimal list-inside">
                {forecast.recomendacoes.map((rec, idx) => (
                  <li key={idx} className="text-sm text-slate-700">{rec}</li>
                ))}
              </ol>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
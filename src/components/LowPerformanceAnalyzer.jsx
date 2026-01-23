import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2 } from 'lucide-react';

export default function LowPerformanceAnalyzer() {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  const { data: inventory = [] } = useQuery({
    queryKey: ['inventory-low-performance'],
    queryFn: async () => {
      try {
        return await base44.entities.MobVendedorInventory.list();
      } catch (error) {
        return [];
      }
    },
    staleTime: 10 * 60 * 1000,
  });

  const analyzeLowPerformance = async () => {
    setLoading(true);
    try {
      const lowSellers = inventory
        .filter(item => (item.monthly_sales || 0) < 10)
        .slice(0, 10);

      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `Analise os produtos com baixo desempenho e sugira ações:

PRODUTOS COM BAIXO DESEMPENHO:
${lowSellers.map(p => `- ${p.equipment_name}: ${p.monthly_sales || 0} vendas/mês, Estoque: ${p.current_stock}, Preço: R$ ${p.price}`).join('\n')}

ANALISE SOLICITADA:
1. Por que esses produtos vendem pouco?
2. Produtos que devem ser descontinuados
3. Produtos com potencial (precisam de estratégia)
4. Ações recomendadas para cada categoria
5. Impacto financeiro de possíveis decisões

Retorne JSON:
{
  "problemas_identificados": [
    {"produto": "nome", "problema": "razão da baixa venda", "severidade": "alta/média/baixa"}
  ],
  "descontinuar": [
    {"produto": "nome", "motivo": "razão", "impacto": "percentual"}
  ],
  "potencial_crescimento": [
    {"produto": "nome", "potencial": "percentual", "estrategia": "ação"}
  ],
  "acoes_por_categoria": {
    "categoria": ["ação 1", "ação 2"]
  },
  "impacto_financeiro": {
    "descontinuar_total": 1000,
    "investir_em_marketing": 5000,
    "reposicionar_preco": 2000
  },
  "prioridade_acoes": ["ação 1", "ação 2", "ação 3"]
}`,
        response_json_schema: {
          type: "object",
          properties: {
            problemas_identificados: { type: "array" },
            descontinuar: { type: "array" },
            potencial_crescimento: { type: "array" },
            acoes_por_categoria: { type: "object" },
            impacto_financeiro: { type: "object" },
            prioridade_acoes: { type: "array", items: { type: "string" } }
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-red-600" />
          <h2 className="text-2xl font-bold text-slate-900">Produtos com Baixo Desempenho</h2>
        </div>
        <Button
          onClick={analyzeLowPerformance}
          disabled={loading}
          className="bg-red-600 hover:bg-red-700"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analisando...
            </>
          ) : (
            'Analisar'
          )}
        </Button>
      </div>

      {analysis && (
        <div className="space-y-4">
          {/* Problemas Identificados */}
          {analysis.problemas_identificados && (
            <Card className="p-5 bg-red-50 border-red-200">
              <p className="text-sm font-semibold text-red-700 mb-3">🚨 Problemas Identificados</p>
              <div className="space-y-2">
                {analysis.problemas_identificados.map((problem, idx) => (
                  <div key={idx} className="p-3 bg-white rounded">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-slate-800">{problem.produto}</p>
                        <p className="text-sm text-slate-600 mt-1">{problem.problema}</p>
                      </div>
                      <Badge className={
                        problem.severidade === 'alta' ? 'bg-red-600 text-white' :
                        problem.severidade === 'média' ? 'bg-yellow-600 text-white' :
                        'bg-orange-600 text-white'
                      }>
                        {problem.severidade}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Para Descontinuar */}
          {analysis.descontinuar && analysis.descontinuar.length > 0 && (
            <Card className="p-5 bg-orange-50 border-orange-200">
              <p className="text-sm font-semibold text-orange-700 mb-3">❌ Recomendação: Descontinuar</p>
              <div className="space-y-2">
                {analysis.descontinuar.map((item, idx) => (
                  <div key={idx} className="p-3 bg-white rounded flex justify-between">
                    <div>
                      <p className="font-medium text-slate-800">{item.produto}</p>
                      <p className="text-xs text-slate-600">{item.motivo}</p>
                    </div>
                    <span className="text-orange-700 font-semibold">{item.impacto}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Com Potencial */}
          {analysis.potencial_crescimento && analysis.potencial_crescimento.length > 0 && (
            <Card className="p-5 bg-blue-50 border-blue-200">
              <p className="text-sm font-semibold text-blue-700 mb-3">📈 Potencial de Crescimento</p>
              <div className="space-y-2">
                {analysis.potencial_crescimento.map((item, idx) => (
                  <div key={idx} className="p-3 bg-white rounded">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-slate-800">{item.produto}</p>
                        <p className="text-sm text-slate-600 mt-1">📌 {item.estrategia}</p>
                      </div>
                      <Badge className="bg-blue-100 text-blue-700">{item.potencial}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Ações Prioritárias */}
          {analysis.prioridade_acoes && (
            <Card className="p-5 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
              <p className="text-sm font-semibold text-purple-700 mb-3">⚡ Ações Prioritárias</p>
              <ol className="space-y-2 list-decimal list-inside">
                {analysis.prioridade_acoes.slice(0, 5).map((acao, idx) => (
                  <li key={idx} className="text-sm text-slate-700">{acao}</li>
                ))}
              </ol>
            </Card>
          )}

          {/* Impacto Financeiro */}
          {analysis.impacto_financeiro && (
            <Card className="p-5 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
              <p className="text-sm font-semibold text-green-700 mb-3">💰 Impacto Financeiro</p>
              <div className="grid grid-cols-1 gap-2">
                {Object.entries(analysis.impacto_financeiro).map(([key, value]) => (
                  <div key={key} className="p-2 bg-white rounded flex justify-between">
                    <p className="text-slate-700 capitalize">{key.replace(/_/g, ' ')}</p>
                    <p className="font-semibold text-slate-900">R$ {Number(value).toLocaleString('pt-BR')}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Ações por Categoria */}
          {analysis.acoes_por_categoria && Object.keys(analysis.acoes_por_categoria).length > 0 && (
            <Card className="p-5 bg-white shadow-sm">
              <p className="text-sm font-semibold text-slate-800 mb-3">📋 Ações Recomendadas por Categoria</p>
              <div className="space-y-3">
                {Object.entries(analysis.acoes_por_categoria).map(([categoria, acoes]) => (
                  <div key={categoria} className="p-3 bg-slate-50 rounded">
                    <p className="font-medium text-slate-800 mb-2">{categoria}</p>
                    <ul className="space-y-1">
                      {Array.isArray(acoes) && acoes.map((acao, idx) => (
                        <li key={idx} className="text-xs text-slate-700">• {acao}</li>
                      ))}
                    </ul>
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
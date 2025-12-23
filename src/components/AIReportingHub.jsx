import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Loader2, 
  Send,
  Clock,
  Download,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

export default function AIReportingHub() {
  const [activeTab, setActiveTab] = useState('custom');
  const [query, setQuery] = useState('');
  const [generating, setGenerating] = useState(false);
  const [report, setReport] = useState(null);
  const [autoReport, setAutoReport] = useState(null);
  const [predictive, setPredictive] = useState(null);

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      try {
        const data = await base44.entities.Client.list('-updated_date', 100);
        return data.filter(c => c && c.id && c.first_name && !c.is_deleted);
      } catch (error) {
        // Silenciar erros de clientes não encontrados
        if (error.message?.includes('not found')) {
          console.warn('Cliente deletado referenciado, ignorando');
        } else {
          console.error('Erro ao carregar clientes:', error);
        }
        return [];
      }
    },
    retry: 1,
    retryDelay: 500,
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['sales'],
    queryFn: async () => {
      try {
        const data = await base44.entities.Sale.list();
        return data.filter(s => s && s.id);
      } catch (error) {
        console.warn('Erro ao carregar vendas:', error);
        return [];
      }
    },
    retry: 1,
  });

  const { data: visits = [] } = useQuery({
    queryKey: ['all-visits'],
    queryFn: async () => {
      try {
        const data = await base44.entities.Visit.list();
        return data.filter(v => v && v.id);
      } catch (error) {
        console.warn('Erro ao carregar visitas:', error);
        return [];
      }
    },
    retry: 1,
  });

  // Gerar relatório customizado via linguagem natural
  const generateCustomReport = async () => {
    if (!query.trim()) {
      toast.error('Digite sua consulta');
      return;
    }

    setGenerating(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um analista de vendas especializado. Analise os dados fornecidos e responda à seguinte pergunta do usuário:

PERGUNTA: ${query}

DADOS DISPONÍVEIS:
- Total de clientes: ${clients.length}
- Clientes por status: Quentes ${clients.filter(c => c.status === 'quente').length}, Mornos ${clients.filter(c => c.status === 'morno').length}, Frios ${clients.filter(c => c.status === 'frio').length}
- Cidades únicas: ${[...new Set(clients.map(c => c.city))].filter(Boolean).length}
- Vendas totais: ${sales.length}
- Vendas fechadas: ${sales.filter(s => s.status === 'fechada' || s.status === 'entregue').length}
- Valor total em pipeline: R$ ${clients.reduce((sum, c) => sum + (c.projected_revenue || 0), 0).toLocaleString('pt-BR')}
- Visitas realizadas: ${visits.filter(v => v.status === 'realizada').length}
- Score médio dos clientes: ${(clients.reduce((sum, c) => sum + (c.purchase_score || 0), 0) / clients.length).toFixed(1)}%

Clientes por cidade:
${Object.entries(clients.reduce((acc, c) => {
  const city = c.city || 'Sem cidade';
  acc[city] = (acc[city] || 0) + 1;
  return acc;
}, {})).map(([city, count]) => `- ${city}: ${count} clientes`).join('\n')}

Forneça uma análise detalhada, estruturada e acionável em markdown. Inclua:
1. Resposta direta à pergunta
2. Insights principais (use bullet points)
3. Recomendações práticas
4. Métricas relevantes

Use formatação markdown para melhor legibilidade.`,
      });

      setReport({
        query,
        content: response,
        timestamp: new Date().toLocaleString('pt-BR')
      });
      toast.success('Relatório gerado!');
    } catch (error) {
      toast.error('Erro ao gerar relatório');
      console.error(error);
    } finally {
      setGenerating(false);
    }
  };

  // Gerar resumo automático diário/semanal
  const generateAutoSummary = async () => {
    setGenerating(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Gere um resumo executivo de vendas com insights de IA para hoje/esta semana.

DADOS ATUAIS:
- Total de clientes: ${clients.length}
- Pipeline total: R$ ${clients.reduce((sum, c) => sum + (c.projected_revenue || 0), 0).toLocaleString('pt-BR')}
- Clientes quentes: ${clients.filter(c => c.status === 'quente').length}
- Taxa de conversão: ${sales.length > 0 ? ((sales.filter(s => s.status === 'fechada').length / clients.length) * 100).toFixed(1) : 0}%
- Vendas fechadas: ${sales.filter(s => s.status === 'fechada' || s.status === 'entregue').length}
- Visitas esta semana: ${visits.filter(v => {
  const visitDate = new Date(v.scheduled_date);
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  return visitDate >= weekAgo;
}).length}

Forneça em markdown estruturado:
1. 📊 Resumo Executivo (3-4 linhas)
2. 🎯 Principais Conquistas
3. ⚠️ Alertas e Ações Necessárias
4. 💡 Insights de IA (padrões identificados)
5. 📈 Recomendações para os próximos dias

Use emojis e formatação clara.`,
      });

      setAutoReport({
        content: response,
        timestamp: new Date().toLocaleString('pt-BR')
      });
      toast.success('Resumo gerado!');
    } catch (error) {
      toast.error('Erro ao gerar resumo');
      console.error(error);
    } finally {
      setGenerating(false);
    }
  };

  // Gerar análise preditiva
  const generatePredictive = async () => {
    setGenerating(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um analista preditivo de vendas. Analise os dados e forneça previsões e identificação de riscos/oportunidades.

DADOS PARA ANÁLISE:
- Clientes totais: ${clients.length}
- Pipeline valor: R$ ${clients.reduce((sum, c) => sum + (c.projected_revenue || 0), 0).toLocaleString('pt-BR')}
- Distribuição: ${clients.filter(c => c.status === 'quente').length} quentes, ${clients.filter(c => c.status === 'morno').length} mornos, ${clients.filter(c => c.status === 'frio').length} frios
- Taxa de conversão histórica: ${sales.length > 0 ? ((sales.filter(s => s.status === 'fechada').length / clients.length) * 100).toFixed(1) : 0}%
- Score médio: ${(clients.reduce((sum, c) => sum + (c.purchase_score || 0), 0) / clients.length).toFixed(1)}%

Top cidades por clientes:
${Object.entries(clients.reduce((acc, c) => {
  const city = c.city || 'Sem cidade';
  acc[city] = (acc[city] || 0) + 1;
  return acc;
}, {})).sort(([,a], [,b]) => b - a).slice(0, 5).map(([city, count]) => `- ${city}: ${count}`).join('\n')}

Forneça análise preditiva em markdown com:
1. 🔮 Previsão de Vendas (próximos 30 dias)
2. 🎯 Oportunidades Identificadas (com scores)
3. ⚠️ Riscos Potenciais (clientes em risco de perda)
4. 📊 Tendências de Mercado
5. 💡 Ações Recomendadas (priorizadas)

Seja específico com números e probabilidades.`,
        response_json_schema: {
          type: "object",
          properties: {
            forecast: {
              type: "object",
              properties: {
                expected_sales: { type: "number" },
                revenue_estimate: { type: "number" },
                confidence: { type: "string" }
              }
            },
            opportunities: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  description: { type: "string" },
                  value: { type: "number" },
                  probability: { type: "number" }
                }
              }
            },
            risks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  description: { type: "string" },
                  impact: { type: "string" },
                  mitigation: { type: "string" }
                }
              }
            },
            trends: { type: "array", items: { type: "string" } },
            recommendations: { type: "array", items: { type: "string" } }
          }
        }
      });

      setPredictive({
        data: response,
        timestamp: new Date().toLocaleString('pt-BR')
      });
      toast.success('Análise preditiva concluída!');
    } catch (error) {
      toast.error('Erro ao gerar análise');
      console.error(error);
    } finally {
      setGenerating(false);
    }
  };

  const downloadReport = (content, filename) => {
    const blob = new Blob([typeof content === 'string' ? content : JSON.stringify(content, null, 2)], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-300 shadow-lg">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-slate-800">Relatórios IA Avançados</h3>
          <p className="text-xs text-slate-600">Análises preditivas e insights automatizados</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        <Button
          size="sm"
          variant={activeTab === 'custom' ? 'default' : 'outline'}
          onClick={() => setActiveTab('custom')}
          className="rounded-full whitespace-nowrap"
        >
          💬 Consulta Livre
        </Button>
        <Button
          size="sm"
          variant={activeTab === 'auto' ? 'default' : 'outline'}
          onClick={() => setActiveTab('auto')}
          className="rounded-full whitespace-nowrap"
        >
          📊 Resumo Diário
        </Button>
        <Button
          size="sm"
          variant={activeTab === 'predictive' ? 'default' : 'outline'}
          onClick={() => setActiveTab('predictive')}
          className="rounded-full whitespace-nowrap"
        >
          🔮 Preditiva
        </Button>
      </div>

      {/* Consulta Customizada */}
      {activeTab === 'custom' && (
        <div className="space-y-3">
          <Textarea
            placeholder="Digite sua pergunta em linguagem natural...&#10;Exemplos:&#10;- 'Quais cidades têm mais clientes quentes?'&#10;- 'Qual a taxa de conversão por região?'&#10;- 'Mostre o desempenho de vendas do último mês'"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="min-h-[100px]"
          />
          
          <Button
            onClick={generateCustomReport}
            disabled={generating || !query.trim()}
            className="w-full bg-indigo-600 hover:bg-indigo-700"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analisando...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Gerar Relatório
              </>
            )}
          </Button>

          {report && (
            <div className="p-4 bg-white rounded-lg border-2 border-indigo-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Badge className="bg-indigo-600">Relatório Gerado</Badge>
                  <span className="text-xs text-slate-500">{report.timestamp}</span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => downloadReport(report.content, 'relatorio_customizado')}
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown>{report.content}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Resumo Automático */}
      {activeTab === 'auto' && (
        <div className="space-y-3">
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-blue-600 mt-0.5" />
              <div className="text-xs text-blue-800">
                <p className="font-semibold mb-1">Resumos Automatizados</p>
                <p>Gere insights diários ou semanais com análise de IA sobre seu desempenho de vendas.</p>
              </div>
            </div>
          </div>

          <Button
            onClick={generateAutoSummary}
            disabled={generating}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Gerar Resumo Agora
              </>
            )}
          </Button>

          {autoReport && (
            <div className="p-4 bg-white rounded-lg border-2 border-blue-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-600">Resumo Executivo</Badge>
                  <span className="text-xs text-slate-500">{autoReport.timestamp}</span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => downloadReport(autoReport.content, 'resumo_executivo')}
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown>{autoReport.content}</ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Análise Preditiva */}
      {activeTab === 'predictive' && (
        <div className="space-y-3">
          <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-purple-600 mt-0.5" />
              <div className="text-xs text-purple-800">
                <p className="font-semibold mb-1">Análise Preditiva com IA</p>
                <p>Preveja tendências futuras, identifique oportunidades e riscos baseados em dados históricos.</p>
              </div>
            </div>
          </div>

          <Button
            onClick={generatePredictive}
            disabled={generating}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analisando...
              </>
            ) : (
              <>
                <TrendingUp className="w-4 h-4 mr-2" />
                Gerar Análise Preditiva
              </>
            )}
          </Button>

          {predictive && (
            <div className="space-y-3">
              {/* Forecast */}
              <div className="p-4 bg-white rounded-lg border-2 border-green-200">
                <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Previsão de Vendas (30 dias)
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2 bg-green-50 rounded">
                    <p className="text-xs text-green-600">Vendas Esperadas</p>
                    <p className="text-lg font-bold text-green-800">{predictive.data.forecast?.expected_sales || 0}</p>
                  </div>
                  <div className="p-2 bg-green-50 rounded">
                    <p className="text-xs text-green-600">Receita Estimada</p>
                    <p className="text-lg font-bold text-green-800">
                      R$ {(predictive.data.forecast?.revenue_estimate || 0).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-slate-600 mt-2">
                  Confiança: <span className="font-semibold">{predictive.data.forecast?.confidence}</span>
                </p>
              </div>

              {/* Oportunidades */}
              {predictive.data.opportunities?.length > 0 && (
                <div className="p-4 bg-white rounded-lg border-2 border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-2">🎯 Oportunidades Identificadas</h4>
                  <div className="space-y-2">
                    {predictive.data.opportunities.map((opp, idx) => (
                      <div key={idx} className="p-2 bg-blue-50 rounded border border-blue-200">
                        <p className="text-sm font-medium text-blue-900">{opp.description}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-blue-700">Valor: R$ {opp.value?.toLocaleString('pt-BR')}</span>
                          <Badge className="bg-blue-600 text-xs">{opp.probability}% prob.</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Riscos */}
              {predictive.data.risks?.length > 0 && (
                <div className="p-4 bg-white rounded-lg border-2 border-red-200">
                  <h4 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Riscos Potenciais
                  </h4>
                  <div className="space-y-2">
                    {predictive.data.risks.map((risk, idx) => (
                      <div key={idx} className="p-2 bg-red-50 rounded border border-red-200">
                        <p className="text-sm font-medium text-red-900">{risk.description}</p>
                        <p className="text-xs text-red-700 mt-1">Impacto: {risk.impact}</p>
                        <p className="text-xs text-slate-600 mt-1">
                          <span className="font-semibold">Mitigação:</span> {risk.mitigation}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tendências */}
              {predictive.data.trends?.length > 0 && (
                <div className="p-4 bg-white rounded-lg border-2 border-amber-200">
                  <h4 className="font-semibold text-amber-800 mb-2">📊 Tendências de Mercado</h4>
                  <ul className="space-y-1">
                    {predictive.data.trends.map((trend, idx) => (
                      <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                        <span className="text-amber-600">•</span>
                        {trend}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recomendações */}
              {predictive.data.recommendations?.length > 0 && (
                <div className="p-4 bg-white rounded-lg border-2 border-purple-200">
                  <h4 className="font-semibold text-purple-800 mb-2">💡 Ações Recomendadas</h4>
                  <ol className="space-y-1 list-decimal list-inside">
                    {predictive.data.recommendations.map((rec, idx) => (
                      <li key={idx} className="text-sm text-slate-700">{rec}</li>
                    ))}
                  </ol>
                </div>
              )}

              <Button
                size="sm"
                variant="outline"
                onClick={() => downloadReport(predictive.data, 'analise_preditiva')}
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2" />
                Baixar Análise Completa
              </Button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
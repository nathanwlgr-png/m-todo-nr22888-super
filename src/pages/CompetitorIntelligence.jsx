import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, TrendingUp, Target, Zap, RefreshCw, Download, Eye } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function CompetitorIntelligence() {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch market reports
  const { data: marketReports = [] } = useQuery({
    queryKey: ['market-intelligence-reports'],
    queryFn: async () => {
      try {
        return await base44.entities.MarketIntelligenceReport?.list?.() || [];
      } catch {
        return [];
      }
    },
    refetchInterval: 60000 // Atualiza a cada minuto
  });

  // Generate new report
  const generateReportMutation = useMutation({
    mutationFn: async () => {
      setIsGenerating(true);
      const response = await base44.functions.invoke('competitorMarketMonitor', {});
      return response.data;
    },
    onSuccess: (data) => {
      setIsGenerating(false);
      // Refetch reports
      setTimeout(() => window.location.reload(), 2000);
    },
    onError: (error) => {
      setIsGenerating(false);
      alert(`Erro ao gerar relatório: ${error.message}`);
    }
  });

  // Parse report data
  const parseReportContent = (content) => {
    try {
      return typeof content === 'string' ? JSON.parse(content) : content;
    } catch {
      return null;
    }
  };

  const selectedReportData = selectedReport ? parseReportContent(selectedReport.full_content) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900">🎯 Inteligência Competitiva</h1>
            <p className="text-slate-600 mt-2">Monitoramento em tempo real do mercado veterinário</p>
          </div>
          <Button
            onClick={() => generateReportMutation.mutate()}
            disabled={isGenerating || generateReportMutation.isPending}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            {isGenerating ? 'Analisando...' : 'Gerar Novo Relatório'}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Summary Cards */}
          {marketReports.slice(0, 1).map(report => {
            const data = parseReportContent(report.full_content);
            return (
              <React.Fragment key={report.id}>
                <Card className="bg-white border-l-4 border-blue-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-slate-600">Oportunidades</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-600">
                      {data?.market_overview?.opportunities?.length || 0}
                    </div>
                    <p className="text-xs text-slate-500 mt-2">Identificadas neste período</p>
                  </CardContent>
                </Card>

                <Card className="bg-white border-l-4 border-red-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-slate-600">Ameaças</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-red-600">
                      {data?.market_overview?.threats?.length || 0}
                    </div>
                    <p className="text-xs text-slate-500 mt-2">A monitorar</p>
                  </CardContent>
                </Card>

                <Card className="bg-white border-l-4 border-green-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-slate-600">Ações Imediatas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600">
                      {data?.market_overview?.immediate_actions?.length || 0}
                    </div>
                    <p className="text-xs text-slate-500 mt-2">Recomendadas</p>
                  </CardContent>
                </Card>

                <Card className="bg-white border-l-4 border-purple-500">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-slate-600">Competidores</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-purple-600">
                      {data?.market_overview?.competitors?.length || 0}
                    </div>
                    <p className="text-xs text-slate-500 mt-2">Em análise</p>
                  </CardContent>
                </Card>
              </React.Fragment>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Relatórios */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">📋 Relatórios</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {marketReports.length === 0 ? (
                  <p className="text-sm text-slate-500">Nenhum relatório gerado</p>
                ) : (
                  marketReports.map(report => (
                    <button
                      key={report.id}
                      onClick={() => setSelectedReport(report)}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        selectedReport?.id === report.id
                          ? 'bg-indigo-50 border-indigo-300'
                          : 'bg-white border-slate-200 hover:border-indigo-300'
                      }`}
                    >
                      <div className="font-sm font-semibold text-slate-900">{report.title}</div>
                      <div className="text-xs text-slate-500">{report.report_date}</div>
                      {report.is_pinned && (
                        <Badge className="mt-2 bg-yellow-100 text-yellow-800">Fixado</Badge>
                      )}
                    </button>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Detalhes do Relatório */}
          {selectedReportData && (
            <div className="lg:col-span-2 space-y-6">
              {/* Oportunidades */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-green-600" />
                    Oportunidades
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {selectedReportData.market_overview?.opportunities?.map((opp, idx) => (
                    <div key={idx} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-slate-900">{opp}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Ameaças */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    Ameaças
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {selectedReportData.market_overview?.threats?.map((threat, idx) => (
                    <div key={idx} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-slate-900">{threat}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Ações Imediatas */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-600" />
                    Ações Imediatas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-2">
                    {selectedReportData.market_overview?.immediate_actions?.map((action, idx) => (
                      <li key={idx} className="flex gap-3">
                        <span className="font-bold text-amber-600 min-w-[24px]">{idx + 1}.</span>
                        <span className="text-sm text-slate-900">{action}</span>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>

              {/* Competidores */}
              <Card>
                <CardHeader>
                  <CardTitle>🏢 Análise de Competidores</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedReportData.market_overview?.competitors?.map((comp, idx) => (
                    <div key={idx} className="p-4 border border-slate-200 rounded-lg">
                      <div className="font-semibold text-slate-900">{comp.name}</div>
                      <div className="text-sm text-slate-600 mt-1">
                        Market Share: {comp.market_share_estimate}
                      </div>
                      <div className="mt-3 space-y-2">
                        <div>
                          <p className="text-xs font-semibold text-slate-700 mb-1">Forças:</p>
                          <div className="flex flex-wrap gap-1">
                            {comp.strengths?.map((s, i) => (
                              <Badge key={i} variant="outline" className="text-xs">{s}</Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-700 mb-1">Fraquezas:</p>
                          <div className="flex flex-wrap gap-1">
                            {comp.weaknesses?.map((w, i) => (
                              <Badge key={i} variant="destructive" className="text-xs">{w}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Preços */}
              {selectedReportData.pricing_analysis?.price_benchmarks && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                      Benchmark de Preços
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="border-b">
                          <tr>
                            <th className="text-left py-2">Categoria</th>
                            <th className="text-left py-2">Marca</th>
                            <th className="text-right py-2">Preço</th>
                            <th className="text-center py-2">Garantia</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedReportData.pricing_analysis.price_benchmarks.map((item, idx) => (
                            <tr key={idx} className="border-b hover:bg-slate-50">
                              <td className="py-2 text-slate-700">{item.category}</td>
                              <td className="py-2 text-slate-700">{item.brand}</td>
                              <td className="py-2 text-right font-semibold text-slate-900">{item.price_brl}</td>
                              <td className="py-2 text-center text-slate-600">{item.warranty_months}m</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
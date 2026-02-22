import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TrendingUp, Search, FileText, Loader2, RefreshCw, Zap,
  Target, AlertTriangle, DollarSign, Package, Globe, ChevronDown, ChevronUp, Pin
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';

const COMPETITORS = ['IDEXX', 'Mindray', 'Heska', 'Horiba', 'Bioanalítica', 'Vet+i', 'Scil'];
const QUICK_QUESTIONS = [
  'Qual a percepção sobre VQ1 no interior de SP?',
  'Preços médios de analisadores bioquímicos no Brasil',
  'Estratégias de venda da IDEXX para clínicas pequenas',
  'Tendências do mercado vet para 2025-2026',
  'Como o Mindray está posicionando analisadores hematológicos?',
  'Oportunidades em hospitais veterinários de grande porte',
];

function ReportSection({ title, icon: Icon, content, color = 'indigo' }) {
  const [open, setOpen] = useState(false);
  if (!content) return null;
  return (
    <div className={`border border-${color}-100 rounded-lg overflow-hidden`}>
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center justify-between p-3 bg-${color}-50 hover:bg-${color}-100 transition-colors`}
      >
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 text-${color}-600`} />
          <span className={`font-medium text-sm text-${color}-800`}>{title}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>
      {open && (
        <div className="p-3 text-sm text-slate-700 prose prose-sm max-w-none">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}

export default function MarketIntelligenceDashboard() {
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState('');
  const [product, setProduct] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingType, setLoadingType] = useState('');
  const [queryResult, setQueryResult] = useState(null);
  const [weeklyReport, setWeeklyReport] = useState(null);
  const [activeTab, setActiveTab] = useState('query');

  const { data: savedReports = [], refetch: refetchReports } = useQuery({
    queryKey: ['market-intelligence-reports'],
    queryFn: () => base44.entities.MarketIntelligenceReport.list('-report_date', 10).catch(() => []),
  });

  const callMarket = async (type, extraParams = {}) => {
    setLoading(true);
    setLoadingType(type);
    try {
      const res = await base44.functions.invoke('marketIntelligenceQuery', {
        query, type, region, product, ...extraParams
      });
      const data = res.data;
      if (!data?.success) throw new Error(data?.error || 'Erro desconhecido');
      if (type === 'weekly_report') {
        setWeeklyReport(data.result);
        setActiveTab('report');
        refetchReports();
        toast.success('Relatório semanal gerado!');
      } else {
        setQueryResult(typeof data.result === 'string' ? data.result : JSON.stringify(data.result, null, 2));
        toast.success('Análise concluída!');
      }
    } catch (e) {
      toast.error('Erro: ' + e.message);
    } finally {
      setLoading(false);
      setLoadingType('');
    }
  };

  const loadSavedReport = (report) => {
    try {
      const parsed = JSON.parse(report.full_content);
      setWeeklyReport(parsed);
      setActiveTab('report');
    } catch {
      setQueryResult(report.summary);
      setActiveTab('query');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-700 rounded-xl p-4 text-white">
        <div className="flex items-center gap-2 mb-1">
          <Globe className="w-5 h-5 text-blue-200" />
          <h2 className="font-bold text-lg">Inteligência de Mercado</h2>
          <Badge className="bg-white/20 text-white text-xs ml-auto">🌐 Tempo Real</Badge>
        </div>
        <p className="text-blue-200 text-xs">Monitore concorrência, tendências e oportunidades do setor veterinário</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="query" className="text-xs">🔍 Consulta</TabsTrigger>
          <TabsTrigger value="report" className="text-xs">📊 Relatório</TabsTrigger>
          <TabsTrigger value="history" className="text-xs">📁 Histórico</TabsTrigger>
        </TabsList>

        {/* ── TAB CONSULTA ── */}
        <TabsContent value="query" className="space-y-3">
          {/* Perguntas rápidas */}
          <Card>
            <CardHeader className="pb-2 pt-3 px-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-500" /> Perguntas Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <div className="flex flex-wrap gap-1.5">
                {QUICK_QUESTIONS.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => setQuery(q)}
                    className="text-xs bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-full px-2.5 py-1 hover:bg-indigo-100 transition-colors text-left"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Input de consulta */}
          <Card>
            <CardContent className="pt-3 px-3 pb-3 space-y-2">
              <textarea
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Faça uma pergunta sobre o mercado veterinário... Ex: 'Qual a percepção sobre o VQ1 em Marília?' ou 'Preços médios de analisadores bioquímicos'"
                className="w-full text-sm border rounded-lg p-2.5 resize-none h-20 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={region}
                  onChange={e => setRegion(e.target.value)}
                  placeholder="Região (ex: Marília, SP)"
                  className="text-xs h-8"
                />
                <Input
                  value={product}
                  onChange={e => setProduct(e.target.value)}
                  placeholder="Produto/Concorrente"
                  className="text-xs h-8"
                />
              </div>
              <Button
                onClick={() => callMarket('query')}
                disabled={loading || !query.trim()}
                className="w-full bg-indigo-600 hover:bg-indigo-700 h-9 text-sm"
              >
                {loading && loadingType === 'query' ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Search className="w-4 h-4 mr-2" />}
                Analisar com IA + Internet
              </Button>
            </CardContent>
          </Card>

          {/* Análises rápidas por tipo */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { type: 'competitor_analysis', label: '🏆 Análise Concorrência', color: 'border-orange-200 bg-orange-50 text-orange-700' },
              { type: 'price_benchmark', label: '💰 Benchmark de Preços', color: 'border-green-200 bg-green-50 text-green-700' },
            ].map(({ type, label, color }) => (
              <button
                key={type}
                onClick={() => callMarket(type)}
                disabled={loading}
                className={`border rounded-lg p-3 text-xs font-medium text-left ${color} hover:opacity-80 transition-opacity disabled:opacity-50`}
              >
                {loading && loadingType === type ? <Loader2 className="w-3 h-3 animate-spin inline mr-1" /> : null}
                {label}
              </button>
            ))}
          </div>

          {/* Concorrentes rápidos */}
          <Card>
            <CardHeader className="pb-2 pt-3 px-3">
              <CardTitle className="text-sm">🏢 Analisar Concorrente</CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3">
              <div className="flex flex-wrap gap-1.5">
                {COMPETITORS.map(c => (
                  <button
                    key={c}
                    onClick={() => callMarket('competitor_analysis', { product: c })}
                    disabled={loading}
                    className="text-xs bg-slate-100 border border-slate-200 text-slate-700 rounded-lg px-3 py-1.5 hover:bg-slate-200 transition-colors disabled:opacity-50 font-medium"
                  >
                    {loading && loadingType === 'competitor_analysis' && product === c
                      ? <Loader2 className="w-3 h-3 animate-spin inline" />
                      : c}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Resultado da consulta */}
          {queryResult && (
            <Card className="border-indigo-200">
              <CardHeader className="pb-2 pt-3 px-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm text-indigo-700">📊 Resultado da Análise</CardTitle>
                  <button onClick={() => setQueryResult(null)} className="text-slate-400 hover:text-slate-600 text-xs">✕</button>
                </div>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <div className="prose prose-sm max-w-none text-sm">
                  <ReactMarkdown>{queryResult}</ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── TAB RELATÓRIO SEMANAL ── */}
        <TabsContent value="report" className="space-y-3">
          <Button
            onClick={() => callMarket('weekly_report')}
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 h-10 text-sm"
          >
            {loading && loadingType === 'weekly_report'
              ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Gerando relatório com IA + Internet...</>
              : <><RefreshCw className="w-4 h-4 mr-2" /> Gerar Novo Relatório Semanal</>}
          </Button>

          {weeklyReport && (
            <div className="space-y-2">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3">
                <h3 className="font-bold text-blue-800 text-sm">{weeklyReport.title}</h3>
                <p className="text-xs text-blue-700 mt-1">{weeklyReport.summary}</p>
              </div>

              <ReportSection title="📰 Notícias e Tendências" icon={TrendingUp} content={weeklyReport.news_trends} color="blue" />
              <ReportSection title="🏆 Análise da Concorrência" icon={Target} content={weeklyReport.competitor_analysis} color="orange" />
              <ReportSection title="🚀 Lançamentos de Produtos" icon={Package} content={weeklyReport.product_launches} color="purple" />
              <ReportSection title="💰 Análise de Preços" icon={DollarSign} content={weeklyReport.price_analysis} color="green" />
              <ReportSection title="🎯 Oportunidades" icon={Zap} content={weeklyReport.opportunities} color="emerald" />
              <ReportSection title="⚠️ Ameaças e Riscos" icon={AlertTriangle} content={weeklyReport.threats} color="red" />
              <ReportSection title="📊 Insights Estratégicos" icon={FileText} content={weeklyReport.strategic_insights} color="indigo" />

              {weeklyReport.key_actions?.length > 0 && (
                <Card className="border-emerald-200 bg-emerald-50">
                  <CardContent className="pt-3 px-3 pb-3">
                    <p className="font-semibold text-emerald-800 text-sm mb-2">✅ Ações Recomendadas</p>
                    <ul className="space-y-1">
                      {weeklyReport.key_actions.map((action, i) => (
                        <li key={i} className="text-xs text-emerald-700 flex items-start gap-1.5">
                          <span className="font-bold mt-0.5">{i + 1}.</span> {action}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {!weeklyReport && (
            <div className="text-center py-10 text-slate-400">
              <Globe className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="text-sm">Clique em "Gerar Relatório" para análise completa com dados da internet</p>
            </div>
          )}
        </TabsContent>

        {/* ── TAB HISTÓRICO ── */}
        <TabsContent value="history" className="space-y-2">
          {savedReports.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-sm">Nenhum relatório salvo ainda</p>
            </div>
          ) : (
            savedReports.map(report => (
              <button
                key={report.id}
                onClick={() => loadSavedReport(report)}
                className="w-full text-left border rounded-lg p-3 bg-white hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-sm text-slate-800">{report.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{report.summary}</p>
                  </div>
                  <Badge className="bg-blue-100 text-blue-700 text-xs shrink-0">{report.report_date}</Badge>
                </div>
              </button>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
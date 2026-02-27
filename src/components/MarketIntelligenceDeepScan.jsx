import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Globe, TrendingUp, Shield, DollarSign, Target, AlertCircle } from 'lucide-react';

export default function MarketIntelligenceDeepScan() {
  const [loading, setLoading] = useState(false);
  const [scan, setScan] = useState(null);
  const [activeSection, setActiveSection] = useState('tendencias');

  const runDeepScan = async () => {
    setLoading(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é analista de inteligência de mercado sênior especializado em equipamentos de diagnóstico veterinário no Brasil.

Execute um SCAN DE MERCADO PROFUNDO para a SEAMATY BRASIL (distribuidora de analisadores hematológicos, bioquímicos e de gasometria veterinária).

Contexto: Produtos principais: VBC-50A (hemograma), SMT-120VP (bioquímica), VG1/VG2 (gasometria), VQ1 (PCR), QT3 (bioquímica entry).
Mercado-alvo: clínicas veterinárias, hospitais veterinários, laboratórios de diagnóstico no Brasil.
Concorrentes principais: Heska, IDEXX, Mindray, Esoterix, Hospitex.

Analise com contexto atual (2025-2026):

1. TENDÊNCIAS DE MERCADO (3-5 anos)
2. REGULAMENTAÇÕES (MAPA, ANVISA, CFV, importações)
3. ANÁLISE DE CONCORRENTES com estratégias de contra-argumentação
4. INTELIGÊNCIA DE PRECIFICAÇÃO (benchmarks de mercado)
5. OPORTUNIDADES ESTRATÉGICAS IMEDIATAS

Responda em JSON detalhado:`,
        add_context_from_internet: true,
        response_json_schema: {
          type: 'object',
          properties: {
            data_analise: { type: 'string' },
            sumario_executivo: { type: 'string' },
            tendencias: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  titulo: { type: 'string' },
                  descricao: { type: 'string' },
                  impacto: { type: 'string' },
                  prazo: { type: 'string' },
                  acao_recomendada: { type: 'string' }
                }
              }
            },
            regulamentacoes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  orgao: { type: 'string' },
                  regulamento: { type: 'string' },
                  impacto: { type: 'string' },
                  status: { type: 'string' }
                }
              }
            },
            concorrentes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  nome: { type: 'string' },
                  pontos_fortes: { type: 'array', items: { type: 'string' } },
                  pontos_fracos: { type: 'array', items: { type: 'string' } },
                  preco_estimado: { type: 'string' },
                  contra_argumentos: { type: 'array', items: { type: 'string' } },
                  estrategia_vencer: { type: 'string' }
                }
              }
            },
            precificacao: {
              type: 'object',
              properties: {
                benchmark_mercado: { type: 'string' },
                posicionamento_seamaty: { type: 'string' },
                estrategia_preco: { type: 'string' },
                elasticidade_preco: { type: 'string' },
                oportunidades_preco: { type: 'array', items: { type: 'string' } }
              }
            },
            oportunidades_estrategicas: { type: 'array', items: { type: 'string' } }
          }
        }
      });
      setScan({ ...result, data_analise: new Date().toLocaleDateString('pt-BR') });
    } finally {
      setLoading(false);
    }
  };

  const sections = [
    { id: 'tendencias', label: '📈 Tendências', icon: TrendingUp },
    { id: 'regulamentacoes', label: '📋 Regulamentações', icon: Shield },
    { id: 'concorrentes', label: '⚔️ Concorrentes', icon: Target },
    { id: 'precificacao', label: '💰 Precificação', icon: DollarSign },
    { id: 'oportunidades', label: '🚀 Oportunidades', icon: Globe },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-semibold text-slate-800">🌐 IA 21/3 — Inteligência de Mercado Profunda</h3>
          <p className="text-sm text-slate-500">Scan completo: tendências, regulamentações, concorrentes e precificação</p>
        </div>
        <Button onClick={runDeepScan} disabled={loading} className="bg-purple-600 hover:bg-purple-700">
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Globe className="w-4 h-4 mr-2" />}
          {loading ? 'Analisando mercado...' : 'Executar Deep Scan'}
        </Button>
      </div>

      {loading && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-3" />
          <p className="text-purple-700 font-medium">Analisando mercado veterinário brasileiro...</p>
          <p className="text-purple-500 text-sm mt-1">Consultando tendências, regulamentações e dados competitivos</p>
        </div>
      )}

      {scan && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold text-lg">🌐 Deep Market Scan</p>
                <p className="text-purple-200 text-sm">Gerado em {scan.data_analise}</p>
              </div>
              <Badge className="bg-white text-purple-700">IA 21/3</Badge>
            </div>
            <p className="mt-3 text-sm opacity-90">{scan.sumario_executivo}</p>
          </div>

          {/* Navigation */}
          <div className="flex flex-wrap gap-2">
            {sections.map(s => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeSection === s.id ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Tendências */}
          {activeSection === 'tendencias' && (
            <div className="space-y-3">
              {(scan.tendencias || []).map((t, i) => (
                <Card key={i} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-slate-800 text-sm">{t.titulo}</span>
                          <Badge variant="outline" className="text-xs">{t.prazo}</Badge>
                          <Badge className={`text-xs ${t.impacto === 'alto' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{t.impacto}</Badge>
                        </div>
                        <p className="text-sm text-slate-600">{t.descricao}</p>
                        <p className="text-xs text-blue-600 mt-2 font-medium">💡 {t.acao_recomendada}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Regulamentações */}
          {activeSection === 'regulamentacoes' && (
            <div className="space-y-3">
              {(scan.regulamentacoes || []).map((r, i) => (
                <Card key={i} className="border-l-4 border-l-green-500">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className="bg-green-100 text-green-700 text-xs">{r.orgao}</Badge>
                          <Badge variant="outline" className="text-xs">{r.status}</Badge>
                        </div>
                        <p className="font-medium text-sm text-slate-800">{r.regulamento}</p>
                        <p className="text-sm text-slate-600 mt-1">{r.impacto}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Concorrentes */}
          {activeSection === 'concorrentes' && (
            <div className="space-y-4">
              {(scan.concorrentes || []).map((c, i) => (
                <Card key={i} className="border border-slate-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-bold text-slate-800">{c.nome}</span>
                      <Badge variant="outline">{c.preco_estimado}</Badge>
                    </div>
                    <div className="grid md:grid-cols-2 gap-3 mb-3">
                      <div>
                        <p className="text-xs font-semibold text-red-600 mb-1">⚠️ Pontos Fortes deles:</p>
                        {(c.pontos_fortes || []).map((pf, j) => <p key={j} className="text-xs text-slate-600">• {pf}</p>)}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-green-600 mb-1">✅ Fraquezas deles:</p>
                        {(c.pontos_fracos || []).map((pw, j) => <p key={j} className="text-xs text-slate-600">• {pw}</p>)}
                      </div>
                    </div>
                    <div className="bg-indigo-50 rounded p-3 border border-indigo-200">
                      <p className="text-xs font-semibold text-indigo-700 mb-2">⚔️ Como vencer {c.nome}:</p>
                      {(c.contra_argumentos || []).map((ca, j) => (
                        <p key={j} className="text-xs text-indigo-600">→ {ca}</p>
                      ))}
                    </div>
                    <p className="text-xs font-semibold text-purple-700 mt-2">🎯 {c.estrategia_vencer}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Precificação */}
          {activeSection === 'precificacao' && scan.precificacao && (
            <div className="space-y-3">
              <div className="grid md:grid-cols-2 gap-3">
                <Card className="border-l-4 border-l-green-500">
                  <CardContent className="p-4">
                    <p className="text-xs font-semibold text-slate-500 mb-1">Benchmark de Mercado</p>
                    <p className="text-sm text-slate-800">{scan.precificacao.benchmark_mercado}</p>
                  </CardContent>
                </Card>
                <Card className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <p className="text-xs font-semibold text-slate-500 mb-1">Posicionamento Seamaty</p>
                    <p className="text-sm text-slate-800">{scan.precificacao.posicionamento_seamaty}</p>
                  </CardContent>
                </Card>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-yellow-800 mb-1">💡 Estratégia de Precificação</p>
                <p className="text-sm text-yellow-700">{scan.precificacao.estrategia_preco}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-sm font-semibold text-slate-700 mb-2">Elasticidade: {scan.precificacao.elasticidade_preco}</p>
                <p className="text-xs font-semibold text-green-700 mb-2">Oportunidades de Precificação:</p>
                {(scan.precificacao.oportunidades_preco || []).map((o, i) => (
                  <p key={i} className="text-sm text-slate-600">• {o}</p>
                ))}
              </div>
            </div>
          )}

          {/* Oportunidades */}
          {activeSection === 'oportunidades' && (
            <div className="space-y-2">
              {(scan.oportunidades_estrategicas || []).map((o, i) => (
                <div key={i} className="flex items-start gap-3 bg-green-50 rounded-lg p-3 border border-green-200">
                  <span className="w-6 h-6 rounded-full bg-green-600 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">{i + 1}</span>
                  <p className="text-sm text-green-800">{o}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
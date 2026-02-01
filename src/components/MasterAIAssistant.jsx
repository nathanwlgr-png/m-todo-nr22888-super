import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, FileText, Loader2, Download, Sparkles, Globe, Database } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import { useAILimit } from '@/components/AILimitProtection';

export default function MasterAIAssistant({ client }) {
  const { limitReached, handleLimitError, quotaExceeded, checkQuotaBeforeCall, trackAICall } = useAILimit();
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState(null);
  const [activeTab, setActiveTab] = useState('search');

  const instantSearch = async (searchQuery = query) => {
    if (!searchQuery.trim()) {
      toast.error('Digite algo para pesquisar');
      return;
    }

    if (limitReached || quotaExceeded || !checkQuotaBeforeCall()) {
      toast.error('⚠️ Limite de IA atingido. Pesquisa indisponível.');
      return;
    }

    setSearching(true);
    
    try {

      trackAICall();
      
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `PESQUISA MASTER - Forneça informações COMPLETAS sobre: "${searchQuery}"

${client ? `CONTEXTO DO CLIENTE: ${client.first_name} - ${client.clinic_name || ''} - ${client.city || ''} - Interesse: ${client.equipment_interest || 'N/A'}` : ''}

FORNECA:
1. **Resumo Executivo** (2-3 parágrafos)
2. **Dados Técnicos e Especificações** (se aplicável)
3. **Estatísticas de Mercado** (números, tendências, crescimento)
4. **Casos de Sucesso Reais** (3-5 exemplos práticos)
5. **Comparativo com Concorrentes** (se relevante)
6. **Artigos Científicos/Técnicos** (referências)
7. **Preços e Valores de Mercado** (ranges)
8. **Tendências Futuras** (próximos 12-24 meses)
9. **Aplicações Práticas** (como usar no dia a dia)
10. **Fontes Confiáveis** (links, referências)

Seja EXTREMAMENTE DETALHADO e PRÁTICO. Use dados reais e atualizados.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            executive_summary: { type: "string" },
            technical_details: { type: "string" },
            market_statistics: { type: "string" },
            success_cases: { type: "string" },
            competitor_analysis: { type: "string" },
            scientific_articles: { type: "string" },
            pricing: { type: "string" },
            future_trends: { type: "string" },
            practical_applications: { type: "string" },
            sources: { type: "array", items: { type: "string" } }
          }
        }
      });

      setResults(result);
      setActiveTab('results');
      toast.success('Pesquisa concluída!');
    } catch (error) {
      console.error('Erro na pesquisa:', error);
      handleLimitError(error);
      toast.error(error.message?.includes('limit') ? '⚠️ Limite atingido' : 'Erro na pesquisa');
    } finally {
      setSearching(false);
    }
  };

  const generatePDF = () => {
    if (!results) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const maxWidth = pageWidth - (margin * 2);
    let y = margin;

    const addText = (text, fontSize = 10, isBold = false) => {
      doc.setFontSize(fontSize);
      doc.setFont(undefined, isBold ? 'bold' : 'normal');
      const lines = doc.splitTextToSize(text, maxWidth);
      
      lines.forEach(line => {
        if (y > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
        doc.text(line, margin, y);
        y += fontSize * 0.5;
      });
      y += 3;
    };

    // Título
    addText(`PESQUISA MASTER: ${query}`, 16, true);
    addText(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 9);
    y += 5;

    // Conteúdo
    if (results.executive_summary) {
      addText('RESUMO EXECUTIVO', 12, true);
      addText(results.executive_summary);
      y += 3;
    }

    if (results.technical_details) {
      addText('DADOS TÉCNICOS', 12, true);
      addText(results.technical_details);
      y += 3;
    }

    if (results.market_statistics) {
      addText('ESTATÍSTICAS DE MERCADO', 12, true);
      addText(results.market_statistics);
      y += 3;
    }

    if (results.success_cases) {
      addText('CASOS DE SUCESSO', 12, true);
      addText(results.success_cases);
      y += 3;
    }

    if (results.competitor_analysis) {
      addText('ANÁLISE COMPETITIVA', 12, true);
      addText(results.competitor_analysis);
      y += 3;
    }

    if (results.practical_applications) {
      addText('APLICAÇÕES PRÁTICAS', 12, true);
      addText(results.practical_applications);
      y += 3;
    }

    if (results.sources?.length > 0) {
      addText('FONTES E REFERÊNCIAS', 12, true);
      results.sources.forEach((source, idx) => {
        addText(`${idx + 1}. ${source}`, 9);
      });
    }

    const fileName = `Pesquisa_${query.substring(0, 30).replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.pdf`;
    doc.save(fileName);
    
    toast.success('PDF gerado!');
  };

  const quickSearches = [
    { label: 'Seamaty VG2 vs Concorrentes', query: 'Seamaty VG2 analisador hemogasometria comparativo concorrentes especificações técnicas' },
    { label: 'Mercado Veterinário BR', query: 'mercado veterinário Brasil 2024 2025 equipamentos diagnóstico tendências crescimento' },
    { label: 'Cases Seamaty', query: 'Seamaty casos de sucesso clientes veterinários resultados ROI' },
    { label: 'Artigos Científicos', query: 'hemogasometria veterinária artigos científicos estudos pesquisas' },
  ];

  return (
    <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-300">
      <div className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-orange-600" />
          <h3 className="font-bold text-orange-900">IA Master - Pesquisa Total</h3>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="search">
              <Search className="w-4 h-4 mr-1" />
              Pesquisar
            </TabsTrigger>
            <TabsTrigger value="results" disabled={!results}>
              <FileText className="w-4 h-4 mr-1" />
              Resultados
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Pesquise qualquer coisa: mercado, produtos, competidores..."
                className="flex-1"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !searching) {
                    instantSearch();
                  }
                }}
              />
              <Button
                onClick={() => instantSearch()}
                disabled={searching || limitReached || quotaExceeded}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {searching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold text-orange-700">Pesquisas Rápidas:</p>
              <div className="grid grid-cols-2 gap-2">
                {quickSearches.map((item, idx) => (
                  <Button
                    key={idx}
                    onClick={() => {
                      setQuery(item.query);
                      instantSearch(item.query);
                    }}
                    disabled={searching || limitReached || quotaExceeded}
                    variant="outline"
                    size="sm"
                    className="h-auto py-2 text-xs"
                  >
                    {item.label}
                  </Button>
                ))}
              </div>
            </div>

            {client && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-700 mb-2">
                  🎯 Pesquisas contextuais para {client.first_name}:
                </p>
                <div className="flex flex-col gap-1">
                  <Button
                    onClick={() => instantSearch(`Clínicas veterinárias ${client.city} equipamentos diagnóstico mercado análise`)}
                    disabled={searching || limitReached || quotaExceeded}
                    variant="outline"
                    size="sm"
                    className="text-xs h-8"
                  >
                    Mercado em {client.city}
                  </Button>
                  {client.equipment_interest && (
                    <Button
                      onClick={() => instantSearch(`${client.equipment_interest} especificações técnicas casos de sucesso preços`)}
                      disabled={searching || limitReached || quotaExceeded}
                      variant="outline"
                      size="sm"
                      className="text-xs h-8"
                    >
                      {client.equipment_interest} - Detalhes
                    </Button>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="results" className="space-y-3 max-h-[500px] overflow-y-auto">
            {results && (
              <>
                <div className="flex justify-end">
                  <Button
                    onClick={generatePDF}
                    size="sm"
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Baixar PDF
                  </Button>
                </div>

                {results.executive_summary && (
                  <div className="p-3 bg-white rounded-lg border">
                    <p className="text-xs font-semibold text-orange-700 mb-2">📋 RESUMO EXECUTIVO</p>
                    <p className="text-sm text-gray-700 whitespace-pre-line">{results.executive_summary}</p>
                  </div>
                )}

                {results.technical_details && (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs font-semibold text-blue-800 mb-2">🔧 DADOS TÉCNICOS</p>
                    <p className="text-sm text-gray-700 whitespace-pre-line">{results.technical_details}</p>
                  </div>
                )}

                {results.market_statistics && (
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-xs font-semibold text-green-800 mb-2">📊 ESTATÍSTICAS</p>
                    <p className="text-sm text-gray-700 whitespace-pre-line">{results.market_statistics}</p>
                  </div>
                )}

                {results.success_cases && (
                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <p className="text-xs font-semibold text-purple-800 mb-2">🏆 CASOS DE SUCESSO</p>
                    <p className="text-sm text-gray-700 whitespace-pre-line">{results.success_cases}</p>
                  </div>
                )}

                {results.competitor_analysis && (
                  <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-xs font-semibold text-red-800 mb-2">⚔️ ANÁLISE COMPETITIVA</p>
                    <p className="text-sm text-gray-700 whitespace-pre-line">{results.competitor_analysis}</p>
                  </div>
                )}

                {results.practical_applications && (
                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <p className="text-xs font-semibold text-amber-800 mb-2">💡 APLICAÇÕES PRÁTICAS</p>
                    <p className="text-sm text-gray-700 whitespace-pre-line">{results.practical_applications}</p>
                  </div>
                )}

                {results.sources && results.sources.length > 0 && (
                  <div className="p-3 bg-slate-50 rounded-lg border">
                    <p className="text-xs font-semibold text-slate-700 mb-2">🔗 FONTES</p>
                    <ul className="text-xs text-slate-600 space-y-1">
                      {results.sources.map((source, idx) => (
                        <li key={idx}>• {source}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  );
}
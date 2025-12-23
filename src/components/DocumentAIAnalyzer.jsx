import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Brain, Sparkles, FileSearch, ChevronUp, X } from 'lucide-react';
import { toast } from 'sonner';

export default function DocumentAIAnalyzer() {
  const [expanded, setExpanded] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState({ contract: null, proposal: null, others: [] });
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState({ contract: null, proposal: null, others: [] });

  useEffect(() => {
    const savedDocs = JSON.parse(localStorage.getItem('uploaded_documents') || '{}');
    setUploadedDocs(savedDocs);
  }, []);

  // IA 1: Análise de Contrato
  const analyzeContract = async () => {
    if (!uploadedDocs.contract) {
      toast.error('Nenhum contrato carregado');
      return;
    }

    setAnalyzing(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analise este contrato e extraia as seguintes informações chave:

ARQUIVO: ${uploadedDocs.contract.name}
URL: ${uploadedDocs.contract.url}

Por favor, extraia e estruture:
1. Partes envolvidas (contratante e contratado)
2. Objeto do contrato (o que está sendo contratado)
3. Valores e condições de pagamento
4. Datas importantes (início, término, vencimentos)
5. Cláusulas críticas ou restritivas
6. Multas e penalidades
7. Direitos e obrigações principais

Seja detalhado e específico.`,
        file_urls: [uploadedDocs.contract.url],
        response_json_schema: {
          type: "object",
          properties: {
            partes: { 
              type: "object",
              properties: {
                contratante: { type: "string" },
                contratado: { type: "string" }
              }
            },
            objeto: { type: "string" },
            valores: {
              type: "object",
              properties: {
                total: { type: "string" },
                forma_pagamento: { type: "string" }
              }
            },
            datas_importantes: {
              type: "array",
              items: { 
                type: "object",
                properties: {
                  tipo: { type: "string" },
                  data: { type: "string" },
                  descricao: { type: "string" }
                }
              }
            },
            clausulas_criticas: { type: "array", items: { type: "string" } },
            multas: { type: "string" },
            resumo_executivo: { type: "string" }
          }
        }
      });

      setAnalysisResults(prev => ({ ...prev, contract: result }));
      toast.success('✅ Contrato analisado!');
    } catch (error) {
      toast.error('Erro ao analisar contrato');
    } finally {
      setAnalyzing(false);
    }
  };

  // IA 2: Análise de Proposta
  const analyzeProposal = async () => {
    if (!uploadedDocs.proposal) {
      toast.error('Nenhuma proposta carregada');
      return;
    }

    setAnalyzing(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analise esta proposta comercial com olhar crítico e estratégico:

ARQUIVO: ${uploadedDocs.proposal.name}
URL: ${uploadedDocs.proposal.url}

Identifique e estruture:
1. Pontos Fortes: O que destaca esta proposta positivamente
2. Pontos Fracos: Gaps, informações faltantes ou aspectos que podem ser melhorados
3. Riscos Potenciais: Possíveis problemas ou armadilhas contratuais
4. Oportunidades: Aspectos que podem ser melhor explorados ou negociados
5. Clareza: Quão clara e compreensível é a proposta (nota 1-10)
6. Competitividade: Análise de custo-benefício (nota 1-10)
7. Recomendações: Sugestões práticas de melhoria

Seja objetivo e crítico.`,
        file_urls: [uploadedDocs.proposal.url],
        response_json_schema: {
          type: "object",
          properties: {
            pontos_fortes: { type: "array", items: { type: "string" } },
            pontos_fracos: { type: "array", items: { type: "string" } },
            riscos: { type: "array", items: { type: "string" } },
            oportunidades: { type: "array", items: { type: "string" } },
            clareza_nota: { type: "number" },
            clareza_justificativa: { type: "string" },
            competitividade_nota: { type: "number" },
            competitividade_justificativa: { type: "string" },
            recomendacoes: { type: "array", items: { type: "string" } },
            resumo_geral: { type: "string" }
          }
        }
      });

      setAnalysisResults(prev => ({ ...prev, proposal: result }));
      toast.success('✅ Proposta analisada!');
    } catch (error) {
      toast.error('Erro ao analisar proposta');
    } finally {
      setAnalyzing(false);
    }
  };

  // IA 3: Resumo de Múltiplos Documentos
  const summarizeOthers = async () => {
    if (!uploadedDocs.others || uploadedDocs.others.length === 0) {
      toast.error('Nenhum documento "outros" carregado');
      return;
    }

    setAnalyzing(true);
    try {
      const summaries = [];
      
      for (const doc of uploadedDocs.others) {
        const result = await base44.integrations.Core.InvokeLLM({
          prompt: `Analise este documento e crie um resumo conciso e estruturado:

ARQUIVO: ${doc.name}
URL: ${doc.url}

Gere um resumo com:
1. Tipo de documento (ex: relatório, apresentação, nota técnica, etc)
2. Tema principal
3. Pontos-chave (principais informações)
4. Informações críticas (datas, valores, decisões, etc)
5. Resumo executivo (2-3 frases)

Seja direto e informativo.`,
          file_urls: [doc.url],
          response_json_schema: {
            type: "object",
            properties: {
              tipo_documento: { type: "string" },
              tema_principal: { type: "string" },
              pontos_chave: { type: "array", items: { type: "string" } },
              informacoes_criticas: { type: "array", items: { type: "string" } },
              resumo_executivo: { type: "string" }
            }
          }
        });

        summaries.push({ ...result, nome_arquivo: doc.name });
      }

      setAnalysisResults(prev => ({ ...prev, others: summaries }));
      toast.success(`✅ ${summaries.length} documento(s) resumido(s)!`);
    } catch (error) {
      toast.error('Erro ao resumir documentos');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {/* Painel Expansível */}
      {expanded && (
        <Card className="mx-4 mb-2 p-4 bg-white shadow-2xl border-2 border-purple-200 max-h-[70vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">IA Análise de Documentos</h3>
                <p className="text-xs text-slate-500">Contratos, Propostas e Outros</p>
              </div>
            </div>
            <button onClick={() => setExpanded(false)} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          {/* Botões de Análise */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <Button 
              onClick={analyzeContract} 
              disabled={!uploadedDocs.contract || analyzing}
              className="h-20 flex flex-col items-center justify-center bg-gradient-to-br from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
            >
              <Brain className="w-6 h-6 mb-1" />
              <span className="text-xs">Analisar Contrato</span>
            </Button>

            <Button 
              onClick={analyzeProposal} 
              disabled={!uploadedDocs.proposal || analyzing}
              className="h-20 flex flex-col items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
            >
              <Sparkles className="w-6 h-6 mb-1" />
              <span className="text-xs">Analisar Proposta</span>
            </Button>

            <Button 
              onClick={summarizeOthers} 
              disabled={!uploadedDocs.others?.length || analyzing}
              className="h-20 flex flex-col items-center justify-center bg-gradient-to-br from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
            >
              <FileSearch className="w-6 h-6 mb-1" />
              <span className="text-xs">Resumir ({uploadedDocs.others?.length || 0})</span>
            </Button>
          </div>

          {analyzing && (
            <div className="text-center py-4">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <p className="text-sm text-slate-600 mt-2">Analisando com IA...</p>
            </div>
          )}

          {/* Resultados das Análises */}
          <div className="space-y-4">
            {analysisResults.contract && (
              <Card className="p-4 bg-green-50 border-green-200">
                <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  Análise do Contrato
                </h4>
                <div className="text-sm space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="font-semibold text-slate-700">Contratante:</p>
                      <p className="text-slate-600">{analysisResults.contract.partes?.contratante}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-700">Contratado:</p>
                      <p className="text-slate-600">{analysisResults.contract.partes?.contratado}</p>
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-700">Objeto:</p>
                    <p className="text-slate-600">{analysisResults.contract.objeto}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-700">Valor Total:</p>
                    <p className="text-slate-600">{analysisResults.contract.valores?.total}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-700">Resumo:</p>
                    <p className="text-slate-600 italic">{analysisResults.contract.resumo_executivo}</p>
                  </div>
                  {analysisResults.contract.datas_importantes?.length > 0 && (
                    <div>
                      <p className="font-semibold text-slate-700 mb-1">Datas Importantes:</p>
                      {analysisResults.contract.datas_importantes.map((d, i) => (
                        <p key={i} className="text-slate-600 ml-2">• {d.tipo}: {d.data} - {d.descricao}</p>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            )}

            {analysisResults.proposal && (
              <Card className="p-4 bg-blue-50 border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Análise da Proposta
                </h4>
                <div className="text-sm space-y-2">
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div className="bg-white rounded p-2">
                      <p className="font-semibold text-slate-700">Clareza</p>
                      <p className="text-2xl font-bold text-blue-600">{analysisResults.proposal.clareza_nota}/10</p>
                      <p className="text-xs text-slate-500">{analysisResults.proposal.clareza_justificativa}</p>
                    </div>
                    <div className="bg-white rounded p-2">
                      <p className="font-semibold text-slate-700">Competitividade</p>
                      <p className="text-2xl font-bold text-blue-600">{analysisResults.proposal.competitividade_nota}/10</p>
                      <p className="text-xs text-slate-500">{analysisResults.proposal.competitividade_justificativa}</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="font-semibold text-green-700 mb-1">✓ Pontos Fortes:</p>
                    {analysisResults.proposal.pontos_fortes?.map((p, i) => (
                      <p key={i} className="text-slate-600 ml-2">• {p}</p>
                    ))}
                  </div>
                  
                  <div>
                    <p className="font-semibold text-red-700 mb-1">⚠ Riscos:</p>
                    {analysisResults.proposal.riscos?.map((r, i) => (
                      <p key={i} className="text-slate-600 ml-2">• {r}</p>
                    ))}
                  </div>
                  
                  <div>
                    <p className="font-semibold text-yellow-700 mb-1">💡 Recomendações:</p>
                    {analysisResults.proposal.recomendacoes?.map((rec, i) => (
                      <p key={i} className="text-slate-600 ml-2">• {rec}</p>
                    ))}
                  </div>

                  <div className="bg-white rounded p-2 mt-2">
                    <p className="font-semibold text-slate-700">Resumo Geral:</p>
                    <p className="text-slate-600 italic">{analysisResults.proposal.resumo_geral}</p>
                  </div>
                </div>
              </Card>
            )}

            {analysisResults.others?.length > 0 && (
              <Card className="p-4 bg-purple-50 border-purple-200">
                <h4 className="font-semibold text-purple-800 mb-3 flex items-center gap-2">
                  <FileSearch className="w-4 h-4" />
                  Resumos dos Documentos ({analysisResults.others.length})
                </h4>
                <div className="space-y-3">
                  {analysisResults.others.map((doc, i) => (
                    <div key={i} className="bg-white rounded p-3 border border-purple-100">
                      <p className="font-semibold text-purple-900 mb-1">{doc.nome_arquivo}</p>
                      <p className="text-xs text-slate-500 mb-2">Tipo: {doc.tipo_documento}</p>
                      <p className="text-sm font-semibold text-slate-700">{doc.tema_principal}</p>
                      <p className="text-sm text-slate-600 italic mt-1">{doc.resumo_executivo}</p>
                      {doc.pontos_chave?.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-semibold text-slate-700">Pontos-chave:</p>
                          {doc.pontos_chave.slice(0, 3).map((p, j) => (
                            <p key={j} className="text-xs text-slate-600 ml-2">• {p}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </Card>
      )}

      {/* Botão Principal */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full h-16 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-700 hover:via-pink-700 hover:to-purple-700 text-white font-bold text-lg shadow-2xl flex items-center justify-center gap-3 transition-all"
      >
        <Sparkles className="w-6 h-6" />
        {expanded ? 'Fechar Análise IA' : 'Abrir Análise IA de Documentos'}
        {!expanded && <ChevronUp className="w-6 h-6" />}
      </button>
    </div>
  );
}
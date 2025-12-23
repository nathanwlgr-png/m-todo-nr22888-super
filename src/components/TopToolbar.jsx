import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Zap, Upload, FileText, ShieldCheck, 
  CheckCircle, AlertTriangle, Copy, X, Sparkles, Brain, FileSearch
} from 'lucide-react';
import { toast } from 'sonner';

export default function TopToolbar() {
  const [expandedSection, setExpandedSection] = useState(null);
  const [tokensRemaining] = useState(117000000);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadedDocs, setUploadedDocs] = useState({ contract: null, proposal: null, others: [] });
  const [status, setStatus] = useState({ ia1: 'idle', ia2: 'idle', ia3: 'idle' });
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState({ contract: null, proposal: null, others: [] });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-updated_date', 100),
    staleTime: 10 * 60 * 1000,
    retry: 1
  });

  // Upload de arquivos gerais
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const uploadedFile = {
        name: file.name,
        url: file_url,
        type: file.name.split('.').pop().toLowerCase(),
        uploaded_at: new Date().toISOString()
      };

      const newFiles = [...uploadedFiles, uploadedFile];
      setUploadedFiles(newFiles);
      localStorage.setItem('uploaded_docs', JSON.stringify(newFiles));
      toast.success(`${file.name} carregado!`);
    } catch (error) {
      toast.error('Erro ao fazer upload');
    } finally {
      setUploading(false);
    }
  };

  // Upload de documentos específicos
  const handleDocUpload = async (e, docType) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const uploadedFile = { name: file.name, url: file_url };

      const newDocs = { ...uploadedDocs };
      if (docType === 'contract') newDocs.contract = uploadedFile;
      else if (docType === 'proposal') newDocs.proposal = uploadedFile;
      else newDocs.others = [...(newDocs.others || []), uploadedFile];

      setUploadedDocs(newDocs);
      localStorage.setItem('uploaded_documents', JSON.stringify(newDocs));
      toast.success(`${file.name} carregado!`);
    } catch (error) {
      toast.error('Erro ao fazer upload');
    } finally {
      setUploading(false);
    }
  };

  const copyDocsToClipboard = async () => {
    const summary = `📋 DOCUMENTOS CARREGADOS\n\n` +
      `${uploadedDocs.contract ? '✅ Contrato: ' + uploadedDocs.contract.name : '❌ Contrato: não carregado'}\n` +
      `${uploadedDocs.proposal ? '✅ Proposta: ' + uploadedDocs.proposal.name : '❌ Proposta: não carregado'}\n` +
      `${uploadedDocs.others?.length > 0 ? `✅ Outros: ${uploadedDocs.others.length} arquivo(s)` : '❌ Outros: nenhum'}\n\n` +
      `Pronto para usar!`;
    
    await navigator.clipboard.writeText(summary);
    toast.success('📋 Copiado!');
  };

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
      toast.success('✅ Contrato analisado com sucesso!');
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
      toast.success('✅ Proposta analisada com sucesso!');
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

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      <div className="flex items-center justify-between px-4 py-2">
        {/* Seção 1: Tokens (Oito Esquerdo) */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => toggleSection('tokens')}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 transition-all"
          >
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
              <Zap className="w-3 h-3 text-white" />
            </div>
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-white text-xs font-bold">{Math.floor(tokensRemaining / 1000000)}M</span>
            </div>
          </button>
        </div>

        {/* Seção 2: Upload Geral (Oito Centro-Esquerdo) */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => toggleSection('upload')}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 transition-all"
          >
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
              <Upload className="w-3 h-3 text-white" />
            </div>
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-white text-xs font-bold">{uploadedFiles.length}</span>
            </div>
          </button>
        </div>

        {/* Seção 3: Documentos (Oito Centro-Direito) */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => toggleSection('docs')}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 transition-all"
          >
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
              <FileText className="w-3 h-3 text-white" />
            </div>
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-white text-xs font-bold">
                {(uploadedDocs.contract ? 1 : 0) + (uploadedDocs.proposal ? 1 : 0) + (uploadedDocs.others?.length || 0)}
              </span>
            </div>
          </button>
        </div>

        {/* Seção 4: IA Correção (Oito Direito) */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => toggleSection('ai')}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 transition-all"
          >
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
              <ShieldCheck className="w-3 h-3 text-white" />
            </div>
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
              {status.ia1 === 'completed' && status.ia2 === 'completed' && status.ia3 === 'completed' ? (
                <CheckCircle className="w-3 h-3 text-white" />
              ) : (
                <AlertTriangle className="w-3 h-3 text-white" />
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Painel Expansível */}
      {expandedSection && (
        <Card className="mx-4 mb-2 p-3 bg-white border shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-sm">
              {expandedSection === 'tokens' && '⚡ Tokens Restantes'}
              {expandedSection === 'upload' && '📤 Upload Geral'}
              {expandedSection === 'docs' && '📄 Documentos'}
              {expandedSection === 'ai' && '🤖 IA Correção'}
            </h3>
            <button onClick={() => setExpandedSection(null)}>
              <X className="w-4 h-4 text-slate-500" />
            </button>
          </div>

          {/* Conteúdo Tokens */}
          {expandedSection === 'tokens' && (
            <div className="text-center">
              <p className="text-2xl font-black text-orange-600">{Math.floor(tokensRemaining / 1000000)}M</p>
              <p className="text-xs text-slate-500">tokens restantes</p>
            </div>
          )}

          {/* Conteúdo Upload Geral */}
          {expandedSection === 'upload' && (
            <div className="space-y-2">
              <label className="block">
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={uploading}
                />
                <Button as="span" disabled={uploading} className="w-full cursor-pointer" size="sm">
                  {uploading ? '⏳ Enviando...' : '📁 Selecionar Arquivo'}
                </Button>
              </label>
              {uploadedFiles.length > 0 && (
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {uploadedFiles.map((file, i) => (
                    <div key={i} className="flex items-center gap-2 p-1 bg-slate-50 rounded text-xs">
                      <span>📄</span>
                      <p className="truncate flex-1">{file.name}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Conteúdo Documentos */}
          {expandedSection === 'docs' && (
            <div className="space-y-2">
              <div>
                <label className="text-xs text-slate-600 mb-1 block">📜 Contrato</label>
                <input type="file" onChange={(e) => handleDocUpload(e, 'contract')} className="text-xs w-full" disabled={uploading} />
                {uploadedDocs.contract && <p className="text-xs text-green-600 mt-1">✅ {uploadedDocs.contract.name}</p>}
              </div>
              <div>
                <label className="text-xs text-slate-600 mb-1 block">📋 Proposta</label>
                <input type="file" onChange={(e) => handleDocUpload(e, 'proposal')} className="text-xs w-full" disabled={uploading} />
                {uploadedDocs.proposal && <p className="text-xs text-green-600 mt-1">✅ {uploadedDocs.proposal.name}</p>}
              </div>
              <div>
                <label className="text-xs text-slate-600 mb-1 block">📁 Outros</label>
                <input type="file" onChange={(e) => handleDocUpload(e, 'others')} className="text-xs w-full" disabled={uploading} />
                {uploadedDocs.others?.length > 0 && (
                  <p className="text-xs text-green-600 mt-1">✅ {uploadedDocs.others.length} arquivo(s)</p>
                )}
              </div>
              <Button onClick={copyDocsToClipboard} variant="outline" className="w-full mb-2" size="sm">
                <Copy className="w-3 h-3 mr-1" />
                Copiar Resumo
              </Button>

              {/* Botões de Análise IA */}
              <div className="border-t pt-2 space-y-2">
                <p className="text-xs font-semibold text-slate-700 mb-1">🤖 Análises IA</p>
                
                <Button 
                  onClick={analyzeContract} 
                  disabled={!uploadedDocs.contract || analyzing}
                  variant="outline" 
                  className="w-full" 
                  size="sm"
                >
                  <Brain className="w-3 h-3 mr-1" />
                  {analyzing ? 'Analisando...' : 'Analisar Contrato'}
                </Button>

                <Button 
                  onClick={analyzeProposal} 
                  disabled={!uploadedDocs.proposal || analyzing}
                  variant="outline" 
                  className="w-full" 
                  size="sm"
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  {analyzing ? 'Analisando...' : 'Analisar Proposta'}
                </Button>

                <Button 
                  onClick={summarizeOthers} 
                  disabled={!uploadedDocs.others?.length || analyzing}
                  variant="outline" 
                  className="w-full" 
                  size="sm"
                >
                  <FileSearch className="w-3 h-3 mr-1" />
                  {analyzing ? 'Resumindo...' : `Resumir Outros (${uploadedDocs.others?.length || 0})`}
                </Button>
              </div>

              {/* Resultados das Análises */}
              {analysisResults.contract && (
                <div className="border-t pt-2 mt-2">
                  <p className="text-xs font-semibold text-green-700 mb-1">✅ Análise do Contrato</p>
                  <div className="bg-green-50 rounded p-2 text-xs space-y-1">
                    <p><strong>Contratante:</strong> {analysisResults.contract.partes?.contratante}</p>
                    <p><strong>Contratado:</strong> {analysisResults.contract.partes?.contratado}</p>
                    <p><strong>Valor:</strong> {analysisResults.contract.valores?.total}</p>
                    <p><strong>Resumo:</strong> {analysisResults.contract.resumo_executivo}</p>
                    {analysisResults.contract.datas_importantes?.length > 0 && (
                      <div>
                        <strong>Datas:</strong>
                        {analysisResults.contract.datas_importantes.map((d, i) => (
                          <p key={i} className="ml-2">• {d.tipo}: {d.data}</p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {analysisResults.proposal && (
                <div className="border-t pt-2 mt-2">
                  <p className="text-xs font-semibold text-blue-700 mb-1">✅ Análise da Proposta</p>
                  <div className="bg-blue-50 rounded p-2 text-xs space-y-1">
                    <p><strong>Clareza:</strong> {analysisResults.proposal.clareza_nota}/10</p>
                    <p><strong>Competitividade:</strong> {analysisResults.proposal.competitividade_nota}/10</p>
                    <div>
                      <strong>Pontos Fortes:</strong>
                      {analysisResults.proposal.pontos_fortes?.slice(0, 3).map((p, i) => (
                        <p key={i} className="ml-2 text-green-700">✓ {p}</p>
                      ))}
                    </div>
                    <div>
                      <strong>Riscos:</strong>
                      {analysisResults.proposal.riscos?.slice(0, 2).map((r, i) => (
                        <p key={i} className="ml-2 text-red-700">⚠ {r}</p>
                      ))}
                    </div>
                    <p className="text-slate-600 italic">{analysisResults.proposal.resumo_geral}</p>
                  </div>
                </div>
              )}

              {analysisResults.others?.length > 0 && (
                <div className="border-t pt-2 mt-2 max-h-48 overflow-y-auto">
                  <p className="text-xs font-semibold text-purple-700 mb-1">✅ Resumos dos Documentos</p>
                  {analysisResults.others.map((doc, i) => (
                    <div key={i} className="bg-purple-50 rounded p-2 text-xs mb-2">
                      <p className="font-semibold text-purple-900">{doc.nome_arquivo}</p>
                      <p><strong>Tipo:</strong> {doc.tipo_documento}</p>
                      <p className="text-slate-600 italic">{doc.resumo_executivo}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Conteúdo IA */}
          {expandedSection === 'ai' && (
            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
                <span>IA 1 - Dados</span>
                {status.ia1 === 'completed' ? <CheckCircle className="w-3 h-3 text-green-600" /> : <AlertTriangle className="w-3 h-3 text-yellow-600" />}
              </div>
              <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
                <span>IA 2 - Lógica</span>
                {status.ia2 === 'completed' ? <CheckCircle className="w-3 h-3 text-green-600" /> : <AlertTriangle className="w-3 h-3 text-yellow-600" />}
              </div>
              <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
                <span>IA 3 - Performance</span>
                {status.ia3 === 'completed' ? <CheckCircle className="w-3 h-3 text-green-600" /> : <AlertTriangle className="w-3 h-3 text-yellow-600" />}
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Zap, Upload, FileText, ShieldCheck, 
  CheckCircle, AlertTriangle, Copy, X
} from 'lucide-react';
import { toast } from 'sonner';

export default function TopToolbar() {
  const [expandedSection, setExpandedSection] = useState(null);
  const [tokensRemaining] = useState(117000000);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadedDocs, setUploadedDocs] = useState({ contract: null, proposal: null, others: [] });
  const [status, setStatus] = useState({ ia1: 'idle', ia2: 'idle', ia3: 'idle' });

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
              <Button onClick={copyDocsToClipboard} variant="outline" className="w-full" size="sm">
                <Copy className="w-3 h-3 mr-1" />
                Copiar Resumo
              </Button>
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
import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Zap, Upload, FileText, Copy, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

export default function QuickToolsPanel() {
  const [expanded, setExpanded] = useState(null);
  const [tokensRemaining] = useState(117000000);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadedDocs, setUploadedDocs] = useState({ contract: null, proposal: null, others: [] });

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const uploadedFile = { name: file.name, url: file_url, type: file.name.split('.').pop().toLowerCase(), uploaded_at: new Date().toISOString() };
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
      `${uploadedDocs.others?.length > 0 ? `✅ Outros: ${uploadedDocs.others.length} arquivo(s)` : '❌ Outros: nenhum'}\n\n`;
    await navigator.clipboard.writeText(summary);
    toast.success('📋 Copiado!');
  };

  return (
    <div className="mt-6 space-y-3">
      <h3 className="text-sm font-semibold text-slate-700 px-1">⚡ Ferramentas Rápidas</h3>
      
      {/* Tokens */}
      <Card className="overflow-hidden">
        <button
          onClick={() => setExpanded(expanded === 'tokens' ? null : 'tokens')}
          className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-slate-800">Tokens</p>
              <p className="text-xs text-slate-500">{Math.floor(tokensRemaining / 1000000)}M restantes</p>
            </div>
          </div>
          {expanded === 'tokens' ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </button>
        {expanded === 'tokens' && (
          <div className="p-4 border-t bg-slate-50">
            <div className="text-center">
              <p className="text-3xl font-black text-orange-600">{Math.floor(tokensRemaining / 1000000)}M</p>
              <p className="text-xs text-slate-500 mt-1">tokens disponíveis</p>
            </div>
          </div>
        )}
      </Card>

      {/* Upload Geral */}
      <Card className="overflow-hidden">
        <button
          onClick={() => setExpanded(expanded === 'upload' ? null : 'upload')}
          className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
              <Upload className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-slate-800">Upload Geral</p>
              <p className="text-xs text-slate-500">{uploadedFiles.length} arquivo(s)</p>
            </div>
          </div>
          {expanded === 'upload' ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </button>
        {expanded === 'upload' && (
          <div className="p-4 border-t bg-slate-50 space-y-2">
            <label className="block">
              <input type="file" onChange={handleFileUpload} className="hidden" disabled={uploading} />
              <Button as="span" disabled={uploading} className="w-full cursor-pointer" size="sm">
                {uploading ? '⏳ Enviando...' : '📁 Selecionar Arquivo'}
              </Button>
            </label>
            {uploadedFiles.length > 0 && (
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {uploadedFiles.map((file, i) => (
                  <div key={i} className="flex items-center gap-2 p-1 bg-white rounded text-xs">
                    <span>📄</span>
                    <p className="truncate flex-1">{file.name}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Documentos */}
      <Card className="overflow-hidden">
        <button
          onClick={() => setExpanded(expanded === 'docs' ? null : 'docs')}
          className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-slate-800">Documentos</p>
              <p className="text-xs text-slate-500">
                {(uploadedDocs.contract ? 1 : 0) + (uploadedDocs.proposal ? 1 : 0) + (uploadedDocs.others?.length || 0)} doc(s)
              </p>
            </div>
          </div>
          {expanded === 'docs' ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </button>
        {expanded === 'docs' && (
          <div className="p-4 border-t bg-slate-50 space-y-3">
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
              {uploadedDocs.others?.length > 0 && <p className="text-xs text-green-600 mt-1">✅ {uploadedDocs.others.length} arquivo(s)</p>}
            </div>
            <Button onClick={copyDocsToClipboard} variant="outline" className="w-full" size="sm">
              <Copy className="w-3 h-3 mr-1" />
              Copiar Resumo
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
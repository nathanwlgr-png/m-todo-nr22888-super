import React, { useState, useRef, useEffect } from 'react';
import Draggable from 'react-draggable';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FileText, X, Upload, CheckCircle, Copy } from 'lucide-react';
import { toast } from 'sonner';

export default function FloatingDocumentImporter() {
  const [expanded, setExpanded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState({ contract: null, proposal: null, others: [] });
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const timeoutRef = useRef(null);

  // Posição inicial: top right, abaixo do token counter
  const initialPosition = { x: window.innerWidth - 420, y: 180 };

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('uploaded_documents') || '{}');
    if (saved.contract || saved.proposal || saved.others?.length > 0) {
      setUploadedDocs(saved);
    }
  }, []);

  const handleDrag = (e, data) => {
    setPosition({ x: data.x, y: data.y });
    
    // Limpar timeout anterior
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    // Após 5 segundos, voltar para posição inicial
    timeoutRef.current = setTimeout(() => {
      setPosition({ x: 0, y: 0 });
    }, 5000);
  };

  const copyToClipboard = async () => {
    const summary = `📋 DOCUMENTOS CARREGADOS\n\n` +
      `${uploadedDocs.contract ? '✅ Contrato: ' + uploadedDocs.contract.name : '❌ Contrato: não carregado'}\n` +
      `${uploadedDocs.proposal ? '✅ Proposta: ' + uploadedDocs.proposal.name : '❌ Proposta: não carregado'}\n` +
      `${uploadedDocs.others?.length > 0 ? `✅ Outros: ${uploadedDocs.others.length} arquivo(s)` : '❌ Outros: nenhum'}\n\n` +
      `Pronto para usar!`;
    
    await navigator.clipboard.writeText(summary);
    toast.success('📋 Copiado para área de transferência!');
  };

  const handleFileUpload = async (e, docType) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setUploading(true);
    try {
      const uploadPromises = files.map(file => 
        base44.integrations.Core.UploadFile({ file })
      );

      const results = await Promise.all(uploadPromises);
      
      const newDocs = { ...uploadedDocs };
      
      results.forEach((result, i) => {
        const file = files[i];
        const fileType = file.name.split('.').pop().toLowerCase();
        const uploadedDoc = {
          name: file.name,
          url: result.file_url,
          type: fileType,
          uploaded_at: new Date().toISOString()
        };

        if (docType === 'contract') {
          newDocs.contract = uploadedDoc;
        } else if (docType === 'proposal') {
          newDocs.proposal = uploadedDoc;
        } else {
          newDocs.others = [...(newDocs.others || []), uploadedDoc];
        }
      });

      setUploadedDocs(newDocs);
      localStorage.setItem('uploaded_documents', JSON.stringify(newDocs));

      toast.success(`${files.length} documento(s) carregado(s)!`);
    } catch (error) {
      toast.error('Erro ao fazer upload');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Draggable 
      position={position}
      onDrag={handleDrag}
      defaultPosition={initialPosition}
    >
      <div className="fixed z-50 cursor-move" style={{ top: 180, right: 20 }}>
        {!expanded ? (
          <button
            onClick={() => setExpanded(true)}
            className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 shadow-2xl flex flex-col items-center justify-center hover:shadow-blue-500/50 transition-all active:scale-95"
            style={{ 
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation',
              padding: '28px'
            }}
          >
            <FileText className="w-10 h-10 text-white mb-1" />
            <span className="text-white text-xs font-bold">Docs</span>
          </button>
        ) : (
          <Card className="w-96 p-5 bg-white shadow-2xl border-2 border-blue-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800">Documentos</h3>
                  <p className="text-xs text-slate-600">Contrato + Proposta + Outros</p>
                </div>
              </div>
              <button 
                onClick={() => setExpanded(false)} 
                className="w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            {/* Contrato - NÃO SERÁ ALTERADO */}
            <div className="mb-4 p-3 bg-red-50 border-2 border-red-300 rounded-lg">
              <label className="block">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-red-700">📄 Contrato (NÃO ALTERA)</p>
                  {uploadedDocs.contract && <CheckCircle className="w-4 h-4 text-green-600" />}
                </div>
                <input
                  type="file"
                  onChange={(e) => handleFileUpload(e, 'contract')}
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  disabled={uploading}
                />
                <Button
                  as="span"
                  disabled={uploading}
                  className="w-full h-10 bg-red-600 hover:bg-red-700 cursor-pointer"
                  size="sm"
                >
                  {uploadedDocs.contract ? '✅ Carregado' : '📁 Carregar Contrato'}
                </Button>
              </label>
              {uploadedDocs.contract && (
                <p className="text-xs text-slate-600 mt-2 truncate">{uploadedDocs.contract.name}</p>
              )}
            </div>

            {/* Proposta - PODE SER OTIMIZADA */}
            <div className="mb-4 p-3 bg-green-50 border-2 border-green-300 rounded-lg">
              <label className="block">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-green-700">📋 Proposta (PODE OTIMIZAR)</p>
                  {uploadedDocs.proposal && <CheckCircle className="w-4 h-4 text-green-600" />}
                </div>
                <input
                  type="file"
                  onChange={(e) => handleFileUpload(e, 'proposal')}
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                  className="hidden"
                  disabled={uploading}
                />
                <Button
                  as="span"
                  disabled={uploading}
                  className="w-full h-10 bg-green-600 hover:bg-green-700 cursor-pointer"
                  size="sm"
                >
                  {uploadedDocs.proposal ? '✅ Carregado' : '📁 Carregar Proposta'}
                </Button>
              </label>
              {uploadedDocs.proposal && (
                <p className="text-xs text-slate-600 mt-2 truncate">{uploadedDocs.proposal.name}</p>
              )}
            </div>

            {/* Outros Documentos */}
            <div className="mb-4 p-3 bg-blue-50 border-2 border-blue-300 rounded-lg">
              <label className="block">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-blue-700">📎 Outros Docs</p>
                  {uploadedDocs.others?.length > 0 && (
                    <span className="text-xs font-bold text-blue-700">{uploadedDocs.others.length}</span>
                  )}
                </div>
                <input
                  type="file"
                  multiple
                  onChange={(e) => handleFileUpload(e, 'others')}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.png,.jpg"
                  className="hidden"
                  disabled={uploading}
                />
                <Button
                  as="span"
                  disabled={uploading}
                  className="w-full h-10 bg-blue-600 hover:bg-blue-700 cursor-pointer"
                  size="sm"
                >
                  {uploading ? '⏳ Enviando...' : '📁 Adicionar Múltiplos'}
                </Button>
              </label>
              {uploadedDocs.others?.length > 0 && (
                <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                  {uploadedDocs.others.map((doc, i) => (
                    <div key={i} className="text-xs text-slate-600 truncate bg-white p-1 rounded">
                      📄 {doc.name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button
              onClick={copyToClipboard}
              variant="outline"
              className="w-full h-10 mb-2"
              size="sm"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copiar Resumo
            </Button>

            <p className="text-xs text-slate-500 text-center">
              PDF, Word, Excel, CSV, Imagens
            </p>
          </Card>
        )}
      </div>
    </Draggable>
  );
}
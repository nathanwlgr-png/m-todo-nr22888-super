import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FileText, FileSpreadsheet, Upload, X, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function UniversalFileUploader() {
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [expanded, setExpanded] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileType = file.name.split('.').pop().toLowerCase();
    const allowedTypes = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'txt'];
    
    if (!allowedTypes.includes(fileType)) {
      toast.error('Tipo de arquivo não suportado');
      return;
    }

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      const uploadedFile = {
        name: file.name,
        url: file_url,
        type: fileType,
        uploaded_at: new Date().toISOString()
      };

      setUploadedFiles(prev => [...prev, uploadedFile]);
      
      // Salvar no localStorage para persistência
      const saved = JSON.parse(localStorage.getItem('uploaded_docs') || '[]');
      saved.push(uploadedFile);
      localStorage.setItem('uploaded_docs', JSON.stringify(saved));

      toast.success(`${file.name} carregado!`, {
        description: 'Arquivo disponível para uso'
      });

    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao fazer upload');
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (index) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(newFiles);
    localStorage.setItem('uploaded_docs', JSON.stringify(newFiles));
    toast.success('Arquivo removido');
  };

  React.useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('uploaded_docs') || '[]');
    setUploadedFiles(saved);
  }, []);

  const getFileIcon = (type) => {
    if (['pdf'].includes(type)) return '📄';
    if (['doc', 'docx'].includes(type)) return '📝';
    if (['xls', 'xlsx', 'csv'].includes(type)) return '📊';
    return '📁';
  };

  return (
    <>
      {/* Compact Button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 shadow-lg flex items-center justify-center hover:shadow-xl transition-all"
      >
        <Upload className="w-5 h-5 text-white" />
      </button>

      {/* Expanded Panel */}
      {expanded && (
        <div className="absolute top-12 right-0 z-50">
          <Card className="w-80 p-4 bg-white shadow-2xl border-2 border-purple-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-800">Upload Universal</h3>
              <button onClick={() => setExpanded(false)}>
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            {/* Upload Button */}
            <label className="block">
              <input
                type="file"
                onChange={handleFileUpload}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
                className="hidden"
                disabled={uploading}
              />
              <Button
                as="span"
                disabled={uploading}
                className="w-full bg-purple-600 hover:bg-purple-700 mb-3 cursor-pointer"
              >
                {uploading ? 'Enviando...' : 'Selecionar Arquivo'}
              </Button>
            </label>

            <p className="text-xs text-slate-500 mb-3">
              Suporta: PDF, Word, Excel, CSV, TXT
            </p>

            {/* Files List */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {uploadedFiles.map((file, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                    <span className="text-xl">{getFileIcon(file.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-800 truncate">{file.name}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(file.uploaded_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <button
                      onClick={() => removeFile(i)}
                      className="p-1 hover:bg-red-100 rounded"
                    >
                      <X className="w-3 h-3 text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </>
  );
}
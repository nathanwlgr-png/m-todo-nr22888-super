import { useState, useRef, useEffect } from 'react';
import Draggable from 'react-draggable';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Upload, X } from 'lucide-react';
import { toast } from 'sonner';

export default function FloatingUploadButton() {
  const [expanded, setExpanded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const timeoutRef = useRef(null);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('uploaded_docs') || '[]');
    setUploadedFiles(saved);
  }, []);

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

  const getFileIcon = (type) => {
    if (['pdf'].includes(type)) return '📄';
    if (['doc', 'docx'].includes(type)) return '📝';
    if (['xls', 'xlsx', 'csv'].includes(type)) return '📊';
    return '📁';
  };

  const handleDrag = (e, data) => {
    setPosition({ x: data.x, y: data.y });
    
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    timeoutRef.current = setTimeout(() => {
      setPosition({ x: 0, y: 0 });
    }, 5000);
  };

  const initialPosition = { x: window.innerWidth - 90, y: window.innerHeight - 200 };

  return (
    <Draggable 
      position={position}
      onDrag={handleDrag}
      defaultPosition={initialPosition}
    >
      <div className="fixed z-50 cursor-move" style={{ bottom: 176, right: 24 }}>
        {!expanded ? (
          <button
            onClick={() => setExpanded(true)}
            className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 shadow-2xl flex items-center justify-center hover:shadow-purple-500/50 transition-all active:scale-95"
            style={{ 
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation',
              padding: '20px'
            }}
          >
            <Upload className="w-7 h-7 text-white" />
          </button>
        ) : (
          <Card className="w-80 p-4 bg-white shadow-2xl border-2 border-purple-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-800">📤 Upload</h3>
              <button onClick={() => setExpanded(false)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

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
                className="w-full h-11 bg-purple-600 hover:bg-purple-700 mb-3 cursor-pointer"
              >
                {uploading ? '⏳ Enviando...' : '📁 Selecionar'}
              </Button>
            </label>

            <p className="text-xs text-slate-500 mb-3">
              PDF, Word, Excel, CSV, TXT
            </p>

            {uploadedFiles.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {uploadedFiles.map((file, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                    <span className="text-lg">{getFileIcon(file.type)}</span>
                    <p className="text-xs font-medium text-slate-800 truncate flex-1">{file.name}</p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}
      </div>
    </Draggable>
  );
}
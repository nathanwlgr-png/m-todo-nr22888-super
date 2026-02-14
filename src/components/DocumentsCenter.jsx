import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  FileText, 
  Download, 
  Share2, 
  Search,
  Calendar,
  User,
  X,
  MessageSquare,
  Copy
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function DocumentsCenter({ open, onOpenChange }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [previewContent, setPreviewContent] = useState(null);

  const { data: exportedDocs = [] } = useQuery({
    queryKey: ['exported-documents'],
    queryFn: () => base44.entities.ExportedDocument.list('-created_date', 100),
  });

  const { data: clientDocs = [] } = useQuery({
    queryKey: ['client-documents-all'],
    queryFn: () => base44.entities.ClientDocument.list('-created_date', 100),
  });

  const allDocs = [...exportedDocs, ...clientDocs];

  const filteredDocs = searchTerm 
    ? allDocs.filter(doc => 
        doc.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.client_name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : allDocs;

  const handleShareWhatsApp = (doc) => {
    const text = `📄 *${doc.title}*\n\n${doc.description || 'Documento compartilhado'}\n\n${doc.file_url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    toast.success('WhatsApp aberto!');
  };

  const handlePreview = async (doc) => {
    setSelectedDoc(doc);
    
    // Se for texto/markdown, carregar conteúdo
    if (doc.file_url && (doc.file_url.includes('.txt') || doc.file_url.includes('.md'))) {
      try {
        const response = await fetch(doc.file_url);
        const text = await response.text();
        setPreviewContent(text);
      } catch (error) {
        setPreviewContent('Erro ao carregar preview');
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-600" />
            📁 Central de Documentos
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 flex-1 overflow-hidden flex flex-col">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar documentos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            <Card className="p-2 text-center">
              <p className="text-xl font-bold text-purple-900">{allDocs.length}</p>
              <p className="text-xs text-slate-600">Total</p>
            </Card>
            <Card className="p-2 text-center">
              <p className="text-xl font-bold text-green-900">
                {exportedDocs.filter(d => d.whatsapp_ready).length}
              </p>
              <p className="text-xs text-slate-600">WhatsApp</p>
            </Card>
            <Card className="p-2 text-center">
              <p className="text-xl font-bold text-blue-900">
                {new Set(allDocs.map(d => d.client_id).filter(Boolean)).size}
              </p>
              <p className="text-xs text-slate-600">Clientes</p>
            </Card>
          </div>

          {/* Lista de Documentos */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {filteredDocs.length === 0 ? (
              <Card className="p-8 text-center">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500">
                  {searchTerm ? 'Nenhum documento encontrado' : 'Nenhum documento ainda'}
                </p>
              </Card>
            ) : (
              filteredDocs.map((doc) => (
                <Card key={doc.id} className="p-3 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-slate-900 truncate">
                        {doc.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {doc.client_name && (
                          <Badge variant="outline" className="text-xs">
                            <User className="w-3 h-3 mr-1" />
                            {doc.client_name}
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {doc.document_type || doc.type}
                        </Badge>
                        <span className="text-xs text-slate-500">
                          {new Date(doc.created_date).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      {doc.description && (
                        <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                          {doc.description}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      {doc.file_url && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              navigator.clipboard.writeText(doc.file_url);
                              toast.success('Link copiado!');
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleShareWhatsApp(doc)}
                            className="h-8 w-8 p-0 text-green-600"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </Button>
                          <a
                            href={doc.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
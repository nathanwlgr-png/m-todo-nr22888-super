import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  ArrowLeft, FileText, Download, Share2, Trash2, Search,
  FileSpreadsheet, FileImage, FileType, Presentation, File
} from 'lucide-react';
import { toast } from 'sonner';

export default function ExportedDocuments() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['exported-documents'],
    queryFn: () => base44.entities.ExportedDocument.list('-created_date')
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ExportedDocument.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['exported-documents']);
      toast.success('Documento excluído');
    }
  });

  const updateExportCountMutation = useMutation({
    mutationFn: ({ id, count }) => base44.entities.ExportedDocument.update(id, {
      export_count: count,
      last_exported: new Date().toISOString()
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['exported-documents']);
    }
  });

  const filteredDocuments = documents.filter(doc =>
    doc.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.client_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getIcon = (type) => {
    switch (type) {
      case 'pdf': return <FileText className="w-5 h-5 text-red-600" />;
      case 'excel': return <FileSpreadsheet className="w-5 h-5 text-green-600" />;
      case 'word': return <FileType className="w-5 h-5 text-blue-600" />;
      case 'powerpoint': return <Presentation className="w-5 h-5 text-orange-600" />;
      case 'image': return <FileImage className="w-5 h-5 text-purple-600" />;
      default: return <File className="w-5 h-5 text-gray-600" />;
    }
  };

  const downloadDocument = async (doc) => {
    try {
      const link = document.createElement('a');
      link.href = doc.file_url;
      link.download = `${doc.title}.${doc.document_type}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      updateExportCountMutation.mutate({
        id: doc.id,
        count: (doc.export_count || 0) + 1
      });
      
      toast.success('Download iniciado!');
    } catch (error) {
      toast.error('Erro ao baixar documento');
    }
  };

  const shareViaWhatsApp = async (doc) => {
    const message = `📄 *${doc.title}*\n\n${doc.description || ''}\n\n🔗 ${doc.file_url}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, '_blank');
    
    updateExportCountMutation.mutate({
      id: doc.id,
      count: (doc.export_count || 0) + 1
    });
  };

  const categoryColors = {
    proposta: 'bg-blue-100 text-blue-800',
    analise: 'bg-purple-100 text-purple-800',
    relatorio: 'bg-green-100 text-green-800',
    contrato: 'bg-orange-100 text-orange-800',
    apresentacao: 'bg-pink-100 text-pink-800',
    outro: 'bg-gray-100 text-gray-800'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 pb-24">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => navigate(createPageUrl('Home'))}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">📦 Exportador de Documentos</h1>
            <p className="text-gray-600">Todos os PDFs e arquivos gerados prontos para exportar</p>
          </div>
          <FileText className="w-8 h-8 text-blue-600" />
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por título ou cliente..."
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-blue-600">{documents.length}</p>
              <p className="text-sm text-gray-600">Total de Documentos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-red-600">
                {documents.filter(d => d.document_type === 'pdf').length}
              </p>
              <p className="text-sm text-gray-600">PDFs</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-green-600">
                {documents.filter(d => d.document_type === 'excel').length}
              </p>
              <p className="text-sm text-gray-600">Excel</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-orange-600">
                {documents.reduce((sum, d) => sum + (d.export_count || 0), 0)}
              </p>
              <p className="text-sm text-gray-600">Exportações</p>
            </CardContent>
          </Card>
        </div>

        {/* Documents List */}
        {isLoading ? (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <p className="text-gray-500">Carregando documentos...</p>
            </CardContent>
          </Card>
        ) : filteredDocuments.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {searchTerm ? 'Nenhum documento encontrado' : 'Nenhum documento gerado ainda'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredDocuments.map(doc => (
              <Card key={doc.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-gray-100 rounded-lg">
                      {getIcon(doc.document_type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <h3 className="font-semibold text-lg text-gray-900 truncate">
                            {doc.title}
                          </h3>
                          {doc.client_name && (
                            <p className="text-sm text-gray-600">Cliente: {doc.client_name}</p>
                          )}
                        </div>
                        <Badge className={categoryColors[doc.category]}>
                          {doc.category}
                        </Badge>
                      </div>

                      {doc.description && (
                        <p className="text-sm text-gray-600 mb-3">{doc.description}</p>
                      )}

                      <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                        <span className="flex items-center gap-1">
                          📅 {new Date(doc.created_date).toLocaleDateString('pt-BR')}
                        </span>
                        {doc.file_size_kb && (
                          <span>{(doc.file_size_kb / 1024).toFixed(2)} MB</span>
                        )}
                        {doc.export_count > 0 && (
                          <span>↗️ {doc.export_count} exportações</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => downloadDocument(doc)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Baixar
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => shareViaWhatsApp(doc)}
                          className="border-green-600 text-green-600 hover:bg-green-50"
                        >
                          <Share2 className="w-4 h-4 mr-2" />
                          WhatsApp
                        </Button>

                        {doc.client_id && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(createPageUrl(`ClientProfile?id=${doc.client_id}`))}
                          >
                            Ver Cliente
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (confirm('Excluir este documento?')) {
                              deleteMutation.mutate(doc.id);
                            }
                          }}
                          className="ml-auto text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
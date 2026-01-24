import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Upload, FileText, Search, Send, Trash2, Download, 
  Loader2, Filter, X, Sparkles, Mail, MessageSquare, ArrowLeft
} from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function ClientDocumentCenter() {
  const queryClient = useQueryClient();
  const [selectedClient, setSelectedClient] = useState('');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [documentToSend, setDocumentToSend] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [uploadData, setUploadData] = useState({
    title: '',
    type: 'proposta',
    notes: '',
    file: null
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-updated_date', 500)
  });

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['documents', selectedClient, filterType],
    queryFn: async () => {
      const filters = {};
      if (selectedClient) filters.client_id = selectedClient;
      if (filterType !== 'all') filters.type = filterType;
      return await base44.entities.ClientDocument.filter(filters);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ClientDocument.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['documents']);
      toast.success('Documento excluído');
    }
  });

  const handleUpload = async () => {
    if (!uploadData.file || !uploadData.title || !selectedClient) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ 
        file: uploadData.file 
      });

      const client = clients.find(c => c.id === selectedClient);

      await base44.entities.ClientDocument.create({
        client_id: selectedClient,
        client_name: client?.first_name || 'Cliente',
        title: uploadData.title,
        type: uploadData.type,
        file_url,
        notes: uploadData.notes
      });

      queryClient.invalidateQueries(['documents']);
      toast.success('Documento enviado!');
      setUploadDialogOpen(false);
      setUploadData({ title: '', type: 'proposta', notes: '', file: null });
    } catch (error) {
      toast.error('Erro ao fazer upload');
    } finally {
      setUploading(false);
    }
  };

  const performAISearch = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analise esta consulta de busca: "${searchQuery}"

Documentos disponíveis:
${documents.map(doc => `
- ID: ${doc.id}
- Título: ${doc.title}
- Tipo: ${doc.type}
- Cliente: ${doc.client_name}
- Notas: ${doc.notes || 'N/A'}
`).join('\n')}

Retorne os IDs dos documentos mais relevantes para a busca (máximo 10).
Considere: título, tipo, notas e contexto do cliente.`,
        response_json_schema: {
          type: "object",
          properties: {
            matching_ids: {
              type: "array",
              items: { type: "string" }
            },
            explanation: { type: "string" }
          }
        }
      });

      const matches = documents.filter(doc => 
        result.matching_ids.includes(doc.id)
      );

      setSearchResults(matches);
      toast.success(`${matches.length} documentos encontrados`);
    } catch (error) {
      toast.error('Erro na busca IA');
    } finally {
      setSearching(false);
    }
  };

  const sendDocument = async (method) => {
    if (!documentToSend) return;

    const client = clients.find(c => c.id === documentToSend.client_id);
    if (!client) return;

    const message = `📄 *${documentToSend.title}*\n\n${documentToSend.notes || 'Documento compartilhado'}\n\nAcesse: ${documentToSend.file_url}`;

    try {
      if (method === 'whatsapp' && client.phone) {
        window.open(`https://wa.me/${client.phone}?text=${encodeURIComponent(message)}`, '_blank');
        toast.success('WhatsApp aberto!');
      } else if (method === 'email' && client.email) {
        await base44.integrations.Core.SendEmail({
          to: client.email,
          subject: documentToSend.title,
          body: `${documentToSend.notes || 'Segue documento em anexo.'}\n\nAcesse o documento: ${documentToSend.file_url}`
        });
        toast.success('Email enviado!');
      } else {
        toast.error('Cliente não tem ' + (method === 'whatsapp' ? 'WhatsApp' : 'email'));
      }
      setSendDialogOpen(false);
      setDocumentToSend(null);
    } catch (error) {
      toast.error('Erro ao enviar');
    }
  };

  const displayedDocuments = searchResults.length > 0 ? searchResults : documents;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-900 px-4 py-4 shadow-lg">
        <div className="flex items-center gap-3">
          <Link to={createPageUrl('Home')}>
            <Button size="sm" variant="ghost" className="text-white">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white">📚 Centro de Documentos</h1>
            <p className="text-xs text-indigo-300">Upload, busca IA e envio</p>
          </div>
          <Button
            onClick={() => setUploadDialogOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Filtros */}
        <Card className="p-4">
          <div className="space-y-3">
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os clientes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os clientes</SelectItem>
                {clients.map(client => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.first_name} {client.clinic_name ? `- ${client.clinic_name}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="proposta">Propostas</SelectItem>
                <SelectItem value="contrato">Contratos</SelectItem>
                <SelectItem value="pesquisa_ia">Pesquisas IA</SelectItem>
                <SelectItem value="material_tecnico">Material Técnico</SelectItem>
                <SelectItem value="outro">Outros</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Busca IA */}
        <Card className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-300">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <h3 className="font-bold text-purple-900">Busca Inteligente IA</h3>
          </div>
          <div className="flex gap-2">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && performAISearch()}
              placeholder="Ex: propostas VG2, contratos assinados em dezembro..."
              className="flex-1"
            />
            <Button
              onClick={performAISearch}
              disabled={!searchQuery.trim() || searching}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </Button>
          </div>
          {searchResults.length > 0 && (
            <Button
              onClick={() => {
                setSearchResults([]);
                setSearchQuery('');
              }}
              variant="ghost"
              size="sm"
              className="mt-2"
            >
              <X className="w-3 h-3 mr-1" />
              Limpar busca
            </Button>
          )}
        </Card>

        {/* Lista de Documentos */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">
              📄 Documentos ({displayedDocuments.length})
            </h3>
            {selectedClient && (
              <Button
                onClick={() => setSelectedClient('')}
                variant="ghost"
                size="sm"
              >
                <Filter className="w-3 h-3 mr-1" />
                Ver todos
              </Button>
            )}
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-slate-400 mx-auto" />
            </div>
          ) : displayedDocuments.length === 0 ? (
            <Card className="p-8 text-center">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600">Nenhum documento encontrado</p>
              <Button
                onClick={() => setUploadDialogOpen(true)}
                className="mt-3 bg-indigo-600 hover:bg-indigo-700"
              >
                <Upload className="w-4 h-4 mr-2" />
                Fazer Upload
              </Button>
            </Card>
          ) : (
            displayedDocuments.map(doc => (
              <Card key={doc.id} className="p-4 hover:shadow-lg transition-all">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h4 className="font-bold text-slate-900">{doc.title}</h4>
                      <Badge className={
                        doc.type === 'proposta' ? 'bg-blue-600' :
                        doc.type === 'contrato' ? 'bg-green-600' :
                        doc.type === 'pesquisa_ia' ? 'bg-purple-600' : 'bg-slate-600'
                      }>
                        {doc.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600 mb-1">
                      Cliente: <span className="font-semibold">{doc.client_name}</span>
                    </p>
                    {doc.notes && (
                      <p className="text-xs text-slate-500 mb-2 line-clamp-2">{doc.notes}</p>
                    )}
                    <p className="text-xs text-slate-400">
                      {new Date(doc.created_date).toLocaleDateString('pt-BR')}
                    </p>
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        onClick={() => {
                          setDocumentToSend(doc);
                          setSendDialogOpen(true);
                        }}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Send className="w-3 h-3 mr-1" />
                        Enviar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(doc.file_url, '_blank')}
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Baixar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteMutation.mutate(doc.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>📤 Upload de Documento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o cliente *" />
              </SelectTrigger>
              <SelectContent>
                {clients.map(client => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.first_name} {client.clinic_name ? `- ${client.clinic_name}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              placeholder="Título do documento *"
              value={uploadData.title}
              onChange={(e) => setUploadData({...uploadData, title: e.target.value})}
            />

            <Select
              value={uploadData.type}
              onValueChange={(value) => setUploadData({...uploadData, type: value})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="proposta">Proposta</SelectItem>
                <SelectItem value="contrato">Contrato</SelectItem>
                <SelectItem value="pesquisa_ia">Pesquisa IA</SelectItem>
                <SelectItem value="material_tecnico">Material Técnico</SelectItem>
                <SelectItem value="outro">Outro</SelectItem>
              </SelectContent>
            </Select>

            <Textarea
              placeholder="Notas/Descrição (opcional)"
              value={uploadData.notes}
              onChange={(e) => setUploadData({...uploadData, notes: e.target.value})}
              rows={3}
            />

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Arquivo *
              </label>
              <Input
                type="file"
                onChange={(e) => setUploadData({...uploadData, file: e.target.files[0]})}
                accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
              />
              <p className="text-xs text-slate-500 mt-1">
                Formatos: PDF, DOC, DOCX, TXT, imagens
              </p>
            </div>

            <Button
              onClick={handleUpload}
              disabled={uploading || !uploadData.file || !uploadData.title || !selectedClient}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Fazer Upload
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Send Dialog */}
      <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>📤 Enviar Documento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {documentToSend && (
              <>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="font-bold text-slate-900">{documentToSend.title}</p>
                  <p className="text-sm text-slate-600">Cliente: {documentToSend.client_name}</p>
                </div>

                <div className="space-y-2">
                  <Button
                    onClick={() => sendDocument('whatsapp')}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Enviar via WhatsApp
                  </Button>
                  <Button
                    onClick={() => sendDocument('email')}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Enviar via Email
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
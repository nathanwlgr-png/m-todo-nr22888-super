import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Loader2, Save, FileText, Send, Trash2, Download, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

export default function UniversalClientSearch() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState('');
  const [savedSearchToSend, setSavedSearchToSend] = useState(null);

  const { data: clients = [] } = useQuery({
    queryKey: ['clients-list'],
    queryFn: () => base44.entities.Client.list('-updated_date', 500)
  });

  const { data: savedSearches = [] } = useQuery({
    queryKey: ['saved-searches'],
    queryFn: async () => {
      try {
        return await base44.entities.ClientDocument.filter({ type: 'pesquisa_ia' });
      } catch {
        return [];
      }
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.ClientDocument.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['saved-searches']);
      toast.success('Pesquisa excluída');
    }
  });

  const performSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Pesquisa sobre: "${searchQuery}"

Forneça informações completas, práticas e organizadas sobre o tema. Inclua:
- Definição/Conceito
- Detalhes técnicos relevantes
- Aplicações práticas
- Benefícios/Vantagens
- Dados importantes
- Exemplos ou casos de uso

Seja DETALHADO, PROFISSIONAL e ESTRUTURADO.`,
        add_context_from_internet: true
      });

      setSearchResult({
        query: searchQuery,
        content: result,
        timestamp: new Date().toISOString()
      });

      toast.success('Pesquisa concluída!');
    } catch (error) {
      toast.error('Erro na pesquisa');
    } finally {
      setSearching(false);
    }
  };

  const saveAsPDF = async (searchData) => {
    try {
      const doc = new jsPDF();
      
      // Título
      doc.setFontSize(18);
      doc.text('PESQUISA IA - VENDA NR', 20, 20);
      
      // Consulta
      doc.setFontSize(12);
      doc.text(`Consulta: ${searchData.query}`, 20, 35);
      doc.text(`Data: ${new Date(searchData.timestamp).toLocaleString('pt-BR')}`, 20, 42);
      
      // Linha separadora
      doc.line(20, 48, 190, 48);
      
      // Conteúdo
      doc.setFontSize(10);
      const lines = doc.splitTextToSize(searchData.content, 170);
      let y = 55;
      
      lines.forEach((line) => {
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
        doc.text(line, 20, y);
        y += 5;
      });

      // Salvar no banco
      const pdfBlob = doc.output('blob');
      const file = new File([pdfBlob], `pesquisa_${Date.now()}.pdf`, { type: 'application/pdf' });
      
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      await base44.entities.ClientDocument.create({
        title: `Pesquisa: ${searchData.query}`,
        type: 'pesquisa_ia',
        file_url,
        notes: searchData.content.substring(0, 200) + '...',
        client_id: 'system',
        client_name: 'Sistema'
      });

      queryClient.invalidateQueries(['saved-searches']);
      toast.success('Salvo em PDF!');
    } catch (error) {
      toast.error('Erro ao salvar PDF');
    }
  };

  const downloadPDF = (searchData) => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('PESQUISA IA', 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Consulta: ${searchData.query}`, 20, 35);
    doc.text(`Data: ${new Date(searchData.timestamp).toLocaleString('pt-BR')}`, 20, 42);
    
    doc.line(20, 48, 190, 48);
    
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(searchData.content, 170);
    let y = 55;
    
    lines.forEach((line) => {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text(line, 20, y);
      y += 5;
    });

    doc.save(`pesquisa_${searchData.query.substring(0, 20)}.pdf`);
  };

  const sendToClient = async () => {
    if (!selectedClient || !savedSearchToSend) return;

    const client = clients.find(c => c.id === selectedClient);
    if (!client) return;

    const message = `📚 *MATERIAL INFORMATIVO*\n\n*${savedSearchToSend.title}*\n\n${savedSearchToSend.notes}\n\nAcesse o PDF completo: ${savedSearchToSend.file_url}`;

    if (client.phone) {
      window.open(`https://wa.me/${client.phone}?text=${encodeURIComponent(message)}`, '_blank');
      toast.success('WhatsApp aberto!');
    } else if (client.email) {
      await base44.integrations.Core.SendEmail({
        to: client.email,
        subject: savedSearchToSend.title,
        body: `${savedSearchToSend.notes}\n\nAcesse o PDF: ${savedSearchToSend.file_url}`
      });
      toast.success('Email enviado!');
    }

    setSendDialogOpen(false);
    setSelectedClient('');
    setSavedSearchToSend(null);
  };

  return (
    <Card className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-300">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center">
          <Search className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-emerald-900">Pesquisa para Cliente</h3>
          <p className="text-xs text-emerald-700">Pesquise qualquer coisa com IA</p>
        </div>
      </div>

      {/* Barra de Pesquisa */}
      <div className="flex gap-2 mb-3">
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && performSearch()}
          placeholder="Ex: benefícios do VG2, hemogasometria em equinos..."
          className="flex-1"
          disabled={searching}
        />
        <Button
          onClick={performSearch}
          disabled={!searchQuery.trim() || searching}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          {searching ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Resultado da Pesquisa */}
      {searchResult && (
        <div className="mb-3 p-4 bg-white rounded-lg border-2 border-emerald-200">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h4 className="font-bold text-emerald-900 mb-1">
                <Sparkles className="w-4 h-4 inline mr-1" />
                {searchResult.query}
              </h4>
              <p className="text-xs text-emerald-600 mb-2">
                {new Date(searchResult.timestamp).toLocaleString('pt-BR')}
              </p>
            </div>
          </div>
          
          <div className="p-3 bg-emerald-50 rounded-lg mb-3 max-h-64 overflow-y-auto">
            <p className="text-sm text-slate-700 whitespace-pre-line">{searchResult.content}</p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => saveAsPDF(searchResult)}
              size="sm"
              variant="outline"
              className="flex-1"
            >
              <Save className="w-3 h-3 mr-1" />
              Salvar PDF
            </Button>
            <Button
              onClick={() => downloadPDF(searchResult)}
              size="sm"
              variant="outline"
              className="flex-1"
            >
              <Download className="w-3 h-3 mr-1" />
              Baixar
            </Button>
          </div>
        </div>
      )}

      {/* Pesquisas Salvas */}
      {savedSearches.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-emerald-800">📁 PESQUISAS SALVAS</p>
            <Badge className="bg-emerald-600 text-white">{savedSearches.length}</Badge>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {savedSearches.map((search) => (
              <div
                key={search.id}
                className="p-3 bg-white rounded-lg border border-emerald-200 hover:border-emerald-400 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <p className="font-semibold text-sm text-slate-800 truncate">{search.title}</p>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2">{search.notes}</p>
                    <p className="text-xs text-emerald-600 mt-1">
                      {new Date(search.created_date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSavedSearchToSend(search);
                        setSendDialogOpen(true);
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <Send className="w-3 h-3 text-blue-600" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => window.open(search.file_url, '_blank')}
                      className="h-8 w-8 p-0"
                    >
                      <Download className="w-3 h-3 text-emerald-600" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteMutation.mutate(search.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="w-3 h-3 text-red-600" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dialog Enviar para Cliente */}
      <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar para Cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o cliente..." />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.first_name} {client.clinic_name ? `- ${client.clinic_name}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              onClick={sendToClient}
              disabled={!selectedClient}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              <Send className="w-4 h-4 mr-2" />
              Enviar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
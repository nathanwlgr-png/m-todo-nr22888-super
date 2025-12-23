import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  FileText,
  Download,
  Copy,
  Search,
  Plus,
  Trash2,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function DocumentRepository() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDoc, setNewDoc] = useState({
    title: '',
    type: 'outro',
    content: '',
    summary: '',
    tags: []
  });

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['generated-documents'],
    queryFn: () => base44.entities.GeneratedDocument.list('-created_date')
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.GeneratedDocument.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['generated-documents']);
      setShowAddForm(false);
      setNewDoc({ title: '', type: 'outro', content: '', summary: '', tags: [] });
      toast.success('Documento salvo!');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.GeneratedDocument.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['generated-documents']);
      toast.success('Documento removido');
    }
  });

  const filteredDocs = documents.filter(doc =>
    doc.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const downloadDoc = (doc) => {
    const blob = new Blob([doc.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.title.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Download iniciado!');
  };

  const copyDoc = async (doc) => {
    try {
      await navigator.clipboard.writeText(doc.content);
      toast.success('Documento copiado!');
    } catch (error) {
      toast.error('Erro ao copiar');
    }
  };

  const typeLabels = {
    pesquisa_cientifica: 'Pesquisa Científica',
    hemogasometria: 'Hemogasometria',
    relatorio: 'Relatório',
    manual: 'Manual',
    outro: 'Outro'
  };

  const typeColors = {
    pesquisa_cientifica: 'bg-emerald-100 text-emerald-700',
    hemogasometria: 'bg-blue-100 text-blue-700',
    relatorio: 'bg-purple-100 text-purple-700',
    manual: 'bg-orange-100 text-orange-700',
    outro: 'bg-slate-100 text-slate-700'
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-4 pt-4 pb-20 rounded-b-[2rem]">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-white/10">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-lg font-semibold text-white">Documentos Gerados</h1>
        </div>

        <Card className="p-4 bg-white/10 backdrop-blur border-white/20">
          <div className="flex items-center gap-3">
            <Search className="w-5 h-5 text-white/60" />
            <Input
              placeholder="Buscar documentos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white/20 border-white/30 text-white placeholder:text-white/60"
            />
          </div>
        </Card>
      </div>

      <div className="px-6 -mt-12 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4 bg-white">
            <p className="text-2xl font-bold text-indigo-600">{documents.length}</p>
            <p className="text-xs text-slate-600">Total de Documentos</p>
          </Card>
          <Card className="p-4 bg-white">
            <p className="text-2xl font-bold text-emerald-600">
              {documents.filter(d => d.type === 'pesquisa_cientifica').length}
            </p>
            <p className="text-xs text-slate-600">Pesquisas Científicas</p>
          </Card>
        </div>

        {/* Add Button */}
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          className="w-full bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Documento Manualmente
        </Button>

        {/* Add Form */}
        {showAddForm && (
          <Card className="p-4">
            <h3 className="font-semibold text-slate-800 mb-3">Novo Documento</h3>
            <div className="space-y-3">
              <Input
                placeholder="Título do documento"
                value={newDoc.title}
                onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })}
              />
              <select
                value={newDoc.type}
                onChange={(e) => setNewDoc({ ...newDoc, type: e.target.value })}
                className="w-full p-2 rounded-lg border"
              >
                <option value="pesquisa_cientifica">Pesquisa Científica</option>
                <option value="hemogasometria">Hemogasometria</option>
                <option value="relatorio">Relatório</option>
                <option value="manual">Manual</option>
                <option value="outro">Outro</option>
              </select>
              <Textarea
                placeholder="Resumo (opcional)"
                value={newDoc.summary}
                onChange={(e) => setNewDoc({ ...newDoc, summary: e.target.value })}
                rows={2}
              />
              <Textarea
                placeholder="Cole o conteúdo completo do documento aqui..."
                value={newDoc.content}
                onChange={(e) => setNewDoc({ ...newDoc, content: e.target.value })}
                rows={10}
                className="font-mono text-sm"
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => createMutation.mutate(newDoc)}
                  disabled={!newDoc.title || !newDoc.content || createMutation.isPending}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                >
                  {createMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Salvar'
                  )}
                </Button>
                <Button
                  onClick={() => setShowAddForm(false)}
                  variant="outline"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Documents List */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : filteredDocs.length === 0 ? (
          <Card className="p-8 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">
              {searchTerm ? 'Nenhum documento encontrado' : 'Nenhum documento salvo ainda'}
            </p>
            <p className="text-xs text-slate-400 mt-2">
              Os documentos gerados pela IA serão salvos automaticamente aqui
            </p>
          </Card>
        ) : (
          filteredDocs.map(doc => (
            <Card key={doc.id} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    <h3 className="font-semibold text-slate-800">{doc.title}</h3>
                  </div>
                  <Badge className={typeColors[doc.type]}>{typeLabels[doc.type]}</Badge>
                </div>
              </div>

              {doc.summary && (
                <p className="text-sm text-slate-600 mb-3">{doc.summary}</p>
              )}

              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs text-slate-500">
                  {format(new Date(doc.created_date), 'dd/MM/yyyy HH:mm')}
                </span>
                {doc.tags?.map((tag, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyDoc(doc)}
                  className="flex-1"
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Copiar
                </Button>
                <Button
                  size="sm"
                  onClick={() => downloadDoc(doc)}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                >
                  <Download className="w-3 h-3 mr-1" />
                  Baixar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteMutation.mutate(doc.id)}
                  className="text-red-600"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
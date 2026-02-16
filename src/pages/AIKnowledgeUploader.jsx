import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Upload, FileText, Trash2, CheckCircle, Loader2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AIKnowledgeUploader() {
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [docType, setDocType] = useState('catalogo_produtos');
  const queryClient = useQueryClient();

  const { data: documents = [] } = useQuery({
    queryKey: ['ai-knowledge-docs'],
    queryFn: () => base44.entities.AIKnowledgeDocument.list('-created_date'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.AIKnowledgeDocument.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['ai-knowledge-docs']);
      toast.success('Documento removido');
    }
  });

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      // Upload do arquivo
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // Extrair texto e processar
      const response = await base44.functions.invoke('processKnowledgeDocument', {
        file_url,
        title: title || file.name,
        document_type: docType
      });

      await base44.entities.AIKnowledgeDocument.create(response.data);
      
      queryClient.invalidateQueries(['ai-knowledge-docs']);
      toast.success('Documento processado! IA já pode usar.');
      setTitle('');
      e.target.value = '';
    } catch (error) {
      toast.error('Erro ao processar');
    } finally {
      setUploading(false);
    }
  };

  const docTypeLabels = {
    catalogo_produtos: 'Catálogo de Produtos',
    modelo_proposta: 'Modelo de Proposta',
    modelo_contrato: 'Modelo de Contrato',
    tabela_precos: 'Tabela de Preços',
    manual_tecnico: 'Manual Técnico',
    case_sucesso: 'Case de Sucesso',
    lista_clientes: 'Lista de Clientes',
    outro: 'Outro'
  };

  return (
    <div className="space-y-4 pb-20">
      <Card className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <FileText className="w-6 h-6" />
            Base de Conhecimento IA
          </CardTitle>
          <p className="text-purple-100">
            Envie catálogos, propostas e contratos para a IA usar nas respostas
          </p>
        </CardHeader>
      </Card>

      <Card className="border-2 border-orange-500">
        <CardHeader>
          <CardTitle className="text-lg">Upload Novo Documento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Título</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Catálogo VG2 2025"
            />
          </div>

          <div>
            <Label>Tipo de Documento</Label>
            <Select value={docType} onValueChange={setDocType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(docTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Arquivo (PDF, Excel, Word, Imagem)</Label>
            <Input
              type="file"
              onChange={handleUpload}
              disabled={uploading}
              accept=".pdf,.xlsx,.xls,.doc,.docx,.jpg,.jpeg,.png"
            />
          </div>

          {uploading && (
            <div className="flex items-center gap-2 text-sm text-orange-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              Processando documento com IA...
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h3 className="font-semibold text-slate-800">
          Documentos na Base ({documents.length})
        </h3>
        
        {documents.map(doc => (
          <Card key={doc.id} className={doc.is_active ? 'border-l-4 border-l-green-500' : 'opacity-50'}>
            <CardContent className="pt-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold">{doc.title}</h4>
                    {doc.is_active && (
                      <Badge className="bg-green-500">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Ativa
                      </Badge>
                    )}
                  </div>
                  <Badge variant="outline" className="mb-2">
                    {docTypeLabels[doc.document_type]}
                  </Badge>
                  {doc.summary && (
                    <p className="text-xs text-slate-600 mt-2">{doc.summary}</p>
                  )}
                  {doc.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {doc.tags.map((tag, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  {doc.file_url && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => window.open(doc.file_url, '_blank')}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteMutation.mutate(doc.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
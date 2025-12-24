import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function AIDocumentsHub() {
  const { data: documents = [] } = useQuery({
    queryKey: ['generated-documents'],
    queryFn: () => base44.entities.GeneratedDocument.list('-created_date', 20)
  });

  const copyContent = (content) => {
    navigator.clipboard.writeText(content);
    toast.success('Copiado!');
  };

  const downloadDoc = (doc) => {
    const blob = new Blob([doc.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.title}.txt`;
    a.click();
  };

  const typeColors = {
    pesquisa_cientifica: 'bg-purple-100 text-purple-700',
    hemogasometria: 'bg-blue-100 text-blue-700',
    relatorio: 'bg-green-100 text-green-700',
    manual: 'bg-orange-100 text-orange-700'
  };

  return (
    <Card className="p-5 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-300">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-slate-800">📄 Central de Documentos IA</h3>
          <p className="text-xs text-slate-600">{documents.length} documentos gerados</p>
        </div>
        <Link to={createPageUrl('DocumentRepository')}>
          <Button size="sm" variant="outline">Ver Todos</Button>
        </Link>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {documents.slice(0, 10).map((doc) => (
          <div key={doc.id} className="p-3 bg-white rounded-lg border border-blue-200">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <p className="font-semibold text-slate-800 text-sm">{doc.title}</p>
                <p className="text-xs text-slate-600 mt-1 line-clamp-2">{doc.summary}</p>
              </div>
              <Badge className={typeColors[doc.type] || 'bg-slate-100 text-slate-700'}>
                {doc.type}
              </Badge>
            </div>

            {doc.tags && doc.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {doc.tags.slice(0, 3).map((tag, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyContent(doc.content)}
                className="text-xs h-7"
              >
                <Copy className="w-3 h-3 mr-1" />
                Copiar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => downloadDoc(doc)}
                className="text-xs h-7"
              >
                <Download className="w-3 h-3 mr-1" />
                Baixar
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
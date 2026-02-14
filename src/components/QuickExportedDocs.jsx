import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Send, Download } from 'lucide-react';
import { toast } from 'sonner';

export default function QuickExportedDocs() {
  const { data: docs = [] } = useQuery({
    queryKey: ['latest-exports'],
    queryFn: async () => {
      const all = await base44.entities.ExportedDocument.list('-created_date', 5);
      return all;
    },
    refetchInterval: 5000 // Atualiza a cada 5s
  });

  const sendWhatsApp = async (doc) => {
    const message = `📄 *${doc.title}*\n\n${doc.description || ''}\n\nDocumento gerado pelo Sistema NR22`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, '_blank');
    toast.success('WhatsApp aberto!');
  };

  const downloadDoc = async (doc) => {
    try {
      const response = await base44.functions.invoke('generateMariliaProspectsPDF', {});
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${doc.title}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      toast.success('Download iniciado!');
    } catch (error) {
      toast.error('Erro ao baixar');
    }
  };

  if (!docs || docs.length === 0) return null;

  return (
    <Card className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
      <div className="flex items-center gap-2 mb-3">
        <FileText className="w-5 h-5 text-green-600" />
        <h3 className="font-bold text-slate-800">📄 Últimos Documentos Gerados</h3>
      </div>
      
      <div className="space-y-2">
        {docs.map((doc) => (
          <div key={doc.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-green-100">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-slate-800 truncate">{doc.title}</p>
              <p className="text-xs text-slate-600">
                {new Date(doc.created_date).toLocaleDateString('pt-BR')} • {doc.category}
              </p>
            </div>
            
            <div className="flex gap-2 ml-3">
              <Button
                size="sm"
                onClick={() => downloadDoc(doc)}
                className="bg-blue-600 hover:bg-blue-700 h-8 px-3"
              >
                <Download className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                onClick={() => sendWhatsApp(doc)}
                className="bg-green-600 hover:bg-green-700 h-8 px-3"
              >
                <Send className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
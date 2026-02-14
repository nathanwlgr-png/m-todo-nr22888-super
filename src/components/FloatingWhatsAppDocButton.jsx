import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Send, FileText } from 'lucide-react';
import { toast } from 'sonner';

export default function FloatingWhatsAppDocButton() {
  const { data: latestDoc } = useQuery({
    queryKey: ['latest-doc-float'],
    queryFn: async () => {
      const docs = await base44.entities.ExportedDocument.list('-created_date', 1);
      return docs[0];
    },
    refetchInterval: 3000
  });

  if (!latestDoc) return null;

  const sendWhatsApp = () => {
    const message = `📄 *${latestDoc.title}*\n\n${latestDoc.description || ''}\n\nDocumento gerado pelo Sistema NR22`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    toast.success('WhatsApp aberto!');
  };

  return (
    <button
      onClick={sendWhatsApp}
      className="fixed right-4 bottom-24 z-50 w-14 h-14 bg-green-600 hover:bg-green-700 rounded-full shadow-xl flex items-center justify-center text-white transition-all hover:scale-110 animate-bounce"
      title={`Enviar: ${latestDoc.title}`}
    >
      <div className="relative">
        <Send className="w-6 h-6" />
        <FileText className="w-3 h-3 absolute -top-1 -right-1 bg-white text-green-600 rounded-full p-0.5" />
      </div>
    </button>
  );
}
import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye, Download, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const SESSION_ID = crypto.randomUUID();

export default function DocumentTracking() {
  const trackingId = new URLSearchParams(window.location.search).get('id');
  const [loading, setLoading] = useState(true);
  const [trackedDocument, setTrackedDocument] = useState(null);
  const [timeSpent, setTimeSpent] = useState(0);

  useEffect(() => {
    if (!trackingId) { setLoading(false); return; }
    base44.functions.invoke('trackDocumentView', { tracking_id: trackingId, event_type: 'load' })
      .then(async ({ data }) => {
        setTrackedDocument(data.document);
        await base44.functions.invoke('trackDocumentView', { tracking_id: trackingId, event_type: 'open', session_id: SESSION_ID });
      })
      .catch(() => toast.error('Documento não encontrado'))
      .finally(() => setLoading(false));
  }, [trackingId]);

  useEffect(() => {
    if (!trackedDocument) return undefined;
    const interval = window.setInterval(() => {
      if (window.document.visibilityState === 'visible' && window.document.hasFocus()) {
        setTimeSpent((current) => current + 15);
        base44.functions.invoke('trackDocumentView', { tracking_id: trackingId, event_type: 'heartbeat', session_id: SESSION_ID, active_seconds: 15 }).catch(() => {});
      }
    }, 15000);
    return () => window.clearInterval(interval);
  }, [trackedDocument, trackingId]);

  const handleDownload = async () => {
    await base44.functions.invoke('trackDocumentView', { tracking_id: trackingId, event_type: 'download', session_id: SESSION_ID });
    if (trackedDocument.document_url) window.open(trackedDocument.document_url, '_blank', 'noopener,noreferrer');
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-purple-600" /></div>;
  if (!trackedDocument) return <div className="flex min-h-screen items-center justify-center p-6"><Card className="p-6 text-center"><h1 className="font-bold">Rastreamento não encontrado</h1><p className="mt-2 text-sm text-slate-600">Abra um link válido para consultar o documento.</p></Card></div>;

  return <main className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4 sm:p-6">
    <Card className="mx-auto max-w-2xl p-5 sm:p-6">
      <div className="mb-6 flex items-center gap-4"><div className="flex h-14 w-14 items-center justify-center rounded-xl bg-purple-600"><FileText className="h-7 w-7 text-white" /></div><h1 className="min-w-0 flex-1 text-xl font-bold text-slate-900">{trackedDocument.document_title}</h1></div>
      <div className="mb-4 rounded-lg border-2 border-purple-200 bg-purple-50 p-4"><div className="mb-2 flex items-center justify-between gap-3"><p className="flex items-center gap-2 font-semibold text-purple-900"><Eye className="h-5 w-5" />Sinal de interesse registrado</p><p className="text-sm text-purple-700">{Math.floor(timeSpent / 60)}:{String(timeSpent % 60).padStart(2, '0')}</p></div><p className="text-xs text-purple-700">A abertura e o clique indicam interesse, mas não comprovam leitura completa. Não coletamos GPS nem localização precisa.</p></div>
      {trackedDocument.document_url && <Button onClick={handleDownload} className="min-h-11 w-full bg-purple-600 hover:bg-purple-700"><Download className="mr-2 h-5 w-5" />Baixar documento</Button>}
    </Card>
  </main>;
}
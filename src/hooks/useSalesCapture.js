import { useState } from 'react';
import { base44 } from '@/api/base44Client';

export default function useSalesCapture() {
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const analyze = async (file) => {
    if (!file) return;
    setLoading(true); setError(''); setDraft(null);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const response = await base44.functions.invoke('analyzeSalesCaptureSafe', { action: 'analyze', file_url, file_name: file.name, file_type: file.type });
      setDraft(response.data);
    } catch (_error) {
      setError('Não consegui ler a captura. Nenhum dado foi alterado.');
    } finally { setLoading(false); }
  };

  const approve = async () => {
    if (!draft?.queue_id) return;
    setLoading(true); setError('');
    try {
      await base44.functions.invoke('analyzeSalesCaptureSafe', { action: 'approve', queue_id: draft.queue_id });
      setDraft({ ...draft, applied: true });
    } catch (_error) { setError('Não foi possível cadastrar. Confira o cliente e tente novamente.'); }
    finally { setLoading(false); }
  };

  const discard = async () => {
    if (draft?.queue_id) await base44.entities.CRMUpdateQueue.update(draft.queue_id, { status: 'rejeitado' });
    setDraft(null);
  };
  return { draft, loading, error, analyze, approve, discard };
}
import React, { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const PHRASE = 'APAGAR RESOLVIDOS 60 DIAS';
export default function WeeklyCleanupReview() {
  const [preview, setPreview] = useState(null);
  const [confirmation, setConfirmation] = useState('');
  useEffect(() => { base44.functions.invoke('cleanupResolvedContent', { action: 'preview' }).then((r) => setPreview(r.data)).catch(() => {}); }, []);
  if (!preview?.total) return null;
  const remove = async () => {
    const response = await base44.functions.invoke('cleanupResolvedContent', { action: 'delete', confirmation });
    toast.success(`${response.data.deleted} itens antigos removidos.`); setPreview(null);
  };
  return <section className="rounded-3xl border border-amber-500/25 bg-amber-500/5 p-4">
    <h2 className="font-black text-amber-300">Revisão semanal de limpeza</h2>
    <p className="mt-1 text-sm text-slate-400">{preview.total} itens resolvidos há mais de 60 dias: {preview.pending} pendências e {preview.whatsapp} mensagens. Nada é apagado automaticamente.</p>
    <p className="mt-3 text-xs text-slate-500">Para confirmar, digite: {PHRASE}</p>
    <div className="mt-2 flex gap-2"><Input value={confirmation} onChange={(e) => setConfirmation(e.target.value)} className="bg-black/30 text-white" /><Button onClick={remove} disabled={confirmation !== PHRASE} variant="destructive" className="gap-2"><Trash2 className="h-4 w-4" />Limpar</Button></div>
  </section>;
}
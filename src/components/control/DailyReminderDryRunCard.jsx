import React, { useState } from 'react';
import { Play, Loader2, ShieldCheck } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function DailyReminderDryRunCard() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const runPreview = async () => {
    setLoading(true);
    setError('');
    const response = await base44.functions.invoke('dailyPendingTaskReminder', { dry_run: true }).catch((err) => {
      setError(err.message || 'Não foi possível gerar a simulação.');
      return null;
    });
    if (response) setResult(response.data);
    setLoading(false);
  };

  return <Card id="daily-pending-task-reminder" className="bg-slate-800 border-slate-700 scroll-mt-20">
    <CardHeader className="flex-col items-stretch justify-between gap-4 sm:flex-row sm:items-center">
      <div><CardTitle className="text-white">Lembrete Diário de Tarefas</CardTitle><p className="mt-1 text-sm text-slate-300">Modo: <strong>dry_run</strong> — prévia segura sem criar alertas ou enviar notificações.</p></div>
      <Button onClick={runPreview} disabled={loading || !navigator.onLine} className="min-h-11 cursor-pointer sm:shrink-0">
        {loading ? <Loader2 className="animate-spin" /> : <Play />} {loading ? 'Simulando…' : 'Executar dry_run'}
      </Button>
    </CardHeader>
    <CardContent aria-live="polite" className="space-y-4">
      {error && <p className="rounded-lg border border-red-500 bg-red-950/40 p-3 text-sm text-red-100">{error}</p>}
      {result && <>
        <div className="grid grid-cols-3 gap-2 text-center tabular-nums">
          {[['Pendentes', result.pending], ['Follow-ups', result.follow_ups], ['Atrasadas', result.overdue]].map(([label, value]) => <div key={label} className="rounded-lg bg-slate-900 p-3"><strong className="block text-xl text-white">{value}</strong><span className="text-xs text-slate-300">{label}</span></div>)}
        </div>
        <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-slate-950 p-4 text-sm leading-6 text-slate-100">{result.message}</pre>
        <p className="flex items-center gap-2 text-sm font-medium text-green-300"><ShieldCheck /> Simulação concluída: {result.alerts_created} alertas criados · notificações externas: {result.external_notifications_sent ? 'sim' : 'não'}.</p>
      </>}
    </CardContent>
  </Card>;
}
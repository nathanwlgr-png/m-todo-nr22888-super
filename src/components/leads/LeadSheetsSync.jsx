import { ExternalLink, FileSpreadsheet, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import useLeadSheetsSync from '@/hooks/useLeadSheetsSync';
import { toast } from 'sonner';

export default function LeadSheetsSync() {
  const sheets = useLeadSheetsSync();
  if (sheets.loading) return <div className="flex justify-center py-3"><Loader2 className="h-4 w-4 animate-spin" /></div>;
  return <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
    <div className="flex items-center gap-2"><FileSpreadsheet className="h-5 w-5 text-emerald-700" /><div className="flex-1"><p className="text-sm font-semibold">Google Sheets · Bye</p><p className="text-xs text-slate-600">Novos leads sem duplicação</p></div></div>
    {!sheets.user ? <Button className="mt-3 w-full" onClick={sheets.login}>Entrar para conectar</Button> : !sheets.connected ? <Button className="mt-3 w-full bg-emerald-700 hover:bg-emerald-800" onClick={sheets.connect}>Conectar minha conta</Button> : <div className="mt-3 flex gap-2">
      <Button variant="outline" className="flex-1" disabled={sheets.syncing} onClick={async () => toast.success(`${await sheets.sync()} leads sincronizados`)}>{sheets.syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sincronizar agora'}</Button>
      {sheets.url && <Button asChild className="bg-emerald-700 hover:bg-emerald-800"><a href={sheets.url} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /></a></Button>}
    </div>}
  </div>;
}
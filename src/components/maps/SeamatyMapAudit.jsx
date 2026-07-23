import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { namesMatch, PUBLIC_MAP_CLIENTS } from '@/lib/seamatyMapAudit';

export default function SeamatyMapAudit() {
  const { data: verified = [], isLoading } = useQuery({
    queryKey: ['seamaty-map-audit'],
    queryFn: () => base44.entities.SeamatyClientPerformance.list('client_name', 100),
    staleTime: 10 * 60 * 1000,
  });
  const missing = verified.filter((client) => !PUBLIC_MAP_CLIENTS.some((name) => namesMatch(client.client_name, name)));
  const unconfirmed = PUBLIC_MAP_CLIENTS.filter((name) => !verified.some((client) => namesMatch(client.client_name, name)));

  if (isLoading) return <div className="border-t p-4 text-sm text-muted-foreground">Conferindo o relatório…</div>;
  return (
    <div className="grid gap-3 border-t p-4 md:grid-cols-3">
      <div className="rounded-xl border bg-muted p-3">
        <CheckCircle2 className="mb-2 h-5 w-5 text-green-600" />
        <p className="text-2xl font-black text-foreground">{verified.length}</p>
        <p className="text-xs font-bold text-muted-foreground">clientes com máquina confirmada no PDF</p>
      </div>
      <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 md:col-span-2">
        <div className="mb-2 flex items-center gap-2 font-bold text-amber-900"><AlertTriangle className="h-5 w-5" /> {missing.length} ausentes do mapa</div>
        <div className="flex flex-wrap gap-2">{missing.map((client) => <span key={client.id} className="rounded-full bg-card px-3 py-1 text-xs font-bold text-foreground">{client.client_name} · {client.city} · {client.installed_equipment?.join(' + ')}</span>)}</div>
        {unconfirmed.length > 0 && <p className="mt-3 text-xs text-amber-900">Ponto no mapa não confirmado neste PDF: {unconfirmed.join(', ')}.</p>}
      </div>
    </div>
  );
}
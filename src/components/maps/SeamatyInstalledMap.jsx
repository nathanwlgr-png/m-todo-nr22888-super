import { ExternalLink, MapPinned } from 'lucide-react';
import SeamatyMapAudit from '@/components/maps/SeamatyMapAudit';

const MAP_ID = '16bAphR1nMX5tH0pYoH_45JkzN2IgtOo';
const EMBED_URL = `https://www.google.com/maps/d/embed?mid=${MAP_ID}`;
const FULL_URL = `https://www.google.com/maps/d/viewer?mid=${MAP_ID}`;

export default function SeamatyInstalledMap() {
  return (
    <section className="overflow-hidden rounded-2xl border bg-card shadow-sm" aria-labelledby="installed-map-title">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
        <div className="flex min-w-0 items-center gap-3">
          <MapPinned className="h-6 w-6 shrink-0 text-primary" aria-hidden="true" />
          <div className="min-w-0">
            <h2 id="installed-map-title" className="font-bold text-card-foreground">Clientes com Seamaty instalada</h2>
            <p className="text-sm text-muted-foreground">Localizações organizadas por equipamento</p>
          </div>
        </div>
        <a href={FULL_URL} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-lg border px-4 text-sm font-bold text-foreground hover:bg-accent">
          <ExternalLink className="h-4 w-4" aria-hidden="true" /> Abrir no Google Maps
        </a>
      </div>
      <iframe title="Mapa completo de clientes com equipamentos Seamaty" src={EMBED_URL} className="h-[65vh] min-h-[420px] w-full border-0" allowFullScreen />
      <SeamatyMapAudit />
    </section>
  );
}
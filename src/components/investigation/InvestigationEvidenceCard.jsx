import React from 'react';
import { Building2, FlaskConical, SearchCheck } from 'lucide-react';

export default function InvestigationEvidenceCard({ result }) {
  if (!result?.organization_type) return null;
  const services = Object.entries(result.services || {}).filter(([, active]) => active).map(([name]) => name);
  const equipment = result.equipment_evidence || {};
  return (
    <section className="rounded-2xl border border-border bg-card p-4 text-card-foreground">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-bold"><SearchCheck className="h-4 w-4" /> Evidências públicas</h2>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <p><Building2 className="mr-1 inline h-3 w-3" />{result.organization_type} · {result.organization_size}</p>
        <p>{result.years_experience || 0} anos · {result.followers || 0} seguidores</p>
        <p className="col-span-2"><FlaskConical className="mr-1 inline h-3 w-3" />{services.length ? services.join(', ') : 'Serviços laboratoriais não validados'}</p>
      </div>
      <div className="mt-3 rounded-lg bg-muted p-3 text-xs">
        <strong>Equipamento: {equipment.status || 'não encontrado'}</strong>
        <p className="mt-1 text-muted-foreground">{equipment.evidence || 'Sem evidência pública conclusiva.'}</p>
      </div>
      {(result.sources || []).length > 0 && <div className="mt-3 space-y-1 text-xs">{result.sources.slice(0, 3).map((source, index) => <a key={index} href={source.url} target="_blank" rel="noreferrer" className="block truncate text-primary underline">Fonte {index + 1}: {source.url}</a>)}</div>}
    </section>
  );
}
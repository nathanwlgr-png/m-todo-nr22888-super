import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, UserPlus } from 'lucide-react';

export default function HunterClinicCard({ clinic, position, importing, onImport }) {
  const score = clinic.opportunity_score || 0;
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="text-xl font-bold text-purple-400">#{position}</span>
            <p className="font-semibold text-white">{clinic.name}</p>
            <Badge className={score > 70 ? 'bg-red-600' : score > 40 ? 'bg-yellow-600' : 'bg-green-600'}>
              Score {score}
            </Badge>
          </div>
          <p className="text-sm text-slate-400">{clinic.city}, {clinic.state}</p>
          <p className="mt-1 text-xs text-slate-500">{clinic.phone || 'Telefone não encontrado'} • {clinic.potential_product || 'Equipamento a investigar'}</p>
        </div>
        <Button
          onClick={() => onImport(clinic)}
          disabled={importing || !!clinic.imported_client_id}
          className="min-h-11 bg-purple-600 hover:bg-purple-700"
        >
          {clinic.imported_client_id ? <CheckCircle2 className="mr-2 h-4 w-4" /> : <UserPlus className="mr-2 h-4 w-4" />}
          {clinic.imported_client_id ? 'No pipeline' : importing ? 'Importando...' : 'Importar prospect'}
        </Button>
      </div>
    </div>
  );
}
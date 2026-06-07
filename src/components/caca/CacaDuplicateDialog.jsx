/**
 * CacaDuplicateDialog — Exibido quando um possível duplicado é detectado antes de cadastrar
 */
import React from 'react';
import { AlertCircle, ExternalLink, RefreshCw, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function CacaDuplicateDialog({ matches, onForceCreate, onCancel }) {
  const handleOpenExisting = (match) => {
    if (match.type === 'client') {
      window.open(`/ClientProfile?id=${match.record.id}`, '_blank');
    } else {
      window.open(`/Leads?id=${match.record.id}`, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-end justify-center z-50 px-3 pb-6">
      <Card className="bg-slate-950 border-yellow-600/60 w-full max-w-lg">
        <CardContent className="pt-5 space-y-4">

          {/* Alerta */}
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-yellow-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-yellow-300 font-black text-base">Possível Duplicidade Detectada</p>
              <p className="text-slate-400 text-xs mt-0.5">
                Encontramos {matches.length} registro{matches.length > 1 ? 's' : ''} parecido{matches.length > 1 ? 's' : ''} no CRM.
              </p>
            </div>
          </div>

          {/* Matches */}
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {matches.map((m, i) => (
              <div key={i} className="p-3 bg-slate-900 rounded-lg border border-slate-700 space-y-1">
                <div className="flex items-center justify-between">
                  <Badge className={m.type === 'client' ? 'bg-blue-900 text-blue-300 text-[10px]' : 'bg-orange-900 text-orange-300 text-[10px]'}>
                    {m.type === 'client' ? '🔵 Cliente CRM' : '🟠 Lead CRM'}
                  </Badge>
                  <button
                    onClick={() => handleOpenExisting(m)}
                    className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" /> Abrir
                  </button>
                </div>
                <p className="text-white text-sm font-semibold">
                  {m.type === 'client'
                    ? (m.record.clinic_name || m.record.first_name || '—')
                    : (m.record.company || m.record.full_name || '—')}
                </p>
                <p className="text-slate-400 text-xs">
                  {m.record.city}{m.record.phone ? ` • ${m.record.phone}` : ''}
                </p>
              </div>
            ))}
          </div>

          {/* Ações */}
          <div className="space-y-2 pt-1">
            <Button
              className="w-full bg-yellow-700 hover:bg-yellow-600 h-10 font-bold text-sm"
              onClick={onForceCreate}
            >
              <Plus className="w-4 h-4 mr-2" /> Criar mesmo assim (novo registro)
            </Button>
            <Button
              variant="outline"
              className="w-full text-slate-300 border-slate-600 h-9 text-sm"
              onClick={onCancel}
            >
              <X className="w-4 h-4 mr-2" /> Cancelar e revisar
            </Button>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
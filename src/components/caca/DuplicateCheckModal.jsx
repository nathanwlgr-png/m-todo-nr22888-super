import React from 'react';
import { AlertTriangle, ExternalLink, Plus, X, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function DuplicateCheckModal({ existing, formData, onOpenExisting, onCreateAnyway, onCancel }) {
  const existingName = existing?.clinic_name || existing?.first_name || existing?.full_name || 'Registro encontrado';
  const existingCity = existing?.city || '';
  const existingPhone = existing?.phone || '';
  const existingType = existing?._type === 'client' ? 'Cliente CRM' : 'Lead';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
      <Card className="bg-slate-900 border-yellow-600 w-full max-w-sm">
        <CardContent className="pt-5 space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0" />
            <h3 className="text-yellow-300 font-bold text-base">Possível Duplicidade Detectada</h3>
          </div>

          <div className="p-3 bg-slate-800 rounded-lg border border-slate-700 text-sm space-y-1">
            <p className="text-slate-300 font-semibold">{existingName}</p>
            {existingCity && <p className="text-slate-500 text-xs">{existingCity}</p>}
            {existingPhone && <p className="text-slate-500 text-xs">📞 {existingPhone}</p>}
            <span className="inline-block text-[10px] px-1.5 py-0.5 rounded bg-blue-900 text-blue-300 font-bold mt-1">{existingType}</span>
          </div>

          <p className="text-slate-400 text-xs">
            Este registro pode ser a mesma clínica. O que deseja fazer?
          </p>

          <div className="space-y-2">
            <Button
              className="w-full bg-blue-700 hover:bg-blue-600 h-10 text-sm font-bold"
              onClick={onOpenExisting}
            >
              <ExternalLink className="w-4 h-4 mr-2" /> Abrir Existente
            </Button>
            <Button
              className="w-full bg-orange-700 hover:bg-orange-600 h-10 text-sm font-bold"
              onClick={onCreateAnyway}
            >
              <Plus className="w-4 h-4 mr-2" /> Criar Mesmo Assim
            </Button>
            <Button
              variant="ghost"
              className="w-full text-slate-400 hover:text-white h-9 text-sm"
              onClick={onCancel}
            >
              <X className="w-4 h-4 mr-2" /> Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
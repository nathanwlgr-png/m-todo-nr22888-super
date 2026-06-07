import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ConfirmModalVisita({ open, acao, onConfirm, onCancel }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-sm">Confirmar alteração</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600">
            Tem certeza que deseja <strong>{acao?.toLowerCase()}</strong>?
          </p>
          <p className="text-xs text-slate-400">
            Esta ação será registrada no histórico da visita.
          </p>
          <div className="flex gap-2">
            <Button
              onClick={onCancel}
              variant="outline"
              className="flex-1 text-xs"
            >
              Cancelar
            </Button>
            <Button
              onClick={onConfirm}
              className="flex-1 text-xs bg-indigo-600 hover:bg-indigo-700"
            >
              Confirmar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
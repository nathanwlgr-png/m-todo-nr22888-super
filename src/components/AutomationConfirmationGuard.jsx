import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Send, X } from 'lucide-react';

/**
 * Componente de guarda de confirmação para automações
 * Garante que nenhuma mensagem seja enviada sem aprovação manual
 */
export default function AutomationConfirmationGuard({ 
  open, 
  onOpenChange, 
  title, 
  message, 
  clientName,
  onConfirm,
  onCancel 
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            Confirmar Envio
          </DialogTitle>
          <DialogDescription>
            Você está prestes a enviar uma mensagem para <strong>{clientName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
            <p className="text-xs font-semibold text-orange-700 mb-1">⚠️ ATENÇÃO</p>
            <p className="text-xs text-orange-600">
              Esta mensagem será enviada DIRETAMENTE ao cliente. 
              Revise cuidadosamente antes de confirmar.
            </p>
          </div>

          {title && (
            <div>
              <p className="text-xs font-semibold text-slate-700 mb-1">Assunto:</p>
              <p className="text-sm text-slate-800">{title}</p>
            </div>
          )}

          <div className="max-h-64 overflow-y-auto p-3 bg-slate-50 rounded-lg border">
            <p className="text-xs font-semibold text-slate-700 mb-2">Mensagem:</p>
            <p className="text-sm text-slate-700 whitespace-pre-line">{message}</p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onCancel?.();
              onOpenChange(false);
            }}
          >
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button
            onClick={() => {
              onConfirm?.();
              onOpenChange(false);
            }}
            className="bg-green-600 hover:bg-green-700"
          >
            <Send className="w-4 h-4 mr-2" />
            Confirmar Envio
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
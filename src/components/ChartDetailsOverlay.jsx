import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MapPin, Building2, ArrowLeft } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";

export default function ChartDetailsOverlay({ isOpen, onClose, clients = [], title = "Detalhes" }) {
  if (!clients || clients.length === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <p className="text-slate-600 text-center py-8">Nenhum cliente encontrado</p>
          <Button onClick={onClose} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600" />
            {title}
          </DialogTitle>
          <p className="text-sm text-slate-600">{clients.length} cliente(s)</p>
        </DialogHeader>
        
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {clients.map((client) => (
              <div 
                key={client.id}
                className="p-4 border border-slate-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50/30 transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-800">
                      {client.clinic_name || client.full_name || 'Cliente'}
                    </h3>
                    {client.full_name && client.clinic_name && (
                      <p className="text-sm text-slate-600">
                        Dr(a). {client.full_name}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <MapPin className="w-4 h-4 text-indigo-600" />
                  <span>{client.city || 'Cidade não informada'}</span>
                </div>

                {client.status && (
                  <div className="mt-2">
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                      client.status === 'quente' ? 'bg-red-100 text-red-700' :
                      client.status === 'morno' ? 'bg-orange-100 text-orange-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {client.status}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button onClick={onClose} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
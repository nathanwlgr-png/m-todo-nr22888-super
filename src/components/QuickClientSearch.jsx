import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Search, X, User, MapPin, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function QuickClientSearch({ onClientSelect, triggerButton }) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: clients = [] } = useQuery({
    queryKey: ['clients-search'],
    queryFn: async () => {
      try {
        const data = await base44.entities.Client.list('-updated_date', 200);
        return data.filter(c => c && c.id && c.first_name && !c.is_deleted);
      } catch (error) {
        console.error('Erro ao carregar clientes:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  const filteredClients = clients.filter(c => {
    const term = searchTerm.toLowerCase();
    return (
      c.first_name?.toLowerCase().includes(term) ||
      c.clinic_name?.toLowerCase().includes(term) ||
      c.city?.toLowerCase().includes(term) ||
      c.email?.toLowerCase().includes(term) ||
      c.phone?.includes(term)
    );
  });

  const handleSelectClient = (client) => {
    if (onClientSelect) {
      onClientSelect(client);
    }
    toast.success(`Cliente ${client.first_name} selecionado!`);
    setOpen(false);
    setSearchTerm('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton || (
          <Button variant="outline" size="sm" className="gap-2">
            <Search className="w-4 h-4" />
            Buscar Cliente
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Busca Rápida de Cliente
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Digite nome, clínica, cidade, email ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-10"
              autoFocus
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto space-y-2">
            {filteredClients.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Nenhum cliente encontrado</p>
              </div>
            ) : (
              filteredClients.map((client) => (
                <Card
                  key={client.id}
                  className="p-4 hover:bg-slate-50 cursor-pointer transition-all border-2 hover:border-indigo-300"
                  onClick={() => handleSelectClient(client)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="w-4 h-4 text-indigo-600" />
                        <p className="font-semibold text-slate-800">{client.first_name}</p>
                        {client.status && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            client.status === 'quente' ? 'bg-red-100 text-red-700' :
                            client.status === 'morno' ? 'bg-orange-100 text-orange-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {client.status === 'quente' ? '🔥' : client.status === 'morno' ? '🌡️' : '❄️'}
                          </span>
                        )}
                      </div>

                      {client.clinic_name && (
                        <div className="flex items-center gap-1 text-sm text-slate-600 mb-1">
                          <Building2 className="w-3 h-3" />
                          {client.clinic_name}
                        </div>
                      )}

                      {client.city && (
                        <div className="flex items-center gap-1 text-sm text-slate-500">
                          <MapPin className="w-3 h-3" />
                          {client.city}
                        </div>
                      )}

                      <div className="flex gap-2 mt-2 text-xs text-slate-500">
                        {client.email && <span>📧 {client.email}</span>}
                        {client.phone && <span>📱 {client.phone}</span>}
                      </div>
                    </div>

                    <div className="text-right">
                      {client.purchase_score !== undefined && (
                        <div className="text-2xl font-bold text-indigo-600">
                          {client.purchase_score}%
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
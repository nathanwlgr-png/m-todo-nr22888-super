import React, { useState } from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Search, X } from 'lucide-react';
import { Card } from "@/components/ui/card";

export default function ClientSelector({ clients = [], selectedClientId, onClientChange }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showResults, setShowResults] = useState(false);

  const filteredClients = clients.filter(client => {
    if (!searchTerm) return false;
    const term = searchTerm.toLowerCase();
    return (
      client.first_name?.toLowerCase().includes(term) ||
      client.full_name?.toLowerCase().includes(term) ||
      client.clinic_name?.toLowerCase().includes(term) ||
      client.city?.toLowerCase().includes(term)
    );
  });

  const selectedClient = clients.find(c => c.id === selectedClientId);

  const handleSelectClient = (client) => {
    onClientChange(client.id);
    setSearchTerm('');
    setShowResults(false);
  };

  const handleClearSelection = () => {
    onClientChange(null);
    setSearchTerm('');
  };

  return (
    <div className="space-y-2">
      <Label className="text-xs text-slate-600">Cliente</Label>
      
      {selectedClient ? (
        <div className="flex items-center gap-2 p-3 bg-white border-2 border-indigo-200 rounded-lg">
          <div className="flex-1">
            <p className="font-semibold text-slate-800">{selectedClient.first_name}</p>
            <p className="text-xs text-slate-500">
              {selectedClient.razao_social && `${selectedClient.razao_social} • `}
              {selectedClient.clinic_name && `${selectedClient.clinic_name} • `}
              {selectedClient.cnpj && `CNPJ: ${selectedClient.cnpj} • `}
              {selectedClient.city}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">ID: {selectedClient.id}</p>
          </div>
          <button
            onClick={handleClearSelection}
            className="p-1 hover:bg-slate-100 rounded"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowResults(e.target.value.length > 0);
            }}
            onFocus={() => searchTerm && setShowResults(true)}
            placeholder="Digite nome, clínica ou cidade..."
            className="pl-10 h-12 bg-slate-50"
          />
          
          {showResults && (
            <Card className="absolute z-50 w-full mt-1 max-h-60 overflow-y-auto border-2 shadow-lg">
              {filteredClients.length > 0 ? (
                <div className="py-1">
                  {filteredClients.slice(0, 10).map((client) => (
                    <button
                      key={client.id}
                      onClick={() => handleSelectClient(client)}
                      className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors border-b last:border-b-0"
                    >
                      <p className="font-semibold text-slate-800">{client.first_name}</p>
                      <p className="text-xs text-slate-500">
                        {client.razao_social && `${client.razao_social} • `}
                        {client.clinic_name && `${client.clinic_name} • `}
                        {client.cnpj && `CNPJ: ${client.cnpj} • `}
                        {client.city}
                      </p>
                    </button>
                  ))}
                  {filteredClients.length > 10 && (
                    <p className="px-4 py-2 text-xs text-slate-400 text-center">
                      +{filteredClients.length - 10} mais resultados
                    </p>
                  )}
                </div>
              ) : (
                <div className="px-4 py-6 text-center">
                  <p className="text-sm text-slate-500">Nenhum cliente encontrado</p>
                </div>
              )}
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
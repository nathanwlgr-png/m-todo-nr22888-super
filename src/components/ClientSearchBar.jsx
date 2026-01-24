import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Search } from 'lucide-react';

export default function ClientSearchBar({ clients = [], onSelectClient, selectedClient }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filteredClients = clients.filter(c =>
    (c.clinic_name || c.full_name || c.first_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.city || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full">
      <div className="relative mb-4">
        <div className="flex items-center gap-2 p-3 bg-white rounded-lg border-2 border-blue-300">
          <Search className="w-5 h-5 text-blue-600" />
          <Input
            placeholder="Buscar cliente por nome ou cidade..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            className="border-0 focus:ring-0 text-sm"
          />
        </div>

        {isOpen && filteredClients.length > 0 && (
          <Card className="absolute top-full left-0 right-0 mt-2 z-50 max-h-96 overflow-y-auto border-2 border-blue-300">
            {filteredClients.slice(0, 20).map(client => (
              <button
                key={client.id}
                onClick={() => {
                  onSelectClient(client);
                  setSearchTerm('');
                  setIsOpen(false);
                }}
                className={`w-full text-left p-3 border-b hover:bg-blue-50 transition-all ${
                  selectedClient?.id === client.id ? 'bg-blue-100 border-l-4 border-blue-600' : ''
                }`}
              >
                <p className="font-semibold text-slate-800">
                  {client.clinic_name || client.full_name || client.first_name}
                </p>
                <p className="text-xs text-slate-600">
                  {client.city} • Score: {client.purchase_score || 0}/100 • {client.status}
                </p>
              </button>
            ))}
          </Card>
        )}
      </div>

      {selectedClient && (
        <div className="p-3 bg-blue-50 rounded-lg border-2 border-blue-200">
          <p className="text-xs text-blue-600 font-semibold">Cliente Selecionado:</p>
          <p className="font-bold text-slate-800">{selectedClient.clinic_name || selectedClient.first_name}</p>
          <p className="text-xs text-slate-600">{selectedClient.city} • Tipo: {selectedClient.client_type}</p>
        </div>
      )}
    </div>
  );
}
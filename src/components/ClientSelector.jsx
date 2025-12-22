import React, { useState } from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from 'lucide-react';

export default function ClientSelector({ clients = [], selectedClientId, onClientChange }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredClients = clients.filter(client => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      client.first_name?.toLowerCase().includes(term) ||
      client.full_name?.toLowerCase().includes(term) ||
      client.clinic_name?.toLowerCase().includes(term) ||
      client.city?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-2">
      <Label className="text-xs text-slate-600">Buscar Cliente</Label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Nome, clínica, cidade..."
          className="pl-10 h-12 bg-slate-50"
        />
      </div>
      {filteredClients.length > 0 && (
        <Select
          value={selectedClientId || ''}
          onValueChange={onClientChange}
        >
          <SelectTrigger className="h-12 bg-white">
            <SelectValue placeholder="Selecione um cliente..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sem cliente específico</SelectItem>
            {filteredClients.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.first_name} 
                {c.clinic_name && ` - ${c.clinic_name}`}
                {c.city && ` (${c.city})`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {filteredClients.length === 0 && searchTerm && (
        <p className="text-xs text-slate-500 text-center py-2">
          Nenhum cliente encontrado
        </p>
      )}
    </div>
  );
}
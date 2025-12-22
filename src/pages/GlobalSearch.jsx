import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search, Users, X } from 'lucide-react';

export default function GlobalSearch() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-updated_date')
  });

  const filteredClients = useMemo(() => {
    if (!searchTerm.trim()) return clients;

    const searchLower = searchTerm.toLowerCase();
    return clients.filter(c =>
      c.first_name?.toLowerCase().includes(searchLower) ||
      c.full_name?.toLowerCase().includes(searchLower) ||
      c.email?.toLowerCase().includes(searchLower) ||
      c.phone?.includes(searchTerm) ||
      c.clinic_name?.toLowerCase().includes(searchLower) ||
      c.city?.toLowerCase().includes(searchLower)
    );
  }, [searchTerm, clients]);

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="bg-white border-b px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-slate-100">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <h1 className="text-lg font-semibold text-slate-800 flex-1">Busca de Clientes</h1>
        </div>
        
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder="Nome, email, telefone, cidade ou clínica..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-12 pl-12 pr-10 text-base rounded-xl border-2"
            autoFocus
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 mt-3">
          <Users className="w-4 h-4 text-indigo-600" />
          <p className="text-sm text-slate-600">
            {searchTerm ? `${filteredClients.length} encontrado(s)` : `${clients.length} cliente(s) cadastrado(s)`}
          </p>
        </div>
      </div>

      <div className="p-4">
        {filteredClients.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500">
              {searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredClients.map(client => (
              <Card
                key={client.id}
                className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(createPageUrl(`ClientProfile?id=${client.id}`))}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-slate-800">{client.first_name}</p>
                      <Badge className={
                        client.status === 'quente' ? 'bg-red-500 text-white' :
                        client.status === 'morno' ? 'bg-yellow-500 text-white' : 
                        'bg-blue-400 text-white'
                      }>
                        {client.status}
                      </Badge>
                    </div>
                    {client.clinic_name && (
                      <p className="text-sm text-slate-600">{client.clinic_name}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                      {client.city && <span>📍 {client.city}</span>}
                      {client.email && <span>✉️ {client.email}</span>}
                    </div>
                  </div>
                  {client.purchase_score > 0 && (
                    <div className="text-right">
                      <p className="text-lg font-bold text-indigo-600">{client.purchase_score}%</p>
                      <p className="text-xs text-slate-500">Score</p>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
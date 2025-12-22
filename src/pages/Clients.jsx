import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  Search, 
  UserPlus,
  Users,
  Loader2
} from 'lucide-react';
import ClientCard from '@/components/ClientCard';

export default function Clients() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-updated_date'),
  });

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.first_name?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate(createPageUrl('Home'))} className="p-2 -ml-2 rounded-full hover:bg-slate-100">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <h1 className="text-lg font-semibold text-slate-800 flex-1">Clientes</h1>
          <Button
            size="sm"
            onClick={() => navigate(createPageUrl('NewClient'))}
            className="bg-indigo-600 hover:bg-indigo-700 rounded-lg"
          >
            <UserPlus className="w-4 h-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Buscar cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-12 rounded-xl border-2"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="px-4 pb-4">
          <Tabs value={statusFilter} onValueChange={setStatusFilter}>
            <TabsList className="w-full bg-slate-100 p-1 rounded-xl">
              <TabsTrigger value="all" className="flex-1 rounded-lg">Todos</TabsTrigger>
              <TabsTrigger value="quente" className="flex-1 rounded-lg">🔥 Quentes</TabsTrigger>
              <TabsTrigger value="morno" className="flex-1 rounded-lg">🌡️ Mornos</TabsTrigger>
              <TabsTrigger value="frio" className="flex-1 rounded-lg">❄️ Frios</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Client List */}
      <div className="p-4 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
              <Users className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-500">Nenhum cliente encontrado</p>
            <Button
              variant="link"
              onClick={() => navigate(createPageUrl('NewClient'))}
              className="mt-2 text-indigo-600"
            >
              Cadastrar novo cliente
            </Button>
          </div>
        ) : (
          filteredClients.map((client) => (
            <ClientCard key={client.id} client={client} />
          ))
        )}
      </div>
    </div>
  );
}
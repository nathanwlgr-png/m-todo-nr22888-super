import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ArrowLeft, 
  Search, 
  UserPlus,
  Users,
  Loader2,
  Filter,
  X
} from 'lucide-react';
import ClientCard from '@/components/ClientCard';

export default function Clients() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [vendorFilter, setVendorFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-updated_date'),
  });

  // Lista única de vendedores
  const vendors = useMemo(() => {
    const unique = [...new Set(clients.map(c => c.created_by).filter(Boolean))];
    return unique;
  }, [clients]);

  // Busca em múltiplos campos
  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      // Busca multi-campo
      const matchesSearch = !search || (
        client.first_name?.toLowerCase().includes(search.toLowerCase()) ||
        client.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        client.email?.toLowerCase().includes(search.toLowerCase()) ||
        client.phone?.includes(search) ||
        client.city?.toLowerCase().includes(search.toLowerCase()) ||
        client.clinic_name?.toLowerCase().includes(search.toLowerCase())
      );
      
      // Filtros
      const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
      const matchesType = typeFilter === 'all' || client.client_type === typeFilter;
      const matchesVendor = vendorFilter === 'all' || client.created_by === vendorFilter;
      
      return matchesSearch && matchesStatus && matchesType && matchesVendor;
    });
  }, [clients, search, statusFilter, typeFilter, vendorFilter]);

  // Autocomplete suggestions
  const handleSearchChange = (value) => {
    setSearch(value);
    
    if (value.length >= 2) {
      const matches = clients
        .filter(c => 
          c.first_name?.toLowerCase().includes(value.toLowerCase()) ||
          c.clinic_name?.toLowerCase().includes(value.toLowerCase()) ||
          c.city?.toLowerCase().includes(value.toLowerCase())
        )
        .slice(0, 5)
        .map(c => ({
          id: c.id,
          label: c.first_name,
          sublabel: c.clinic_name || c.city
        }));
      setSuggestions(matches);
    } else {
      setSuggestions([]);
    }
  };

  const activeFiltersCount = [statusFilter, typeFilter, vendorFilter].filter(f => f !== 'all').length;

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

        {/* Search with Autocomplete */}
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Buscar por nome, email, telefone, cidade ou clínica..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 pr-10 h-12 rounded-xl border-2"
            />
            {search && (
              <button
                onClick={() => {
                  setSearch('');
                  setSuggestions([]);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            )}
            
            {/* Autocomplete Suggestions */}
            {suggestions.length > 0 && (
              <div className="absolute top-full mt-1 left-0 right-0 bg-white border-2 border-slate-200 rounded-xl shadow-lg z-20 max-h-60 overflow-y-auto">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    onClick={() => {
                      navigate(createPageUrl(`ClientProfile?id=${suggestion.id}`));
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center justify-between border-b last:border-b-0"
                  >
                    <div>
                      <p className="font-medium text-slate-800">{suggestion.label}</p>
                      {suggestion.sublabel && (
                        <p className="text-xs text-slate-500">{suggestion.sublabel}</p>
                      )}
                    </div>
                    <Search className="w-4 h-4 text-slate-400" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Status Filter */}
        <div className="px-4 pb-3">
          <Tabs value={statusFilter} onValueChange={setStatusFilter}>
            <TabsList className="w-full bg-slate-100 p-1 rounded-xl">
              <TabsTrigger value="all" className="flex-1 rounded-lg text-xs">Todos</TabsTrigger>
              <TabsTrigger value="quente" className="flex-1 rounded-lg text-xs">🔥</TabsTrigger>
              <TabsTrigger value="morno" className="flex-1 rounded-lg text-xs">🌡️</TabsTrigger>
              <TabsTrigger value="frio" className="flex-1 rounded-lg text-xs">❄️</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Advanced Filters Toggle */}
        <div className="px-4 pb-4">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="w-full border-2 border-slate-200 hover:bg-slate-50"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtros Avançados
            {activeFiltersCount > 0 && (
              <span className="ml-2 bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </Button>

          {showFilters && (
            <div className="mt-3 space-y-3 p-4 bg-slate-50 rounded-xl border-2 border-slate-200">
              <div>
                <label className="text-xs font-medium text-slate-600 mb-2 block">Tipo de Cliente</label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    <SelectItem value="clinica_pequena">Clínica Pequena</SelectItem>
                    <SelectItem value="clinica_media">Clínica Média</SelectItem>
                    <SelectItem value="hospital_veterinario">Hospital Veterinário</SelectItem>
                    <SelectItem value="laboratorio_terceirizado">Lab. Terceirizado</SelectItem>
                    <SelectItem value="clinica_especializada">Clínica Especializada</SelectItem>
                    <SelectItem value="sem_equipamento">Sem Equipamento</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 mb-2 block">Vendedor Responsável</label>
                <Select value={vendorFilter} onValueChange={setVendorFilter}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os vendedores</SelectItem>
                    {vendors.map((vendor) => (
                      <SelectItem key={vendor} value={vendor}>
                        {vendor}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="ghost"
                onClick={() => {
                  setStatusFilter('all');
                  setTypeFilter('all');
                  setVendorFilter('all');
                }}
                className="w-full text-sm"
              >
                <X className="w-4 h-4 mr-2" />
                Limpar Filtros
              </Button>
            </div>
          )}
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
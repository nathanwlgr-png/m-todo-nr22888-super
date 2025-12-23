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
  X,
  Tag,
  TrendingUp,
  Upload,
  ArrowUpDown
} from 'lucide-react';
import ClientCard from '@/components/ClientCard';
import SalesFunnelChart from '@/components/SalesFunnelChart';

export default function Clients() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [scoreFilter, setScoreFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showFunnel, setShowFunnel] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [visitFilter, setVisitFilter] = useState('all');
  const [pipelineFilter, setPipelineFilter] = useState('all');
  const [sortBy, setSortBy] = useState('city'); // 'city', 'alpha', 'importance'

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-updated_date'),
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['sales'],
    queryFn: () => base44.entities.Sale.list(),
  });

  const { data: allVisits = [] } = useQuery({
    queryKey: ['all-visits'],
    queryFn: () => base44.entities.Visit.list('-scheduled_date', 500),
  });

  // Lista única de cidades
  // Cidades da região laranja (Nathan)
  const ORANGE_REGION_CITIES = [
    'Marília', 'Presidente Prudente', 'Assis', 'Tupã', 'Adamantina', 
    'Bauru', 'Araçatuba', 'Ourinhos', 'Dracena', 'Lins'
  ];

  const cities = useMemo(() => {
    const unique = [...new Set(clients.map(c => c.city).filter(Boolean))];
    return unique.sort();
  }, [clients]);

  const cityCoverage = useMemo(() => {
    const clientCities = new Set(clients.map(c => c.city).filter(Boolean));
    const covered = ORANGE_REGION_CITIES.filter(city => 
      Array.from(clientCities).some(clientCity => 
        clientCity.toLowerCase().includes(city.toLowerCase())
      )
    );
    const missing = ORANGE_REGION_CITIES.filter(city => !covered.includes(city));
    
    return { covered, missing, clientCities: Array.from(clientCities) };
  }, [clients]);

  // Busca e ordenação
  const filteredClients = useMemo(() => {
    let filtered = clients.filter(client => {
      // Busca por nome do cliente ou clínica
      const matchesSearch = !search || (
        client.first_name?.toLowerCase().includes(search.toLowerCase()) ||
        client.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        client.clinic_name?.toLowerCase().includes(search.toLowerCase())
      );
      
      // Filtros
      const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
      const matchesCity = cityFilter === 'all' || client.city === cityFilter;
      
      // Score filter
      let matchesScore = true;
      if (scoreFilter !== 'all') {
        const score = client.purchase_score || 0;
        if (scoreFilter === 'high') matchesScore = score >= 70;
        else if (scoreFilter === 'medium') matchesScore = score >= 40 && score < 70;
        else if (scoreFilter === 'low') matchesScore = score < 40;
      }

      // Filtro de visitas
      let matchesVisit = true;
      if (visitFilter !== 'all') {
        const hasScheduled = allVisits.some(v => v.client_id === client.id && v.status === 'agendada');
        const hasCompleted = allVisits.some(v => v.client_id === client.id && v.status === 'realizada');
        if (visitFilter === 'scheduled') matchesVisit = hasScheduled;
        else if (visitFilter === 'completed') matchesVisit = hasCompleted;
        else if (visitFilter === 'none') matchesVisit = !hasScheduled && !hasCompleted;
      }

      // Filtro de pipeline
      const matchesPipeline = pipelineFilter === 'all' || 
        client.visit_objective === pipelineFilter || 
        client.pipeline_stage === pipelineFilter;
      
      return matchesSearch && matchesStatus && matchesScore && matchesCity && matchesVisit && matchesPipeline;
    });

    // Ordenação
    if (sortBy === 'city') {
      // Agrupa por cidade e ordena alfabeticamente dentro de cada grupo
      filtered.sort((a, b) => {
        const cityA = a.city || 'Sem cidade';
        const cityB = b.city || 'Sem cidade';
        if (cityA !== cityB) return cityA.localeCompare(cityB);
        return (a.first_name || '').localeCompare(b.first_name || '');
      });
    } else if (sortBy === 'alpha') {
      // Ordem alfabética por nome
      filtered.sort((a, b) => (a.first_name || '').localeCompare(b.first_name || ''));
    } else if (sortBy === 'importance') {
      // Ordem de importância: status + score
      filtered.sort((a, b) => {
        const statusPriority = { quente: 3, morno: 2, frio: 1 };
        const priorityA = (statusPriority[a.status] || 0) * 100 + (a.purchase_score || 0);
        const priorityB = (statusPriority[b.status] || 0) * 100 + (b.purchase_score || 0);
        return priorityB - priorityA;
      });
    }

    return filtered;
  }, [clients, search, statusFilter, scoreFilter, cityFilter, visitFilter, pipelineFilter, allVisits, sortBy]);

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

  const activeFiltersCount = [statusFilter, scoreFilter, cityFilter, visitFilter, pipelineFilter].filter(f => f !== 'all').length;

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
            variant={showFunnel ? "default" : "outline"}
            onClick={() => setShowFunnel(!showFunnel)}
            className={`mr-2 ${showFunnel ? 'bg-indigo-600' : ''}`}
          >
            <TrendingUp className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(createPageUrl('ImportClientsTable'))}
            className="mr-2"
          >
            <Upload className="w-4 h-4" />
          </Button>
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
              placeholder="Buscar por nome do cliente ou clínica..."
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

        {/* Ordenação */}
        <div className="px-4 pb-3">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="h-10 border-2">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4" />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="city">🏙️ Por Cidade (agrupado)</SelectItem>
              <SelectItem value="alpha">🔤 Ordem Alfabética</SelectItem>
              <SelectItem value="importance">⭐ Por Importância</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* City Coverage - Região Laranja */}
        <div className="px-4 pb-4 bg-gradient-to-r from-orange-50 to-amber-50 border-t">
          <div className="p-4">
            <h3 className="font-bold text-orange-900 mb-3 flex items-center gap-2">
              🟠 Cobertura - Região Laranja
              <span className="text-sm font-normal text-orange-700">
                ({cityCoverage.covered.length}/{ORANGE_REGION_CITIES.length} cidades)
              </span>
            </h3>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 bg-green-100 rounded-lg text-center">
                <p className="text-3xl font-bold text-green-800">{cityCoverage.covered.length}</p>
                <p className="text-xs text-green-700">Com Clientes</p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg text-center">
                <p className="text-3xl font-bold text-red-800">{cityCoverage.missing.length}</p>
                <p className="text-xs text-red-700">Sem Clientes</p>
              </div>
            </div>

            {cityCoverage.covered.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-semibold text-green-800 mb-2">✅ Cidades com Clientes:</p>
                <div className="flex flex-wrap gap-1">
                  {cityCoverage.covered.map(city => (
                    <span key={city} className="px-2 py-1 bg-green-200 text-green-900 rounded-full text-xs font-medium">
                      {city}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {cityCoverage.missing.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-red-800 mb-2">⚠️ Cidades Faltando:</p>
                <div className="flex flex-wrap gap-1">
                  {cityCoverage.missing.map(city => (
                    <span key={city} className="px-2 py-1 bg-red-200 text-red-900 rounded-full text-xs font-medium">
                      {city}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {cityCoverage.clientCities.length > ORANGE_REGION_CITIES.length && (
              <div className="mt-3 p-2 bg-blue-100 rounded-lg">
                <p className="text-xs text-blue-800">
                  ℹ️ Há {cityCoverage.clientCities.length - cityCoverage.covered.length} clientes em cidades fora da região laranja
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Funnel Chart */}
        {showFunnel && (
          <div className="px-4 pb-4 bg-slate-50 border-t">
            <SalesFunnelChart clients={clients} />
          </div>
        )}

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
                <label className="text-xs font-medium text-slate-600 mb-2 block">Score de Compra</label>
                <Select value={scoreFilter} onValueChange={setScoreFilter}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os scores</SelectItem>
                    <SelectItem value="high">Alto (70-100)</SelectItem>
                    <SelectItem value="medium">Médio (40-69)</SelectItem>
                    <SelectItem value="low">Baixo (0-39)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 mb-2 block">Cidade</label>
                <Select value={cityFilter} onValueChange={setCityFilter}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as cidades</SelectItem>
                    {cities.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 mb-2 block">Situação de Visita</label>
                <Select value={visitFilter} onValueChange={setVisitFilter}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="scheduled">📅 Com Visita Agendada</SelectItem>
                    <SelectItem value="completed">✓ Já Visitados</SelectItem>
                    <SelectItem value="none">Sem Visita</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 mb-2 block">Fase da Negociação</label>
                <Select value={pipelineFilter} onValueChange={setPipelineFilter}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Fases</SelectItem>
                    <SelectItem value="diagnosticar_necessidades">Diagnóstico</SelectItem>
                    <SelectItem value="apresentar_equipamento">Apresentação</SelectItem>
                    <SelectItem value="demonstracao_tecnica">Demo Técnica</SelectItem>
                    <SelectItem value="negociar_proposta">Negociação</SelectItem>
                    <SelectItem value="fechar_venda">Fechamento</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="ghost"
                onClick={() => {
                  setStatusFilter('all');
                  setScoreFilter('all');
                  setCityFilter('all');
                  setVisitFilter('all');
                  setPipelineFilter('all');
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
          <>
            {sortBy === 'city' && (() => {
              // Agrupa por cidade
              const grouped = filteredClients.reduce((acc, client) => {
                const city = client.city || 'Sem cidade';
                if (!acc[city]) acc[city] = [];
                acc[city].push(client);
                return acc;
              }, {});

              return Object.entries(grouped).map(([city, cityClients]) => (
                <div key={city} className="space-y-3">
                  <div className="sticky top-20 bg-slate-50 py-2 z-10">
                    <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide flex items-center gap-2">
                      📍 {city}
                      <span className="text-xs font-normal text-slate-500">({cityClients.length})</span>
                    </h3>
                  </div>
                  {cityClients.map((client) => {
                    const hasPurchase = sales.some(s => 
                      s.client_id === client.id && 
                      (s.status === 'fechada' || s.status === 'entregue')
                    );
                    const scheduledVisit = allVisits.find(v => 
                      v.client_id === client.id && 
                      v.status === 'agendada'
                    );
                    const lastVisit = allVisits.find(v => 
                      v.client_id === client.id && 
                      v.status === 'realizada'
                    );
                    return (
                      <ClientCard 
                        key={client.id} 
                        client={client} 
                        hasPurchase={hasPurchase} 
                        scheduledVisit={scheduledVisit}
                        lastVisit={lastVisit}
                      />
                    );
                  })}
                </div>
              ));
            })()}

            {sortBy !== 'city' && filteredClients.map((client) => {
              const hasPurchase = sales.some(s => 
                s.client_id === client.id && 
                (s.status === 'fechada' || s.status === 'entregue')
              );
              const scheduledVisit = allVisits.find(v => 
                v.client_id === client.id && 
                v.status === 'agendada'
              );
              const lastVisit = allVisits.find(v => 
                v.client_id === client.id && 
                v.status === 'realizada'
              );
              return (
                <ClientCard 
                  key={client.id} 
                  client={client} 
                  hasPurchase={hasPurchase} 
                  scheduledVisit={scheduledVisit}
                  lastVisit={lastVisit}
                />
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}
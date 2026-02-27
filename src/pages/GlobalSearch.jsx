import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Search, Users, X, SlidersHorizontal, ArrowUpDown, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { format, subDays, subMonths, isAfter } from 'date-fns';

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos os status' },
  { value: 'quente', label: '🔥 Quente' },
  { value: 'morno', label: '🌡️ Morno' },
  { value: 'frio', label: '❄️ Frio' },
];

const PIPELINE_OPTIONS = [
  { value: 'all', label: 'Todos os estágios' },
  { value: 'lead', label: 'Lead' },
  { value: 'qualificado', label: 'Qualificado' },
  { value: 'proposta', label: 'Proposta' },
  { value: 'negociacao', label: 'Negociação' },
  { value: 'fechado', label: 'Fechado' },
  { value: 'perdido', label: 'Perdido' },
];

const DATE_OPTIONS = [
  { value: 'all', label: 'Qualquer data' },
  { value: '7d', label: 'Últimos 7 dias' },
  { value: '30d', label: 'Últimos 30 dias' },
  { value: '90d', label: 'Últimos 3 meses' },
  { value: '180d', label: 'Últimos 6 meses' },
];

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevância' },
  { value: 'updated_desc', label: 'Atualizado (recente)' },
  { value: 'updated_asc', label: 'Atualizado (antigo)' },
  { value: 'created_desc', label: 'Criado (recente)' },
  { value: 'created_asc', label: 'Criado (antigo)' },
  { value: 'score_desc', label: 'Score (maior)' },
  { value: 'name_asc', label: 'Nome (A-Z)' },
];

function getDateCutoff(dateFilter) {
  const now = new Date();
  if (dateFilter === '7d') return subDays(now, 7);
  if (dateFilter === '30d') return subDays(now, 30);
  if (dateFilter === '90d') return subMonths(now, 3);
  if (dateFilter === '180d') return subMonths(now, 6);
  return null;
}

function calcRelevance(client, searchTerms) {
  let score = 0;
  const fields = [
    { v: client.first_name, w: 5 },
    { v: client.full_name, w: 4 },
    { v: client.clinic_name, w: 3 },
    { v: client.city, w: 2 },
    { v: client.email, w: 2 },
    { v: client.notes, w: 1 },
    { v: client.equipment_interest, w: 1 },
  ];
  for (const term of searchTerms) {
    for (const { v, w } of fields) {
      if (v?.toLowerCase().includes(term)) score += w;
    }
  }
  if (client.status === 'quente') score += 2;
  if (client.purchase_score > 70) score += 2;
  return score;
}

export default function GlobalSearch() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [pipelineFilter, setPipelineFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortBy, setSortBy] = useState('relevance');

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-updated_date')
  });

  const activeFiltersCount = [
    statusFilter !== 'all',
    pipelineFilter !== 'all',
    dateFilter !== 'all',
  ].filter(Boolean).length;

  const results = useMemo(() => {
    const searchTerms = searchTerm.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const dateCutoff = getDateCutoff(dateFilter);

    let filtered = clients.filter(c => {
      // Keyword filter
      if (searchTerms.length > 0) {
        const matchesAny = searchTerms.some(term =>
          c.first_name?.toLowerCase().includes(term) ||
          c.full_name?.toLowerCase().includes(term) ||
          c.email?.toLowerCase().includes(term) ||
          c.phone?.includes(term) ||
          c.clinic_name?.toLowerCase().includes(term) ||
          c.city?.toLowerCase().includes(term) ||
          c.notes?.toLowerCase().includes(term) ||
          c.equipment_interest?.toLowerCase().includes(term)
        );
        if (!matchesAny) return false;
      }

      // Status filter
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;

      // Pipeline filter
      if (pipelineFilter !== 'all' && c.pipeline_stage !== pipelineFilter) return false;

      // Date filter
      if (dateCutoff) {
        const updatedAt = c.updated_date ? new Date(c.updated_date) : new Date(0);
        if (!isAfter(updatedAt, dateCutoff)) return false;
      }

      return true;
    });

    // Sorting
    if (sortBy === 'relevance' && searchTerms.length > 0) {
      filtered = filtered.map(c => ({ ...c, _relevance: calcRelevance(c, searchTerms) }))
        .sort((a, b) => b._relevance - a._relevance);
    } else if (sortBy === 'updated_desc') {
      filtered.sort((a, b) => new Date(b.updated_date || 0) - new Date(a.updated_date || 0));
    } else if (sortBy === 'updated_asc') {
      filtered.sort((a, b) => new Date(a.updated_date || 0) - new Date(b.updated_date || 0));
    } else if (sortBy === 'created_desc') {
      filtered.sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0));
    } else if (sortBy === 'created_asc') {
      filtered.sort((a, b) => new Date(a.created_date || 0) - new Date(b.created_date || 0));
    } else if (sortBy === 'score_desc') {
      filtered.sort((a, b) => (b.purchase_score || 0) - (a.purchase_score || 0));
    } else if (sortBy === 'name_asc') {
      filtered.sort((a, b) => (a.first_name || '').localeCompare(b.first_name || ''));
    }

    return filtered;
  }, [searchTerm, clients, statusFilter, pipelineFilter, dateFilter, sortBy]);

  const clearAll = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setPipelineFilter('all');
    setDateFilter('all');
    setSortBy('relevance');
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b px-4 py-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-slate-100">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <h1 className="text-lg font-semibold text-slate-800 flex-1">Busca Avançada</h1>
          {(searchTerm || activeFiltersCount > 0) && (
            <button onClick={clearAll} className="text-xs text-indigo-600 hover:underline">
              Limpar tudo
            </button>
          )}
        </div>

        {/* Search input */}
        <div className="relative mb-3">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder="Nome, clínica, cidade, email, equipamento, notas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-11 pl-12 pr-10 text-sm rounded-xl border-2 focus:border-indigo-400"
            autoFocus
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded">
              <X className="w-4 h-4 text-slate-400" />
            </button>
          )}
        </div>

        {/* Filter toggle + sort row */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(v => !v)}
            className={`gap-1.5 text-xs h-8 ${activeFiltersCount > 0 ? 'border-indigo-500 text-indigo-600 bg-indigo-50' : ''}`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filtros
            {activeFiltersCount > 0 && (
              <span className="bg-indigo-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                {activeFiltersCount}
              </span>
            )}
            {showFilters ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </Button>

          <div className="flex-1" />

          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-8 text-xs w-40 border-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map(o => (
                  <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Estágio Pipeline</label>
              <Select value={pipelineFilter} onValueChange={setPipelineFilter}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PIPELINE_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Atualizado em
              </label>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DATE_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Results count */}
        <div className="flex items-center gap-2 mt-3">
          <Users className="w-4 h-4 text-indigo-600" />
          <p className="text-sm text-slate-600">
            {searchTerm || activeFiltersCount > 0
              ? `${results.length} resultado(s) encontrado(s)`
              : `${clients.length} cliente(s) cadastrado(s)`}
          </p>
        </div>
      </div>

      {/* Results */}
      <div className="p-4">
        {isLoading ? (
          <div className="text-center py-12 text-slate-400">Carregando...</div>
        ) : results.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500 font-medium">Nenhum resultado encontrado</p>
            <p className="text-slate-400 text-sm mt-1">Tente ajustar os filtros ou o termo de busca</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={clearAll}>
              Limpar filtros
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {results.map(client => (
              <Card
                key={client.id}
                className="p-4 cursor-pointer hover:shadow-md transition-shadow border-l-4"
                style={{
                  borderLeftColor:
                    client.status === 'quente' ? '#ef4444' :
                    client.status === 'morno' ? '#f59e0b' : '#60a5fa'
                }}
                onClick={() => navigate(createPageUrl(`ClientProfile?id=${client.id}`))}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="font-semibold text-slate-800">{client.first_name}</p>
                      {client.full_name && client.full_name !== client.first_name && (
                        <span className="text-slate-500 text-sm">{client.full_name}</span>
                      )}
                      <Badge className={
                        client.status === 'quente' ? 'bg-red-500 text-white text-[10px]' :
                        client.status === 'morno' ? 'bg-yellow-500 text-white text-[10px]' :
                        'bg-blue-400 text-white text-[10px]'
                      }>
                        {client.status || 'morno'}
                      </Badge>
                      {client.pipeline_stage && (
                        <Badge variant="outline" className="text-[10px]">{client.pipeline_stage}</Badge>
                      )}
                    </div>

                    {client.clinic_name && (
                      <p className="text-sm text-slate-600 truncate">{client.clinic_name}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-slate-500">
                      {client.city && <span>📍 {client.city}</span>}
                      {client.email && <span className="truncate">✉️ {client.email}</span>}
                      {client.equipment_interest && <span>🔬 {client.equipment_interest}</span>}
                      {client.updated_date && (
                        <span className="ml-auto text-slate-400">
                          {format(new Date(client.updated_date), 'dd/MM/yy')}
                        </span>
                      )}
                    </div>
                  </div>

                  {client.purchase_score > 0 && (
                    <div className="text-right flex-shrink-0">
                      <p className="text-lg font-bold text-indigo-600">{client.purchase_score}%</p>
                      <p className="text-[10px] text-slate-500">Score</p>
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
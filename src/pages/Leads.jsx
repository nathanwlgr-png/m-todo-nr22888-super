import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PullToRefresh from '@/components/PullToRefresh';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import LeadsPriorityList from '@/components/LeadsPriorityList';
import LeadSheetsSync from '@/components/leads/LeadSheetsSync';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Plus,
  Search,
  Filter,
  X,
  UserPlus,
  TrendingUp,
  Users,
  Target,
  CheckCircle,
  Upload
} from 'lucide-react';
import { calculateLeadScore, getLeadQuality } from '@/components/LeadScoringEngine';
import { format } from 'date-fns';

export default function Leads() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState({
    status: 'all',
    source: 'all',
    assignee: 'all',
    search: ''
  });

  const { data: leads = [], isLoading, refetch: refetchLeads } = useQuery({
    queryKey: ['leads'],
    queryFn: () => base44.entities.Lead.list('-created_date', 200)
  });

  const handleRefresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['leads'] });
  }, [queryClient]);

  // Optimistic update for lead status changes
  const updateLeadMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Lead.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ['leads'] });
      const prev = queryClient.getQueryData(['leads']);
      queryClient.setQueryData(['leads'], (old) =>
        old ? old.map(l => l.id === id ? { ...l, ...data } : l) : old
      );
      return { prev };
    },
    onError: (_, __, ctx) => { if (ctx?.prev) queryClient.setQueryData(['leads'], ctx.prev); },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['leads'] }),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list()
  });

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      if (filters.status !== 'all' && lead.status !== filters.status) return false;
      if (filters.source !== 'all' && lead.source !== filters.source) return false;
      if (filters.assignee === 'me' && lead.assigned_to !== currentUser?.email) return false;
      if (filters.assignee === 'unassigned' && lead.assigned_to) return false;
      if (filters.assignee !== 'all' && filters.assignee !== 'me' && filters.assignee !== 'unassigned' && lead.assigned_to !== filters.assignee) return false;
      
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        return (
          lead.full_name?.toLowerCase().includes(searchLower) ||
          lead.company?.toLowerCase().includes(searchLower) ||
          lead.email?.toLowerCase().includes(searchLower)
        );
      }

      return true;
    });
  }, [leads, filters, currentUser]);

  const metrics = useMemo(() => {
    const total = leads.length;
    const novo = leads.filter(l => l.status === 'novo').length;
    const qualificado = leads.filter(l => l.status === 'qualificado').length;
    const convertido = leads.filter(l => l.status === 'convertido').length;
    const avgScore = leads.length > 0 
      ? Math.round(leads.reduce((sum, l) => sum + (l.lead_score || 0), 0) / leads.length)
      : 0;

    return { total, novo, qualificado, convertido, avgScore };
  }, [leads]);

  const clearFilters = () => {
    setFilters({
      status: 'all',
      source: 'all',
      assignee: 'all',
      search: ''
    });
  };

  const hasActiveFilters = 
    filters.status !== 'all' || 
    filters.source !== 'all' || 
    filters.assignee !== 'all' || 
    filters.search;

  const statusLabels = {
    novo: 'Novo',
    contatado: 'Contatado',
    qualificado: 'Qualificado',
    desqualificado: 'Desqualificado',
    convertido: 'Convertido'
  };

  const sourceLabels = {
    formulario_web: 'Formulário Web',
    importacao_manual: 'Importação',
    indicacao: 'Indicação',
    evento: 'Evento',
    linkedin: 'LinkedIn',
    google: 'Google',
    outro: 'Outro'
  };

  return (
    <PullToRefresh onRefresh={handleRefresh} className="min-h-screen">
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-600 to-indigo-600 px-4 pt-4 pb-16 rounded-b-[2rem]">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-white/10">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-white">Gestão de Leads</h1>
            <p className="text-sm text-purple-100">{filteredLeads.length} leads</p>
          </div>
          <Button
            onClick={() => navigate(createPageUrl('LeadsDashboard'))}
            variant="outline"
            size="sm"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <TrendingUp className="w-4 h-4 mr-1" />
            Dashboard
          </Button>
        </div>

        {/* Metrics - CLICÁVEIS */}
        <div className="grid grid-cols-4 gap-2">
          <button onClick={() => setFilters({...filters, status: 'novo'})} className="text-left">
            <Card className="p-3 bg-white/10 backdrop-blur-sm border-white/20 cursor-pointer hover:bg-white/20 transition-all">
              <p className="text-xs text-purple-100 mb-1">Novos</p>
              <p className="text-xl font-bold text-white">{metrics.novo}</p>
            </Card>
          </button>
          <button onClick={() => setFilters({...filters, status: 'qualificado'})} className="text-left">
            <Card className="p-3 bg-white/10 backdrop-blur-sm border-white/20 cursor-pointer hover:bg-white/20 transition-all">
              <p className="text-xs text-purple-100 mb-1">Qualif.</p>
              <p className="text-xl font-bold text-white">{metrics.qualificado}</p>
            </Card>
          </button>
          <button onClick={() => setFilters({...filters, status: 'convertido'})} className="text-left">
            <Card className="p-3 bg-white/10 backdrop-blur-sm border-white/20 cursor-pointer hover:bg-white/20 transition-all">
              <p className="text-xs text-purple-100 mb-1">Convert.</p>
              <p className="text-xl font-bold text-white">{metrics.convertido}</p>
            </Card>
          </button>
          <button onClick={() => {}} className="text-left">
            <Card className="p-3 bg-white/10 backdrop-blur-sm border-white/20 cursor-default">
              <p className="text-xs text-purple-100 mb-1">Score</p>
              <p className="text-xl font-bold text-white">{metrics.avgScore}</p>
            </Card>
          </button>
        </div>
      </div>

      <div className="px-4 -mt-8 space-y-4">
        <LeadSheetsSync />
        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => navigate(createPageUrl('CaptureLeads'))}
            className="h-12 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Lead
          </Button>
          <Button
            onClick={() => navigate(createPageUrl('ImportLeads'))}
            variant="outline"
            className="h-12 border-2"
          >
            <Upload className="w-4 h-4 mr-2" />
            Importar
          </Button>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-purple-600" />
              <span className="font-semibold text-slate-800">Filtros</span>
            </div>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 text-xs">
                <X className="w-3 h-3 mr-1" />
                Limpar
              </Button>
            )}
          </div>

          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar por nome, empresa ou email..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-9 h-9"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v })}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Status</SelectItem>
                  <SelectItem value="novo">Novo</SelectItem>
                  <SelectItem value="contatado">Contatado</SelectItem>
                  <SelectItem value="qualificado">Qualificado</SelectItem>
                  <SelectItem value="desqualificado">Desqualificado</SelectItem>
                  <SelectItem value="convertido">Convertido</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.source} onValueChange={(v) => setFilters({ ...filters, source: v })}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas Fontes</SelectItem>
                  <SelectItem value="formulario_web">Form. Web</SelectItem>
                  <SelectItem value="importacao_manual">Importação</SelectItem>
                  <SelectItem value="indicacao">Indicação</SelectItem>
                  <SelectItem value="evento">Evento</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="google">Google</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.assignee} onValueChange={(v) => setFilters({ ...filters, assignee: v })}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="me">Meus</SelectItem>
                  <SelectItem value="unassigned">Sem dono</SelectItem>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.email}>
                      {user.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Leads List */}
        {filteredLeads.length === 0 ? (
          <Card className="p-12 text-center">
            <Users className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500 mb-4">
              {hasActiveFilters ? 'Nenhum lead encontrado' : 'Nenhum lead cadastrado'}
            </p>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Limpar filtros
              </Button>
            )}
          </Card>
        ) : (
          <div className="space-y-2">
            {filteredLeads.map(lead => {
              const quality = getLeadQuality(lead.lead_score || 0);
              
              return (
                <Card
                  key={lead.id}
                  className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(createPageUrl(`LeadProfile?id=${lead.id}`))}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full ${quality.color} flex items-center justify-center text-white font-bold shrink-0`}>
                      {lead.lead_score || 0}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-slate-800 truncate">{lead.full_name}</p>
                        <Badge className={`${quality.color} text-white text-xs`}>
                          {quality.label}
                        </Badge>
                      </div>
                      
                      {lead.company && (
                        <p className="text-sm text-slate-600 truncate">{lead.company}</p>
                      )}
                      
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {statusLabels[lead.status]}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {sourceLabels[lead.source]}
                        </Badge>
                        {lead.assigned_to_name && (
                          <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                            {lead.assigned_to_name}
                          </Badge>
                        )}
                        {lead.city && (
                          <span className="text-xs text-slate-500">{lead.city}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
        </div>
        <div className="hidden lg:block">
          <div className="sticky top-6">
            <LeadsPriorityList />
          </div>
        </div>
      </div>
    </div>
    </PullToRefresh>
  );
}
import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function AdvancedClientSearch() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    scoreRange: 'all',
    engagement: 'all',
    type: 'all'
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients-list'],
    queryFn: async () => {
      try {
        return await base44.entities.Client.list('-updated_date', 500);
      } catch (error) {
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: scores = [] } = useQuery({
    queryKey: ['clients-scores'],
    queryFn: async () => {
      try {
        return await base44.entities.ClientScore.list('-overall_score', 500);
      } catch (error) {
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  const clientsWithScores = useMemo(() => {
    return clients.map(client => {
      const score = scores.find(s => s.client_id === client.id);
      return { ...client, score };
    });
  }, [clients, scores]);

  const filtered = useMemo(() => {
    return clientsWithScores.filter(client => {
      // Busca por texto
      if (searchTerm && !`${client.first_name} ${client.clinic_name} ${client.city}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())) {
        return false;
      }

      // Filtro status
      if (filters.status !== 'all' && client.status !== filters.status) {
        return false;
      }

      // Filtro score
      if (filters.scoreRange !== 'all' && client.score) {
        const score = client.score.overall_score;
        if (filters.scoreRange === 'high' && score < 70) return false;
        if (filters.scoreRange === 'medium' && (score < 40 || score >= 70)) return false;
        if (filters.scoreRange === 'low' && score >= 40) return false;
      }

      // Filtro engajamento
      if (filters.engagement !== 'all' && client.score?.engagement_level !== filters.engagement) {
        return false;
      }

      // Filtro tipo
      if (filters.type !== 'all' && client.client_type !== filters.type) {
        return false;
      }

      return true;
    });
  }, [clientsWithScores, searchTerm, filters]);

  return (
    <div className="space-y-4">
      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Buscar cliente, clínica, cidade..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-2 gap-2">
        <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v })}>
          <SelectTrigger className="h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="quente">🔥 Quente</SelectItem>
            <SelectItem value="morno">🌡️ Morno</SelectItem>
            <SelectItem value="frio">❄️ Frio</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.scoreRange} onValueChange={(v) => setFilters({ ...filters, scoreRange: v })}>
          <SelectTrigger className="h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Scores</SelectItem>
            <SelectItem value="high">Score Alto (70+)</SelectItem>
            <SelectItem value="medium">Score Médio (40-69)</SelectItem>
            <SelectItem value="low">Score Baixo (&lt;40)</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.engagement} onValueChange={(v) => setFilters({ ...filters, engagement: v })}>
          <SelectTrigger className="h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Engajamentos</SelectItem>
            <SelectItem value="very_high">Muito Alto</SelectItem>
            <SelectItem value="high">Alto</SelectItem>
            <SelectItem value="medium">Médio</SelectItem>
            <SelectItem value="low">Baixo</SelectItem>
            <SelectItem value="very_low">Muito Baixo</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.type} onValueChange={(v) => setFilters({ ...filters, type: v })}>
          <SelectTrigger className="h-9 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Tipos</SelectItem>
            <SelectItem value="clinica_pequena">Clínica Pequena</SelectItem>
            <SelectItem value="clinica_media">Clínica Média</SelectItem>
            <SelectItem value="hospital_veterinario">Hospital Veterinário</SelectItem>
            <SelectItem value="laboratorio_terceirizado">Lab. Terceirizado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Resultados */}
      <div className="space-y-2">
        <p className="text-sm text-slate-600">{filtered.length} clientes encontrados</p>
        {filtered.map(client => (
          <Card
            key={client.id}
            className="p-3 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => navigate(createPageUrl(`ClientProfile?id=${client.id}`))}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="font-semibold text-slate-900">{client.first_name}</p>
                <p className="text-xs text-slate-600">{client.clinic_name} • {client.city}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  <Badge className={
                    client.status === 'quente' ? 'bg-red-100 text-red-700' :
                    client.status === 'morno' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-blue-100 text-blue-700'
                  }>
                    {client.status}
                  </Badge>
                  {client.score && (
                    <Badge className="bg-indigo-100 text-indigo-700">
                      Score: {client.score.overall_score}
                    </Badge>
                  )}
                </div>
              </div>
              {client.score && (
                <div className="text-right">
                  <p className="text-2xl font-bold text-indigo-600">{client.score.overall_score}</p>
                  <p className="text-xs text-slate-600">{client.score.conversion_probability}% conv.</p>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
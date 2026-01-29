import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, 
  Search, 
  TrendingUp, 
  MapPin, 
  Phone,
  Instagram,
  UserPlus,
  Trash2,
  Filter,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

/**
 * PÁGINA DE POSSÍVEIS VENDAS
 * LEADS CADASTRADOS POR BUSCA REGIONAL
 */
export default function PossibleSales() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('all');

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['leads'],
    queryFn: () => base44.entities.Lead.list('-created_date', 200)
  });

  const convertToClient = useMutation({
    mutationFn: async (lead) => {
      const client = await base44.entities.Client.create({
        first_name: lead.full_name,
        clinic_name: lead.company,
        city: lead.city,
        phone: lead.phone,
        instagram_handle: lead.instagram_handle,
        email: lead.email,
        lead_source: lead.source,
        status: 'morno',
        purchase_score: lead.lead_score || 50,
        notes: `Convertido de lead em ${new Date().toLocaleDateString('pt-BR')}\n${lead.notes || ''}`
      });
      
      await base44.entities.Lead.update(lead.id, {
        status: 'convertido',
        converted_to_client_id: client.id
      });
      
      return client;
    },
    onSuccess: (client) => {
      queryClient.invalidateQueries(['leads']);
      queryClient.invalidateQueries(['clients']);
      toast.success('Convertido para cliente!');
      navigate(createPageUrl(`ClientProfile?id=${client.id}`));
    }
  });

  const deleteLead = useMutation({
    mutationFn: (id) => base44.entities.Lead.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['leads']);
      toast.success('Lead removido');
    }
  });

  const cities = [...new Set(leads.map(l => l.city).filter(Boolean))];

  const filteredLeads = leads.filter(l => {
    const matchSearch = !search || 
      l.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      l.company?.toLowerCase().includes(search.toLowerCase()) ||
      l.city?.toLowerCase().includes(search.toLowerCase());
    
    const matchCity = cityFilter === 'all' || l.city === cityFilter;
    
    return matchSearch && matchCity && l.status !== 'convertido';
  });

  const statusColors = {
    novo: 'bg-blue-500',
    contatado: 'bg-purple-500',
    qualificado: 'bg-green-500',
    desqualificado: 'bg-red-500'
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="bg-gradient-to-br from-emerald-900 to-teal-700 px-4 pt-4 pb-12">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full glass">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-white">Possíveis Vendas</h1>
            <p className="text-sm text-emerald-200">Leads de busca regional</p>
          </div>
          <Badge className="bg-white/20 text-white text-lg px-3 py-1">
            {filteredLeads.length}
          </Badge>
        </div>
      </div>

      <div className="px-4 -mt-8 space-y-4">
        {/* Search & Filters */}
        <Card className="p-4">
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar leads..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              <Filter className="w-4 h-4 text-slate-500 flex-shrink-0" />
              <Button
                size="sm"
                variant={cityFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setCityFilter('all')}
                className="whitespace-nowrap"
              >
                Todas ({leads.length})
              </Button>
              {cities.map(city => (
                <Button
                  key={city}
                  size="sm"
                  variant={cityFilter === city ? 'default' : 'outline'}
                  onClick={() => setCityFilter(city)}
                  className="whitespace-nowrap"
                >
                  📍 {city} ({leads.filter(l => l.city === city).length})
                </Button>
              ))}
            </div>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-3 text-center">
            <p className="text-2xl font-bold text-blue-700">{leads.filter(l => l.status === 'novo').length}</p>
            <p className="text-xs text-slate-600">Novos</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-2xl font-bold text-green-700">{leads.filter(l => l.status === 'qualificado').length}</p>
            <p className="text-xs text-slate-600">Qualificados</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-2xl font-bold text-purple-700">{leads.filter(l => l.status === 'contatado').length}</p>
            <p className="text-xs text-slate-600">Contatados</p>
          </Card>
        </div>

        {/* Leads List */}
        <div className="space-y-3">
          {filteredLeads.map(lead => (
            <Card 
              key={lead.id} 
              className="p-4 cursor-pointer hover:shadow-lg transition-all"
              onClick={() => navigate(createPageUrl(`LeadProfile?id=${lead.id}`))}
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-lg">
                    {lead.company?.charAt(0) || lead.full_name?.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-800 truncate">{lead.company || lead.full_name}</h3>
                  <p className="text-sm text-slate-600">{lead.full_name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={`${statusColors[lead.status]} text-white text-xs`}>
                      {lead.status}
                    </Badge>
                    {lead.lead_score && (
                      <Badge variant="outline" className="text-xs">
                        {lead.lead_score}%
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Remover este lead?')) {
                      deleteLead.mutate(lead.id);
                    }
                  }}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>

              <div className="space-y-2 text-sm mb-3">
                {lead.city && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <MapPin className="w-4 h-4" />
                    <span>{lead.city}</span>
                  </div>
                )}
                {lead.phone && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Phone className="w-4 h-4" />
                    <a href={`https://wa.me/${lead.phone}`} target="_blank" className="text-green-600 hover:underline">
                      {lead.phone}
                    </a>
                  </div>
                )}
                {lead.instagram_handle && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Instagram className="w-4 h-4" />
                    <a 
                      href={`https://instagram.com/${lead.instagram_handle}`} 
                      target="_blank"
                      className="text-pink-600 hover:underline"
                    >
                      @{lead.instagram_handle}
                    </a>
                  </div>
                )}
              </div>

              {lead.notes && (
                <p className="text-xs text-slate-600 mb-3 border-l-2 border-slate-300 pl-2">
                  {lead.notes}
                </p>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    convertToClient.mutate(lead);
                  }}
                  disabled={convertToClient.isPending}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  size="sm"
                >
                  <UserPlus className="w-4 h-4 mr-1" />
                  Converter para Cliente
                </Button>
              </div>
            </Card>
          ))}

          {filteredLeads.length === 0 && !isLoading && (
            <Card className="p-8 text-center">
              <TrendingUp className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 mb-2">Nenhum lead encontrado</p>
              <p className="text-sm text-slate-500">Use a busca regional para encontrar novas clínicas</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
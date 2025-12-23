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
  Plus, 
  TrendingUp,
  Target,
  Calendar,
  DollarSign,
  Users,
  Play,
  Pause,
  CheckCircle2,
  BarChart3,
  Search
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const statusConfig = {
  rascunho: { label: 'Rascunho', color: 'bg-slate-100 text-slate-700', icon: '📝' },
  ativa: { label: 'Ativa', color: 'bg-green-100 text-green-700', icon: '✅' },
  pausada: { label: 'Pausada', color: 'bg-yellow-100 text-yellow-700', icon: '⏸️' },
  concluida: { label: 'Concluída', color: 'bg-blue-100 text-blue-700', icon: '🏁' },
  cancelada: { label: 'Cancelada', color: 'bg-red-100 text-red-700', icon: '❌' }
};

export default function Campaigns() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => base44.entities.Campaign.list('-created_date', 100),
  });

  const filteredCampaigns = campaigns.filter(c => {
    const matchesSearch = !search || c.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: campaigns.length,
    active: campaigns.filter(c => c.status === 'ativa').length,
    leads: campaigns.reduce((sum, c) => sum + (c.metrics?.current_leads || 0), 0),
    revenue: campaigns.reduce((sum, c) => sum + (c.metrics?.current_revenue || 0), 0),
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-900 to-indigo-900 px-4 pt-4 pb-16 rounded-b-[2rem]">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(createPageUrl('Home'))} className="p-2 -ml-2 rounded-full glass hover:bg-white/10">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-white">Campanhas de Vendas</h1>
            <p className="text-sm text-purple-200">Marketing inteligente</p>
          </div>
          <Button
            onClick={() => navigate(createPageUrl('NewCampaign'))}
            className="bg-white text-purple-900 hover:bg-purple-50"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-3 bg-white/10 border-white/20 backdrop-blur">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-white" />
              <p className="text-xs text-purple-200">Campanhas Ativas</p>
            </div>
            <p className="text-2xl font-bold text-white">{stats.active}</p>
          </Card>
          <Card className="p-3 bg-white/10 border-white/20 backdrop-blur">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-white" />
              <p className="text-xs text-purple-200">Leads Gerados</p>
            </div>
            <p className="text-2xl font-bold text-white">{stats.leads}</p>
          </Card>
        </div>
      </div>

      <div className="px-4 -mt-8 space-y-4">
        {/* Search and Filter */}
        <Card className="p-4 bg-white shadow-lg">
          <div className="flex gap-2 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar campanha..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            <Button
              variant={filterStatus === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('all')}
            >
              Todas
            </Button>
            {Object.entries(statusConfig).map(([key, config]) => (
              <Button
                key={key}
                variant={filterStatus === key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus(key)}
              >
                {config.icon} {config.label}
              </Button>
            ))}
          </div>
        </Card>

        {/* Campaigns List */}
        {filteredCampaigns.length === 0 ? (
          <Card className="p-8 text-center">
            <Target className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-slate-600 mb-4">Nenhuma campanha encontrada</p>
            <Button onClick={() => navigate(createPageUrl('NewCampaign'))}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeira Campanha
            </Button>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredCampaigns.map((campaign) => {
              const status = statusConfig[campaign.status] || statusConfig.rascunho;
              const progress = campaign.metrics?.target_sales > 0 
                ? (campaign.metrics.current_sales / campaign.metrics.target_sales) * 100 
                : 0;

              return (
                <Card
                  key={campaign.id}
                  className="p-4 hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => navigate(createPageUrl(`CampaignDetails?id=${campaign.id}`))}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-800 mb-1">{campaign.name}</h3>
                      <p className="text-sm text-slate-600">{campaign.objective}</p>
                    </div>
                    <Badge className={status.color}>
                      {status.icon} {status.label}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="text-xs">
                      <p className="text-slate-500 mb-1">Período</p>
                      <p className="font-medium text-slate-800">
                        {format(new Date(campaign.start_date), 'dd/MM', { locale: ptBR })} - {format(new Date(campaign.end_date), 'dd/MM', { locale: ptBR })}
                      </p>
                    </div>
                    <div className="text-xs">
                      <p className="text-slate-500 mb-1">Orçamento</p>
                      <p className="font-medium text-slate-800">
                        R$ {(campaign.budget || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {campaign.metrics && (
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-500">Progresso</span>
                        <span className="font-medium text-slate-700">
                          {campaign.metrics.current_sales}/{campaign.metrics.target_sales} vendas
                        </span>
                      </div>
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 transition-all"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  MapPin, 
  Calendar,
  TrendingUp,
  Loader2,
  Navigation,
  Clock,
  DollarSign
} from 'lucide-react';
import ClientSelector from '@/components/ClientSelector';

export default function VisitPlanner() {
  const navigate = useNavigate();
  const [selectedClientId, setSelectedClientId] = React.useState(null);

  const { data: clients = [], isLoading: loadingClients } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-updated_date', 500),
  });

  const { data: visits = [], isLoading: loadingVisits } = useQuery({
    queryKey: ['all-visits'],
    queryFn: () => base44.entities.Visit.list('-scheduled_date', 500),
  });

  const suggestedRoute = useMemo(() => {
    if (!clients.length) return [];

    // Filtrar por cliente selecionado se houver
    const filteredClients = selectedClientId 
      ? clients.filter(c => c.id === selectedClientId)
      : clients;

    // Calcular prioridade para cada cliente
    const clientsWithPriority = filteredClients.map(client => {
      // 1. Dias desde última visita
      const lastVisit = visits
        .filter(v => v.client_id === client.id && v.status === 'realizada')
        .sort((a, b) => new Date(b.scheduled_date) - new Date(a.scheduled_date))[0];
      
      const daysSinceLastVisit = lastVisit 
        ? Math.floor((Date.now() - new Date(lastVisit.scheduled_date)) / (1000 * 60 * 60 * 24))
        : 999; // Cliente nunca visitado

      // 2. Score de importância
      const statusScore = 
        client.status === 'quente' ? 100 : 
        client.status === 'morno' ? 60 : 30;
      
      const purchaseScore = client.purchase_score || 50;
      const revenueScore = Math.min((client.projected_revenue || 0) / 1000, 100);

      // 3. Fórmula de prioridade
      // Peso: tempo desde última visita (40%), status (30%), purchase score (20%), revenue (10%)
      const priorityScore = 
        (Math.min(daysSinceLastVisit, 90) / 90 * 40) +
        (statusScore / 100 * 30) +
        (purchaseScore / 100 * 20) +
        (revenueScore / 100 * 10);

      return {
        ...client,
        daysSinceLastVisit,
        priorityScore: Math.round(priorityScore * 100) / 100,
        lastVisitDate: lastVisit?.scheduled_date || null
      };
    });

    // Filtrar apenas clientes que não são "frio" há muito tempo sem visita recente
    const activeClients = clientsWithPriority.filter(c => 
      c.status !== 'frio' || c.daysSinceLastVisit > 30
    );

    // Ordenar por prioridade
    const sortedByPriority = activeClients.sort((a, b) => b.priorityScore - a.priorityScore);

    // Agrupar por cidade para otimizar rota
    const groupedByCity = sortedByPriority.reduce((acc, client) => {
      const city = client.city || 'Sem localização';
      if (!acc[city]) acc[city] = [];
      acc[city].push(client);
      return acc;
    }, {});

    // Ordenar cidades por prioridade média e quantidade
    const cityGroups = Object.entries(groupedByCity).map(([city, clients]) => {
      const avgPriority = clients.reduce((sum, c) => sum + c.priorityScore, 0) / clients.length;
      const totalRevenue = clients.reduce((sum, c) => sum + (c.projected_revenue || 0), 0);
      
      return {
        city,
        clients: clients.sort((a, b) => b.priorityScore - a.priorityScore),
        avgPriority: Math.round(avgPriority * 100) / 100,
        totalRevenue,
        count: clients.length
      };
    }).sort((a, b) => b.avgPriority - a.avgPriority);

    return cityGroups;
  }, [clients, visits, selectedClientId]);

  const totalClients = suggestedRoute.reduce((sum, group) => sum + group.count, 0);

  if (loadingClients || loadingVisits) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-600 px-4 pt-4 pb-16 rounded-b-[2rem]">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-white/10">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">Planejador de Visitas</h1>
            <p className="text-indigo-100 text-sm">Rota otimizada por prioridade</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-3 bg-white/10 border-white/20 backdrop-blur">
            <p className="text-xs text-white/80 mb-1">Clientes</p>
            <p className="text-2xl font-bold text-white">{totalClients}</p>
          </Card>
          <Card className="p-3 bg-white/10 border-white/20 backdrop-blur">
            <p className="text-xs text-white/80 mb-1">Cidades</p>
            <p className="text-2xl font-bold text-white">{suggestedRoute.length}</p>
          </Card>
          <Card className="p-3 bg-white/10 border-white/20 backdrop-blur">
            <p className="text-xs text-white/80 mb-1">Pipeline</p>
            <p className="text-lg font-bold text-white">
              R$ {(suggestedRoute.reduce((sum, g) => sum + g.totalRevenue, 0) / 1000).toFixed(0)}k
            </p>
          </Card>
        </div>
      </div>

      {/* Route Suggestions */}
      <div className="px-4 -mt-8 space-y-4">
        {/* Client Filter */}
        <Card className="p-4 bg-white shadow-md">
          <ClientSelector
            clients={clients}
            selectedClientId={selectedClientId}
            onClientChange={setSelectedClientId}
          />
        </Card>

        {suggestedRoute.length === 0 ? (
          <Card className="p-8 text-center">
            <Navigation className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">Nenhum cliente para visitar</p>
          </Card>
        ) : (
          suggestedRoute.map((cityGroup, idx) => (
            <Card key={cityGroup.city} className="p-4 bg-white shadow-md">
              {/* City Header */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                    <span className="text-lg font-bold text-indigo-600">{idx + 1}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-500" />
                      <h3 className="font-semibold text-slate-800">{cityGroup.city}</h3>
                    </div>
                    <p className="text-xs text-slate-500">
                      {cityGroup.count} cliente{cityGroup.count > 1 ? 's' : ''} • 
                      Prioridade média: {cityGroup.avgPriority}
                    </p>
                  </div>
                </div>
                <Badge className="bg-indigo-100 text-indigo-700">
                  R$ {(cityGroup.totalRevenue / 1000).toFixed(0)}k
                </Badge>
              </div>

              {/* Clients in City */}
              <div className="space-y-3">
                {cityGroup.clients.map((client, clientIdx) => (
                  <div
                    key={client.id}
                    onClick={() => navigate(createPageUrl(`ClientProfile?id=${client.id}`))}
                    className="p-3 rounded-lg border-2 border-slate-100 hover:border-indigo-200 hover:bg-indigo-50 transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-slate-400">#{clientIdx + 1}</span>
                          <p className="font-semibold text-slate-800">{client.first_name}</p>
                          <Badge className={
                            client.status === 'quente' ? 'bg-red-100 text-red-700' :
                            client.status === 'morno' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-blue-100 text-blue-700'
                          }>
                            {client.status === 'quente' ? '🔥' : client.status === 'morno' ? '🌡️' : '❄️'}
                          </Badge>
                        </div>
                        {client.clinic_name && (
                          <p className="text-xs text-slate-500">{client.clinic_name}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-xs text-indigo-600 font-semibold">
                          <TrendingUp className="w-3 h-3" />
                          {client.priorityScore}
                        </div>
                        <p className="text-xs text-slate-400 mt-1">Score</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="flex items-center gap-1 text-slate-600">
                        <Clock className="w-3 h-3" />
                        {client.daysSinceLastVisit === 999 ? 'Nunca visitado' : `${client.daysSinceLastVisit}d atrás`}
                      </div>
                      <div className="flex items-center gap-1 text-slate-600">
                        <span className="font-medium">{client.purchase_score || 0}%</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-600">
                        <span className="font-medium">{client.total_visits_count || 0}x visitado</span>
                      </div>
                    </div>
                    {client.projected_revenue && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-slate-600">
                        <DollarSign className="w-3 h-3" />
                        R$ {(client.projected_revenue / 1000).toFixed(0)}k pipeline
                      </div>
                    )}

                    {client.lastVisitDate && (
                      <div className="mt-2 pt-2 border-t flex items-center gap-1 text-xs text-slate-500">
                        <Calendar className="w-3 h-3" />
                        Última: {new Date(client.lastVisitDate).toLocaleDateString('pt-BR')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
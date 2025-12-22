import React, { useMemo, useState } from 'react';
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
  Phone,
  Calendar,
  Loader2,
  Navigation
} from 'lucide-react';
import AIRouteOptimizer from '@/components/AIRouteOptimizer';

export default function ScheduledAgenda() {
  const navigate = useNavigate();
  const [optimizedData, setOptimizedData] = useState(null);

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-priority_level'),
  });

  // Ordem de cidades começando por Marília
  const cityOrder = ['Marília', 'Bauru', 'Jaú', 'Lins', 'Botucatu', 'Ourinhos', 'Assis', 'Tupã'];

  const clientsByCity = useMemo(() => {
    // Se houver dados otimizados pela IA, usar rotas diárias
    if (optimizedData?.daily_routes) {
      return optimizedData.daily_routes.map((dayRoute, idx) => ({
        city: dayRoute.day_label,
        clients: dayRoute.clients.map(c => 
          clients.find(client => client.id === c.id)
        ).filter(Boolean),
        aiOptimized: true,
        estimatedArrival: dayRoute.departure_time,
        dayInfo: {
          cities: dayRoute.cities,
          distance: dayRoute.total_distance_day,
          tollCost: dayRoute.toll_cost_day,
          returnTime: dayRoute.estimated_return
        }
      }));
    }

    // Caso contrário, usar ordenação padrão
    const grouped = {};
    
    clients.forEach(client => {
      const city = client.city || 'Sem cidade';
      if (!grouped[city]) {
        grouped[city] = [];
      }
      grouped[city].push(client);
    });

    // Ordenar clientes dentro de cada cidade por prioridade
    Object.keys(grouped).forEach(city => {
      grouped[city].sort((a, b) => {
        const priorityA = a.priority_level || 999;
        const priorityB = b.priority_level || 999;
        return priorityA - priorityB;
      });
    });

    // Ordenar cidades conforme a ordem definida
    const orderedCities = cityOrder.filter(city => grouped[city]);
    const otherCities = Object.keys(grouped)
      .filter(city => !cityOrder.includes(city))
      .sort();

    return [...orderedCities, ...otherCities].map(city => ({
      city,
      clients: grouped[city]
    }));
  }, [clients, optimizedData]);

  const statusColors = {
    quente: 'bg-red-100 text-red-700 border-red-300',
    morno: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    frio: 'bg-blue-100 text-blue-700 border-blue-300'
  };

  if (isLoading) {
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
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-white/10">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-white">Agenda Programada</h1>
            <p className="text-sm text-purple-100">Roteiro começando por Marília</p>
          </div>
          <Navigation className="w-6 h-6 text-white" />
        </div>
      </div>

      {/* Summary */}
      <div className="px-4 -mt-8 mb-4 space-y-3">
        <Card className="p-4 bg-white shadow-lg">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-slate-800">{clients.length}</p>
              <p className="text-xs text-slate-500">Clientes</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{clientsByCity.length}</p>
              <p className="text-xs text-slate-500">Cidades</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">
                {clients.filter(c => c.status === 'quente').length}
              </p>
              <p className="text-xs text-slate-500">Quentes</p>
            </div>
          </div>
        </Card>

        <AIRouteOptimizer 
          clients={clients} 
          onRouteOptimized={setOptimizedData}
        />
      </div>

      {/* Cities and Clients */}
      <div className="px-4 space-y-4">
        {clientsByCity.map(({ city, clients: cityClients }, cityIndex) => (
          <div key={city}>
            {/* City Header */}
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                <span className="text-sm font-bold text-indigo-600">{cityIndex + 1}</span>
              </div>
              <div className="flex-1">
                <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-indigo-600" />
                  {city}
                  {cityClients.aiOptimized && (
                    <Badge className="bg-purple-100 text-purple-700 text-xs">✨ IA</Badge>
                  )}
                </h2>
                <p className="text-xs text-slate-500">
                  {cityClients.length} clientes
                  {cityClients.estimatedArrival && ` • Saída: ${cityClients.estimatedArrival}`}
                </p>
                {cityClients.dayInfo && (
                  <div className="flex flex-wrap gap-2 mt-1">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                      {cityClients.dayInfo.cities?.join(' + ')}
                    </span>
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                      {cityClients.dayInfo.distance} km
                    </span>
                    <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs">
                      R$ {cityClients.dayInfo.tollCost?.toFixed(0)} pedágio
                    </span>
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                      Retorno: {cityClients.dayInfo.returnTime}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Clients in City */}
            <div className="space-y-2 ml-10">
              {cityClients.map((client, clientIndex) => (
                <Card
                  key={client.id}
                  onClick={() => navigate(createPageUrl(`ClientProfile?id=${client.id}`))}
                  className="p-3 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-slate-600">
                        {cityIndex + 1}.{clientIndex + 1}
                      </span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-800 text-sm truncate">
                          {client.first_name || client.full_name}
                        </h3>
                        {client.status && (
                          <Badge className={`text-xs px-2 py-0 ${statusColors[client.status]}`}>
                            {client.status}
                          </Badge>
                        )}
                      </div>

                      {client.clinic_name && (
                        <p className="text-xs text-slate-600 mb-1">{client.clinic_name}</p>
                      )}

                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        {client.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {client.phone}
                          </span>
                        )}
                        {client.last_visit_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(client.last_visit_date).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                      </div>

                      {client.purchase_score !== undefined && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-slate-500">Score</span>
                            <span className="font-semibold text-slate-700">{client.purchase_score}%</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                              style={{ width: `${client.purchase_score}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
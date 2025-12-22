import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, TrendingUp, Building2, Star } from 'lucide-react';

const priorityColors = {
  1: 'bg-red-500',
  2: 'bg-orange-500',
  3: 'bg-yellow-500',
  4: 'bg-blue-500',
  5: 'bg-slate-400'
};

const priorityLabels = {
  1: 'Crítico',
  2: 'Alto',
  3: 'Médio',
  4: 'Baixo',
  5: 'Futuro'
};

export default function ClientsByCity() {
  const navigate = useNavigate();

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-purchase_score'),
    initialData: [],
  });

  const clientsByCity = useMemo(() => {
    const grouped = {};
    
    clients.forEach(client => {
      const city = client.city || 'Sem Cidade';
      if (!grouped[city]) {
        grouped[city] = [];
      }
      grouped[city].push(client);
    });

    // Calculate priority score for each client
    Object.keys(grouped).forEach(city => {
      grouped[city].forEach(client => {
        // Priority calculation: status (40%) + score (40%) + revenue (20%)
        let priorityScore = 0;
        
        // Status weight
        if (client.status === 'quente') priorityScore += 40;
        else if (client.status === 'morno') priorityScore += 20;
        
        // Purchase score weight
        priorityScore += (client.purchase_score || 50) * 0.4;
        
        // Revenue weight
        if (client.projected_revenue) {
          priorityScore += Math.min((client.projected_revenue / 80000) * 20, 20);
        }
        
        // Assign priority level (1-5)
        if (priorityScore >= 80) client.calculated_priority = 1;
        else if (priorityScore >= 60) client.calculated_priority = 2;
        else if (priorityScore >= 40) client.calculated_priority = 3;
        else if (priorityScore >= 20) client.calculated_priority = 4;
        else client.calculated_priority = 5;
      });
      
      // Sort by priority within city
      grouped[city].sort((a, b) => a.calculated_priority - b.calculated_priority);
    });

    return grouped;
  }, [clients]);

  const sortedCities = useMemo(() => {
    return Object.keys(clientsByCity).sort((a, b) => {
      const avgPriorityA = clientsByCity[a].reduce((sum, c) => sum + c.calculated_priority, 0) / clientsByCity[a].length;
      const avgPriorityB = clientsByCity[b].reduce((sum, c) => sum + c.calculated_priority, 0) / clientsByCity[b].length;
      return avgPriorityA - avgPriorityB;
    });
  }, [clientsByCity]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 px-4 pt-4 pb-8 rounded-b-[2rem]">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-white/10">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-lg font-semibold text-white">Clientes por Cidade</h1>
        </div>
        <p className="text-slate-300 text-sm">Organizado por prioridade estratégica</p>
      </div>

      {/* Cities List */}
      <div className="px-4 -mt-4 space-y-6">
        {sortedCities.map(city => (
          <Card key={city} className="p-4 bg-white shadow-md">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b">
              <MapPin className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-semibold text-slate-800">{city}</h2>
              <Badge className="ml-auto bg-slate-100 text-slate-700">
                {clientsByCity[city].length} cliente{clientsByCity[city].length !== 1 ? 's' : ''}
              </Badge>
            </div>

            <div className="space-y-3">
              {clientsByCity[city].map((client, index) => (
                <button
                  key={client.id}
                  onClick={() => navigate(createPageUrl(`ClientProfile?id=${client.id}`))}
                  className="w-full text-left p-3 rounded-lg border-2 hover:border-indigo-300 hover:bg-indigo-50 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex items-center gap-2 min-w-[60px]">
                      <div className={`w-8 h-8 rounded-lg ${priorityColors[client.calculated_priority]} flex items-center justify-center text-white font-bold text-sm`}>
                        {index + 1}
                      </div>
                      <Star className={`w-4 h-4 ${client.calculated_priority <= 2 ? 'text-yellow-500 fill-yellow-500' : 'text-slate-300'}`} />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-slate-800">{client.first_name}</p>
                        <Badge className={`${priorityColors[client.calculated_priority]} text-white text-xs`}>
                          {priorityLabels[client.calculated_priority]}
                        </Badge>
                      </div>
                      
                      {client.clinic_name && (
                        <div className="flex items-center gap-1 text-sm text-slate-600 mb-1">
                          <Building2 className="w-3 h-3" />
                          <span>{client.clinic_name}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>Score: {client.purchase_score}%</span>
                        {client.projected_revenue && (
                          <span className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            R$ {client.projected_revenue.toLocaleString('pt-BR')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
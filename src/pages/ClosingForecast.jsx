import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  TrendingUp, 
  DollarSign, 
  Calendar,
  Target,
  Sparkles,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ClosingForecast() {
  const navigate = useNavigate();

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
  });

  const forecastData = useMemo(() => {
    const today = new Date();
    
    // Filtrar clientes com probabilidade de fechamento
    const likelyClients = clients
      .filter(c => c.closing_probability && c.closing_probability > 30)
      .sort((a, b) => (b.closing_probability || 0) - (a.closing_probability || 0));

    // Agrupar por período
    const next7Days = likelyClients.filter(c => c.estimated_days_to_close && c.estimated_days_to_close <= 7);
    const next30Days = likelyClients.filter(c => c.estimated_days_to_close && c.estimated_days_to_close <= 30 && c.estimated_days_to_close > 7);
    const next90Days = likelyClients.filter(c => c.estimated_days_to_close && c.estimated_days_to_close <= 90 && c.estimated_days_to_close > 30);

    // Calcular receitas previstas
    const revenue7Days = next7Days.reduce((sum, c) => 
      sum + ((c.predicted_revenue || c.projected_revenue || 0) * (c.closing_probability / 100)), 0
    );
    const revenue30Days = next30Days.reduce((sum, c) => 
      sum + ((c.predicted_revenue || c.projected_revenue || 0) * (c.closing_probability / 100)), 0
    );
    const revenue90Days = next90Days.reduce((sum, c) => 
      sum + ((c.predicted_revenue || c.projected_revenue || 0) * (c.closing_probability / 100)), 0
    );

    // Timeline de fechamentos
    const timeline = likelyClients
      .filter(c => c.estimated_days_to_close)
      .map(c => ({
        client: c,
        date: addDays(today, c.estimated_days_to_close),
        revenue: (c.predicted_revenue || c.projected_revenue || 0) * (c.closing_probability / 100)
      }))
      .sort((a, b) => a.date - b.date);

    // Clientes de alto risco
    const highRisk = clients.filter(c => c.risk_level === 'high' && c.status === 'quente');

    return {
      likelyClients,
      next7Days,
      next30Days,
      next90Days,
      revenue7Days,
      revenue30Days,
      revenue90Days,
      totalRevenue: revenue7Days + revenue30Days + revenue90Days,
      timeline: timeline.slice(0, 10),
      highRisk
    };
  }, [clients]);

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
            <h1 className="text-lg font-semibold text-white">Previsão de Fechamentos</h1>
            <p className="text-sm text-purple-100">Análise preditiva por IA</p>
          </div>
          <Sparkles className="w-6 h-6 text-white" />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="px-4 -mt-8 mb-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4 bg-white shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-green-600" />
              <span className="text-xs text-slate-500">Próximos 7 dias</span>
            </div>
            <p className="text-2xl font-bold text-slate-800">{forecastData.next7Days.length}</p>
            <p className="text-xs text-green-600 font-medium mt-1">
              R$ {(forecastData.revenue7Days / 1000).toFixed(0)}k esperados
            </p>
          </Card>

          <Card className="p-4 bg-white shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span className="text-xs text-slate-500">Próximos 30 dias</span>
            </div>
            <p className="text-2xl font-bold text-slate-800">{forecastData.next30Days.length}</p>
            <p className="text-xs text-blue-600 font-medium mt-1">
              R$ {(forecastData.revenue30Days / 1000).toFixed(0)}k esperados
            </p>
          </Card>
        </div>

        <Card className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-green-700 font-medium mb-1">Receita Total Prevista (90 dias)</p>
              <p className="text-3xl font-bold text-green-800">
                R$ {(forecastData.totalRevenue / 1000).toFixed(0)}k
              </p>
            </div>
            <DollarSign className="w-12 h-12 text-green-600 opacity-20" />
          </div>
        </Card>
      </div>

      {/* High Risk Alerts */}
      {forecastData.highRisk.length > 0 && (
        <div className="px-4 mb-4">
          <Card className="p-4 bg-gradient-to-br from-red-50 to-orange-50 border-red-200">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-800 mb-2">⚠️ Alertas de Risco</h3>
                <p className="text-sm text-slate-700 mb-3">
                  {forecastData.highRisk.length} clientes quentes em risco de perda
                </p>
                <div className="space-y-2">
                  {forecastData.highRisk.slice(0, 3).map(client => (
                    <div 
                      key={client.id}
                      onClick={() => navigate(createPageUrl(`ClientProfile?id=${client.id}`))}
                      className="p-2 bg-white rounded-lg cursor-pointer hover:bg-red-50"
                    >
                      <p className="text-sm font-medium text-slate-800">{client.first_name}</p>
                      {client.closing_probability !== undefined && (
                        <p className="text-xs text-slate-600">
                          Probabilidade: {client.closing_probability}%
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Timeline */}
      <div className="px-4 mb-4">
        <h2 className="font-semibold text-slate-800 mb-3">Timeline de Fechamentos Previstos</h2>
        <div className="space-y-3">
          {forecastData.timeline.map((item, idx) => (
            <Card
              key={item.client.id}
              onClick={() => navigate(createPageUrl(`ClientProfile?id=${item.client.id}`))}
              className="p-4 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  item.client.closing_probability > 70 ? 'bg-green-100' :
                  item.client.closing_probability > 50 ? 'bg-yellow-100' :
                  'bg-orange-100'
                }`}>
                  <span className={`text-sm font-bold ${
                    item.client.closing_probability > 70 ? 'text-green-700' :
                    item.client.closing_probability > 50 ? 'text-yellow-700' :
                    'text-orange-700'
                  }`}>
                    {item.client.closing_probability}%
                  </span>
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-slate-800">{item.client.first_name}</h3>
                    <Badge variant="outline" className="text-xs">
                      {format(item.date, 'dd MMM', { locale: ptBR })}
                    </Badge>
                  </div>

                  {item.client.clinic_name && (
                    <p className="text-sm text-slate-600 mb-2">{item.client.clinic_name}</p>
                  )}

                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      R$ {(item.revenue / 1000).toFixed(1)}k
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {item.client.estimated_days_to_close} dias
                    </span>
                  </div>

                  {item.client.ai_recommendation && (
                    <div className="mt-2 p-2 bg-indigo-50 rounded-lg">
                      <p className="text-xs text-indigo-700 italic flex items-start gap-1">
                        <Sparkles className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        {item.client.ai_recommendation}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* All High Probability Clients */}
      <div className="px-4 mb-4">
        <h2 className="font-semibold text-slate-800 mb-3">
          Todos os Clientes (Prob. &gt; 30%)
        </h2>
        <div className="space-y-2">
          {forecastData.likelyClients.map(client => (
            <Card
              key={client.id}
              onClick={() => navigate(createPageUrl(`ClientProfile?id=${client.id}`))}
              className="p-3 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-slate-800 text-sm">{client.first_name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          client.closing_probability > 70 ? 'bg-green-500' :
                          client.closing_probability > 50 ? 'bg-yellow-500' :
                          'bg-orange-500'
                        }`}
                        style={{ width: `${client.closing_probability}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-600">
                      {client.closing_probability}%
                    </span>
                  </div>
                </div>
                {client.predicted_revenue && (
                  <div className="ml-4 text-right">
                    <p className="text-sm font-bold text-slate-800">
                      R$ {((client.predicted_revenue * client.closing_probability / 100) / 1000).toFixed(0)}k
                    </p>
                    <p className="text-xs text-slate-500">esperado</p>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
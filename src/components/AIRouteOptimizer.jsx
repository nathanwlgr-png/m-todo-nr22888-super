import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sparkles, Loader2, Navigation, Clock, MapPin, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

const cityCoordinates = {
  'Sorocaba': [-23.5015, -47.4526],
  'Campinas': [-22.9099, -47.0626],
  'Piracicaba': [-22.7253, -47.6492],
  'Jundiaí': [-23.1864, -46.8978],
  'São José dos Campos': [-23.2237, -45.9009],
  'Itu': [-23.2644, -47.2997],
  'Marília': [-22.2139, -49.9461],
  'Bauru': [-22.3149, -49.0614],
  'Jaú': [-22.2964, -48.5578],
  'Lins': [-21.6778, -49.7436],
  'Botucatu': [-22.8858, -48.4450],
  'Ourinhos': [-22.9789, -49.8708],
  'Assis': [-22.6614, -50.4122],
  'Tupã': [-21.9347, -50.5136],
};

export default function AIRouteOptimizer({ clients, onRouteOptimized }) {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [optimizedRoute, setOptimizedRoute] = useState(null);

  const handleOptimize = async () => {
    if (clients.length === 0) {
      toast.error('Nenhum cliente para otimizar');
      return;
    }

    setIsOptimizing(true);

    try {
      // Preparar dados dos clientes
      const clientsData = clients
        .filter(c => c.city && cityCoordinates[c.city])
        .map(client => ({
          id: client.id,
          name: client.first_name || client.full_name,
          city: client.city,
          coordinates: cityCoordinates[client.city],
          status: client.status,
          purchase_score: client.purchase_score || 0,
          priority_level: client.priority_level || 5,
          projected_revenue: client.projected_revenue || 0,
          clinic_name: client.clinic_name,
        }));

      const prompt = `
Você é um especialista em otimização de rotas de vendas.

DADOS DOS CLIENTES:
${JSON.stringify(clientsData, null, 2)}

TAREFA:
Otimize a ordem de visitas considerando:
1. **Proximidade geográfica** - agrupar visitas por cidade e região
2. **Prioridade do cliente** - clientes com priority_level menor são mais prioritários (1 = máxima prioridade)
3. **Status** - clientes "quente" devem ter prioridade sobre "morno" e "frio"
4. **Score de compra** - maiores scores indicam maior probabilidade de fechamento
5. **Receita projetada** - priorizar clientes com maior potencial de receita
6. **Condições de trânsito** - considere horários de pico e distâncias entre cidades do interior de São Paulo
7. **Tempo estimado** - estime 45-60 minutos por visita

Considere que o vendedor está começando de Marília, SP.

IMPORTANTE: 
- Agrupe visitas por cidade para economizar tempo de deslocamento
- Sugira horários ideais para cada visita considerando trânsito
- Ordene as cidades pela rota mais eficiente (menor distância total)
- Priorize clientes "quentes" no início da jornada quando o vendedor está mais energizado

Retorne APENAS um JSON com a estrutura abaixo, SEM texto adicional:
{
  "total_clients": número,
  "total_cities": número,
  "estimated_total_time_hours": número,
  "estimated_distance_km": número,
  "route_efficiency_score": número de 0-100,
  "insights": [array de strings com 3-4 insights sobre a rota],
  "optimized_order": [
    {
      "city": string,
      "order": número (ordem da cidade na rota),
      "estimated_arrival": string (horário sugerido, ex: "09:00"),
      "clients": [
        {
          "id": string,
          "name": string,
          "clinic_name": string,
          "order_in_city": número,
          "reason": string (breve explicação de por que essa ordem),
          "estimated_visit_time": string
        }
      ]
    }
  ]
}
`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            total_clients: { type: "number" },
            total_cities: { type: "number" },
            estimated_total_time_hours: { type: "number" },
            estimated_distance_km: { type: "number" },
            route_efficiency_score: { type: "number" },
            insights: { type: "array", items: { type: "string" } },
            optimized_order: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  city: { type: "string" },
                  order: { type: "number" },
                  estimated_arrival: { type: "string" },
                  clients: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        name: { type: "string" },
                        clinic_name: { type: "string" },
                        order_in_city: { type: "number" },
                        reason: { type: "string" },
                        estimated_visit_time: { type: "string" }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });

      setOptimizedRoute(result);
      setShowResults(true);
      
      if (onRouteOptimized) {
        onRouteOptimized(result);
      }

      toast.success('Rota otimizada com sucesso!');
    } catch (error) {
      console.error('Erro ao otimizar rota:', error);
      toast.error('Erro ao otimizar rota. Tente novamente.');
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <>
      <Button
        onClick={handleOptimize}
        disabled={isOptimizing || clients.length === 0}
        className="w-full h-12 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
      >
        {isOptimizing ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Otimizando com IA...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5 mr-2" />
            Otimizar Rota com IA
          </>
        )}
      </Button>

      <Dialog open={showResults} onOpenChange={setShowResults}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              Rota Otimizada por IA
            </DialogTitle>
          </DialogHeader>

          {optimizedRoute && (
            <div className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <Card className="p-3 bg-gradient-to-br from-purple-50 to-indigo-50">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-purple-600" />
                    <p className="text-xs text-slate-600">Tempo Total</p>
                  </div>
                  <p className="text-xl font-bold text-slate-800">
                    {optimizedRoute.estimated_total_time_hours?.toFixed(1)}h
                  </p>
                </Card>

                <Card className="p-3 bg-gradient-to-br from-blue-50 to-cyan-50">
                  <div className="flex items-center gap-2 mb-1">
                    <Navigation className="w-4 h-4 text-blue-600" />
                    <p className="text-xs text-slate-600">Distância</p>
                  </div>
                  <p className="text-xl font-bold text-slate-800">
                    {optimizedRoute.estimated_distance_km?.toFixed(0)} km
                  </p>
                </Card>

                <Card className="p-3 bg-gradient-to-br from-green-50 to-emerald-50">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <p className="text-xs text-slate-600">Eficiência</p>
                  </div>
                  <p className="text-xl font-bold text-slate-800">
                    {optimizedRoute.route_efficiency_score}%
                  </p>
                </Card>

                <Card className="p-3 bg-gradient-to-br from-orange-50 to-amber-50">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="w-4 h-4 text-orange-600" />
                    <p className="text-xs text-slate-600">Cidades</p>
                  </div>
                  <p className="text-xl font-bold text-slate-800">
                    {optimizedRoute.total_cities}
                  </p>
                </Card>
              </div>

              {/* Insights */}
              {optimizedRoute.insights && optimizedRoute.insights.length > 0 && (
                <Card className="p-4 bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200">
                  <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600" />
                    Insights da IA
                  </h4>
                  <ul className="space-y-2">
                    {optimizedRoute.insights.map((insight, idx) => (
                      <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                        <span className="text-amber-600 font-bold">•</span>
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              {/* Rota Otimizada */}
              <div>
                <h4 className="font-semibold text-slate-800 mb-3">Ordem de Visitas Sugerida</h4>
                <div className="space-y-3">
                  {optimizedRoute.optimized_order?.map((cityRoute, idx) => (
                    <Card key={idx} className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                          <span className="text-sm font-bold text-indigo-600">{cityRoute.order}</span>
                        </div>
                        <div>
                          <h5 className="font-semibold text-slate-800">{cityRoute.city}</h5>
                          <p className="text-xs text-slate-500">
                            Chegada prevista: {cityRoute.estimated_arrival} • {cityRoute.clients?.length} clientes
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2 pl-11">
                        {cityRoute.clients?.map((client, clientIdx) => (
                          <div key={clientIdx} className="p-2 bg-slate-50 rounded-lg">
                            <div className="flex items-start gap-2">
                              <span className="text-xs font-bold text-slate-400 mt-0.5">
                                {cityRoute.order}.{client.order_in_city}
                              </span>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-slate-800">{client.name}</p>
                                {client.clinic_name && (
                                  <p className="text-xs text-slate-600">{client.clinic_name}</p>
                                )}
                                <p className="text-xs text-slate-500 mt-1">
                                  ⏰ {client.estimated_visit_time}
                                </p>
                                <p className="text-xs text-indigo-600 mt-1 italic">{client.reason}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
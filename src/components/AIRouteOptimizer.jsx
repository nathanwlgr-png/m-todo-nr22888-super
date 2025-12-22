import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sparkles, Loader2, Navigation, Clock, MapPin, TrendingUp, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

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
Você é um especialista em otimização de rotas de vendas no interior de São Paulo.

DADOS DOS CLIENTES:
${JSON.stringify(clientsData, null, 2)}

RESTRIÇÕES CRÍTICAS:
- **Base do vendedor**: Marília, SP
- **Distância máxima por dia**: 200 km na IDA + 200 km na VOLTA (total 400 km/dia)
- **Retorno diário**: O vendedor DEVE retornar para Marília ao final de TODOS os dias
- **Cidades por dia**: Máximo de 1-2 cidades próximas por dia
- **Tempo de visita**: 45-60 minutos por cliente
- **Pedágios**: Considerar e calcular custos de pedágio nas rodovias do interior de SP

TAREFA:
Organize as visitas em DIAS, com cada dia sendo uma jornada completa:
1. Saída de Marília pela manhã
2. Visita a 1-2 cidades próximas (máximo 200km de distância)
3. Retorno para Marília no mesmo dia

CRITÉRIOS DE OTIMIZAÇÃO (ORDEM DE IMPORTÂNCIA):
1. **Prioridade do cliente** - priority_level menor = mais prioritário (1 = máxima)
2. **Status** - "quente" > "morno" > "frio"
3. **Score de compra** - maiores scores = maior probabilidade de fechar
4. **Receita projetada** - priorizar maior potencial de receita
5. **Proximidade geográfica** - agrupar cidades próximas no mesmo dia
6. **Distância de Marília** - priorizar cidades mais próximas quando possível
7. **Custo de pedágio** - minimizar quando possível

IMPORTANTE: 
- PRIORIZE clientes com maior probabilidade de fechar PRIMEIRO
- Cada "day" deve ter rota completa: Marília → Cidades → Marília
- Calcule distância total do dia (ida + volta)
- Estime custo de pedágio baseado nas rodovias do interior de SP (média R$ 0,20/km em pedágios)
- Sugira horário de saída de Marília e horário estimado de retorno
- Priorize clientes "quentes" e com score alto nos primeiros dias

Retorne APENAS um JSON com a estrutura abaixo, SEM texto adicional:
{
  "total_clients": número,
  "total_days": número,
  "total_distance_km": número,
  "estimated_toll_cost": número,
  "route_efficiency_score": número de 0-100,
  "insights": [array de strings com 3-4 insights sobre a rota e custos],
  "daily_routes": [
    {
      "day": número,
      "day_label": string (ex: "Dia 1 - Segunda"),
      "departure_time": string (ex: "07:30"),
      "estimated_return": string (ex: "18:00"),
      "cities": [string] (cidades visitadas neste dia),
      "total_distance_day": número (km ida + volta),
      "toll_cost_day": número,
      "clients": [
        {
          "id": string,
          "name": string,
          "city": string,
          "clinic_name": string,
          "estimated_arrival": string,
          "estimated_visit_time": string,
          "reason": string
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
            total_days: { type: "number" },
            total_distance_km: { type: "number" },
            estimated_toll_cost: { type: "number" },
            route_efficiency_score: { type: "number" },
            insights: { type: "array", items: { type: "string" } },
            daily_routes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  day: { type: "number" },
                  day_label: { type: "string" },
                  departure_time: { type: "string" },
                  estimated_return: { type: "string" },
                  cities: { type: "array", items: { type: "string" } },
                  total_distance_day: { type: "number" },
                  toll_cost_day: { type: "number" },
                  clients: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        name: { type: "string" },
                        city: { type: "string" },
                        clinic_name: { type: "string" },
                        estimated_arrival: { type: "string" },
                        estimated_visit_time: { type: "string" },
                        reason: { type: "string" }
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

  const handleSyncToGoogleCalendar = async () => {
    if (!optimizedRoute?.daily_routes) return;

    try {
      for (const dayRoute of optimizedRoute.daily_routes) {
        for (const client of dayRoute.clients) {
          const [hours, minutes] = client.estimated_arrival.split(':');
          const visitDate = new Date();
          visitDate.setDate(visitDate.getDate() + (dayRoute.day - 1));
          visitDate.setHours(parseInt(hours), parseInt(minutes), 0);

          const eventTitle = `Visita Comercial - ${client.name}`;
          const eventDetails = `
Cliente: ${client.name}
Clínica: ${client.clinic_name || 'N/A'}
Cidade: ${client.city}
Motivo: ${client.reason}

${dayRoute.day_label}
Saída de Marília: ${dayRoute.departure_time}
Retorno estimado: ${dayRoute.estimated_return}
Distância total do dia: ${dayRoute.total_distance_day} km
Pedágio: R$ ${dayRoute.toll_cost_day?.toFixed(2)}
          `.trim();

          const endDate = new Date(visitDate.getTime() + 60 * 60000);

          const params = new URLSearchParams({
            action: 'TEMPLATE',
            text: eventTitle,
            dates: `${format(visitDate, "yyyyMMdd'T'HHmmss")}/${format(endDate, "yyyyMMdd'T'HHmmss")}`,
            details: eventDetails,
            location: `${client.clinic_name || ''}, ${client.city}`
          });

          window.open(`https://calendar.google.com/calendar/render?${params.toString()}`, '_blank');
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      toast.success('Eventos criados no Google Calendar!');
    } catch (error) {
      toast.error('Erro ao sincronizar');
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
                    <p className="text-xs text-slate-600">Total de Dias</p>
                  </div>
                  <p className="text-xl font-bold text-slate-800">
                    {optimizedRoute.total_days}
                  </p>
                </Card>

                <Card className="p-3 bg-gradient-to-br from-blue-50 to-cyan-50">
                  <div className="flex items-center gap-2 mb-1">
                    <Navigation className="w-4 h-4 text-blue-600" />
                    <p className="text-xs text-slate-600">Distância Total</p>
                  </div>
                  <p className="text-xl font-bold text-slate-800">
                    {optimizedRoute.total_distance_km?.toFixed(0)} km
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
                    <p className="text-xs text-slate-600">Custo Pedágio</p>
                  </div>
                  <p className="text-xl font-bold text-slate-800">
                    R$ {optimizedRoute.estimated_toll_cost?.toFixed(0)}
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

              {/* Rota Otimizada por Dia */}
              <div>
                <h4 className="font-semibold text-slate-800 mb-3">Roteiro Diário (Saída e Retorno de Marília)</h4>
                <div className="space-y-4">
                  {optimizedRoute.daily_routes?.map((dayRoute, idx) => (
                    <Card key={idx} className="p-4 border-2">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-white">{dayRoute.day}</span>
                        </div>
                        <div className="flex-1">
                          <h5 className="font-semibold text-slate-800">{dayRoute.day_label}</h5>
                          <div className="flex flex-wrap gap-2 mt-1 text-xs text-slate-600">
                            <span className="flex items-center gap-1">
                              🚗 Saída: {dayRoute.departure_time}
                            </span>
                            <span className="flex items-center gap-1">
                              🏠 Retorno: {dayRoute.estimated_return}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                              {dayRoute.total_distance_day} km
                            </span>
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                              R$ {dayRoute.toll_cost_day?.toFixed(0)} pedágio
                            </span>
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                              {dayRoute.cities?.join(' + ')}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 pl-13">
                        {dayRoute.clients?.map((client, clientIdx) => (
                          <div key={clientIdx} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                            <div className="flex items-start gap-2">
                              <span className="text-xs font-bold text-slate-400 mt-0.5">
                                {clientIdx + 1}
                              </span>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-slate-800">{client.name}</p>
                                {client.clinic_name && (
                                  <p className="text-xs text-slate-600">{client.clinic_name}</p>
                                )}
                                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                  <span>📍 {client.city}</span>
                                  <span>🕐 {client.estimated_arrival}</span>
                                  <span>⏱️ {client.estimated_visit_time}</span>
                                </div>
                                <p className="text-xs text-indigo-600 mt-2 italic">{client.reason}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Botão Sincronizar com Google Calendar */}
              <div className="pt-4 border-t">
                <Button
                  onClick={handleSyncToGoogleCalendar}
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  <Calendar className="w-5 h-5 mr-2" />
                  Adicionar Rota ao Google Calendar
                </Button>
                <p className="text-xs text-slate-500 text-center mt-2">
                  Abrirá uma aba para cada visita na sua agenda
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
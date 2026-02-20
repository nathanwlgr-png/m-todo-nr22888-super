import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sparkles, Loader2, Navigation, Clock, MapPin, TrendingUp, Calendar, Car, DollarSign, AlertTriangle } from 'lucide-react';
import { Input } from "@/components/ui/input";
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
  const [showConfig, setShowConfig] = useState(false);
  const [config, setConfig] = useState({
    departureTime: '07:30',
    maxDistancePerDay: 200,
    preferredDays: [],
    avoidWeekends: true
  });

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
Você é um especialista em otimização de rotas de vendas no interior de São Paulo com acesso a dados de trânsito em tempo real.

DADOS DOS CLIENTES:
${JSON.stringify(clientsData, null, 2)}

CONFIGURAÇÕES DO VENDEDOR:
- Horário preferencial de saída: ${config.departureTime}
- Distância máxima por dia (ida): ${config.maxDistancePerDay} km
${config.preferredDays.length > 0 ? `- Dias preferenciais: ${config.preferredDays.join(', ')}` : ''}
${config.avoidWeekends ? '- Evitar finais de semana' : ''}

RESTRIÇÕES CRÍTICAS:
- **Base do vendedor**: Marília, SP
- **Distância máxima por dia**: ${config.maxDistancePerDay} km na IDA + ${config.maxDistancePerDay} km na VOLTA (total ${config.maxDistancePerDay * 2} km/dia)
- **Retorno diário**: O vendedor DEVE retornar para Marília ao final de TODOS os dias
- **Cidades por dia**: Máximo de 1-2 cidades próximas por dia
- **Tempo de visita**: 45-60 minutos por cliente
- **Trânsito**: Considerar horários de pico (7h-9h e 17h-19h) nas rodovias principais
- **Pedágios**: Calcular custos REAIS de pedágio nas rodovias SP (consultar dados atualizados)

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
- Calcule distância total do dia (ida + volta) usando DADOS REAIS de rotas
- **TRÂNSITO EM TEMPO REAL**: Adicione +15-30% no tempo em horários de pico
- **PEDÁGIOS REAIS**: Consulte valores atualizados (não use estimativa genérica)
- **TEMPO DE VISITA**: Considere 45-60min por cliente + deslocamento entre clientes na mesma cidade
- Sugira horário de saída de Marília (padrão: ${config.departureTime}) e horário estimado de retorno
- Priorize clientes "quentes" e com score alto nos primeiros dias
- **NAVEGAÇÃO**: Forneça coordenadas GPS exatas para cada destino

Retorne APENAS um JSON com a estrutura abaixo, SEM texto adicional:
{
  "total_clients": número,
  "total_days": número,
  "total_distance_km": número,
  "estimated_toll_cost": número,
  "estimated_fuel_cost": número (considere consumo médio 10km/L e gasolina R$ 5,50/L),
  "traffic_adjusted_time": string (tempo total considerando trânsito),
  "route_efficiency_score": número de 0-100,
  "insights": [array de strings com 3-4 insights sobre rota, custos e trânsito],
  "lunch_stops": [
  {
  "day": número do dia,
  "suggested_time": "12:30",
  "city": string (cidade mais próxima no horário de almoço),
  "suggestions": [string] (2-3 restaurantes/opções reais naquela cidade),
  "rest_duration_minutes": número (15-30 min recomendados)
  }
  ],
  "daily_routes": [
    {
      "day": número,
      "day_label": string (ex: "Dia 1 - Segunda"),
      "departure_time": string (ex: "07:30"),
      "estimated_return": string (ex: "18:00"),
      "cities": [string] (cidades visitadas neste dia),
      "total_distance_day": número (km ida + volta),
      "toll_cost_day": número,
      "toll_locations": [array de strings com os pedágios do trajeto],
      "traffic_status": string (leve/moderado/pesado),
      "weather_alert": string ou null (alertas meteorológicos se houver),
      "navigation_url": string (URL Google Maps com waypoints),
      "clients": [
        {
          "id": string,
          "name": string,
          "city": string,
          "clinic_name": string,
          "address": string,
          "latitude": número,
          "longitude": número,
          "estimated_arrival": string,
          "estimated_visit_time": string,
          "driving_time_from_previous": string,
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
            estimated_fuel_cost: { type: "number" },
            traffic_adjusted_time: { type: "string" },
            route_efficiency_score: { type: "number" },
            insights: { type: "array", items: { type: "string" } },
            lunch_stops: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  day: { type: "number" },
                  suggested_time: { type: "string" },
                  city: { type: "string" },
                  suggestions: { type: "array", items: { type: "string" } },
                  rest_duration_minutes: { type: "number" }
                }
              }
            },
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
                  toll_locations: { type: "array", items: { type: "string" } },
                  traffic_status: { type: "string" },
                  weather_alert: { type: "string" },
                  navigation_url: { type: "string" },
                  clients: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        name: { type: "string" },
                        city: { type: "string" },
                        clinic_name: { type: "string" },
                        address: { type: "string" },
                        latitude: { type: "number" },
                        longitude: { type: "number" },
                        estimated_arrival: { type: "string" },
                        estimated_visit_time: { type: "string" },
                        driving_time_from_previous: { type: "string" },
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

  const openNavigation = (dayRoute) => {
    if (!dayRoute.navigation_url && dayRoute.clients?.length > 0) {
      // Fallback: construir URL do Google Maps
      const waypoints = dayRoute.clients
        .map(c => `${c.latitude},${c.longitude}`)
        .join('|');
      const url = `https://www.google.com/maps/dir/?api=1&origin=Marília,SP&destination=Marília,SP&waypoints=${waypoints}&travelmode=driving`;
      window.open(url, '_blank');
    } else if (dayRoute.navigation_url) {
      window.open(dayRoute.navigation_url, '_blank');
    }
  };

  const openClientNavigation = (client) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${client.latitude},${client.longitude}&travelmode=driving`;
    window.open(url, '_blank');
  };

  const openWazeNavigation = (dayRoute) => {
    // Waze não suporta múltiplos waypoints, abrir para o primeiro cliente
    if (dayRoute.clients?.length > 0) {
      const first = dayRoute.clients[0];
      const url = `https://waze.com/ul?ll=${first.latitude},${first.longitude}&navigate=yes`;
      window.open(url, '_blank');
    }
  };

  return (
    <>
      <div className="space-y-2">
        <Button
          onClick={() => setShowConfig(!showConfig)}
          variant="outline"
          className="w-full h-10 text-sm"
        >
          {showConfig ? 'Ocultar' : 'Configurar'} Preferências
        </Button>

        {showConfig && (
          <Card className="p-4 space-y-3">
            <div>
              <label className="text-xs text-slate-600 mb-1 block">Horário de Saída</label>
              <Input
                type="time"
                value={config.departureTime}
                onChange={(e) => setConfig({ ...config, departureTime: e.target.value })}
                className="h-9"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 mb-1 block">Distância Máxima por Dia (km)</label>
              <Input
                type="number"
                value={config.maxDistancePerDay}
                onChange={(e) => setConfig({ ...config, maxDistancePerDay: parseInt(e.target.value) })}
                className="h-9"
                min="50"
                max="300"
              />
            </div>
          </Card>
        )}

        <Button
          onClick={handleOptimize}
          disabled={isOptimizing || clients.length === 0}
          className="w-full h-12 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
        >
          {isOptimizing ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Otimizando com IA + Trânsito...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              Otimizar Rota com IA
            </>
          )}
        </Button>
      </div>

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
              <div className="grid grid-cols-2 gap-2">
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
                    <p className="text-xs text-slate-600">Pedágio</p>
                  </div>
                  <p className="text-xl font-bold text-slate-800">
                    R$ {optimizedRoute.estimated_toll_cost?.toFixed(0)}
                  </p>
                </Card>

                <Card className="p-3 bg-gradient-to-br from-red-50 to-pink-50">
                  <div className="flex items-center gap-2 mb-1">
                    <Car className="w-4 h-4 text-red-600" />
                    <p className="text-xs text-slate-600">Combustível</p>
                  </div>
                  <p className="text-xl font-bold text-slate-800">
                    R$ {optimizedRoute.estimated_fuel_cost?.toFixed(0)}
                  </p>
                </Card>

                <Card className="p-3 bg-gradient-to-br from-cyan-50 to-blue-50">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-cyan-600" />
                    <p className="text-xs text-slate-600">Tempo Total</p>
                  </div>
                  <p className="text-lg font-bold text-slate-800">
                    {optimizedRoute.traffic_adjusted_time || 'N/A'}
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

                          {/* Traffic & Weather Alerts */}
                          {(dayRoute.traffic_status || dayRoute.weather_alert) && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {dayRoute.traffic_status && (
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  dayRoute.traffic_status === 'leve' ? 'bg-green-100 text-green-700' :
                                  dayRoute.traffic_status === 'moderado' ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-red-100 text-red-700'
                                }`}>
                                  🚦 Trânsito: {dayRoute.traffic_status}
                                </span>
                              )}
                              {dayRoute.weather_alert && (
                                <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" />
                                  {dayRoute.weather_alert}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Toll Locations */}
                          {dayRoute.toll_locations?.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs text-slate-500 mb-1">Pedágios no trajeto:</p>
                              <div className="flex flex-wrap gap-1">
                                {dayRoute.toll_locations.map((toll, i) => (
                                  <span key={i} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                                    {toll}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Navigation Buttons */}
                          <div className="mt-3 flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => openNavigation(dayRoute)}
                              className="flex-1 bg-blue-600 hover:bg-blue-700 h-9"
                            >
                              <Navigation className="w-3 h-3 mr-1" />
                              Google Maps
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => openWazeNavigation(dayRoute)}
                              className="flex-1 bg-cyan-600 hover:bg-cyan-700 h-9"
                            >
                              <Car className="w-3 h-3 mr-1" />
                              Waze
                            </Button>
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
                                {client.driving_time_from_previous && (
                                  <p className="text-xs text-slate-500 mt-1">
                                    🚗 {client.driving_time_from_previous} de carro
                                  </p>
                                )}
                                {client.address && (
                                  <p className="text-xs text-slate-500 mt-1">{client.address}</p>
                                )}
                                <p className="text-xs text-indigo-600 mt-2 italic">{client.reason}</p>
                                <div className="flex gap-1.5 mt-2">
                                                   <Button size="sm" variant="outline"
                                                     onClick={() => openClientNavigation(client)}
                                                     className="flex-1 h-7 text-xs bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100"
                                                   >
                                                     <Navigation className="w-3 h-3 mr-1" /> Google Maps
                                                   </Button>
                                                   <Button size="sm" variant="outline"
                                                     onClick={() => {
                                                       const addr = encodeURIComponent(client.clinic_name ? `${client.clinic_name}, ${client.city}` : client.city);
                                                       window.open(`https://waze.com/ul?q=${addr}&navigate=yes`, '_blank');
                                                     }}
                                                     className="flex-1 h-7 text-xs bg-cyan-50 border-cyan-300 text-cyan-700 hover:bg-cyan-100"
                                                   >
                                                     <Car className="w-3 h-3 mr-1" /> Waze
                                                   </Button>
                                                 </div>
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
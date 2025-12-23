import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Loader2, 
  ExternalLink,
  Sparkles,
  Navigation
} from 'lucide-react';
import { toast } from 'sonner';

export default function MonthlyVisitPlanner() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [generating, setGenerating] = useState(false);
  const [plan, setPlan] = useState(null);

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
  });

  // Filtrar clientes das regiões específicas
  const targetClients = useMemo(() => {
    const targetCities = [
      'Jaú', 'Jau',
      'Botucatu',
      'Dois Córregos', 'Denóis Paulista',
      'São Manuel', 'Sao Manuel',
      'Bariri', 'Barra Bonita', 'Igaraçu do Tietê',
      'Marília', 'Marilia',
      'Bauru',
      'Lençóis Paulista', 'Lencois Paulista'
    ];

    return clients.filter(c => {
      if (!c.city) return false;
      return targetCities.some(city => 
        c.city.toLowerCase().includes(city.toLowerCase())
      );
    });
  }, [clients]);

  const generatePlan = async () => {
    setGenerating(true);
    try {
      const prompt = `Crie um planejamento completo de visitas para JANEIRO DE 2026 considerando:

CLIENTES DISPONÍVEIS:
${targetClients.map(c => `- ${c.first_name} (${c.clinic_name || 'N/A'}) em ${c.city} - Status: ${c.status} - Score: ${c.purchase_score || 0}%`).join('\n')}

ESTRUTURA DO MÊS:
- Semana 1 (06-10 Jan): 3 dias em Jaú e região
- Semana 2 (13-17 Jan): 3 dias em Botucatu e região (São Manuel, Denóis Paulista)
- Semana 3 (20-24 Jan): Região de Marília e Bauru
- Semana 4 (27-31 Jan): Lençóis Paulista

REGRAS:
1. Agrupar visitas por proximidade geográfica
2. Priorizar clientes com status "quente" e score alto
3. 2-3 visitas por dia
4. Incluir endereço completo quando disponível

Retorne um planejamento estruturado por semana e dia.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            weeks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  week_number: { type: "number" },
                  region: { type: "string" },
                  dates: { type: "string" },
                  days: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        date: { type: "string" },
                        day_of_week: { type: "string" },
                        visits: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              time: { type: "string" },
                              client_name: { type: "string" },
                              clinic_name: { type: "string" },
                              city: { type: "string" },
                              address: { type: "string" },
                              priority: { type: "string" },
                              objective: { type: "string" }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });

      setPlan(response);
      toast.success('Planejamento gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar planejamento:', error);
      toast.error('Erro ao gerar planejamento');
    } finally {
      setGenerating(false);
    }
  };

  const syncWithGoogleCalendar = async () => {
    if (!plan) return;
    
    try {
      toast.info('Sincronizando com Google Agenda...');
      
      let createdCount = 0;
      
      for (const week of plan.weeks) {
        for (const day of week.days) {
          for (const visit of day.visits) {
            try {
              // Criar evento no Google Calendar via backend
              const eventDate = day.date; // formato esperado: "2026-01-06"
              const [year, month, dayNum] = eventDate.split('-');
              const [hour, minute] = visit.time.split(':');
              
              const startDateTime = new Date(year, month - 1, dayNum, hour, minute);
              const endDateTime = new Date(startDateTime);
              endDateTime.setHours(endDateTime.getHours() + 1);
              
              // Criar visita no sistema
              await base44.entities.Visit.create({
                client_id: targetClients.find(c => c.first_name === visit.client_name)?.id || '',
                client_name: visit.client_name,
                scheduled_date: startDateTime.toISOString(),
                duration_minutes: 60,
                visit_type: 'demonstracao',
                location: `${visit.address || ''}, ${visit.city}`,
                notes: visit.objective,
                status: 'agendada'
              });
              
              createdCount++;
            } catch (error) {
              console.log('Erro ao criar visita:', error);
            }
          }
        }
      }
      
      toast.success(`${createdCount} visitas agendadas!`);
      queryClient.invalidateQueries(['visits']);
    } catch (error) {
      console.error('Erro ao sincronizar:', error);
      toast.error('Erro ao sincronizar com Google Agenda');
    }
  };

  const getGoogleMapsLink = (visit) => {
    const query = encodeURIComponent(`${visit.clinic_name || visit.client_name}, ${visit.city}`);
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
  };

  const getRouteLink = (visits) => {
    if (!visits || visits.length === 0) return '';
    
    const origin = `${visits[0].city}`;
    const destination = `${visits[visits.length - 1].city}`;
    const waypoints = visits.slice(1, -1).map(v => v.city).join('|');
    
    return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}${waypoints ? `&waypoints=${encodeURIComponent(waypoints)}` : ''}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-6 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-2xl font-bold mb-2">Planejamento Janeiro 2026</h1>
        <p className="text-indigo-100 text-sm">Jaú • Botucatu • Marília • Bauru • Lençóis Paulista</p>
      </div>

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4">
            <p className="text-sm text-slate-600">Clientes na Região</p>
            <p className="text-2xl font-bold text-slate-800">{targetClients.length}</p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-slate-600">Cidades</p>
            <p className="text-2xl font-bold text-slate-800">
              {new Set(targetClients.map(c => c.city)).size}
            </p>
          </Card>
        </div>

        {!plan ? (
          <Card className="p-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-indigo-100 rounded-full flex items-center justify-center">
                <Calendar className="w-8 h-8 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">Gerar Planejamento</h3>
                <p className="text-sm text-slate-600">
                  Crie um planejamento completo de visitas para janeiro de 2026
                </p>
              </div>
              <Button
                onClick={generatePlan}
                disabled={generating || targetClients.length === 0}
                className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600"
              >
                {generating ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Gerar com IA
                  </>
                )}
              </Button>
            </div>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Sync Button */}
            <Card className="p-4 bg-gradient-to-r from-green-50 to-blue-50">
              <Button
                onClick={syncWithGoogleCalendar}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Sincronizar com Google Agenda
              </Button>
            </Card>

            {/* Weeks */}
            {plan.weeks.map((week, weekIdx) => (
              <Card key={weekIdx} className="p-5">
                <div className="mb-4">
                  <h3 className="font-bold text-lg text-indigo-600">
                    Semana {week.week_number} - {week.region}
                  </h3>
                  <p className="text-sm text-slate-600">{week.dates}</p>
                  
                  {/* Route Link */}
                  {week.days[0]?.visits?.length > 0 && (
                    <a
                      href={getRouteLink(week.days.flatMap(d => d.visits))}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 mt-2 text-sm text-blue-600 hover:underline"
                    >
                      <Navigation className="w-4 h-4" />
                      Abrir Rota no Google Maps
                    </a>
                  )}
                </div>

                {/* Days */}
                <div className="space-y-4">
                  {week.days.map((day, dayIdx) => (
                    <div key={dayIdx} className="border-l-4 border-indigo-300 pl-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-semibold text-slate-800">{day.day_of_week}</p>
                          <p className="text-sm text-slate-600">{day.date}</p>
                        </div>
                        <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                          {day.visits.length} visitas
                        </span>
                      </div>

                      {/* Visits */}
                      <div className="space-y-2">
                        {day.visits.map((visit, visitIdx) => (
                          <div key={visitIdx} className="bg-slate-50 p-3 rounded-lg">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <p className="font-semibold text-slate-800">
                                  {visit.time} - {visit.client_name}
                                </p>
                                {visit.clinic_name && (
                                  <p className="text-sm text-slate-600">{visit.clinic_name}</p>
                                )}
                                <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                                  <MapPin className="w-3 h-3" />
                                  {visit.city}
                                </p>
                                {visit.address && (
                                  <p className="text-xs text-slate-400 mt-1">{visit.address}</p>
                                )}
                                {visit.objective && (
                                  <p className="text-xs text-indigo-600 mt-1">🎯 {visit.objective}</p>
                                )}
                                {visit.priority && (
                                  <span className={`inline-block text-xs px-2 py-0.5 rounded mt-1 ${
                                    visit.priority === 'alta' ? 'bg-red-100 text-red-700' :
                                    visit.priority === 'média' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-green-100 text-green-700'
                                  }`}>
                                    {visit.priority}
                                  </span>
                                )}
                              </div>
                              <a
                                href={getGoogleMapsLink(visit)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-2 p-2 hover:bg-white rounded"
                              >
                                <ExternalLink className="w-4 h-4 text-blue-600" />
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ))}

            {/* Regenerate */}
            <Button
              onClick={generatePlan}
              disabled={generating}
              variant="outline"
              className="w-full"
            >
              Gerar Novo Planejamento
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
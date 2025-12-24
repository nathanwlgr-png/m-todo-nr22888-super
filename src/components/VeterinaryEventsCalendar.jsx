import React, { useState, useEffect } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { base44 } from '@/api/base44Client';
import { Loader2, Calendar, MapPin, Users, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

export default function VeterinaryEventsCalendar() {
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState(null);
  const [clientsAttending, setClientsAttending] = useState({});

  useEffect(() => {
    loadSavedEvents();
  }, []);

  const loadSavedEvents = async () => {
    try {
      const docs = await base44.entities.GeneratedDocument.filter({ 
        type: 'relatorio',
        title: { $regex: 'Eventos Veterinários' }
      });
      if (docs.length > 0) {
        const parsed = JSON.parse(docs[0].content);
        setEvents(parsed);
      }
    } catch (error) {
      console.error('Erro ao carregar eventos:', error);
    }
  };

  const generateEventsCalendar = async () => {
    setLoading(true);
    try {
      const prompt = `Você é um especialista no mercado veterinário brasileiro. Liste os PRINCIPAIS EVENTOS VETERINÁRIOS de 2025 e 2026.

**TAREFA:**
Liste eventos nacionais e regionais importantes:

1. **CONGRESSOS NACIONAIS:**
   - CONBRAVET (Congresso Brasileiro de Medicina Veterinária)
   - ANCLIVEPA (Associação Nacional de Clínicos Veterinários)
   - Congressos regionais (Sul, Sudeste, Nordeste, etc)

2. **FEIRAS E EXPOSIÇÕES:**
   - Interzoo Brasil
   - Pet South America
   - Eventos de equipamentos veterinários

3. **WORKSHOPS E CURSOS:**
   - Eventos de atualização técnica
   - Capacitações em equipamentos

Para cada evento, forneça:
- Nome completo
- Data (ou período)
- Local (cidade/estado)
- Público esperado
- Tipo (congresso/feira/workshop)
- Link (se conhecido)

Organize por mês para facilitar acompanhamento.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            events: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  date: { type: "string" },
                  month: { type: "number" },
                  year: { type: "number" },
                  location: { type: "string" },
                  city: { type: "string" },
                  state: { type: "string" },
                  expected_audience: { type: "string" },
                  type: { type: "string" },
                  website: { type: "string" }
                }
              }
            }
          }
        }
      });

      // Salvar eventos
      await base44.entities.GeneratedDocument.create({
        title: 'Eventos Veterinários 2025-2026',
        type: 'relatorio',
        content: JSON.stringify(result),
        summary: `Calendário completo de eventos veterinários com ${result.events.length} eventos mapeados`,
        tags: ['eventos', 'veterinária', 'calendário', '2025', '2026']
      });

      setEvents(result);
      toast.success('Calendário gerado e salvo!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao gerar calendário');
    } finally {
      setLoading(false);
    }
  };

  const checkClientAttendance = async (eventName) => {
    try {
      const clients = await base44.entities.Client.list();
      const attending = clients.filter(c => 
        c.notes?.toLowerCase().includes(eventName.toLowerCase()) ||
        c.notes?.toLowerCase().includes('evento') ||
        c.notes?.toLowerCase().includes('congresso')
      );
      
      setClientsAttending(prev => ({
        ...prev,
        [eventName]: attending
      }));
    } catch (error) {
      console.error('Erro ao verificar participação:', error);
    }
  };

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const groupedByMonth = events?.events?.reduce((acc, event) => {
    const month = event.month || 1;
    if (!acc[month]) acc[month] = [];
    acc[month].push(event);
    return acc;
  }, {});

  return (
    <Card className="p-5 bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-300">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-orange-600 flex items-center justify-center">
          <Calendar className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-slate-800">Eventos Veterinários 2025-2026</h3>
          <p className="text-xs text-slate-600">Congressos, Feiras e Workshops</p>
        </div>
      </div>

      {!events && (
        <Button
          onClick={generateEventsCalendar}
          disabled={loading}
          className="w-full bg-orange-600 hover:bg-orange-700"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Gerando Calendário...
            </>
          ) : (
            <>
              <Calendar className="w-4 h-4 mr-2" />
              Gerar Calendário de Eventos
            </>
          )}
        </Button>
      )}

      {events && groupedByMonth && (
        <div className="space-y-4">
          {Object.entries(groupedByMonth)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([month, monthEvents]) => (
              <div key={month}>
                <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-orange-600" />
                  {monthNames[Number(month) - 1]}
                </h4>
                <div className="space-y-2">
                  {monthEvents.map((event, idx) => (
                    <div key={idx} className="p-4 bg-white rounded-xl border-2 border-orange-200">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-bold text-slate-800">{event.name}</p>
                          <p className="text-xs text-slate-600 mt-1">{event.date}</p>
                        </div>
                        <Badge className="bg-orange-100 text-orange-700">
                          {event.type}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-700">
                          {event.city}, {event.state}
                        </span>
                      </div>

                      {event.expected_audience && (
                        <div className="flex items-center gap-2 mb-2">
                          <Users className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-600">{event.expected_audience}</span>
                        </div>
                      )}

                      {event.website && (
                        <a 
                          href={event.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline flex items-center gap-1 mb-2"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Mais informações
                        </a>
                      )}

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => checkClientAttendance(event.name)}
                        className="w-full mt-2"
                      >
                        Verificar Clientes Inscritos
                      </Button>

                      {clientsAttending[event.name]?.length > 0 && (
                        <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
                          <p className="text-xs font-semibold text-green-700 mb-1">
                            ✓ {clientsAttending[event.name].length} cliente(s) inscrito(s):
                          </p>
                          <div className="space-y-1">
                            {clientsAttending[event.name].map((client, i) => (
                              <p key={i} className="text-xs text-slate-700">
                                • {client.first_name} - {client.clinic_name}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

          <Button
            onClick={generateEventsCalendar}
            disabled={loading}
            variant="outline"
            className="w-full"
          >
            Atualizar Calendário
          </Button>
        </div>
      )}
    </Card>
  );
}
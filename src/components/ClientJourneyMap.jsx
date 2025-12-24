import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Map, Calendar, MessageCircle, ShoppingCart, Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function ClientJourneyMap() {
  const [selectedClient, setSelectedClient] = useState(null);
  const [journey, setJourney] = useState(null);
  const [loading, setLoading] = useState(false);

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const data = await base44.entities.Client.list('-updated_date', 30);
      return data.filter(c => c && c.id && c.first_name);
    }
  });

  const generateJourney = async (client) => {
    setLoading(true);
    setSelectedClient(client);

    try {
      const [sales, visits, interactions, tasks] = await Promise.all([
        base44.entities.Sale.filter({ client_id: client.id }),
        base44.entities.Visit.filter({ client_id: client.id }),
        base44.entities.Interaction.filter({ client_id: client.id }),
        base44.entities.Task.filter({ client_id: client.id })
      ]);

      const allEvents = [
        ...sales.map(s => ({ type: 'sale', date: s.sale_date, data: s })),
        ...visits.map(v => ({ type: 'visit', date: v.scheduled_date, data: v })),
        ...interactions.map(i => ({ type: 'interaction', date: i.created_date, data: i })),
        ...tasks.map(t => ({ type: 'task', date: t.created_date, data: t }))
      ].sort((a, b) => new Date(b.date) - new Date(a.date));

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Analise a jornada completa deste cliente e sugira próximos passos:

CLIENTE: ${client.full_name || client.first_name}
Status: ${client.status}
Score: ${client.purchase_score || 0}%

HISTÓRICO (${allEvents.length} eventos):
${allEvents.slice(0, 20).map(e => {
  if (e.type === 'sale') return `[VENDA] ${e.data.equipment_name} - R$ ${e.data.sale_value} (${e.data.status})`;
  if (e.type === 'visit') return `[VISITA] ${e.data.visit_type} (${e.data.status})`;
  if (e.type === 'interaction') return `[INTERAÇÃO] ${e.data.type}: ${e.data.subject}`;
  if (e.type === 'task') return `[TAREFA] ${e.data.title} (${e.data.status})`;
}).join('\n')}

ANÁLISE NECESSÁRIA:
1. Fase atual da jornada (awareness, consideration, decision, retention)
2. Pontos de contato mais efetivos
3. Gaps na jornada (momentos sem interação)
4. Probabilidade de conversão no próximo mês
5. 5 próximas ações personalizadas (priorizadas)
6. Conteúdo/ofertas recomendadas
7. Riscos de churn (se aplicável)`,
        response_json_schema: {
          type: "object",
          properties: {
            fase_atual: { type: "string", enum: ["awareness", "consideration", "decision", "retention", "advocacy"] },
            pontos_contato_efetivos: { type: "array", items: { type: "string" } },
            gaps_identificados: { type: "array", items: { type: "string" } },
            probabilidade_conversao: { type: "number" },
            proximas_acoes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  acao: { type: "string" },
                  prioridade: { type: "string", enum: ["alta", "media", "baixa"] },
                  prazo_dias: { type: "number" },
                  canal: { type: "string" }
                }
              }
            },
            conteudo_recomendado: { type: "array", items: { type: "string" } },
            risco_churn: { type: "string" },
            insights: { type: "array", items: { type: "string" } }
          }
        }
      });

      setJourney({ events: allEvents, analysis: response });
      toast.success('Jornada mapeada!');

    } catch (error) {
      console.error(error);
      toast.error('Erro ao mapear jornada');
    } finally {
      setLoading(false);
    }
  };

  const eventIcons = {
    sale: <ShoppingCart className="w-4 h-4 text-green-600" />,
    visit: <Calendar className="w-4 h-4 text-blue-600" />,
    interaction: <MessageCircle className="w-4 h-4 text-purple-600" />,
    task: <Badge className="w-4 h-4 text-orange-600" />
  };

  const faseLabels = {
    awareness: "Descoberta",
    consideration: "Consideração",
    decision: "Decisão",
    retention: "Retenção",
    advocacy: "Promotor"
  };

  return (
    <Card className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-300">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center">
          <Map className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-slate-800">Jornada do Cliente</h3>
          <p className="text-xs text-slate-600">Visualize interações e próximos passos</p>
        </div>
      </div>

      {!selectedClient ? (
        <div className="space-y-2">
          <p className="text-sm text-slate-700 mb-3">Selecione um cliente:</p>
          <div className="max-h-60 overflow-y-auto space-y-2">
            {clients.slice(0, 15).map(client => (
              <button
                key={client.id}
                onClick={() => generateJourney(client)}
                className="w-full p-3 bg-white rounded-lg border border-purple-200 hover:bg-purple-50 text-left transition-all"
              >
                <p className="font-semibold text-sm">{client.full_name || client.first_name}</p>
                <p className="text-xs text-slate-600">{client.city} • {client.status}</p>
              </button>
            ))}
          </div>
        </div>
      ) : loading ? (
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-3" />
          <p className="text-sm text-slate-700">Mapeando jornada...</p>
        </div>
      ) : journey ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <p className="font-bold text-slate-800">{selectedClient.first_name}</p>
            <Button size="sm" variant="ghost" onClick={() => { setSelectedClient(null); setJourney(null); }}>
              ← Voltar
            </Button>
          </div>

          {/* Fase Atual */}
          <div className="p-3 bg-white rounded-lg border-2 border-purple-300">
            <p className="text-xs font-semibold text-purple-800 mb-2">📍 Fase Atual</p>
            <Badge className="bg-purple-600 text-base">
              {faseLabels[journey.analysis.fase_atual]}
            </Badge>
            <div className="mt-2">
              <p className="text-xs text-slate-600">
                Probabilidade de Conversão: <strong>{journey.analysis.probabilidade_conversao}%</strong>
              </p>
            </div>
          </div>

          {/* Timeline */}
          <div className="p-3 bg-white rounded-lg border border-purple-200 max-h-48 overflow-y-auto">
            <p className="text-xs font-semibold text-purple-800 mb-3">📅 Histórico de Interações</p>
            <div className="space-y-3">
              {journey.events.slice(0, 10).map((event, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex-shrink-0 mt-1">{eventIcons[event.type]}</div>
                  <div className="flex-1">
                    <p className="text-xs font-medium">
                      {event.type === 'sale' && `Venda: ${event.data.equipment_name}`}
                      {event.type === 'visit' && `Visita: ${event.data.visit_type}`}
                      {event.type === 'interaction' && event.data.subject}
                      {event.type === 'task' && event.data.title}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {format(new Date(event.date), 'dd/MM/yyyy')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Próximas Ações */}
          <div className="p-3 bg-green-50 rounded-lg border-2 border-green-300">
            <p className="text-xs font-semibold text-green-800 mb-3">✅ Próximos Passos (IA)</p>
            <div className="space-y-2">
              {journey.analysis.proximas_acoes?.map((acao, i) => (
                <div key={i} className="flex items-start gap-2 p-2 bg-white rounded border border-green-200">
                  <ArrowRight className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-medium">{acao.acao}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={
                        acao.prioridade === 'alta' ? 'bg-red-600' :
                        acao.prioridade === 'media' ? 'bg-yellow-600' : 'bg-blue-600'
                      }>{acao.prioridade}</Badge>
                      <span className="text-[10px] text-slate-500">
                        {acao.prazo_dias} dias • {acao.canal}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Conteúdo Recomendado */}
          {journey.analysis.conteudo_recomendado?.length > 0 && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs font-semibold text-blue-800 mb-2">📄 Conteúdo para Enviar</p>
              <ul className="space-y-1">
                {journey.analysis.conteudo_recomendado.map((c, i) => (
                  <li key={i} className="text-xs text-blue-700">• {c}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Insights */}
          {journey.analysis.insights?.length > 0 && (
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-xs font-semibold text-amber-800 mb-2">💡 Insights</p>
              {journey.analysis.insights.map((insight, i) => (
                <p key={i} className="text-xs text-amber-700 mb-1">• {insight}</p>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </Card>
  );
}
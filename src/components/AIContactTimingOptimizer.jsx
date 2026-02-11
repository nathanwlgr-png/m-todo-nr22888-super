import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, TrendingUp, Zap, Loader2, Calendar } from 'lucide-react';
import { toast } from 'sonner';

export default function AIContactTimingOptimizer() {
  const [analyzing, setAnalyzing] = useState(false);
  const [insights, setInsights] = useState(null);

  const { data: clients = [] } = useQuery({
    queryKey: ['clients-timing'],
    queryFn: () => base44.entities.Client.list()
  });

  const { data: interactions = [] } = useQuery({
    queryKey: ['interactions-timing'],
    queryFn: () => base44.entities.Interaction.list()
  });

  const { data: visits = [] } = useQuery({
    queryKey: ['visits-timing'],
    queryFn: () => base44.entities.Visit.list()
  });

  const analyzeContactPatterns = async () => {
    setAnalyzing(true);
    
    try {
      // Preparar dados de interações bem-sucedidas
      const successfulInteractions = interactions.filter(i => 
        i.outcome === 'positive' && i.created_date
      );

      const interactionsByHour = {};
      const interactionsByDay = {};
      
      successfulInteractions.forEach(i => {
        const date = new Date(i.created_date);
        const hour = date.getHours();
        const day = date.toLocaleDateString('pt-BR', { weekday: 'long' });
        
        interactionsByHour[hour] = (interactionsByHour[hour] || 0) + 1;
        interactionsByDay[day] = (interactionsByDay[day] || 0) + 1;
      });

      const bestHours = Object.entries(interactionsByHour)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([hour, count]) => ({ hour: parseInt(hour), count }));

      const bestDays = Object.entries(interactionsByDay)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3);

      // Analisar com IA
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Analise os padrões de contato bem-sucedidos e gere insights acionáveis.

DADOS:
- Total de interações positivas: ${successfulInteractions.length}
- Melhores horários: ${bestHours.map(h => `${h.hour}h (${h.count} sucessos)`).join(', ')}
- Melhores dias: ${bestDays.map(([day, count]) => `${day} (${count})`).join(', ')}
- Total clientes ativos: ${clients.filter(c => c.status !== 'frio').length}
- Clientes quentes: ${clients.filter(c => c.status === 'quente').length}

SEGMENTOS:
${['hospital_veterinario', 'clinica_media', 'clinica_pequena'].map(type => {
  const count = clients.filter(c => c.client_type === type).length;
  return `- ${type}: ${count} clientes`;
}).join('\n')}

Gere recomendações práticas e específicas para otimizar o timing de contatos:`,
        response_json_schema: {
          type: "object",
          properties: {
            best_contact_windows: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  time_range: { type: "string" },
                  days: { type: "array", items: { type: "string" } },
                  client_type: { type: "string" },
                  success_rate: { type: "string" },
                  reasoning: { type: "string" }
                }
              }
            },
            urgent_contacts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  client_name: { type: "string" },
                  best_time: { type: "string" },
                  priority: { type: "string" },
                  reason: { type: "string" }
                }
              }
            },
            general_insights: { type: "array", items: { type: "string" } },
            automation_suggestions: { type: "array", items: { type: "string" } }
          }
        }
      });

      setInsights(result);
      toast.success('Análise completa!');
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao analisar padrões');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <Card className="bg-gradient-to-br from-cyan-50 to-blue-50 border-2 border-cyan-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-cyan-900">
          <Clock className="w-5 h-5" />
          IA: Timing Ideal de Contato
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!insights ? (
          <>
            <p className="text-xs text-cyan-700">
              Analisa seus padrões de sucesso e sugere os melhores horários para contatar cada tipo de cliente
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-white rounded border border-cyan-200">
                <p className="font-semibold text-slate-700">Interações</p>
                <p className="text-2xl font-bold text-cyan-600">{interactions.length}</p>
              </div>
              <div className="p-2 bg-white rounded border border-cyan-200">
                <p className="font-semibold text-slate-700">Positivas</p>
                <p className="text-2xl font-bold text-green-600">
                  {interactions.filter(i => i.outcome === 'positive').length}
                </p>
              </div>
            </div>

            <Button
              onClick={analyzeContactPatterns}
              disabled={analyzing || interactions.length < 5}
              className="w-full bg-cyan-600 hover:bg-cyan-700"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analisando...
                </>
              ) : (
                <>
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Analisar Padrões
                </>
              )}
            </Button>

            {interactions.length < 5 && (
              <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                ⚠️ Registre pelo menos 5 interações para análise precisa
              </p>
            )}
          </>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setInsights(null)}
              className="w-full"
            >
              Nova Análise
            </Button>

            {/* Janelas de Contato Ideais */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-cyan-900 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Melhores Horários por Tipo
              </p>
              {insights.best_contact_windows?.map((window, i) => (
                <div key={i} className="p-2 bg-white rounded border border-cyan-200">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold text-slate-800">
                      {window.client_type}
                    </p>
                    <Badge className="bg-green-600 text-white text-xs">
                      {window.success_rate}
                    </Badge>
                  </div>
                  <p className="text-xs text-cyan-700 font-semibold">
                    🕐 {window.time_range}
                  </p>
                  <p className="text-xs text-slate-600">
                    📅 {window.days.join(', ')}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {window.reasoning}
                  </p>
                </div>
              ))}
            </div>

            {/* Contatos Urgentes */}
            {insights.urgent_contacts?.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-red-900 flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  Contatos Prioritários HOJE
                </p>
                {insights.urgent_contacts.map((contact, i) => (
                  <div key={i} className="p-2 bg-red-50 rounded border border-red-200">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs font-semibold text-slate-800">
                        {contact.client_name}
                      </p>
                      <Badge className={
                        contact.priority === 'alta' ? 'bg-red-600' :
                        contact.priority === 'media' ? 'bg-orange-600' :
                        'bg-yellow-600'
                      }>
                        {contact.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-red-700 font-semibold">
                      ⏰ {contact.best_time}
                    </p>
                    <p className="text-xs text-slate-600 mt-1">
                      {contact.reason}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Insights Gerais */}
            <div className="p-2 bg-blue-50 rounded border border-blue-200">
              <p className="text-xs font-bold text-blue-900 mb-2">💡 Insights:</p>
              <ul className="space-y-1">
                {insights.general_insights?.map((insight, i) => (
                  <li key={i} className="text-xs text-blue-700">
                    • {insight}
                  </li>
                ))}
              </ul>
            </div>

            {/* Sugestões de Automação */}
            {insights.automation_suggestions?.length > 0 && (
              <div className="p-2 bg-purple-50 rounded border border-purple-200">
                <p className="text-xs font-bold text-purple-900 mb-2">🤖 Automatizar:</p>
                <ul className="space-y-1">
                  {insights.automation_suggestions.map((suggestion, i) => (
                    <li key={i} className="text-xs text-purple-700">
                      • {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
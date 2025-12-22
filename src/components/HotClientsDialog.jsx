import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Target, TrendingUp, Calendar, Sparkles } from 'lucide-react';

export default function HotClientsDialog({ open, onOpenChange, status = 'quente' }) {
  const navigate = useNavigate();
  const [suggestedClient, setSuggestedClient] = useState(null);
  const [generating, setGenerating] = useState(false);

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
    enabled: open
  });

  const { data: visits = [] } = useQuery({
    queryKey: ['all-visits'],
    queryFn: () => base44.entities.Visit.list(),
    enabled: open
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['all-sales'],
    queryFn: () => base44.entities.Sale.list(),
    enabled: open
  });

  const filteredClients = clients.filter(c => c.status === status);

  const generateBestOption = async () => {
    setGenerating(true);
    try {
      const clientsData = filteredClients.map(client => {
        const clientVisits = visits.filter(v => v.client_id === client.id);
        const clientSales = sales.filter(s => s.client_id === client.id);
        
        return {
          id: client.id,
          name: client.first_name,
          clinic: client.clinic_name,
          city: client.city,
          score: client.purchase_score,
          budget: client.available_budget,
          deadline: client.decision_deadline,
          visits_count: clientVisits.filter(v => v.status === 'realizada').length,
          last_visit: client.last_visit_date,
          equipment_interest: client.equipment_suggestion || 'Não especificado',
          projected_revenue: client.projected_revenue,
          objections: client.real_objections?.length || 0,
          motivators: client.purchase_motivators?.length || 0,
          profile: `${client.numerology_number} - ${client.behavioral_profile}`
        };
      });

      const prompt = `Você é um assistente de vendas estratégico.

CLIENTES ${status.toUpperCase()}:
${JSON.stringify(clientsData, null, 2)}

DATA ATUAL: ${new Date().toLocaleDateString('pt-BR')}

TAREFA:
Analise TODOS os clientes ${status} e identifique qual é a MELHOR OPORTUNIDADE DE VENDA PARA HOJE.

Considere:
1. **Probabilidade de fechar** (score + motivadores vs objeções)
2. **Urgência** (deadline próximo + última visita antiga)
3. **Valor da venda** (receita projetada)
4. **Facilidade de fechamento** (visitas feitas + perfil comportamental)
5. **Momento ideal** (timing baseado em histórico)

Retorne JSON:
{
  "best_client_id": "ID do melhor cliente",
  "confidence": 95,
  "reasoning": "Explicação em 3-4 linhas do POR QUÊ este é o melhor cliente para hoje",
  "action_plan": "Plano de ação específico em 2-3 passos",
  "estimated_closing_probability": 85,
  "alternative_client_id": "ID da segunda melhor opção",
  "timing_recommendation": "Melhor horário para abordar hoje"
}`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            best_client_id: { type: "string" },
            confidence: { type: "number" },
            reasoning: { type: "string" },
            action_plan: { type: "string" },
            estimated_closing_probability: { type: "number" },
            alternative_client_id: { type: "string" },
            timing_recommendation: { type: "string" }
          }
        }
      });

      setSuggestedClient(result);
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setGenerating(false);
    }
  };

  React.useEffect(() => {
    if (open && filteredClients.length > 0 && !suggestedClient) {
      generateBestOption();
    }
  }, [open, filteredClients.length]);

  const getBestClient = () => {
    return filteredClients.find(c => c.id === suggestedClient?.best_client_id);
  };

  const getAlternativeClient = () => {
    return filteredClients.find(c => c.id === suggestedClient?.alternative_client_id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            🔥 Clientes {status === 'quente' ? 'Quentes' : status === 'morno' ? 'Mornos' : 'Frios'}
            <Badge className="ml-2">{filteredClients.length}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* AI Suggestion */}
          {generating && (
            <Card className="p-6 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-3" />
              <p className="text-sm text-slate-600">Analisando melhor oportunidade...</p>
            </Card>
          )}

          {suggestedClient && (
            <Card className="p-5 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border-2 border-green-300 shadow-lg">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center shadow-lg">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-slate-800 mb-1">🎯 Melhor Venda do Dia</h3>
                  <p className="text-xs text-slate-600">Recomendação IA</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">{suggestedClient.confidence}%</p>
                  <p className="text-xs text-slate-500">Confiança</p>
                </div>
              </div>

              {getBestClient() && (
                <div
                  onClick={() => {
                    navigate(createPageUrl(`ClientProfile?id=${getBestClient().id}`));
                    onOpenChange(false);
                  }}
                  className="p-4 bg-white rounded-xl border-2 border-green-300 cursor-pointer hover:bg-green-50 transition-all mb-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-lg font-bold text-slate-800">{getBestClient().first_name}</h4>
                    <Badge className="bg-green-600 text-white">
                      {suggestedClient.estimated_closing_probability}% chance
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600 mb-1">{getBestClient().clinic_name}</p>
                  <p className="text-xs text-slate-500">{getBestClient().city}</p>
                </div>
              )}

              <div className="space-y-3">
                <div className="bg-white/80 rounded-lg p-3">
                  <p className="text-xs font-semibold text-green-700 mb-1">💡 Por que este cliente?</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{suggestedClient.reasoning}</p>
                </div>

                <div className="bg-indigo-50 rounded-lg p-3">
                  <p className="text-xs font-semibold text-indigo-700 mb-1">📋 Plano de Ação</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{suggestedClient.action_plan}</p>
                </div>

                <div className="bg-purple-50 rounded-lg p-3">
                  <p className="text-xs font-semibold text-purple-700 mb-1">⏰ Melhor Horário</p>
                  <p className="text-sm text-slate-700">{suggestedClient.timing_recommendation}</p>
                </div>
              </div>

              {getAlternativeClient() && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs text-slate-500 mb-2">Segunda melhor opção:</p>
                  <div
                    onClick={() => {
                      navigate(createPageUrl(`ClientProfile?id=${getAlternativeClient().id}`));
                      onOpenChange(false);
                    }}
                    className="p-3 bg-white rounded-lg border cursor-pointer hover:bg-slate-50"
                  >
                    <p className="font-semibold text-slate-800">{getAlternativeClient().first_name}</p>
                    <p className="text-xs text-slate-500">{getAlternativeClient().clinic_name}</p>
                  </div>
                </div>
              )}

              <Button
                onClick={() => generateBestOption()}
                variant="outline"
                className="w-full mt-4"
                disabled={generating}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Atualizar Sugestão
              </Button>
            </Card>
          )}

          {/* Lista de todos */}
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-3">Todos os Clientes ({filteredClients.length})</h4>
            <div className="space-y-2">
              {filteredClients
                .sort((a, b) => (b.purchase_score || 0) - (a.purchase_score || 0))
                .map(client => {
                  const clientVisitsCount = visits.filter(v => v.client_id === client.id && v.status === 'realizada').length;
                  
                  return (
                    <Card
                      key={client.id}
                      onClick={() => {
                        navigate(createPageUrl(`ClientProfile?id=${client.id}`));
                        onOpenChange(false);
                      }}
                      className="p-3 cursor-pointer hover:bg-slate-50 transition-all"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-slate-800">{client.first_name}</p>
                        <Badge className="bg-indigo-100 text-indigo-700">
                          {client.purchase_score || 0}%
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500">{client.clinic_name}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-slate-600">
                        <span>📍 {client.city}</span>
                        <span>👥 {clientVisitsCount}x visitado</span>
                        {client.projected_revenue && (
                          <span>💰 R$ {(client.projected_revenue / 1000).toFixed(0)}k</span>
                        )}
                      </div>
                    </Card>
                  );
                })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
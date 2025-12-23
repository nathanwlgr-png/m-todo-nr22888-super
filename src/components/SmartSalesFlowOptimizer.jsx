import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  Loader2, 
  TrendingUp, 
  AlertTriangle,
  MessageSquare,
  Phone,
  Calendar,
  FileText,
  Copy,
  Send,
  ChevronRight,
  Target,
  Shield
} from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function SmartSalesFlowOptimizer() {
  const [analyzing, setAnalyzing] = useState(false);
  const [recommendations, setRecommendations] = useState(null);
  const [expandedClient, setExpandedClient] = useState(null);

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      try {
        const data = await base44.entities.Client.list('-updated_date', 50);
        return data.filter(c => c && c.id && c.first_name && c.status !== 'frio');
      } catch (error) {
        return [];
      }
    },
    staleTime: 60 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false
  });

  const { data: interactions = [] } = useQuery({
    queryKey: ['all-interactions'],
    queryFn: () => base44.entities.Interaction.list('-interaction_date', 200),
    staleTime: 60 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    enabled: false // Só carrega quando necessário
  });

  const { data: visits = [] } = useQuery({
    queryKey: ['all-visits'],
    queryFn: () => base44.entities.Visit.list('-scheduled_date', 100),
    staleTime: 60 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    enabled: false // Só carrega quando necessário
  });

  const analyzeTopClients = async () => {
    if (analyzing) return; // Prevent double clicks
    setAnalyzing(true);
    try {
      // Pegar top 5 clientes por prioridade
      const topClients = clients
        .filter(c => c.status === 'quente' || c.purchase_score > 60)
        .sort((a, b) => (b.purchase_score || 0) - (a.purchase_score || 0))
        .slice(0, 5);

      const analysisPromises = topClients.map(async (client) => {
        const clientInteractions = interactions.filter(i => i.client_id === client.id);
        const clientVisits = visits.filter(v => v.client_id === client.id);
        
        const daysSinceContact = clientInteractions.length > 0
          ? Math.floor((new Date() - new Date(clientInteractions[0].interaction_date)) / (1000*60*60*24))
          : 999;

        const prompt = `Você é um consultor de vendas B2B veterinário especializado em otimização de pipeline.

CLIENTE: ${client.first_name}
STATUS: ${client.status} | SCORE: ${client.purchase_score}%
PERFIL: ${client.numerology_number} - ${client.behavioral_profile}
ESTILO: ${client.decision_style}
ETAPA ATUAL: ${client.visit_objective || 'diagnosticar_necessidades'}

CONTEXTO RÁPIDO:
- Dias sem contato: ${daysSinceContact}
- Total interações: ${clientInteractions.length}
- Total visitas: ${clientVisits.length}
- Dores: ${client.main_pains?.join(', ') || 'Não identificadas'}
- Objeções: ${client.real_objections?.join(', ') || 'Nenhuma'}
- Orçamento: ${client.available_budget ? `R$ ${client.available_budget.toLocaleString('pt-BR')}` : 'Não informado'}

TAREFA:
Retorne JSON com análise rápida e ação CONCRETA:

{
  "priority_score": 0-100,
  "urgency_level": "critica|alta|media|baixa",
  "next_action": {
    "type": "whatsapp|email|call|visit|send_proposal",
    "title": "Título curto da ação",
    "when": "hoje|amanhã|esta_semana",
    "message_template": "Mensagem COMPLETA pronta para enviar"
  },
  "closing_probability": 0-100,
  "estimated_days_to_close": numero,
  "risk_mitigation": {
    "main_risk": "Principal risco identificado",
    "strategy": "Estratégia específica de mitigação"
  },
  "key_insight": "Insight mais importante em 1 linha"
}

Seja DIRETO e PRÁTICO. Foque no próximo passo imediato.`;

        try {
          const result = await base44.integrations.Core.InvokeLLM({
            prompt,
            response_json_schema: {
              type: "object",
              properties: {
                priority_score: { type: "number" },
                urgency_level: { type: "string" },
                next_action: {
                  type: "object",
                  properties: {
                    type: { type: "string" },
                    title: { type: "string" },
                    when: { type: "string" },
                    message_template: { type: "string" }
                  }
                },
                closing_probability: { type: "number" },
                estimated_days_to_close: { type: "number" },
                risk_mitigation: {
                  type: "object",
                  properties: {
                    main_risk: { type: "string" },
                    strategy: { type: "string" }
                  }
                },
                key_insight: { type: "string" }
              }
            }
          });

          return { client, analysis: result };
        } catch (error) {
          return null;
        }
      });

      const results = await Promise.all(analysisPromises);
      const validResults = results.filter(r => r !== null);

      // Ordenar por urgência e prioridade
      const sorted = validResults.sort((a, b) => {
        const urgencyWeight = { critica: 4, alta: 3, media: 2, baixa: 1 };
        const urgencyA = urgencyWeight[a.analysis.urgency_level] || 0;
        const urgencyB = urgencyWeight[b.analysis.urgency_level] || 0;
        if (urgencyA !== urgencyB) return urgencyB - urgencyA;
        return (b.analysis.priority_score || 0) - (a.analysis.priority_score || 0);
      });

      setRecommendations(sorted);
      toast.success(`${sorted.length} clientes analisados!`);
    } catch (error) {
      console.error('Erro na análise:', error);
      toast.error('Erro ao analisar clientes');
    } finally {
      setAnalyzing(false);
    }
  };

  const copyMessage = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Mensagem copiada!');
  };

  const sendViaWhatsApp = (phone, message) => {
    if (phone) {
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
    } else {
      toast.error('Cliente sem WhatsApp cadastrado');
    }
  };

  const actionTypeIcons = {
    whatsapp: MessageSquare,
    email: FileText,
    call: Phone,
    visit: Calendar,
    send_proposal: FileText
  };

  const actionTypeColors = {
    whatsapp: 'bg-green-500',
    email: 'bg-blue-500',
    call: 'bg-purple-500',
    visit: 'bg-orange-500',
    send_proposal: 'bg-indigo-500'
  };

  const urgencyColors = {
    critica: 'bg-red-500',
    alta: 'bg-orange-500',
    media: 'bg-yellow-500',
    baixa: 'bg-blue-500'
  };

  return (
    <Card className="p-5 bg-gradient-to-br from-orange-50 via-amber-50 to-orange-50 border-2 border-orange-300 shadow-xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg">
          <Target className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-bold text-slate-800">Otimizador de Vendas IA</h3>
          <p className="text-xs text-slate-600">Próximas ações estratégicas</p>
        </div>
        <Button
          onClick={analyzeTopClients}
          disabled={analyzing || clients.length === 0}
          size="sm"
          className="bg-orange-600 hover:bg-orange-700"
        >
          {analyzing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-1" />
              Analisar
            </>
          )}
        </Button>
      </div>

      {analyzing && (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-orange-600 mx-auto mb-2" />
            <p className="text-sm text-orange-700 font-medium">Analisando top clientes...</p>
            <p className="text-xs text-slate-500">IA processando histórico</p>
          </div>
        </div>
      )}

      {!analyzing && !recommendations && (
        <div className="text-center py-6">
          <Target className="w-12 h-12 text-orange-300 mx-auto mb-3" />
          <p className="text-sm text-slate-600 mb-2">
            Analise automaticamente seus clientes prioritários
          </p>
          <p className="text-xs text-slate-500">
            IA sugere próximas ações e gera mensagens prontas
          </p>
        </div>
      )}

      {recommendations && recommendations.length > 0 && (
        <div className="space-y-3">
          {recommendations.map((rec, idx) => {
            const { client, analysis } = rec;
            const isExpanded = expandedClient === client.id;
            const Icon = actionTypeIcons[analysis.next_action.type] || MessageSquare;
            
            return (
              <div key={client.id} className="bg-white rounded-xl border-2 border-orange-200 shadow-md overflow-hidden">
                {/* Header */}
                <div className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-lg font-bold text-orange-600">#{idx + 1}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Link 
                          to={createPageUrl(`ClientProfile?id=${client.id}`)}
                          className="font-bold text-slate-800 hover:text-orange-600"
                        >
                          {client.first_name}
                        </Link>
                        <Badge className={`${urgencyColors[analysis.urgency_level]} text-white text-xs`}>
                          {analysis.urgency_level}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600 mb-2">{analysis.key_insight}</p>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-slate-500">
                          🎯 {analysis.closing_probability}% fechamento
                        </span>
                        <span className="text-slate-500">
                          ⏱️ ~{analysis.estimated_days_to_close} dias
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Próxima Ação */}
                  <div className={`p-3 rounded-lg ${actionTypeColors[analysis.next_action.type]} bg-opacity-10 border-2`}
                       style={{ borderColor: `${actionTypeColors[analysis.next_action.type].replace('bg-', '')}` }}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-8 h-8 rounded-lg ${actionTypeColors[analysis.next_action.type]} flex items-center justify-center`}>
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-800 text-sm">{analysis.next_action.title}</p>
                        <p className="text-xs text-slate-500">Executar: {analysis.next_action.when}</p>
                      </div>
                      <Button
                        onClick={() => setExpandedClient(isExpanded ? null : client.id)}
                        size="sm"
                        variant="ghost"
                      >
                        <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                      </Button>
                    </div>

                    {/* Mensagem Expandida */}
                    {isExpanded && (
                      <div className="mt-3 space-y-3">
                        <div className="p-3 bg-white rounded-lg border-2 border-slate-200">
                          <p className="text-xs font-semibold text-slate-600 mb-2">MENSAGEM PRONTA:</p>
                          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line mb-3">
                            {analysis.next_action.message_template}
                          </p>
                          
                          <div className="flex gap-2">
                            <Button
                              onClick={() => copyMessage(analysis.next_action.message_template)}
                              size="sm"
                              variant="outline"
                              className="flex-1"
                            >
                              <Copy className="w-3 h-3 mr-1" />
                              Copiar
                            </Button>
                            {analysis.next_action.type === 'whatsapp' && client.phone && (
                              <Button
                                onClick={() => sendViaWhatsApp(client.phone, analysis.next_action.message_template)}
                                size="sm"
                                className="flex-1 bg-green-600 hover:bg-green-700"
                              >
                                <Send className="w-3 h-3 mr-1" />
                                Enviar
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Mitigação de Riscos */}
                        <div className="p-3 bg-amber-50 rounded-lg border-2 border-amber-200">
                          <div className="flex items-start gap-2">
                            <Shield className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-xs font-semibold text-amber-800 mb-1">
                                RISCO: {analysis.risk_mitigation.main_risk}
                              </p>
                              <p className="text-xs text-amber-700">
                                ✓ {analysis.risk_mitigation.strategy}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {recommendations && recommendations.length === 0 && (
        <div className="text-center py-6">
          <AlertTriangle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm text-slate-600">Nenhum cliente prioritário encontrado</p>
        </div>
      )}
    </Card>
  );
}
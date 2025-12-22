import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Sparkles, 
  Target,
  MessageSquare,
  FileText,
  Copy,
  Loader2,
  CheckCircle,
  TrendingUp,
  Send
} from 'lucide-react';
import { toast } from 'sonner';
import ClientSelector from '@/components/ClientSelector';

export default function FollowUpAssistant() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const clientIdFromUrl = urlParams.get('id');

  const [selectedClientId, setSelectedClientId] = useState(clientIdFromUrl || null);
  const [generating, setGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState(null);

  const { data: allClients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-updated_date')
  });

  const { data: client, isLoading } = useQuery({
    queryKey: ['client', selectedClientId],
    queryFn: async () => {
      const clients = await base44.entities.Client.filter({ id: selectedClientId });
      return clients[0];
    },
    enabled: !!selectedClientId
  });

  const { data: visits = [] } = useQuery({
    queryKey: ['visits', selectedClientId],
    queryFn: () => base44.entities.Visit.filter({ client_id: selectedClientId }),
    enabled: !!selectedClientId
  });

  const generateFollowUpPlan = async () => {
    if (!client) return;
    
    setGenerating(true);
    
    try {
      const prompt = `
Você é um especialista em vendas B2B de equipamentos veterinários.

CONTEXTO DO CLIENTE:
- Nome: ${client.first_name}
- Tipo: ${client.client_type || 'não especificado'}
- Papel: ${client.decision_role}
- Status: ${client.status}
- Score de Compra: ${client.purchase_score || 50}/100
- Perfil Comportamental: ${client.behavioral_profile || 'não definido'}
- Estilo de Decisão: ${client.decision_style || 'não definido'}
- Dores Identificadas: ${client.main_pains?.join(', ') || 'não identificadas'}
- Última visita: ${client.last_visit_date || 'nunca visitado'}
- Última ação: ${client.next_action || 'não definida'}
- Visitas realizadas: ${visits.filter(v => v.status === 'realizada').length}
- Visitas agendadas: ${visits.filter(v => v.status === 'agendada').length}

TAREFA:
Gere um plano de follow-up inteligente e personalizado com:

1. **next_steps**: Array com 3 próximos passos estratégicos recomendados (strings curtas)
2. **message_templates**: Array com 2 mensagens WhatsApp personalizadas prontas para envio (português, informal mas profissional, máx 200 caracteres cada)
3. **content_suggestions**: Array com 3 conteúdos relevantes para compartilhar (cada um com: "title", "type" [estudo_caso|whitepaper|video|calculo_roi], "description")
4. **timing_recommendation**: Melhor momento para próximo contato (ex: "Em 2 dias, pela manhã")
5. **key_focus**: Principal foco deste follow-up (ex: "Demonstrar economia vs terceirização")

Considere o perfil comportamental e estilo de decisão do cliente para personalizar tudo.
`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            next_steps: { type: "array", items: { type: "string" } },
            message_templates: { type: "array", items: { type: "string" } },
            content_suggestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  type: { type: "string" },
                  description: { type: "string" }
                }
              }
            },
            timing_recommendation: { type: "string" },
            key_focus: { type: "string" }
          }
        }
      });

      setSuggestions(response);
    } catch (error) {
      toast.error('Erro ao gerar sugestões');
    }
    
    setGenerating(false);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado!');
  };

  const sendWhatsApp = (message) => {
    if (!client?.phone) {
      toast.error('Cliente sem WhatsApp cadastrado');
      return;
    }
    window.open(`https://wa.me/${client.phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const contentTypeIcons = {
    estudo_caso: FileText,
    whitepaper: FileText,
    video: FileText,
    calculo_roi: TrendingUp
  };

  const contentTypeLabels = {
    estudo_caso: 'Estudo de Caso',
    whitepaper: 'Whitepaper',
    video: 'Vídeo',
    calculo_roi: 'Cálculo ROI'
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="bg-gradient-to-br from-indigo-600 to-purple-600 px-4 pt-4 pb-24 rounded-b-[2rem]">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-white/10">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-white">Assistente de Follow-Up</h1>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur rounded-2xl p-4 mb-4">
          <ClientSelector
            clients={allClients}
            selectedClientId={selectedClientId}
            onClientChange={setSelectedClientId}
          />
        </div>

        <div className="flex items-center gap-3 bg-white/10 backdrop-blur rounded-2xl p-4">
          <Sparkles className="w-8 h-8 text-amber-300" />
          <div className="flex-1">
            <p className="text-white font-medium">IA de Vendas</p>
            <p className="text-xs text-indigo-100">Próximos passos otimizados</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-16 space-y-4">
        {/* Client Quick Stats */}
        <Card className="p-4 bg-white shadow-lg border-none">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-2xl font-bold text-slate-800">{client?.purchase_score || 50}%</p>
              <p className="text-xs text-slate-500">Score</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{visits.filter(v => v.status === 'realizada').length}</p>
              <p className="text-xs text-slate-500">Visitas</p>
            </div>
            <div>
              <Badge className={
                client?.status === 'quente' ? 'bg-red-500' :
                client?.status === 'morno' ? 'bg-yellow-500' : 'bg-blue-400'
              }>
                {client?.status}
              </Badge>
            </div>
          </div>
        </Card>

        {!suggestions ? (
          <Card className="p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-indigo-600" />
            </div>
            <h3 className="font-semibold text-slate-800 mb-2">Gerar Plano de Follow-Up</h3>
            <p className="text-sm text-slate-600 mb-4">
              A IA analisará o histórico, dores e perfil do cliente para sugerir próximos passos e conteúdo.
            </p>
            <Button
              onClick={generateFollowUpPlan}
              disabled={generating}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analisando...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Gerar Sugestões
                </>
              )}
            </Button>
          </Card>
        ) : (
          <>
            {/* Key Focus */}
            <Card className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
              <div className="flex items-start gap-3">
                <Target className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="text-xs text-amber-600 font-medium mb-1">FOCO PRINCIPAL</p>
                  <p className="font-semibold text-slate-800">{suggestions.key_focus}</p>
                </div>
              </div>
            </Card>

            {/* Timing */}
            <Card className="p-4 border-l-4 border-l-indigo-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Melhor Momento</p>
                  <p className="font-semibold text-slate-800">{suggestions.timing_recommendation}</p>
                </div>
                <CheckCircle className="w-5 h-5 text-indigo-600" />
              </div>
            </Card>

            {/* Next Steps */}
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-5 h-5 text-indigo-600" />
                <h3 className="font-semibold text-slate-800">Próximos Passos</h3>
              </div>
              <div className="space-y-2">
                {suggestions.next_steps.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 text-sm font-semibold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <p className="text-sm text-slate-700 flex-1">{step}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Message Templates */}
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-slate-800">Mensagens Prontas</h3>
              </div>
              <div className="space-y-3">
                {suggestions.message_templates.map((msg, idx) => (
                  <div key={idx} className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-slate-700 mb-3">{msg}</p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(msg)}
                        className="flex-1"
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        Copiar
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => sendWhatsApp(msg)}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <Send className="w-3 h-3 mr-1" />
                        WhatsApp
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Content Suggestions */}
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-slate-800">Conteúdo para Compartilhar</h3>
              </div>
              <div className="space-y-3">
                {suggestions.content_suggestions.map((content, idx) => {
                  const Icon = contentTypeIcons[content.type] || FileText;
                  return (
                    <div key={idx} className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-slate-800 text-sm">{content.title}</p>
                            <Badge variant="outline" className="text-xs">
                              {contentTypeLabels[content.type] || content.type}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-600">{content.description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Regenerate */}
            <Button
              onClick={generateFollowUpPlan}
              disabled={generating}
              variant="outline"
              className="w-full"
            >
              {generating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              Gerar Novas Sugestões
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
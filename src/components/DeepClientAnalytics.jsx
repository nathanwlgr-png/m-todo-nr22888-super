import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, TrendingUp, Users, Target } from 'lucide-react';
import { toast } from 'sonner';

export default function DeepClientAnalytics() {
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const queryClient = useQueryClient();

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const data = await base44.entities.Client.list('-updated_date', 50);
      return data.filter(c => c && c.id && c.first_name);
    }
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['sales'],
    queryFn: () => base44.entities.Sale.list()
  });

  const { data: interactions = [] } = useQuery({
    queryKey: ['interactions'],
    queryFn: () => base44.entities.Interaction.list()
  });

  const analyzeClient = async (client) => {
    setAnalyzing(true);
    setSelectedClient(client);
    
    try {
      const clientSales = sales.filter(s => s.client_id === client.id);
      const clientInteractions = interactions.filter(i => i.client_id === client.id);

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Analise este cliente em profundidade para criar um perfil de marketing completo:

CLIENTE: ${client.full_name || client.first_name}
Tipo: ${client.client_type || 'Não especificado'}
Status: ${client.status}
Score: ${client.purchase_score || 0}%
Volume Mensal: ${client.current_volume || 'Não especificado'}
Cidade: ${client.city}
Equipamento Atual: ${client.current_equipment || 'Nenhum'}

HISTÓRICO DE VENDAS (${clientSales.length} vendas):
${clientSales.map(s => `- ${s.equipment_name}: R$ ${s.sale_value} (${s.status})`).join('\n') || 'Sem vendas'}

HISTÓRICO DE INTERAÇÕES (${clientInteractions.length} interações):
${clientInteractions.slice(0, 10).map(i => `- ${i.type}: ${i.subject} (${i.outcome})`).join('\n') || 'Sem interações'}

ANÁLISE REQUERIDA:

1. SEGMENTAÇÃO COMPORTAMENTAL:
   - Padrão de compra (frequência, ticket médio)
   - Nível de engajamento
   - Preferência de canal de comunicação
   - Ciclo de decisão (rápido/lento)

2. POTENCIAL DE UPSELL/CROSS-SELL:
   - Produtos/equipamentos recomendados
   - Probabilidade de compra (0-100%)
   - Momento ideal para abordagem
   - Valor estimado da oportunidade

3. PREFERÊNCIAS DE COMUNICAÇÃO:
   - Melhor canal (email, WhatsApp, telefone, presencial)
   - Horário preferido
   - Frequência de contato
   - Tom de voz (formal, casual, técnico)

4. PERFIL DE MARKETING:
   - Persona principal
   - Motivadores de compra
   - Gatilhos emocionais
   - Mensagens-chave que funcionam

5. PRÓXIMAS AÇÕES SUGERIDAS:
   - 3 ações prioritárias
   - Conteúdo para enviar
   - Oferta personalizada`,
        response_json_schema: {
          type: "object",
          properties: {
            segmentacao: {
              type: "object",
              properties: {
                padrao_compra: { type: "string" },
                nivel_engajamento: { type: "string", enum: ["alto", "medio", "baixo"] },
                canal_preferido: { type: "string" },
                ciclo_decisao: { type: "string", enum: ["rapido", "medio", "lento"] }
              }
            },
            upsell_crosssell: {
              type: "object",
              properties: {
                produtos_recomendados: { type: "array", items: { type: "string" } },
                probabilidade: { type: "number" },
                momento_ideal: { type: "string" },
                valor_estimado: { type: "number" }
              }
            },
            preferencias_comunicacao: {
              type: "object",
              properties: {
                canal: { type: "string" },
                horario: { type: "string" },
                frequencia: { type: "string" },
                tom: { type: "string" }
              }
            },
            perfil_marketing: {
              type: "object",
              properties: {
                persona: { type: "string" },
                motivadores: { type: "array", items: { type: "string" } },
                gatilhos: { type: "array", items: { type: "string" } },
                mensagens_chave: { type: "array", items: { type: "string" } }
              }
            },
            proximas_acoes: { type: "array", items: { type: "string" } }
          }
        }
      });

      setAnalysis(response);

      // Atualizar cliente no CRM com insights
      await base44.entities.Client.update(client.id, {
        recommended_communication: response.preferencias_comunicacao?.canal,
        client_tone: response.preferencias_comunicacao?.tom,
        purchase_motivators: response.perfil_marketing?.motivadores || [],
        triggers_used: response.perfil_marketing?.gatilhos || [],
        next_action: response.proximas_acoes?.[0] || ''
      });

      queryClient.invalidateQueries(['clients']);
      toast.success('Análise completa gerada!');

    } catch (error) {
      console.error(error);
      toast.error('Erro ao analisar cliente');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <Card className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-300">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-slate-800">Análise Profunda com IA</h3>
          <p className="text-xs text-slate-600">Perfil de marketing + upsell/cross-sell</p>
        </div>
      </div>

      {!selectedClient ? (
        <div className="space-y-2">
          <p className="text-sm text-slate-700 mb-3">Selecione um cliente:</p>
          <div className="max-h-60 overflow-y-auto space-y-2">
            {clients.slice(0, 20).map(client => (
              <button
                key={client.id}
                onClick={() => analyzeClient(client)}
                className="w-full p-3 bg-white rounded-lg border border-indigo-200 hover:bg-indigo-50 text-left transition-all"
              >
                <p className="font-semibold text-sm">{client.full_name || client.first_name}</p>
                <p className="text-xs text-slate-600">{client.city} • {client.status}</p>
              </button>
            ))}
          </div>
        </div>
      ) : analyzing ? (
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-3" />
          <p className="text-sm text-slate-700">Analisando {selectedClient.first_name}...</p>
        </div>
      ) : analysis ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between mb-2">
            <p className="font-bold text-slate-800">{selectedClient.first_name}</p>
            <Button size="sm" variant="ghost" onClick={() => { setSelectedClient(null); setAnalysis(null); }}>
              ← Voltar
            </Button>
          </div>

          {/* Segmentação */}
          <div className="p-3 bg-white rounded-lg border border-indigo-200">
            <p className="text-xs font-semibold text-indigo-800 mb-2">📊 Segmentação</p>
            <div className="space-y-1 text-xs">
              <p><strong>Padrão:</strong> {analysis.segmentacao?.padrao_compra}</p>
              <p><strong>Engajamento:</strong> <Badge className={
                analysis.segmentacao?.nivel_engajamento === 'alto' ? 'bg-green-600' :
                analysis.segmentacao?.nivel_engajamento === 'medio' ? 'bg-yellow-600' : 'bg-red-600'
              }>{analysis.segmentacao?.nivel_engajamento}</Badge></p>
              <p><strong>Ciclo:</strong> {analysis.segmentacao?.ciclo_decisao}</p>
            </div>
          </div>

          {/* Upsell/Cross-sell */}
          <div className="p-3 bg-white rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <p className="text-xs font-semibold text-green-800">Oportunidades</p>
            </div>
            <div className="space-y-1 text-xs">
              <p><strong>Probabilidade:</strong> {analysis.upsell_crosssell?.probabilidade}%</p>
              <p><strong>Valor Est.:</strong> R$ {analysis.upsell_crosssell?.valor_estimado?.toLocaleString('pt-BR')}</p>
              <p><strong>Momento:</strong> {analysis.upsell_crosssell?.momento_ideal}</p>
              <div className="mt-2">
                <p className="font-semibold mb-1">Produtos:</p>
                {analysis.upsell_crosssell?.produtos_recomendados?.map((p, i) => (
                  <Badge key={i} variant="outline" className="mr-1 mb-1">{p}</Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Preferências */}
          <div className="p-3 bg-white rounded-lg border border-blue-200">
            <p className="text-xs font-semibold text-blue-800 mb-2">💬 Comunicação</p>
            <div className="space-y-1 text-xs">
              <p><strong>Canal:</strong> {analysis.preferencias_comunicacao?.canal}</p>
              <p><strong>Horário:</strong> {analysis.preferencias_comunicacao?.horario}</p>
              <p><strong>Tom:</strong> {analysis.preferencias_comunicacao?.tom}</p>
            </div>
          </div>

          {/* Perfil Marketing */}
          <div className="p-3 bg-white rounded-lg border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-purple-600" />
              <p className="text-xs font-semibold text-purple-800">Perfil Marketing</p>
            </div>
            <div className="space-y-2 text-xs">
              <p><strong>Persona:</strong> {analysis.perfil_marketing?.persona}</p>
              <div>
                <p className="font-semibold mb-1">Motivadores:</p>
                <div className="flex flex-wrap gap-1">
                  {analysis.perfil_marketing?.motivadores?.map((m, i) => (
                    <Badge key={i} className="bg-purple-100 text-purple-700">{m}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="font-semibold mb-1">Mensagens-chave:</p>
                {analysis.perfil_marketing?.mensagens_chave?.map((msg, i) => (
                  <p key={i} className="text-xs text-slate-600 italic">• {msg}</p>
                ))}
              </div>
            </div>
          </div>

          {/* Próximas Ações */}
          <div className="p-3 bg-green-50 rounded-lg border-2 border-green-300">
            <p className="text-xs font-semibold text-green-800 mb-2">✅ Próximas Ações</p>
            <ol className="space-y-1 text-xs list-decimal list-inside">
              {analysis.proximas_acoes?.map((acao, i) => (
                <li key={i}>{acao}</li>
              ))}
            </ol>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
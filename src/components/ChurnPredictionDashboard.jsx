import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  AlertTriangle,
  TrendingDown,
  Shield,
  Target,
  Zap,
  Clock,
  DollarSign,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Loader2,
  Phone,
  Mail
} from 'lucide-react';
import { toast } from 'sonner';

export default function ChurnPredictionDashboard() {
  const [analyzing, setAnalyzing] = useState(false);
  const [churnAnalysis, setChurnAnalysis] = useState(null);

  const { data: clients = [] } = useQuery({
    queryKey: ['clients-churn'],
    queryFn: () => base44.entities.Client.list('-updated_date', 200)
  });

  const { data: interactions = [] } = useQuery({
    queryKey: ['interactions-churn'],
    queryFn: () => base44.entities.Interaction.list('-created_date', 500)
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['sales-churn'],
    queryFn: () => base44.entities.Sale.list('-sale_date', 200)
  });

  const analyzeChurnRisk = async () => {
    setAnalyzing(true);
    try {
      // Preparar dados para análise
      const clientsWithMetrics = clients.map(client => {
        const clientInteractions = interactions.filter(i => i.client_id === client.id);
        const clientSales = sales.filter(s => s.client_id === client.id);
        
        const lastInteraction = clientInteractions[0]?.created_date;
        const daysSinceLastContact = lastInteraction 
          ? Math.floor((Date.now() - new Date(lastInteraction).getTime()) / (1000 * 60 * 60 * 24))
          : 999;
        
        const lastSale = clientSales[0]?.sale_date;
        const daysSinceLastSale = lastSale
          ? Math.floor((Date.now() - new Date(lastSale).getTime()) / (1000 * 60 * 60 * 24))
          : 999;

        return {
          id: client.id,
          name: client.first_name,
          clinic: client.clinic_name,
          status: client.status,
          score: client.purchase_score || 50,
          pipeline: client.pipeline_stage,
          interactions_count: clientInteractions.length,
          sales_count: clientSales.length,
          days_since_contact: daysSinceLastContact,
          days_since_sale: daysSinceLastSale,
          engagement_score: client.engagement_score || 0,
          ai_segment: client.ai_segment,
          last_contact_date: client.last_contact_date,
          next_contact_date: client.next_contact_date
        };
      });

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `ANÁLISE PREDITIVA DE CHURN - PRIMORI

═══════════════════════════════════════
📊 BASE DE CLIENTES
═══════════════════════════════════════
Total: ${clientsWithMetrics.length} clientes
Dados disponíveis: ${clientsWithMetrics.slice(0, 20).map(c => `
- ${c.name} (${c.clinic}):
  Score: ${c.score}%, Status: ${c.status}
  Interações: ${c.interactions_count}, Vendas: ${c.sales_count}
  Dias sem contato: ${c.days_since_contact}
  Dias desde última venda: ${c.days_since_sale}
  Pipeline: ${c.pipeline}, Segmento: ${c.ai_segment || 'N/A'}
`).join('\n')}

═══════════════════════════════════════
🎯 ANÁLISE SOLICITADA
═══════════════════════════════════════

Para CADA cliente analisado, calcule:

1. **CHURN RISK SCORE** (0-100):
   Fatores críticos:
   - Tempo sem contato (>30 dias = alto risco)
   - Tempo sem venda (>90 dias = muito alto)
   - Score baixo (<40 = risco)
   - Status frio = alto risco
   - Poucas interações = risco
   - Pipeline estagnado = risco

2. **CATEGORIA DE RISCO**:
   - CRÍTICO (80-100): Perda iminente
   - ALTO (60-79): Atenção urgente
   - MÉDIO (40-59): Monitorar
   - BAIXO (0-39): Estável

3. **SINAIS DE ALERTA**:
   Liste 2-3 sinais específicos que indicam risco

4. **PROBABILIDADE CHURN**:
   Porcentagem (0-100%) de chance de perder o cliente em 60 dias

5. **VALOR EM RISCO**:
   Estimativa de receita potencial a perder (LTV estimado)

6. **RECOMENDAÇÕES DE RETENÇÃO** (3-4 ações):
   Ações ESPECÍFICAS, PRÁTICAS e IMEDIATAS para reverter

7. **URGÊNCIA**:
   Prazo para agir (Imediato/7 dias/15 dias/30 dias)

8. **CANAL RECOMENDADO**:
   Melhor canal para reconquistar (telefone/whatsapp/visita/email)

Analise os top 15 clientes em maior risco. Seja ULTRA-ESPECÍFICO.`,
        response_json_schema: {
          type: "object",
          properties: {
            clientes_risco: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  client_id: { type: "string" },
                  client_name: { type: "string" },
                  clinic_name: { type: "string" },
                  churn_risk_score: { type: "number" },
                  risk_category: { type: "string" },
                  churn_probability: { type: "number" },
                  valor_em_risco: { type: "number" },
                  sinais_alerta: { type: "array", items: { type: "string" } },
                  recomendacoes: { type: "array", items: { type: "string" } },
                  urgencia: { type: "string" },
                  canal_recomendado: { type: "string" },
                  dias_para_acao: { type: "number" }
                }
              }
            },
            resumo_geral: {
              type: "object",
              properties: {
                total_em_risco_critico: { type: "number" },
                total_em_risco_alto: { type: "number" },
                receita_total_em_risco: { type: "number" },
                principais_causas_churn: { type: "array", items: { type: "string" } },
                taxa_churn_prevista: { type: "number" }
              }
            },
            acoes_priorizadas: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  cliente: { type: "string" },
                  acao: { type: "string" },
                  impacto: { type: "string" },
                  prioridade: { type: "number" }
                }
              }
            }
          }
        }
      });

      setChurnAnalysis(result);
      toast.success('Análise de churn concluída!');
    } catch (error) {
      toast.error('Erro ao analisar churn');
      console.error(error);
    } finally {
      setAnalyzing(false);
    }
  };

  const getRiskColor = (category) => {
    switch(category?.toUpperCase()) {
      case 'CRÍTICO': return 'bg-red-600 text-white';
      case 'ALTO': return 'bg-orange-500 text-white';
      case 'MÉDIO': return 'bg-yellow-500 text-white';
      default: return 'bg-green-500 text-white';
    }
  };

  const getChannelIcon = (channel) => {
    switch(channel?.toLowerCase()) {
      case 'telefone': return Phone;
      case 'whatsapp': return MessageSquare;
      case 'email': return Mail;
      default: return Target;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="p-4 bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-300">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-orange-600 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-slate-800">Análise Preditiva de Churn</h3>
            <p className="text-xs text-red-700">IA identifica risco de perda e sugere retenção</p>
          </div>
        </div>

        <Button
          onClick={analyzeChurnRisk}
          disabled={analyzing || clients.length === 0}
          className="w-full bg-red-600 hover:bg-red-700"
        >
          {analyzing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Analisando {clients.length} clientes...
            </>
          ) : (
            <>
              <AlertTriangle className="w-4 h-4 mr-2" />
              Analisar Risco de Churn
            </>
          )}
        </Button>
      </Card>

      {churnAnalysis && (
        <>
          {/* Resumo Geral */}
          <Card className="p-4 bg-gradient-to-r from-slate-50 to-gray-50 border-2 border-slate-300">
            <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-red-600" />
              Resumo de Risco
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-red-100 rounded-lg border-2 border-red-300">
                <p className="text-xs text-red-700 mb-1">Risco CRÍTICO</p>
                <p className="text-2xl font-bold text-red-800">
                  {churnAnalysis.resumo_geral?.total_em_risco_critico || 0}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg border-2 border-orange-300">
                <p className="text-xs text-orange-700 mb-1">Risco ALTO</p>
                <p className="text-2xl font-bold text-orange-800">
                  {churnAnalysis.resumo_geral?.total_em_risco_alto || 0}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg border-2 border-yellow-300">
                <p className="text-xs text-yellow-700 mb-1">Taxa Churn Prevista</p>
                <p className="text-2xl font-bold text-yellow-800">
                  {churnAnalysis.resumo_geral?.taxa_churn_prevista || 0}%
                </p>
              </div>
              <div className="p-3 bg-slate-100 rounded-lg border-2 border-slate-300">
                <p className="text-xs text-slate-700 mb-1">Receita em Risco</p>
                <p className="text-xl font-bold text-slate-800">
                  R$ {(churnAnalysis.resumo_geral?.receita_total_em_risco || 0).toLocaleString('pt-BR')}
                </p>
              </div>
            </div>

            {/* Principais Causas */}
            <div className="mt-3 p-3 bg-white rounded-lg border border-slate-200">
              <p className="text-xs font-semibold text-slate-700 mb-2">🔍 Principais Causas de Churn:</p>
              <div className="space-y-1">
                {churnAnalysis.resumo_geral?.principais_causas_churn?.map((causa, i) => (
                  <div key={i} className="text-xs text-slate-600 flex items-start gap-1">
                    <span className="text-red-600">•</span>
                    <span>{causa}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Ações Priorizadas */}
          <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300">
            <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Ações Prioritárias AGORA
            </h4>
            <div className="space-y-2">
              {churnAnalysis.acoes_priorizadas?.slice(0, 5).map((acao, i) => (
                <div key={i} className="p-3 bg-white rounded-lg border border-blue-200">
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
                      {acao.prioridade}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-blue-800 mb-1">{acao.cliente}</p>
                      <p className="text-xs text-slate-700 mb-1">{acao.acao}</p>
                      <Badge className="text-xs bg-blue-100 text-blue-700">
                        {acao.impacto}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Clientes em Risco */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-800 text-lg">🚨 Clientes em Risco</h4>
            {churnAnalysis.clientes_risco?.map((cliente, i) => (
              <Card key={i} className={`p-4 border-2 ${
                cliente.risk_category === 'CRÍTICO' ? 'bg-red-50 border-red-400' :
                cliente.risk_category === 'ALTO' ? 'bg-orange-50 border-orange-400' :
                'bg-yellow-50 border-yellow-400'
              }`}>
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h5 className="font-bold text-slate-800">{cliente.client_name}</h5>
                    <p className="text-xs text-slate-600">{cliente.clinic_name}</p>
                  </div>
                  <Badge className={getRiskColor(cliente.risk_category)}>
                    {cliente.risk_category}
                  </Badge>
                </div>

                {/* Métricas */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="p-2 bg-white rounded border border-slate-200">
                    <p className="text-xs text-slate-600">Risco Churn</p>
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-bold text-red-600">{cliente.churn_risk_score}</p>
                      <Progress value={cliente.churn_risk_score} className="h-1 flex-1" />
                    </div>
                  </div>
                  <div className="p-2 bg-white rounded border border-slate-200">
                    <p className="text-xs text-slate-600">Prob. Churn</p>
                    <p className="text-lg font-bold text-orange-600">{cliente.churn_probability}%</p>
                  </div>
                  <div className="p-2 bg-white rounded border border-slate-200">
                    <p className="text-xs text-slate-600">Valor Risco</p>
                    <p className="text-sm font-bold text-slate-700">
                      R$ {(cliente.valor_em_risco || 0).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>

                {/* Sinais de Alerta */}
                <div className="mb-3 p-2 bg-white rounded border border-red-200">
                  <p className="text-xs font-semibold text-red-700 mb-1">⚠️ Sinais de Alerta:</p>
                  <div className="space-y-1">
                    {cliente.sinais_alerta?.map((sinal, j) => (
                      <div key={j} className="text-xs text-slate-700 flex items-start gap-1">
                        <XCircle className="w-3 h-3 text-red-500 flex-shrink-0 mt-0.5" />
                        <span>{sinal}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recomendações */}
                <div className="mb-3 p-2 bg-white rounded border border-green-200">
                  <p className="text-xs font-semibold text-green-700 mb-1">💡 Ações de Retenção:</p>
                  <div className="space-y-1">
                    {cliente.recomendacoes?.map((rec, j) => (
                      <div key={j} className="text-xs text-slate-700 flex items-start gap-1">
                        <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0 mt-0.5" />
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-orange-600" />
                      <span className="text-xs font-semibold text-orange-700">
                        {cliente.urgencia}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {React.createElement(getChannelIcon(cliente.canal_recomendado), {
                        className: "w-4 h-4 text-blue-600"
                      })}
                      <span className="text-xs text-slate-600">
                        {cliente.canal_recomendado}
                      </span>
                    </div>
                  </div>
                  <Badge className="bg-orange-100 text-orange-700 text-xs">
                    Agir em {cliente.dias_para_acao} dias
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
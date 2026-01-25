import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, TrendingUp, Target, Brain } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Primori - Análise Preditiva Avançada
 * Combina todos os frameworks para prever comportamento e sugerir ações
 */
export default function PrimoriAdvancedAnalytics({ client, visits, interactions, sales }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [prediction, setPrediction] = useState(null);

  const runPredictiveAnalysis = async () => {
    if (!client) return;
    
    setAnalyzing(true);
    try {
      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `PRIMORI - ANÁLISE PREDITIVA INTEGRATIVA

═══════════════════════════════════════
📊 DADOS DO CLIENTE
═══════════════════════════════════════
Nome: ${client.first_name}
Numerologia: ${client.numerology_number} - ${client.behavioral_profile}
Caminho de Vida: ${client.life_path_number || 'N/A'}
Estilo de Decisão: ${client.decision_style}
Tom de Voz: ${client.client_tone || 'Não observado'}

Perfil Comercial:
- Tipo: ${client.client_type}
- Decisor: ${client.decision_role}
- Status: ${client.status}
- Score: ${client.purchase_score}%
- Orçamento: R$ ${client.available_budget || 0}

Histórico:
- Visitas: ${visits?.length || 0}
- Interações: ${interactions?.length || 0}
- Vendas: ${sales?.length || 0}
- Última visita: ${client.last_visit_date || 'Nunca'}
- Dores: ${client.main_pains?.join(', ') || 'Não identificadas'}
- Objeções: ${client.real_objections?.join(', ') || 'Nenhuma'}

═══════════════════════════════════════
🎯 ANÁLISE PREDITIVA MULTI-FRAMEWORK
═══════════════════════════════════════

Combine TODOS os frameworks (Numerologia, SPIN, Cialdini, I.E., Arte da Guerra, Neurovendas) para fornecer:

**1. PREVISÃO DE COMPORTAMENTO (próximos 30 dias)**
- Probabilidade de fechamento: [0-100]%
- Probabilidade de resposta positiva: [0-100]%
- Probabilidade de ghosting: [0-100]%
- Ciclo de venda estimado: [dias]

**2. ESTRATÉGIA INTEGRATIVA**
Framework primário: [qual usar?]
Frameworks complementares: [quais?]
Sequência de ações (passo-a-passo):
1. [Ação + Framework + Timing]
2. [Ação + Framework + Timing]
3. [Ação + Framework + Timing]

**3. GATILHOS PRIORITÁRIOS**
Emocional: [qual explorar primeiro?]
Racional: [dados/ROI a apresentar]
Social: [prova social específica]
Temporal: [urgência/escassez]

**4. ANÁLISE DE RISCO PROFUNDA**
Risco de perda: [baixo/médio/alto]
Fatores de risco detalhados:
- [Fator 1]: Impacto [%] - Ação mitigadora específica
- [Fator 2]: Impacto [%] - Ação mitigadora específica
- [Fator 3]: Impacto [%] - Ação mitigadora específica
Plano de mitigação 7 dias:
Dia 1-2: [ação específica]
Dia 3-4: [ação específica]
Dia 5-7: [ação específica]

**5. SCORE DE LEALDADE PREDITIVO**
Score atual: [0-100]
Baseado em: ${visits?.length || 0} visitas, ${interactions?.length || 0} interações, padrão de resposta
Tendência: [crescente/estável/decrescente]
Probabilidade de recompra 6 meses: [%]
Lifetime Value estimado: R$ [valor]
Ações para aumentar lealdade:
- [Ação 1 específica para este perfil numerológico]
- [Ação 2 com timing]
- [Ação 3 com métrica]

**6. NUTRIÇÃO DE LEADS PERSONALIZADA**
Baseado em perfil ${client.numerology_number} e score ${client.purchase_score}%:

Sequência de nutrição (próximos 30 dias):
Semana 1: [Conteúdo específico + canal + horário ideal]
Semana 2: [Conteúdo específico + canal + horário ideal]
Semana 3: [Conteúdo específico + canal + horário ideal]
Semana 4: [Conteúdo específico + canal + horário ideal]

Conteúdos prioritários para este perfil:
- [Tipo de conteúdo 1]: Por que funciona para perfil ${client.numerology_number}
- [Tipo de conteúdo 2]: Melhor formato (vídeo/texto/infográfico)
- [Tipo de conteúdo 3]: Call-to-action ideal

Temperatura do lead: [frio/morno/quente]
Próximo marco de aquecimento: [ação que muda temperatura]

**7. MENSAGEM ESTRATÉGICA**
Escreva UMA mensagem pronta para enviar AGORA que maximize probabilidade de resposta positiva.
Tom adaptado ao perfil ${client.numerology_number}.
Inclua call-to-action específico.

**8. PRÓXIMA MELHOR AÇÃO**
O que fazer: [ação específica]
Quando fazer: [data/horário ideal]
Como fazer: [canal + abordagem]
Resultado esperado: [métrica]
Probabilidade sucesso: [%]`,
        response_json_schema: {
          type: "object",
          properties: {
            probabilidade_fechamento_30d: { type: "number" },
            probabilidade_resposta: { type: "number" },
            probabilidade_ghosting: { type: "number" },
            ciclo_venda_dias: { type: "number" },
            framework_primario: { type: "string" },
            frameworks_complementares: { type: "array", items: { type: "string" } },
            sequencia_acoes: { 
              type: "array", 
              items: { 
                type: "object",
                properties: {
                  acao: { type: "string" },
                  framework: { type: "string" },
                  timing: { type: "string" }
                }
              }
            },
            gatilhos: {
              type: "object",
              properties: {
                emocional: { type: "string" },
                racional: { type: "string" },
                social: { type: "string" },
                temporal: { type: "string" }
              }
            },
            risco_perda: { type: "string" },
            fatores_risco: { 
              type: "array", 
              items: { 
                type: "object",
                properties: {
                  fator: { type: "string" },
                  impacto_percentual: { type: "number" },
                  acao_mitigadora: { type: "string" }
                }
              }
            },
            plano_mitigacao_7dias: {
              type: "object",
              properties: {
                dia_1_2: { type: "string" },
                dia_3_4: { type: "string" },
                dia_5_7: { type: "string" }
              }
            },
            score_lealdade: { type: "number" },
            tendencia_lealdade: { type: "string" },
            probabilidade_recompra_6m: { type: "number" },
            lifetime_value_estimado: { type: "number" },
            acoes_aumentar_lealdade: { type: "array", items: { type: "string" } },
            nutricao_leads: {
              type: "object",
              properties: {
                temperatura_lead: { type: "string" },
                sequencia_30_dias: {
                  type: "object",
                  properties: {
                    semana_1: { type: "string" },
                    semana_2: { type: "string" },
                    semana_3: { type: "string" },
                    semana_4: { type: "string" }
                  }
                },
                conteudos_prioritarios: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      tipo: { type: "string" },
                      razao: { type: "string" }
                    }
                  }
                },
                proximo_marco: { type: "string" }
              }
            },
            mensagem_estrategica: { type: "string" },
            proxima_acao: {
              type: "object",
              properties: {
                o_que: { type: "string" },
                quando: { type: "string" },
                como: { type: "string" },
                resultado_esperado: { type: "string" },
                probabilidade_sucesso: { type: "number" }
              }
            }
          }
        }
      });

      setPrediction(analysis);
      
      // Salvar insights no cliente
      await base44.entities.Client.update(client.id, {
        ai_sales_intelligence: {
          conversion_probability: analysis.probabilidade_fechamento_30d,
          best_approach: analysis.framework_primario,
          optimal_contact_time: analysis.proxima_acao.quando,
          key_triggers: Object.values(analysis.gatilhos),
          predicted_objections: analysis.fatores_risco.map(f => f.fator),
          recommended_content: [analysis.mensagem_estrategica],
          last_ai_analysis: new Date().toISOString(),
          ltv_12_months: analysis.lifetime_value_estimado,
          product_adoption_rate: analysis.score_lealdade
        }
      });

      toast.success('Análise Primori concluída!');
    } catch (error) {
      console.error(error);
      toast.error('Erro na análise');
    } finally {
      setAnalyzing(false);
    }
  };

  const riskColors = {
    baixo: 'text-green-600',
    médio: 'text-yellow-600',
    medio: 'text-yellow-600',
    alto: 'text-red-600'
  };

  return (
    <Card className="p-5 bg-gradient-to-br from-purple-50 via-pink-50 to-fuchsia-50 border-2 border-purple-300">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
          <Brain className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            Primori - Análise Preditiva
          </h3>
          <p className="text-xs text-purple-700">7 Frameworks Integrados</p>
        </div>
      </div>

      <Button
        onClick={runPredictiveAnalysis}
        disabled={analyzing}
        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 mb-4"
      >
        {analyzing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Analisando...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 mr-2" />
            Executar Análise Primori
          </>
        )}
      </Button>

      {prediction && (
        <div className="space-y-3">
          {/* Probabilidades */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2 bg-white rounded-lg border">
              <p className="text-xs text-slate-600">Fechamento</p>
              <p className="text-lg font-bold text-purple-700">{prediction.probabilidade_fechamento_30d}%</p>
            </div>
            <div className="p-2 bg-white rounded-lg border">
              <p className="text-xs text-slate-600">Resposta</p>
              <p className="text-lg font-bold text-green-700">{prediction.probabilidade_resposta}%</p>
            </div>
            <div className="p-2 bg-white rounded-lg border">
              <p className="text-xs text-slate-600">Ciclo</p>
              <p className="text-lg font-bold text-blue-700">{prediction.ciclo_venda_dias}d</p>
            </div>
          </div>

          {/* Framework Principal */}
          <div className="p-3 bg-white rounded-lg border-2 border-purple-200">
            <p className="text-xs font-semibold text-purple-700 mb-1">Framework Primário</p>
            <p className="font-bold text-slate-800">{prediction.framework_primario}</p>
            <div className="flex flex-wrap gap-1 mt-2">
              {prediction.frameworks_complementares.map((f, i) => (
                <Badge key={i} variant="outline" className="text-xs">{f}</Badge>
              ))}
            </div>
          </div>

          {/* Sequência de Ações */}
          <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <p className="text-xs font-semibold text-blue-700 mb-2">📋 Sequência Estratégica</p>
            <div className="space-y-2">
              {prediction.sequencia_acoes.map((acao, i) => (
                <div key={i} className="p-2 bg-white rounded border border-blue-200">
                  <div className="flex items-start gap-2">
                    <span className="text-sm font-bold text-blue-600">{i + 1}.</span>
                    <div className="flex-1">
                      <p className="text-sm text-slate-800">{acao.acao}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className="bg-purple-100 text-purple-700 text-xs">{acao.framework}</Badge>
                        <span className="text-xs text-slate-600">{acao.timing}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Gatilhos */}
          <div className="p-3 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-200">
            <p className="text-xs font-semibold text-orange-700 mb-2">🎯 Gatilhos Prioritários</p>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-pink-600 font-semibold">💖</span>
                <div>
                  <span className="text-xs text-slate-500">Emocional:</span>
                  <p className="text-slate-800">{prediction.gatilhos.emocional}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-600 font-semibold">📊</span>
                <div>
                  <span className="text-xs text-slate-500">Racional:</span>
                  <p className="text-slate-800">{prediction.gatilhos.racional}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Análise de Risco Profunda */}
          <div className="p-3 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-red-700">⚠️ Análise de Risco Profunda</p>
              <Badge className={`${riskColors[prediction.risco_perda.toLowerCase()]} bg-white`}>
                {prediction.risco_perda}
              </Badge>
            </div>
            <div className="space-y-2">
              {prediction.fatores_risco.map((fator, i) => (
                <div key={i} className="p-2 bg-white rounded border border-red-200">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-800">{fator.fator}</span>
                    <Badge variant="outline" className="text-red-600">
                      {fator.impacto_percentual}%
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600">
                    ✓ {fator.acao_mitigadora}
                  </p>
                </div>
              ))}
            </div>
            {prediction.plano_mitigacao_7dias && (
              <div className="mt-3 p-2 bg-green-50 rounded border border-green-200">
                <p className="text-xs font-semibold text-green-700 mb-2">📅 Plano 7 Dias</p>
                <div className="space-y-1 text-xs text-slate-700">
                  <p><strong>Dia 1-2:</strong> {prediction.plano_mitigacao_7dias.dia_1_2}</p>
                  <p><strong>Dia 3-4:</strong> {prediction.plano_mitigacao_7dias.dia_3_4}</p>
                  <p><strong>Dia 5-7:</strong> {prediction.plano_mitigacao_7dias.dia_5_7}</p>
                </div>
              </div>
            )}
          </div>

          {/* Score de Lealdade */}
          <div className="p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
            <p className="text-xs font-semibold text-indigo-700 mb-2">💎 Score de Lealdade Preditivo</p>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="text-3xl font-bold text-indigo-700">
                  {prediction.score_lealdade}
                </div>
                <div className="text-xs text-slate-600">
                  <div>Tendência: {prediction.tendencia_lealdade}</div>
                  <div>Recompra 6m: {prediction.probabilidade_recompra_6m}%</div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">LTV Estimado</p>
                <p className="text-lg font-bold text-green-600">
                  R$ {prediction.lifetime_value_estimado?.toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
            <div className="space-y-1 mt-2">
              <p className="text-xs font-semibold text-indigo-600">Ações para ↑ Lealdade:</p>
              {prediction.acoes_aumentar_lealdade.map((acao, i) => (
                <div key={i} className="p-2 bg-white rounded text-xs text-slate-700">
                  {i + 1}. {acao}
                </div>
              ))}
            </div>
          </div>

          {/* Nutrição de Leads */}
          <div className="p-3 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg border border-teal-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-teal-700">🌱 Nutrição de Leads</p>
              <Badge className={
                prediction.nutricao_leads.temperatura_lead === 'quente' ? 'bg-red-100 text-red-700' :
                prediction.nutricao_leads.temperatura_lead === 'morno' ? 'bg-yellow-100 text-yellow-700' :
                'bg-blue-100 text-blue-700'
              }>
                {prediction.nutricao_leads.temperatura_lead}
              </Badge>
            </div>
            
            <div className="space-y-2 mb-3">
              <p className="text-xs font-semibold text-teal-600">📅 Sequência 30 Dias:</p>
              <div className="space-y-1 text-xs">
                <div className="p-2 bg-white rounded border border-teal-200">
                  <strong>Semana 1:</strong> {prediction.nutricao_leads.sequencia_30_dias.semana_1}
                </div>
                <div className="p-2 bg-white rounded border border-teal-200">
                  <strong>Semana 2:</strong> {prediction.nutricao_leads.sequencia_30_dias.semana_2}
                </div>
                <div className="p-2 bg-white rounded border border-teal-200">
                  <strong>Semana 3:</strong> {prediction.nutricao_leads.sequencia_30_dias.semana_3}
                </div>
                <div className="p-2 bg-white rounded border border-teal-200">
                  <strong>Semana 4:</strong> {prediction.nutricao_leads.sequencia_30_dias.semana_4}
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-semibold text-teal-600">📚 Conteúdos Prioritários:</p>
              {prediction.nutricao_leads.conteudos_prioritarios.map((conteudo, i) => (
                <div key={i} className="p-2 bg-white rounded text-xs">
                  <p className="font-medium text-slate-800">{conteudo.tipo}</p>
                  <p className="text-slate-600">{conteudo.razao}</p>
                </div>
              ))}
            </div>

            <div className="mt-2 p-2 bg-teal-100 rounded border border-teal-300">
              <p className="text-xs text-teal-800">
                <strong>🎯 Próximo Marco:</strong> {prediction.nutricao_leads.proximo_marco}
              </p>
            </div>
          </div>

          {/* Mensagem Estratégica */}
          <div className="p-4 bg-white rounded-lg border-2 border-purple-300">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-purple-700">💬 Mensagem Pronta</p>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  navigator.clipboard.writeText(prediction.mensagem_estrategica);
                  toast.success('Copiado!');
                }}
              >
                Copiar
              </Button>
            </div>
            <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line">
              {prediction.mensagem_estrategica}
            </p>
          </div>

          {/* Próxima Ação */}
          <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-300">
            <p className="text-xs font-semibold text-green-700 mb-3">🚀 Próxima Melhor Ação</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-green-600" />
                <p className="text-sm font-semibold text-slate-800">{prediction.proxima_acao.o_que}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-white rounded">
                  <p className="text-slate-500">Quando</p>
                  <p className="text-slate-800 font-medium">{prediction.proxima_acao.quando}</p>
                </div>
                <div className="p-2 bg-white rounded">
                  <p className="text-slate-500">Como</p>
                  <p className="text-slate-800 font-medium">{prediction.proxima_acao.como}</p>
                </div>
              </div>
              <div className="p-2 bg-green-100 rounded border border-green-300">
                <p className="text-xs text-green-700">
                  <strong>Meta:</strong> {prediction.proxima_acao.resultado_esperado}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  Sucesso estimado: {prediction.proxima_acao.probabilidade_sucesso}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
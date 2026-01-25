import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp,
  Bell,
  Loader2,
  AlertCircle,
  Target,
  Sparkles,
  Mail,
  Eye,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';

export default function MarketTrendsAlerts({ clientSegment, equipmentInterest }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [trends, setTrends] = useState(null);

  const queryClient = useQueryClient();

  const analyzeTrends = async () => {
    setAnalyzing(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `ALERTA DE TENDÊNCIAS DE MERCADO - EQUIPAMENTOS VETERINÁRIOS

═══════════════════════════════════════
🎯 CONTEXTO
═══════════════════════════════════════
Segmento: ${clientSegment || 'Geral'}
Equipamento Foco: ${equipmentInterest || 'Todos'}
Setor: Equipamentos de diagnóstico veterinário (hemogasometria, bioquímica, hematologia, PCR, imunofluorescência)

═══════════════════════════════════════
📡 MISSÃO: MONITORAR MERCADO
═══════════════════════════════════════

Use Google Search para identificar:

**1. TENDÊNCIAS EMERGENTES** (3-5):
- Nova tecnologia em diagnóstico veterinário
- Mudanças regulatórias
- Novas necessidades do mercado vet
- Inovações de concorrentes
- Impacto no segmento: ${clientSegment || 'geral'}

**2. OPORTUNIDADES** (3-4):
- Gaps de mercado identificados
- Clínicas expandindo laboratórios
- Demanda crescente por exames específicos
- Novos nichos (equinos, exóticos, silvestres)
- Como capitalizar imediatamente

**3. AMEAÇAS** (2-3):
- Concorrentes novos
- Mudanças de preço
- Tecnologias substitutas
- Riscos para ${equipmentInterest || 'equipamentos'}
- Plano de mitigação

**4. NOTÍCIAS RELEVANTES** (2-3):
- Título da notícia
- Fonte confiável
- Resumo (2 linhas)
- Impacto para vendas
- Data aproximada

**5. ALERTAS CRÍTICOS**:
- Urgência: Alta/Média/Baixa
- Tipo: Oportunidade/Ameaça/Tendência
- Ação recomendada IMEDIATA
- Prazo para agir

Seja ESPECÍFICO ao mercado veterinário brasileiro.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            tendencias_emergentes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  titulo: { type: "string" },
                  descricao: { type: "string" },
                  impacto: { type: "string" },
                  relevancia: { type: "string" }
                }
              }
            },
            oportunidades: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  titulo: { type: "string" },
                  descricao: { type: "string" },
                  como_capitalizar: { type: "string" },
                  potencial: { type: "string" }
                }
              }
            },
            ameacas: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  titulo: { type: "string" },
                  descricao: { type: "string" },
                  plano_mitigacao: { type: "string" },
                  severidade: { type: "string" }
                }
              }
            },
            noticias: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  titulo: { type: "string" },
                  fonte: { type: "string" },
                  resumo: { type: "string" },
                  impacto: { type: "string" },
                  data: { type: "string" }
                }
              }
            },
            alertas_criticos: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  urgencia: { type: "string" },
                  tipo: { type: "string" },
                  mensagem: { type: "string" },
                  acao_recomendada: { type: "string" },
                  prazo: { type: "string" }
                }
              }
            }
          }
        }
      });

      setTrends(result);
      toast.success('Alertas de mercado atualizados!');
    } catch (error) {
      toast.error('Erro ao analisar tendências');
      console.error(error);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <Card className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-300">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-slate-800">Alertas de Mercado IA</h3>
          <p className="text-xs text-blue-700">Tendências e oportunidades em tempo real</p>
        </div>
      </div>

      <Button
        onClick={analyzeTrends}
        disabled={analyzing}
        className="w-full bg-blue-600 hover:bg-blue-700 mb-3"
      >
        {analyzing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Monitorando mercado...
          </>
        ) : (
          <>
            <Bell className="w-4 h-4 mr-2" />
            Atualizar Alertas de Mercado
          </>
        )}
      </Button>

      {trends && (
        <div className="space-y-3">
          {/* Alertas Críticos */}
          {trends.alertas_criticos?.length > 0 && (
            <Card className="p-3 bg-red-50 border-2 border-red-400">
              <p className="text-xs font-bold text-red-800 mb-2 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                ALERTAS CRÍTICOS
              </p>
              {trends.alertas_criticos.map((alerta, i) => (
                <div key={i} className="mb-2 p-2 bg-white rounded border border-red-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={
                      alerta.urgencia === 'Alta' ? 'bg-red-600' :
                      alerta.urgencia === 'Média' ? 'bg-yellow-600' : 'bg-blue-600'
                    }>
                      {alerta.urgencia}
                    </Badge>
                    <Badge variant="outline">{alerta.tipo}</Badge>
                  </div>
                  <p className="text-xs font-semibold text-slate-800 mb-1">{alerta.mensagem}</p>
                  <p className="text-xs text-green-700">✓ {alerta.acao_recomendada}</p>
                  <p className="text-xs text-orange-600">⏰ {alerta.prazo}</p>
                </div>
              ))}
            </Card>
          )}

          {/* Tendências Emergentes */}
          <Card className="p-3 bg-purple-50 border border-purple-200">
            <p className="text-xs font-bold text-purple-800 mb-2">🚀 Tendências Emergentes</p>
            {trends.tendencias_emergentes?.map((trend, i) => (
              <div key={i} className="mb-2 p-2 bg-white rounded">
                <p className="text-xs font-semibold text-slate-800">{trend.titulo}</p>
                <p className="text-xs text-slate-600 mb-1">{trend.descricao}</p>
                <div className="flex items-center gap-1">
                  <Badge className="bg-purple-100 text-purple-700 text-xs">{trend.relevancia}</Badge>
                  <span className="text-xs text-slate-500">Impacto: {trend.impacto}</span>
                </div>
              </div>
            ))}
          </Card>

          {/* Oportunidades */}
          <Card className="p-3 bg-green-50 border border-green-200">
            <p className="text-xs font-bold text-green-800 mb-2">💡 Oportunidades</p>
            {trends.oportunidades?.map((opp, i) => (
              <div key={i} className="mb-2 p-2 bg-white rounded">
                <p className="text-xs font-semibold text-slate-800">{opp.titulo}</p>
                <p className="text-xs text-slate-600 mb-1">{opp.descricao}</p>
                <p className="text-xs text-green-700">✓ {opp.como_capitalizar}</p>
                <Badge className="bg-green-100 text-green-700 text-xs mt-1">
                  Potencial: {opp.potencial}
                </Badge>
              </div>
            ))}
          </Card>

          {/* Ameaças */}
          <Card className="p-3 bg-orange-50 border border-orange-200">
            <p className="text-xs font-bold text-orange-800 mb-2">⚠️ Ameaças</p>
            {trends.ameacas?.map((threat, i) => (
              <div key={i} className="mb-2 p-2 bg-white rounded">
                <p className="text-xs font-semibold text-slate-800">{threat.titulo}</p>
                <p className="text-xs text-slate-600 mb-1">{threat.descricao}</p>
                <p className="text-xs text-orange-700">🛡️ {threat.plano_mitigacao}</p>
                <Badge className="bg-orange-100 text-orange-700 text-xs mt-1">
                  {threat.severidade}
                </Badge>
              </div>
            ))}
          </Card>

          {/* Notícias */}
          <Card className="p-3 bg-slate-50 border border-slate-200">
            <p className="text-xs font-bold text-slate-800 mb-2">📰 Notícias Recentes</p>
            {trends.noticias?.map((news, i) => (
              <div key={i} className="mb-2 p-2 bg-white rounded">
                <p className="text-xs font-semibold text-slate-800">{news.titulo}</p>
                <p className="text-xs text-slate-500 mb-1">{news.fonte} • {news.data}</p>
                <p className="text-xs text-slate-600 mb-1">{news.resumo}</p>
                <p className="text-xs text-blue-700">💼 {news.impacto}</p>
              </div>
            ))}
          </Card>
        </div>
      )}
    </Card>
  );
}
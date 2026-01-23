import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Sparkles, Users, Building2, TrendingUp, Clock, Zap } from 'lucide-react';
import { executeWithRateLimit } from '@/components/rateLimitManager';
import { toast } from 'sonner';

export default function UltraDeepMarketIntelligence({ client, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const performUltraDeepAnalysis = async () => {
    setLoading(true);
    try {
      const prompt = `ANÁLISE REGIONAL ULTRA-PROFUNDA de clínica veterinária:

DADOS INICIAIS:
- Clínica: ${client.clinic_name}
- Cidade: ${client.city}
- Endereço: ${client.address}
- CNPJ: ${client.cnpj || 'Procure informações'}
- Proprietário: ${client.first_name}

TAREFA - PESQUISA COMPLETA:
Busque TODAS essas informações sobre esta clínica:

1. DADOS EMPRESARIAIS (CNPJ/Site):
   - Razão social exata
   - Data de fundação
   - Capital social
   - Número de funcionários
   - Faturamento estimado

2. REDES SOCIAIS & REPUTAÇÃO:
   - Instagram followers/engagement
   - Facebook votos/avaliações
   - Google Reviews (rating e comentários)
   - Site quality/modernidade
   - Presença digital

3. PROPRIETÁRIO/SÓCIOS:
   - Nome completo
   - Idade aproximada
   - Formação profissional
   - Outras empresas associadas
   - Presença em redes sociais

4. PERFIL NUMEROLÓGICO DO PROPRIETÁRIO:
   - Data de nascimento (se possível)
   - Número de vida (calcular)
   - Número de destino
   - Perfil comportamental

5. EQUIPAMENTOS ATUAIS:
   - Marcas identificadas
   - Capacidade (análises/dia)
   - Idade aproximada
   - Gaps de serviços

6. SITUAÇÃO ECONÔMICA:
   - Indicadores de crescimento
   - Investimentos recentes
   - Nível de "luxo" (carro, escritório)
   - Saúde financeira aparente

7. PADRÃO DE VISITAÇÃO:
   - Horário de pico
   - Dia mais movimentado
   - Melhor horário p/ gerente
   - Melhor dia para visita

Retorne JSON com:
{
  "empresa": {
    "razao_social": "",
    "data_fundacao": "",
    "capital_social": "",
    "funcionarios": 0,
    "faturamento_estimado": "",
    "tempo_mercado": ""
  },
  "redes_sociais": {
    "instagram": {"seguidores": 0, "posts": 0, "engagement": ""},
    "facebook": {"votos": 0, "rating": 0, "comentarios": ""},
    "google_reviews": {"rating": 0, "votos": 0, "resumo": ""},
    "site_quality": ""
  },
  "proprietario": {
    "nome_completo": "",
    "idade_aprox": 0,
    "formacao": "",
    "outras_empresas": [],
    "presenca_digital": ""
  },
  "numerologia": {
    "numero_vida": 0,
    "numero_destino": 0,
    "perfil": "",
    "estilo_decisao": "",
    "abordagem_ideal": ""
  },
  "equipamentos": {
    "atual": "",
    "capacidade": "",
    "idade": "",
    "gaps": ["", ""]
  },
  "economia": {
    "crescimento": "alto/medio/baixo",
    "investimentos_recentes": [],
    "nivel_luxo": "precario/modesto/confortavel/luxo",
    "saude_financeira": ""
  },
  "visitacao": {
    "horario_pico": "",
    "dia_movimentado": "",
    "melhor_horario_gerente": "",
    "melhor_dia_visita": ""
  },
  "equipamento_ideal": {
    "recomendado": "",
    "razao": "",
    "aderencia": "percentual",
    "roi_estimado": "",
    "timing": ""
  },
  "perguntas_spin_personalizadas": [
    {"tipo": "situacional", "pergunta": "", "por_que": ""},
    {"tipo": "problema", "pergunta": "", "por_que": ""},
    {"tipo": "implicacao", "pergunta": "", "por_que": ""}
  ],
  "abordagem_proprietario": {
    "estilo_comunicacao": "",
    "gatilhos_efetivos": ["", ""],
    "horario_ideal": "",
    "dia_ideal": "",
    "primeira_frase": ""
  }
}`;

      const result = await executeWithRateLimit(async () => {
        return await base44.integrations.Core.InvokeLLM({
          prompt,
          add_context_from_internet: true,
          response_json_schema: {
            type: "object",
            properties: {
              empresa: {
                type: "object",
                properties: {
                  razao_social: { type: "string" },
                  data_fundacao: { type: "string" },
                  capital_social: { type: "string" },
                  funcionarios: { type: "number" },
                  faturamento_estimado: { type: "string" },
                  tempo_mercado: { type: "string" }
                }
              },
              redes_sociais: { type: "object" },
              proprietario: { type: "object" },
              numerologia: { type: "object" },
              equipamentos: { type: "object" },
              economia: { type: "object" },
              visitacao: { type: "object" },
              equipamento_ideal: { type: "object" },
              perguntas_spin_personalizadas: { type: "array" },
              abordagem_proprietario: { type: "object" }
            }
          }
        });
      }, 'high');

      setAnalysis(result);

      if (onUpdate) {
        await onUpdate({
          ai_website_analysis: JSON.stringify(result.empresa),
          social_media_analysis: JSON.stringify(result.redes_sociais),
          equipment_suggestion: result.equipamento_ideal.recomendado,
          equipment_suggestion_reason: result.equipamento_ideal.razao
        });
      }

      toast.success('Análise ultra-profunda concluída!');
    } catch (error) {
      toast.error('Erro ao executar análise');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!analysis) {
    return (
      <Card className="p-4 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-2 border-indigo-300">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-slate-800">🔬 Análise Regional Ultra-Profunda</h3>
            <p className="text-xs text-slate-600">CNPJ, redes sociais, proprietário, equipamento ideal, perguntas personalizadas</p>
          </div>
        </div>
        <Button
          onClick={performUltraDeepAnalysis}
          disabled={loading}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Analisando (1-2 min)...
            </>
          ) : (
            '🔍 Executar Análise Completa'
          )}
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-2 border-indigo-300">
      <Tabs defaultValue="empresa" className="w-full">
        <TabsList className="grid w-full grid-cols-5 mb-4">
          <TabsTrigger value="empresa" className="text-xs">Empresa</TabsTrigger>
          <TabsTrigger value="proprietario" className="text-xs">Dono</TabsTrigger>
          <TabsTrigger value="equipamento" className="text-xs">Equipto</TabsTrigger>
          <TabsTrigger value="perguntas" className="text-xs">SPIN</TabsTrigger>
          <TabsTrigger value="visita" className="text-xs">Visita</TabsTrigger>
        </TabsList>

        {/* EMPRESA */}
        <TabsContent value="empresa" className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white p-2 rounded-lg border border-indigo-200">
              <p className="text-xs text-indigo-600 font-semibold">Razão Social</p>
              <p className="text-sm font-bold text-slate-800">{analysis.empresa?.razao_social}</p>
            </div>
            <div className="bg-white p-2 rounded-lg border border-indigo-200">
              <p className="text-xs text-indigo-600 font-semibold">Fundação</p>
              <p className="text-sm font-bold text-slate-800">{analysis.empresa?.data_fundacao} ({analysis.empresa?.tempo_mercado})</p>
            </div>
            <div className="bg-white p-2 rounded-lg border border-green-200">
              <p className="text-xs text-green-600 font-semibold">Capital Social</p>
              <p className="text-sm font-bold text-slate-800">{analysis.empresa?.capital_social}</p>
            </div>
            <div className="bg-white p-2 rounded-lg border border-purple-200">
              <p className="text-xs text-purple-600 font-semibold">Funcionários</p>
              <p className="text-sm font-bold text-slate-800">{analysis.empresa?.funcionarios}</p>
            </div>
          </div>

          <div className="bg-white p-3 rounded-lg border border-indigo-200">
            <p className="text-xs text-indigo-600 font-semibold mb-1">📊 Faturamento Estimado</p>
            <p className="text-sm text-slate-700">{analysis.empresa?.faturamento_estimado}</p>
          </div>

          {analysis.redes_sociais && (
            <div className="space-y-2 bg-slate-50 p-3 rounded-lg">
              <p className="text-xs font-semibold text-slate-700">📱 Redes Sociais</p>
              {analysis.redes_sociais.instagram && (
                <div className="text-xs">
                  <Badge className="bg-pink-200 text-pink-800">Instagram: {analysis.redes_sociais.instagram.seguidores} followers</Badge>
                </div>
              )}
              {analysis.redes_sociais.google_reviews && (
                <div className="text-xs">
                  <Badge className="bg-blue-200 text-blue-800">Google: ⭐ {analysis.redes_sociais.google_reviews.rating} ({analysis.redes_sociais.google_reviews.votos} votos)</Badge>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* PROPRIETÁRIO */}
        <TabsContent value="proprietario" className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white p-2 rounded-lg border border-purple-200">
              <p className="text-xs text-purple-600 font-semibold">Nome</p>
              <p className="text-sm font-bold text-slate-800">{analysis.proprietario?.nome_completo}</p>
            </div>
            <div className="bg-white p-2 rounded-lg border border-purple-200">
              <p className="text-xs text-purple-600 font-semibold">Idade</p>
              <p className="text-sm font-bold text-slate-800">{analysis.proprietario?.idade_aprox} anos</p>
            </div>
          </div>

          <div className="bg-white p-3 rounded-lg border border-purple-200">
            <p className="text-xs text-purple-600 font-semibold mb-1">Formação</p>
            <p className="text-sm text-slate-700">{analysis.proprietario?.formacao}</p>
          </div>

          {analysis.numerologia && (
            <div className="bg-gradient-to-br from-purple-100 to-pink-100 p-3 rounded-lg border border-purple-300">
              <p className="text-xs font-semibold text-purple-700 mb-2">🔮 Perfil Numerológico</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="font-bold text-purple-900">Número de Vida: {analysis.numerologia.numero_vida}</p>
                  <p className="text-purple-700">{analysis.numerologia.perfil}</p>
                </div>
                <div>
                  <p className="font-bold text-purple-900">Estilo: {analysis.numerologia.estilo_decisao}</p>
                </div>
              </div>
              <p className="text-xs text-purple-700 mt-2 font-medium">💡 {analysis.numerologia.abordagem_ideal}</p>
            </div>
          )}

          {analysis.economia && (
            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
              <p className="text-xs font-semibold text-yellow-700 mb-2">💰 Saúde Financeira</p>
              <p className="text-sm text-slate-700">{analysis.economia.saude_financeira}</p>
              <Badge className={`mt-2 ${analysis.economia.nivel_luxo === 'luxo' ? 'bg-green-200 text-green-800' : analysis.economia.nivel_luxo === 'confortavel' ? 'bg-blue-200 text-blue-800' : 'bg-gray-200 text-gray-800'}`}>
                Nível: {analysis.economia.nivel_luxo}
              </Badge>
            </div>
          )}
        </TabsContent>

        {/* EQUIPAMENTO IDEAL */}
        <TabsContent value="equipamento" className="space-y-3">
          {analysis.equipamentos?.atual && (
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              <p className="text-xs font-semibold text-gray-700 mb-1">🔧 Equipamento Atual</p>
              <p className="text-sm font-bold text-slate-800">{analysis.equipamentos.atual}</p>
              <p className="text-xs text-slate-600">Capacidade: {analysis.equipamentos.capacidade}</p>
              <p className="text-xs text-slate-600">Idade: {analysis.equipamentos.idade}</p>
            </div>
          )}

          {analysis.equipamento_ideal && (
            <div className="bg-gradient-to-br from-green-100 to-emerald-100 p-3 rounded-lg border-2 border-green-500">
              <p className="text-sm font-bold text-green-900 mb-2">✅ EQUIPAMENTO RECOMENDADO</p>
              <p className="text-base font-black text-green-700">{analysis.equipamento_ideal.recomendado}</p>
              <p className="text-xs text-green-800 mt-1"><strong>Razão:</strong> {analysis.equipamento_ideal.razao}</p>
              <Badge className="bg-green-600 text-white mt-2">{analysis.equipamento_ideal.aderencia} aderência</Badge>
              <p className="text-xs text-green-800 mt-2"><strong>ROI Estimado:</strong> {analysis.equipamento_ideal.roi_estimado}</p>
              <p className="text-xs text-green-800"><strong>Timing:</strong> {analysis.equipamento_ideal.timing}</p>
            </div>
          )}

          {analysis.equipamentos?.gaps && (
            <div className="bg-red-50 p-3 rounded-lg border border-red-200">
              <p className="text-xs font-semibold text-red-700 mb-1">⚠️ Gaps Identificados</p>
              <ul className="text-xs text-slate-700 space-y-1">
                {analysis.equipamentos.gaps.map((gap, i) => (
                  <li key={i}>• {gap}</li>
                ))}
              </ul>
            </div>
          )}
        </TabsContent>

        {/* PERGUNTAS SPIN */}
        <TabsContent value="perguntas" className="space-y-2">
          {analysis.perguntas_spin_personalizadas?.map((q, idx) => (
            <div key={idx} className={`p-2 rounded-lg border-l-4 ${
              q.tipo === 'situacional' ? 'bg-blue-50 border-l-blue-500' :
              q.tipo === 'problema' ? 'bg-red-50 border-l-red-500' :
              'bg-orange-50 border-l-orange-500'
            }`}>
              <Badge className={`text-xs mb-1 ${
                q.tipo === 'situacional' ? 'bg-blue-200 text-blue-800' :
                q.tipo === 'problema' ? 'bg-red-200 text-red-800' :
                'bg-orange-200 text-orange-800'
              }`}>{q.tipo.toUpperCase()}</Badge>
              <p className="text-sm font-bold text-slate-800 mt-1">❓ {q.pergunta}</p>
              <p className="text-xs text-slate-600 mt-1">💡 {q.por_que}</p>
            </div>
          ))}
        </TabsContent>

        {/* MELHOR HORÁRIO/DIA PARA VISITA */}
        <TabsContent value="visita" className="space-y-3">
          <div className="bg-gradient-to-br from-orange-100 to-red-100 p-3 rounded-lg border-2 border-orange-500">
            <p className="text-xs font-semibold text-orange-700 mb-3">⏰ MELHOR HORÁRIO PARA VISITA</p>

            <div className="space-y-2">
              <div className="bg-white p-2 rounded border border-orange-300">
                <p className="text-xs font-bold text-orange-700">🕐 Horário Ideal do Gerente</p>
                <p className="text-sm font-black text-slate-800">{analysis.visitacao?.melhor_horario_gerente}</p>
              </div>

              <div className="bg-white p-2 rounded border border-orange-300">
                <p className="text-xs font-bold text-orange-700">📅 Melhor Dia</p>
                <p className="text-sm font-black text-slate-800">{analysis.visitacao?.melhor_dia_visita}</p>
              </div>

              <div className="bg-white p-2 rounded border border-orange-300">
                <p className="text-xs font-bold text-orange-700">👥 Dia mais Movimentado</p>
                <p className="text-sm text-slate-800">{analysis.visitacao?.dia_movimentado}</p>
              </div>

              <div className="bg-white p-2 rounded border border-orange-300">
                <p className="text-xs font-bold text-orange-700">⏰ Horário de Pico</p>
                <p className="text-sm text-slate-800">{analysis.visitacao?.horario_pico}</p>
              </div>
            </div>
          </div>

          {analysis.abordagem_proprietario && (
            <div className="bg-gradient-to-br from-purple-100 to-pink-100 p-3 rounded-lg border-2 border-purple-300">
              <p className="text-xs font-semibold text-purple-700 mb-2">🎯 Estratégia de Abordagem</p>
              <p className="text-xs text-purple-800 mb-2"><strong>Estilo:</strong> {analysis.abordagem_proprietario.estilo_comunicacao}</p>
              <p className="text-xs font-semibold text-purple-700 mb-1">💬 Primeira Frase:</p>
              <p className="text-sm font-bold text-slate-800 italic">"{analysis.abordagem_proprietario.primeira_frase}"</p>
              <p className="text-xs text-purple-800 mt-2"><strong>Horário Ideal:</strong> {analysis.abordagem_proprietario.horario_ideal}</p>
              <p className="text-xs text-purple-800"><strong>Dia Ideal:</strong> {analysis.abordagem_proprietario.dia_ideal}</p>
              <p className="text-xs font-semibold text-purple-700 mt-2">🎯 Gatilhos Efetivos:</p>
              <ul className="text-xs text-slate-700 space-y-0.5 mt-1">
                {analysis.abordagem_proprietario.gatilhos_efetivos?.map((gatilho, i) => (
                  <li key={i}>• {gatilho}</li>
                ))}
              </ul>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Button
        size="sm"
        onClick={() => setAnalysis(null)}
        variant="outline"
        className="w-full mt-4"
      >
        Nova Análise
      </Button>
    </Card>
  );
}
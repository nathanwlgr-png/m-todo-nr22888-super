import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown,
  Target,
  BookOpen,
  Video,
  Users,
  Award,
  Brain,
  Loader2,
  ExternalLink,
  Play,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';

export default function IndividualCoachingDashboard() {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const { data: coachingSessions = [] } = useQuery({
    queryKey: ['coaching-sessions-all'],
    queryFn: () => base44.entities.CoachingSession.list('-created_date', 100)
  });

  const { data: rolePlaySessions = [] } = useQuery({
    queryKey: ['roleplay-sessions'],
    queryFn: () => base44.entities.RolePlaySession.list('-created_date', 50)
  });

  const analyzeProgress = async () => {
    if (coachingSessions.length === 0) {
      toast.error('Nenhuma sessão de coaching encontrada');
      return;
    }

    setAnalyzing(true);
    try {
      const userSessions = coachingSessions.filter(s => 
        s.created_by === user?.email || !selectedUser
      );

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `ANÁLISE PROFUNDA DE COACHING INDIVIDUAL

═══════════════════════════════════════
📊 DADOS DO VENDEDOR
═══════════════════════════════════════
Total de Sessões: ${userSessions.length}
Role-Plays: ${rolePlaySessions.length}

SCORES MÉDIOS:
${userSessions.slice(0, 10).map((s, i) => `
Sessão ${i + 1}:
- Overall: ${s.overall_score}/100
- SPIN: ${s.technique_scores?.spin_selling || 'N/A'}/10
- Numerologia: ${s.technique_scores?.numerology_adaptation || 'N/A'}/10
- Cialdini: ${s.technique_scores?.cialdini_triggers || 'N/A'}/10
- IE: ${s.technique_scores?.emotional_intelligence || 'N/A'}/10
- Objeções: ${s.technique_scores?.objection_handling || 'N/A'}/10
`).join('\n')}

PONTOS FORTES IDENTIFICADOS:
${userSessions.flatMap(s => s.strengths || []).slice(0, 10).join('\n')}

PONTOS FRACOS IDENTIFICADOS:
${userSessions.flatMap(s => s.weaknesses || []).slice(0, 10).join('\n')}

═══════════════════════════════════════
🎯 ANÁLISE SOLICITADA
═══════════════════════════════════════

1. **PADRÕES DE SUCESSO** (3-4 padrões):
   Identifique comportamentos, técnicas ou momentos que SEMPRE levam a bons resultados

2. **ÁREAS CRÍTICAS DE MELHORIA** (Top 3):
   Quais as 3 maiores oportunidades de crescimento, em ordem de prioridade

3. **TENDÊNCIAS DE EVOLUÇÃO**:
   - Técnica que mais melhorou
   - Técnica que estagnou ou piorou
   - Score geral: subindo/estável/caindo

4. **EXERCÍCIOS ROLE-PLAY PERSONALIZADOS** (4 exercícios):
   Crie cenários específicos para treinar as fraquezas identificadas
   
5. **MATERIAL DE ESTUDO CUSTOMIZADO** (5-6 recursos):
   Para CADA área de melhoria, sugira:
   - Título do recurso (ex: "Como dominar perguntas SPIN")
   - Tipo (artigo/vídeo/curso)
   - Buscar termos para encontrar no Google/YouTube
   
6. **PLANO DE AÇÃO 30 DIAS**:
   Semana a semana, o que focar para evolução acelerada`,
        response_json_schema: {
          type: "object",
          properties: {
            padroes_sucesso: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  padrao: { type: "string" },
                  impacto: { type: "string" },
                  frequencia: { type: "string" }
                }
              }
            },
            areas_criticas: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  area: { type: "string" },
                  gravidade: { type: "string" },
                  impacto_vendas: { type: "string" }
                }
              }
            },
            tendencias: {
              type: "object",
              properties: {
                tecnica_melhorada: { type: "string" },
                tecnica_estagnada: { type: "string" },
                score_tendencia: { type: "string" },
                velocidade_evolucao: { type: "string" }
              }
            },
            exercicios_roleplay: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  titulo: { type: "string" },
                  cenario: { type: "string" },
                  objetivo: { type: "string" },
                  dificuldade: { type: "string" },
                  foco_tecnico: { type: "string" }
                }
              }
            },
            materiais_estudo: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  titulo: { type: "string" },
                  tipo: { type: "string" },
                  area_foco: { type: "string" },
                  busca_sugerida: { type: "string" },
                  duracao_estimada: { type: "string" }
                }
              }
            },
            plano_30_dias: {
              type: "object",
              properties: {
                semana1: { type: "string" },
                semana2: { type: "string" },
                semana3: { type: "string" },
                semana4: { type: "string" },
                meta_final: { type: "string" }
              }
            },
            score_geral_atual: { type: "number" },
            score_potencial: { type: "number" }
          }
        }
      });

      // Buscar links reais para os materiais sugeridos
      const materialsWithLinks = await Promise.all(
        result.materiais_estudo.slice(0, 5).map(async (material) => {
          try {
            const searchResults = await base44.integrations.Core.InvokeLLM({
              prompt: `Busque recursos sobre: ${material.busca_sugerida}`,
              add_context_from_internet: true,
              response_json_schema: {
                type: "object",
                properties: {
                  link_sugerido: { type: "string" },
                  descricao: { type: "string" }
                }
              }
            });
            return {
              ...material,
              link: searchResults.link_sugerido,
              descricao_link: searchResults.descricao
            };
          } catch (e) {
            return {
              ...material,
              link: `https://www.google.com/search?q=${encodeURIComponent(material.busca_sugerida)}`,
              descricao_link: 'Buscar no Google'
            };
          }
        })
      );

      setAnalysis({
        ...result,
        materiais_estudo: materialsWithLinks
      });
      toast.success('Análise completa gerada!');
    } catch (error) {
      toast.error('Erro ao analisar progresso');
      console.error(error);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-slate-800">Dashboard de Progresso Individual</h3>
            <p className="text-xs text-blue-700">Análise profunda com IA de padrões e evolução</p>
          </div>
        </div>

        <Button
          onClick={analyzeProgress}
          disabled={analyzing || coachingSessions.length === 0}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {analyzing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Analisando {coachingSessions.length} sessões...
            </>
          ) : (
            <>
              <Brain className="w-4 h-4 mr-2" />
              Analisar Meu Progresso
            </>
          )}
        </Button>
      </Card>

      {analysis && (
        <>
          {/* Scores Overview */}
          <Card className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-green-300">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-green-900">📊 Performance Atual vs Potencial</h4>
              <Badge className="bg-green-600 text-white">
                {analysis.tendencias?.score_tendencia}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-white rounded-lg border border-green-200">
                <p className="text-xs text-slate-600 mb-1">Score Atual</p>
                <p className="text-2xl font-bold text-slate-800">{analysis.score_geral_atual}</p>
                <Progress value={analysis.score_geral_atual} className="mt-2 h-2" />
              </div>
              <div className="p-3 bg-white rounded-lg border border-emerald-200">
                <p className="text-xs text-slate-600 mb-1">Potencial</p>
                <p className="text-2xl font-bold text-emerald-600">{analysis.score_potencial}</p>
                <Progress value={analysis.score_potencial} className="mt-2 h-2 bg-emerald-200" />
              </div>
            </div>
          </Card>

          {/* Padrões de Sucesso */}
          <Card className="p-4 border-2 border-blue-300 bg-blue-50">
            <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Padrões de Sucesso Identificados
            </h4>
            <div className="space-y-2">
              {analysis.padroes_sucesso?.map((p, i) => (
                <div key={i} className="p-3 bg-white rounded-lg border border-blue-200">
                  <div className="flex items-start justify-between mb-1">
                    <p className="font-semibold text-sm text-blue-800">{p.padrao}</p>
                    <Badge className="bg-blue-100 text-blue-700 text-xs">{p.frequencia}</Badge>
                  </div>
                  <p className="text-xs text-slate-600">💡 {p.impacto}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Áreas Críticas */}
          <Card className="p-4 border-2 border-orange-300 bg-orange-50">
            <h4 className="font-bold text-orange-900 mb-3 flex items-center gap-2">
              <Target className="w-5 h-5" />
              Áreas Críticas de Melhoria
            </h4>
            <div className="space-y-2">
              {analysis.areas_criticas?.map((area, i) => (
                <div key={i} className="p-3 bg-white rounded-lg border border-orange-200">
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-orange-600 text-white text-xs flex items-center justify-center font-bold">
                        {i + 1}
                      </span>
                      <p className="font-semibold text-sm text-orange-800">{area.area}</p>
                    </div>
                    <Badge className={
                      area.gravidade?.includes('Alta') ? 'bg-red-100 text-red-700' :
                      area.gravidade?.includes('Média') ? 'bg-yellow-100 text-yellow-700' :
                      'bg-blue-100 text-blue-700'
                    }>
                      {area.gravidade}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600 ml-8">📈 {area.impacto_vendas}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Tendências */}
          <Card className="p-4 bg-purple-50 border-purple-300">
            <h4 className="font-bold text-purple-900 mb-3">📈 Análise de Tendências</h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 bg-white rounded border border-green-300">
                <div className="flex items-center gap-1 mb-1">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <p className="text-xs font-semibold text-green-700">Melhorou</p>
                </div>
                <p className="text-xs text-slate-700">{analysis.tendencias?.tecnica_melhorada}</p>
              </div>
              <div className="p-2 bg-white rounded border border-orange-300">
                <div className="flex items-center gap-1 mb-1">
                  <TrendingDown className="w-4 h-4 text-orange-600" />
                  <p className="text-xs font-semibold text-orange-700">Estagnou</p>
                </div>
                <p className="text-xs text-slate-700">{analysis.tendencias?.tecnica_estagnada}</p>
              </div>
            </div>
            <div className="mt-2 p-2 bg-white rounded border border-purple-300">
              <p className="text-xs font-semibold text-purple-700 mb-1">Velocidade de Evolução</p>
              <p className="text-xs text-slate-700">{analysis.tendencias?.velocidade_evolucao}</p>
            </div>
          </Card>

          {/* Exercícios Role-Play */}
          <Card className="p-4 border-2 border-indigo-300 bg-indigo-50">
            <h4 className="font-bold text-indigo-900 mb-3 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Exercícios Role-Play Personalizados
            </h4>
            <div className="space-y-3">
              {analysis.exercicios_roleplay?.map((ex, i) => (
                <div key={i} className="p-3 bg-white rounded-lg border border-indigo-200">
                  <div className="flex items-start justify-between mb-2">
                    <h5 className="font-semibold text-sm text-indigo-800">{ex.titulo}</h5>
                    <Badge className={
                      ex.dificuldade === 'Alta' ? 'bg-red-100 text-red-700' :
                      ex.dificuldade === 'Média' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }>
                      {ex.dificuldade}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-700 mb-2">{ex.cenario}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-blue-600">🎯 {ex.foco_tecnico}</span>
                    <Button size="sm" variant="outline" className="text-xs h-7">
                      <Play className="w-3 h-3 mr-1" />
                      Iniciar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Material de Estudo */}
          <Card className="p-4 border-2 border-green-300 bg-green-50">
            <h4 className="font-bold text-green-900 mb-3 flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Material de Estudo Customizado
            </h4>
            <div className="space-y-2">
              {analysis.materiais_estudo?.map((material, i) => (
                <div key={i} className="p-3 bg-white rounded-lg border border-green-200">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {material.tipo === 'vídeo' ? (
                          <Video className="w-4 h-4 text-red-600" />
                        ) : (
                          <BookOpen className="w-4 h-4 text-blue-600" />
                        )}
                        <p className="font-semibold text-sm text-slate-800">{material.titulo}</p>
                      </div>
                      <Badge className="text-xs mb-2">{material.area_foco}</Badge>
                      <p className="text-xs text-slate-600 mb-2">{material.descricao_link}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">⏱️ {material.duracao_estimada}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs"
                    onClick={() => window.open(material.link, '_blank')}
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Acessar Recurso
                  </Button>
                </div>
              ))}
            </div>
          </Card>

          {/* Plano 30 Dias */}
          <Card className="p-4 border-2 border-purple-300 bg-gradient-to-r from-purple-50 to-pink-50">
            <h4 className="font-bold text-purple-900 mb-3 flex items-center gap-2">
              <Award className="w-5 h-5" />
              Plano de Ação 30 Dias
            </h4>
            <div className="space-y-2">
              {['semana1', 'semana2', 'semana3', 'semana4'].map((semana, i) => (
                <div key={i} className="p-3 bg-white rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-6 h-6 rounded-full bg-purple-600 text-white text-xs flex items-center justify-center font-bold">
                      {i + 1}
                    </span>
                    <p className="font-semibold text-sm text-purple-800">Semana {i + 1}</p>
                  </div>
                  <p className="text-xs text-slate-700 ml-8">{analysis.plano_30_dias?.[semana]}</p>
                </div>
              ))}
              <div className="p-3 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg border-2 border-purple-300 mt-3">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-5 h-5 text-purple-600" />
                  <p className="font-bold text-sm text-purple-900">Meta Final</p>
                </div>
                <p className="text-xs text-slate-700">{analysis.plano_30_dias?.meta_final}</p>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
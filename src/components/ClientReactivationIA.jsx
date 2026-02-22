import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Bell, MessageCircle, ChevronDown, ChevronUp, Zap, RefreshCw, Filter } from 'lucide-react';
import { toast } from 'sonner';

const CHANNEL_ICON = { whatsapp: '📱', email: '📧', telefone: '📞', visita: '🏥' };
const URGENCY_COLOR = (s) => s >= 8 ? 'bg-red-500 text-white' : s >= 6 ? 'bg-orange-400 text-white' : s >= 4 ? 'bg-yellow-400 text-black' : 'bg-slate-200 text-slate-700';

export default function ClientReactivationIA() {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [generatingFor, setGeneratingFor] = useState(null);
  const [scripts, setScripts] = useState({});
  const [creatingTask, setCreatingTask] = useState(null);
  const [filter, setFilter] = useState('all'); // all | frio | morno | inativo
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonData, setComparisonData] = useState(null);
  const queryClient = useQueryClient();

  const { data: clients = [] } = useQuery({
    queryKey: ['clients-reactivation'],
    queryFn: () => base44.entities.Client.list()
  });

  const { data: interactions = [] } = useQuery({
    queryKey: ['recent-interactions-reactivation'],
    queryFn: () => base44.entities.Interaction.list('-created_date')
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['sales-for-comparison'],
    queryFn: () => base44.entities.Sale.list('-sale_date')
  });

  // Clientes em risco com segmentação avançada
  const atRiskClients = useMemo(() => {
    const cutoff30 = new Date(Date.now() - 30 * 86400000);
    const cutoff60 = new Date(Date.now() - 60 * 86400000);

    return clients
      .filter(c => {
        if (['fechado', 'perdido'].includes(c.pipeline_stage)) return false;
        const lastContact = c.last_contact_date ? new Date(c.last_contact_date) : null;
        const score = c.purchase_score || 0;
        const inactive30 = !lastContact || lastContact < cutoff30;
        const inactive60 = !lastContact || lastContact < cutoff60;
        const isFrio = c.status === 'frio';
        const lowScore = score < 40;
        const highScoreInactive = score >= 40 && inactive30; // Tem potencial mas sumiu

        switch (filter) {
          case 'frio': return isFrio;
          case 'morno': return c.status === 'morno' && inactive30;
          case 'inativo': return inactive60;
          default: return isFrio || lowScore || inactive30 || highScoreInactive;
        }
      })
      .map(c => {
        // Calcular risco de reativação
        const daysSinceContact = c.last_contact_date
          ? Math.floor((Date.now() - new Date(c.last_contact_date)) / 86400000)
          : 999;
        const reactivationPotential = Math.min(100,
          (c.purchase_score || 0) * 0.4 +
          (c.status === 'morno' ? 20 : 0) +
          Math.min(30, daysSinceContact * 0.5) // mais urgente quanto mais tempo
        );
        return { ...c, daysSinceContact, reactivationPotential };
      })
      .sort((a, b) => b.reactivationPotential - a.reactivationPotential)
      .slice(0, 20);
  }, [clients, filter]);

  const generateComparison = async () => {
    try {
      const last30 = new Date(Date.now() - 30 * 86400000);
      const last60_30 = new Date(Date.now() - 60 * 86400000);
      
      const currentPeriod = sales.filter(s => new Date(s.sale_date) >= last30);
      const previousPeriod = sales.filter(s => new Date(s.sale_date) >= last60_30 && new Date(s.sale_date) < last30);
      
      const currentTotal = currentPeriod.reduce((sum, s) => sum + (s.sale_value || 0), 0);
      const previousTotal = previousPeriod.reduce((sum, s) => sum + (s.sale_value || 0), 0);
      const variance = previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal * 100) : 0;
      
      const currentClientCount = new Set(currentPeriod.map(s => s.client_id)).size;
      const previousClientCount = new Set(previousPeriod.map(s => s.client_id)).size;
      
      setComparisonData({
        currentPeriod: { revenue: currentTotal, sales: currentPeriod.length, uniqueClients: currentClientCount },
        previousPeriod: { revenue: previousTotal, sales: previousPeriod.length, uniqueClients: previousClientCount },
        variance
      });
      setShowComparison(true);
    } catch (e) {
      toast.error('Erro ao gerar comparativo');
    }
  };

  const analyzeReactivation = async () => {
    setLoading(true);
    setSuggestions(null);
    setScripts({});
    try {
      if (atRiskClients.length === 0) {
        toast.info('Nenhum cliente para reativação com o filtro atual');
        setLoading(false);
        return;
      }

      const clientsPayload = atRiskClients.slice(0, 12).map(c => ({
        id: c.id,
        name: c.first_name,
        clinic: c.clinic_name,
        city: c.city,
        score: c.purchase_score || 0,
        healthScore: c.health_score || 0,
        status: c.status,
        pipeline: c.pipeline_stage,
        lastContact: c.last_contact_date || 'nunca',
        daysSinceContact: c.daysSinceContact,
        numerology: c.numerology_number,
        tone: c.client_tone,
        pains: c.main_pains,
        objections: c.real_objections,
        equipmentInterest: c.equipment_interest || c.current_equipment,
        volume: c.current_volume,
        budget: c.available_budget,
        nextAction: c.ai_next_best_action || c.next_action,
        reactivationPotential: Math.round(c.reactivationPotential)
      }));

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `MÉTODO NR22 — INTELIGÊNCIA DE REATIVAÇÃO PROATIVA

Data atual: ${new Date().toLocaleDateString('pt-BR')}
Clientes analisados: ${clientsPayload.length}

DADOS DOS CLIENTES:
${JSON.stringify(clientsPayload, null, 2)}

CONTEXTO DE MERCADO VETERINÁRIO:
- Sazonalidade: ${new Date().getMonth() < 3 || new Date().getMonth() > 10 ? 'alta temporada (cães/gatos saem mais)' : 'temporada padrão'}
- Ciclo de equipamentos: muitas clínicas renovam no Q1 e Q3
- Concorrentes ativos: IDEXX, Mindray, Mobivet fazem campanhas frequentes

Com base no Método NR22 (Numerologia Pitagórica + Padrões de Mercado + Score Preditivo), analise CADA cliente e determine:

Para cada cliente (top 8 por urgência):
1. urgency_score: 1-10 (10 = AGIR HOJE)
2. segment: "dormant_champion" | "at_risk" | "cooling" | "lost_cause" — classificação NR22
3. reactivation_reason: motivo ESPECÍFICO e dado concreto para reativar AGORA
4. market_trigger: evento de mercado, sazonalidade ou oportunidade que justifica o contato
5. best_channel: canal mais efetivo para o perfil numerológico
6. best_timing: horário e dia da semana ideal
7. opening_hook: frase de abertura IRRESISTÍVEL (única, personalizada ao numerológico)
8. value_proposition: o que oferecer neste momento específico
9. expected_outcome: resultado realista da reativação
10. risk_if_no_action: o que acontece se não agir agora

Também retorne:
- market_context: contexto geral do mercado vet para justificar as reativações
- total_potential_revenue: estimativa da receita potencial se reativar 50% dos clientes
- reactivation_strategy: estratégia geral recomendada para a semana`,
        response_json_schema: {
          type: 'object',
          properties: {
            market_context: { type: 'string' },
            total_potential_revenue: { type: 'string' },
            reactivation_strategy: { type: 'string' },
            suggestions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  client_id: { type: 'string' },
                  client_name: { type: 'string' },
                  urgency_score: { type: 'number' },
                  segment: { type: 'string' },
                  reactivation_reason: { type: 'string' },
                  market_trigger: { type: 'string' },
                  best_channel: { type: 'string' },
                  best_timing: { type: 'string' },
                  opening_hook: { type: 'string' },
                  value_proposition: { type: 'string' },
                  expected_outcome: { type: 'string' },
                  risk_if_no_action: { type: 'string' }
                }
              }
            }
          }
        }
      });

      // Enriquecer com dados do CRM
      const enriched = (result.suggestions || []).map(s => {
        const clientData = clients.find(c => c.id === s.client_id || c.first_name === s.client_name);
        return { ...s, clientData };
      }).filter(s => s.clientData);

      setSuggestions({ ...result, suggestions: enriched });
    } catch (e) {
      toast.error('Erro ao analisar clientes');
    } finally {
      setLoading(false);
    }
  };

  const generateScript = async (suggestion) => {
    const clientData = suggestion.clientData;
    if (!clientData) return;
    setGeneratingFor(suggestion.client_name);
    try {
      const script = await base44.integrations.Core.InvokeLLM({
        prompt: `MÉTODO NR22 — SCRIPT COMPLETO DE REATIVAÇÃO

CLIENTE: ${suggestion.client_name} | ${clientData.clinic_name || ''} | ${clientData.city || ''}
NUMEROLOGIA: ${clientData.numerology_number} | TOM: ${clientData.client_tone || 'N/A'}
SCORE: ${clientData.purchase_score}% | STATUS: ${clientData.status}
DIAS SEM CONTATO: ${suggestion.clientData?.daysSinceContact || '?'}
CANAL: ${suggestion.best_channel} | TIMING: ${suggestion.best_timing}
SEGMENTO NR22: ${suggestion.segment}
HOOK: "${suggestion.opening_hook}"
PROPOSTA DE VALOR: ${suggestion.value_proposition}
TRIGGER DE MERCADO: ${suggestion.market_trigger}
DORES: ${clientData.main_pains?.join(', ') || 'N/A'}
OBJEÇÕES CONHECIDAS: ${clientData.real_objections?.join(', ') || 'N/A'}
INTERESSE: ${clientData.equipment_interest || 'N/A'}

Crie scripts PRONTOS para ${suggestion.best_channel} (adapte ao numerológico ${clientData.numerology_number}):

VERSÃO CURTA (max 3 linhas, impacto imediato):
[script]

---

VERSÃO COMPLETA (com contexto, proposta de valor e CTA):
[script]

---

FOLLOW-UP (se não responder em 3 dias):
[script]

Cada versão deve ser PRÉ-FORMATADA para copiar e usar imediatamente. Inclua emojis estratégicos.`,
      });
      setScripts(prev => ({ ...prev, [suggestion.client_name]: script }));
    } catch (e) {
      toast.error('Erro ao gerar script');
    } finally {
      setGeneratingFor(null);
    }
  };

  const createReactivationTask = async (suggestion) => {
    const clientData = suggestion.clientData;
    if (!clientData) return;
    setCreatingTask(suggestion.client_name);
    try {
      await base44.entities.Task.create({
        client_id: clientData.id,
        client_name: clientData.first_name,
        title: `[REATIVAÇÃO] ${suggestion.best_channel.toUpperCase()} — ${suggestion.client_name}`,
        description: `🎯 Urgência: ${suggestion.urgency_score}/10\n\n💬 Abertura: "${suggestion.opening_hook}"\n\n📈 Trigger: ${suggestion.market_trigger}\n\n⏰ Melhor horário: ${suggestion.best_timing}\n\n🎁 Proposta: ${suggestion.value_proposition}\n\n⚠️ Risco sem ação: ${suggestion.risk_if_no_action}`,
        type: suggestion.best_channel === 'visita' ? 'visita' : suggestion.best_channel === 'telefone' ? 'ligacao' : 'follow_up',
        priority: suggestion.urgency_score >= 7 ? 'alta' : suggestion.urgency_score >= 4 ? 'media' : 'baixa',
        due_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        status: 'pendente',
        auto_created: true
      });
      queryClient.invalidateQueries(['client-tasks']);
      toast.success(`✅ Tarefa de reativação criada para ${suggestion.client_name}!`);
    } catch (e) {
      toast.error('Erro ao criar tarefa');
    } finally {
      setCreatingTask(null);
    }
  };

  const SEGMENT_LABELS = {
    'dormant_champion': { label: 'Champion Dormente', color: 'bg-purple-100 text-purple-700' },
    'at_risk': { label: 'Em Risco', color: 'bg-red-100 text-red-700' },
    'cooling': { label: 'Esfriando', color: 'bg-orange-100 text-orange-700' },
    'lost_cause': { label: 'Baixa Prioridade', color: 'bg-slate-100 text-slate-600' }
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-800">🔔 Reativação Proativa IA</p>
          <p className="text-xs text-slate-500">{atRiskClients.length} clientes detectados para reativação</p>
        </div>
        <Button size="sm" onClick={analyzeReactivation} disabled={loading} className="bg-orange-500 hover:bg-orange-600 h-8 text-xs">
          {loading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Bell className="w-3 h-3 mr-1" />}
          {loading ? 'Analisando...' : 'Analisar IA'}
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex gap-1.5 flex-wrap">
        {[
          { value: 'all', label: '🔎 Todos' },
          { value: 'frio', label: '❄️ Frios' },
          { value: 'morno', label: '🌡️ Mornos Inativos' },
          { value: 'inativo', label: '😴 Inativos 60d+' },
        ].map(({ value, label }) => (
          <button key={value} onClick={() => { setFilter(value); setSuggestions(null); }}
            className={`text-[10px] px-2.5 py-1 rounded-full border transition-colors ${filter === value ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Preview clientes em risco */}
      {!suggestions && !loading && atRiskClients.length > 0 && (
        <div className="grid grid-cols-3 gap-1.5">
          {atRiskClients.slice(0, 6).map(c => (
            <Card key={c.id} className="border-orange-200 bg-orange-50">
              <CardContent className="p-2">
                <p className="text-[10px] font-medium text-orange-800 truncate">{c.first_name}</p>
                <p className="text-[9px] text-orange-600 truncate">{c.clinic_name || c.city}</p>
                <p className="text-[9px] text-orange-500 mt-0.5">
                  {c.daysSinceContact < 999 ? `${c.daysSinceContact}d sem contato` : 'nunca contatado'}
                </p>
                <Badge className={`text-[9px] mt-1 h-4 ${c.status === 'frio' ? 'bg-blue-200 text-blue-700' : 'bg-yellow-200 text-yellow-700'}`}>
                  {c.status} · {c.purchase_score || 0}%
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {loading && (
        <Card>
          <CardContent className="p-5 text-center space-y-1">
            <Loader2 className="w-5 h-5 animate-spin text-orange-500 mx-auto" />
            <p className="text-xs text-slate-500">NR22 cruzando {atRiskClients.length} perfis com padrões de mercado...</p>
            <div className="flex justify-center gap-2 text-[10px] text-slate-400">
              <span>🔢 Numerologia</span><span>·</span><span>📈 Mercado</span><span>·</span><span>🎯 Score</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contexto de mercado + estratégia */}
      {suggestions?.market_context && (
        <div className="space-y-2">
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="p-2.5">
              <p className="text-[10px] font-bold text-amber-700">📈 CONTEXTO MERCADO NR22</p>
              <p className="text-xs text-amber-800 mt-0.5">{suggestions.market_context}</p>
            </CardContent>
          </Card>
          {suggestions.reactivation_strategy && (
            <Card className="bg-indigo-50 border-indigo-200">
              <CardContent className="p-2.5">
                <p className="text-[10px] font-bold text-indigo-700">🎯 ESTRATÉGIA DA SEMANA</p>
                <p className="text-xs text-indigo-800 mt-0.5">{suggestions.reactivation_strategy}</p>
                {suggestions.total_potential_revenue && (
                  <Badge className="mt-1 bg-indigo-600 text-white text-[10px]">💰 Potencial: {suggestions.total_potential_revenue}</Badge>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Cards de reativação */}
      {suggestions?.suggestions?.map((s, i) => (
        <Card key={i} className={`border-l-4 ${s.urgency_score >= 8 ? 'border-l-red-500' : s.urgency_score >= 6 ? 'border-l-orange-400' : 'border-l-yellow-400'}`}>
          <CardContent className="p-2.5 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-bold text-slate-800">{s.client_name}</span>
                  {s.clientData?.clinic_name && <span className="text-[10px] text-slate-500 truncate max-w-[80px]">· {s.clientData.clinic_name}</span>}
                  <Badge className={`text-[9px] h-4 ${URGENCY_COLOR(s.urgency_score)}`}>🔥 {s.urgency_score}/10</Badge>
                  {s.segment && <Badge className={`text-[9px] h-4 ${SEGMENT_LABELS[s.segment]?.color || 'bg-slate-100 text-slate-600'}`}>{SEGMENT_LABELS[s.segment]?.label || s.segment}</Badge>}
                  <span className="text-[10px] text-slate-500">{CHANNEL_ICON[s.best_channel] || '📌'} {s.best_channel}</span>
                </div>
                <p className="text-[10px] text-slate-600 mt-0.5 line-clamp-1">{s.reactivation_reason}</p>
              </div>
              <button onClick={() => setExpanded(prev => ({ ...prev, [i]: !prev[i] }))} className="text-slate-400 shrink-0">
                {expanded[i] ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {expanded[i] && (
              <div className="space-y-1.5 pt-1.5 border-t border-slate-100">
                {/* Hook de abertura */}
                <div className="bg-green-50 rounded p-2">
                  <p className="text-[10px] font-semibold text-green-700 mb-0.5">💬 ABERTURA SUGERIDA</p>
                  <p className="text-xs text-green-800 italic">"{s.opening_hook}"</p>
                  <button onClick={() => { navigator.clipboard.writeText(s.opening_hook); toast.success('Copiado!'); }}
                    className="text-[10px] text-green-600 hover:text-green-800 mt-1 font-medium">📋 Copiar</button>
                </div>

                <div className="grid grid-cols-2 gap-1">
                  <div className="bg-slate-50 rounded p-1.5">
                    <p className="text-[9px] text-slate-400 font-semibold">⏰ TIMING</p>
                    <p className="text-[10px] text-slate-700">{s.best_timing}</p>
                  </div>
                  <div className="bg-slate-50 rounded p-1.5">
                    <p className="text-[9px] text-slate-400 font-semibold">🎁 PROPOSTA</p>
                    <p className="text-[10px] text-slate-700 line-clamp-2">{s.value_proposition}</p>
                  </div>
                </div>

                <p className="text-[10px] text-indigo-600">📈 <strong>Trigger:</strong> {s.market_trigger}</p>
                <p className="text-[10px] text-green-600">🎯 <strong>Resultado esperado:</strong> {s.expected_outcome}</p>
                {s.risk_if_no_action && (
                  <p className="text-[10px] text-red-500">⚠️ <strong>Risco sem ação:</strong> {s.risk_if_no_action}</p>
                )}

                {/* Script gerado */}
                {scripts[s.client_name] ? (
                  <div className="bg-blue-50 rounded p-2">
                    <p className="text-[10px] font-bold text-blue-700 mb-1">📄 SCRIPTS NR22</p>
                    <p className="text-[10px] text-blue-800 whitespace-pre-wrap max-h-40 overflow-y-auto">{scripts[s.client_name]}</p>
                    <div className="flex gap-2 mt-1.5 flex-wrap">
                      <button onClick={() => { navigator.clipboard.writeText(scripts[s.client_name]); toast.success('Scripts copiados!'); }}
                        className="text-[10px] text-blue-600 font-medium">📋 Copiar tudo</button>
                      {s.clientData?.phone && (
                        <a href={`https://wa.me/${s.clientData.phone}?text=${encodeURIComponent(s.opening_hook)}`} target="_blank" rel="noreferrer"
                          className="text-[10px] text-green-600 font-medium">📱 Abrir WA</a>
                      )}
                    </div>
                  </div>
                ) : (
                  <Button size="sm" onClick={() => generateScript(s)} disabled={generatingFor === s.client_name}
                    className="w-full h-7 text-[10px] bg-slate-700 hover:bg-slate-800">
                    {generatingFor === s.client_name ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Zap className="w-3 h-3 mr-1" />}
                    {generatingFor === s.client_name ? 'Gerando scripts...' : 'Gerar Scripts NR22 (3 versões)'}
                  </Button>
                )}

                {/* Botões de ação */}
                <div className="flex gap-1.5">
                  {s.clientData?.phone && (
                    <a href={`https://wa.me/${s.clientData.phone}?text=${encodeURIComponent(s.opening_hook)}`}
                      target="_blank" rel="noreferrer" className="flex-1">
                      <Button size="sm" className="w-full h-7 text-[10px] bg-green-600 hover:bg-green-700">
                        <MessageCircle className="w-3 h-3 mr-1" /> Contatar WA
                      </Button>
                    </a>
                  )}
                  <Button size="sm" onClick={() => createReactivationTask(s)}
                    disabled={creatingTask === s.client_name}
                    variant="outline" className="flex-1 h-7 text-[10px]">
                    {creatingTask === s.client_name ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : '✅ '}
                    Criar Tarefa
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {suggestions && (
        <Button onClick={analyzeReactivation} variant="outline" size="sm" className="w-full h-7 text-xs">
          <RefreshCw className="w-3 h-3 mr-1" /> Re-analisar
        </Button>
      )}
    </div>
  );
}
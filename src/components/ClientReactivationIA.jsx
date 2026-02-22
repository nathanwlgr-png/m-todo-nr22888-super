import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Bell, MessageCircle, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { toast } from 'sonner';

export default function ClientReactivationIA() {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [generatingFor, setGeneratingFor] = useState(null);
  const [scripts, setScripts] = useState({});

  const { data: clients = [] } = useQuery({
    queryKey: ['clients-reactivation'],
    queryFn: () => base44.entities.Client.list()
  });

  // Filtra clientes para reativação
  const getAtRiskClients = () => {
    const cutoff30 = new Date(Date.now() - 30 * 86400000);
    const cutoff14 = new Date(Date.now() - 14 * 86400000);
    return clients
      .filter(c => {
        const lastContact = c.last_contact_date ? new Date(c.last_contact_date) : null;
        const lowScore = (c.purchase_score || 0) < 40;
        const inactive30 = !lastContact || lastContact < cutoff30;
        const coldStatus = c.status === 'frio';
        const noVisit = !c.last_visit_date || new Date(c.last_visit_date) < cutoff30;
        return (lowScore || inactive30 || coldStatus) && c.pipeline_stage !== 'fechado' && c.pipeline_stage !== 'perdido';
      })
      .sort((a, b) => {
        // Prioriza: score mais alto entre os inativos (mais fáceis de reativar)
        const aRisk = (a.purchase_score || 0) + (a.status === 'morno' ? 20 : 0);
        const bRisk = (b.purchase_score || 0) + (b.status === 'morno' ? 20 : 0);
        return bRisk - aRisk;
      })
      .slice(0, 15);
  };

  const analyzeReactivation = async () => {
    setLoading(true);
    setSuggestions([]);
    try {
      const atRisk = getAtRiskClients();
      if (atRisk.length === 0) { toast.info('Nenhum cliente para reativação no momento'); setLoading(false); return; }

      const clientsData = atRisk.map(c => ({
        id: c.id,
        name: c.first_name,
        clinic: c.clinic_name,
        city: c.city,
        score: c.purchase_score || 0,
        status: c.status,
        lastContact: c.last_contact_date || 'nunca',
        lastVisit: c.last_visit_date || 'nunca',
        pipeline: c.pipeline_stage,
        numerology: c.numerology_number,
        tone: c.client_tone,
        pains: c.main_pains,
        equipment: c.equipment_interest || c.current_equipment,
        volume: c.current_volume,
        nextAction: c.ai_next_best_action || c.next_action,
        healthScore: c.health_score || 0
      }));

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `MÉTODO NR22 — ANÁLISE DE REATIVAÇÃO DE CLIENTES

Data atual: ${new Date().toLocaleDateString('pt-BR')}

Clientes inativos/em risco analisados:
${JSON.stringify(clientsData, null, 2)}

Para cada cliente, baseado nos padrões de mercado veterinário e no Método NR22, determine:
1. urgency_score: 1-10 (10 = reativar IMEDIATAMENTE)
2. reactivation_reason: por que reativar AGORA (dado específico)
3. best_channel: canal mais efetivo para este perfil
4. best_timing: melhor momento (manhã/tarde, dia da semana)
5. opening_hook: frase de abertura irresistível adaptada ao perfil numerológico
6. market_trigger: evento de mercado ou oportunidade que justifica o contato agora
7. expected_outcome: resultado esperado da reativação

Retorne array com os top 8 mais promissores, ordenados por urgency_score.`,
        response_json_schema: {
          type: 'object',
          properties: {
            market_context: { type: 'string' },
            suggestions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  client_id: { type: 'string' },
                  client_name: { type: 'string' },
                  urgency_score: { type: 'number' },
                  reactivation_reason: { type: 'string' },
                  best_channel: { type: 'string' },
                  best_timing: { type: 'string' },
                  opening_hook: { type: 'string' },
                  market_trigger: { type: 'string' },
                  expected_outcome: { type: 'string' }
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
      });

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
        prompt: `MÉTODO NR22 — SCRIPT DE REATIVAÇÃO

Cliente: ${suggestion.client_name} | Clínica: ${clientData.clinic_name || ''} | Cidade: ${clientData.city || ''}
Numerologia: ${clientData.numerology_number} | Tom: ${clientData.client_tone || 'N/A'}
Score: ${clientData.purchase_score}% | Status: ${clientData.status}
Canal: ${suggestion.best_channel} | Timing: ${suggestion.best_timing}
Hook: "${suggestion.opening_hook}"
Trigger de mercado: ${suggestion.market_trigger}
Dores: ${clientData.main_pains?.join(', ') || 'N/A'}
Interesse: ${clientData.equipment_interest || 'N/A'}
Último contato: ${clientData.last_contact_date || 'desconhecido'}

Crie script COMPLETO de reativação para ${suggestion.best_channel}:
1. Versão curta (1 mensagem, max 5 linhas) — pronta para copiar
2. Versão completa (com contexto e CTA) — pronta para copiar
3. Se não responder em 3 dias: mensagem de follow-up

Adapte ao perfil numerológico ${clientData.numerology_number}. Scripts prontos para usar.`
      });
      setScripts(prev => ({ ...prev, [suggestion.client_name]: script }));
    } catch (e) {
      toast.error('Erro ao gerar script');
    } finally {
      setGeneratingFor(null);
    }
  };

  const urgencyColor = (score) => score >= 8 ? 'bg-red-500' : score >= 6 ? 'bg-orange-400' : score >= 4 ? 'bg-yellow-400 text-black' : 'bg-slate-300 text-black';
  const channelIcon = { whatsapp: '📱', email: '📧', telefone: '📞', visita: '🏥' };

  const atRisk = getAtRiskClients();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-800">🔔 Reativação Proativa IA</p>
          <p className="text-xs text-slate-500">{atRisk.length} clientes inativos/em risco detectados</p>
        </div>
        <Button size="sm" onClick={analyzeReactivation} disabled={loading} className="bg-orange-500 hover:bg-orange-600 h-8 text-xs">
          {loading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Bell className="w-3 h-3 mr-1" />}
          {loading ? 'Analisando...' : 'Analisar'}
        </Button>
      </div>

      {/* Preview de clientes em risco */}
      {!suggestions.suggestions && !loading && atRisk.length > 0 && (
        <div className="grid grid-cols-3 gap-1.5">
          {atRisk.slice(0, 6).map(c => (
            <Card key={c.id} className="border-orange-200 bg-orange-50">
              <CardContent className="p-2">
                <p className="text-[10px] font-medium text-orange-800 truncate">{c.first_name}</p>
                <p className="text-[9px] text-orange-600 truncate">{c.clinic_name || c.city}</p>
                <Badge className={`text-[9px] mt-1 h-4 ${c.status === 'frio' ? 'bg-blue-200 text-blue-700' : 'bg-yellow-200 text-yellow-700'}`}>
                  {c.status} · {c.purchase_score||0}%
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {loading && (
        <Card>
          <CardContent className="p-6 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-orange-500 mx-auto mb-2" />
            <p className="text-xs text-slate-500">NR22 cruzando {atRisk.length} perfis com padrões de mercado...</p>
          </CardContent>
        </Card>
      )}

      {suggestions.market_context && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-2.5">
            <p className="text-[10px] font-bold text-amber-700">📈 CONTEXTO DE MERCADO NR22</p>
            <p className="text-xs text-amber-800 mt-0.5">{suggestions.market_context}</p>
          </CardContent>
        </Card>
      )}

      {suggestions.suggestions?.map((s, i) => (
        <Card key={i} className={`border-l-4 ${s.urgency_score >= 8 ? 'border-l-red-500' : s.urgency_score >= 6 ? 'border-l-orange-400' : 'border-l-yellow-400'}`}>
          <CardContent className="p-2.5 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs font-bold text-slate-800">{s.client_name}</span>
                  {s.clientData?.clinic_name && <span className="text-[10px] text-slate-500">· {s.clientData.clinic_name}</span>}
                  <Badge className={`text-[9px] h-4 ${urgencyColor(s.urgency_score)}`}>urgência {s.urgency_score}/10</Badge>
                  <span className="text-xs">{channelIcon[s.best_channel] || '📌'} {s.best_channel}</span>
                </div>
                <p className="text-[10px] text-slate-600 mt-0.5">{s.reactivation_reason}</p>
              </div>
              <button onClick={() => setExpanded(prev => ({ ...prev, [i]: !prev[i] }))} className="text-slate-400 shrink-0">
                {expanded[i] ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {expanded[i] && (
              <div className="space-y-1.5 pt-1 border-t border-slate-100">
                <div className="bg-green-50 rounded p-2">
                  <p className="text-[10px] font-semibold text-green-700">💬 ABERTURA SUGERIDA</p>
                  <p className="text-xs text-green-800 mt-0.5 italic">"{s.opening_hook}"</p>
                  <button onClick={() => { navigator.clipboard.writeText(s.opening_hook); toast.success('Copiado!'); }}
                    className="text-[10px] text-green-600 hover:text-green-800 mt-1 font-medium">📋 Copiar</button>
                </div>
                <p className="text-[10px] text-slate-500">🕐 Melhor horário: <strong>{s.best_timing}</strong></p>
                <p className="text-[10px] text-slate-500">📈 Trigger: {s.market_trigger}</p>
                <p className="text-[10px] text-slate-500">🎯 Resultado esperado: {s.expected_outcome}</p>

                {/* Script completo */}
                {scripts[s.client_name] ? (
                  <div className="bg-blue-50 rounded p-2">
                    <p className="text-[10px] font-bold text-blue-700 mb-1">📄 SCRIPT COMPLETO</p>
                    <p className="text-[10px] text-blue-800 whitespace-pre-wrap max-h-32 overflow-y-auto">{scripts[s.client_name]}</p>
                    <div className="flex gap-2 mt-1">
                      <button onClick={() => { navigator.clipboard.writeText(scripts[s.client_name]); toast.success('Script copiado!'); }}
                        className="text-[10px] text-blue-600 font-medium">📋 Copiar script</button>
                      {s.clientData?.phone && (
                        <a href={`https://wa.me/${s.clientData.phone}?text=${encodeURIComponent(s.opening_hook)}`} target="_blank" rel="noreferrer"
                          className="text-[10px] text-green-600 font-medium">📱 Abrir WA</a>
                      )}
                    </div>
                  </div>
                ) : (
                  <Button size="sm" onClick={() => generateScript(s)} disabled={generatingFor === s.client_name} className="w-full h-7 text-[10px] bg-slate-700">
                    {generatingFor === s.client_name ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Zap className="w-3 h-3 mr-1" />}
                    {generatingFor === s.client_name ? 'Gerando script...' : 'Gerar Script NR22'}
                  </Button>
                )}

                {s.clientData?.phone && (
                  <a href={`https://wa.me/${s.clientData.phone}?text=${encodeURIComponent(s.opening_hook)}`} target="_blank" rel="noreferrer">
                    <Button size="sm" className="w-full h-7 text-[10px] bg-green-600 hover:bg-green-700">
                      <MessageCircle className="w-3 h-3 mr-1" /> Contatar agora no WhatsApp
                    </Button>
                  </a>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
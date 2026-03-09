import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Brain, TrendingUp, TrendingDown, Minus, MessageSquare, Phone, Mail, MapPin, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const SENTIMENT = {
  positive: { color: 'bg-green-100 text-green-800 border-green-200', icon: '😊', label: 'Positivo', barColor: 'bg-green-500' },
  neutral: { color: 'bg-gray-100 text-gray-700 border-gray-200', icon: '😐', label: 'Neutro', barColor: 'bg-gray-400' },
  negative: { color: 'bg-red-100 text-red-800 border-red-200', icon: '😔', label: 'Negativo', barColor: 'bg-red-500' }
};

const TYPE_ICONS = {
  ligacao: Phone, email: Mail, visita: MapPin,
  whatsapp: MessageSquare, reuniao: MessageSquare
};

export default function SentimentAnalysisDashboard({ clientId: propClientId }) {
  const [selectedClientId, setSelectedClientId] = useState(propClientId || null);
  const [suggestion, setSuggestion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: clients = [] } = useQuery({
    queryKey: ['clients-sent'],
    queryFn: () => base44.entities.Client.list('-updated_date', 150),
    enabled: !propClientId
  });

  const { data: interactions = [], isLoading } = useQuery({
    queryKey: ['interactions-sent', selectedClientId],
    queryFn: () => base44.entities.Interaction.filter({ client_id: selectedClientId }),
    enabled: !!selectedClientId
  });

  const client = propClientId
    ? null
    : clients.find(c => c.id === selectedClientId);

  const stats = React.useMemo(() => {
    if (!interactions.length) return null;
    const total = interactions.length;
    const pos = interactions.filter(i => i.sentiment === 'positive').length;
    const neg = interactions.filter(i => i.sentiment === 'negative').length;
    const neu = total - pos - neg;
    const avgScore = interactions.reduce((s, i) => s + (i.sentiment_score || 0), 0) / total;
    const dominant = pos >= neg && pos >= neu ? 'positive' : neg >= neu ? 'negative' : 'neutral';
    return { total, pos, neg, neu, avgScore, dominant };
  }, [interactions]);

  const generateAnalysis = async () => {
    if (!selectedClientId || !interactions.length) {
      toast.error('Nenhuma interação registrada para análise');
      return;
    }
    setLoading(true);
    setSuggestion(null);
    try {
      const recent = interactions.slice(0, 12).map(i => ({
        tipo: i.type,
        sentimento: i.sentiment,
        emocao: i.emotion_detected,
        resultado: i.outcome,
        resumo: (i.notes || i.ai_summary || '').substring(0, 150)
      }));

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `ANÁLISE DE SENTIMENTO NR22 — Clínica Veterinária

Cliente: ${client?.first_name || 'Veterinário'} | Clínica: ${client?.clinic_name || 'N/A'} | Cidade: ${client?.city || 'N/A'}
Numerologia: ${client?.numerology_number || 'N/A'} | Tom observado: ${client?.client_tone || 'N/A'}
Status: ${client?.status || 'morno'} | Score: ${client?.purchase_score || 0}%
Objeções: ${client?.real_objections?.join(', ') || 'nenhuma registrada'}

Histórico de ${interactions.length} interações (mais recentes):
${JSON.stringify(recent, null, 2)}

Gere uma análise COMPLETA e ACIONÁVEL:
1. diagnostico: Estado emocional atual do veterinário/clínica (2-3 frases precisas)
2. tom_predominante: Tom dominante identificado e o que ele indica para vendas
3. ajustes_comunicacao: 3 ajustes ESPECÍFICOS e imediatos na abordagem de vendas
4. script_proximo_contato: Script completo e pronto para usar no próximo contato (adaptado ao contexto veterinário)
5. gatilho_principal: O gatilho emocional/psicológico mais efetivo AGORA para este perfil
6. momento_ideal: Melhor canal e horário para contato com justificativa baseada nas interações
7. alertas: 2 coisas CRÍTICAS a EVITAR com este cliente baseado no histórico de sentimentos`,
        response_json_schema: {
          type: "object",
          properties: {
            diagnostico: { type: "string" },
            tom_predominante: { type: "string" },
            ajustes_comunicacao: { type: "array", items: { type: "string" } },
            script_proximo_contato: { type: "string" },
            gatilho_principal: { type: "string" },
            momento_ideal: { type: "string" },
            alertas: { type: "array", items: { type: "string" } }
          }
        }
      });
      setSuggestion(result);
      toast.success('Análise de sentimento gerada!');
    } catch (e) {
      toast.error('Erro: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const copyScript = () => {
    if (!suggestion?.script_proximo_contato) return;
    navigator.clipboard.writeText(suggestion.script_proximo_contato);
    setCopied(true);
    toast.success('Script copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Client selector */}
      {!propClientId && (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium text-slate-700 mb-2">Selecione o cliente para análise:</p>
            <Select value={selectedClientId || ''} onValueChange={v => { setSelectedClientId(v || null); setSuggestion(null); }}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar veterinário/clínica..." />
              </SelectTrigger>
              <SelectContent>
                {clients.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.status === 'quente' ? '🔥 ' : c.status === 'morno' ? '🌡️ ' : '❄️ '}
                    {c.first_name} {c.clinic_name ? `— ${c.clinic_name}` : ''} {c.city ? `| ${c.city}` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {selectedClientId && (
        <>
          {/* Sentiment Overview */}
          {stats && (
            <Card className={`border ${SENTIMENT[stats.dominant].color}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <p className="font-bold text-lg">
                      {SENTIMENT[stats.dominant].icon} Tom Geral: {SENTIMENT[stats.dominant].label}
                    </p>
                    <p className="text-sm opacity-70">{stats.total} interações analisadas</p>
                  </div>
                  <div className="flex gap-4 text-sm font-semibold">
                    <span className="text-green-700">😊 {stats.pos}</span>
                    <span className="text-gray-600">😐 {stats.neu}</span>
                    <span className="text-red-700">😔 {stats.neg}</span>
                  </div>
                </div>
                {/* Bar chart */}
                <div className="mt-3 space-y-1">
                  {[
                    { label: 'Positivo', count: stats.pos, color: 'bg-green-500' },
                    { label: 'Neutro', count: stats.neu, color: 'bg-gray-400' },
                    { label: 'Negativo', count: stats.neg, color: 'bg-red-500' },
                  ].map(({ label, count, color }) => (
                    <div key={label} className="flex items-center gap-2 text-xs">
                      <span className="w-14 text-right opacity-70">{label}</span>
                      <div className="flex-1 bg-white/50 rounded-full h-2">
                        <div
                          className={`${color} h-2 rounded-full transition-all`}
                          style={{ width: `${stats.total > 0 ? (count / stats.total) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="w-6 font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Analyze button */}
          <Button
            onClick={generateAnalysis}
            disabled={loading || !interactions.length}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 h-11"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analisando sentimento...</>
            ) : (
              <><Brain className="w-4 h-4 mr-2" /> Gerar Análise de Sentimento + Sugestões NR22</>
            )}
          </Button>

          {!interactions.length && !isLoading && (
            <Card className="p-6 text-center">
              <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500">Nenhuma interação registrada para análise</p>
              <p className="text-slate-400 text-xs mt-1">Registre chamadas, visitas ou emails para ativar a análise</p>
            </Card>
          )}

          {/* AI Analysis Result */}
          {suggestion && (
            <Card className="border-indigo-200 shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-indigo-800 flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  Análise de Sentimento NR22
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-indigo-50 rounded-lg p-3">
                  <p className="text-xs font-bold text-indigo-700 mb-1">🎭 Diagnóstico Emocional</p>
                  <p className="text-sm text-slate-700">{suggestion.diagnostico}</p>
                </div>

                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs font-bold text-slate-700 mb-1">🗣️ Tom Predominante</p>
                  <p className="text-sm text-slate-700">{suggestion.tom_predominante}</p>
                </div>

                {suggestion.ajustes_comunicacao?.length > 0 && (
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs font-bold text-blue-700 mb-2">✅ Ajustes na Comunicação</p>
                    <ul className="space-y-1.5">
                      {suggestion.ajustes_comunicacao.map((adj, i) => (
                        <li key={i} className="text-sm text-slate-700 flex gap-2">
                          <span className="text-blue-500 font-bold shrink-0">{i + 1}.</span>
                          <span>{adj}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-green-700">📱 Script Próximo Contato</p>
                    <Button size="sm" variant="ghost" onClick={copyScript} className="h-6 px-2 text-green-700">
                      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </Button>
                  </div>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                    {suggestion.script_proximo_contato}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-amber-50 rounded-lg p-3">
                    <p className="text-xs font-bold text-amber-700 mb-1">⚡ Gatilho Principal</p>
                    <p className="text-sm text-slate-700">{suggestion.gatilho_principal}</p>
                  </div>
                  <div className="bg-cyan-50 rounded-lg p-3">
                    <p className="text-xs font-bold text-cyan-700 mb-1">🕐 Momento Ideal</p>
                    <p className="text-sm text-slate-700">{suggestion.momento_ideal}</p>
                  </div>
                </div>

                {suggestion.alertas?.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-xs font-bold text-red-700 mb-1">⚠️ EVITAR com este cliente</p>
                    <ul className="space-y-1">
                      {suggestion.alertas.map((a, i) => (
                        <li key={i} className="text-sm text-red-700 flex gap-1">
                          <span>•</span><span>{a}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Interaction History */}
          {isLoading ? (
            <div className="py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-indigo-500" /></div>
          ) : interactions.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-700">Histórico de Interações ({interactions.length})</p>
              {interactions.slice(0, 15).map((inter, i) => {
                const sent = inter.sentiment || 'neutral';
                const cfg = SENTIMENT[sent];
                const Icon = TYPE_ICONS[inter.type] || MessageSquare;
                return (
                  <Card key={i} className={`border ${cfg.color} p-3`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${sent === 'positive' ? 'bg-green-200' : sent === 'negative' ? 'bg-red-200' : 'bg-gray-200'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium capitalize">{inter.type}</span>
                          <Badge className={`text-xs ${cfg.color}`}>{cfg.icon} {cfg.label}</Badge>
                          {inter.emotion_detected && inter.emotion_detected !== 'neutral' && (
                            <Badge className="text-xs bg-purple-100 text-purple-700">{inter.emotion_detected}</Badge>
                          )}
                          {inter.outcome && (
                            <Badge className={`text-xs ${inter.outcome === 'positive' ? 'bg-green-100 text-green-700' : inter.outcome === 'negative' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                              {inter.outcome}
                            </Badge>
                          )}
                        </div>
                        {inter.subject && <p className="text-xs text-slate-600 mt-0.5">{inter.subject}</p>}
                        {inter.ai_summary && <p className="text-xs text-indigo-600 mt-1">💡 {inter.ai_summary}</p>}
                        {!inter.ai_summary && inter.notes && (
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{inter.notes.substring(0, 100)}</p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        {inter.sentiment_score !== undefined && inter.sentiment_score !== null && (
                          <p className={`text-sm font-bold ${inter.sentiment_score > 0 ? 'text-green-600' : inter.sentiment_score < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                            {inter.sentiment_score > 0 ? '+' : ''}{Math.round((inter.sentiment_score || 0) * 100)}
                          </p>
                        )}
                        {inter.created_date && (
                          <p className="text-xs text-slate-400">
                            {format(new Date(inter.created_date), 'dd/MM', { locale: ptBR })}
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
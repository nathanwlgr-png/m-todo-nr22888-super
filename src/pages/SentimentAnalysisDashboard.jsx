import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Brain, TrendingUp, TrendingDown, Minus, MessageSquare, Phone, Mail,
  MapPin, Loader2, Lightbulb, AlertCircle, CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';

const SENTIMENT_CONFIG = {
  positive: { label: 'Positivo ✅', color: 'bg-green-100 text-green-800', border: 'border-l-green-500' },
  neutral: { label: 'Neutro ➡️', color: 'bg-gray-100 text-gray-700', border: 'border-l-gray-400' },
  negative: { label: 'Negativo ⚠️', color: 'bg-red-100 text-red-800', border: 'border-l-red-500' },
};

const EMOTION_LABELS = {
  joy: '😊 Alegria', anger: '😠 Irritação', fear: '😨 Receio',
  sadness: '😢 Tristeza', surprise: '😲 Surpresa', neutral: '😐 Neutro'
};

const TYPE_ICONS = { ligacao: Phone, email: Mail, visita: MapPin, whatsapp: MessageSquare, reuniao: MessageSquare };

export default function SentimentAnalysisDashboard() {
  const [selectedClient, setSelectedClient] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [analyzingId, setAnalyzingId] = useState(null);
  const [suggestions, setSuggestions] = useState({});
  const queryClient = useQueryClient();

  const { data: interactions = [], isLoading } = useQuery({
    queryKey: ['interactions-sentiment'],
    queryFn: () => base44.entities.Interaction.list('-created_date', 100),
  });
  const { data: clients = [] } = useQuery({
    queryKey: ['clients-sentiment'],
    queryFn: () => base44.entities.Client.list('-updated_date', 100),
  });

  const filtered = interactions.filter(i => {
    const cOk = selectedClient === 'all' || i.client_id === selectedClient;
    const tOk = selectedType === 'all' || i.type === selectedType;
    return cOk && tOk;
  });

  const positiveCount = filtered.filter(i => i.sentiment === 'positive').length;
  const negativeCount = filtered.filter(i => i.sentiment === 'negative').length;
  const neutralCount = filtered.filter(i => i.sentiment === 'neutral').length;
  const analyzedCount = filtered.filter(i => i.sentiment).length;

  const analyzeInteraction = async (interaction) => {
    if (!interaction.notes && !interaction.subject) { toast.error('Interação sem conteúdo'); return; }
    setAnalyzingId(interaction.id);
    try {
      const client = clients.find(c => c.id === interaction.client_id);
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é especialista em análise de sentimento para vendas B2B veterinárias (Método NR22).

INTERAÇÃO:
Tipo: ${interaction.type}
Assunto: ${interaction.subject || 'N/A'}
Conteúdo: ${interaction.notes || 'N/A'}

CLIENTE:
Nome: ${client?.first_name || 'N/A'} | Clínica: ${client?.clinic_name || 'N/A'}
Status: ${client?.status || 'N/A'} | Numerologia: ${client?.numerology_number || 'N/A'}
Perfil: ${client?.behavioral_profile || 'N/A'}

ANALISE e retorne:
- Sentimento geral (positive/neutral/negative)
- Score de sentimento (-1 a 1, sendo 1 muito positivo)
- Emoção principal detectada (joy/anger/fear/sadness/surprise/neutral)
- Palavras-chave reveladoras do estado emocional
- Sugestão concreta de abordagem para o PRÓXIMO contato adaptada ao tom detectado
- Alertas de risco (o que pode estar errado)
- Oportunidades identificadas (o que pode ser aproveitado)
- Tom ideal para próxima comunicação
- Confiança da análise (0-100)`,
        response_json_schema: {
          type: "object",
          properties: {
            sentiment: { type: "string" },
            sentiment_score: { type: "number" },
            emotion_detected: { type: "string" },
            sentiment_keywords: { type: "array", items: { type: "string" } },
            next_approach_suggestion: { type: "string" },
            risk_alerts: { type: "array", items: { type: "string" } },
            opportunities: { type: "array", items: { type: "string" } },
            ideal_tone: { type: "string" },
            confidence: { type: "number" }
          }
        }
      });

      await base44.entities.Interaction.update(interaction.id, {
        sentiment: result.sentiment,
        sentiment_score: result.sentiment_score,
        sentiment_confidence: result.confidence,
        sentiment_keywords: result.sentiment_keywords,
        emotion_detected: result.emotion_detected,
        ai_summary: result.next_approach_suggestion,
      });

      setSuggestions(prev => ({ ...prev, [interaction.id]: result }));
      queryClient.invalidateQueries(['interactions-sentiment']);
      toast.success('Análise de sentimento concluída!');
    } catch (e) {
      toast.error('Erro: ' + e.message);
    } finally {
      setAnalyzingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Brain className="w-6 h-6 text-indigo-600" />
          Análise de Sentimento IA
        </h1>
        <p className="text-sm text-slate-500">Monitore o tom de interações com clínicas veterinárias e adapte sua abordagem</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Analisadas', value: analyzedCount, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Positivas ✅', value: positiveCount, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Neutras ➡️', value: neutralCount, color: 'text-gray-600', bg: 'bg-gray-50' },
          { label: 'Negativas ⚠️', value: negativeCount, color: 'text-red-600', bg: 'bg-red-50' },
        ].map((item, i) => (
          <Card key={i} className={item.bg}>
            <CardContent className="p-3 text-center">
              <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
              <p className="text-xs text-slate-500">{item.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <Select value={selectedClient} onValueChange={setSelectedClient}>
          <SelectTrigger className="w-52 h-9"><SelectValue placeholder="Todos os clientes" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os clientes</SelectItem>
            {clients.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.first_name}{c.clinic_name ? ` · ${c.clinic_name}` : ''}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-36 h-9"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="ligacao">Ligação</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="visita">Visita</SelectItem>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
            <SelectItem value="reuniao">Reunião</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="text-center py-10"><Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" /></div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-slate-500">
            <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>Nenhuma interação encontrada</p>
            <p className="text-xs mt-1">Adicione interações nos perfis dos clientes</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(interaction => {
            const TypeIcon = TYPE_ICONS[interaction.type] || MessageSquare;
            const sentConfig = SENTIMENT_CONFIG[interaction.sentiment];
            const suggestion = suggestions[interaction.id];
            const client = clients.find(c => c.id === interaction.client_id);
            const scorePercent = interaction.sentiment_score !== undefined
              ? ((interaction.sentiment_score + 1) / 2 * 100)
              : null;

            return (
              <Card key={interaction.id} className={`border-l-4 ${sentConfig?.border || 'border-l-slate-200'}`}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <div className="p-1.5 bg-slate-100 rounded-lg mt-0.5">
                        <TypeIcon className="w-4 h-4 text-slate-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm text-slate-800">
                            {interaction.subject || interaction.type}
                          </p>
                          {sentConfig && <Badge className={`${sentConfig.color} text-[10px]`}>{sentConfig.label}</Badge>}
                          {interaction.emotion_detected && (
                            <Badge variant="outline" className="text-[10px]">
                              {EMOTION_LABELS[interaction.emotion_detected] || interaction.emotion_detected}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">
                          {client?.first_name || interaction.client_name}
                          {client?.clinic_name ? ` · ${client.clinic_name}` : ''}
                          {interaction.created_date ? ` · ${new Date(interaction.created_date).toLocaleDateString('pt-BR')}` : ''}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => analyzeInteraction(interaction)}
                      disabled={analyzingId === interaction.id}
                      className="shrink-0 h-7 text-xs"
                    >
                      {analyzingId === interaction.id
                        ? <Loader2 className="w-3 h-3 animate-spin" />
                        : <><Brain className="w-3 h-3 mr-1" />{interaction.sentiment ? 'Reanalisar' : 'Analisar'}</>
                      }
                    </Button>
                  </div>

                  {interaction.notes && (
                    <p className="text-xs text-slate-600 bg-slate-50 rounded-lg p-2 line-clamp-2">{interaction.notes}</p>
                  )}

                  {scorePercent !== null && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>😞 Negativo</span>
                        <span>Score: {scorePercent.toFixed(0)}%</span>
                        <span>😊 Positivo</span>
                      </div>
                      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            interaction.sentiment === 'positive' ? 'bg-green-500' :
                            interaction.sentiment === 'negative' ? 'bg-red-500' : 'bg-gray-400'
                          }`}
                          style={{ width: `${scorePercent}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {interaction.sentiment_keywords?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {interaction.sentiment_keywords.map((kw, i) => (
                        <span key={i} className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded">{kw}</span>
                      ))}
                    </div>
                  )}

                  {(interaction.ai_summary || suggestion?.next_approach_suggestion) && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                      <p className="text-[10px] font-semibold text-amber-700 mb-1 flex items-center gap-1">
                        <Lightbulb className="w-3 h-3" /> Sugestão de Abordagem IA:
                      </p>
                      <p className="text-xs text-amber-800">{suggestion?.next_approach_suggestion || interaction.ai_summary}</p>
                    </div>
                  )}

                  {suggestion?.risk_alerts?.map((alert, i) => (
                    <div key={i} className="flex items-start gap-1.5 bg-red-50 border border-red-200 rounded-lg p-2">
                      <AlertCircle className="w-3 h-3 text-red-500 mt-0.5 shrink-0" />
                      <p className="text-[10px] text-red-700">{alert}</p>
                    </div>
                  ))}

                  {suggestion?.opportunities?.map((opp, i) => (
                    <div key={i} className="flex items-start gap-1.5 bg-green-50 border border-green-200 rounded-lg p-2">
                      <CheckCircle className="w-3 h-3 text-green-500 mt-0.5 shrink-0" />
                      <p className="text-[10px] text-green-700">{opp}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
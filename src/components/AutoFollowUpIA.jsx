import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Zap, Check, ChevronDown, ChevronUp, Save, MessageCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const CHANNEL_ICON = { whatsapp: '📱', email: '📧', telefone: '📞', visita: '🏥', notification: '🔔' };
const PRIORITY_COLOR = { alta: 'bg-red-100 text-red-700', media: 'bg-yellow-100 text-yellow-700', baixa: 'bg-slate-100 text-slate-600' };

export default function AutoFollowUpIA({ client, visits = [], tasks = [] }) {
  const [loading, setLoading] = useState(false);
  const [sequence, setSequence] = useState(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState({});
  const queryClient = useQueryClient();

  // Busca interações recentes para contexto mais rico
  const { data: interactions = [] } = useQuery({
    queryKey: ['interactions-followup', client?.id],
    queryFn: () => client ? base44.entities.Interaction.filter({ client_id: client.id }) : [],
    enabled: !!client?.id
  });

  const { data: existingSequences = [] } = useQuery({
    queryKey: ['followup-sequences', client?.id],
    queryFn: () => base44.entities.FollowUpSequence.list(),
    enabled: !!client?.id
  });

  const gerarSequencia = async () => {
    if (!client) { toast.error('Selecione um cliente'); return; }
    setLoading(true);
    setSequence(null);

    // Determinar intensidade pelo score
    const score = client.purchase_score || 0;
    const intensity = score >= 70 ? 'AGRESSIVO (fechamento rápido, 5-7 contatos em 14 dias)' 
      : score >= 40 ? 'MODERADO (nutrir + converter, 6-8 contatos em 21 dias)' 
      : 'NURTURING (reaquecimento gradual, 5-7 contatos em 30 dias)';

    // Histórico de interações
    const interactionSummary = interactions.slice(0, 5).map(i =>
      `${i.type} (${i.direction}) — ${i.outcome || 'neutro'} — ${i.subject || ''}`
    ).join(' | ') || 'sem histórico';

    try {
      // Executa em paralelo: score preditivo + geração da sequência
      const [scoreData, result] = await Promise.all([
        base44.functions.invoke('predictiveLeadScoring', {
          action: 'calculate_score',
          client_id: client.id,
          client_data: {
            status: client.status,
            pipeline_stage: client.pipeline_stage,
            purchase_score: score,
            health_score: client.health_score,
            client_type: client.client_type,
            current_volume: client.current_volume,
            available_budget: client.available_budget,
            last_contact_date: client.last_contact_date,
            total_visits_count: client.total_visits_count,
            numerology_number: client.numerology_number
          }
        }).catch(() => ({ data: null })),
        base44.integrations.Core.InvokeLLM({
          prompt: `MÉTODO NR22 — FOLLOW-UP SEQUENCE AUTOMÁTICA AVANÇADA

CLIENTE: ${client.first_name} | ${client.clinic_name || 'N/A'} | ${client.city || 'N/A'}
SCORE: ${score}% → ESTRATÉGIA: ${intensity}
STATUS: ${client.status} | PIPELINE: ${client.pipeline_stage || 'lead'}
NUMEROLOGIA: ${client.numerology_number} | TOM: ${client.client_tone || 'N/A'}
EQUIP. INTERESSE: ${client.equipment_interest || 'N/A'} | VOLUME: ${client.current_volume || 'N/A'}
ORÇAMENTO: R$${client.available_budget || 'N/A'} | PRAZO DECISÃO: ${client.decision_deadline || 'N/A'}
DORES: ${client.main_pains?.join(', ') || 'N/A'}
OBJEÇÕES REAIS: ${client.real_objections?.join(', ') || 'N/A'}
MOTIVADORES: ${client.purchase_motivators?.join(', ') || 'N/A'}
HISTÓRICO INTERAÇÕES: ${interactionSummary}
VISITAS: ${visits.length} | ÚLTIMO CONTATO: ${client.last_contact_date || 'nunca'}
TAREFAS PENDENTES: ${tasks.filter(t => t.status === 'pendente').length}
PRÓX. AÇÃO IA: ${client.ai_next_best_action || client.next_action || 'N/A'}
GATILHOS JÁ USADOS: ${client.triggers_used?.join(', ') || 'nenhum'}

Com base no Método NR22 (SPIN Selling + Cialdini + Numerologia Pitagórica + Neurovendas), crie uma sequência de follow-up PERSONALIZADA com 6-8 passos.

REGRAS:
- Adapte CADA mensagem ao perfil numerológico ${client.numerology_number}
- Alterne canais estrategicamente (não repita o mesmo canal 2x seguidas)
- Use gatilhos Cialdini DIFERENTES em cada passo
- Nunca mencione desconto — ofereça bonificação em insumos
- Inclua: 25 meses garantia, manutenção vitalícia, ISO 13485:2016 nos momentos certos
- Mensagens prontas para copiar e enviar imediatamente

Para cada passo retorne:
- day_offset: dias após hoje (0=hoje, 1=amanhã, etc)
- channel: whatsapp | email | telefone | visita
- subject: título/assunto do contato
- message: MENSAGEM COMPLETA pronta para usar (personalizada, não genérica)
- goal: objetivo específico deste passo
- trigger: gatilho Cialdini utilizado
- priority: alta | media | baixa
- if_no_response: o que fazer se não houver resposta`,
          response_json_schema: {
            type: 'object',
            properties: {
              strategy_name: { type: 'string' },
              rationale: { type: 'string' },
              intensity: { type: 'string' },
              conversion_window: { type: 'string' },
              steps: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    day_offset: { type: 'number' },
                    channel: { type: 'string' },
                    subject: { type: 'string' },
                    message: { type: 'string' },
                    goal: { type: 'string' },
                    trigger: { type: 'string' },
                    priority: { type: 'string' },
                    if_no_response: { type: 'string' }
                  }
                }
              },
              success_indicators: { type: 'array', items: { type: 'string' } },
              philosophical_note: { type: 'string' }
            }
          }
        })
      ]);

      setSequence({ ...result, scoreData: scoreData?.data });
    } catch (e) {
      toast.error('Erro ao gerar sequência');
    } finally {
      setLoading(false);
    }
  };

  const criarNosCRM = async () => {
    if (!sequence?.steps) return;
    setCreating(true);
    try {
      const today = new Date();
      const tasksToCreate = sequence.steps.map(step => ({
        client_id: client.id,
        client_name: client.first_name,
        title: `[${step.channel.toUpperCase()}] ${step.subject}`,
        description: `${step.message}\n\n🎯 Objetivo: ${step.goal}\n⚡ Gatilho: ${step.trigger}\n📌 Se não responder: ${step.if_no_response || 'aguardar próximo passo'}`,
        type: step.channel === 'visita' ? 'visita' : step.channel === 'telefone' ? 'ligacao' : step.channel === 'email' ? 'email' : 'follow_up',
        priority: step.priority === 'alta' ? 'alta' : step.priority === 'baixa' ? 'baixa' : 'media',
        due_date: new Date(today.getTime() + step.day_offset * 86400000).toISOString().split('T')[0],
        status: 'pendente',
        auto_created: true
      }));

      // Cria tarefas + salva sequência no CRM em paralelo
      await Promise.all([
        ...tasksToCreate.map(t => base44.entities.Task.create(t)),
        base44.entities.FollowUpSequence.create({
          name: sequence.strategy_name,
          trigger_type: 'manual',
          trigger_days: 0,
          target_status: [client.status],
          active: true,
          steps: sequence.steps.map(s => ({
            day_offset: s.day_offset,
            channel: s.channel,
            subject: s.subject,
            message_template: s.message,
            use_numerology: true
          }))
        })
      ]);

      // Atualiza next_best_action no cliente
      await base44.entities.Client.update(client.id, {
        next_action: sequence.steps[0]?.subject || 'Follow-up NR22',
        ai_next_best_action: sequence.rationale
      });

      queryClient.invalidateQueries(['client-tasks']);
      queryClient.invalidateQueries(['followup-sequences']);
      toast.success(`✅ ${tasksToCreate.length} tarefas + sequência criadas no CRM!`);
    } catch (e) {
      toast.error('Erro ao criar no CRM');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-800">🔄 Follow-up Automático IA</p>
          <p className="text-xs text-slate-500">
            {client
              ? `Score ${client.purchase_score || 0}% → ${(client.purchase_score || 0) >= 70 ? 'Estratégia AGRESSIVA' : (client.purchase_score || 0) >= 40 ? 'Estratégia MODERADA' : 'Estratégia NURTURING'}`
              : 'Selecione um cliente para gerar'}
          </p>
        </div>
        <Button size="sm" onClick={gerarSequencia} disabled={loading || !client} className="bg-indigo-600 hover:bg-indigo-700 h-8 text-xs">
          {loading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Zap className="w-3 h-3 mr-1" />}
          {loading ? 'Gerando...' : 'Gerar Sequência'}
        </Button>
      </div>

      {!client && (
        <Card className="bg-slate-50 border-dashed">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-slate-500">Selecione um cliente na aba Chat para gerar uma sequência personalizada</p>
          </CardContent>
        </Card>
      )}

      {loading && (
        <Card>
          <CardContent className="p-4 text-center space-y-2">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-600 mx-auto" />
            <p className="text-xs text-slate-500">NR22 analisando score, numerologia e histórico...</p>
            <div className="flex justify-center gap-2 text-[10px] text-slate-400">
              <span>⚡ Score preditivo</span>
              <span>·</span>
              <span>🔢 Numerologia</span>
              <span>·</span>
              <span>🎯 Cialdini</span>
            </div>
          </CardContent>
        </Card>
      )}

      {sequence && (
        <div className="space-y-2">
          {/* Header da estratégia */}
          <Card className="bg-gradient-to-r from-indigo-600 to-purple-700 border-0">
            <CardContent className="p-3">
              <p className="text-xs font-bold text-white">{sequence.strategy_name}</p>
              <p className="text-[10px] text-indigo-200 mt-0.5">{sequence.rationale}</p>
              <div className="flex gap-2 mt-1.5 flex-wrap">
                {sequence.intensity && <Badge className="bg-white/20 text-white text-[9px]">⚡ {sequence.intensity}</Badge>}
                {sequence.conversion_window && <Badge className="bg-white/20 text-white text-[9px]">📅 {sequence.conversion_window}</Badge>}
              </div>
            </CardContent>
          </Card>

          {/* Score preditivo se disponível */}
          {sequence.scoreData && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-2.5 flex items-center gap-3">
                <div className="text-center">
                  <p className="text-lg font-bold text-green-700">{Math.round(sequence.scoreData.conversion_probability || 0)}%</p>
                  <p className="text-[9px] text-green-600">Conversão IA</p>
                </div>
                <div className="flex-1 text-[10px] text-green-700">{sequence.scoreData.next_best_action}</div>
              </CardContent>
            </Card>
          )}

          {/* Passos da sequência */}
          {sequence.steps?.map((step, i) => (
            <Card key={i} className={`border-l-4 ${step.priority === 'alta' ? 'border-l-red-400' : step.priority === 'baixa' ? 'border-l-slate-300' : 'border-l-yellow-400'}`}>
              <CardContent className="p-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700 shrink-0">{i + 1}</div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs">{CHANNEL_ICON[step.channel] || '📌'}</span>
                        <span className="text-xs font-medium text-slate-800">{step.subject}</span>
                        <Badge className={`text-[9px] h-4 ${PRIORITY_COLOR[step.priority] || PRIORITY_COLOR.media}`}>{step.priority}</Badge>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">Dia +{step.day_offset} · 🧲 {step.trigger}</p>
                    </div>
                  </div>
                  <button onClick={() => setExpanded(prev => ({ ...prev, [i]: !prev[i] }))} className="text-slate-400 shrink-0">
                    {expanded[i] ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {expanded[i] && (
                  <div className="mt-2 space-y-1.5 pt-2 border-t border-slate-100">
                    <div className="bg-blue-50 rounded p-2">
                      <p className="text-[10px] text-blue-500 font-semibold mb-0.5">📋 MENSAGEM PRONTA</p>
                      <p className="text-xs text-blue-800 whitespace-pre-wrap">{step.message}</p>
                      <div className="flex gap-2 mt-1.5">
                        <button onClick={() => { navigator.clipboard.writeText(step.message); toast.success('Copiado!'); }}
                          className="text-[10px] text-blue-600 hover:text-blue-800 font-medium">📋 Copiar</button>
                        {client?.phone && step.channel === 'whatsapp' && (
                          <a href={`https://wa.me/${client.phone}?text=${encodeURIComponent(step.message)}`} target="_blank" rel="noreferrer"
                            className="text-[10px] text-green-600 hover:text-green-800 font-medium">📱 Abrir WA</a>
                        )}
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500">🎯 <strong>Objetivo:</strong> {step.goal}</p>
                    {step.if_no_response && (
                      <p className="text-[10px] text-orange-500">⚠️ <strong>Sem resposta:</strong> {step.if_no_response}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {/* Indicadores de sucesso */}
          {sequence.success_indicators?.length > 0 && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-2.5">
                <p className="text-[10px] font-bold text-green-700 mb-1">✅ INDICADORES DE SUCESSO</p>
                <ul className="space-y-0.5">
                  {sequence.success_indicators.map((s, i) => (
                    <li key={i} className="text-[10px] text-green-800 flex gap-1"><span>→</span>{s}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Frase filosófica */}
          {sequence.philosophical_note && (
            <p className="text-[10px] text-slate-400 italic text-center px-4">"{sequence.philosophical_note}"</p>
          )}

          {/* Botão criar no CRM */}
          <Button onClick={criarNosCRM} disabled={creating} className="w-full bg-green-600 hover:bg-green-700 h-9 text-sm">
            {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
            {creating ? 'Salvando no CRM...' : `Criar ${sequence.steps?.length} tarefas + sequência no CRM`}
          </Button>

          <Button onClick={gerarSequencia} variant="outline" size="sm" className="w-full h-7 text-xs">
            <RefreshCw className="w-3 h-3 mr-1" /> Regenerar sequência
          </Button>
        </div>
      )}
    </div>
  );
}
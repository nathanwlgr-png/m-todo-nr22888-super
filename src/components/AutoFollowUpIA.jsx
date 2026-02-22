import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Zap, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

export default function AutoFollowUpIA({ client, visits = [], tasks = [] }) {
  const [loading, setLoading] = useState(false);
  const [sequence, setSequence] = useState(null);
  const [creating, setCreating] = useState(false);
  const [expanded, setExpanded] = useState({});

  const gerarSequencia = async () => {
    if (!client) { toast.error('Selecione um cliente'); return; }
    setLoading(true);
    setSequence(null);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `MÉTODO NR22 — FOLLOW-UP SEQUENCE AUTOMÁTICA

Cliente: ${client.first_name} | Clínica: ${client.clinic_name || 'N/A'} | Cidade: ${client.city || 'N/A'}
Score: ${client.purchase_score || 0}% | Status: ${client.status} | Pipeline: ${client.pipeline_stage || 'lead'}
Numerologia: ${client.numerology_number} | Tom: ${client.client_tone || 'N/A'}
Dores: ${client.main_pains?.join(', ') || 'N/A'}
Objeções: ${client.real_objections?.join(', ') || 'N/A'}
Motivadores: ${client.purchase_motivators?.join(', ') || 'N/A'}
Visitas: ${visits.length} | Tarefas pendentes: ${tasks.filter(t=>t.status==='pendente').length}
Último contato: ${client.last_contact_date || 'desconhecido'}
Interesse: ${client.equipment_interest || 'N/A'} | Volume: ${client.current_volume || 'N/A'}

Baseado no score (${client.purchase_score||0}%) e histórico, crie uma sequência de follow-up inteligente com 5-7 passos.
Para cada passo retorne:
- day_offset: dias após hoje
- channel: whatsapp | email | telefone | visita
- subject: assunto/título do contato
- message: mensagem PRONTA para copiar (adaptada ao perfil numerológico ${client.numerology_number})
- goal: objetivo deste passo
- trigger: gatilho mental Cialdini usado
- priority: alta | media | baixa

Adapte a intensidade ao score: score>70=agressivo, 40-70=moderado, <40=nurturing leve.`,
        response_json_schema: {
          type: 'object',
          properties: {
            strategy_name: { type: 'string' },
            rationale: { type: 'string' },
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
                  priority: { type: 'string' }
                }
              }
            }
          }
        }
      });
      setSequence(result);
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
        description: step.message,
        type: step.channel === 'visita' ? 'visita' : step.channel === 'telefone' ? 'ligacao' : step.channel,
        priority: step.priority === 'alta' ? 'alta' : step.priority === 'baixa' ? 'baixa' : 'media',
        due_date: new Date(today.getTime() + step.day_offset * 86400000).toISOString().split('T')[0],
        status: 'pendente',
        auto_created: true
      }));
      await Promise.all(tasksToCreate.map(t => base44.entities.Task.create(t)));
      toast.success(`✅ ${tasksToCreate.length} tarefas criadas no CRM!`);
    } catch (e) {
      toast.error('Erro ao criar tarefas');
    } finally {
      setCreating(false);
    }
  };

  const channelIcon = { whatsapp: '📱', email: '📧', telefone: '📞', visita: '🏥' };
  const priorityColor = { alta: 'bg-red-100 text-red-700', media: 'bg-yellow-100 text-yellow-700', baixa: 'bg-slate-100 text-slate-600' };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-800">🔄 Follow-up Automático IA</p>
          <p className="text-xs text-slate-500">Sequência personalizada por score + perfil numerológico</p>
        </div>
        <Button size="sm" onClick={gerarSequencia} disabled={loading || !client} className="bg-indigo-600 hover:bg-indigo-700 h-8 text-xs">
          {loading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Zap className="w-3 h-3 mr-1" />}
          {loading ? 'Gerando...' : 'Gerar Sequência'}
        </Button>
      </div>

      {sequence && (
        <div className="space-y-2">
          <Card className="bg-indigo-50 border-indigo-200">
            <CardContent className="p-3">
              <p className="text-xs font-bold text-indigo-800">{sequence.strategy_name}</p>
              <p className="text-xs text-indigo-600 mt-0.5">{sequence.rationale}</p>
            </CardContent>
          </Card>

          {sequence.steps?.map((step, i) => (
            <Card key={i} className="border-slate-200">
              <CardContent className="p-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700 shrink-0">{i+1}</div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs">{channelIcon[step.channel] || '📌'}</span>
                        <span className="text-xs font-medium text-slate-800">{step.subject}</span>
                        <Badge className={`text-[9px] h-4 ${priorityColor[step.priority] || priorityColor.media}`}>{step.priority}</Badge>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">Dia +{step.day_offset} · {step.trigger}</p>
                    </div>
                  </div>
                  <button onClick={() => setExpanded(prev => ({ ...prev, [i]: !prev[i] }))} className="text-slate-400 shrink-0">
                    {expanded[i] ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
                {expanded[i] && (
                  <div className="mt-2 space-y-1.5">
                    <div className="bg-blue-50 rounded p-2">
                      <p className="text-[10px] text-blue-500 font-semibold">MENSAGEM PRONTA</p>
                      <p className="text-xs text-blue-800 mt-0.5 whitespace-pre-wrap">{step.message}</p>
                      <button onClick={() => { navigator.clipboard.writeText(step.message); toast.success('Copiado!'); }}
                        className="mt-1 text-[10px] text-blue-600 hover:text-blue-800 font-medium">📋 Copiar</button>
                    </div>
                    <p className="text-[10px] text-slate-500">🎯 Objetivo: {step.goal}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          <Button onClick={criarNosCRM} disabled={creating} className="w-full bg-green-600 hover:bg-green-700 h-9 text-sm">
            {creating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
            {creating ? 'Criando tarefas...' : `Criar ${sequence.steps?.length} tarefas no CRM`}
          </Button>
        </div>
      )}
    </div>
  );
}
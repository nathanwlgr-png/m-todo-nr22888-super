import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, Mail, Phone, Calendar, FileText, TrendingUp, Clock, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useSafeAI } from '@/components/GlobalAIProtection';

export default function ProactiveSalesAutomation({ client, visits = [], interactions = [] }) {
  const { safeInvokeLLM, limitReached } = useSafeAI();
  const [analyzing, setAnalyzing] = useState(false);
  const [recommendations, setRecommendations] = useState(null);
  const [executing, setExecuting] = useState({});

  useEffect(() => {
    if (client) analyzeProactively();
  }, [client?.id]);

  const analyzeProactively = async () => {
    if (!client || analyzing) return;
    
    setAnalyzing(true);
    try {
      const lastInteraction = interactions[0];
      const daysSinceContact = lastInteraction 
        ? Math.floor((Date.now() - new Date(lastInteraction.created_date).getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      const analysis = await safeInvokeLLM(
        `ANÁLISE PROATIVA DE VENDAS - ${client.first_name}

DADOS DO CLIENTE:
- Nome Decisor: ${client.first_name || '[Nome não definido - NÃO preencher]'}
- Clínica: ${client.clinic_name || 'Não informada'}
- Status: ${client.status} | Score: ${client.purchase_score}%
- Pipeline: ${client.pipeline_stage || 'lead'}
- Última interação: há ${daysSinceContact} dias
- Visitas: ${visits.length} | Interações: ${interactions.length}
- Dores: ${client.main_pains?.join(', ') || 'Não identificadas'}
- Objeções: ${client.real_objections?.join(', ') || 'Nenhuma'}
- Equipamento interesse: ${client.equipment_interest || 'Não definido'}

IMPORTANTE: Se o nome do decisor não estiver disponível, use APENAS "contato" ou "você" nas mensagens. NUNCA invente nomes ou use placeholders genéricos.

HISTÓRICO COMPORTAMENTAL:
- Melhor canal: ${client.communication_preferences?.preferred_channel || 'WhatsApp'}
- Melhor horário: ${client.communication_preferences?.preferred_time || 'manhã'}
- Tom preferido: ${client.client_tone || 'profissional'}

FORNEÇA AÇÕES AUTOMATIZÁVEIS IMEDIATAS:

1. EMAIL AUTOMATIZADO (se aplicável)
   - Enviar? (sim/não)
   - Assunto: [sugestão]
   - Corpo: [texto completo pronto]
   - Momento ideal: [quando enviar]

2. LIGAÇÃO AGENDADA
   - Agendar? (sim/não)
   - Data sugerida: [YYYY-MM-DD]
   - Horário ideal: [HH:MM]
   - Roteiro: [pontos a abordar]

3. TAREFAS AUTO-CRIADAS (3-5 tarefas)
   - [Tarefa 1]: título, descrição, prazo
   - [Tarefa 2]: título, descrição, prazo

4. FOLLOW-UP WHATSAPP
   - Enviar? (sim/não)
   - Mensagem: [texto completo]
   - Timing: [quando]

5. RELATÓRIO PERSONALIZADO
   - Gerar? (sim/não)
   - Foco: [análise de conversão/próximos passos]

6. TIMING ÓTIMO
   - Melhor dia da semana: [dia]
   - Melhor horário: [horário]
   - Razão: [por que este timing]

Seja ULTRA-ESPECÍFICO e ACIONÁVEL.`,
        {
          cacheKey: `proactive_${client.id}_${daysSinceContact}`,
          jsonSchema: {
            type: "object",
            properties: {
              email: {
                type: "object",
                properties: {
                  enviar: { type: "boolean" },
                  assunto: { type: "string" },
                  corpo: { type: "string" },
                  momento: { type: "string" }
                }
              },
              ligacao: {
                type: "object",
                properties: {
                  agendar: { type: "boolean" },
                  data: { type: "string" },
                  horario: { type: "string" },
                  roteiro: { type: "array", items: { type: "string" } }
                }
              },
              tarefas: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    titulo: { type: "string" },
                    descricao: { type: "string" },
                    prazo_dias: { type: "number" },
                    tipo: { type: "string" }
                  }
                }
              },
              whatsapp: {
                type: "object",
                properties: {
                  enviar: { type: "boolean" },
                  mensagem: { type: "string" },
                  timing: { type: "string" }
                }
              },
              relatorio: {
                type: "object",
                properties: {
                  gerar: { type: "boolean" },
                  foco: { type: "string" },
                  insights: { type: "array", items: { type: "string" } }
                }
              },
              timing_otimo: {
                type: "object",
                properties: {
                  dia_semana: { type: "string" },
                  horario: { type: "string" },
                  razao: { type: "string" }
                }
              }
            }
          },
          fallback: {
            email: { enviar: false },
            ligacao: { agendar: false },
            tarefas: [],
            whatsapp: { enviar: false },
            relatorio: { gerar: false },
            timing_otimo: { dia_semana: "Segunda", horario: "09:00", razao: "Horário padrão" }
          }
        }
      );

      setRecommendations(analysis);
    } catch (error) {
      console.error('Erro análise proativa:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const executeAction = async (action) => {
    setExecuting(prev => ({ ...prev, [action]: true }));

    try {
      switch (action) {
        case 'email':
          await base44.integrations.Core.SendEmail({
            to: client.email,
            subject: recommendations.email.assunto,
            body: recommendations.email.corpo
          });
          toast.success('📧 Email enviado!');
          break;

        case 'ligacao':
          const callDate = new Date(recommendations.ligacao.data + 'T' + recommendations.ligacao.horario);
          await base44.entities.Task.create({
            client_id: client.id,
            client_name: client.first_name,
            title: 'Ligação Agendada',
            description: `Roteiro:\n${recommendations.ligacao.roteiro.join('\n')}`,
            type: 'ligacao',
            priority: 'alta',
            due_date: callDate.toISOString().split('T')[0]
          });
          toast.success('📞 Ligação agendada!');
          break;

        case 'tarefas':
          const tasksToCreate = recommendations.tarefas.map(t => ({
            client_id: client.id,
            client_name: client.first_name,
            title: t.titulo,
            description: t.descricao,
            type: t.tipo || 'follow_up',
            priority: 'media',
            due_date: new Date(Date.now() + t.prazo_dias * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            auto_created: true
          }));
          await Promise.all(tasksToCreate.map(t => base44.entities.Task.create(t)));
          toast.success(`✅ ${tasksToCreate.length} tarefas criadas!`);
          break;

        case 'whatsapp':
          if (client.phone) {
            const msg = encodeURIComponent(recommendations.whatsapp.mensagem);
            window.open(`https://wa.me/${client.phone}?text=${msg}`, '_blank');
            toast.success('💬 WhatsApp aberto!');
          }
          break;

        case 'relatorio':
          const report = `RELATÓRIO PERSONALIZADO - ${client.first_name}\n\n` +
            `Foco: ${recommendations.relatorio.foco}\n\n` +
            `Insights:\n${recommendations.relatorio.insights.map((i, idx) => `${idx + 1}. ${i}`).join('\n')}`;
          
          await base44.entities.ClientDocument.create({
            client_id: client.id,
            title: `Relatório Proativo - ${new Date().toLocaleDateString()}`,
            content: report,
            type: 'relatorio'
          });
          toast.success('📊 Relatório gerado!');
          break;
      }
    } catch (error) {
      toast.error('Erro ao executar ação');
    } finally {
      setExecuting(prev => ({ ...prev, [action]: false }));
    }
  };

  if (!client) return null;

  return (
    <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-300 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-5 h-5 text-indigo-600" />
        <h3 className="font-bold text-indigo-900">Automação Proativa</h3>
        {analyzing && <Badge variant="outline" className="text-indigo-600">Analisando...</Badge>}
      </div>

      {!recommendations ? (
        <Button onClick={analyzeProactively} disabled={analyzing} className="w-full">
          <TrendingUp className="w-4 h-4 mr-2" />
          Analisar & Automatizar
        </Button>
      ) : (
        <div className="space-y-3">
          {/* Email */}
          {recommendations.email.enviar && (
            <Card className="p-3 bg-white border border-blue-200">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-semibold text-slate-800">Email Automatizado</span>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => executeAction('email')}
                  disabled={executing.email || !client.email}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {executing.email ? '...' : 'Enviar'}
                </Button>
              </div>
              <p className="text-xs text-slate-600 mb-1"><strong>Assunto:</strong> {recommendations.email.assunto}</p>
              <p className="text-xs text-slate-600"><strong>Timing:</strong> {recommendations.email.momento}</p>
            </Card>
          )}

          {/* Ligação */}
          {recommendations.ligacao.agendar && (
            <Card className="p-3 bg-white border border-green-200">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-semibold text-slate-800">Ligação Agendada</span>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => executeAction('ligacao')}
                  disabled={executing.ligacao}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {executing.ligacao ? '...' : 'Agendar'}
                </Button>
              </div>
              <p className="text-xs text-slate-600">
                <strong>{recommendations.ligacao.data}</strong> às <strong>{recommendations.ligacao.horario}</strong>
              </p>
            </Card>
          )}

          {/* Tarefas */}
          {recommendations.tarefas.length > 0 && (
            <Card className="p-3 bg-white border border-purple-200">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-semibold text-slate-800">{recommendations.tarefas.length} Tarefas Auto</span>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => executeAction('tarefas')}
                  disabled={executing.tarefas}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {executing.tarefas ? '...' : 'Criar'}
                </Button>
              </div>
              <div className="text-xs text-slate-600 space-y-1">
                {recommendations.tarefas.slice(0, 3).map((t, i) => (
                  <p key={i}>• {t.titulo}</p>
                ))}
              </div>
            </Card>
          )}

          {/* WhatsApp */}
          {recommendations.whatsapp.enviar && (
            <Card className="p-3 bg-white border border-emerald-200">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">💬</span>
                  <span className="text-sm font-semibold text-slate-800">WhatsApp</span>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => executeAction('whatsapp')}
                  disabled={executing.whatsapp}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  Abrir
                </Button>
              </div>
              <p className="text-xs text-slate-600">{recommendations.whatsapp.timing}</p>
            </Card>
          )}

          {/* Relatório */}
          {recommendations.relatorio.gerar && (
            <Card className="p-3 bg-white border border-orange-200">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-semibold text-slate-800">Relatório Personalizado</span>
                </div>
                <Button 
                  size="sm" 
                  onClick={() => executeAction('relatorio')}
                  disabled={executing.relatorio}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  Gerar
                </Button>
              </div>
              <p className="text-xs text-slate-600">{recommendations.relatorio.foco}</p>
            </Card>
          )}

          {/* Timing Ótimo */}
          <Card className="p-3 bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-cyan-600" />
              <span className="text-sm font-semibold text-slate-800">Timing Ótimo</span>
            </div>
            <p className="text-xs text-slate-700">
              <strong>{recommendations.timing_otimo.dia_semana}</strong> às <strong>{recommendations.timing_otimo.horario}</strong>
            </p>
            <p className="text-xs text-slate-600 mt-1">{recommendations.timing_otimo.razao}</p>
          </Card>

          <Button 
            onClick={analyzeProactively} 
            variant="outline" 
            size="sm"
            className="w-full"
            disabled={analyzing}
          >
            🔄 Reanalisar
          </Button>
        </div>
      )}
    </Card>
  );
}
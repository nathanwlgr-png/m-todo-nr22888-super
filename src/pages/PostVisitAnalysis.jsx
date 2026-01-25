import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft, 
  Sparkles,
  AlertTriangle,
  Target,
  MessageCircle,
  TrendingUp,
  Lightbulb,
  Loader2,
  Save,
  Brain,
  Plus,
  Trash2,
  Calendar,
  Mail,
  Phone,
  Clock,
  AlertCircle,
  Users
} from 'lucide-react';
import LabNeedsEditor from '@/components/LabNeedsEditor';
import CommunicationPreferencesEditor from '@/components/CommunicationPreferencesEditor';
import ClientDataEditor from '@/components/ClientDataEditor';
import EquipmentReviewsGenerator from '@/components/EquipmentReviewsGenerator';
import { toast } from 'sonner';

export default function PostVisitAnalysis() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const clientId = urlParams.get('id');
  
  const [visitNotes, setVisitNotes] = useState('');
  const [objections, setObjections] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [nextSteps, setNextSteps] = useState([{ action: '', deadline: '' }]);
  const [followupSuggestions, setFollowupSuggestions] = useState(null);

  const { data: client, isLoading } = useQuery({
    queryKey: ['client', clientId],
    queryFn: async () => {
      const clients = await base44.entities.Client.filter({ id: clientId });
      return clients[0];
    },
    enabled: !!clientId
  });

  const { data: visits = [] } = useQuery({
    queryKey: ['client-visits', clientId],
    queryFn: () => base44.entities.Visit.filter({ client_id: clientId }),
    enabled: !!clientId
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Client.update(clientId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['client', clientId]);
      navigate(createPageUrl(`ClientProfile?id=${clientId}`));
    }
  });

  const generateAnalysis = async () => {
    setLoading(true);

    const prompt = `
ANÁLISE PÓS-VISITA ESTRATÉGICA - MÉTODO NUMEROLOGIA PITAGÓRICA

DADOS DO CLIENTE:
- Nome: ${client.first_name} (${client.full_name || 'Não informado'})
- Número do Nome: ${client.numerology_number} - ${client.behavioral_profile}
- Caminho de Vida: ${client.life_path_number || 'Não informado'}
- Estilo de Decisão: ${client.decision_style}
- Tom observado: ${client.client_tone || 'Não observado'}
- Tipo: ${client.client_type}
- Decisor: ${client.decision_role}
- Status atual: ${client.status}
- Score de compra: ${client.purchase_score}%

HISTÓRICO:
- Total de visitas: ${visits.length}
- Última visita: ${client.last_visit_date || 'Primeira visita'}
- Dores identificadas: ${client.main_pains?.join(', ') || 'Não identificadas'}
- Gatilhos usados: ${client.triggers_used?.join(', ') || 'Nenhum'}

VISITA ATUAL:
Notas: ${visitNotes}
Objeções levantadas: ${objections || 'Nenhuma objeção registrada'}

FRAMEWORKS ESTRATÉGICOS:
Use os seguintes livros como base:
1. A Arte da Guerra (Sun Tzu): Estratégia, timing, conhecer o oponente (objeções)
2. SPIN Selling (Neil Rackham): Situation, Problem, Implication, Need-Payoff
3. As Armas da Persuasão (Cialdini): Reciprocidade, compromisso, prova social, autoridade, simpatia, escassez
4. Inteligência Emocional (Goleman): Autoconhecimento, empatia, motivação, autorregulação

TAREFA:
Com base na Numerologia Pitagórica + Frameworks acima, faça uma análise COMPLETA em formato JSON com:

1. impedimentos: Array com 3 principais fatores que estão impedindo o fechamento (seja específico e honesto)

2. controle_objecao: Objeto com:
   - tecnica_principal: Técnica específica combinando Persuasão (Cialdini) + Numerologia + Inteligência Emocional
   - abordagem_tom: Como adaptar ao tom de voz observado
   - frase_exemplo: Frase pronta usando SPIN Selling
   - framework_usado: Qual framework usar (Arte da Guerra/SPIN/Persuasão/Int. Emocional)

3. nova_estrategia: Objeto com:
   - mudanca_necessaria: O que precisa mudar na abordagem (Arte da Guerra: adaptar estratégia)
   - melhor_tecnica: Melhor técnica combinando SPIN + Persuasão (Cialdini) + Numerologia
   - timing_ideal: Quando e como abordar (Arte da Guerra: timing perfeito)
   - canal_comunicacao: Melhor canal baseado em perfil numerológico e inteligência emocional
   - spin_approach: Qual tipo de pergunta SPIN usar (S/P/I/N)

4. dica_mestre: String com UMA dica estratégica PODEROSA combinando:
   - Arte da Guerra (estratégia vencedora)
   - SPIN Selling (tipo de pergunta ideal)
   - Persuasão Cialdini (gatilho principal a usar)
   - Inteligência Emocional (tom emocional ideal)
   - Numerologia Pitagórica (perfil comportamental)

5. proximo_passo: Ação concreta usando framework específico (ex: "Enviar WhatsApp com pergunta IMPLICATION sobre perda de clientes")

Seja EXTREMAMENTE direto, prático e multi-framework. Foque em PERSUASÃO ÉTICA e FECHAMENTO CONSULTIVO.
    `;

    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            impedimentos: {
              type: "array",
              items: { type: "string" }
            },
            controle_objecao: {
              type: "object",
              properties: {
                tecnica_principal: { type: "string" },
                abordagem_tom: { type: "string" },
                frase_exemplo: { type: "string" }
              }
            },
            nova_estrategia: {
              type: "object",
              properties: {
                mudanca_necessaria: { type: "string" },
                melhor_tecnica: { type: "string" },
                timing_ideal: { type: "string" },
                canal_comunicacao: { type: "string" }
              }
            },
            dica_mestre: { type: "string" },
            proximo_passo: { type: "string" }
          }
        }
      });

      setAnalysis(response);
      
      // Generate follow-up suggestions
      const followupResponse = await base44.integrations.Core.InvokeLLM({
        prompt: `Com base nesta análise de visita, sugira 3 ações de follow-up automáticas:

ANÁLISE:
${JSON.stringify(response)}

CLIENTE: ${client.first_name}
STATUS: ${client.status}

Retorne JSON:
{
  "sugestoes": [
    {
      "canal": "email | whatsapp | ligacao",
      "timing": "Quando enviar (ex: 'Amanhã às 10h', 'Daqui a 3 dias')",
      "mensagem": "Template de mensagem curta",
      "objetivo": "Objetivo desta ação"
    }
  ]
}`,
        response_json_schema: {
          type: "object",
          properties: {
            sugestoes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  canal: { type: "string" },
                  timing: { type: "string" },
                  mensagem: { type: "string" },
                  objetivo: { type: "string" }
                }
              }
            }
          }
        }
      });
      
      setFollowupSuggestions(followupResponse);
    } catch (error) {
      console.error('Erro ao gerar análise:', error);
      alert('Erro ao gerar análise. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const addNextStep = () => {
    setNextSteps([...nextSteps, { action: '', deadline: '' }]);
  };

  const updateNextStep = (index, field, value) => {
    const updated = [...nextSteps];
    updated[index][field] = value;
    setNextSteps(updated);
  };

  const removeNextStep = (index) => {
    setNextSteps(nextSteps.filter((_, i) => i !== index));
  };

  const saveAnalysis = async () => {
    const updateData = {
      notes: `${client.notes || ''}\n\n--- VISITA ${new Date().toLocaleDateString()} ---\n${visitNotes}\n\nObjeções: ${objections}\n\nPróximos Passos:\n${nextSteps.map(s => `- ${s.action} (até ${s.deadline})`).join('\n')}`.trim(),
      numerology_tip: analysis.dica_mestre,
      next_action: analysis.proximo_passo,
      last_visit_date: new Date().toISOString().split('T')[0]
    };

    // Create tasks for next steps
    for (const step of nextSteps.filter(s => s.action && s.deadline)) {
      await base44.entities.Task.create({
        client_id: client.id,
        client_name: client.first_name,
        title: step.action,
        due_date: step.deadline,
        type: 'follow_up',
        priority: 'alta',
        auto_created: false
      });
    }

    updateMutation.mutate(updateData);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!clientId) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <AlertCircle className="w-16 h-16 text-amber-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-800 mb-2">Cliente não selecionado</h2>
        <p className="text-slate-500 text-center mb-6">
          Você precisa selecionar um cliente antes de registrar uma visita.
        </p>
        <Button
          onClick={() => navigate(createPageUrl('Clients'))}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          <Users className="w-4 h-4 mr-2" />
          Ver Lista de Clientes
        </Button>
      </div>
    );
  }

  if (!client && !isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-800 mb-2">Cliente não encontrado</h2>
        <p className="text-slate-500 text-center mb-6">
          O cliente que você está procurando não existe no sistema.
        </p>
        <Button
          onClick={() => navigate(createPageUrl('Clients'))}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          <Users className="w-4 h-4 mr-2" />
          Voltar para Clientes
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 to-indigo-900 px-4 pt-4 pb-16 rounded-b-[2rem]">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full glass hover:bg-white/10">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-white">Análise Pós-Visita</h1>
            <p className="text-sm text-indigo-200">{client?.first_name}</p>
          </div>
        </div>
      </div>

      <div className="px-6 -mt-8 space-y-4">
        {/* Numerology Summary */}
        <Card className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">{client.numerology_number}</span>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-slate-800">{client.behavioral_profile}</p>
              <p className="text-xs text-slate-600">{client.decision_style}</p>
            </div>
            {client.life_path_number && (
              <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">{client.life_path_number}</span>
              </div>
            )}
          </div>
        </Card>

        {/* Dados do Cliente Editáveis */}
        <ClientDataEditor clientId={clientId} client={client} />

        {/* Necessidades do Laboratório */}
        <LabNeedsEditor 
          clientId={clientId} 
          currentNeeds={client.lab_needs || []} 
        />

        {/* Preferências de Comunicação */}
        <CommunicationPreferencesEditor 
          clientId={clientId} 
          currentPreferences={client.communication_preferences || {}} 
        />

        {/* Visit Notes */}
        <Card className="p-4 bg-white">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Como foi a visita?
          </label>
          <Textarea
            value={visitNotes}
            onChange={(e) => setVisitNotes(e.target.value)}
            placeholder="Descreva como foi a visita, reações do cliente, pontos principais..."
            className="min-h-[120px]"
          />
        </Card>

        {/* Objections */}
        <Card className="p-4 bg-white">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Objeções levantadas
          </label>
          <Textarea
            value={objections}
            onChange={(e) => setObjections(e.target.value)}
            placeholder="Quais objeções ou dúvidas o cliente levantou?"
            className="min-h-[100px]"
          />
        </Card>

        {/* Generate Button */}
        {!analysis && (
          <Button
            onClick={generateAnalysis}
            disabled={loading || !visitNotes}
            className="w-full h-14 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-xl text-lg font-semibold shadow-lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Analisando com IA...
              </>
            ) : (
              <>
                <Brain className="w-5 h-5 mr-2" />
                Gerar Análise Estratégica
              </>
            )}
          </Button>
        )}

        {/* Visit Summary */}
        {visitNotes && objections && (
          <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <h3 className="font-bold text-slate-800 mb-3">📋 Resumo da Visita</h3>
            <div className="space-y-2">
              <div className="bg-white rounded p-2">
                <p className="text-xs text-slate-500 mb-1">Notas</p>
                <p className="text-sm text-slate-700 line-clamp-3">{visitNotes}</p>
              </div>
              {objections && (
                <div className="bg-white rounded p-2">
                  <p className="text-xs text-slate-500 mb-1">Objeções</p>
                  <p className="text-sm text-slate-700 line-clamp-2">{objections}</p>
                </div>
              )}
              <div className="flex gap-2 text-xs">
                <div className="bg-white rounded px-2 py-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-blue-600" />
                  {new Date().toLocaleDateString()}
                </div>
                <div className="bg-white rounded px-2 py-1 flex items-center gap-1">
                  <span className="text-slate-600">Score: {client.purchase_score}%</span>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Analysis Results */}
        {analysis && (
          <>
            {/* Impedimentos */}
            <Card className="p-4 bg-red-50 border-red-200">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <h3 className="font-bold text-slate-800">Impedimentos Identificados</h3>
              </div>
              <ul className="space-y-2">
                {analysis.impedimentos.map((imp, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">→</span>
                    <span className="text-slate-700 text-sm">{imp}</span>
                  </li>
                ))}
              </ul>
            </Card>

            {/* Controle de Objeção */}
            <Card className="p-4 bg-blue-50 border-blue-200">
              <div className="flex items-center gap-2 mb-3">
                <MessageCircle className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-800">Controle de Objeção</h3>
              </div>
              
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-blue-600 font-medium mb-1">TÉCNICA PRINCIPAL</p>
                  <p className="text-slate-700 text-sm">{analysis.controle_objecao.tecnica_principal}</p>
                </div>
                
                <div>
                  <p className="text-xs text-blue-600 font-medium mb-1">ABORDAGEM DE TOM</p>
                  <p className="text-slate-700 text-sm">{analysis.controle_objecao.abordagem_tom}</p>
                </div>
                
                <div className="bg-white rounded-lg p-3 border-2 border-blue-300">
                  <p className="text-xs text-blue-600 font-medium mb-1">💬 FRASE PRONTA</p>
                  <p className="text-slate-700 text-sm italic">"{analysis.controle_objecao.frase_exemplo}"</p>
                </div>
              </div>
            </Card>

            {/* Nova Estratégia */}
            <Card className="p-4 bg-emerald-50 border-emerald-200">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-800">Nova Estratégia</h3>
              </div>
              
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-emerald-600 font-medium mb-1">MUDANÇA NECESSÁRIA</p>
                  <p className="text-slate-700 text-sm">{analysis.nova_estrategia.mudanca_necessaria}</p>
                </div>
                
                <div>
                  <p className="text-xs text-emerald-600 font-medium mb-1">MELHOR TÉCNICA</p>
                  <p className="text-slate-700 text-sm">{analysis.nova_estrategia.melhor_tecnica}</p>
                </div>
                
                <div>
                  <p className="text-xs text-emerald-600 font-medium mb-1">TIMING IDEAL</p>
                  <p className="text-slate-700 text-sm">{analysis.nova_estrategia.timing_ideal}</p>
                </div>
                
                <div>
                  <p className="text-xs text-emerald-600 font-medium mb-1">CANAL DE COMUNICAÇÃO</p>
                  <p className="text-slate-700 text-sm font-semibold">{analysis.nova_estrategia.canal_comunicacao}</p>
                </div>
              </div>
            </Card>

            {/* Dica Mestre */}
            <Card className="p-5 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-300">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-6 h-6 text-amber-600" />
                <h3 className="font-bold text-slate-800 text-lg">💡 Dica Mestre</h3>
              </div>
              <div className="bg-white rounded-lg p-4 border-2 border-amber-400">
                <p className="text-slate-700 font-medium leading-relaxed">{analysis.dica_mestre}</p>
              </div>
            </Card>

            {/* Próximo Passo */}
            <Card className="p-4 bg-purple-50 border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-slate-800">Próximo Passo</h3>
              </div>
              <p className="text-slate-700 font-semibold">{analysis.proximo_passo}</p>
            </Card>

            {/* Next Steps with Deadlines */}
            <Card className="p-4 bg-white">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-slate-800">✅ Próximos Passos Concretos</h3>
                <Button
                  onClick={addNextStep}
                  size="sm"
                  variant="outline"
                  className="border-indigo-200 text-indigo-600"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar
                </Button>
              </div>
              
              <div className="space-y-3">
                {nextSteps.map((step, i) => (
                  <div key={i} className="flex gap-2">
                    <div className="flex-1 space-y-2">
                      <Input
                        value={step.action}
                        onChange={(e) => updateNextStep(i, 'action', e.target.value)}
                        placeholder="Ação concreta (ex: Enviar proposta comercial)"
                        className="text-sm"
                      />
                      <Input
                        type="date"
                        value={step.deadline}
                        onChange={(e) => updateNextStep(i, 'deadline', e.target.value)}
                        className="text-sm"
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    {nextSteps.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeNextStep(i)}
                        className="text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            {/* Follow-up Suggestions */}
            {followupSuggestions && (
              <Card className="p-4 bg-gradient-to-r from-cyan-50 to-blue-50 border-cyan-200">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-cyan-600" />
                  <h3 className="font-bold text-slate-800">💡 Sugestões de Follow-Up</h3>
                </div>
                
                <div className="space-y-3">
                  {followupSuggestions.sugestoes.map((sug, i) => (
                    <div key={i} className="bg-white rounded-lg p-3 border-l-4 border-cyan-400">
                      <div className="flex items-center gap-2 mb-2">
                        {sug.canal === 'email' ? (
                          <Mail className="w-4 h-4 text-indigo-600" />
                        ) : sug.canal === 'whatsapp' ? (
                          <MessageCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <Phone className="w-4 h-4 text-blue-600" />
                        )}
                        <span className="text-xs font-semibold text-slate-600 uppercase">{sug.canal}</span>
                        <Clock className="w-3 h-3 text-slate-400 ml-auto" />
                        <span className="text-xs text-slate-500">{sug.timing}</span>
                      </div>
                      
                      <p className="text-sm text-slate-700 font-medium mb-1">{sug.objetivo}</p>
                      <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded italic">"{sug.mensagem}"</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Material de Equipamentos - ENVIO AUTOMÁTICO */}
            <EquipmentReviewsGenerator 
              client={client}
              onMaterialGenerated={(material) => {
                toast.success(`Material ${material.title} gerado!`);
              }}
            />

            {/* Save Button */}
            <Button
              onClick={saveAnalysis}
              disabled={updateMutation.isPending || !nextSteps.some(s => s.action && s.deadline)}
              className="w-full h-14 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 rounded-xl text-lg font-semibold shadow-lg"
            >
              {updateMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Salvar e Criar Tarefas
                </>
              )}
            </Button>
            
            {!nextSteps.some(s => s.action && s.deadline) && (
              <p className="text-xs text-amber-600 text-center -mt-2">
                ⚠️ Preencha pelo menos um próximo passo com prazo
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
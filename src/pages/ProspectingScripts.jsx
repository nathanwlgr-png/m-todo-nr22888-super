import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  ArrowLeft, 
  Loader2,
  Copy,
  Check,
  Phone,
  Mail,
  MessageCircle,
  Users,
  Sparkles
} from 'lucide-react';
import ClientSelector from '@/components/ClientSelector';

export default function ProspectingScripts() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const clientIdFromUrl = urlParams.get('id');

  const [selectedClientId, setSelectedClientId] = useState(clientIdFromUrl || null);
  const [scripts, setScripts] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(null);

  const { data: allClients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-updated_date')
  });

  const { data: client, isLoading } = useQuery({
    queryKey: ['client', selectedClientId],
    queryFn: async () => {
      const clients = await base44.entities.Client.filter({ id: selectedClientId });
      return clients[0];
    },
    enabled: !!selectedClientId
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['all-sales'],
    queryFn: () => base44.entities.Sale.list('-created_date', 100)
  });

  const generateScripts = async () => {
    setLoading(true);
    try {
      const successCases = sales
        .filter(s => s.status === 'fechada')
        .slice(0, 5)
        .map(s => `Cliente: ${s.client_name}, Equipamento: ${s.equipment_name}, Valor: R$ ${s.sale_value}`)
        .join('\n');

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um especialista em prospecção de vendas consultivas.

PERFIL DO CLIENTE:
- Nome: ${client.first_name}
- Numerologia: ${client.numerology_number} - ${client.behavioral_profile}
- Estilo de Decisão: ${client.decision_style}
- Tom: ${client.client_tone || 'Profissional'}
- Tipo: ${client.client_type}
- Decisor: ${client.decision_role}
- Dores Identificadas: ${client.main_pains?.join(', ') || 'A identificar'}
- Equipamento Atual: ${client.current_equipment || 'Nenhum'}
- Status: ${client.status} | Score: ${client.purchase_score}%

CASOS DE SUCESSO RECENTES:
${successCases || 'Dados não disponíveis'}

TAREFA:
Crie roteiros de prospecção COMPLETOS e PERSONALIZADOS em formato JSON:

{
  "telefone": {
    "abertura": "Primeiras 3 frases exatas (15 segundos)",
    "transicao": "Como fazer a transição para diagnóstico",
    "perguntas_diagnostico": ["3 perguntas SPIN essenciais"],
    "manejo_gatekeepers": "Como passar pela recepção/secretária",
    "fechamento_ligacao": "Como terminar e garantir próximo passo"
  },
  "whatsapp": {
    "primeira_mensagem": "Mensagem inicial (max 3 linhas)",
    "sequencia_followup": ["Mensagem D+1", "Mensagem D+3", "Mensagem D+7"],
    "uso_emojis": "Estratégia de emojis baseada no perfil",
    "call_to_action": "CTA ideal para este perfil"
  },
  "email": {
    "assunto": "Assunto que gera abertura",
    "corpo": "Email completo adaptado ao perfil",
    "assinatura": "Assinatura profissional",
    "ps": "P.S. estratégico (Cialdini: reciprocidade/escassez)"
  },
  "presencial": {
    "entrada": "Como se apresentar presencialmente",
    "linguagem_corporal": "Postura, aperto de mão, distância",
    "primeiros_30_segundos": "Script exato",
    "conectar_dores": "Como explorar dores no primeiro contato"
  },
  "gatilhos_personalizados": ["3 gatilhos de persuasão específicos para este perfil numerológico"],
  "objecoes_previstas": {
    "objecao_1": {"texto": "Objeção provável", "resposta": "Resposta usando SPIN + Cialdini"},
    "objecao_2": {"texto": "Objeção provável", "resposta": "Resposta usando SPIN + Cialdini"},
    "objecao_3": {"texto": "Objeção provável", "resposta": "Resposta usando SPIN + Cialdini"}
  }
}

Use:
- SPIN Selling para perguntas
- Persuasão (Cialdini) para gatilhos
- Numerologia para adaptar tom e linguagem
- Casos de sucesso como prova social
- Arte da Guerra para timing

Seja ULTRA PRÁTICO e ACIONÁVEL.`,
        response_json_schema: {
          type: "object",
          properties: {
            telefone: {
              type: "object",
              properties: {
                abertura: { type: "string" },
                transicao: { type: "string" },
                perguntas_diagnostico: { type: "array", items: { type: "string" } },
                manejo_gatekeepers: { type: "string" },
                fechamento_ligacao: { type: "string" }
              }
            },
            whatsapp: {
              type: "object",
              properties: {
                primeira_mensagem: { type: "string" },
                sequencia_followup: { type: "array", items: { type: "string" } },
                uso_emojis: { type: "string" },
                call_to_action: { type: "string" }
              }
            },
            email: {
              type: "object",
              properties: {
                assunto: { type: "string" },
                corpo: { type: "string" },
                assinatura: { type: "string" },
                ps: { type: "string" }
              }
            },
            presencial: {
              type: "object",
              properties: {
                entrada: { type: "string" },
                linguagem_corporal: { type: "string" },
                primeiros_30_segundos: { type: "string" },
                conectar_dores: { type: "string" }
              }
            },
            gatilhos_personalizados: { type: "array", items: { type: "string" } },
            objecoes_previstas: {
              type: "object",
              properties: {
                objecao_1: {
                  type: "object",
                  properties: {
                    texto: { type: "string" },
                    resposta: { type: "string" }
                  }
                },
                objecao_2: {
                  type: "object",
                  properties: {
                    texto: { type: "string" },
                    resposta: { type: "string" }
                  }
                },
                objecao_3: {
                  type: "object",
                  properties: {
                    texto: { type: "string" },
                    resposta: { type: "string" }
                  }
                }
              }
            }
          }
        }
      });

      setScripts(response);
    } catch (error) {
      alert('Erro ao gerar roteiros');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-900 to-teal-900 px-4 pt-4 pb-20 rounded-b-[2rem]">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full glass hover:bg-white/10">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-white">Roteiros de Prospecção</h1>
          </div>
        </div>
        
        <div className="bg-white/10 backdrop-blur rounded-2xl p-4">
          <ClientSelector
            clients={allClients}
            selectedClientId={selectedClientId}
            onClientChange={setSelectedClientId}
          />
        </div>
      </div>

      <div className="px-6 -mt-12 space-y-4">
        {!scripts && (
          <Card className="p-8 text-center">
            <Sparkles className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
            <p className="text-slate-700 mb-4">
              Gere roteiros personalizados para todos os canais de prospecção
            </p>
            <Button
              onClick={generateScripts}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Gerando Roteiros...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Gerar Roteiros IA
                </>
              )}
            </Button>
          </Card>
        )}

        {scripts && (
          <>
            {/* Telefone */}
            <Card className="p-4 bg-white">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Phone className="w-5 h-5 text-blue-600" />
                  <h3 className="font-bold text-slate-800">Roteiro Telefone</h3>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyToClipboard(JSON.stringify(scripts.telefone, null, 2), 'tel')}
                >
                  {copied === 'tel' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-blue-600 font-medium mb-1">ABERTURA (15s)</p>
                  <p className="text-sm text-slate-700 bg-blue-50 p-2 rounded">{scripts.telefone.abertura}</p>
                </div>
                <div>
                  <p className="text-xs text-blue-600 font-medium mb-1">TRANSIÇÃO</p>
                  <p className="text-sm text-slate-700">{scripts.telefone.transicao}</p>
                </div>
                <div>
                  <p className="text-xs text-blue-600 font-medium mb-1">PERGUNTAS DIAGNÓSTICO</p>
                  <ul className="text-sm text-slate-700 space-y-1">
                    {scripts.telefone.perguntas_diagnostico.map((q, i) => (
                      <li key={i}>• {q}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs text-blue-600 font-medium mb-1">GATEKEEPERS</p>
                  <p className="text-sm text-slate-700 italic">{scripts.telefone.manejo_gatekeepers}</p>
                </div>
                <div>
                  <p className="text-xs text-blue-600 font-medium mb-1">FECHAMENTO</p>
                  <p className="text-sm text-slate-700 font-semibold">{scripts.telefone.fechamento_ligacao}</p>
                </div>
              </div>
            </Card>

            {/* WhatsApp */}
            <Card className="p-4 bg-white">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-green-600" />
                  <h3 className="font-bold text-slate-800">Roteiro WhatsApp</h3>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyToClipboard(scripts.whatsapp.primeira_mensagem, 'wa')}
                >
                  {copied === 'wa' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-green-600 font-medium mb-1">PRIMEIRA MENSAGEM</p>
                  <p className="text-sm text-slate-700 bg-green-50 p-3 rounded">{scripts.whatsapp.primeira_mensagem}</p>
                </div>
                <div>
                  <p className="text-xs text-green-600 font-medium mb-1">SEQUÊNCIA FOLLOW-UP</p>
                  {scripts.whatsapp.sequencia_followup.map((msg, i) => (
                    <div key={i} className="text-sm text-slate-700 bg-slate-50 p-2 rounded mb-2">
                      <span className="font-semibold">D+{i === 0 ? 1 : i === 1 ? 3 : 7}:</span> {msg}
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-xs text-green-600 font-medium mb-1">ESTRATÉGIA EMOJIS</p>
                  <p className="text-sm text-slate-700">{scripts.whatsapp.uso_emojis}</p>
                </div>
                <div>
                  <p className="text-xs text-green-600 font-medium mb-1">CALL-TO-ACTION</p>
                  <p className="text-sm text-slate-700 font-semibold">{scripts.whatsapp.call_to_action}</p>
                </div>
              </div>
            </Card>

            {/* Email */}
            <Card className="p-4 bg-white">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-bold text-slate-800">Roteiro Email</h3>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyToClipboard(`${scripts.email.assunto}\n\n${scripts.email.corpo}\n\n${scripts.email.assinatura}\n\n${scripts.email.ps}`, 'email')}
                >
                  {copied === 'email' ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-indigo-600 font-medium mb-1">ASSUNTO</p>
                  <p className="text-sm text-slate-700 font-semibold bg-indigo-50 p-2 rounded">{scripts.email.assunto}</p>
                </div>
                <div>
                  <p className="text-xs text-indigo-600 font-medium mb-1">CORPO</p>
                  <p className="text-sm text-slate-700 whitespace-pre-line">{scripts.email.corpo}</p>
                </div>
                <div>
                  <p className="text-xs text-indigo-600 font-medium mb-1">ASSINATURA</p>
                  <p className="text-sm text-slate-700">{scripts.email.assinatura}</p>
                </div>
                <div>
                  <p className="text-xs text-indigo-600 font-medium mb-1">P.S.</p>
                  <p className="text-sm text-slate-700 italic">{scripts.email.ps}</p>
                </div>
              </div>
            </Card>

            {/* Presencial */}
            <Card className="p-4 bg-white">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-slate-800">Roteiro Presencial</h3>
              </div>
              
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-purple-600 font-medium mb-1">ENTRADA</p>
                  <p className="text-sm text-slate-700">{scripts.presencial.entrada}</p>
                </div>
                <div>
                  <p className="text-xs text-purple-600 font-medium mb-1">LINGUAGEM CORPORAL</p>
                  <p className="text-sm text-slate-700">{scripts.presencial.linguagem_corporal}</p>
                </div>
                <div>
                  <p className="text-xs text-purple-600 font-medium mb-1">PRIMEIROS 30 SEGUNDOS</p>
                  <p className="text-sm text-slate-700 bg-purple-50 p-3 rounded">{scripts.presencial.primeiros_30_segundos}</p>
                </div>
                <div>
                  <p className="text-xs text-purple-600 font-medium mb-1">CONECTAR DORES</p>
                  <p className="text-sm text-slate-700">{scripts.presencial.conectar_dores}</p>
                </div>
              </div>
            </Card>

            {/* Gatilhos */}
            <Card className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
              <h3 className="font-bold text-slate-800 mb-2">🎯 Gatilhos Personalizados</h3>
              <ul className="space-y-2">
                {scripts.gatilhos_personalizados.map((g, i) => (
                  <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                    <span className="font-bold text-amber-600">{i + 1}.</span>
                    {g}
                  </li>
                ))}
              </ul>
            </Card>

            {/* Objeções */}
            <Card className="p-4 bg-red-50 border-red-200">
              <h3 className="font-bold text-slate-800 mb-3">⚠️ Objeções Previstas</h3>
              <div className="space-y-3">
                {Object.values(scripts.objecoes_previstas).map((obj, i) => (
                  <div key={i} className="bg-white p-3 rounded border-l-4 border-red-400">
                    <p className="text-sm font-semibold text-slate-800 mb-1">"{obj.texto}"</p>
                    <p className="text-xs text-slate-600">→ {obj.resposta}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Button
              onClick={() => generateScripts()}
              variant="outline"
              className="w-full"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Gerar Novos Roteiros
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
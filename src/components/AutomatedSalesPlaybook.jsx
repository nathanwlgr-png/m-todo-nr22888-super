import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Mail, 
  Phone, 
  MessageSquare,
  Copy,
  Loader2,
  Target,
  Shield,
  Zap,
  CheckCircle2,
  User
} from 'lucide-react';
import { toast } from 'sonner';

/**
 * Playbook de Vendas Automatizado
 * Gera scripts, objeções e fechamentos personalizados por perfil e canal
 */
export default function AutomatedSalesPlaybook() {
  const [selectedClient, setSelectedClient] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [playbook, setPlaybook] = useState(null);
  const [selectedChannel, setSelectedChannel] = useState('all');

  const { data: clients = [] } = useQuery({
    queryKey: ['clients-playbook'],
    queryFn: () => base44.entities.Client.list('-updated_date', 100)
  });

  const generatePlaybook = async () => {
    if (!selectedClient) {
      toast.error('Selecione um cliente primeiro');
      return;
    }

    setGenerating(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `PLAYBOOK DE VENDAS AUTOMATIZADO - PRIMORI

═══════════════════════════════════════
📊 PERFIL DO CLIENTE
═══════════════════════════════════════
Nome: ${selectedClient.first_name}
Clínica: ${selectedClient.clinic_name || 'N/A'}
Numerologia: ${selectedClient.numerology_number || 'N/A'} - ${selectedClient.behavioral_profile || 'N/A'}
Estilo Decisão: ${selectedClient.decision_style || 'N/A'}
Papel: ${selectedClient.decision_role || 'N/A'}
Status: ${selectedClient.status || 'morno'}
Score: ${selectedClient.purchase_score || 50}%
Pipeline: ${selectedClient.pipeline_stage || 'lead'}
Equipamento Interesse: ${selectedClient.equipment_interest || 'A definir'}
Dores: ${selectedClient.main_pains?.join(', ') || 'Não identificadas'}
Objeções Reais: ${selectedClient.real_objections?.join(', ') || 'Nenhuma'}
Tom Ideal: ${selectedClient.recommended_communication || 'Profissional'}

═══════════════════════════════════════
🎯 MISSÃO: PLAYBOOK COMPLETO MULTI-CANAL
═══════════════════════════════════════

Crie um playbook ULTRA-COMPLETO e ACIONÁVEL com scripts para CADA CANAL:

**1. SCRIPTS DE ABERTURA (3 variações por canal)**

**EMAIL:**
- Assunto A: [assunto persuasivo]
- Corpo A: [email completo 150-200 palavras]
- Assunto B: [assunto alternativo]
- Corpo B: [email completo]
- Assunto C: [assunto direto]
- Corpo C: [email completo]
Qual usar: [recomendação baseada em perfil ${selectedClient.numerology_number}]

**WHATSAPP:**
- Mensagem A: [mensagem curta 3-4 linhas + emoji]
- Mensagem B: [mensagem alternativa]
- Mensagem C: [mensagem direta]
Qual usar: [recomendação]

**TELEFONE:**
- Script A: [abertura completa telefônica]
- Script B: [abertura alternativa]
- Script C: [abertura direta]
Qual usar: [recomendação]

**2. SEQUÊNCIA DE PERGUNTAS SPIN (8-10 perguntas)**
Perguntas EXATAS a fazer, na ordem:
1. [S] Situação: ...
2. [P] Problema: ...
3. [I] Implicação: ...
4. [N] Need-Payoff: ...
(continue até 10 perguntas)

**3. GATILHOS CIALDINI APLICADOS**
Para cada canal, liste 3 gatilhos a usar:
- Email: [Gatilho] + [Como aplicar no texto]
- WhatsApp: [Gatilho] + [Como aplicar]
- Telefone: [Gatilho] + [Como aplicar]

**4. CONTROLE DE OBJEÇÕES (Top 7)**
Para cada objeção provável:
Objeção: [texto]
Resposta Email: [resposta adaptada]
Resposta WhatsApp: [resposta curta]
Resposta Telefone: [resposta verbal]
Framework: [SPIN/Cialdini/IE usado]

**5. ESTRATÉGIAS DE FECHAMENTO**
**Para Email:**
- Fechamento Principal: [texto completo]
- Fechamento Alternativo: [texto]
- CTA: [call-to-action específico]

**Para WhatsApp:**
- Fechamento Principal: [mensagem curta]
- Fechamento Alternativo: [mensagem]
- CTA: [ação clara]

**Para Telefone:**
- Fechamento Principal: [script verbal]
- Fechamento Alternativo: [script]
- Quando usar cada: [situações]

**6. ADAPTAÇÕES POR ESTÁGIO DO FUNIL**
Lead: [adaptações nos scripts]
Qualificado: [adaptações]
Proposta: [adaptações]
Negociação: [adaptações]
Fechamento: [adaptações]

**7. LINGUAGEM ESPECÍFICA**
Tom de Voz: [grave/agudo, pausado/rápido]
Palavras-Chave: [5-7 palavras que ressoam com perfil ${selectedClient.numerology_number}]
Evitar: [palavras/expressões a evitar]
Emojis (WhatsApp): [quais usar]

Seja ULTRA-ESPECÍFICO. Cada script deve ser COPIÁVEL e USÁVEL imediatamente.`,
        response_json_schema: {
          type: "object",
          properties: {
            scripts_email: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  assunto: { type: "string" },
                  corpo: { type: "string" },
                  variacao: { type: "string" }
                }
              }
            },
            scripts_whatsapp: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  mensagem: { type: "string" },
                  variacao: { type: "string" }
                }
              }
            },
            scripts_telefone: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  script: { type: "string" },
                  variacao: { type: "string" }
                }
              }
            },
            recomendacao_canal: {
              type: "object",
              properties: {
                email: { type: "string" },
                whatsapp: { type: "string" },
                telefone: { type: "string" }
              }
            },
            perguntas_spin: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  tipo: { type: "string" },
                  pergunta: { type: "string" }
                }
              }
            },
            gatilhos_por_canal: {
              type: "object",
              properties: {
                email: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      gatilho: { type: "string" },
                      aplicacao: { type: "string" }
                    }
                  }
                },
                whatsapp: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      gatilho: { type: "string" },
                      aplicacao: { type: "string" }
                    }
                  }
                },
                telefone: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      gatilho: { type: "string" },
                      aplicacao: { type: "string" }
                    }
                  }
                }
              }
            },
            objecoes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  objecao: { type: "string" },
                  resposta_email: { type: "string" },
                  resposta_whatsapp: { type: "string" },
                  resposta_telefone: { type: "string" },
                  framework: { type: "string" }
                }
              }
            },
            fechamentos: {
              type: "object",
              properties: {
                email: {
                  type: "object",
                  properties: {
                    principal: { type: "string" },
                    alternativo: { type: "string" },
                    cta: { type: "string" }
                  }
                },
                whatsapp: {
                  type: "object",
                  properties: {
                    principal: { type: "string" },
                    alternativo: { type: "string" },
                    cta: { type: "string" }
                  }
                },
                telefone: {
                  type: "object",
                  properties: {
                    principal: { type: "string" },
                    alternativo: { type: "string" },
                    quando_usar: { type: "string" }
                  }
                }
              }
            },
            adaptacoes_funil: {
              type: "object",
              properties: {
                lead: { type: "string" },
                qualificado: { type: "string" },
                proposta: { type: "string" },
                negociacao: { type: "string" },
                fechamento: { type: "string" }
              }
            },
            linguagem: {
              type: "object",
              properties: {
                tom_voz: { type: "string" },
                palavras_chave: { type: "array", items: { type: "string" } },
                evitar: { type: "array", items: { type: "string" } },
                emojis_whatsapp: { type: "string" }
              }
            }
          }
        }
      });

      setPlaybook(result);
      toast.success('Playbook gerado com sucesso!');
    } catch (error) {
      toast.error('Erro ao gerar playbook');
      console.error(error);
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado!');
  };

  const channels = [
    { id: 'all', name: 'Todos', icon: Target },
    { id: 'email', name: 'Email', icon: Mail },
    { id: 'whatsapp', name: 'WhatsApp', icon: MessageSquare },
    { id: 'telefone', name: 'Telefone', icon: Phone }
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-300">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-slate-800">Playbook de Vendas Automatizado</h3>
            <p className="text-xs text-indigo-700">Scripts personalizados por perfil e canal</p>
          </div>
        </div>

        {/* Client Selection */}
        <select
          value={selectedClient?.id || ''}
          onChange={(e) => setSelectedClient(clients.find(c => c.id === e.target.value))}
          className="w-full h-10 px-3 rounded-lg border border-slate-300 text-sm mb-2"
        >
          <option value="">Selecione um cliente...</option>
          {clients.map(client => (
            <option key={client.id} value={client.id}>
              {client.first_name} - {client.clinic_name || 'Sem clínica'} ({client.pipeline_stage || 'lead'})
            </option>
          ))}
        </select>

        <Button
          onClick={generatePlaybook}
          disabled={!selectedClient || generating}
          className="w-full bg-indigo-600 hover:bg-indigo-700"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Gerando Playbook...
            </>
          ) : (
            <>
              <BookOpen className="w-4 h-4 mr-2" />
              Gerar Playbook Completo
            </>
          )}
        </Button>
      </Card>

      {/* Client Info */}
      {selectedClient && (
        <Card className="p-3 bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-2 text-sm">
            <User className="w-4 h-4 text-slate-600" />
            <span className="font-semibold">{selectedClient.first_name}</span>
            <Badge className="text-xs">{selectedClient.numerology_number || 'N/A'}</Badge>
            <Badge variant="outline" className="text-xs">{selectedClient.pipeline_stage || 'lead'}</Badge>
            <Badge className={
              selectedClient.status === 'quente' ? 'bg-red-100 text-red-700' :
              selectedClient.status === 'morno' ? 'bg-orange-100 text-orange-700' :
              'bg-blue-100 text-blue-700'
            }>
              {selectedClient.status}
            </Badge>
          </div>
        </Card>
      )}

      {/* Channel Filter */}
      {playbook && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {channels.map(channel => (
            <Button
              key={channel.id}
              onClick={() => setSelectedChannel(channel.id)}
              variant={selectedChannel === channel.id ? 'default' : 'outline'}
              size="sm"
              className={selectedChannel === channel.id ? 'bg-indigo-600' : ''}
            >
              <channel.icon className="w-4 h-4 mr-1" />
              {channel.name}
            </Button>
          ))}
        </div>
      )}

      {/* Playbook Content */}
      {playbook && (
        <div className="space-y-4">
          {/* Scripts de Abertura */}
          {(selectedChannel === 'all' || selectedChannel === 'email') && (
            <Card className="p-4 border-2 border-blue-300 bg-blue-50">
              <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Scripts Email
              </h4>
              <div className="space-y-3">
                {playbook.scripts_email?.map((script, i) => (
                  <div key={i} className="p-3 bg-white rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className="bg-blue-100 text-blue-700">{script.variacao}</Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(`${script.assunto}\n\n${script.corpo}`)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    <p className="text-xs font-semibold text-slate-700 mb-1">Assunto:</p>
                    <p className="text-sm text-slate-800 mb-2">{script.assunto}</p>
                    <p className="text-xs font-semibold text-slate-700 mb-1">Corpo:</p>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{script.corpo}</p>
                  </div>
                ))}
                <div className="p-2 bg-green-50 rounded border border-green-300">
                  <p className="text-xs font-semibold text-green-800">💡 Recomendação:</p>
                  <p className="text-xs text-green-700">{playbook.recomendacao_canal?.email}</p>
                </div>
              </div>
            </Card>
          )}

          {(selectedChannel === 'all' || selectedChannel === 'whatsapp') && (
            <Card className="p-4 border-2 border-green-300 bg-green-50">
              <h4 className="font-bold text-green-900 mb-3 flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Scripts WhatsApp
              </h4>
              <div className="space-y-3">
                {playbook.scripts_whatsapp?.map((script, i) => (
                  <div key={i} className="p-3 bg-white rounded-lg border border-green-200">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className="bg-green-100 text-green-700">{script.variacao}</Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(script.mensagem)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    <p className="text-sm text-slate-800 whitespace-pre-wrap">{script.mensagem}</p>
                  </div>
                ))}
                <div className="p-2 bg-green-100 rounded border border-green-400">
                  <p className="text-xs font-semibold text-green-800">💡 Recomendação:</p>
                  <p className="text-xs text-green-700">{playbook.recomendacao_canal?.whatsapp}</p>
                </div>
              </div>
            </Card>
          )}

          {(selectedChannel === 'all' || selectedChannel === 'telefone') && (
            <Card className="p-4 border-2 border-purple-300 bg-purple-50">
              <h4 className="font-bold text-purple-900 mb-3 flex items-center gap-2">
                <Phone className="w-5 h-5" />
                Scripts Telefone
              </h4>
              <div className="space-y-3">
                {playbook.scripts_telefone?.map((script, i) => (
                  <div key={i} className="p-3 bg-white rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className="bg-purple-100 text-purple-700">{script.variacao}</Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(script.script)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    <p className="text-sm text-slate-800 whitespace-pre-wrap">{script.script}</p>
                  </div>
                ))}
                <div className="p-2 bg-purple-100 rounded border border-purple-400">
                  <p className="text-xs font-semibold text-purple-800">💡 Recomendação:</p>
                  <p className="text-xs text-purple-700">{playbook.recomendacao_canal?.telefone}</p>
                </div>
              </div>
            </Card>
          )}

          {/* Perguntas SPIN */}
          {selectedChannel === 'all' && (
            <Card className="p-4 border-2 border-orange-300 bg-orange-50">
              <h4 className="font-bold text-orange-900 mb-3 flex items-center gap-2">
                <Target className="w-5 h-5" />
                Sequência SPIN
              </h4>
              <div className="space-y-2">
                {playbook.perguntas_spin?.map((p, i) => (
                  <div key={i} className="p-2 bg-white rounded border border-orange-200 flex gap-2">
                    <Badge className={
                      p.tipo === 'S' ? 'bg-blue-100 text-blue-700' :
                      p.tipo === 'P' ? 'bg-red-100 text-red-700' :
                      p.tipo === 'I' ? 'bg-orange-100 text-orange-700' :
                      'bg-green-100 text-green-700'
                    }>
                      {p.tipo}
                    </Badge>
                    <p className="text-sm text-slate-800 flex-1">{p.pergunta}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Gatilhos Cialdini */}
          {selectedChannel === 'all' && (
            <Card className="p-4 border-2 border-pink-300 bg-pink-50">
              <h4 className="font-bold text-pink-900 mb-3 flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Gatilhos Cialdini por Canal
              </h4>
              <div className="space-y-3">
                {['email', 'whatsapp', 'telefone'].map(canal => (
                  <div key={canal} className="p-3 bg-white rounded border border-pink-200">
                    <p className="text-xs font-bold text-pink-800 mb-2">{canal.toUpperCase()}</p>
                    <div className="space-y-1">
                      {playbook.gatilhos_por_canal?.[canal]?.map((g, i) => (
                        <div key={i} className="text-xs">
                          <span className="font-semibold text-slate-700">{g.gatilho}:</span>
                          <span className="text-slate-600 ml-1">{g.aplicacao}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Controle de Objeções */}
          {selectedChannel === 'all' && (
            <Card className="p-4 border-2 border-red-300 bg-red-50">
              <h4 className="font-bold text-red-900 mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Controle de Objeções
              </h4>
              <div className="space-y-3">
                {playbook.objecoes?.map((obj, i) => (
                  <div key={i} className="p-3 bg-white rounded border border-red-200">
                    <p className="text-sm font-bold text-red-800 mb-2">"{obj.objecao}"</p>
                    <Badge className="mb-2 text-xs">{obj.framework}</Badge>
                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="font-semibold text-blue-700">📧 Email:</span>
                        <p className="text-slate-700 mt-1">{obj.resposta_email}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-green-700">💬 WhatsApp:</span>
                        <p className="text-slate-700 mt-1">{obj.resposta_whatsapp}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-purple-700">📞 Telefone:</span>
                        <p className="text-slate-700 mt-1">{obj.resposta_telefone}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Fechamentos */}
          {selectedChannel === 'all' && (
            <Card className="p-4 border-2 border-emerald-300 bg-emerald-50">
              <h4 className="font-bold text-emerald-900 mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Estratégias de Fechamento
              </h4>
              <div className="space-y-3">
                {['email', 'whatsapp', 'telefone'].map(canal => (
                  <div key={canal} className="p-3 bg-white rounded border border-emerald-200">
                    <p className="text-xs font-bold text-emerald-800 mb-2">{canal.toUpperCase()}</p>
                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="font-semibold text-slate-700">Principal:</span>
                        <p className="text-slate-700 mt-1">{playbook.fechamentos?.[canal]?.principal}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-slate-700">Alternativo:</span>
                        <p className="text-slate-700 mt-1">{playbook.fechamentos?.[canal]?.alternativo}</p>
                      </div>
                      <div>
                        <span className="font-semibold text-green-700">CTA/Quando:</span>
                        <p className="text-slate-700 mt-1">{playbook.fechamentos?.[canal]?.cta || playbook.fechamentos?.[canal]?.quando_usar}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Adaptações por Funil */}
          {selectedChannel === 'all' && (
            <Card className="p-4 border-2 border-indigo-300 bg-indigo-50">
              <h4 className="font-bold text-indigo-900 mb-3">🎯 Adaptações por Estágio do Funil</h4>
              <div className="space-y-2">
                {Object.entries(playbook.adaptacoes_funil || {}).map(([stage, adapt]) => (
                  <div key={stage} className="p-2 bg-white rounded border border-indigo-200">
                    <p className="text-xs font-bold text-indigo-800 capitalize">{stage}:</p>
                    <p className="text-xs text-slate-700">{adapt}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Linguagem Específica */}
          {selectedChannel === 'all' && (
            <Card className="p-4 border-2 border-slate-300 bg-slate-50">
              <h4 className="font-bold text-slate-900 mb-3">🗣️ Guia de Linguagem</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-white rounded border border-slate-200">
                  <p className="text-xs font-semibold text-slate-700">Tom de Voz</p>
                  <p className="text-xs text-slate-600">{playbook.linguagem?.tom_voz}</p>
                </div>
                <div className="p-2 bg-white rounded border border-slate-200">
                  <p className="text-xs font-semibold text-slate-700">Emojis WhatsApp</p>
                  <p className="text-xs text-slate-600">{playbook.linguagem?.emojis_whatsapp}</p>
                </div>
              </div>
              <div className="mt-2 p-2 bg-green-100 rounded border border-green-300">
                <p className="text-xs font-semibold text-green-800">✅ Palavras-Chave:</p>
                <p className="text-xs text-green-700">{playbook.linguagem?.palavras_chave?.join(', ')}</p>
              </div>
              <div className="mt-2 p-2 bg-red-100 rounded border border-red-300">
                <p className="text-xs font-semibold text-red-800">❌ Evitar:</p>
                <p className="text-xs text-red-700">{playbook.linguagem?.evitar?.join(', ')}</p>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
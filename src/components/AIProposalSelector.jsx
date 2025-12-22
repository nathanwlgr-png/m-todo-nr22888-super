import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sparkles, Loader2, MessageSquare, Copy, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AIProposalSelector({ client }) {
  const [open, setOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [proposals, setProposals] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const generateProposals = async () => {
    setGenerating(true);
    try {
      const prompt = `Você é um especialista em vendas consultivas com maestria em persuasão e gatilhos mentais.

PERFIL COMPLETO DO CLIENTE:
- Nome: ${client.first_name}
- Razão Social: ${client.razao_social || 'N/A'}
- CNPJ: ${client.cnpj || 'N/A'}
- Numerologia: ${client.numerology_number} - ${client.behavioral_profile}
- Caminho de Vida: ${client.life_path_number || 'N/A'}
- Estilo de Decisão: ${client.decision_style}
- Tom de Voz: ${client.client_tone || 'Profissional'}
- Status: ${client.status} | Score: ${client.purchase_score}%
- Tipo: ${client.client_type}
- Decisor: ${client.decision_role}
- Equipamento Atual: ${client.current_equipment || 'Nenhum'}
- Dores Identificadas: ${client.main_pains?.join(', ') || 'Não identificadas'}
- Motivadores: ${client.purchase_motivators?.join(', ') || 'Não identificados'}
- Objeções: ${client.real_objections?.join(', ') || 'Nenhuma'}
- Orçamento: ${client.available_budget ? `R$ ${Number(client.available_budget).toLocaleString('pt-BR')}` : 'Não informado'}
- Prazo Decisão: ${client.decision_deadline || 'Não definido'}
- Cidade: ${client.city}
- Última Visita: ${client.last_visit_date || 'Nenhuma'}

MOMENTO DA VENDA:
- Objetivo Visita: ${client.visit_objective || 'diagnosticar_necessidades'}
- Gatilhos Já Usados: ${client.triggers_used?.join(', ') || 'Nenhum'}
- Notas: ${client.notes || 'Sem notas'}

TAREFA:
Gere 3 PROPOSTAS DIFERENTES e COMPLETAS para este momento específico da venda.

Cada proposta deve:
1. Adaptar-se ao perfil numerológico (${client.behavioral_profile})
2. Usar gatilhos mentais de Cialdini adequados ao momento
3. Aplicar técnicas SPIN Selling
4. Considerar o estilo de decisão dele (${client.decision_style})
5. Usar o tom de voz apropriado (${client.client_tone || 'profissional'})
6. Focar nas dores específicas dele
7. Ser pronta para enviar por WhatsApp

ESTRUTURA DE CADA PROPOSTA:
- Abertura emocional/racional adequada ao perfil
- Apresentação da solução com diferenciais (garantia 25 meses, bonificação insumos)
- Uso de 2-3 gatilhos mentais explícitos
- Call-to-action claro
- Tamanho: 3-4 parágrafos (WhatsApp-friendly)

IMPORTANTE:
- Proposta 1: Abordagem EMOCIONAL (gatilhos: reciprocidade, prova social)
- Proposta 2: Abordagem RACIONAL/TÉCNICA (gatilhos: autoridade, escassez)
- Proposta 3: Abordagem EQUILIBRADA (gatilhos: comprometimento, consenso)

Retorne JSON:
{
  "proposals": [
    {
      "type": "emocional",
      "title": "Título curto",
      "message": "Mensagem completa pronta para WhatsApp (3-4 parágrafos)",
      "triggers_used": ["gatilho1", "gatilho2"],
      "why_this_works": "Explicação de 1 frase de por que funciona com este perfil",
      "closing_probability": número 0-100
    },
    ... (3 propostas no total)
  ],
  "recommended_index": número (0, 1 ou 2),
  "timing_advice": "Melhor momento/horário para enviar"
}`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            proposals: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string" },
                  title: { type: "string" },
                  message: { type: "string" },
                  triggers_used: { type: "array", items: { type: "string" } },
                  why_this_works: { type: "string" },
                  closing_probability: { type: "number" }
                }
              }
            },
            recommended_index: { type: "number" },
            timing_advice: { type: "string" }
          }
        }
      });

      setProposals(result);
    } catch (error) {
      toast.error('Erro ao gerar propostas');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = (message, index) => {
    navigator.clipboard.writeText(message);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
    toast.success('Proposta copiada!');
  };

  const handleSendWhatsApp = (message) => {
    if (client.phone) {
      const encodedMessage = encodeURIComponent(message);
      window.open(`https://wa.me/${client.phone}?text=${encodedMessage}`, '_blank');
    } else {
      toast.error('Cliente não possui WhatsApp cadastrado');
    }
  };

  return (
    <>
      <Button
        onClick={() => {
          setOpen(true);
          if (!proposals) generateProposals();
        }}
        className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
      >
        <Sparkles className="w-5 h-5 mr-2" />
        Gerar Propostas com IA
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-green-600" />
              Propostas Personalizadas por IA
            </DialogTitle>
          </DialogHeader>

          {generating ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-green-600 mb-4" />
              <p className="text-sm text-slate-600">Analisando perfil e gerando propostas...</p>
            </div>
          ) : proposals ? (
            <div className="space-y-4">
              {/* Timing Advice */}
              <Card className="p-3 bg-amber-50 border-amber-200">
                <p className="text-xs font-semibold text-amber-700 mb-1">⏰ Melhor Momento</p>
                <p className="text-sm text-amber-900">{proposals.timing_advice}</p>
              </Card>

              {/* Proposals */}
              {proposals.proposals.map((proposal, index) => (
                <Card
                  key={index}
                  className={`p-4 ${
                    index === proposals.recommended_index
                      ? 'border-2 border-green-500 bg-green-50'
                      : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-slate-800">{proposal.title}</h3>
                        {index === proposals.recommended_index && (
                          <span className="px-2 py-0.5 bg-green-600 text-white text-xs rounded-full font-medium">
                            Recomendada
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
                          {proposal.type}
                        </span>
                        <span className="text-slate-500">
                          Probabilidade: {proposal.closing_probability}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Message */}
                  <div className="bg-white rounded-lg p-3 mb-3 border border-slate-200">
                    <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                      {proposal.message}
                    </p>
                  </div>

                  {/* Triggers Used */}
                  <div className="mb-3">
                    <p className="text-xs text-slate-500 mb-1">Gatilhos Mentais:</p>
                    <div className="flex flex-wrap gap-1">
                      {proposal.triggers_used.map((trigger, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs"
                        >
                          {trigger}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Why This Works */}
                  <div className="mb-3 p-2 bg-slate-50 rounded">
                    <p className="text-xs text-slate-600">
                      <span className="font-medium">Por que funciona:</span> {proposal.why_this_works}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {client.phone && (
                      <Button
                        onClick={() => handleSendWhatsApp(proposal.message)}
                        className="flex-1 h-9 bg-green-600 hover:bg-green-700"
                      >
                        <MessageSquare className="w-4 h-4 mr-1" />
                        Enviar WhatsApp
                      </Button>
                    )}
                    <Button
                      onClick={() => handleCopy(proposal.message, index)}
                      variant="outline"
                      className="h-9"
                    >
                      {copiedIndex === index ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </Card>
              ))}

              {/* Regenerate Button */}
              <Button
                onClick={generateProposals}
                variant="outline"
                className="w-full"
                disabled={generating}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Gerar Novas Propostas
              </Button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
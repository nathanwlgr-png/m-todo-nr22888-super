import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Sparkles, Loader2, FileText, Copy } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

export default function MultiProposalGeneratorAI({ client }) {
  const [equipmentInterest, setEquipmentInterest] = useState(client.equipment_interest || '');
  const [generating, setGenerating] = useState(false);
  const [proposals, setProposals] = useState(null);

  const generateProposals = async () => {
    if (!equipmentInterest.trim()) {
      toast.error('Digite o equipamento de interesse');
      return;
    }

    setGenerating(true);
    try {
      // Salvar interesse do cliente
      await base44.entities.Client.update(client.id, {
        equipment_interest: equipmentInterest
      });

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um especialista em vendas de equipamentos veterinários Seamaty.

CLIENTE: ${client.first_name}
CLÍNICA: ${client.clinic_name || 'Não informado'}
EQUIPAMENTO DE INTERESSE: ${equipmentInterest}
ORÇAMENTO: ${client.available_budget || 'Não informado'}
VOLUME MENSAL: ${client.current_volume || 'Não informado'}
PERFIL: ${client.behavioral_profile || 'Não informado'}

TAREFA: Gere 3 PROPOSTAS COMERCIAIS DIFERENTES para este cliente, cada uma com:
1. Nome da proposta (ex: "Plano Essencial", "Plano Premium", "Plano Completo")
2. Equipamentos incluídos (com imagens e especificações)
3. Valor total
4. Diferenciais únicos
5. Bonificação/bônus do mês
6. Forma de pagamento sugerida
7. Por que esta proposta é ideal para o perfil deste cliente

IMPORTANTE:
- Proposta 1: Mais econômica (básico)
- Proposta 2: Intermediária (equilibrada)
- Proposta 3: Premium (completa)

Inclua links de vídeos técnicos Seamaty quando possível.
Destaque qualidades técnicas específicas para veterinária.

Retorne markdown formatado para cada proposta.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            proposals: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  equipment_list: { type: "array", items: { type: "string" } },
                  total_value: { type: "string" },
                  differentials: { type: "array", items: { type: "string" } },
                  monthly_bonus: { type: "string" },
                  payment_terms: { type: "string" },
                  why_ideal: { type: "string" },
                  technical_specs: { type: "string" },
                  video_links: { type: "array", items: { type: "string" } }
                }
              }
            }
          }
        }
      });

      setProposals(result.proposals);
      toast.success('3 propostas geradas!');

      // Salvar como documento
      const fullText = result.proposals.map((p, idx) => `
## PROPOSTA ${idx + 1}: ${p.name}

**Equipamentos:**
${p.equipment_list.join('\n')}

**Valor Total:** ${p.total_value}

**Diferenciais:**
${p.differentials.map(d => `- ${d}`).join('\n')}

**Bonificação:** ${p.monthly_bonus}

**Pagamento:** ${p.payment_terms}

**Por que ideal para ${client.first_name}:**
${p.why_ideal}

**Especificações Técnicas:**
${p.technical_specs}

${p.video_links?.length > 0 ? `**Vídeos:**\n${p.video_links.join('\n')}` : ''}
`).join('\n\n---\n\n');

      await base44.entities.GeneratedDocument.create({
        title: `3 Propostas - ${client.first_name} - ${equipmentInterest}`,
        type: 'proposta',
        content: fullText,
        summary: `Propostas geradas para ${equipmentInterest}`,
        tags: ['proposta', client.first_name, equipmentInterest]
      });

    } catch (error) {
      toast.error('Erro ao gerar propostas');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card className="p-5 bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-300">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
          <FileText className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-slate-800">Gerar 3 Propostas IA</h3>
          <p className="text-xs text-slate-600">Básica, Intermediária e Premium</p>
        </div>
      </div>

      <div className="space-y-3">
        <Input
          placeholder="Ex: VG2, Hematologia, Bioquímico..."
          value={equipmentInterest}
          onChange={(e) => setEquipmentInterest(e.target.value)}
          className="h-12"
        />

        <Button
          onClick={generateProposals}
          disabled={generating || !equipmentInterest.trim()}
          className="w-full bg-indigo-600 hover:bg-indigo-700 h-12"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Gerando 3 propostas...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Gerar Propostas
            </>
          )}
        </Button>

        {proposals && proposals.length > 0 && (
          <div className="space-y-4 mt-4">
            {proposals.map((proposal, idx) => (
              <div key={idx} className="p-4 bg-white rounded-lg border-2 border-indigo-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-indigo-800">{proposal.name}</h4>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      const text = `${proposal.name}\n\nValor: ${proposal.total_value}\n\nEquipamentos:\n${proposal.equipment_list.join('\n')}\n\nDiferenciais:\n${proposal.differentials.join('\n')}\n\nBonificação: ${proposal.monthly_bonus}\n\nPagamento: ${proposal.payment_terms}`;
                      navigator.clipboard.writeText(text);
                      toast.success('Proposta copiada!');
                    }}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="p-2 bg-indigo-50 rounded">
                    <p className="font-semibold text-indigo-700">💰 {proposal.total_value}</p>
                  </div>

                  <div className="p-2 bg-slate-50 rounded">
                    <p className="text-xs font-semibold text-slate-700 mb-1">Equipamentos:</p>
                    {proposal.equipment_list.map((eq, i) => (
                      <p key={i} className="text-xs text-slate-600">• {eq}</p>
                    ))}
                  </div>

                  <div className="p-2 bg-green-50 rounded">
                    <p className="text-xs font-semibold text-green-700 mb-1">✨ Diferenciais:</p>
                    {proposal.differentials.map((d, i) => (
                      <p key={i} className="text-xs text-green-600">• {d}</p>
                    ))}
                  </div>

                  <div className="p-2 bg-orange-50 rounded">
                    <p className="text-xs font-semibold text-orange-700">🎁 {proposal.monthly_bonus}</p>
                  </div>

                  <div className="p-2 bg-blue-50 rounded">
                    <p className="text-xs text-blue-700">{proposal.why_ideal}</p>
                  </div>

                  {proposal.video_links && proposal.video_links.length > 0 && (
                    <div className="space-y-1">
                      {proposal.video_links.map((link, i) => (
                        <a key={i} href={link} target="_blank" className="text-xs text-indigo-600 hover:underline block">
                          🎥 Vídeo técnico {i + 1}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, FileText, Copy, Download } from 'lucide-react';
import { executeWithRateLimit } from '@/components/rateLimitManager';
import { toast } from 'sonner';

export default function ProposalGeneratorAI({ client, sales = [] }) {
  const [loading, setLoading] = useState(false);
  const [proposal, setProposal] = useState(null);

  const generateProposal = async () => {
    setLoading(true);
    try {
      const prompt = `Gere uma proposta comercial PERSONALIZADA para este cliente:

PERFIL:
- Nome: ${client.first_name}
- Clínica: ${client.clinic_name}
- Tipo: ${client.client_type}
- Decisor: ${client.decision_role}
- Numerologia: ${client.numerology_number} - ${client.behavioral_profile}

HISTÓRICO:
- Visitas: ${client.total_visits_count || 0}
- Vendas anteriores: ${sales.length}
- Equipamento atual: ${client.current_equipment}
- Interesse: ${client.equipment_interest}

NECESSIDADES:
- Dores: ${client.main_pains?.join(', ') || 'Não identificadas'}
- Motivadores: ${client.purchase_motivators?.join(', ') || 'Não identificados'}
- Orçamento: R$ ${client.available_budget || 'Não informado'}
- Prazo: ${client.decision_deadline || 'Não definido'}

TAREFA:
Gere uma proposta profissional, personalizada, com:
1. Saudação personalizada baseada no perfil
2. Análise das necessidades do cliente
3. Solução recomendada (equipamento + bundle de insumos)
4. Proposta financeira (tabela de valores)
5. Diferencial competitivo
6. Próximos passos

Formato: Texto pronto para copiar e enviar, com tom profissional mas empático.`;

      const result = await executeWithRateLimit(async () => {
        return await base44.integrations.Core.InvokeLLM({
          prompt,
          response_json_schema: {
            type: "object",
            properties: {
              greeting: { type: "string" },
              needs_analysis: { type: "string" },
              recommendation: { type: "string" },
              financial_proposal: { type: "string" },
              competitive_advantage: { type: "string" },
              next_steps: { type: "string" },
              full_proposal: { type: "string" }
            }
          }
        });
      }, 'high');

      setProposal(result);
      toast.success('Proposta gerada com sucesso!');
    } catch (error) {
      toast.error('Erro ao gerar proposta');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
          <FileText className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-slate-800">📄 Gerador de Propostas IA</h3>
          <p className="text-xs text-slate-600">Proposta personalizada com base no perfil</p>
        </div>
      </div>

      {!proposal ? (
        <Button
          onClick={generateProposal}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Gerando...
            </>
          ) : (
            'Gerar Proposta Personalizada'
          )}
        </Button>
      ) : (
        <div className="space-y-3">
          <div className="bg-white rounded-lg p-4 max-h-96 overflow-y-auto border border-blue-200">
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{proposal.full_proposal}</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(proposal.full_proposal);
                toast.success('Copiado!');
              }}
            >
              <Copy className="w-3 h-3 mr-1" />
              Copiar
            </Button>
            <Button
              size="sm"
              onClick={() => setProposal(null)}
            >
              Nova Proposta
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
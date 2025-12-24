import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { base44 } from '@/api/base44Client';
import { Loader2, ArrowRight, Target, Clock, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function NextStepAI({ client, interactions, visits, sales }) {
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState(null);

  const generateNextStep = async () => {
    setLoading(true);
    try {
      const prompt = `Você é um especialista em automação de vendas. Analise o cliente e sugira O PRÓXIMO PASSO mais eficaz.

**CLIENTE:** ${client.first_name}
**STATUS:** ${client.status} | Score: ${client.purchase_score}%
**PERFIL:** ${client.behavioral_profile}
**ÚLTIMA INTERAÇÃO:** ${interactions[0]?.created_date || 'Nenhuma'}
**ÚLTIMA VISITA:** ${client.last_visit_date || 'Nenhuma'}
**TOTAL VISITAS:** ${client.total_visits_count || 0}
**VENDAS:** ${sales.filter(s => s.status === 'fechada').length}
**EQUIPAMENTO INTERESSE:** ${client.equipment_interest || 'Não definido'}
**ORÇAMENTO:** ${client.available_budget || 'Não informado'}
**DORES:** ${client.main_pains?.join(', ') || 'Não identificadas'}
**OBJEÇÕES:** ${client.real_objections?.join(', ') || 'Nenhuma'}

**HISTÓRICO (últimas 5 interações):**
${JSON.stringify(interactions.slice(0, 5).map(i => ({
  type: i.type,
  outcome: i.outcome,
  date: i.created_date
})), null, 2)}

**TAREFA:**
Com base no histórico e perfil, sugira:
1. PRÓXIMO PASSO mais eficaz (específico e acionável)
2. Por que este é o melhor momento para esta ação
3. Como executar (passo a passo)
4. Prazo ideal para executar
5. Probabilidade de sucesso

Seja PRÁTICO e DIRETO.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            next_step: { type: "string" },
            reasoning: { type: "string" },
            execution_steps: { type: "array", items: { type: "string" } },
            ideal_timing: { type: "string" },
            success_probability: { type: "number" }
          }
        }
      });

      setSuggestion(result);
      toast.success('Próximo passo gerado!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao gerar sugestão');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center">
          <Target className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-slate-800">Próximo Passo IA</h3>
          <p className="text-xs text-slate-600">Sugestão automática baseada em histórico</p>
        </div>
      </div>

      {!suggestion && (
        <Button
          onClick={generateNextStep}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Analisando...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Gerar Próximo Passo
            </>
          )}
        </Button>
      )}

      {suggestion && (
        <div className="space-y-3">
          {/* Próximo Passo */}
          <div className="p-4 bg-white rounded-xl border-2 border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <ArrowRight className="w-5 h-5 text-blue-600" />
              <p className="text-xs font-semibold text-blue-700">PRÓXIMA AÇÃO</p>
            </div>
            <p className="font-bold text-slate-800 text-lg mb-2">{suggestion.next_step}</p>
            
            <div className="flex items-center gap-2">
              <Badge className="bg-green-100 text-green-700">
                {suggestion.success_probability}% Sucesso
              </Badge>
              <Badge className="bg-blue-100 text-blue-700">
                <Clock className="w-3 h-3 mr-1" />
                {suggestion.ideal_timing}
              </Badge>
            </div>
          </div>

          {/* Justificativa */}
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs font-semibold text-blue-700 mb-1">💡 Por que agora?</p>
            <p className="text-sm text-slate-700">{suggestion.reasoning}</p>
          </div>

          {/* Como Executar */}
          <div className="p-3 bg-white rounded-lg border border-slate-200">
            <p className="text-xs font-semibold text-slate-700 mb-2">📋 Como Executar</p>
            <ol className="space-y-2">
              {suggestion.execution_steps?.map((step, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-semibold">
                    {idx + 1}
                  </span>
                  <p className="text-sm text-slate-700">{step}</p>
                </li>
              ))}
            </ol>
          </div>

          <Button
            onClick={generateNextStep}
            disabled={loading}
            variant="outline"
            className="w-full"
          >
            Atualizar Sugestão
          </Button>
        </div>
      )}
    </Card>
  );
}
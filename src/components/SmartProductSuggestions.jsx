import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

export default function SmartProductSuggestions() {
  const [analyzing, setAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const data = await base44.entities.Client.list();
      return data.filter(c => c && c.id && !c.is_deleted);
    }
  });

  const generateSuggestions = async () => {
    setAnalyzing(true);
    try {
      const highPotential = clients.filter(c => 
        c.purchase_score >= 60 && 
        c.status !== 'frio' && 
        !c.equipment_sold
      ).slice(0, 10);

      const results = [];

      for (const client of highPotential) {
        const analysis = await base44.integrations.Core.InvokeLLM({
          prompt: `Analise este cliente veterinário e sugira o melhor produto Seamaty:

PERFIL:
- Nome: ${client.first_name}
- Tipo: ${client.client_type}
- Comportamento: ${client.behavioral_profile || 'padrão'}
- Score: ${client.purchase_score}%
- Equipamento atual: ${client.current_equipment || 'nenhum'}
- Volume mensal: ${client.current_volume || 'não informado'}
- Dores: ${client.main_pains?.join(', ') || 'não identificadas'}

PRODUTOS DISPONÍVEIS:
1. VG2 - Hemogasometria + Imunofluorescência (equipamento premium)
2. VG1 - Hemogasometria básica
3. SMT-120VP - Bioquímico veterinário completo
4. QT3 - Bioquímico + Coagulação + Gases
5. VI1 - Imunofluorescência standalone
6. VQ1 - PCR veterinário

Retorne JSON com:
- equipment: nome do produto ideal
- priority: high/medium/low
- reason: motivo em 1 frase
- upsell: produto complementar (opcional)
- estimated_value: valor estimado da venda`,
          response_json_schema: {
            type: "object",
            properties: {
              equipment: { type: "string" },
              priority: { type: "string" },
              reason: { type: "string" },
              upsell: { type: "string" },
              estimated_value: { type: "number" }
            }
          }
        });

        results.push({
          client: client.first_name,
          client_id: client.id,
          ...analysis
        });

        // Salvar sugestão no cliente
        await base44.entities.Client.update(client.id, {
          equipment_suggestion: analysis.equipment,
          equipment_suggestion_reason: analysis.reason,
          equipment_suggestion_alternative: analysis.upsell,
          projected_revenue: analysis.estimated_value
        });
      }

      setSuggestions(results.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }));

      toast.success(`${results.length} sugestões geradas!`);
    } catch (error) {
      console.error(error);
      toast.error('Erro ao gerar sugestões');
    } finally {
      setAnalyzing(false);
    }
  };

  const priorityColors = {
    high: 'bg-red-100 text-red-700 border-red-300',
    medium: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    low: 'bg-blue-100 text-blue-700 border-blue-300'
  };

  return (
    <Card className="p-5 bg-gradient-to-r from-cyan-50 to-blue-50 border-2 border-cyan-300">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-cyan-600 flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-slate-800">Sugestões Inteligentes de Produtos</h3>
          <p className="text-xs text-slate-600">IA analisa perfil + histórico</p>
        </div>
      </div>

      <Button
        onClick={generateSuggestions}
        disabled={analyzing}
        className="w-full bg-cyan-600 hover:bg-cyan-700 mb-4"
      >
        {analyzing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Analisando clientes...
          </>
        ) : (
          <>
            <TrendingUp className="w-4 h-4 mr-2" />
            Gerar Sugestões IA
          </>
        )}
      </Button>

      {suggestions.length > 0 && (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {suggestions.map((sugg, idx) => (
            <div key={idx} className="p-3 bg-white rounded-lg border-2 border-cyan-200">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-slate-800">{sugg.client}</p>
                  <p className="text-xs text-slate-600">{sugg.equipment}</p>
                </div>
                <Badge className={priorityColors[sugg.priority]}>
                  {sugg.priority}
                </Badge>
              </div>

              <p className="text-sm text-slate-700 mb-2">{sugg.reason}</p>

              {sugg.upsell && (
                <div className="p-2 bg-purple-50 rounded border border-purple-200 mb-2">
                  <p className="text-xs text-purple-700">
                    <strong>Upsell:</strong> {sugg.upsell}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-green-700">
                  R$ {sugg.estimated_value?.toLocaleString('pt-BR')}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.location.href = `/ClientProfile?id=${sugg.client_id}`}
                  className="h-7 text-xs"
                >
                  Ver Cliente
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
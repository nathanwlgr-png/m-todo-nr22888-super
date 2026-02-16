import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { Sparkles, TrendingUp, DollarSign, Zap } from 'lucide-react';

export default function RealtimeProductSuggestions({ client, interactionContext = '' }) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (client?.id) {
      generateSuggestions();
    }
  }, [client?.id, interactionContext]);

  const generateSuggestions = async () => {
    if (!client) return;
    
    setLoading(true);
    try {
      const prompt = `SUGESTÕES EM TEMPO REAL para conversa com cliente:

**CLIENTE:**
- Nome: ${client.first_name}
- Empresa: ${client.clinic_name || 'N/A'}
- Equipamento atual: ${client.current_equipment || 'Nenhum'}
- Orçamento: ${client.available_budget || 'N/A'}
- Status: ${client.status}

**CONTEXTO DA INTERAÇÃO ATUAL:**
${interactionContext || 'Conversa geral sobre produtos'}

**HISTÓRICO DE IA:**
${client.ai_sales_intelligence?.cross_sell_opportunities?.length > 0 ? 
  'Oportunidades detectadas:\n' + client.ai_sales_intelligence.cross_sell_opportunities.slice(0, 2).map(o => `- ${o.product} (${o.probability}%)`).join('\n') : 
  'Sem oportunidades prévias detectadas'}

**TAREFA:**
Baseado no contexto ATUAL da conversa, sugira 2-3 produtos ou serviços que fazem sentido mencionar AGORA. Para cada:
1. Produto/serviço
2. Por que faz sentido NESTE momento
3. Como mencionar naturalmente (1 frase curta)
4. Valor estimado
5. Relevância (0-100)

Seja específico e contextual. As sugestões devem fluir naturalmente na conversa.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            suggestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  product: { type: "string" },
                  reason_now: { type: "string" },
                  how_to_mention: { type: "string" },
                  estimated_value: { type: "number" },
                  relevance: { type: "number" }
                }
              }
            }
          }
        }
      });

      setSuggestions(response.suggestions || []);
    } catch (error) {
      console.error('Erro ao gerar sugestões:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!client || suggestions.length === 0) return null;

  return (
    <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Zap className="w-4 h-4 text-amber-600" />
          💡 Sugestões em Tempo Real
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="text-center py-4">
            <Sparkles className="w-6 h-6 animate-spin mx-auto text-amber-600" />
            <p className="text-xs text-amber-700 mt-2">Analisando contexto...</p>
          </div>
        ) : (
          <>
            {suggestions
              .sort((a, b) => b.relevance - a.relevance)
              .slice(0, 3)
              .map((suggestion, i) => (
                <div key={i} className="bg-white p-3 rounded-lg border border-amber-200">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-semibold text-amber-900 text-sm">{suggestion.product}</p>
                      <Badge className="mt-1 bg-amber-600 text-white text-xs">
                        {suggestion.relevance}% relevante
                      </Badge>
                    </div>
                    {suggestion.estimated_value > 0 && (
                      <div className="flex items-center gap-1 text-green-600">
                        <DollarSign className="w-3 h-3" />
                        <span className="text-xs font-semibold">
                          {suggestion.estimated_value.toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="bg-amber-50 p-2 rounded">
                      <p className="text-xs font-semibold text-amber-900 mb-1">⏰ Por que agora:</p>
                      <p className="text-xs text-amber-800">{suggestion.reason_now}</p>
                    </div>
                    
                    <div className="bg-green-50 p-2 rounded">
                      <p className="text-xs font-semibold text-green-900 mb-1">💬 Como mencionar:</p>
                      <p className="text-xs italic text-green-800">"{suggestion.how_to_mention}"</p>
                    </div>
                  </div>
                </div>
              ))}
            
            <Button
              onClick={generateSuggestions}
              variant="outline"
              size="sm"
              className="w-full border-amber-300 text-amber-700"
            >
              <Sparkles className="w-3 h-3 mr-2" />
              Atualizar Sugestões
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
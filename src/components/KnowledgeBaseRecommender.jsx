import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Lightbulb, ExternalLink } from 'lucide-react';

export default function KnowledgeBaseRecommender({ client, interaction }) {
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(false);

  const { data: knowledgeBase = [] } = useQuery({
    queryKey: ['knowledge_base'],
    queryFn: async () => {
      try {
        return await base44.entities.KnowledgeBase.filter({ is_active: true });
      } catch (error) {
        console.error('Erro ao buscar base de conhecimento:', error);
        return [];
      }
    },
    staleTime: 30 * 60 * 1000,
  });

  const generateRecommendations = async () => {
    if (!client || knowledgeBase.length === 0) return;
    
    setLoading(true);
    try {
      const contextData = {
        clientType: client.client_type,
        equipment: client.equipment_interest || client.current_equipment,
        status: client.status,
        mainPains: client.main_pains?.join(', '),
        lastInteractionType: interaction?.type,
        stage: client.pipeline_stage
      };

      const prompt = `Com base no contexto do cliente, recomende artigos relevantes da base de conhecimento.

CONTEXTO DO CLIENTE:
- Tipo: ${contextData.clientType}
- Equipamento: ${contextData.equipment}
- Status: ${contextData.status}
- Dores: ${contextData.mainPains}
- Última interação: ${contextData.lastInteractionType}
- Estágio: ${contextData.stage}

ARTIGOS DISPONÍVEIS:
${knowledgeBase.map(a => `- "${a.title}" (categoria: ${a.category}, tags: ${a.tags?.join(', ')})`).join('\n')}

RETORNE JSON COM 3 RECOMENDAÇÕES:
{
  "recommendations": [
    {
      "article_title": "título",
      "reason": "Por que é relevante",
      "best_time": "Quando mostrar",
      "sales_impact": "Como ajuda na venda"
    }
  ]
}`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  article_title: { type: "string" },
                  reason: { type: "string" },
                  best_time: { type: "string" },
                  sales_impact: { type: "string" }
                }
              }
            }
          }
        }
      });

      // Mapear para artigos reais
      const mapped = result.recommendations.map(rec => {
        const article = knowledgeBase.find(a => a.title === rec.article_title);
        return {
          ...rec,
          article_id: article?.id,
          article: article
        };
      });

      setRecommendations(mapped);
    } catch (error) {
      console.error('Erro ao gerar recomendações:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (client && knowledgeBase.length > 0) {
      generateRecommendations();
    }
  }, [client?.id, interaction?.id, knowledgeBase.length]);

  if (loading) {
    return (
      <Card className="p-4 bg-gradient-to-r from-amber-50 to-orange-50">
        <div className="flex items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
          <span className="text-sm text-amber-700">Buscando artigos relevantes...</span>
        </div>
      </Card>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  return (
    <Card className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb className="w-5 h-5 text-amber-600" />
        <h3 className="font-semibold text-slate-800">Artigos Recomendados</h3>
      </div>

      <div className="space-y-2">
        {recommendations.map((rec, idx) => (
          <div key={idx} className="p-3 bg-white rounded-lg border border-amber-200">
            <div className="flex items-start justify-between mb-1">
              <p className="font-medium text-slate-800 text-sm">{rec.article_title}</p>
              <Badge className="bg-amber-100 text-amber-700 text-xs">
                {idx === 0 ? 'Mais relevante' : `Relevante`}
              </Badge>
            </div>
            
            <p className="text-xs text-slate-600 mb-1">💡 {rec.reason}</p>
            <p className="text-xs text-slate-500 mb-2">⏰ {rec.best_time}</p>
            <p className="text-xs text-green-700 mb-2">📈 {rec.sales_impact}</p>
            
            {rec.article && (
              <Button
                size="sm"
                variant="outline"
                className="text-xs h-7"
                onClick={() => window.open(`#article/${rec.article.id}`)}
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                Ver artigo
              </Button>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}
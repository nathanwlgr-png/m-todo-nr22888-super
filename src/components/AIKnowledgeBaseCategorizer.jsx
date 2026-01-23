import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, CheckCircle2 } from 'lucide-react';

export default function AIKnowledgeBaseCategorizer() {
  const [processing, setProcessing] = useState(false);
  const queryClient = useQueryClient();

  const { data: articles = [] } = useQuery({
    queryKey: ['knowledge_base_unprocessed'],
    queryFn: async () => {
      try {
        return await base44.entities.KnowledgeBase.filter({ ai_processed: false });
      } catch (error) {
        console.error('Erro ao buscar artigos:', error);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  const processArticles = async () => {
    setProcessing(true);
    try {
      for (const article of articles.slice(0, 5)) {
        const prompt = `Analise este artigo de conhecimento e forneça em JSON:
        
ARTIGO:
"${article.content.substring(0, 2000)}"

RETORNE JSON COM:
{
  "summary": "Resumo em 2-3 linhas",
  "category": "Uma categoria: equipamento_vg2, equipamento_vg1, equipamento_vq1, equipamento_qt3, equipamento_3dx, equipamento_smt120, técnica_diagnóstica, patologia, procedimento, melhorias_operacionais, vendas_estratégia, ou outro",
  "tags": ["tag1", "tag2", "tag3"],
  "keywords": ["palavra1", "palavra2", "palavra3"],
  "equipment_related": ["VG2", "QT3"],
  "use_cases": ["Caso 1", "Caso 2"]
}`;

        const result = await base44.integrations.Core.InvokeLLM({
          prompt,
          response_json_schema: {
            type: "object",
            properties: {
              summary: { type: "string" },
              category: { type: "string" },
              tags: { type: "array", items: { type: "string" } },
              keywords: { type: "array", items: { type: "string" } },
              equipment_related: { type: "array", items: { type: "string" } },
              use_cases: { type: "array", items: { type: "string" } }
            }
          }
        });

        await base44.entities.KnowledgeBase.update(article.id, {
          summary: result.summary,
          category: result.category,
          tags: result.tags,
          keywords: result.keywords,
          equipment_related: result.equipment_related,
          use_cases: result.use_cases,
          ai_processed: true,
          last_ai_update: new Date().toISOString()
        });
      }

      queryClient.invalidateQueries(['knowledge_base_unprocessed']);
    } catch (error) {
      console.error('Erro ao processar artigos:', error);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Card className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-slate-800">Auto-Categorização IA</p>
            <p className="text-xs text-slate-600">{articles.length} artigos aguardando processamento</p>
          </div>
        </div>
        <Button
          onClick={processArticles}
          disabled={processing || articles.length === 0}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          {processing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-1" />
              Processando...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 mr-1" />
              Processar
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}
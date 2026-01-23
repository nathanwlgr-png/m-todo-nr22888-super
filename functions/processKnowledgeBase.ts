import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { action, articleId, limit = 5 } = body;

    if (action === 'summarize') {
      // Resumir artigo específico
      const article = await base44.asServiceRole.entities.KnowledgeBase.list();
      const targetArticle = article.find(a => a.id === articleId);

      if (!targetArticle || targetArticle.summary) {
        return Response.json({ error: 'Artigo não encontrado ou já processado' }, { status: 400 });
      }

      const summaryPrompt = `Resuma este artigo em 2-3 frases claras e práticas:

"${targetArticle.content.substring(0, 3000)}"

Responda apenas com o resumo, sem prefixos.`;

      const summary = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: summaryPrompt
      });

      await base44.asServiceRole.entities.KnowledgeBase.update(articleId, {
        summary: summary.substring(0, 500),
        last_ai_update: new Date().toISOString()
      });

      return Response.json({ success: true, summary });
    }

    if (action === 'batch_process') {
      // Processar lote de artigos
      const allArticles = await base44.asServiceRole.entities.KnowledgeBase.list();
      const toProcess = allArticles.filter(a => !a.ai_processed).slice(0, limit);

      const results = [];

      for (const article of toProcess) {
        try {
          const processPrompt = `Analise este artigo de conhecimento e forneça em JSON:

ARTIGO:
"${article.content.substring(0, 2500)}"

RETORNE EXATAMENTE ESTE JSON (sem markdown, sem comentários):
{
  "summary": "Resumo em 2-3 linhas",
  "category": "equipamento_vg2|equipamento_vg1|equipamento_vq1|equipamento_qt3|equipamento_3dx|equipamento_smt120|técnica_diagnóstica|patologia|procedimento|melhorias_operacionais|vendas_estratégia|outro",
  "tags": ["tag1", "tag2", "tag3"],
  "keywords": ["palavra1", "palavra2"],
  "equipment_related": ["VG2"],
  "use_cases": ["caso1"]
}`;

          const processed = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt: processPrompt,
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

          await base44.asServiceRole.entities.KnowledgeBase.update(article.id, {
            summary: processed.summary,
            category: processed.category || 'outro',
            tags: processed.tags || [],
            keywords: processed.keywords || [],
            equipment_related: processed.equipment_related || [],
            use_cases: processed.use_cases || [],
            ai_processed: true,
            last_ai_update: new Date().toISOString()
          });

          results.push({ id: article.id, status: 'success' });
        } catch (error) {
          results.push({ id: article.id, status: 'error', error: error.message });
        }
      }

      return Response.json({ 
        success: true, 
        processed: results.length,
        results 
      });
    }

    if (action === 'increment_views') {
      // Incrementar visualizações
      const article = await base44.asServiceRole.entities.KnowledgeBase.list();
      const targetArticle = article.find(a => a.id === articleId);

      if (!targetArticle) {
        return Response.json({ error: 'Artigo não encontrado' }, { status: 400 });
      }

      const newViewCount = (targetArticle.views_count || 0) + 1;
      
      // Calcular score de relevância
      const relevanceScore = Math.min(100, (newViewCount * 5) + (targetArticle.tags?.length || 0) * 2);

      await base44.asServiceRole.entities.KnowledgeBase.update(articleId, {
        views_count: newViewCount,
        relevance_score: relevanceScore
      });

      return Response.json({ success: true, views: newViewCount });
    }

    return Response.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
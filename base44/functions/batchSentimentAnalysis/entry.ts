import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Buscar interações sem análise de sentimento
    const interactions = await base44.asServiceRole.entities.Interaction.list();
    const unanalyzed = interactions.filter(i => !i.sentiment && i.notes);

    let analyzed = 0;

    for (const interaction of unanalyzed.slice(0, 50)) {
      try {
        await base44.asServiceRole.functions.invoke('analyzeSentiment', {
          interaction_id: interaction.id,
          text: interaction.notes
        });
        analyzed++;
      } catch (error) {
        console.error(`Error analyzing ${interaction.id}:`, error);
      }
    }

    return Response.json({
      success: true,
      analyzed,
      remaining: unanalyzed.length - analyzed
    });

  } catch (error) {
    console.error('Batch sentiment error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
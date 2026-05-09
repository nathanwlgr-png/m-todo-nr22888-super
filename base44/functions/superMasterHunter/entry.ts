import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  const startTime = Date.now();
  
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { city, radius_km, segment, max_leads, depth, economic_mode } = await req.json();

    // Validações
    if (!city || !segment) return Response.json({ error: 'city and segment required' }, { status: 400 });
    
    const maxLeads = Math.min(max_leads || 15, 25); // máximo 25
    const timeout = 120000; // 2 minutos
    
    // TIMEOUT PROTECTION
    let timedOut = false;
    const timeoutHandle = setTimeout(() => { timedOut = true; }, timeout);

    // ANTI-LOOP: Verificar se há investigação em andamento
    const ongoingInvestigations = await base44.asServiceRole.entities.AuditLog?.filter({
      action: 'super_master_hunter',
      user_email: user.email
    }).catch(() => []);

    const recentInvestigation = ongoingInvestigations?.find(log => {
      const minuteAgo = new Date(Date.now() - 60000);
      return new Date(log.created_date) > minuteAgo;
    });

    if (recentInvestigation) {
      clearTimeout(timeoutHandle);
      return Response.json({
        error: 'Investigação em andamento. Aguarde 1 minuto antes de iniciar outra.',
        status: 'busy'
      }, { status: 429 });
    }

    // 1. BUSCAR LEADS EXISTENTES NO CRM
    const existingLeads = await base44.asServiceRole.entities.LeadHunter
      .filter({ city, segment }, '-created_date', maxLeads * 2)
      .catch(() => []);

    if (timedOut) {
      clearTimeout(timeoutHandle);
      return Response.json({ error: 'Timeout' }, { status: 504 });
    }

    // 2. ENRIQUECER COM IA (cache 30 dias)
    const enrichedLeads = [];
    const creditsUsed = [];

    for (const lead of existingLeads.slice(0, maxLeads)) {
      if (timedOut) break;
      if (enrichedLeads.length >= maxLeads) break;

      // Verificar se já foi investigado nos últimos 30 dias
      if (lead.ia_analysis_expires_at) {
        const expiry = new Date(lead.ia_analysis_expires_at);
        if (expiry > new Date()) {
          // Usar cache
          enrichedLeads.push({
            ...lead,
            cached: true,
            analysis: lead.ia_analysis_cache
          });
          continue;
        }
      }

      try {
        // Determinar profundidade de análise
        const depthPrompt = depth === 'suprema' ? 'Análise PROFUNDA com risco assessment, oportunidades ocultas, análise de saturation local.'
          : depth === 'profunda' ? 'Análise DETALHADA com sinais de crescimento, concorrência e oportunidades de venda.'
          : depth === 'media' ? 'Análise MODERADA com sinais principais e oportunidades básicas.'
          : 'Análise LEVE com sinais essenciais apenas.';

        const analysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `Você é especialista em vendas B2B veterinária.

LEAD:
Nome: ${lead.company_name}
Segmento: ${segment}
Cidade: ${city}
Website: ${lead.website || 'N/A'}
Instagram: ${lead.instagram || 'N/A'}
Google Rating: ${lead.google_rating || 'N/A'}
Reviews: ${lead.google_reviews_count || 'N/A'}
Sinais conhecidos: ${lead.signals?.map(s => s.evidence).join(', ') || 'Nenhum'}

TAREFA: ${depthPrompt}

Retorne em JSON:
{
  "score": 0-100,
  "chance_fechamento": "baixa|media|alta|muito_alta",
  "produto_ideal": "VG2|Hematologia|Bioquimica|Outro",
  "urgencia": "normal|media|alta|critica",
  "potencial_recompra": 0-100,
  "abordagem_ideal": "email|whatsapp|ligacao|visita",
  "roi_resumido": "estimativa em 6 meses",
  "proxima_acao": "acao concreta"
}`,
          model: economic_mode ? undefined : 'gemini_3_flash',
          response_json_schema: {
            type: "object",
            properties: {
              score: { type: "number" },
              chance_fechamento: { type: "string" },
              produto_ideal: { type: "string" },
              urgencia: { type: "string" },
              potencial_recompra: { type: "number" },
              abordagem_ideal: { type: "string" },
              roi_resumido: { type: "string" },
              proxima_acao: { type: "string" }
            }
          }
        });

        // Atualizar lead com análise
        const updated = await base44.asServiceRole.entities.LeadHunter.update(lead.id, {
          ia_analysis_cache: analysis,
          ia_analysis_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }).catch(() => lead);

        enrichedLeads.push({
          ...updated,
          cached: false,
          analysis
        });

        creditsUsed.push(economic_mode ? 1 : 3);
      } catch (e) {
        console.error('Erro ao enriquecer lead:', e);
      }
    }

    clearTimeout(timeoutHandle);

    // 3. CLASSIFICAR POR PRIORIDADE
    const scored = enrichedLeads.sort((a, b) => {
      const scoreA = a.analysis?.score || a.score_opportunity || 50;
      const scoreB = b.analysis?.score || b.score_opportunity || 50;
      return scoreB - scoreA;
    });

    const hotLeads = scored.filter(l => (l.analysis?.score || 0) > 75).length;
    const urgentLeads = scored.filter(l => l.analysis?.urgencia === 'critica' || l.analysis?.urgencia === 'alta').length;

    // 4. LOG DE AUDITORIA
    try {
      await base44.asServiceRole.entities.AuditLog.create({
        action: 'super_master_hunter',
        module: 'SuperMasterHunter',
        user_email: user.email,
        duration_ms: Date.now() - startTime,
        cost_credits: creditsUsed.reduce((a, b) => a + b, 0),
        success: true,
        input_size: JSON.stringify({ city, segment, radius_km, max_leads, depth }).length,
        output_size: JSON.stringify(scored).length
      });
    } catch (e) {
      console.error('Auditoria falhou (non-critical):', e);
    }

    // 5. RETORNO
    return Response.json({
      success: true,
      city,
      segment,
      depth,
      leads_found: scored.length,
      hot_leads: hotLeads,
      urgent_leads: urgentLeads,
      potential_revenue: scored.length > 0 
        ? `R$ ${(scored.length * 30000).toLocaleString('pt-BR')}`
        : 'N/A',
      leads: scored.slice(0, maxLeads).map(lead => ({
        name: lead.company_name,
        city: lead.city,
        distance_km: radius_km, // simplificado
        score: lead.analysis?.score || lead.score_opportunity || 75,
        signals: [
          lead.analysis?.urgencia && `Urgência: ${lead.analysis.urgencia}`,
          lead.analysis?.chance_fechamento && `Fechamento: ${lead.analysis.chance_fechamento}`,
          lead.analysis?.produto_ideal && `Produto: ${lead.analysis.produto_ideal}`
        ].filter(Boolean),
        whatsapp: lead.phone,
        maps_url: lead.google_maps_url || `https://maps.google.com/?q=${encodeURIComponent(lead.company_name + ' ' + lead.city)}`,
        instagram: lead.instagram,
        analysis: lead.analysis
      }))
    });

  } catch (error) {
    console.error('Erro Super Master Hunter:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
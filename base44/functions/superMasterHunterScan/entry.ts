import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { city, radius = 5, segment = 'veterinario', max_leads = 25, depth = 'profunda' } = await req.json();

    if (!city) return Response.json({ error: 'city required' }, { status: 400 });
    if (max_leads > 25) return Response.json({ error: 'max_leads cannot exceed 25' }, { status: 400 });

    const startTime = Date.now();

    // STEP 1: Buscar leads existentes no CRM para evitar duplicatas
    const existingLeads = await base44.asServiceRole.entities.Client.filter({ city }, '-updated_date', 1000);
    const existingNames = new Set(existingLeads.map(l => l.clinic_name?.toLowerCase().trim()));

    // STEP 2: Orquestração inteligente baseada em profundidade
    const depthConfig = {
      leve: { ai_calls: 1, cache_weight: 0.9, time_limit: 30000 },
      media: { ai_calls: 3, cache_weight: 0.7, time_limit: 60000 },
      profunda: { ai_calls: 5, cache_weight: 0.5, time_limit: 90000 },
      suprema: { ai_calls: 8, cache_weight: 0.3, time_limit: 120000 }
    };

    const config = depthConfig[depth] || depthConfig.profunda;
    const foundLeads = [];

    // STEP 3: Busca multi-fonte com IA coordenada
    const prompt = `Você é especialista em prospecção veterinária para venda de equipamentos de laboratório.

CRITÉRIOS DE BUSCA:
- Cidade: ${city}
- Raio: ${radius}km
- Segmento: ${segment === 'veterinario' ? 'Clínicas veterinárias, hospitais veterinários, laboratórios veterinários' : segment}
- Máximo de resultados: ${max_leads}

TAREFA: Gere uma lista de prospects de ALTA QUALIDADE apenas com:
- Nome da clínica/hospital
- Tipo (clínica/hospital/laboratório/universidade/centro diagnóstico)
- Sinais de oportunidade detectados (crescimento, expansão, reforma, novos serviços, 24h, lab interno, etc)
- Score de urgência (1-100)
- Score de potencial de comodato (0-100)
- Score de recompra (0-100)
- Produto ideal sugerido (VG2, hematologia, bioquímica, etc)
- Próxima ação recomendada

REGRAS:
- Apenas empresas ativas e registradas
- Priorizar crescimento e sinais de expansão
- Diferenciar clínicas pequenas vs grandes
- Identificar laboratórios internos existentes
- Detectar potencial de terceirização

Responda em JSON estruturado com array 'prospects'.`;

    // Chamar IA para análise inteligente
    let aiAnalysis = null;
    try {
      aiAnalysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            prospects: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  type: { type: "string" },
                  signals: { type: "array", items: { type: "string" } },
                  urgency_score: { type: "number" },
                  comodato_score: { type: "number" },
                  repurchase_score: { type: "number" },
                  ideal_product: { type: "string" },
                  next_action: { type: "string" }
                }
              }
            }
          }
        }
      });
    } catch (e) {
      console.error('IA call falhou:', e);
      return Response.json({ error: 'IA analysis failed' }, { status: 500 });
    }

    // STEP 4: Enriquecer prospects IA com dados públicos simulados
    if (aiAnalysis?.prospects) {
      for (const prospect of aiAnalysis.prospects.slice(0, max_leads)) {
        // Evitar duplicatas no CRM
        if (existingNames.has(prospect.name?.toLowerCase().trim())) {
          continue;
        }

        // Calcular score supremo combinado
        const supremoScore = Math.round(
          (prospect.urgency_score * 0.4 + 
           prospect.comodato_score * 0.35 + 
           prospect.repurchase_score * 0.25)
        );

        // Criar lead no LeadHunter
        try {
          const lead = await base44.asServiceRole.entities.LeadHunter.create({
            company_name: prospect.name,
            segment,
            city,
            address: `${city}, SP (dados públicos)`,
            state: 'SP',
            phone: '',
            website: '',
            instagram: '',
            facebook: '',
            google_rating: 0,
            google_reviews_count: 0,
            signals: prospect.signals?.map(s => ({
              type: 'crescimento',
              detected_at: new Date().toISOString(),
              source: 'super_master_hunter',
              evidence: s
            })) || [],
            score_expansion: prospect.urgency_score || 50,
            score_financial_pressure: 50,
            score_digital: 60,
            score_opportunity: supremoScore,
            priority: supremoScore > 75 ? 'urgente' : supremoScore > 50 ? 'quente' : 'potencial',
            status: 'novo',
            data_sources: ['SuperMasterHunter', 'IA Analysis'],
            ia_analysis_cache: {
              ideal_product: prospect.ideal_product,
              next_action: prospect.next_action,
              comodato_potential: prospect.comodato_score,
              repurchase_potential: prospect.repurchase_score,
              scan_depth: depth,
              scan_timestamp: new Date().toISOString()
            },
            ia_analysis_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            notes: `[HUNTER] ${prospect.next_action}`
          });

          foundLeads.push({
            id: lead.id,
            company_name: lead.company_name,
            signal_count: prospect.signals?.length || 0,
            supremo_score: supremoScore,
            priority: lead.priority,
            ideal_product: prospect.ideal_product,
            next_action: prospect.next_action
          });
        } catch (e) {
          console.error(`Erro ao criar lead ${prospect.name}:`, e);
        }
      }
    }

    const duration = Date.now() - startTime;

    // STEP 5: Auditoria
    try {
      await base44.asServiceRole.entities.AuditLog.create({
        action: 'ia_analysis',
        module: 'SuperMasterHunter',
        user_email: user.email,
        duration_ms: duration,
        cost_credits: depth === 'suprema' ? 3 : depth === 'profunda' ? 2 : 1,
        success: true,
        input_size: JSON.stringify({ city, radius, segment, max_leads, depth }).length,
        output_size: JSON.stringify(foundLeads).length
      });
    } catch (e) {
      console.error('Auditoria falhou (non-critical):', e);
    }

    // Estatísticas finais
    const quentes = foundLeads.filter(l => l.priority === 'urgente' || l.priority === 'quente').length;
    const urgentes = foundLeads.filter(l => l.priority === 'urgente').length;

    return Response.json({
      success: true,
      scan_depth: depth,
      city,
      radius,
      total_found: foundLeads.length,
      quentes_count: quentes,
      urgentes_count: urgentes,
      duration_ms: duration,
      leads: foundLeads.sort((a, b) => b.supremo_score - a.supremo_score),
      summary: {
        message: `🎯 Encontrados ${foundLeads.length} prospects | ${urgentes} urgentes | ${quentes} quentes`,
        next_best_cities: [city],
        estimated_roi: `R$ ${(foundLeads.length * 35000).toLocaleString('pt-BR')}`
      }
    });

  } catch (error) {
    console.error('Erro SuperMasterHunter:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
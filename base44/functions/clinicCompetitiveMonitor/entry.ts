import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { city = 'São Paulo', state = 'SP', radius_km = 100, notify_phone = null } = body;

    console.log(`🔍 Iniciando monitoramento competitivo: ${city}/${state}`);

    // ── 1. Buscar clínicas existentes no CRM para evitar duplicatas ──────────
    const existingClients = await base44.asServiceRole.entities.Client.list();
    const existingNames = new Set(
      existingClients.map(c => (c.clinic_name || c.full_name || '').toLowerCase())
    );

    // ── 2. Buscar novas clínicas via IA + dados públicos ─────────────────────
    const searchResult = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Você é um especialista em inteligência competitiva do mercado veterinário brasileiro.

Analise o mercado veterinário em ${city}, ${state} e arredores (raio ~${radius_km}km) em 2026.

IDENTIFIQUE:
1. Clínicas veterinárias novas (inauguradas nos últimos 6 meses)
2. Clínicas em expansão (anúncios de obras, novos serviços, novas unidades)
3. Clínicas que recentemente anunciaram ou podem precisar de equipamentos de diagnóstico in-house
4. Hospitais veterinários com potencial para analisadores hematológicos/bioquímicos
5. Laboratórios veterinários que podem trocar de fornecedor

PERFIL IDEAL SEAMATY (alta compatibilidade):
- Clínica que realiza 40-230+ exames de sangue/mês
- Possui espaço para equipamento de bancada
- Interessa em resultado rápido in-house (3-8 min por amostra)
- Orçamento R$80k-200k para equipamento
- Valoriza garantia estendida e bonificação em insumos

Para CADA clínica identificada, forneça análise de fit com Seamaty (0-100) e razões.
Use dados públicos: Google Maps, redes sociais, sites, notícias locais.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          new_clinics: {
            type: "array",
            items: {
              type: "object",
              properties: {
                clinic_name: { type: "string" },
                address: { type: "string" },
                city: { type: "string" },
                state: { type: "string" },
                phone: { type: "string" },
                google_maps_url: { type: "string" },
                segment: { type: "string" },
                detection_type: { type: "string" },
                seamaty_fit_score: { type: "number" },
                fit_reasons: { type: "array", items: { type: "string" } },
                services_offered: { type: "array", items: { type: "string" } },
                estimated_monthly_exams: { type: "string" },
                recommended_product: { type: "string" },
                ai_summary: { type: "string" },
                source: { type: "string" }
              }
            }
          },
          market_summary: { type: "string" },
          total_opportunities: { type: "number" },
          high_priority_count: { type: "number" }
        }
      }
    });

    const clinics = searchResult.new_clinics || [];
    console.log(`✅ IA identificou ${clinics.length} clínicas potenciais`);

    // ── 3. Filtrar novas (não estão no CRM) com score >= 60 ──────────────────
    const newHighFit = clinics.filter(c =>
      c.seamaty_fit_score >= 60 &&
      !existingNames.has((c.clinic_name || '').toLowerCase())
    );

    // ── 4. Salvar alertas no banco ────────────────────────────────────────────
    const savedAlerts = [];
    for (const clinic of newHighFit.slice(0, 20)) {
      const alert = await base44.asServiceRole.entities.ClinicAlert.create({
        clinic_name: clinic.clinic_name || 'Clínica sem nome',
        city: clinic.city || city,
        state: clinic.state || state,
        phone: clinic.phone || '',
        address: clinic.address || '',
        google_maps_url: clinic.google_maps_url || '',
        segment: clinic.segment || 'clinica_media',
        detection_type: clinic.detection_type || 'nova_clinica',
        seamaty_fit_score: clinic.seamaty_fit_score || 70,
        fit_reasons: clinic.fit_reasons || [],
        services_offered: clinic.services_offered || [],
        estimated_monthly_exams: clinic.estimated_monthly_exams || 'Não estimado',
        recommended_product: clinic.recommended_product || 'SMT-120VP',
        ai_summary: clinic.ai_summary || '',
        source: clinic.source || 'Google Maps / IA',
        detected_at: new Date().toISOString(),
        whatsapp_alert_sent: false,
        status: 'novo'
      }).catch(e => { console.error('Erro ao salvar alerta:', e.message); return null; });
      if (alert) savedAlerts.push(alert);
    }

    // ── 5. SAFE: NÃO envia WhatsApp automático e NÃO marca como enviado ───────
    // Apenas prepara a mensagem como rascunho em PendingMessage para aprovação humana.
    let whatsappPrepared = false;
    if (notify_phone && newHighFit.length > 0) {
      const topClinics = newHighFit
        .sort((a, b) => b.seamaty_fit_score - a.seamaty_fit_score)
        .slice(0, 3);

      const msgLines = [
        `🔔 *RADAR SEAMATY — Novas Oportunidades*`,
        `📍 ${city}/${state} | ${new Date().toLocaleDateString('pt-BR')}`,
        ``,
        `*${newHighFit.length} clínicas novas detectadas!*`,
        ``,
        ...topClinics.map((c, i) =>
          `${i + 1}. *${c.clinic_name}*\n` +
          `   Score Fit: ${c.seamaty_fit_score}/100\n` +
          `   📌 ${c.address || c.city}\n` +
          `   💡 ${c.recommended_product || 'SMT-120VP'}\n` +
          `   ✅ ${(c.fit_reasons || []).slice(0, 2).join(' | ')}`
        ),
        ``,
        `Ver todas → Painel Inteligência Competitiva`
      ];

      const message = msgLines.join('\n');

      // Rascunho aguardando aprovação humana — nunca enviado automaticamente
      await base44.asServiceRole.entities.PendingMessage.create({
        canal: 'whatsapp',
        channel: 'whatsapp',
        destinatario_contato: String(notify_phone),
        recipient_phone: String(notify_phone),
        recipient_name: 'Vendedor (radar)',
        message_content: message,
        mensagem: message,
        context: `Radar competitivo ${city}/${state}`,
        status: 'pending',
        priority: 'media',
        criado_por_agente: 'clinicCompetitiveMonitor',
      }).catch(() => null);

      whatsappPrepared = true;
      // NÃO marcar whatsapp_alert_sent — só é "enviado" após confirmação humana.
      console.log(`📝 Alerta WhatsApp preparado (rascunho) para aprovação: ${notify_phone}`);
    }

    // ── 6. Criar notificação no sistema ──────────────────────────────────────
    if (newHighFit.length > 0) {
      await base44.asServiceRole.entities.Alert?.create?.({
        user_email: user.email,
        title: `🏥 ${newHighFit.length} Novas Clínicas Detectadas em ${city}`,
        message: `Monitoramento identificou ${newHighFit.length} clínicas com alto fit para Seamaty. Top: ${newHighFit[0]?.clinic_name || 'Ver dashboard'}`,
        type: 'high_score_lead',
        priority: newHighFit.length >= 5 ? 'alta' : 'media',
        link_to: 'CompetitiveIntelligenceDashboard',
        read: false,
        dismissed: false
      }).catch(() => null);
    }

    return Response.json({
      success: true,
      region: `${city}/${state}`,
      total_found: clinics.length,
      high_fit_new: newHighFit.length,
      saved_alerts: savedAlerts.length,
      market_summary: searchResult.market_summary || '',
      whatsapp_sent: false,
      whatsapp_prepared: whatsappPrepared,
      top_opportunities: newHighFit
        .sort((a, b) => b.seamaty_fit_score - a.seamaty_fit_score)
        .slice(0, 5)
        .map(c => ({
          name: c.clinic_name,
          score: c.seamaty_fit_score,
          product: c.recommended_product,
          city: c.city
        }))
    });

  } catch (error) {
    console.error('clinicCompetitiveMonitor error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
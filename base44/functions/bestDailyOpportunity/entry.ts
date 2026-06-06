import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Fetch clients com dados essenciais
    const clients = await base44.asServiceRole.entities.Client.list('-updated_date', 500);
    
    if (!clients.length) {
      return Response.json({ opp: null });
    }

    // Scoring para melhor oportunidade: equipamento como eixo central
    const now = new Date();
    const scored = clients
      .filter(c => c.status !== 'frio' && c.pipeline_stage !== 'perdido')
      .map(c => {
        let score = 0;

        // Equipamento = prioridade máxima
        if (c.equipment_interest) score += 40;
        if (!c.equipment_sold) score += 30; // Sem equipamento = alta oportunidade

        // Recência
        const lastContact = c.last_contact_date ? new Date(c.last_contact_date) : null;
        if (!lastContact || (now - lastContact) < 7 * 86400000) score += 15; // Contato recente
        
        // Status quente
        if (c.status === 'quente') score += 20;
        if (c.status === 'morno') score += 10;

        // Score purchase
        if ((c.purchase_score || 0) >= 70) score += 15;

        // Sem proposta = oportunidade aberta
        if (c.pipeline_stage !== 'proposta' && c.pipeline_stage !== 'negociacao') score += 10;

        return { ...c, opportunityScore: score };
      })
      .sort((a, b) => b.opportunityScore - a.opportunityScore)[0];

    if (!scored) {
      return Response.json({ opp: null });
    }

    // Análise invisível rápida
    const equipment = scored.equipment_interest || 'VG2';
    const potentialReason = [];
    
    if (!scored.equipment_sold) potentialReason.push('Sem equipamento Seamaty');
    if ((scored.purchase_score || 0) >= 70) potentialReason.push('Score alto');
    if (scored.status === 'quente') potentialReason.push('Cliente quente');
    if (scored.last_purchase_date) {
      const daysSince = Math.floor((now - new Date(scored.last_purchase_date)) / 86400000);
      if (daysSince > 30) potentialReason.push(`Sem compra ${daysSince}d`);
    }

    return Response.json({
      opp: {
        id: scored.id,
        name: scored.first_name || scored.full_name,
        clinic: scored.clinic_name,
        city: scored.city,
        score: Math.round(scored.opportunityScore),
        equipment: equipment,
        potentialReason: potentialReason.join(' • '),
        nextAction: 'Apresentar ' + equipment,
        phone: scored.phone || null,
        status: scored.status,
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
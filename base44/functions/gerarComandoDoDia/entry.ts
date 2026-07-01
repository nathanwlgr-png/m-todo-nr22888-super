import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const clients = await base44.entities.Client.list('-purchase_score', 500).catch(() => []);
    const sales = await base44.entities.Sale.list('-sale_date', 100).catch(() => []);
    const consumables = await base44.entities.ConsumableOrder?.list('-next_reorder_date', 100).catch(() => []);
    const leads = await base44.entities.Lead?.list('-created_date', 100).catch(() => []);
    const tasks = await base44.entities.Task?.list('-due_date', 100).catch(() => []);

    const now = new Date();

    // TOP 10 EQUIPAMENTOS (Clientes sem equipamento + score alto)
    const topEquipamentos = clients
      .filter(c => !c.equipment_sold && (c.purchase_score || 0) >= 70)
      .sort((a, b) => (b.purchase_score || 0) - (a.purchase_score || 0))
      .slice(0, 10)
      .map(c => ({
        name: c.clinic_name || c.full_name || c.first_name,
        score: c.purchase_score,
        city: c.city,
        recomendacao: !c.current_equipment ? 'VG1/VG2' : 'SMT/QT3'
      }));

    // TOP 10 COMODATOS (40-60 exames/mês)
    const topComodatos = clients
      .filter(c => c.current_volume && ['40_120_mes', '120_230_mes'].includes(c.current_volume))
      .sort((a, b) => (b.purchase_score || 0) - (a.purchase_score || 0))
      .slice(0, 10)
      .map(c => ({
        name: c.clinic_name || c.full_name || c.first_name,
        city: c.city,
        volume: c.current_volume,
        status: c.status
      }));

    // TOP 10 RECORRÊNCIAS (Próxima reorder próxima)
    const topRecorrencias = consumables
      .filter(c => {
        if (!c.next_reorder_date) return false;
        const days = (new Date(c.next_reorder_date) - now) / (1000 * 60 * 60 * 24);
        return days <= 14 && days >= 0;
      })
      .slice(0, 10)
      .map(c => ({
        client: c.client_name,
        consumable: c.consumable_type,
        data: c.next_reorder_date,
        valor_potencial: c.monthly_revenue_potential
      }));

    // TOP 10 CLIENTES EM RISCO (Sem contato > 30 dias)
    const topEmRisco = clients
      .filter(c => {
        if (!c.last_contact_date) return true;
        const days = (now - new Date(c.last_contact_date)) / (1000 * 60 * 60 * 24);
        return days > 30;
      })
      .sort((a, b) => (b.average_purchase_value || 0) - (a.average_purchase_value || 0))
      .slice(0, 10)
      .map(c => ({
        name: c.clinic_name || c.full_name || c.first_name,
        dias_sem_contato: c.last_contact_date ? Math.floor((now - new Date(c.last_contact_date)) / (1000 * 60 * 60 * 24)) : 999,
        valor_medio: c.average_purchase_value
      }));

    // TOP 10 FECHAMENTOS (Status = negociação + score alto)
    const topFechamentos = clients
      .filter(c => c.pipeline_stage === 'negociacao' && (c.purchase_score || 0) >= 70)
      .sort((a, b) => (b.projected_revenue || 0) - (a.projected_revenue || 0))
      .slice(0, 10)
      .map(c => ({
        name: c.clinic_name || c.full_name || c.first_name,
        status: c.pipeline_stage,
        receita_prevista: c.projected_revenue,
        deadline: c.decision_deadline
      }));

    // TOP 10 PROSPECÇÕES (Leads quentes)
    const topProspeccoes = leads
      ?.filter(l => l.priority_level === 'critical' || l.priority_level === 'high')
      .sort((a, b) => (b.conversion_probability || 0) - (a.conversion_probability || 0))
      .slice(0, 10)
      .map(l => ({
        name: l.full_name,
        empresa: l.company,
        cidade: l.city,
        score: l.conversion_probability
      })) || [];

    // TOP 10 HOSPITAIS (Maior potencial)
    const topHospitais = clients
      .filter(c => c.client_type && ['hospital_veterinario', 'clinica_media'].includes(c.client_type))
      .sort((a, b) => (b.purchase_score || 0) - (a.purchase_score || 0))
      .slice(0, 10)
      .map(c => ({
        name: c.clinic_name || c.first_name,
        cidade: c.city,
        score: c.purchase_score,
        equipamentos: c.equipment_sold ? 'Sim' : 'Não'
      }));

    return Response.json({
      timestamp: new Date().toISOString(),
      topEquipamentos,
      topComodatos,
      topRecorrencias,
      topEmRisco,
      topFechamentos,
      topProspeccoes,
      topHospitais,
      metaDoMes: {
        equipamentos_alvo: 5,
        receita_alvo: 100000,
        visitas_alvo: 20
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error_type, error_details } = await req.json();

    const fixes = [];
    const failed = [];

    // Auto-fix 1: Visitas sem sincronização
    if (!error_type || error_type === 'missing_calendar_sync') {
      try {
        const unsyncedVisits = await base44.asServiceRole.entities.Visit.filter({ 
          status: 'agendada',
          google_calendar_synced: false
        });

        for (const visit of unsyncedVisits.slice(0, 10)) {
          try {
            await base44.asServiceRole.functions.invoke('autoSyncVisitToCalendar', {
              data: visit,
              entity_id: visit.id
            });
            fixes.push({ type: 'calendar_sync', visit_id: visit.id, status: 'fixed' });
          } catch (e) {
            failed.push({ type: 'calendar_sync', visit_id: visit.id, error: e.message });
          }
        }
      } catch (e) {
        failed.push({ type: 'calendar_sync_batch', error: e.message });
      }
    }

    // Auto-fix 2: Clientes sem score calculado
    if (!error_type || error_type === 'missing_scores') {
      try {
        const clientsWithoutScore = await base44.asServiceRole.entities.Client.filter({ 
          purchase_score: 0 
        });

        if (clientsWithoutScore.length > 0) {
          fixes.push({ 
            type: 'missing_scores', 
            count: clientsWithoutScore.length,
            action: 'Clientes identificados para recálculo de score'
          });
        }
      } catch (e) {
        failed.push({ type: 'score_check', error: e.message });
      }
    }

    // Auto-fix 3: Leads sem status
    if (!error_type || error_type === 'missing_lead_status') {
      try {
        const leadsWithoutStatus = await base44.asServiceRole.entities.Lead.list();
        const toFix = leadsWithoutStatus.filter(l => !l.status);

        for (const lead of toFix.slice(0, 20)) {
          try {
            await base44.asServiceRole.entities.Lead.update(lead.id, { status: 'novo' });
            fixes.push({ type: 'lead_status', lead_id: lead.id, status: 'fixed' });
          } catch (e) {
            failed.push({ type: 'lead_status', lead_id: lead.id, error: e.message });
          }
        }
      } catch (e) {
        failed.push({ type: 'lead_status_batch', error: e.message });
      }
    }

    // Auto-fix 4: Limpar alertas duplicados
    if (!error_type || error_type === 'duplicate_alerts') {
      try {
        const alerts = await base44.asServiceRole.entities.Alert.list('-created_date', 100);
        const seen = new Set();
        const duplicates = [];

        for (const alert of alerts) {
          const key = `${alert.user_email}-${alert.title}`;
          if (seen.has(key)) {
            duplicates.push(alert.id);
          } else {
            seen.add(key);
          }
        }

        // SAFE: não deletar. Apenas marcar como dispensado (reversível).
        for (const dupId of duplicates.slice(0, 50)) {
          try {
            await base44.asServiceRole.entities.Alert.update(dupId, { dismissed: true });
            fixes.push({ type: 'alert_cleanup', alert_id: dupId, status: 'dismissed' });
          } catch (e) {
            failed.push({ type: 'alert_cleanup', alert_id: dupId, error: e.message });
          }
        }
      } catch (e) {
        failed.push({ type: 'alert_cleanup_batch', error: e.message });
      }
    }

    // Registrar execução
    await base44.asServiceRole.entities.Alert.create({
      user_email: user.email,
      title: 'Auto-Fix Executado',
      message: `${fixes.length} correções aplicadas, ${failed.length} falhas`,
      type: 'high_score_lead',
      priority: failed.length > 0 ? 'media' : 'baixa',
      read: false
    }).catch(() => {});

    return Response.json({
      success: true,
      fixes_applied: fixes.length,
      failures: failed.length,
      details: { fixes, failed }
    });

  } catch (error) {
    console.error('autoFixSystem error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
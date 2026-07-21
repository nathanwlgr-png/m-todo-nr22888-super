import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';
import { getAutomationEmail, getOptionalUser, isForbiddenManualUser } from '../../shared/automationAuth.js';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await getOptionalUser(base44);
    if (isForbiddenManualUser(user)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
    const { dry_run = false } = await req.json().catch(() => ({}));

    const healthReport = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      tests: [],
      errors: [],
      warnings: []
    };

    // Teste 1: Entidades principais
    try {
      const clientsTest = await base44.asServiceRole.entities.Client.list('-updated_date', 1);
      healthReport.tests.push({ name: 'Client Entity', status: 'ok', count: clientsTest.length });
    } catch (e) {
      healthReport.errors.push({ test: 'Client Entity', error: e.message });
      healthReport.status = 'error';
    }

    try {
      const leadsTest = await base44.asServiceRole.entities.Lead.list('-updated_date', 1);
      healthReport.tests.push({ name: 'Lead Entity', status: 'ok', count: leadsTest.length });
    } catch (e) {
      healthReport.errors.push({ test: 'Lead Entity', error: e.message });
      healthReport.status = 'error';
    }

    try {
      const visitsTest = await base44.asServiceRole.entities.Visit.list('-updated_date', 1);
      healthReport.tests.push({ name: 'Visit Entity', status: 'ok', count: visitsTest.length });
    } catch (e) {
      healthReport.errors.push({ test: 'Visit Entity', error: e.message });
      healthReport.status = 'error';
    }

    // Teste 2: Google Calendar Sync
    try {
      const gcalConn = await base44.asServiceRole.connectors.getConnection('googlecalendar');
      healthReport.tests.push({ name: 'Google Calendar', status: gcalConn.accessToken ? 'ok' : 'warning' });
    } catch (e) {
      healthReport.warnings.push({ test: 'Google Calendar', message: 'Não conectado' });
    }

    // Integrações e funções não são declaradas saudáveis sem execução real.
    healthReport.warnings.push({
      test: 'Integrações e funções críticas',
      message: 'Não verificadas para evitar consumo de créditos e efeitos colaterais.'
    });

    // Registrar no sistema
    if (!dry_run) {
      await base44.asServiceRole.entities.Alert.create({
        user_email: await getAutomationEmail(base44, user),
        title: `Health Check - ${healthReport.status.toUpperCase()}`,
        message: `${healthReport.tests.length} testes realizados, ${healthReport.errors.length} erros, ${healthReport.warnings.length} avisos`,
        type: 'high_score_lead',
        priority: healthReport.errors.length > 0 ? 'alta' : 'baixa',
        read: false
      }).catch(() => {});
    }

    return Response.json({ ...healthReport, dry_run });

  } catch (error) {
    console.error('systemHealthMonitor error:', error);
    return Response.json({ error: error.message, status: 'critical' }, { status: 500 });
  }
});
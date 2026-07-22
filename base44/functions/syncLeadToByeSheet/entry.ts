import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const CONNECTOR_ID = '6a2d5589e6f59c31e605d3d3';
const SHEET_TITLE = 'Bye';
const TAB = 'Leads';
const HEADERS = ['ID CRM', 'Criado em', 'Nome', 'Empresa/Clínica', 'Cidade', 'Telefone', 'Email', 'Origem', 'Interesse', 'Etapa', 'Status', 'Score', 'Responsável', 'Próxima ação', 'Atualizado em'];

const apiHeaders = (token) => ({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' });
const rowFor = (lead) => [lead.id, lead.created_date || '', lead.full_name || '', lead.company || '', lead.city || '', lead.phone || '', lead.email || '', lead.source || '', lead.interest || '', lead.stage || '', lead.status || '', lead.predictive_score ?? lead.lead_score ?? '', lead.assigned_to || '', lead.next_best_action || '', lead.updated_date || ''];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    if (body.action === 'validate') return Response.json({ success: true, connector_id: CONNECTOR_ID, spreadsheet_title: SHEET_TITLE, tab: TAB });

    const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection(CONNECTOR_ID);
    const headers = apiHeaders(accessToken);
    const configs = await base44.asServiceRole.entities.GoogleSheetsLeadSync.filter({ user_id: user.id }, '-updated_date', 1).catch(() => []);
    let config = configs[0] || null;

    const ensureSpreadsheet = async () => {
      if (config?.spreadsheet_id) return config;
      const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST', headers,
        body: JSON.stringify({ properties: { title: SHEET_TITLE }, sheets: [{ properties: { title: TAB, gridProperties: { frozenRowCount: 1 } } }] })
      });
      const sheet = await createRes.json();
      if (!createRes.ok) throw new Error(sheet.error?.message || 'Não foi possível criar a planilha Bye.');
      const headerRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheet.spreadsheetId}/values/${encodeURIComponent(`${TAB}!A1:O1`)}?valueInputOption=RAW`, {
        method: 'PUT', headers, body: JSON.stringify({ values: [HEADERS] })
      });
      if (!headerRes.ok) throw new Error('A planilha foi criada, mas o cabeçalho não pôde ser preparado.');
      config = await base44.asServiceRole.entities.GoogleSheetsLeadSync.create({ user_id: user.id, user_email: user.email, spreadsheet_id: sheet.spreadsheetId, spreadsheet_url: sheet.spreadsheetUrl, spreadsheet_title: SHEET_TITLE, sheet_name: TAB, synced_count: 0 });
      return config;
    };

    if (body.action === 'status') return Response.json({ success: true, connected: true, configured: Boolean(config), spreadsheet_url: config?.spreadsheet_url || '' });
    config = await ensureSpreadsheet();

    const idsRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheet_id}/values/${encodeURIComponent(`${TAB}!A2:A`)}`, { headers });
    const idsData = idsRes.ok ? await idsRes.json() : { values: [] };
    const existingIds = new Set((idsData.values || []).flat().map(String));
    let leads = [];

    if (body.lead_id) {
      const lead = await base44.asServiceRole.entities.Lead.get(body.lead_id).catch(() => null);
      if (lead && (user.role === 'admin' || lead.created_by_id === user.id || lead.assigned_to === user.email)) leads = [lead];
    } else {
      const [created, assigned] = await Promise.all([
        base44.asServiceRole.entities.Lead.filter({ created_by_id: user.id }, '-created_date', 500).catch(() => []),
        base44.asServiceRole.entities.Lead.filter({ assigned_to: user.email }, '-created_date', 500).catch(() => [])
      ]);
      leads = [...new Map([...created, ...assigned].map((lead) => [lead.id, lead])).values()];
    }

    const pending = leads.filter((lead) => !existingIds.has(String(lead.id)));
    if (pending.length) {
      const appendRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheet_id}/values/${encodeURIComponent(`${TAB}!A:O`)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`, {
        method: 'POST', headers, body: JSON.stringify({ values: pending.map(rowFor) })
      });
      const appendData = await appendRes.json();
      if (!appendRes.ok) throw new Error(appendData.error?.message || 'Não foi possível sincronizar os leads.');
      await base44.asServiceRole.entities.GoogleSheetsLeadSync.update(config.id, { last_synced_at: new Date().toISOString(), synced_count: (config.synced_count || 0) + pending.length });
    }

    return Response.json({ success: true, synced: pending.length, spreadsheet_url: config.spreadsheet_url });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
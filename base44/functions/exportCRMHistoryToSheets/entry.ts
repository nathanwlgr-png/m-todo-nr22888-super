import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const connectorId = '6a2d5589e6f59c31e605d3d3';
const pageSize = 1000;

const fetchAll = async (entity) => {
  const records = [];
  let skip = 0;
  while (true) {
    const batch = await entity.list('-created_date', pageSize, skip);
    records.push(...batch);
    if (batch.length < pageSize) return records;
    skip += pageSize;
  }
};

const cellValue = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value).slice(0, 49000);
  return String(value).slice(0, 49000);
};

const rowsFor = (records, preferred = []) => {
  const keys = [...new Set(records.flatMap((record) => Object.keys(record)))];
  const headers = [...preferred.filter((key) => keys.includes(key)), ...keys.filter((key) => !preferred.includes(key)).sort()];
  return [headers, ...records.map((record) => headers.map((key) => cellValue(record[key])))];
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { action = 'export' } = await req.json();
    const { accessToken } = await base44.asServiceRole.connectors.getCurrentAppUserConnection(connectorId);
    if (action === 'status') return Response.json({ connected: true });

    const [clients, sales, proposals, interactions, visits] = await Promise.all([
      fetchAll(base44.entities.Client),
      fetchAll(base44.entities.Sale),
      fetchAll(base44.entities.ConsultativeProposal),
      fetchAll(base44.entities.Interaction),
      fetchAll(base44.entities.Visit)
    ]);

    const generatedAt = new Date();
    const tabs = [
      { title: 'Resumo', values: [
        ['Indicador', 'Valor'],
        ['Gerado em', generatedAt.toLocaleString('pt-BR')],
        ['Clientes', clients.length],
        ['Negociações', sales.length],
        ['Propostas', proposals.length],
        ['Interações', interactions.length],
        ['Visitas', visits.length],
        ['Valor total negociado (R$)', sales.reduce((sum, sale) => sum + Number(sale.sale_value || 0), 0)]
      ] },
      { title: 'Clientes', values: rowsFor(clients, ['id', 'full_name', 'first_name', 'clinic_name', 'city', 'status', 'pipeline_stage', 'purchase_score', 'projected_revenue']) },
      { title: 'Negociacoes', values: rowsFor(sales, ['id', 'client_id', 'client_name', 'equipment_name', 'sale_value', 'status', 'sale_date', 'salesperson']) },
      { title: 'Propostas', values: rowsFor(proposals, ['id', 'client_id', 'client_name', 'equipment_name', 'total_value', 'status', 'sent_date', 'validity_date']) },
      { title: 'Interacoes', values: rowsFor(interactions, ['id', 'client_id', 'client_name', 'type', 'direction', 'subject', 'outcome', 'next_action', 'created_date']) },
      { title: 'Visitas', values: rowsFor(visits, ['id', 'client_id', 'client_name', 'scheduled_date', 'visit_type', 'status', 'location', 'result_notes']) }
    ];

    const createResponse = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        properties: { title: `Histórico CRM NR22888 - ${generatedAt.toLocaleDateString('pt-BR')}` },
        sheets: tabs.map((tab) => ({ properties: { title: tab.title, gridProperties: { frozenRowCount: 1 } } }))
      })
    });
    const spreadsheet = await createResponse.json();
    if (!createResponse.ok) throw new Error(spreadsheet.error?.message || 'Não foi possível criar a planilha.');

    const valuesResponse = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheet.spreadsheetId}/values:batchUpdate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ valueInputOption: 'USER_ENTERED', data: tabs.map((tab) => ({ range: `'${tab.title}'!A1`, values: tab.values })) })
    });
    const valuesResult = await valuesResponse.json();
    if (!valuesResponse.ok) throw new Error(valuesResult.error?.message || 'Não foi possível preencher a planilha.');

    const requests = spreadsheet.sheets.flatMap((sheet) => [
      { repeatCell: { range: { sheetId: sheet.properties.sheetId, startRowIndex: 0, endRowIndex: 1 }, cell: { userEnteredFormat: { backgroundColor: { red: 0.1, green: 0.55, blue: 0.3 }, textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } } } }, fields: 'userEnteredFormat' } },
      { autoResizeDimensions: { dimensions: { sheetId: sheet.properties.sheetId, dimension: 'COLUMNS', startIndex: 0, endIndex: tabs.find((tab) => tab.title === sheet.properties.title).values[0].length } } }
    ]);
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheet.spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests })
    });

    return Response.json({
      success: true,
      spreadsheetUrl: spreadsheet.spreadsheetUrl,
      counts: { clients: clients.length, sales: sales.length, proposals: proposals.length, interactions: interactions.length, visits: visits.length }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
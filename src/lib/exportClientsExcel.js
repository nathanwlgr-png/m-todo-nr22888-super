import { base44 } from '@/api/base44Client';

const clean = (value) => {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const escapeXml = (value) => clean(value)
  .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const worksheet = (name, headers, rows) => {
  const renderRow = (cells) => `<Row>${cells.map((cell) => `<Cell><Data ss:Type="String">${escapeXml(cell)}</Data></Cell>`).join('')}</Row>`;
  return `<Worksheet ss:Name="${escapeXml(name)}"><Table>${renderRow(headers)}${rows.map(renderRow).join('')}</Table></Worksheet>`;
};

export async function exportClientsExcel(clients) {
  const [interactions, visits, tasks, sales] = await Promise.all([
    base44.entities.Interaction.list('-created_date', 5000),
    base44.entities.Visit.list('-scheduled_date', 5000),
    base44.entities.Task.list('-created_date', 5000),
    base44.entities.Sale.list('-sale_date', 5000),
  ]);

  const clientIds = new Set(clients.map((client) => client.id));
  const related = (records) => records.filter((record) => clientIds.has(record.client_id));
  const sheets = [
    worksheet('Contatos', ['Nome', 'Nome completo', 'Clínica', 'Status', 'Telefone', 'E-mail', 'Cidade', 'Endereço', 'CNPJ', 'Equipamento de interesse', 'Etapa do funil', 'Score'], clients.map((c) => [c.first_name, c.full_name, c.clinic_name, c.status, c.phone, c.email, c.city, c.address, c.cnpj, c.equipment_interest, c.pipeline_stage, c.purchase_score])),
    worksheet('Interações', ['Data', 'Cliente', 'Tipo', 'Direção', 'Assunto', 'Notas', 'Resultado', 'Próxima ação'], related(interactions).map((i) => [i.created_date, i.client_name, i.type, i.direction, i.subject, i.notes, i.outcome, i.next_action])),
    worksheet('Visitas', ['Data agendada', 'Cliente', 'Tipo', 'Local', 'Status', 'Notas', 'Resultado'], related(visits).map((v) => [v.scheduled_date, v.client_name, v.visit_type, v.location, v.status, v.notes, v.result_notes])),
    worksheet('Tarefas', ['Criada em', 'Vencimento', 'Cliente', 'Título', 'Descrição', 'Tipo', 'Prioridade', 'Status', 'Responsável'], related(tasks).map((t) => [t.created_date, t.due_date || t.followup_due_at, t.client_name, t.title, t.description, t.type, t.priority, t.status, t.assigned_to_name || t.assigned_to])),
    worksheet('Vendas', ['Data', 'Cliente', 'Equipamento', 'Valor', 'Status', 'Condições', 'Observações'], related(sales).map((s) => [s.sale_date, s.client_name, s.equipment_name, s.sale_value, s.status, s.payment_terms, s.notes])),
  ];

  const workbook = `<?xml version="1.0"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">${sheets.join('')}</Workbook>`;
  const blob = new Blob(['\ufeff', workbook], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `clientes-historico-${new Date().toISOString().slice(0, 10)}.xls`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
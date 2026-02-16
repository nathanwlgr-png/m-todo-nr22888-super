import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import * as XLSX from 'npm:xlsx@0.18.5';
import { jsPDF } from 'npm:jspdf@2.5.2';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { format, data_type, filters = {} } = await req.json();

    // Fetch data based on type
    let data = [];
    let fileName = 'export';

    if (data_type === 'clients') {
      data = await base44.entities.Client.list();
      fileName = 'clientes';
    } else if (data_type === 'leads') {
      data = await base44.entities.Lead.list();
      fileName = 'leads';
    } else if (data_type === 'sales') {
      data = await base44.entities.Sale.list();
      fileName = 'vendas';
    } else if (data_type === 'interactions') {
      data = await base44.entities.Interaction.list();
      fileName = 'interacoes';
    } else if (data_type === 'tasks') {
      data = await base44.entities.Task.list();
      fileName = 'tarefas';
    } else if (data_type === 'dashboard_summary') {
      const clients = await base44.entities.Client.list();
      const leads = await base44.entities.Lead.list();
      const sales = await base44.entities.Sale.list();
      
      data = [{
        total_clientes: clients.length,
        clientes_quentes: clients.filter(c => c.status === 'quente').length,
        clientes_mornos: clients.filter(c => c.status === 'morno').length,
        clientes_frios: clients.filter(c => c.status === 'frio').length,
        total_leads: leads.length,
        leads_qualificados: leads.filter(l => l.stage === 'qualificado').length,
        vendas_fechadas: sales.filter(s => s.status === 'fechada').length,
        receita_total: sales.reduce((sum, s) => sum + (s.sale_value || 0), 0),
        data_geracao: new Date().toISOString()
      }];
      fileName = 'resumo_dashboard';
    }

    // Apply filters
    if (filters.date_from) {
      data = data.filter(item => 
        new Date(item.created_date || item.sale_date) >= new Date(filters.date_from)
      );
    }
    if (filters.date_to) {
      data = data.filter(item => 
        new Date(item.created_date || item.sale_date) <= new Date(filters.date_to)
      );
    }

    // CSV Export
    if (format === 'csv') {
      const headers = Object.keys(data[0] || {});
      const csv = [
        headers.join(','),
        ...data.map(row => 
          headers.map(h => JSON.stringify(row[h] || '')).join(',')
        )
      ].join('\n');

      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${fileName}.csv"`
        }
      });
    }

    // Excel Export
    if (format === 'excel') {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Dados');
      
      const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      return new Response(excelBuffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${fileName}.xlsx"`
        }
      });
    }

    // PDF Export
    if (format === 'pdf') {
      const doc = new jsPDF();
      
      doc.setFontSize(18);
      doc.text('Relatório de Vendas - NR22', 20, 20);
      
      doc.setFontSize(10);
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 20, 30);
      doc.text(`Usuário: ${user.full_name}`, 20, 35);
      
      let y = 50;
      doc.setFontSize(12);
      doc.text(`Total de registros: ${data.length}`, 20, y);
      
      if (data_type === 'dashboard_summary' && data[0]) {
        y += 10;
        doc.text('RESUMO EXECUTIVO', 20, y);
        y += 10;
        doc.setFontSize(10);
        Object.entries(data[0]).forEach(([key, value]) => {
          doc.text(`${key}: ${value}`, 25, y);
          y += 7;
        });
      } else {
        y += 10;
        const headers = Object.keys(data[0] || {}).slice(0, 5);
        headers.forEach((header, idx) => {
          doc.text(header, 20 + (idx * 35), y);
        });
        
        y += 7;
        data.slice(0, 30).forEach((row) => {
          headers.forEach((header, idx) => {
            const value = String(row[header] || '').substring(0, 20);
            doc.text(value, 20 + (idx * 35), y);
          });
          y += 6;
          if (y > 270) {
            doc.addPage();
            y = 20;
          }
        });
      }

      const pdfBytes = doc.output('arraybuffer');
      return new Response(pdfBytes, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${fileName}.pdf"`
        }
      });
    }

    return Response.json({ error: 'Formato inválido' }, { status: 400 });

  } catch (error) {
    console.error('Export error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
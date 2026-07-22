import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const date = body.date || new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
    const clinics_text = body.clinics_text || 'Relatório executivo semanal gerado automaticamente.';
    const notes = body.notes || '';
    const format = body.format || 'word';
    const visits = body.visits || [];
    const monthly_visits = body.monthly_visits || [];

    // Gerar conteúdo do relatório
    const reportLines = [];
    reportLines.push(`RELATÓRIO DE VENDAS - ${date}`);
    reportLines.push(`Vendedor: ${user.full_name}`);
    reportLines.push(`Data de Geração: ${new Date().toLocaleDateString('pt-BR')}`);
    reportLines.push('');
    reportLines.push('='.repeat(80));
    reportLines.push('');
    reportLines.push('CLÍNICAS VISITADAS E SITUAÇÕES:');
    reportLines.push('');
    reportLines.push(clinics_text || 'Nenhuma clínica informada');
    reportLines.push('');
    reportLines.push('='.repeat(80));
    reportLines.push('');

    if (visits && visits.length > 0) {
      reportLines.push('VISITAS AGENDADAS REGISTRADAS:');
      reportLines.push('');
      visits.forEach((visit, idx) => {
        reportLines.push(`${idx + 1}. ${visit.client_name}`);
        reportLines.push(`   Tipo: ${visit.visit_type}`);
        reportLines.push(`   Status: ${visit.status}`);
        if (visit.notes) {
          reportLines.push(`   Notas: ${visit.notes}`);
        }
        reportLines.push('');
      });
      reportLines.push('');
    }

    if (monthly_visits && monthly_visits.length > 0) {
      reportLines.push('VISITAS MENSAIS REGISTRADAS:');
      reportLines.push('');
      monthly_visits.forEach((visit, idx) => {
        reportLines.push(`${idx + 1}. ${visit.client_name} - ${visit.clinic_name || ''}`);
        reportLines.push(`   Cidade: ${visit.city || 'N/A'}`);
        reportLines.push(`   Avaliação: ${visit.rating}/5`);
        reportLines.push(`   Resultado: ${visit.visit_result}`);
        reportLines.push(`   Equipamento apresentado: ${visit.equipment_presented || 'N/A'}`);
        if (visit.next_steps) {
          reportLines.push(`   Próximos passos: ${visit.next_steps}`);
        }
        reportLines.push('');
      });
      reportLines.push('');
    }

    if (notes) {
      reportLines.push('='.repeat(80));
      reportLines.push('');
      reportLines.push('OBSERVAÇÕES ADICIONAIS:');
      reportLines.push('');
      reportLines.push(notes);
      reportLines.push('');
    }

    reportLines.push('='.repeat(80));
    reportLines.push('');
    reportLines.push(`Relatório gerado automaticamente pelo sistema NR22 CRM`);

    const reportContent = reportLines.join('\n');

    // Gerar arquivo baseado no formato
    let fileContent;
    let fileName;
    let mimeType;

    if (format === 'csv') {
      // CSV simples
      const csvLines = [
        'Data,Vendedor,Clínica,Situação',
        ...clinics_text.split('\n').map(line => {
          const parts = line.split(' - ');
          return `${date},${user.full_name},"${parts[0] || ''}","${parts[1] || ''}"`;
        })
      ];
      fileContent = csvLines.join('\n');
      fileName = `relatorio_vendas_${date}.csv`;
      mimeType = 'text/csv';
    } else if (format === 'word') {
      // Formato Word simplificado (texto)
      fileContent = reportContent;
      fileName = `relatorio_vendas_${date}.txt`;
      mimeType = 'text/plain';
    } else {
      // Excel simplificado (TSV - Tab Separated Values, que o Excel abre)
      const tsvLines = [
        'Data\tVendedor\tConteúdo',
        `${date}\t${user.full_name}\t${reportContent.replace(/\n/g, ' | ')}`
      ];
      fileContent = tsvLines.join('\n');
      fileName = `relatorio_vendas_${date}.tsv`;
      mimeType = 'text/tab-separated-values';
    }

    // Salvar na entidade ExportedDocument
    const doc = await base44.entities.ExportedDocument.create({
      title: `Relatório de Vendas - ${date}`,
      document_type: format === 'word' ? 'text' : format === 'csv' ? 'excel' : 'excel',
      category: 'relatorio',
      description: `Relatório diário de vendas gerado para ${date}`,
      file_url: `data:${mimeType};base64,${btoa(unescape(encodeURIComponent(fileContent)))}`,
      whatsapp_ready: true
    });

    // Retornar URL para download
    return Response.json({
      success: true,
      file_url: doc.file_url,
      document_id: doc.id,
      message: 'Relatório gerado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});
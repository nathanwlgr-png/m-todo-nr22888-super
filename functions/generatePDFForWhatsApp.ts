import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@2.5.2';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { content, title, clientName } = await req.json();

    // Criar PDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const maxWidth = pageWidth - 2 * margin;
    let y = margin;

    // Título
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text(title || 'Relatório SEAMATY', margin, y);
    y += 15;

    // Cliente (se houver)
    if (clientName) {
      doc.setFontSize(12);
      doc.setFont(undefined, 'normal');
      doc.text(`Cliente: ${clientName}`, margin, y);
      y += 10;
    }

    // Data
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, margin, y);
    y += 15;

    // Linha separadora
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;

    // Conteúdo
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    
    const lines = doc.splitTextToSize(content, maxWidth);
    
    for (let i = 0; i < lines.length; i++) {
      if (y > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(lines[i], margin, y);
      y += 7;
    }

    // Rodapé
    const totalPages = doc.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `SEAMATY - Tecnologia que Transforma Vidas | Página ${i} de ${totalPages}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }

    // Converter para buffer
    const pdfBuffer = doc.output('arraybuffer');
    const pdfBlob = new Blob([pdfBuffer], { type: 'application/pdf' });
    
    // Upload para storage
    const fileName = `${title?.replace(/\s/g, '_') || 'relatorio'}_${Date.now()}.pdf`;
    const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
    
    const { file_url } = await base44.asServiceRole.integrations.Core.UploadFile({
      file: file
    });

    // Salvar em ExportedDocument
    await base44.asServiceRole.entities.ExportedDocument.create({
      title: title || 'Relatório SEAMATY',
      document_type: 'pdf',
      file_url: file_url,
      file_size_kb: Math.round(pdfBuffer.byteLength / 1024),
      client_name: clientName || 'Geral',
      category: 'relatorio',
      description: 'Gerado via WhatsApp NR22888 Turbo',
      whatsapp_ready: true,
      export_count: 0
    });

    return Response.json({
      success: true,
      file_url: file_url,
      message: `PDF pronto, Nathan! ${file_url}`
    });

  } catch (error) {
    console.error('Erro:', error);
    return Response.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
});
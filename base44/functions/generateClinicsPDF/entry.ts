import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@4.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { search_results, search_params } = await req.json();

    const doc = new jsPDF();
    let y = 20;

    // Título
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Relatório de Clínicas Veterinárias', 20, y);
    y += 10;

    // Informações da busca
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 20, y);
    y += 6;
    doc.text(`Modo: ${search_params.mode === 'gps' ? 'GPS Atual' : search_params.city}`, 20, y);
    y += 6;
    doc.text(`Raio: ${search_params.radius}km`, 20, y);
    y += 6;
    doc.text(`Clínicas encontradas: ${search_results.clinics_found}`, 20, y);
    y += 10;

    // Linha separadora
    doc.setLineWidth(0.5);
    doc.line(20, y, 190, y);
    y += 10;

    // Listar clínicas
    search_results.clinics?.forEach((clinic, index) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }

      // Nome da clínica
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`${index + 1}. ${clinic.name}`, 20, y);
      y += 7;

      // Dados básicos
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      
      if (clinic.address) {
        doc.text(`📍 ${clinic.address}`, 25, y);
        y += 5;
      }

      if (clinic.distance_km) {
        doc.text(`📏 Distância: ${clinic.distance_km}km`, 25, y);
        y += 5;
      }

      if (clinic.phone) {
        doc.text(`📞 ${clinic.phone}`, 25, y);
        y += 5;
      }

      if (clinic.email) {
        doc.text(`✉️ ${clinic.email}`, 25, y);
        y += 5;
      }

      if (clinic.cnpj) {
        doc.text(`🏢 CNPJ: ${clinic.cnpj}`, 25, y);
        y += 5;

        if (clinic.cnpj_data) {
          doc.setFontSize(8);
          doc.text(`   Razão Social: ${clinic.cnpj_data.razao_social || 'N/A'}`, 25, y);
          y += 4;
          doc.text(`   Porte: ${clinic.cnpj_data.porte || 'N/A'}`, 25, y);
          y += 4;
          doc.text(`   Situação: ${clinic.cnpj_data.situacao || 'N/A'}`, 25, y);
          y += 5;
          doc.setFontSize(9);
        }
      }

      if (clinic.owner_name) {
        doc.text(`👤 Responsável: ${clinic.owner_name}`, 25, y);
        y += 5;

        if (clinic.numerology) {
          doc.setFontSize(8);
          doc.setTextColor(128, 0, 128);
          doc.text(`   🔮 Numerologia: ${clinic.numerology.numero} - ${clinic.numerology.perfil}`, 25, y);
          y += 4;
          doc.text(`   💡 Abordagem: ${clinic.numerology.dicas_abordagem}`, 25, y);
          y += 5;
          doc.setTextColor(0, 0, 0);
          doc.setFontSize(9);
        }
      }

      if (clinic.website) {
        doc.setTextColor(0, 0, 255);
        doc.text(`🌐 ${clinic.website}`, 25, y);
        doc.setTextColor(0, 0, 0);
        y += 5;
      }

      y += 5;
    });

    // Rodapé
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(`Página ${i} de ${pageCount} | Gerado por CRM NR22`, 20, 285);
    }

    // Salvar PDF
    const pdfBytes = doc.output('arraybuffer');
    const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });

    // Upload do PDF
    const { file_url } = await base44.asServiceRole.integrations.Core.UploadFile({
      file: pdfBlob
    });

    // Salvar referência
    await base44.asServiceRole.entities.ExportedDocument?.create({
      user_email: user.email,
      document_type: 'clinic_search_report',
      file_url,
      description: `Busca de clínicas - ${search_params.city || 'GPS'} - ${search_params.radius}km`,
      generated_date: new Date().toISOString()
    }).catch(() => null);

    return Response.json({
      success: true,
      pdf_url: file_url
    });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ 
      error: error.message,
      success: false
    }, { status: 500 });
  }
});
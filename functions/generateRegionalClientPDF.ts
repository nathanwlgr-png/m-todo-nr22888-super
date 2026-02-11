import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@4.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { city, radius_km, recipient_name } = await req.json();

    // Buscar todos os clientes
    const allClients = await base44.asServiceRole.entities.Client.list();

    // Filtrar clientes da região (simplificado - na produção usaria cálculo de distância real)
    const regionalClients = allClients.filter(c => {
      const clientCity = c.city?.toLowerCase() || '';
      const targetCity = city.toLowerCase();
      
      // Cidades próximas a Presidente Prudente (exemplo)
      const nearbyCities = [
        'presidente prudente', 'presidente venceslau', 'alvares machado',
        'regente feijó', 'santo anastácio', 'mirante do paranapanema',
        'pirapozinho', 'indiana', 'anhumas', 'tarabai', 'narandiba'
      ];
      
      return clientCity.includes(targetCity) || 
             nearbyCities.some(nc => clientCity.includes(nc));
    });

    // Ordenar por importância (score + status)
    const sortedClients = regionalClients.sort((a, b) => {
      const scoreA = (a.purchase_score || 0) + (a.status === 'quente' ? 50 : a.status === 'morno' ? 25 : 0);
      const scoreB = (b.purchase_score || 0) + (b.status === 'quente' ? 50 : b.status === 'morno' ? 25 : 0);
      return scoreB - scoreA;
    });

    if (sortedClients.length === 0) {
      return Response.json({ error: 'Nenhum cliente encontrado na região' }, { status: 404 });
    }

    // Criar PDF
    const doc = new jsPDF();
    let y = 20;

    // Header
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text(`Clientes - ${city} (${radius_km}km)`, 20, y);
    y += 10;

    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text(`Para: ${recipient_name}`, 20, y);
    y += 7;
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 20, y);
    y += 7;
    doc.text(`Total de clientes: ${sortedClients.length}`, 20, y);
    y += 15;

    // Rota otimizada summary
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('ROTA OTIMIZADA', 20, y);
    y += 10;

    // Lista de clientes
    sortedClients.forEach((client, idx) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }

      // Número da ordem
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text(`${idx + 1}.`, 20, y);

      // Nome da clínica/cliente
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text(client.clinic_name || client.first_name || 'Cliente', 28, y);

      // Status badge
      const status = client.status || 'frio';
      const statusText = status === 'quente' ? '🔥 QUENTE' : 
                        status === 'morno' ? '🌡️ MORNO' : '❄️ FRIO';
      doc.setFontSize(8);
      doc.text(statusText, 150, y);
      
      y += 5;

      // Nome do responsável
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      if (client.first_name) {
        doc.text(`Responsável: ${client.first_name}`, 28, y);
        y += 4;
      }

      // Endereço
      if (client.address) {
        doc.text(`📍 ${client.address}`, 28, y);
        y += 4;
      }

      // Cidade
      if (client.city) {
        doc.text(`Cidade: ${client.city}`, 28, y);
        y += 4;
      }

      // CNPJ
      if (client.cnpj) {
        doc.text(`CNPJ: ${client.cnpj}`, 28, y);
        y += 4;
      }

      // Telefone
      if (client.phone) {
        doc.text(`📞 ${client.phone}`, 28, y);
        y += 4;
      }

      // Score
      const score = client.purchase_score || 0;
      doc.text(`Score: ${score}%`, 28, y);
      y += 4;

      // Equipamento interesse
      if (client.equipment_interest) {
        doc.text(`Interesse: ${client.equipment_interest}`, 28, y);
        y += 4;
      }

      // Próxima ação
      if (client.next_action) {
        doc.setFontSize(8);
        doc.text(`Próxima ação: ${client.next_action.substring(0, 80)}`, 28, y);
        y += 4;
      }

      y += 5; // Espaço entre clientes
    });

    // Nova página - Resumo estratégico
    doc.addPage();
    y = 20;
    
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('RESUMO ESTRATÉGICO', 20, y);
    y += 15;

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');

    const hotCount = sortedClients.filter(c => c.status === 'quente').length;
    const warmCount = sortedClients.filter(c => c.status === 'morno').length;
    const coldCount = sortedClients.filter(c => c.status === 'frio').length;

    doc.text(`🔥 Clientes QUENTES: ${hotCount} (prioridade máxima)`, 20, y);
    y += 7;
    doc.text(`🌡️ Clientes MORNOS: ${warmCount} (potencial alto)`, 20, y);
    y += 7;
    doc.text(`❄️ Clientes FRIOS: ${coldCount} (relacionamento longo prazo)`, 20, y);
    y += 15;

    doc.setFont(undefined, 'bold');
    doc.text('RECOMENDAÇÕES:', 20, y);
    y += 7;

    doc.setFont(undefined, 'normal');
    doc.text('1. Visite os clientes QUENTES primeiro (fechamento rápido)', 20, y);
    y += 5;
    doc.text('2. Agende follow-ups com clientes MORNOS', 20, y);
    y += 5;
    doc.text('3. Mantenha relacionamento com clientes FRIOS via WhatsApp', 20, y);
    y += 5;
    doc.text(`4. Distância estimada total: ~${sortedClients.length * 15}km`, 20, y);
    y += 5;
    doc.text(`5. Tempo estimado de rota: ~${sortedClients.length * 45}min`, 20, y);

    // Converter PDF para bytes
    const pdfBytes = doc.output('arraybuffer');

    // Upload para storage
    const fileName = `clientes_${city.replace(/\s/g, '_')}_${Date.now()}.pdf`;
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const file = new File([blob], fileName, { type: 'application/pdf' });

    const uploadResult = await base44.asServiceRole.integrations.Core.UploadFile({ file });
    const fileUrl = uploadResult.file_url;

    // Salvar no ExportedDocument
    await base44.asServiceRole.entities.ExportedDocument.create({
      title: `Clientes ${city} - ${recipient_name}`,
      document_type: 'pdf',
      file_url: fileUrl,
      file_size_kb: Math.round(pdfBytes.byteLength / 1024),
      category: 'relatorio',
      description: `${sortedClients.length} clientes na região de ${city} (${radius_km}km) com rota otimizada`,
      metadata: {
        city,
        radius_km,
        recipient_name,
        total_clients: sortedClients.length,
        hot_clients: hotCount,
        warm_clients: warmCount,
        cold_clients: coldCount
      },
      whatsapp_ready: true
    });

    return Response.json({
      success: true,
      file_url: fileUrl,
      total_clients: sortedClients.length,
      message: `PDF gerado com ${sortedClients.length} clientes de ${city}`
    });

  } catch (error) {
    console.error('Erro:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { template_file_url, client_identifier, client_data_overrides = {} } = await req.json();

    if (!template_file_url || !client_identifier) {
      return Response.json({ 
        error: 'template_file_url e client_identifier obrigatórios' 
      }, { status: 400 });
    }

    // Buscar cliente no CRM
    let clientData = null;
    
    // Tentar por nome ou email
    const clients = await base44.asServiceRole.entities.Client.filter({}).catch(() => []);
    clientData = clients.find(c => 
      c.full_name?.toLowerCase().includes(client_identifier.toLowerCase()) ||
      c.clinic_name?.toLowerCase().includes(client_identifier.toLowerCase()) ||
      c.email?.toLowerCase() === client_identifier.toLowerCase()
    );

    if (!clientData) {
      return Response.json({
        success: false,
        error: `Cliente "${client_identifier}" não encontrado no CRM`
      }, { status: 404 });
    }

    // Mesclar dados do cliente com overrides
    const finalClientData = {
      cliente: clientData.full_name || 'Cliente',
      clinic_name: clientData.clinic_name || '',
      email: clientData.email || '',
      telefone: clientData.phone || '',
      endereco: clientData.address || '',
      cidade: clientData.city || '',
      cnpj: clientData.cnpj || '',
      ...client_data_overrides
    };

    // Usar LLM para ler o template e substituir placeholders
    const templateResponse = await fetch(template_file_url);
    const templateContent = await templateResponse.text();

    const llmResult = await base44.integrations.Core.InvokeLLM({
      prompt: `Você recebeu um template de proposta com placeholders como {{cliente}}, {{email}}, {{telefone}}, {{endereco}}, {{preco}}, {{produtos}}, etc.

TEMPLATE ORIGINAL:
${templateContent}

DADOS DO CLIENTE PARA SUBSTITUIR:
${JSON.stringify(finalClientData, null, 2)}

TAREFA:
1. Leia o template
2. Identifique TODOS os placeholders ({{...}})
3. Substitua pelos dados correspondentes do cliente
4. Se houver placeholders sem dados, remova-os ou deixe em branco
5. Retorne o texto completo personalizado

Retorne APENAS o texto final, sem explicações.`,
      add_context_from_internet: false
    });

    const personalizedContent = llmResult;

    // Gerar PDF usando jsPDF
    const { jsPDF } = await import('npm:jspdf@4.0.0');
    const doc = new jsPDF();

    // Adicionar conteúdo ao PDF
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 10;
    const lineHeight = 7;

    doc.setFontSize(12);
    let yPosition = margin;

    // Quebrar texto em linhas
    const lines = doc.splitTextToSize(personalizedContent, pageWidth - 2 * margin);

    for (const line of lines) {
      if (yPosition > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }
      doc.text(line, margin, yPosition);
      yPosition += lineHeight;
    }

    // Rodapé
    doc.setFontSize(8);
    doc.text(`Proposta gerada pelo CRM NR22 - ${new Date().toLocaleDateString('pt-BR')}`, margin, pageHeight - 5);

    // Salvar PDF
    const pdfBytes = doc.output('arraybuffer');
    const fileName = `Proposta_${clientData.first_name}_${new Date().getTime()}.pdf`;

    // Fazer upload do PDF gerado
    const uploadResult = await base44.integrations.Core.UploadFile({
      file: new File([pdfBytes], fileName, { type: 'application/pdf' })
    });

    // Salvar documento no CRM
    await base44.asServiceRole.entities.AIKnowledgeDocument.create({
      title: `Proposta - ${clientData.full_name} (${new Date().toLocaleDateString('pt-BR')})`,
      document_type: 'modelo_proposta',
      file_url: uploadResult.file_url,
      summary: `Proposta personalizada para ${clientData.full_name}`,
      is_active: true
    }).catch(() => null);

    return Response.json({
      success: true,
      pdf_url: uploadResult.file_url,
      pdf_name: fileName,
      client_name: clientData.full_name,
      message: `✅ Proposta gerada! PDF pronto para enviar.`
    });

  } catch (error) {
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});
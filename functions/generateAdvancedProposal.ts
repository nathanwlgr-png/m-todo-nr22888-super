import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      template_id, 
      client_identifier, 
      products = [],
      custom_data = {},
      output_format = 'pdf'
    } = await req.json();

    if (!template_id || !client_identifier) {
      return Response.json({ 
        error: 'template_id e client_identifier obrigatórios' 
      }, { status: 400 });
    }

    // Buscar template
    const template = await base44.asServiceRole.entities.ProposalTemplate.list()
      .then(templates => templates.find(t => t.id === template_id))
      .catch(() => null);

    if (!template) {
      return Response.json({ error: 'Template não encontrado' }, { status: 404 });
    }

    // Buscar cliente
    const clients = await base44.asServiceRole.entities.Client.filter({}).catch(() => []);
    const clientData = clients.find(c => 
      c.full_name?.toLowerCase().includes(client_identifier.toLowerCase()) ||
      c.clinic_name?.toLowerCase().includes(client_identifier.toLowerCase()) ||
      c.email?.toLowerCase() === client_identifier.toLowerCase()
    );

    if (!clientData) {
      return Response.json({ error: `Cliente "${client_identifier}" não encontrado` }, { status: 404 });
    }

    // Construir dados para preenchimento
    let contextData = {
      // Dados do cliente
      cliente: clientData.full_name || '',
      clinic_name: clientData.clinic_name || '',
      email: clientData.email || '',
      telefone: clientData.phone || '',
      endereco: clientData.address || '',
      cidade: clientData.city || '',
      cep: clientData.cep || '',
      cnpj: clientData.cnpj || '',
      
      // Data
      data: new Date().toLocaleDateString('pt-BR'),
      data_completa: new Date().toLocaleDateString('pt-BR', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      
      // Dados customizados
      ...custom_data
    };

    // Processar produtos se fornecidos
    if (products.length > 0) {
      let productDetails = '';
      let totalValue = 0;

      for (const prod of products) {
        let prodData = prod;
        
        // Se for apenas ID, buscar dados
        if (typeof prod === 'string') {
          const allProducts = await base44.asServiceRole.entities.SeamatyPriceTable.filter({})
            .catch(() => []);
          prodData = allProducts.find(p => p.id === prod);
        }

        if (prodData) {
          const quantity = prod.quantity || 1;
          const basePrice = prod.price_override || prodData.price_cash || 0;
          const subtotal = basePrice * quantity;
          totalValue += subtotal;

          productDetails += `
• ${prodData.product_name || prodData.name}
  Código: ${prodData.product_code || 'N/A'}
  Categoria: ${prodData.category || 'N/A'}
  Descrição: ${prodData.description || ''}
  Quantidade: ${quantity}
  Preço unitário: R$ ${basePrice.toFixed(2)}
  Subtotal: R$ ${subtotal.toFixed(2)}
`;
        }
      }

      contextData = {
        ...contextData,
        produto: productDetails.trim(),
        produtos_lista: products.map(p => p.name || p.product_name).join(', '),
        preco: `R$ ${totalValue.toFixed(2)}`,
        preco_total: `R$ ${totalValue.toFixed(2)}`,
        valor_total: totalValue,
        quantidade_produtos: products.length
      };
    }

    // Adicionar tiers de preço se aplicável
    if (contextData.preco_tier1 === undefined && clientData.available_budget) {
      contextData.preco_tier1 = `R$ ${(clientData.available_budget * 0.1).toFixed(2)}`;
      contextData.preco_tier2 = `R$ ${(clientData.available_budget * 0.15).toFixed(2)}`;
      contextData.preco_tier3 = `R$ ${(clientData.available_budget * 0.2).toFixed(2)}`;
    }

    // Usar LLM para processar template com contexto
    const llmResult = await base44.integrations.Core.InvokeLLM({
      prompt: `Você é um processador de templates de propostas comerciais. 

TEMPLATE:
${template.content_template}

DADOS PARA PREENCHIMENTO:
${JSON.stringify(contextData, null, 2)}

TAREFA:
1. Substitua TODOS os placeholders {{campo}} pelos valores correspondentes
2. Se um placeholder não tiver dados, remova-o ou deixe em branco
3. Garanta que a formatação final seja profissional
4. Se houver lógica condicional (ex: "Se preco > 10000 então..."), aplique inteligentemente
5. Mantenha a estrutura e legibilidade

Retorne APENAS o texto final processado, sem explicações.`,
      add_context_from_internet: false
    });

    let finalContent = llmResult;

    // Gerar PDF se solicitado
    if (output_format === 'pdf') {
      const { jsPDF } = await import('npm:jspdf@4.0.0');
      const doc = new jsPDF();

      const pageHeight = doc.internal.pageSize.getHeight();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 10;
      const lineHeight = 7;

      doc.setFontSize(12);
      let yPosition = margin;

      const lines = doc.splitTextToSize(finalContent, pageWidth - 2 * margin);

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
      doc.text(`Proposta: ${template.name} | ${new Date().toLocaleDateString('pt-BR')}`, margin, pageHeight - 5);

      const pdfBytes = doc.output('arraybuffer');
      const fileName = `Proposta_${clientData.first_name}_${Date.now()}.pdf`;

      const uploadResult = await base44.integrations.Core.UploadFile({
        file: new File([pdfBytes], fileName, { type: 'application/pdf' })
      });

      finalContent = uploadResult.file_url;
    }

    // Salvar documento no CRM
    await base44.asServiceRole.entities.AIKnowledgeDocument.create({
      title: `${template.name} - ${clientData.full_name} (${new Date().toLocaleDateString('pt-BR')})`,
      document_type: 'modelo_proposta',
      file_url: output_format === 'pdf' ? finalContent : '',
      extracted_text: output_format !== 'pdf' ? finalContent : '',
      summary: `Proposta gerada: ${template.name} para ${clientData.full_name}`,
      is_active: true
    }).catch(() => null);

    return Response.json({
      success: true,
      content: output_format === 'pdf' ? undefined : finalContent,
      pdf_url: output_format === 'pdf' ? finalContent : undefined,
      client_name: clientData.full_name,
      template_name: template.name,
      message: `✅ Proposta gerada com sucesso!`
    });

  } catch (error) {
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});
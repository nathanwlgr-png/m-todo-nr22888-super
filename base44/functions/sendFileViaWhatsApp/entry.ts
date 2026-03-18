import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { phone, file_type, data, caption } = await req.json();

    if (!phone || !file_type || !data) {
      return Response.json({ 
        error: 'phone, file_type e data são obrigatórios' 
      }, { status: 400 });
    }

    let file_url;
    let filename;

    // Gerar Excel de Prospecção
    if (file_type === 'prospecting_excel') {
      const clients = await base44.entities.Lead.filter({ 
        status: 'novo' 
      }, '-created_date', 100);

      // Criar CSV simples (compatível com Excel)
      const headers = 'Nome,Empresa,Telefone,Email,Cidade,Interesse,Origem,Status\n';
      const rows = clients.map(c => 
        `"${c.full_name || ''}","${c.company || ''}","${c.phone || ''}","${c.email || ''}","${c.city || ''}","${c.interest || ''}","${c.source || ''}","${c.status || ''}"`
      ).join('\n');
      
      const csvContent = headers + rows;
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const file = new File([blob], 'prospeccao_leads.csv', { type: 'text/csv' });
      
      const uploadResult = await base44.integrations.Core.UploadFile({ file });
      file_url = uploadResult.file_url;
      filename = 'prospeccao_leads.csv';
    }
    
    // Gerar Excel de Planejamento Mensal
    else if (file_type === 'monthly_plan_excel') {
      const visits = await base44.entities.Visit.filter({ 
        status: 'agendada' 
      }, 'scheduled_date', 100);

      const headers = 'Data,Cliente,Cidade,Tipo,Observações\n';
      const rows = visits.map(v => {
        const date = new Date(v.scheduled_date).toLocaleDateString('pt-BR');
        return `"${date}","${v.client_name || ''}","${v.location || ''}","${v.visit_type || ''}","${v.notes || ''}"`;
      }).join('\n');
      
      const csvContent = headers + rows;
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const file = new File([blob], 'planejamento_mensal.csv', { type: 'text/csv' });
      
      const uploadResult = await base44.integrations.Core.UploadFile({ file });
      file_url = uploadResult.file_url;
      filename = 'planejamento_mensal.csv';
    }
    
    // Enviar arquivo personalizado
    else if (file_type === 'custom' && data.file_url) {
      file_url = data.file_url;
      filename = data.filename || 'documento.pdf';
    }

    if (!file_url) {
      return Response.json({ 
        error: 'Não foi possível gerar o arquivo' 
      }, { status: 400 });
    }

    // Enviar via WhatsApp
    const whatsappMessage = caption || `📎 Segue o arquivo: ${filename}`;
    
    await base44.functions.invoke('whatsappSendDirect', {
      phone: phone,
      message: whatsappMessage,
      file_url: file_url
    });

    return Response.json({
      success: true,
      file_url: file_url,
      filename: filename,
      sent_to: phone
    });

  } catch (error) {
    console.error('Erro ao enviar arquivo:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});
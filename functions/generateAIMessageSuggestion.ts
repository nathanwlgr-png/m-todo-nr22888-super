import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { client_id, context } = await req.json();

    if (!client_id) {
      return Response.json({ error: 'Missing client_id' }, { status: 400 });
    }

    // Buscar dados do cliente
    const clients = await base44.entities.Client.list();
    const clientData = clients.find(c => c.id === client_id);

    if (!clientData) {
      return Response.json({ error: 'Client not found' }, { status: 404 });
    }

    const prompt = `Você é um especialista em vendas consultivas de equipamentos veterinários da Seamaty.

CLIENTE:
Nome: ${clientData.full_name || clientData.first_name}
Status: ${clientData.status}
Score: ${clientData.purchase_score}%
Perfil: ${clientData.behavioral_profile || 'N/A'}
Equipamento de Interesse: ${clientData.equipment_interest || 'Não definido'}
Dores: ${clientData.main_pains?.join(', ') || 'Não identificadas'}

CONTEXTO: ${context || 'follow_up'}

TAREFA:
Gere uma mensagem WhatsApp CURTA (máx 300 caracteres), personalizada e estratégica para este cliente.
Use emojis sutis e linguagem consultiva.

Retorne APENAS a mensagem pronta para enviar.`;

    const response = await base44.integrations.Core.InvokeLLM({
      prompt
    });

    return Response.json({
      message: response,
      client_name: clientData.full_name || clientData.first_name
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
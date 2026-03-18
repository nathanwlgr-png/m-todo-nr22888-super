import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      client_id,
      equipment_code,
      include_payment_terms = false,
      include_calibration = false 
    } = await req.json();

    if (!client_id || !equipment_code) {
      return Response.json({ 
        error: 'client_id e equipment_code obrigatórios' 
      }, { status: 400 });
    }

    // Buscar cliente
    const client = await base44.asServiceRole.entities.Client.get(client_id).catch(() => null);
    if (!client) {
      return Response.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    // Buscar dados do equipamento na tabela SeamatyPriceTable
    const allEquip = await base44.asServiceRole.entities.SeamatyPriceTable.list().catch(() => []);
    const equipment = allEquip.find(e => e.product_code === equipment_code);
    
    if (!equipment) {
      return Response.json({ error: 'Equipamento não encontrado' }, { status: 404 });
    }

    // Montar proposta dinâmica baseada em dados reais
    const today = new Date().toLocaleDateString('pt-BR');
    const equipmentPrice = equipment.price_cash || equipment.price_tier1 || 0;
    
    // Calcular kit inicial baseado no volume mensal do cliente
    let kitQuantity = 1;
    let kitPrice = 0;
    
    if (client.current_volume === 'mais_230_mes') {
      kitQuantity = 10;
      kitPrice = 1200 * 10;
    } else if (client.current_volume === '120_230_mes') {
      kitQuantity = 7;
      kitPrice = 1200 * 7;
    } else if (client.current_volume === '40_120_mes') {
      kitQuantity = 5;
      kitPrice = 1200 * 5;
    } else {
      kitQuantity = 3;
      kitPrice = 1200 * 3;
    }

    const installationFee = 1000;
    const calibrationFee = include_calibration ? 500 : 0;
    const subtotal = equipmentPrice + kitPrice + installationFee + calibrationFee;

    // Gerar proposta usando IA
    const proposalContent = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Gere uma PROPOSTA DE VENDA profissional e personalizada em MARKDOWN.

DADOS DO CLIENTE:
- Nome: ${client.first_name}
- Empresa: ${client.clinic_name}
- Cidade: ${client.city}
- Volume mensal: ${client.current_volume}
- Status: ${client.status}
- Dores principais: ${client.main_pains?.slice(0, 3).join(', ') || 'Não especificadas'}
- Necessidades: ${client.lab_needs?.join(', ') || 'Genéricas'}

EQUIPAMENTO:
- Nome: ${equipment.product_name}
- Descrição: ${equipment.description}
- Compatível com: ${equipment.compatible_equipment?.join(', ') || 'Múltiplos sistemas'}
- Parâmetros: ${equipment.parameters?.join(', ') || equipment.parameters_count + ' parâmetros'}

PROPOSTA COMERCIAL (DADOS REAIS):
- Analisador ${equipment.product_name}: R$ ${equipmentPrice.toLocaleString('pt-BR')}
- Kit Inicial (${kitQuantity} cxs rotores): R$ ${kitPrice.toLocaleString('pt-BR')}
- Instalação: R$ ${installationFee.toLocaleString('pt-BR')}
${include_calibration ? `- Calibração: R$ ${calibrationFee.toLocaleString('pt-BR')}` : ''}
- TOTAL: R$ ${subtotal.toLocaleString('pt-BR')}

INSTRUÇÕES:
1. Cumprimenta pelo nome (${client.first_name})
2. Menciona a empresa (${client.clinic_name})
3. Referencia as dores/necessidades do cliente
4. Descreve benefícios ESPECÍFICOS do ${equipment.product_name}
5. Inclui a tabela de preços com valores REAIS acima
${include_payment_terms ? '6. Sugere 2-3 formas de pagamento' : ''}
7. Call-to-action claro com próximos passos
8. Tom profissional mas amigável
9. Estrutura em MARKDOWN para WhatsApp

VALIDADE: Esta proposta é válida por 30 dias.
DATA: ${today}

Gere a proposta COMPLETA pronta para enviar via WhatsApp.`,
      add_context_from_internet: false
    });

    return Response.json({
      success: true,
      proposal_content: proposalContent,
      client_name: client.first_name,
      equipment_name: equipment.product_name,
      total_value: subtotal,
      validity_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')
    });

  } catch (error) {
    console.error('Erro:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    // Buscar equipamento completo
    const equipment = await base44.asServiceRole.entities.EquipmentMaterial.list();
    const item = equipment.find(e => e.id === data.id) || data;

    // Verificar campos vazios
    const needsEnrichment = 
      !item.persuasion_triggers || 
      !item.technical_specs || 
      !item.benefits || 
      !item.sales_copy;

    if (!needsEnrichment) {
      return Response.json({ 
        success: true, 
        message: 'Equipment already complete' 
      });
    }

    // Enriquecer com IA
    const enrichment = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Você é especialista em vendas de equipamentos veterinários. Crie dados completos para:

EQUIPAMENTO: ${item.equipment_name}
CATEGORIA: ${item.category || 'veterinário'}
DESCRIÇÃO: ${item.description || 'Equipamento veterinário avançado'}

Gere:
1. GATILHOS DE PERSUASÃO (5 itens práticos baseados em Cialdini)
2. ESPECIFICAÇÕES TÉCNICAS (detalhadas, profissionais)
3. BENEFÍCIOS (5 principais vantagens práticas)
4. SALES COPY (parágrafo de 3-4 frases, persuasivo e técnico)

Foque em: resultados clínicos, economia de tempo, precisão diagnóstica, facilidade de uso.`,
      response_json_schema: {
        type: "object",
        properties: {
          persuasion_triggers: {
            type: "array",
            items: { type: "string" }
          },
          technical_specs: { type: "string" },
          benefits: {
            type: "array",
            items: { type: "string" }
          },
          sales_copy: { type: "string" }
        }
      }
    });

    // Atualizar equipamento
    await base44.asServiceRole.entities.EquipmentMaterial.update(item.id, {
      persuasion_triggers: enrichment.persuasion_triggers,
      technical_specs: enrichment.technical_specs,
      benefits: enrichment.benefits,
      sales_copy: enrichment.sales_copy,
      ai_enriched: true,
      ai_enriched_date: new Date().toISOString()
    });

    return Response.json({ 
      success: true, 
      enriched_fields: Object.keys(enrichment)
    });

  } catch (error) {
    console.error('Error enriching equipment:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});
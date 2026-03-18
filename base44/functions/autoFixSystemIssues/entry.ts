import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { issue_type } = await req.json();

    const results = {
      issue_type,
      fixed: 0,
      errors: 0,
      details: []
    };

    switch (issue_type) {
      case 'missing_numerology': {
        // PROBLEMA 1: Clientes sem numerologia
        const clients = await base44.asServiceRole.entities.Client.list();
        
        for (const client of clients) {
          if (!client.numerology_number || !client.behavioral_profile) {
            try {
              const analysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
                prompt: `Calcule o número numerológico do nome "${client.first_name}" e forneça perfil comportamental.`,
                response_json_schema: {
                  type: "object",
                  properties: {
                    numerology_number: { type: "number" },
                    behavioral_profile: { type: "string" },
                    decision_style: { type: "string" },
                    approach_tips: { type: "string" }
                  }
                }
              });

              await base44.asServiceRole.entities.Client.update(client.id, analysis);
              results.fixed++;
              results.details.push(`✓ ${client.first_name}: numerologia calculada`);
            } catch (error) {
              results.errors++;
              results.details.push(`✗ ${client.first_name}: ${error.message}`);
            }
          }
        }
        break;
      }

      case 'missing_health_score': {
        // PROBLEMA 2: Clientes sem health score
        const clients = await base44.asServiceRole.entities.Client.list();
        
        for (const client of clients) {
          if (!client.health_score) {
            try {
              const sales = await base44.asServiceRole.entities.Sale.filter({ client_id: client.id });
              const interactions = await base44.asServiceRole.entities.Interaction.filter({ client_id: client.id });
              
              const healthScore = Math.min(100, Math.round(
                (sales.length * 20) +
                (interactions.length * 5) +
                (client.purchase_score || 50) * 0.3 +
                (client.engagement_score || 0) * 0.2
              ));

              await base44.asServiceRole.entities.Client.update(client.id, {
                health_score: healthScore,
                health_score_updated: new Date().toISOString()
              });
              
              results.fixed++;
              results.details.push(`✓ ${client.first_name}: health score = ${healthScore}`);
            } catch (error) {
              results.errors++;
            }
          }
        }
        break;
      }

      case 'missing_lab_needs': {
        // PROBLEMA 3: Clientes sem lab_needs
        const clients = await base44.asServiceRole.entities.Client.list();
        
        for (const client of clients) {
          if (!client.lab_needs || client.lab_needs.length === 0) {
            try {
              const analysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
                prompt: `Baseado no perfil: Tipo=${client.client_type}, Equipamento Atual=${client.current_equipment}, sugira necessidades de laboratório.`,
                response_json_schema: {
                  type: "object",
                  properties: {
                    lab_needs: {
                      type: "array",
                      items: { type: "string", enum: ["hemograma", "bioquimico", "hemogasio", "imunofluorescencia", "urinalise", "pcr"] }
                    }
                  }
                }
              });

              await base44.asServiceRole.entities.Client.update(client.id, analysis);
              results.fixed++;
              results.details.push(`✓ ${client.first_name}: lab_needs definidas`);
            } catch (error) {
              results.errors++;
            }
          }
        }
        break;
      }

      case 'missing_sales_intelligence': {
        // PROBLEMA 4: Clientes sem Sales Intelligence IA
        const clients = await base44.asServiceRole.entities.Client.list();
        
        for (const client of clients) {
          if (!client.ai_sales_intelligence) {
            try {
              const sales = await base44.asServiceRole.entities.Sale.filter({ client_id: client.id });
              const interactions = await base44.asServiceRole.entities.Interaction.filter({ client_id: client.id });

              const intelligence = await base44.asServiceRole.integrations.Core.InvokeLLM({
                prompt: `Crie sales intelligence para: Status=${client.status}, Score=${client.purchase_score}, Vendas=${sales.length}, Interações=${interactions.length}`,
                response_json_schema: {
                  type: "object",
                  properties: {
                    conversion_probability: { type: "number" },
                    churn_risk: { type: "number" },
                    best_approach: { type: "string" },
                    ltv_12_months: { type: "number" },
                    product_adoption_rate: { type: "number" }
                  }
                }
              });

              await base44.asServiceRole.entities.Client.update(client.id, {
                ai_sales_intelligence: intelligence,
                'ai_sales_intelligence.last_ai_analysis': new Date().toISOString()
              });
              
              results.fixed++;
              results.details.push(`✓ ${client.first_name}: intelligence gerada`);
            } catch (error) {
              results.errors++;
            }
          }
        }
        break;
      }

      case 'missing_equipment_data': {
        // PROBLEMA 5: Equipamentos sem dados completos
        const equipment = await base44.asServiceRole.entities.EquipmentMaterial.list();
        
        for (const eq of equipment) {
          if (!eq.persuasion_triggers || !eq.technical_specs) {
            try {
              const enrichment = await base44.asServiceRole.integrations.Core.InvokeLLM({
                prompt: `Crie dados de vendas para equipamento "${eq.equipment_name}": gatilhos de persuasão, especificações técnicas, benefícios.`,
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
                    }
                  }
                }
              });

              await base44.asServiceRole.entities.EquipmentMaterial.update(eq.id, enrichment);
              results.fixed++;
              results.details.push(`✓ ${eq.equipment_name}: dados enriquecidos`);
            } catch (error) {
              results.errors++;
            }
          }
        }
        break;
      }

      default:
        return Response.json({ error: 'Invalid issue_type' }, { status: 400 });
    }

    return Response.json({
      success: true,
      results
    });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
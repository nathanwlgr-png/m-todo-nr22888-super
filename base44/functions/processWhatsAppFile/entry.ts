import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { file_url, file_type, sender_phone, file_name } = await req.json();

    if (!file_url || !sender_phone) {
      return Response.json({ 
        error: 'file_url e sender_phone são obrigatórios' 
      }, { status: 400 });
    }

    // Detectar tipo de processamento baseado no nome do arquivo
    const isProspecting = file_name?.toLowerCase().includes('prospec') || 
                         file_name?.toLowerCase().includes('leads');
    const isMonthlyPlan = file_name?.toLowerCase().includes('planejamento') || 
                          file_name?.toLowerCase().includes('mensal');

    let processedData;
    let responseMessage;

    // Processar Excel de Prospecção
    if (file_type === 'excel' && isProspecting) {
      const extractResult = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url: file_url,
        json_schema: {
          type: "object",
          properties: {
            leads: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  full_name: { type: "string" },
                  company: { type: "string" },
                  phone: { type: "string" },
                  email: { type: "string" },
                  city: { type: "string" },
                  interest: { type: "string" },
                  source: { type: "string" }
                }
              }
            }
          }
        }
      });

      if (extractResult.status === 'success' && extractResult.output?.leads) {
        const leads = extractResult.output.leads;
        
        // Criar leads no sistema
        const createdLeads = [];
        for (const lead of leads.slice(0, 50)) { // Limite de 50 por vez
          try {
            const newLead = await base44.entities.Lead.create({
              full_name: lead.full_name,
              company: lead.company,
              phone: lead.phone,
              email: lead.email,
              city: lead.city,
              interest: lead.interest,
              source: lead.source || 'whatsapp_import',
              status: 'novo'
            });
            createdLeads.push(newLead);
          } catch (e) {
            console.error('Erro ao criar lead:', e);
          }
        }

        // Gerar análise com IA
        const analysis = await base44.integrations.Core.InvokeLLM({
          prompt: `Analise estes ${createdLeads.length} novos leads importados e forneça:
1. Resumo dos leads por cidade
2. Principais interesses/equipamentos
3. Sugestão de priorização (top 5 leads mais promissores)
4. Próximas ações recomendadas

Leads: ${JSON.stringify(createdLeads.slice(0, 10))}`,
          response_json_schema: {
            type: "object",
            properties: {
              summary_by_city: { type: "object" },
              main_interests: { type: "array", items: { type: "string" } },
              top_5_leads: { type: "array", items: { type: "string" } },
              next_actions: { type: "array", items: { type: "string" } }
            }
          }
        });

        processedData = {
          total_imported: createdLeads.length,
          analysis: analysis,
          leads: createdLeads.slice(0, 10)
        };

        responseMessage = `✅ *Prospecção Processada!*\n\n` +
          `📊 ${createdLeads.length} novos leads importados\n` +
          `🎯 Top interesse: ${analysis.main_interests?.[0] || 'N/A'}\n` +
          `📍 Principais cidades: ${Object.keys(analysis.summary_by_city || {}).slice(0, 3).join(', ')}\n\n` +
          `📋 Próximas ações recomendadas:\n${(analysis.next_actions || []).slice(0, 3).map((a, i) => `${i+1}. ${a}`).join('\n')}`;
      }
    }
    
    // Processar Excel de Planejamento Mensal
    else if (file_type === 'excel' && isMonthlyPlan) {
      const extractResult = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url: file_url,
        json_schema: {
          type: "object",
          properties: {
            visits: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  date: { type: "string" },
                  client_name: { type: "string" },
                  city: { type: "string" },
                  objective: { type: "string" },
                  status: { type: "string" },
                  projected_value: { type: "number" },
                  notes: { type: "string" }
                }
              }
            }
          }
        }
      });

      if (extractResult.status === 'success' && extractResult.output?.visits) {
        const visits = extractResult.output.visits;
        
        // Criar visitas no sistema
        const createdVisits = [];
        for (const visit of visits.slice(0, 50)) {
          try {
            // Buscar cliente pelo nome
            const clients = await base44.entities.Client.filter({ 
              clinic_name: visit.client_name 
            });
            
            if (clients.length > 0) {
              const newVisit = await base44.entities.Visit.create({
                client_id: clients[0].id,
                client_name: visit.client_name,
                scheduled_date: new Date(visit.date).toISOString(),
                visit_type: visit.objective?.includes('primeira') ? 'primeira_visita' : 
                           visit.objective?.includes('demo') ? 'demonstracao' : 
                           visit.objective?.includes('fech') ? 'fechamento' : 'followup',
                notes: visit.notes,
                status: 'agendada'
              });
              createdVisits.push(newVisit);
            }
          } catch (e) {
            console.error('Erro ao criar visita:', e);
          }
        }

        // Gerar análise de planejamento
        const analysis = await base44.integrations.Core.InvokeLLM({
          prompt: `Analise este planejamento mensal de ${visits.length} visitas e forneça:
1. Total de visitas por semana
2. Cidades com mais visitas
3. Valor total projetado
4. Sugestões de otimização de rota
5. Alertas de conflitos ou sobrecarga

Visitas: ${JSON.stringify(visits)}`,
          response_json_schema: {
            type: "object",
            properties: {
              visits_per_week: { type: "object" },
              top_cities: { type: "array", items: { type: "string" } },
              total_projected_value: { type: "number" },
              route_suggestions: { type: "array", items: { type: "string" } },
              alerts: { type: "array", items: { type: "string" } }
            }
          }
        });

        processedData = {
          total_visits: createdVisits.length,
          analysis: analysis,
          visits: createdVisits
        };

        responseMessage = `✅ *Planejamento Mensal Processado!*\n\n` +
          `📅 ${createdVisits.length} visitas agendadas\n` +
          `💰 Valor projetado: R$ ${(analysis.total_projected_value || 0).toLocaleString('pt-BR')}\n` +
          `📍 Principais cidades: ${(analysis.top_cities || []).slice(0, 3).join(', ')}\n\n` +
          `⚠️ Alertas:\n${(analysis.alerts || []).slice(0, 2).map((a, i) => `${i+1}. ${a}`).join('\n')}`;
      }
    }
    
    // Processar PDF
    else if (file_type === 'pdf') {
      const extractResult = await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url: file_url,
        json_schema: {
          type: "object",
          properties: {
            document_type: { type: "string" },
            key_points: { type: "array", items: { type: "string" } },
            action_items: { type: "array", items: { type: "string" } }
          }
        }
      });

      if (extractResult.status === 'success') {
        processedData = extractResult.output;
        responseMessage = `✅ *PDF Processado!*\n\n` +
          `📄 Tipo: ${extractResult.output.document_type || 'Documento'}\n\n` +
          `🔑 Pontos principais:\n${(extractResult.output.key_points || []).slice(0, 3).map((p, i) => `${i+1}. ${p}`).join('\n')}`;
      }
    }

    // Resposta padrão se não identificou tipo específico
    if (!responseMessage) {
      responseMessage = `✅ Arquivo recebido e armazenado!\n\n` +
        `📎 Nome: ${file_name || 'arquivo'}\n` +
        `📱 Use comandos específicos para processar:\n` +
        `- "processar prospecção" para planilhas de leads\n` +
        `- "processar planejamento" para agenda mensal`;
    }

    // Enviar resposta via WhatsApp
    await base44.functions.invoke('whatsappSendDirect', {
      phone: sender_phone,
      message: responseMessage
    });

    return Response.json({
      success: true,
      processed_data: processedData,
      message_sent: responseMessage
    });

  } catch (error) {
    console.error('Erro ao processar arquivo:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});
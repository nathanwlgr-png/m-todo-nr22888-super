import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    let {
      city,
      radius_km = 15,
      depth = 'rapida',
      segments = ['clinica'],
      quantity = 10,
      timeout_seconds = 30
    } = body;

    if (!city) throw new Error('Cidade obrigatória');
    
    // Limpar nome da cidade
    city = city.replace('á', 'a').replace('ú', 'u').toUpperCase();

    // Converter para número de resultado máx
    quantity = Math.min(Math.max(quantity, 1), 25);

    // Normalizar profundidade
    const depthConfig = {
      rapida: { credits: 3, max_results: 10, timeout: 30 },
      completa: { credits: 8, max_results: 20, timeout: 90 },
      suprema: { credits: 15, max_results: 25, timeout: 120 }
    };

    const config = depthConfig[depth] || depthConfig.rapida;
    quantity = Math.min(quantity, config.max_results);

    // Criar prompt para busca pública
    const prompt = `Você é especialista em pesquisa comercial PÚBLICA e ÉTICA.

BUSCAR em ${city}, raio ${radius_km}km:
${segments.includes('clinica') ? '- Clínicas Veterinárias\n' : ''}
${segments.includes('hospital') ? '- Hospitais Veterinários\n' : ''}
${segments.includes('laboratorio') ? '- Laboratórios\n' : ''}
${segments.includes('centro_diagnostico') ? '- Centros de Diagnóstico\n' : ''}
${segments.includes('universidade') ? '- Universidades com Medicina Veterinária\n' : ''}

USAR APENAS DADOS PÚBLICOS:
- Google Maps (nome, endereço, telefone, website, avaliações)
- Websites públicos
- Redes sociais públicas (Instagram, Facebook)
- Diretórios públicos

NUNCA:
- Scraping ilegal
- Dados privados
- Inventar informações
- Usar dados de login

RETORNAR JSON:
{
  "leads": [
    {
      "name": "Nome Clínica",
      "segment": "clinica/hospital/laboratorio",
      "city": "${city}",
      "phone": "+55 XX XXXXX-XXXX (se público)",
      "website": "URL",
      "instagram": "@handle (se público)",
      "maps_url": "Google Maps link",
      "distance_km": 2.5,
      "seamaty_score": 75,
      "seamaty_priority": "quente",
      "potential_product": "VG2",
      "potential_supplies": ["reagentes hematologia", "rotor"],
      "next_action": "Ligar segunda manhã",
      "data_source": ["Google Maps", "Instagram"],
      "notes": "Clínica moderna, muito movimento",
      "confirmed_in_crm": false
    }
  ]
}

RETORNE MÁXIMO ${quantity} LEADS.
SCORING SEAMATY (0-100):
- +20 emergência/pressa
- +15 envia exame fora
- +15 cliente parado
- +15 cidade estratégica  
- +10 crescimento visível
- +10 forte digital
- +10 comodato
- +10 gap equipamento
- +5 influência regional
- +5 potencial insumo

Mínimo 3 fontes públicas por lead.`;

    // Chamar LLM para busca inteligente
    const startTime = Date.now();
    
    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          leads: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                segment: { type: 'string' },
                city: { type: 'string' },
                phone: { type: 'string' },
                website: { type: 'string' },
                instagram: { type: 'string' },
                maps_url: { type: 'string' },
                distance_km: { type: 'number' },
                seamaty_score: { type: 'number' },
                seamaty_priority: { type: 'string' },
                potential_product: { type: 'string' },
                potential_supplies: { type: 'array', items: { type: 'string' } },
                next_action: { type: 'string' },
                data_source: { type: 'array', items: { type: 'string' } },
                notes: { type: 'string' },
                confirmed_in_crm: { type: 'boolean' }
              }
            }
          }
        }
      }
    });

    const executionTime = Date.now() - startTime;
    const leads = result.leads || [];

    // Validar limites rígidos
    if (executionTime > (timeout_seconds * 1000)) {
      throw new Error(`Timeout excedido (${executionTime}ms > ${timeout_seconds}s)`);
    }

    if (leads.length > 25) {
      leads.length = 25;
    }

    // Remover duplicados por telefone/website
    const unique = [];
    const seen = new Set();
    for (const lead of leads) {
      const key = `${lead.phone}-${lead.website}`;
      if (!seen.has(key)) {
        unique.push(lead);
        seen.add(key);
      }
    }

    // Salvar resultado no cache
    await base44.asServiceRole.entities.SeamHunt?.create({
      city,
      radius_km,
      depth,
      segment: segments,
      results_count: unique.length,
      execution_time_ms: executionTime,
      credits_spent: config.credits,
      search_results: unique,
      cached_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      search_status: 'completed'
    }).catch(() => {});

    return Response.json({
      city,
      radius_km,
      depth,
      results_count: unique.length,
      execution_time_ms: executionTime,
      credits_spent: config.credits,
      leads: unique
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
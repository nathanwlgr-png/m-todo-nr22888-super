import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { mode, radius_km, city, gps_coords } = await req.json();

    let searchQuery = '';
    let origin = '';

    if (mode === 'gps') {
      searchQuery = `clínicas veterinárias em ${radius_km}km de raio`;
      origin = `GPS ${gps_coords.lat}, ${gps_coords.lng}`;
    } else {
      searchQuery = `clínicas veterinárias em ${city} e num raio de ${radius_km}km`;
      origin = city;
    }

    // Buscar clínicas usando IA com contexto web
    const searchPrompt = `Busque TODAS as clínicas veterinárias ${searchQuery}.

Para cada clínica encontrada, retorne:
1. Nome completo da clínica
2. Endereço completo (rua, número, bairro, cidade, estado)
3. CNPJ (se disponível publicamente)
4. Telefone principal
5. Email (se disponível)
6. Website (se houver)
7. Distância aproximada em km de ${origin}
8. Nome do proprietário ou veterinário responsável (se disponível)

Busque em:
- Google Maps
- Sites de diretórios veterinários
- Páginas do governo (CRMV)
- Redes sociais

Retorne no mínimo 20 clínicas se disponível. Seja minucioso.`;

    const clinicsData = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: searchPrompt,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          clinics: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                address: { type: "string" },
                cnpj: { type: "string" },
                phone: { type: "string" },
                email: { type: "string" },
                website: { type: "string" },
                distance_km: { type: "number" },
                owner_name: { type: "string" }
              }
            }
          }
        }
      }
    });

    const clinics = clinicsData.clinics || [];
    const clinicsWithAnalysis = [];
    let withCnpj = 0;
    let analyzed = 0;

    // Analisar cada clínica
    for (const clinic of clinics) {
      const enrichedClinic = { ...clinic };

      // Se tem CNPJ, fazer análise completa
      if (clinic.cnpj) {
        withCnpj++;
        
        try {
          // Análise de CNPJ e dados financeiros
          const cnpjAnalysis = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt: `Analise o CNPJ ${clinic.cnpj} da empresa ${clinic.name}. Busque:
1. Razão social
2. Data de abertura
3. Porte da empresa (MEI, ME, EPP, etc)
4. Capital social
5. Atividade principal
6. Situação cadastral

Retorne dados estruturados.`,
            add_context_from_internet: true,
            response_json_schema: {
              type: "object",
              properties: {
                razao_social: { type: "string" },
                data_abertura: { type: "string" },
                porte: { type: "string" },
                capital_social: { type: "string" },
                situacao: { type: "string" }
              }
            }
          });

          enrichedClinic.cnpj_data = cnpjAnalysis;
        } catch (e) {
          console.error('Erro ao analisar CNPJ:', e);
        }
      }

      // Análise numerológica do dono (se disponível)
      if (clinic.owner_name) {
        try {
          const numerologyPrompt = `Calcule a numerologia pitagórica do nome "${clinic.owner_name}".
          
Retorne:
1. Número do nome (soma dos valores das letras)
2. Perfil comportamental
3. Estilo de decisão
4. Dicas de abordagem para vendas`;

          const numerology = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt: numerologyPrompt,
            response_json_schema: {
              type: "object",
              properties: {
                numero: { type: "number" },
                perfil: { type: "string" },
                estilo_decisao: { type: "string" },
                dicas_abordagem: { type: "string" }
              }
            }
          });

          enrichedClinic.numerology = numerology;
          enrichedClinic.numerology_score = numerology.numero;
        } catch (e) {
          console.error('Erro numerologia:', e);
        }
      }

      analyzed++;
      clinicsWithAnalysis.push(enrichedClinic);
    }

    // Salvar busca no histórico
    const searchRecord = await base44.asServiceRole.entities.ClinicSearchHistory?.create({
      user_email: user.email,
      search_mode: mode,
      origin_location: origin,
      radius_km,
      clinics_found: clinics.length,
      clinics_data: clinicsWithAnalysis,
      search_date: new Date().toISOString()
    }).catch(() => null);

    return Response.json({
      success: true,
      clinics_found: clinics.length,
      with_cnpj: withCnpj,
      analyzed: analyzed,
      clinics: clinicsWithAnalysis,
      search_id: searchRecord?.id
    });

  } catch (error) {
    console.error('Error:', error);
    return Response.json({ 
      error: error.message,
      success: false
    }, { status: 500 });
  }
});
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { clinic_name, city, cnpj } = await req.json();

        if (!clinic_name && !cnpj) {
            return Response.json({ 
                error: 'Nome da clínica ou CNPJ são obrigatórios' 
            }, { status: 400 });
        }

        const result = {
            clinic_name: clinic_name,
            city: city,
            cnpj: null,
            razao_social: null,
            socios: [],
            website: null,
            instagram: null,
            facebook: null,
            equipment_inferred: [],
            specialties_inferred: [],
            data_sources: []
        };

        // 1. Buscar CNPJ usando Brasil API (gratuita)
        let cnpjToSearch = cnpj;
        
        if (!cnpjToSearch && clinic_name) {
            // Tentar encontrar CNPJ pelo nome usando IA
            const searchPrompt = `Busque na internet o CNPJ da empresa "${clinic_name}" localizada em ${city || 'Brasil'}. 
            Retorne apenas o CNPJ no formato: {"cnpj": "00.000.000/0000-00"}`;
            
            try {
                const aiResponse = await base44.integrations.Core.InvokeLLM({
                    prompt: searchPrompt,
                    add_context_from_internet: true,
                    response_json_schema: {
                        type: "object",
                        properties: {
                            cnpj: { type: "string" }
                        }
                    }
                });
                
                if (aiResponse.cnpj) {
                    cnpjToSearch = aiResponse.cnpj.replace(/\D/g, '');
                    result.data_sources.push('IA - Busca Web CNPJ');
                }
            } catch (error) {
                console.log('Could not find CNPJ via AI:', error.message);
            }
        }

        // 2. Consultar dados do CNPJ na Brasil API
        if (cnpjToSearch) {
            const cleanCnpj = cnpjToSearch.replace(/\D/g, '');
            
            try {
                const cnpjResponse = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`);
                
                if (cnpjResponse.ok) {
                    const cnpjData = await cnpjResponse.json();
                    
                    result.cnpj = cnpjData.cnpj;
                    result.razao_social = cnpjData.razao_social;
                    result.data_sources.push('Brasil API');
                    
                    // Extrair sócios
                    if (cnpjData.qsa && Array.isArray(cnpjData.qsa)) {
                        result.socios = cnpjData.qsa.map(socio => ({
                            nome: socio.nome_socio,
                            qualificacao: socio.qualificacao_socio,
                            data_entrada: socio.data_entrada_sociedade
                        }));
                    }
                }
            } catch (error) {
                console.log('Brasil API error:', error.message);
            }
        }

        // 3. Buscar website e redes sociais usando IA com contexto da web
        const socialMediaPrompt = `Busque informações sobre a clínica veterinária "${clinic_name}" ${city ? `em ${city}` : ''}.
        
        Encontre:
        1. Website oficial (URL completa)
        2. Instagram (handle ou URL)
        3. Facebook (URL da página)
        4. Principais equipamentos veterinários que possuem (ex: VG2, analisador hematológico, ultrassom, etc)
        5. Especialidades oferecidas (ex: cardiologia, oncologia, laboratório, etc)
        
        Retorne no formato JSON especificado.`;

        try {
            const socialResponse = await base44.integrations.Core.InvokeLLM({
                prompt: socialMediaPrompt,
                add_context_from_internet: true,
                response_json_schema: {
                    type: "object",
                    properties: {
                        website: { type: "string" },
                        instagram: { type: "string" },
                        facebook: { type: "string" },
                        equipment: { 
                            type: "array",
                            items: { type: "string" }
                        },
                        specialties: {
                            type: "array",
                            items: { type: "string" }
                        }
                    }
                }
            });

            if (socialResponse.website) result.website = socialResponse.website;
            if (socialResponse.instagram) result.instagram = socialResponse.instagram;
            if (socialResponse.facebook) result.facebook = socialResponse.facebook;
            if (socialResponse.equipment) result.equipment_inferred = socialResponse.equipment;
            if (socialResponse.specialties) result.specialties_inferred = socialResponse.specialties;
            
            result.data_sources.push('IA - Busca Web Redes Sociais');
        } catch (error) {
            console.log('Social media search error:', error.message);
        }

        // 4. Análise de perfil e recomendações
        const profilePrompt = `Baseado nos seguintes dados da clínica veterinária:
        
        Nome: ${result.clinic_name}
        Cidade: ${result.city || 'Não informada'}
        Razão Social: ${result.razao_social || 'Não encontrada'}
        Especialidades: ${result.specialties_inferred.join(', ') || 'Não identificadas'}
        Equipamentos: ${result.equipment_inferred.join(', ') || 'Não identificados'}
        
        Forneça:
        1. Tipo de clínica (pequena/média/grande, generalista/especializada)
        2. Equipamentos que provavelmente precisam ou têm interesse
        3. Principais dores/necessidades que podem ter
        4. Melhor abordagem de vendas
        
        Retorne no formato JSON.`;

        try {
            const profileAnalysis = await base44.integrations.Core.InvokeLLM({
                prompt: profilePrompt,
                response_json_schema: {
                    type: "object",
                    properties: {
                        clinic_type: { type: "string" },
                        recommended_equipment: {
                            type: "array",
                            items: { type: "string" }
                        },
                        potential_needs: {
                            type: "array",
                            items: { type: "string" }
                        },
                        sales_approach: { type: "string" }
                    }
                }
            });

            result.profile_analysis = profileAnalysis;
        } catch (error) {
            console.log('Profile analysis error:', error.message);
        }

        return Response.json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('Error getting clinic profile:', error);
        return Response.json({ 
            error: error.message || 'Erro ao obter perfil da clínica' 
        }, { status: 500 });
    }
});
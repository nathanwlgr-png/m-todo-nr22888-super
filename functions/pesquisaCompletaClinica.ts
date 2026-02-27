import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { cnpj, clinic_name, city, phone } = body;

    if (!cnpj && !clinic_name) {
      return Response.json({ error: 'Informe CNPJ ou nome da clínica' }, { status: 400 });
    }

    // ─── 1. VERIFICAR DUPLICATAS NO CRM ───────────────────────────────────────
    const [allClients, allLeads] = await Promise.all([
      base44.asServiceRole.entities.Client.list(),
      base44.asServiceRole.entities.Lead.list()
    ]);

    const normalizeStr = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const normCNPJ = (c) => (c || '').replace(/\D/g, '');

    let duplicateClients = [];
    let duplicateLeads = [];

    // Check CNPJ match
    if (cnpj) {
      const cleanCnpj = normCNPJ(cnpj);
      duplicateClients = allClients.filter(c => normCNPJ(c.cnpj) === cleanCnpj);
      duplicateLeads = allLeads.filter(l => normCNPJ(l.cnpj) === cleanCnpj);
    }

    // Check name match (fuzzy)
    if (clinic_name && duplicateClients.length === 0) {
      const normName = normalizeStr(clinic_name);
      duplicateClients = allClients.filter(c =>
        normalizeStr(c.clinic_name).includes(normName) ||
        normalizeStr(c.full_name).includes(normName) ||
        (normName.length > 5 && normalizeStr(c.clinic_name).length > 5 &&
          normName.slice(0, 8) === normalizeStr(c.clinic_name).slice(0, 8))
      );
      duplicateLeads = allLeads.filter(l =>
        normalizeStr(l.company).includes(normName) ||
        (normName.length > 5 && normalizeStr(l.company || '').slice(0, 8) === normName.slice(0, 8))
      );
    }

    // Check phone match
    if (phone && duplicateClients.length === 0) {
      const cleanPhone = phone.replace(/\D/g, '');
      duplicateClients = allClients.filter(c => (c.phone || '').replace(/\D/g, '') === cleanPhone);
    }

    // ─── 2. BUSCA CNPJ (API pública) ─────────────────────────────────────────
    let cnpjData = null;
    if (cnpj) {
      const cleanCnpj = normCNPJ(cnpj);
      const cnpjRes = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`);
      if (cnpjRes.ok) {
        cnpjData = await cnpjRes.json();
      }
    }

    // ─── 3. PESQUISA COMPLETA NA WEB + IA ────────────────────────────────────
    const searchTerm = clinic_name || (cnpjData?.razao_social) || '';
    const searchCity = city || (cnpjData?.municipio) || '';

    const webResearch = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Faça uma pesquisa COMPLETA e DETALHADA sobre a clínica/hospital veterinário:
Nome: "${searchTerm}"
Cidade: "${searchCity}"
${cnpj ? `CNPJ: ${cnpj}` : ''}

PESQUISE E RETORNE TUDO QUE ENCONTRAR:

1. DADOS DA EMPRESA:
   - Nome fantasia e razão social
   - CNPJ (se não fornecido)
   - Endereço completo (rua, número, bairro, CEP, cidade, estado)
   - Telefone(s) de contato
   - Email(s) de contato
   - Site oficial

2. PROPRIETÁRIO / RESPONSÁVEL:
   - Nome completo do proprietário ou diretor clínico
   - CRMV (registro veterinário) se encontrar
   - Data de fundação da clínica
   - Formação/especialização

3. REDES SOCIAIS:
   - Instagram: URL e @handle
   - Facebook: URL da página
   - LinkedIn: perfil da empresa
   - YouTube: canal (se existir)
   - WhatsApp Business (se público)
   - TikTok (se existir)
   - Número de seguidores em cada rede (se visível)

4. SERVIÇOS E ESPECIALIDADES:
   - Especialidades atendidas (cardiologia, oncologia, ortopedia, etc.)
   - Espécies atendidas (cão, gato, exóticos, equinos)
   - Serviços oferecidos (internação, UTI, cirurgia, exames, ultrassom, etc.)
   - Horário de funcionamento
   - Plantão 24h?

5. EQUIPAMENTOS E LABORATÓRIO:
   - Equipamentos mencionados em posts/site (marca, modelo)
   - Faz exames in-house? Quais?
   - Usa laboratório terceirizado? Qual?
   - Menção a hemograma, bioquímico, gasometria, PCR

6. PORTE E VOLUME ESTIMADO:
   - Número de veterinários
   - Número de atendimentos estimado/mês
   - Volume estimado de exames/mês (hemogramas)
   - Avaliação no Google (nota e número de reviews)

7. OPORTUNIDADE COMERCIAL:
   - Nível de oportunidade: ALTO / MÉDIO / BAIXO
   - Produto Seamaty mais indicado (VBC-50A, SMT-120VP, VG1, VG2, Vi1, VQ1, QT3)
   - Principal argumento de abordagem
   - Melhor canal de contato

8. ABORDAGEM PERSONALIZADA:
   - Script de primeiro contato (2-3 frases diretas)
   - Dica especial sobre o perfil da clínica
   - Possíveis objeções prováveis

Responda em JSON estruturado. Se não encontrar algum campo, coloque null.`,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          clinic_name: { type: "string" },
          razao_social: { type: "string" },
          cnpj_found: { type: "string" },
          address: { type: "string" },
          cep: { type: "string" },
          city: { type: "string" },
          state: { type: "string" },
          phone: { type: "string" },
          email: { type: "string" },
          website: { type: "string" },
          owner_name: { type: "string" },
          owner_crmv: { type: "string" },
          founding_date: { type: "string" },
          instagram_handle: { type: "string" },
          instagram_url: { type: "string" },
          instagram_followers: { type: "string" },
          facebook_url: { type: "string" },
          linkedin_url: { type: "string" },
          youtube_url: { type: "string" },
          tiktok_url: { type: "string" },
          whatsapp_business: { type: "string" },
          specialties: { type: "array", items: { type: "string" } },
          species_attended: { type: "array", items: { type: "string" } },
          services: { type: "array", items: { type: "string" } },
          opening_hours: { type: "string" },
          has_24h: { type: "boolean" },
          current_equipment: { type: "array", items: { type: "string" } },
          does_inhouse_exams: { type: "boolean" },
          inhouse_exam_types: { type: "array", items: { type: "string" } },
          uses_third_party_lab: { type: "string" },
          num_vets: { type: "number" },
          estimated_monthly_exams: { type: "number" },
          google_rating: { type: "string" },
          google_reviews_count: { type: "string" },
          opportunity_level: { type: "string" },
          recommended_product: { type: "string" },
          recommended_product_reason: { type: "string" },
          best_contact_channel: { type: "string" },
          approach_script: { type: "string" },
          special_tip: { type: "string" },
          likely_objections: { type: "array", items: { type: "string" } }
        }
      }
    });

    // ─── 4. MONTAR RESPOSTA COMPLETA ──────────────────────────────────────────
    const hasDuplicate = duplicateClients.length > 0 || duplicateLeads.length > 0;

    return Response.json({
      success: true,
      // Alerta de duplicata
      duplicate_check: {
        has_duplicate: hasDuplicate,
        existing_clients: duplicateClients.map(c => ({
          id: c.id,
          name: c.full_name || c.first_name,
          clinic: c.clinic_name,
          cnpj: c.cnpj,
          phone: c.phone,
          status: c.status,
          pipeline_stage: c.pipeline_stage,
          representante: c.representante,
          created_date: c.created_date
        })),
        existing_leads: duplicateLeads.map(l => ({
          id: l.id,
          name: l.full_name,
          company: l.company,
          phone: l.phone,
          stage: l.stage,
          created_date: l.created_date
        }))
      },
      // Dados do CNPJ
      cnpj_data: cnpjData ? {
        razao_social: cnpjData.razao_social,
        nome_fantasia: cnpjData.nome_fantasia,
        cnpj: cnpjData.cnpj,
        situacao: cnpjData.descricao_situacao_cadastral,
        data_abertura: cnpjData.data_inicio_atividade,
        porte: cnpjData.porte,
        natureza_juridica: cnpjData.natureza_juridica,
        logradouro: cnpjData.logradouro,
        numero: cnpjData.numero,
        complemento: cnpjData.complemento,
        bairro: cnpjData.bairro,
        municipio: cnpjData.municipio,
        uf: cnpjData.uf,
        cep: cnpjData.cep,
        email: cnpjData.email,
        telefone: cnpjData.ddd_telefone_1,
        capital_social: cnpjData.capital_social,
        qsa: cnpjData.qsa // quadro societário (proprietários)
      } : null,
      // Dados da pesquisa web + IA
      web_intelligence: webResearch,
      // Resumo formatado para WhatsApp
      whatsapp_summary: formatForWhatsApp({
        webResearch,
        cnpjData,
        hasDuplicate,
        duplicateClients,
        duplicateLeads,
        searchTerm,
        searchCity
      }),
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erro em pesquisaCompletaClinica:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function formatForWhatsApp({ webResearch: w, cnpjData: c, hasDuplicate, duplicateClients, duplicateLeads, searchTerm, searchCity }) {
  const lines = [];

  lines.push(`🔍 *PESQUISA COMPLETA — ${(searchTerm || '').toUpperCase()}*`);
  if (searchCity) lines.push(`📍 ${searchCity}`);
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━');

  // Duplicata
  if (hasDuplicate) {
    lines.push('⚠️ *JÁ CADASTRADO NO CRM!*');
    if (duplicateClients.length > 0) {
      duplicateClients.forEach(dc => {
        lines.push(`👤 Cliente: ${dc.full_name || dc.first_name} — ${dc.clinic_name || ''}`);
        lines.push(`   📊 Status: ${dc.status || '-'} | Funil: ${dc.pipeline_stage || '-'}`);
        lines.push(`   👤 Rep: ${dc.representante || '-'}`);
      });
    }
    if (duplicateLeads.length > 0) {
      duplicateLeads.forEach(dl => {
        lines.push(`🎯 Lead: ${dl.full_name} — ${dl.company || ''}`);
        lines.push(`   📊 Estágio: ${dl.stage || '-'}`);
      });
    }
    lines.push('');
  } else {
    lines.push('✅ *Não cadastrado no CRM — NOVO PROSPECTO!*');
    lines.push('');
  }

  // CNPJ
  if (c) {
    lines.push('🏢 *DADOS CNPJ (RECEITA FEDERAL)*');
    if (c.razao_social) lines.push(`   Razão Social: ${c.razao_social}`);
    if (c.nome_fantasia) lines.push(`   Nome Fantasia: ${c.nome_fantasia}`);
    if (c.cnpj) lines.push(`   CNPJ: ${c.cnpj}`);
    if (c.data_inicio_atividade) lines.push(`   Abertura: ${c.data_inicio_atividade}`);
    if (c.porte) lines.push(`   Porte: ${c.porte}`);
    if (c.capital_social) lines.push(`   Capital Social: R$ ${Number(c.capital_social).toLocaleString('pt-BR')}`);
    const addr = [c.logradouro, c.numero, c.bairro, c.municipio, c.uf, c.cep].filter(Boolean).join(', ');
    if (addr) lines.push(`   Endereço: ${addr}`);
    if (c.email) lines.push(`   Email: ${c.email}`);
    if (c.ddd_telefone_1) lines.push(`   Tel: ${c.ddd_telefone_1}`);
    if (c.qsa && c.qsa.length > 0) {
      lines.push(`   👤 Sócios: ${c.qsa.map(q => q.nome_socio || q.nome).join(', ')}`);
    }
    lines.push('');
  }

  // Web Intelligence
  if (w) {
    lines.push('🌐 *INTELIGÊNCIA WEB*');
    if (w.owner_name) lines.push(`   👤 Proprietário: *${w.owner_name}*`);
    if (w.phone) lines.push(`   📞 Tel: ${w.phone}`);
    if (w.email) lines.push(`   📧 Email: ${w.email}`);
    if (w.website) lines.push(`   🌐 Site: ${w.website}`);
    if (w.opening_hours) lines.push(`   🕐 Horário: ${w.opening_hours}`);
    if (w.has_24h) lines.push(`   🚨 Plantão 24h: SIM`);
    lines.push('');

    // Redes sociais
    const socials = [];
    if (w.instagram_handle) socials.push(`📸 IG: ${w.instagram_handle}${w.instagram_followers ? ` (${w.instagram_followers} seguidores)` : ''}`);
    if (w.facebook_url) socials.push(`👍 FB: ${w.facebook_url}`);
    if (w.linkedin_url) socials.push(`💼 LinkedIn: ${w.linkedin_url}`);
    if (w.youtube_url) socials.push(`▶️ YouTube: ${w.youtube_url}`);
    if (w.tiktok_url) socials.push(`🎵 TikTok: ${w.tiktok_url}`);
    if (socials.length > 0) {
      lines.push('📱 *REDES SOCIAIS*');
      socials.forEach(s => lines.push(`   ${s}`));
      lines.push('');
    }

    // Serviços e equipamentos
    if (w.specialties && w.specialties.length > 0) {
      lines.push(`🏥 *Especialidades:* ${w.specialties.join(', ')}`);
    }
    if (w.current_equipment && w.current_equipment.length > 0) {
      lines.push(`🔬 *Equipamentos Atuais:* ${w.current_equipment.join(', ')}`);
    }
    if (w.does_inhouse_exams !== null) {
      lines.push(`🧪 Exames In-house: ${w.does_inhouse_exams ? 'SIM' : 'NÃO'}`);
    }
    if (w.uses_third_party_lab) lines.push(`🏪 Lab Terceirizado: ${w.uses_third_party_lab}`);
    if (w.num_vets) lines.push(`👨‍⚕️ Veterinários: ~${w.num_vets}`);
    if (w.estimated_monthly_exams) lines.push(`📊 Volume Exames/mês: ~${w.estimated_monthly_exams}`);
    if (w.google_rating) lines.push(`⭐ Google: ${w.google_rating} (${w.google_reviews_count || '?'} avaliações)`);
    lines.push('');

    // Oportunidade comercial
    lines.push('💼 *OPORTUNIDADE COMERCIAL*');
    if (w.opportunity_level) lines.push(`   🎯 Nível: *${w.opportunity_level.toUpperCase()}*`);
    if (w.recommended_product) lines.push(`   📦 Produto: *${w.recommended_product}*`);
    if (w.recommended_product_reason) lines.push(`   💡 Por quê: ${w.recommended_product_reason}`);
    if (w.best_contact_channel) lines.push(`   📞 Melhor Canal: ${w.best_contact_channel}`);
    lines.push('');

    if (w.approach_script) {
      lines.push('🗣️ *SCRIPT DE ABORDAGEM*');
      lines.push(`   "${w.approach_script}"`);
      lines.push('');
    }
    if (w.special_tip) {
      lines.push(`💡 *DICA:* ${w.special_tip}`);
      lines.push('');
    }
    if (w.likely_objections && w.likely_objections.length > 0) {
      lines.push(`⚠️ *Objeções Prováveis:* ${w.likely_objections.join(' | ')}`);
    }
  }

  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━');
  if (hasDuplicate) {
    lines.push('💬 _Deseja VER o perfil completo ou ATUALIZAR dados?_');
  } else {
    lines.push('💬 _Deseja CADASTRAR como Lead ou Cliente?_');
  }
  lines.push('🔥 *Método NR22 | Seamaty Brasil*');

  return lines.join('\n');
}
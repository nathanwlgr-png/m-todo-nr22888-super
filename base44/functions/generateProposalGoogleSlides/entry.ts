import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// ═══════════════════════════════════════════════════════════════
// MÉTODO NR22 — Gerador de Proposta Google Slides com IA
// Cria apresentação profissional personalizada via API Slides
// ═══════════════════════════════════════════════════════════════

const SEAMATY_PRODUCTS = {
  'VBC-50A': { price: 42000, roi_months: 8, savings: 3200, params: '26 parâmetros hematológicos', volume: '>40 hemo/mês', time: '3-5 min', sample: '20μL' },
  'SMT-120VP': { price: 68000, roi_months: 10, savings: 4800, params: '120 testes/hora', volume: '>30 bioquímicos/mês', time: '5-8 min', sample: '150μL' },
  'VG1': { price: 35000, roi_months: 9, savings: 2800, params: '15 parâmetros gasometria', volume: 'UTI/cirurgia', time: '3 min', sample: '65μL' },
  'VG2': { price: 78000, roi_months: 12, savings: 5500, params: 'Gasometria + Imunofluorescência', volume: 'Hospitais referência', time: '5 min', sample: '65μL' },
  'Vi1': { price: 45000, roi_months: 10, savings: 3600, params: 'Biomarcadores cardíacos/inflamatórios', volume: 'Hospitais', time: '15 min', sample: '100μL' },
  'VQ1': { price: 95000, roi_months: 14, savings: 6500, params: 'PCR Quantitativo', volume: 'Diagnóstico molecular', time: '45-60 min', sample: '50μL' },
  'QT3': { price: 18000, roi_months: 6, savings: 1800, params: 'Bioquímico Individual Rotores', volume: 'Entry point', time: '5-10 min', sample: '150μL' },
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { client_id, client_name, equipment_name, custom_notes } = await req.json();

    if (!client_id && !client_name) {
      return Response.json({ error: 'client_id ou client_name obrigatório' }, { status: 400 });
    }

    // ── 1. Buscar dados do cliente ────────────────────────────
    let client = null;
    if (client_id) {
      client = await base44.asServiceRole.entities.Client.get(client_id).catch(() => null);
    }
    if (!client && client_name) {
      const all = await base44.asServiceRole.entities.Client.list('-purchase_score', 200);
      client = all.find(c =>
        c.first_name?.toLowerCase().includes(client_name.toLowerCase()) ||
        c.full_name?.toLowerCase().includes(client_name.toLowerCase()) ||
        c.clinic_name?.toLowerCase().includes(client_name.toLowerCase())
      );
    }
    if (!client) return Response.json({ error: 'Cliente não encontrado' }, { status: 404 });

    const equip = equipment_name || client.equipment_interest || 'VBC-50A';
    const prod = SEAMATY_PRODUCTS[equip] || SEAMATY_PRODUCTS['VBC-50A'];

    // ── 2. Gerar conteúdo IA para os slides (1 chamada econômica) ──
    const aiContent = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Gere conteúdo COMPACTO para proposta Google Slides. Cliente: ${client.first_name || client.full_name}, Clínica: ${client.clinic_name || 'N/A'}, Cidade: ${client.city || 'N/A'}, Produto: ${equip}, Numerologia: ${client.numerology_number || 'N/A'}, Perfil: ${client.behavioral_profile || 'N/A'}, Dores: ${(client.main_pains || []).join(', ') || 'N/A'}, Score: ${client.purchase_score || 50}%. Preço: R$${prod.price.toLocaleString('pt-BR')}. ROI: ${prod.roi_months} meses. Economia: R$${prod.savings.toLocaleString('pt-BR')}/mês. ${custom_notes || ''}

Retorne JSON com:
- diagnostico: frase de diagnóstico personalizada (max 120 chars)
- dor_principal: principal dor identificada (max 80 chars)
- solucao: como o produto resolve (max 120 chars)
- roi_texto: texto de ROI personalizado (max 100 chars)
- diferencial_1, diferencial_2, diferencial_3: 3 diferenciais Seamaty (max 60 chars cada)
- call_to_action: frase de fechamento personalizada (max 100 chars)
- slide_titulo_abertura: título slide abertura (max 50 chars)`,
      response_json_schema: {
        type: 'object',
        properties: {
          diagnostico: { type: 'string' },
          dor_principal: { type: 'string' },
          solucao: { type: 'string' },
          roi_texto: { type: 'string' },
          diferencial_1: { type: 'string' },
          diferencial_2: { type: 'string' },
          diferencial_3: { type: 'string' },
          call_to_action: { type: 'string' },
          slide_titulo_abertura: { type: 'string' },
        }
      }
    });

    // ── 3. Obter token Google Slides ──────────────────────────
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('googleslides');

    // ── 4. Criar apresentação em branco ───────────────────────
    const createResp = await fetch('https://slides.googleapis.com/v1/presentations', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: `Proposta ${equip} — ${client.first_name || client.full_name} | SEAMATY Brasil` })
    });
    const presentation = await createResp.json();
    const presentationId = presentation.presentationId;
    if (!presentationId) throw new Error('Falha ao criar apresentação Google Slides');

    const existingSlideId = presentation.slides?.[0]?.objectId;

    // ── 5. Montar requests de slides ──────────────────────────
    const now = new Date().toLocaleDateString('pt-BR');
    const requests = [];

    // IDs dos slides
    const slideIds = ['slide_capa', 'slide_diagnostico', 'slide_solucao', 'slide_roi', 'slide_diferenciais', 'slide_prox_passos'];

    // Deletar slide padrão e criar os 6 slides
    if (existingSlideId) {
      requests.push({ deleteObject: { objectId: existingSlideId } });
    }

    slideIds.forEach((id, idx) => {
      requests.push({
        createSlide: {
          objectId: id,
          insertionIndex: idx,
          slideLayoutReference: { predefinedLayout: 'BLANK' }
        }
      });
    });

    // Helper: adicionar caixa de texto
    const addText = (slideId, text, x, y, w, h, fontSize = 18, bold = false, color = { red: 0.1, green: 0.1, blue: 0.1 }) => {
      const boxId = `${slideId}_${Math.random().toString(36).slice(2, 8)}`;
      return [
        {
          createShape: {
            objectId: boxId,
            shapeType: 'TEXT_BOX',
            elementProperties: {
              pageObjectId: slideId,
              size: { width: { magnitude: w, unit: 'PT' }, height: { magnitude: h, unit: 'PT' } },
              transform: { scaleX: 1, scaleY: 1, translateX: x, translateY: y, unit: 'PT' }
            }
          }
        },
        {
          insertText: { objectId: boxId, insertionIndex: 0, text }
        },
        {
          updateTextStyle: {
            objectId: boxId,
            textRange: { type: 'ALL' },
            style: {
              fontSize: { magnitude: fontSize, unit: 'PT' },
              bold,
              foregroundColor: { opaqueColor: { rgbColor: color } },
              fontFamily: 'Montserrat'
            },
            fields: 'fontSize,bold,foregroundColor,fontFamily'
          }
        }
      ];
    };

    // Helper: background colorido
    const addBackground = (slideId, r, g, b) => ({
      updatePageProperties: {
        objectId: slideId,
        pageProperties: { pageBackgroundFill: { solidFill: { color: { rgbColor: { red: r, green: g, blue: b } } } } },
        fields: 'pageBackgroundFill'
      }
    });

    // ── SLIDE 1: CAPA ──
    requests.push(addBackground('slide_capa', 0.07, 0.07, 0.18)); // Azul escuro
    requests.push(...addText('slide_capa', 'PROPOSTA COMERCIAL', 40, 60, 640, 50, 14, false, { red: 0.6, green: 0.8, blue: 1 }));
    requests.push(...addText('slide_capa', equip, 40, 120, 640, 80, 52, true, { red: 1, green: 1, blue: 1 }));
    requests.push(...addText('slide_capa', aiContent.slide_titulo_abertura || `Solução Diagnóstica para ${client.clinic_name || 'sua clínica'}`, 40, 210, 640, 60, 22, false, { red: 0.85, green: 0.85, blue: 0.95 }));
    requests.push(...addText('slide_capa', `${client.first_name || client.full_name} | ${client.clinic_name || ''}`, 40, 300, 640, 40, 16, false, { red: 0.6, green: 0.8, blue: 1 }));
    requests.push(...addText('slide_capa', `SEAMATY Brasil — Seamaty | ${now}`, 40, 360, 640, 30, 12, false, { red: 0.5, green: 0.7, blue: 0.9 }));

    // ── SLIDE 2: DIAGNÓSTICO ──
    requests.push(addBackground('slide_diagnostico', 0.97, 0.97, 1));
    requests.push(...addText('slide_diagnostico', '🔍 DIAGNÓSTICO', 40, 30, 640, 40, 11, true, { red: 0.3, green: 0.3, blue: 0.7 }));
    requests.push(...addText('slide_diagnostico', aiContent.diagnostico || `Análise do cenário atual de ${client.clinic_name}`, 40, 80, 640, 60, 24, true, { red: 0.07, green: 0.07, blue: 0.2 }));
    requests.push(...addText('slide_diagnostico', '⚠️ Desafio Identificado', 40, 160, 640, 30, 13, true, { red: 0.8, green: 0.3, blue: 0 }));
    requests.push(...addText('slide_diagnostico', aiContent.dor_principal || 'Alto custo com laboratório terceirizado limita margem e agilidade diagnóstica', 40, 195, 640, 50, 16, false, { red: 0.3, green: 0.3, blue: 0.3 }));
    requests.push(...addText('slide_diagnostico', `Volume atual: ${client.current_volume || 'a calcular'} | Tempo de mercado: ${client.market_time || 'N/A'}`, 40, 280, 640, 35, 13, false, { red: 0.5, green: 0.5, blue: 0.5 }));

    // ── SLIDE 3: SOLUÇÃO ──
    requests.push(addBackground('slide_solucao', 0.07, 0.07, 0.18));
    requests.push(...addText('slide_solucao', '⚡ SOLUÇÃO SEAMATY', 40, 30, 640, 40, 11, true, { red: 0.6, green: 0.8, blue: 1 }));
    requests.push(...addText('slide_solucao', equip, 40, 80, 400, 70, 44, true, { red: 1, green: 1, blue: 1 }));
    requests.push(...addText('slide_solucao', aiContent.solucao || `Diagnóstico in-house com resultado em ${prod.time}`, 40, 160, 640, 50, 18, false, { red: 0.85, green: 0.9, blue: 1 }));
    requests.push(...addText('slide_solucao', `📊 ${prod.params}`, 40, 230, 640, 30, 14, false, { red: 0.6, green: 0.8, blue: 1 }));
    requests.push(...addText('slide_solucao', `⏱️ Resultado em ${prod.time} | 🧪 Amostra: ${prod.sample}`, 40, 265, 640, 30, 14, false, { red: 0.6, green: 0.8, blue: 1 }));
    requests.push(...addText('slide_solucao', `📈 Ideal para: ${prod.volume}`, 40, 300, 640, 30, 14, false, { red: 0.6, green: 0.8, blue: 1 }));

    // ── SLIDE 4: ROI / INVESTIMENTO ──
    requests.push(addBackground('slide_roi', 0.97, 0.99, 0.97));
    requests.push(...addText('slide_roi', '💰 RETORNO DO INVESTIMENTO', 40, 30, 640, 40, 11, true, { red: 0.1, green: 0.5, blue: 0.1 }));
    requests.push(...addText('slide_roi', `R$ ${prod.savings.toLocaleString('pt-BR')}/mês`, 40, 80, 400, 70, 44, true, { red: 0.05, green: 0.5, blue: 0.05 }));
    requests.push(...addText('slide_roi', 'de economia vs laboratório terceirizado', 40, 155, 500, 35, 16, false, { red: 0.3, green: 0.3, blue: 0.3 }));
    requests.push(...addText('slide_roi', `✅ Payback em ${prod.roi_months} meses`, 40, 210, 640, 35, 18, true, { red: 0.1, green: 0.4, blue: 0.1 }));
    requests.push(...addText('slide_roi', aiContent.roi_texto || `Investimento de R$ ${prod.price.toLocaleString('pt-BR')} com retorno garantido`, 40, 255, 640, 50, 15, false, { red: 0.3, green: 0.3, blue: 0.3 }));
    requests.push(...addText('slide_roi', `Investimento: R$ ${prod.price.toLocaleString('pt-BR')} | À vista ou 5x cartão sem juros`, 40, 320, 640, 35, 13, false, { red: 0.4, green: 0.4, blue: 0.4 }));

    // ── SLIDE 5: DIFERENCIAIS ──
    requests.push(addBackground('slide_diferenciais', 0.07, 0.07, 0.18));
    requests.push(...addText('slide_diferenciais', '🏆 POR QUE SEAMATY?', 40, 30, 640, 40, 11, true, { red: 0.6, green: 0.8, blue: 1 }));
    requests.push(...addText('slide_diferenciais', '✅ 25 MESES DE GARANTIA', 40, 90, 640, 35, 18, true, { red: 0.4, green: 1, blue: 0.4 }));
    requests.push(...addText('slide_diferenciais', 'vs 12 meses da concorrência', 40, 125, 640, 25, 12, false, { red: 0.7, green: 0.7, blue: 0.9 }));
    requests.push(...addText('slide_diferenciais', '✅ MANUTENÇÃO VITALÍCIA INCLUSA', 40, 165, 640, 35, 18, true, { red: 0.4, green: 1, blue: 0.4 }));
    requests.push(...addText('slide_diferenciais', aiContent.diferencial_1 || 'Sem custo extra de manutenção por toda a vida útil', 40, 200, 640, 25, 12, false, { red: 0.7, green: 0.7, blue: 0.9 }));
    requests.push(...addText('slide_diferenciais', '✅ BONIFICAÇÃO EM INSUMOS', 40, 240, 640, 35, 18, true, { red: 0.4, green: 1, blue: 0.4 }));
    requests.push(...addText('slide_diferenciais', aiContent.diferencial_2 || 'Bonificação mensal em reagentes e consumíveis', 40, 275, 640, 25, 12, false, { red: 0.7, green: 0.7, blue: 0.9 }));
    requests.push(...addText('slide_diferenciais', '✅ ISO 13485:2016 — Qualidade Certificada', 40, 315, 640, 35, 16, true, { red: 0.4, green: 1, blue: 0.4 }));

    // ── SLIDE 6: PRÓXIMOS PASSOS ──
    requests.push(addBackground('slide_prox_passos', 0.97, 0.97, 1));
    requests.push(...addText('slide_prox_passos', '🚀 PRÓXIMOS PASSOS', 40, 30, 640, 40, 11, true, { red: 0.3, green: 0.3, blue: 0.7 }));
    requests.push(...addText('slide_prox_passos', aiContent.call_to_action || `${client.first_name}, vamos agendar a demonstração?`, 40, 80, 640, 60, 24, true, { red: 0.07, green: 0.07, blue: 0.2 }));
    requests.push(...addText('slide_prox_passos', '1️⃣  Demonstração técnica do equipamento', 40, 165, 640, 35, 16, false, { red: 0.2, green: 0.2, blue: 0.5 }));
    requests.push(...addText('slide_prox_passos', '2️⃣  Análise de viabilidade financeira', 40, 205, 640, 35, 16, false, { red: 0.2, green: 0.2, blue: 0.5 }));
    requests.push(...addText('slide_prox_passos', '3️⃣  Proposta personalizada e condições', 40, 245, 640, 35, 16, false, { red: 0.2, green: 0.2, blue: 0.5 }));
    requests.push(...addText('slide_prox_passos', `Nathan Rosa | SEAMATY Brasil — Seamaty`, 40, 320, 640, 30, 13, true, { red: 0.3, green: 0.3, blue: 0.7 }));
    requests.push(...addText('slide_prox_passos', `📱 WhatsApp | ✉️ cmat@seamaty.com.br`, 40, 350, 640, 25, 12, false, { red: 0.4, green: 0.4, blue: 0.6 }));

    // ── 6. Enviar batchUpdate ─────────────────────────────────
    const batchResp = await fetch(`https://slides.googleapis.com/v1/presentations/${presentationId}:batchUpdate`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests })
    });
    const batchResult = await batchResp.json();
    if (batchResult.error) throw new Error(`Google Slides API: ${batchResult.error.message}`);

    const slideUrl = `https://docs.google.com/presentation/d/${presentationId}/edit`;
    const exportUrl = `https://docs.google.com/presentation/d/${presentationId}/export/pptx`;

    // ── 7. Salvar referência no CRM ───────────────────────────
    await base44.asServiceRole.entities.GeneratedDocument.create({
      title: `Proposta ${equip} — ${client.first_name || client.full_name}`,
      client_id: client.id,
      client_name: client.first_name || client.full_name,
      type: 'proposta',
      file_url: slideUrl,
      notes: `Apresentação Google Slides gerada automaticamente. Produto: ${equip}. ${aiContent.diagnostico || ''}`,
    }).catch(() => {});

    // Atualizar client com próxima ação
    await base44.asServiceRole.entities.Client.update(client.id, {
      ai_next_best_action: `Proposta ${equip} gerada — enviar link e agendar demonstração`,
      next_contact_date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    }).catch(() => {});

    return Response.json({
      success: true,
      presentation_id: presentationId,
      slide_url: slideUrl,
      export_url: exportUrl,
      slides_count: slideIds.length,
      client_name: client.first_name || client.full_name,
      equipment: equip,
      message: `✅ Apresentação criada! ${slideIds.length} slides personalizados para ${client.first_name || client.full_name}`,
      whatsapp_text: `🎯 *Proposta ${equip} — ${client.first_name || client.full_name}*\n\nAcesse sua apresentação personalizada:\n${slideUrl}\n\n_Gerada pelo Método NR22 | SEAMATY Brasil_`,
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
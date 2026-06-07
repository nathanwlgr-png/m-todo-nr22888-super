import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { clientId } = await req.json();

    if (!clientId) {
      return Response.json({ error: 'clientId required' }, { status: 400 });
    }

    const client = await base44.entities.Client.get(clientId);
    if (!client) {
      return Response.json({ error: 'Client not found' }, { status: 404 });
    }

    // ── DIMENSÕES DO 4x4 (0-40 pontos cada) ──

    // 1️⃣ POTENCIAL (equipamento, volume, mercado)
    let potentialScore = 0;
    if (client.available_budget) {
      potentialScore = Math.min(40, (client.available_budget / 150000) * 40);
    }
    if (client.current_volume) {
      const volumeMap = {
        'mais_230_mes': 40,
        '120_230_mes': 30,
        '40_120_mes': 20,
        'menos_40_mes': 10
      };
      potentialScore = Math.max(potentialScore, volumeMap[client.current_volume] || 0);
    }

    // 2️⃣ MOMENTO (dias sem contato, urgência de decisão)
    let momentScore = 0;
    const daysSinceContact = client.last_contact_date 
      ? Math.floor((Date.now() - new Date(client.last_contact_date)) / 86400000)
      : 999;
    
    if (daysSinceContact <= 3) momentScore = 10;
    else if (daysSinceContact <= 7) momentScore = 20;
    else if (daysSinceContact <= 14) momentScore = 30;
    else momentScore = 40;

    if (client.decision_deadline) {
      const daysToDeadline = (new Date(client.decision_deadline) - Date.now()) / 86400000;
      if (daysToDeadline <= 7) momentScore = Math.max(momentScore, 40);
      else if (daysToDeadline <= 30) momentScore = Math.max(momentScore, 35);
    }

    // 3️⃣ RELACIONAMENTO (qualidade de contato, tom, histórico)
    let relationshipScore = 0;
    const statusWeight = { 'quente': 40, 'morno': 20, 'frio': 10 };
    relationshipScore += statusWeight[client.status] || 15;

    const totalVisits = client.total_visits_count || 0;
    relationshipScore += Math.min(15, totalVisits * 5);

    if (client.client_tone === 'receptivo' || client.client_tone === 'entusiasmado') {
      relationshipScore = Math.min(40, relationshipScore + 10);
    }

    // 4️⃣ EXECUÇÃO (próximas ações definidas, documentos assinados)
    let executionScore = 0;
    if (client.sale_closed) executionScore += 20;
    if (client.contract_signature_date && new Date(client.contract_signature_date) <= new Date()) executionScore += 10;
    if (client.equipment_sold) executionScore += 10;

    // ── CÁLCULO FINAL ──
    const totalScore = Math.round(potentialScore + momentScore + relationshipScore + executionScore);

    // ── CATEGORIAS ──
    let category = 'Nutrir';
    let categoryColor = '#64748b';
    let nextAction = 'Manter contato periódico';

    if (totalScore <= 40) {
      category = 'Nutrir';
      categoryColor = '#94a3b8';
      nextAction = 'Educação e relacionamento de longo prazo';
    } else if (totalScore <= 80) {
      category = 'Acompanhar';
      categoryColor = '#f59e0b';
      nextAction = 'Follow-up mensal com valor agregado';
    } else if (totalScore <= 120) {
      category = 'Priorizar';
      categoryColor = '#3b82f6';
      nextAction = 'Visita consultiva e diagnóstico detalhado';
    } else {
      category = 'Atacar Imediatamente';
      categoryColor = '#ef4444';
      nextAction = 'Contato direto, proposta e fechamento';
    }

    return Response.json({
      totalScore,
      maxScore: 160,
      percentage: Math.round((totalScore / 160) * 100),
      dimensions: {
        potential: Math.round(potentialScore),
        moment: Math.round(momentScore),
        relationship: Math.round(relationshipScore),
        execution: Math.round(executionScore)
      },
      category,
      categoryColor,
      nextAction,
      breakdown: {
        potentialNote: `Orçamento: R$ ${client.available_budget || 0}; Volume: ${client.current_volume}`,
        momentNote: `Últmo contato: ${daysSinceContact} dias atrás; Prazo: ${client.decision_deadline ? 'Sim' : 'Não definido'}`,
        relationshipNote: `Status: ${client.status}; Visitas: ${totalVisits}; Tone: ${client.client_tone}`,
        executionNote: `Venda: ${client.sale_closed ? 'Fechada' : 'Aberta'}; Contrato: ${client.contract_signature_date ? 'Assinado' : 'Pendente'}`
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
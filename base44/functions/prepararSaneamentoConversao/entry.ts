import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function hasTag(client, tag) {
  return Array.isArray(client.custom_tags) && client.custom_tags.includes(tag);
}

function clientName(client) {
  return client.clinic_name || client.full_name || client.first_name || 'Cliente sem nome';
}

function suggestEquipment(client) {
  const text = `${client.current_equipment || ''} ${(client.lab_needs || []).join(' ')} ${(client.custom_tags || []).join(' ')}`.toLowerCase();
  if (text.includes('hemat') || text.includes('hemograma')) return 'Analisador hematológico Seamaty';
  if (text.includes('bioq') || text.includes('bioquim')) return 'Analisador bioquímico Seamaty';
  if (text.includes('hemogas') || text.includes('gasometr')) return 'Hemogasometria Seamaty';
  if (hasTag(client, 'Cliente_Seamaty') || hasTag(client, 'Base_Seamaty_Upsell')) return 'Upsell de insumos e equipamentos Seamaty';
  return 'Diagnóstico Seamaty: hematologia ou bioquímica conforme volume';
}

function suggestAction(client) {
  if (!client.phone) return 'Confirmar telefone/WhatsApp antes de abordagem comercial';
  if (hasTag(client, 'Ataque_Imediato') || hasTag(client, 'Sniper_Do_Dia')) return 'Fazer contato SPIN hoje e conduzir para WhatsApp aprovado';
  if (hasTag(client, 'Radar_60_Dias')) return 'Reativar com mensagem consultiva e agendar próxima conversa';
  if (hasTag(client, 'Cliente_Seamaty') || hasTag(client, 'Base_Seamaty_Upsell')) return 'Oferecer upsell Seamaty com base no histórico e consumo';
  return 'Investigar necessidade laboratorial e definir próximo passo comercial';
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    const actorEmail = user?.email || 'automacao_segura_nr22888';

    const body = await req.json().catch(() => ({}));
    const limit = Math.min(Number(body.limit || 50), 100);
    const sr = base44.asServiceRole;
    const clients = await sr.entities.Client.list('-updated_date', 1000);
    const queue = await sr.entities.CRMUpdateQueue.list('-data_criacao', 1000).catch(() => []);
    const openKeys = new Set(queue.filter(q => ['pendente', 'aprovado'].includes(q.status)).map(q => `${q.cliente_id}|${q.campo_alvo}|${q.valor_novo}`));

    let created = 0;
    const gaps = { semTelefone: 0, semProximaAcao: 0, semProduto: 0 };
    const samples = [];

    for (const client of clients) {
      if (created >= limit) break;
      const priority = hasTag(client, 'Lote_515_Suprema') || hasTag(client, 'Prospect_Seamaty') || hasTag(client, 'Sniper_Do_Dia') || hasTag(client, 'Cliente_Seamaty');
      if (!priority) continue;

      const suggestions = [];
      if (!client.phone) {
        gaps.semTelefone++;
        suggestions.push({ field: 'next_action', value: 'Confirmar telefone/WhatsApp antes de qualquer envio', risco: 'medio', type: 'telefone_pendente' });
      }
      if (!client.next_action) {
        gaps.semProximaAcao++;
        suggestions.push({ field: 'next_action', value: suggestAction(client), risco: 'baixo', type: 'proxima_acao_comercial' });
      }
      if (!client.equipment_interest && !client.equipment_suggestion) {
        gaps.semProduto++;
        suggestions.push({ field: 'equipment_interest', value: suggestEquipment(client), risco: 'baixo', type: 'produto_recomendado' });
      }

      for (const item of suggestions) {
        if (created >= limit) break;
        const key = `${client.id}|${item.field}|${item.value}`;
        if (openKeys.has(key)) continue;
        await sr.entities.CRMUpdateQueue.create({
          origem: 'sistema',
          texto_original: `Saneamento de conversão seguro para ${clientName(client)}`,
          comando_interpretado: `Sugerir ${item.field}: ${item.value}`,
          cliente_id: client.id,
          tipo_atualizacao: item.type,
          campo_alvo: item.field,
          valor_novo: item.value,
          status: 'pendente',
          risco: item.risco,
          exige_aprovacao: true,
          agente_origem: 'Botão Verde NR22888',
          modelo_ia_usado: 'regra_segura_sem_ia',
          data_criacao: new Date().toISOString(),
          observacao: 'Criado automaticamente para aprovação humana. Nenhum dado do cliente foi alterado.'
        });
        openKeys.add(key);
        created++;
        if (samples.length < 5) samples.push({ cliente: clientName(client), campo: item.field, sugestao: item.value });
      }
    }

    await sr.entities.AuditLog.create({
      module: 'saneamento_conversao',
      action: 'preparar_fila_aprovacao',
      user_email: actorEmail,
      user_message: `Botão Verde criou ${created} sugestões seguras para aprovação.`,
      details: JSON.stringify({ created, gaps, samples }),
      success: true,
      source: 'manual_safe'
    }).catch(() => null);

    return Response.json({ success: true, created, gaps, samples, message: `${created} sugestões foram enviadas para aprovação. Nenhum cliente foi alterado.` });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});
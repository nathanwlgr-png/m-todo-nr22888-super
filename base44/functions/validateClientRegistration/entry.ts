import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Não autorizado' }, { status: 401 });

    const { client_id } = await req.json().catch(() => ({}));
    if (!client_id) return Response.json({ error: 'client_id obrigatório' }, { status: 400 });

    const sr = base44.asServiceRole;
    const client = await sr.entities.Client.get(client_id);
    if (!client) return Response.json({ error: 'Cliente não encontrado' }, { status: 404 });

    const code = String(client.external_code || '').trim();
    const company = String(client.clinic_name || client.razao_social || '').trim();
    const issues = [];
    if (!/^[A-Za-z0-9][A-Za-z0-9._/-]{2,39}$/.test(code)) issues.push('código externo ausente ou fora do padrão');
    if (company.length < 3) issues.push('nome da empresa/clínica ausente');

    if (!issues.length) return Response.json({ success: true, valid: true, queued: false });

    const existing = await sr.entities.CRMUpdateQueue.filter({
      cliente_id: client.id,
      tipo_atualizacao: 'validacao_cadastro',
      status: 'pendente'
    });
    if (existing.length) return Response.json({ success: true, valid: false, queued: false, issues });

    const queue = await sr.entities.CRMUpdateQueue.create({
      origem: 'sistema',
      texto_original: `${code || 'SEM CÓDIGO'} | ${company || client.first_name || 'SEM EMPRESA'}`,
      comando_interpretado: 'validar_cadastro_cliente',
      cliente_id: client.id,
      tipo_atualizacao: 'validacao_cadastro',
      campo_alvo: 'external_code,clinic_name',
      valor_novo: JSON.stringify({ issues, external_code: code, company_name: company }),
      status: 'pendente',
      risco: 'medio',
      exige_aprovacao: true,
      agente_origem: 'trava_cadastro_nr22888',
      modelo_ia_usado: 'regra_deterministica_sem_ia',
      data_criacao: new Date().toISOString(),
      observacao: 'Revisar código externo antes do nome/identificação do cliente.'
    });

    return Response.json({ success: true, valid: false, queued: true, queue_id: queue.id, issues });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
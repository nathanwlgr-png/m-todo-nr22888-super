import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      type = 'instagram',
      contentType = 'post',
      theme = 'diagnostico_rapido',
      product = 'SMT-120VP',
      angle = 'roi',
      campaign = 'check_up',
      withEquipment = false,
      intensity = 3,
      week = '',
      platform = 'instagram'
    } = body;

    // Usar LLM para gerar conteúdo
    const prompt = buildPrompt({
      type,
      contentType,
      theme,
      product,
      angle,
      campaign,
      withEquipment,
      intensity,
      week,
      platform,
      userEmail: user.email
    });

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          content: { type: 'string' },
          hashtags: { type: 'string' },
          cta: { type: 'string' },
          design_prompt: { type: 'string' },
          alerts: {
            type: 'array',
            items: { type: 'string' }
          }
        }
      }
    });

    // Auditoria
    await base44.asServiceRole.entities.AuditLog?.create({
      action: 'ia_analysis',
      module: 'Marketing AI Studio',
      user_email: user.email,
      duration_ms: 2000,
      cost_credits: 1,
      success: true
    }).catch(() => {});

    return Response.json({
      ...result,
      alerts: result.alerts || []
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function buildPrompt({
  type,
  contentType,
  theme,
  product,
  angle,
  campaign,
  withEquipment,
  intensity,
  week,
  platform,
  userEmail
}) {
  const intensityDescriptions = {
    1: 'Técnico e factual. Apenas dados confirmados. Sem emoção exagerada.',
    2: 'Consultivo. Foco em dor do cliente e oportunidade.',
    3: 'Equilibrado. Técnico + comercial balanceado.',
    4: 'Persuasivo. Urgência, competitividade, ação.',
    5: 'Agressivo. AGORA, escassez, perdendo ouro.'
  };

  const basePrompt = `
Você é especialista em marketing veterinário. Gere conteúdo para Instagram.

REGRAS OBRIGATÓRIAS:
1. Nunca inventar dados, números ou promessas falsas
2. Se não souber resultado, dizer "pode chegar a"
3. Separar claramente: FATO vs OPINIÃO vs HIPÓTESE
4. Incluir alertas se houver risco de interpretação falsa
5. Tone: ${intensityDescriptions[intensity]}

CONTEXTO:
- Plataforma: ${platform}
- Tipo de conteúdo: ${contentType}
- Foco: ${theme}
${product ? `- Equipamento: ${product}` : ''}
${angle ? `- Ângulo: ${angle}` : ''}
${week ? `- Semana: ${week}` : ''}

RESPOSTA DEVE TER:
1. "title": Título/primeira linha impactante
2. "content": Corpo do texto (pronto para copiar)
3. "hashtags": Tags separadas por espaço (20-30)
4. "cta": Call-to-action único, direto
5. "design_prompt": Prompt para Canva/IA gerar imagem
6. "alerts": Array de avisos importantes

Gere AGORA:
`;

  if (type === 'instagram') {
    return basePrompt + `
Tipo: Post Instagram ${contentType === 'post' ? 'feed' : contentType}
Tema: ${getThemeDescription(theme)}

ESTRUTURA:
- Hook (primeira linha): Pergunta ou afirmação impactante
- Corpo: 3-5 pontos educativos ou emocionais
- CTA: Clique em "Saiba Mais", "DM", "Marcar consulta"
- Hashtags: Mix educação + vendas + regional
`;
  }

  if (type === 'seamaty_campaign') {
    return basePrompt + `
Produto Seamaty: ${product}
Ângulo: ${getAngleDescription(angle)}

ESTRUTURA:
- Hook: Problema/dor do cliente
- Solução: Como equipamento resolve
- Benefício: ROI, velocidade, retenção
- Prova: Se houver (validar dados)
- CTA: WhatsApp, ligação, visita

CRÍTICO: Nunca diga "economiza R$X" sem confirmar volume do CLIENTE.
`;
  }

  if (type === 'vet_campaign') {
    return basePrompt + `
Campanha veterinária: ${campaign}
${withEquipment ? 'Incluir subtilmente como equipamento helps' : 'Apenas conteúdo educativo'}

ESTRUTURA:
- Educação: Por que é importante
- Gatilho: Emocional (segurança, prevenção, velocidade)
- Chamada: Marcar exame agora
- Hashtags: Educação + bem-estar animal

EXEMPLO GATILHO MENTAL:
- Segurança: "Seu animal está protegido?"
- Prevenção: "Não espere sintomas aparecer"
- Velocidade: "Resultado em 5 minutos"
- Pertencimento: "Clínicas que cuidam"
`;
  }

  return basePrompt;
}

function getThemeDescription(theme) {
  const themes = {
    diagnostico_rapido: 'Foco: Velocidade diagnóstico. Gatilho: Urgência, resultado rápido.',
    check_up: 'Foco: Prevenção. Gatilho: Segurança, bem-estar.',
    emergencia: 'Foco: Paciente crítico. Gatilho: Urgência, vida em risco.',
    recorrencia: 'Foco: Trazer cliente de volta. Gatilho: Confiança, facilidade.',
    autoridade: 'Foco: Credibilidade. Gatilho: Especialização, prova social.',
    usuario: 'Foco: Case real. Gatilho: Prova social, identificação.'
  };
  return themes[theme] || themes.diagnostico_rapido;
}

function getAngleDescription(angle) {
  const angles = {
    roi: 'Retorno financeiro. Quanto economiza e em quanto tempo investe.',
    velocidade: 'Diagnóstico em 5 min vs 2 dias. Diferencial competitivo.',
    retencao: 'Cliente não sai mais para exame fora. Recorrência aumenta.',
    qualidade: 'Precisão máxima. Confiabilidade. Especialização.',
    diferenciais: 'Vantagem sobre concorrentes. O que você oferece que outros não.',
    atualizacao: 'Modernizar lab. Equipamento atual vs novo Seamaty.'
  };
  return angles[angle] || angles.roi;
}
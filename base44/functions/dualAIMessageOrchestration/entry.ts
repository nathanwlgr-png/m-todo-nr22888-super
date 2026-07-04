import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      client_id, 
      clinic_intelligence,
      numerology_profile,
      current_message_context
    } = await req.json();

    if (!client_id) {
      return Response.json({ error: 'client_id obrigatório' }, { status: 400 });
    }

    // Buscar cliente completo
    const client = await base44.asServiceRole.entities.Client.get(client_id).catch(() => null);

    if (!client) {
      return Response.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    // IA 1: Abordagem Técnica (especialista em vendas consultivas)
    const technicalApproach = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Você é IA especialista em VENDAS CONSULTIVAS para equipamentos laboratoriais.

CLIENTE: ${client.first_name} | NUMEROLOGIA: ${numerology_profile?.number} (${numerology_profile?.profile})
EMPRESA: ${client.clinic_name} | VOLUME: ${clinic_intelligence?.estimated_exams_per_month || 'desconhecido'} exames/mês
ESPECIALIDADES: ${clinic_intelligence?.specialties?.join(', ') || 'não identificadas'}
EQUIPAMENTOS ATUAIS: ${clinic_intelligence?.current_equipment?.join(', ') || 'não identificados'}

CONTEXTO ATUAL: ${current_message_context}

GERE:
1. UMA PERGUNTA SPIN de investigação (não venda, questione)
2. UM GATILHO MENTAL ético e relevante
3. TRÊS PONTOS de conexão com a clínica baseado em inteligência coletada
4. TOM: Consultivo, técnico, especialista

Foco em entender problema antes de vender.`,
      add_context_from_internet: false
    });

    // IA 2: Abordagem Humanizada (empatia e relacionamento)
    const humanApproach = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Você é IA especialista em RELACIONAMENTO e EMPATIA em vendas.

CLIENTE: ${client.first_name} | COMUNICAÇÃO: ${clinic_intelligence?.communication_style || 'desconhecida'}
SENTIMENTO DO CLIENTE: ${client.status}

CONTEXTO ATUAL: ${current_message_context}

GERE:
1. UMA FRASE de conexão pessoal (referenciando a clínica)
2. UMA HISTÓRIA CURTA relevante (máx 2 linhas)
3. COMO SE APRESENTAR de forma autêntica e memorável
4. TOM: Quente, genuíno, humanizado

Não seja artificial. Fale como uma pessoa real.`,
      add_context_from_internet: false
    });

    // Orquestrar as duas
    const finalMessage = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Você é o MAESTRO que unifica duas abordagens de IA em uma mensagem perfeita.

ABORDAGEM TÉCNICA:
${technicalApproach}

ABORDAGEM HUMANIZADA:
${humanApproach}

CRIE uma mensagem WhatsApp que:
1. Use elementos de AMBAS as abordagens
2. Mantenha tom natural e autêntico
3. Se apresente como: "Nathan - Consultor Técnico da SEAMATY Brasil"
4. Seja concisa (máx 4 linhas)
5. Termine com CTA claro (pergunta ou proposta)

A mensagem deve soar como uma PESSOA REAL falando, não como IA.

NUMEROLOGIA DO CLIENTE: ${numerology_profile?.number}
Use os gatilhos mais efetivos para este número.`,
      add_context_from_internet: false
    });

    return Response.json({
      success: true,
      technical_approach: technicalApproach,
      human_approach: humanApproach,
      final_message: finalMessage,
      metadata: {
        client_name: client.first_name,
        presentation: "Nathan - Consultor Técnico da SEAMATY Brasil",
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Erro:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});
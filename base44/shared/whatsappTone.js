export function whatsappToneGuidelines(profile = {}) {
  const stage = profile.pipeline_stage || profile.stage || profile.status || 'lead';
  const score = Number(profile.purchase_score || profile.predictive_score || 0);
  const pressure = ['proposta', 'negociacao'].includes(stage) && score >= 70 ? 'firme' : ['qualificado', 'proposta', 'negociacao'].includes(stage) ? 'consultiva' : 'leve';
  const numerology = profile.life_path_number || profile.numerology_number || 'não disponível';
  const style = profile.recommended_communication || profile.decision_style || profile.client_tone || profile.behavioral_profile || 'não mapeado';
  return `PADRÃO NR22888 PARA WHATSAPP:\n- Linguagem técnica, clara e específica ao contexto veterinário; cite benefícios mensuráveis somente quando existirem nos dados.\n- Pressão comercial ${pressure}, coerente com estágio ${stage} e score ${score || 'não disponível'}: conduza para um único próximo passo, sem agressividade.\n- Perfil de comunicação: ${style}. Numerologia educativa disponível: ${numerology}. Use esses sinais apenas para calibrar ritmo, objetividade e forma de apresentar opções; nunca mencione numerologia como ciência, diagnóstico ou argumento de venda.\n- Nunca invente escassez, prazo, promoção, resultado técnico, economia ou condição. Não use medo, culpa ou manipulação.\n- Evite mensagem genérica e excesso de emojis. Relacione produto, dor, impacto operacional e próximo passo.\n- A conversa não termina em uma cobrança de fechamento: avance por microcompromissos adequados ao momento.`;
}

export function buildTechnicalFollowUp(profile = {}, equipment, level = 'consultivo') {
  const name = profile.first_name || (profile.full_name || '').split(' ')[0] || 'Olá';
  const pain = profile.main_pains?.[0] || 'tempo de resposta, previsibilidade de custos e rotina analítica';
  const opening = level === 'firme' ? 'Retomando nossa avaliação técnica' : level === 'leve' ? 'Quero entender melhor seu cenário antes de avançarmos' : 'Revisei o cenário que conversamos';
  const next = level === 'firme' ? 'Podemos definir hoje o próximo passo técnico e comercial?' : level === 'leve' ? 'Qual desses pontos tem maior impacto na rotina atual?' : 'Faz sentido validarmos volume, rotina e condição comercial em uma conversa breve?';
  return `${name}, ${opening} sobre o *${equipment}*. Para recomendar a configuração correta, preciso confirmar como ${pain} afeta a clínica hoje. ${next}\n\nEquipe SEAMATY Brasil`;
}
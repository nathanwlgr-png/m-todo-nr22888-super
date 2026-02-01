// Respostas pré-programadas quando o limite de IA é atingido
export const localFallbacks = {
  presentation: (client) => `**GUIA DE APRESENTAÇÃO - ${client?.first_name}**

**1. APRESENTAÇÃO PRESENCIAL**

Tom e Postura:
- Aperto de mão firme e profissional
- Postura aberta e confiante
- Tom de voz claro e pausado
- Contato visual direto

Frase de Abertura:
"Bom dia, ${client?.first_name}! Sou [seu nome] da Seamaty. Vim porque identifiquei que ${client?.clinic_name || 'sua clínica'} pode se beneficiar das nossas soluções de diagnóstico veterinário."

**2. PRIMEIRO CONTATO WHATSAPP**

"Olá ${client?.first_name}! 👋

Sou [nome] da Seamaty, especializada em equipamentos diagnósticos veterinários.

Gostaria de apresentar nossas soluções de análise laboratorial com 25 meses de garantia e bonificação em insumos.

Qual seria um bom horário para conversarmos?"

**3. DIFERENCIAÇÃO**
- ✅ 25 meses de garantia (dobro do mercado)
- ✅ Manutenção vitalícia inclusa
- ✅ Bonificação mensal em reagentes
- ✅ Certificação ISO 13485:2016`,

  insights: (client) => `**INSIGHTS PROFUNDOS - ${client?.first_name}**

**1. PERFIL PSICOLÓGICO**
Status ${client?.status} indica ${client?.status === 'quente' ? 'alto interesse' : client?.status === 'morno' ? 'interesse moderado' : 'baixo engajamento'}.
Score de ${client?.purchase_score}% sugere ${client?.purchase_score > 70 ? 'alta probabilidade de conversão' : 'necessita aquecimento'}.

**2. MOTIVADORES PRINCIPAIS**
- Qualidade e confiabilidade técnica
- ROI e redução de custos operacionais
- Suporte técnico especializado
- Tecnologia de ponta

**3. COMUNICAÇÃO IDEAL**
- Canal: ${client?.communication_preferences?.preferred_channel || 'WhatsApp/Email'}
- Frequência: Semanal
- Tom: Técnico-consultivo

**4. PRÓXIMOS PASSOS**
1. Agendar demonstração presencial
2. Enviar caso de sucesso similar
3. Preparar proposta personalizada`,

  prospecting: (client) => `**ESTRATÉGIA DE PROSPECÇÃO - ${client?.first_name}**

**Melhor Canal:** WhatsApp/Telefone
**Melhor Horário:** Manhã (9h-11h) ou final tarde (16h-18h)

**Estratégia de Entrada:** Consultiva

**Primeira Frase:**
"${client?.first_name}, notei que ${client?.clinic_name || 'sua clínica'} pode estar enfrentando desafios com análises laboratoriais. Posso compartilhar como ajudamos clínicas similares a reduzir custos e aumentar eficiência?"

**Sequência:**
1. Identificar dor principal
2. Demonstrar valor através de caso similar
3. Agendar visita técnica`,

  question: (client) => `**PERGUNTA SPIN - ${client?.first_name}**

**Tipo:** Situation → Problem

**Pergunta:**
"${client?.first_name}, como vocês realizam os exames de sangue atualmente? Enviam para laboratório terceirizado ou fazem internamente?"

**Por quê funciona:**
- Abre diagnóstico sem ser invasivo
- Identifica processo atual
- Permite mapear dores operacionais`,

  objection: (client) => `**CONTROLE DE OBJEÇÃO - ${client?.first_name}**

**Objeção Comum:** "O preço está alto"

**Técnica:** SPIN + Cialdini (Autoridade)

**Resposta:**
"Entendo, ${client?.first_name}. Posso fazer uma pergunta? Quanto vocês gastam mensalmente terceirizando exames? 

Nossos clientes reduziram 40% dos custos em 6 meses, além de ter resultados em minutos vs. dias. A garantia de 25 meses também elimina riscos.

Faz sentido avaliarmos o ROI juntos?"`,

  proposal: (client) => `**PROPOSTA COMERCIAL - ${client?.first_name}**

Prezado ${client?.first_name},

${client?.clinic_name || 'Sua clínica'} merece autonomia diagnóstica de excelência. 

**Nossa Solução:**
• Equipamentos POCT certificados ISO 13485
• 25 meses de garantia + manutenção vitalícia
• Bonificação mensal em reagentes
• Resultados em minutos (não mais dias)

**Próximo Passo:**
Agendar demonstração técnica presencial para validar a solução ideal para seu volume de ${client?.current_volume || 'exames'}.

Aguardo seu retorno.`,

  closing: (client) => `**FECHAMENTO - ${client?.first_name}**

"${client?.first_name}, baseado no que conversamos, o [equipamento] resolve suas principais necessidades: resultados rápidos, redução de custos e confiabilidade.

Podemos formalizar a proposta ainda esta semana?"`,

  followup: (client) => `**FOLLOW-UP - ${client?.first_name}**

"Olá ${client?.first_name}! 

Retomando nossa conversa sobre a solução de diagnóstico laboratorial.

Preparei informações adicionais sobre o ROI e bonificação em insumos.

Quando podemos nos falar? Posso ligar amanhã pela manhã?"`,

  needs: (client) => `**PREVISÃO DE NECESSIDADES - ${client?.first_name}**

**Análise Preditiva:**

Baseado no perfil de ${client?.client_type}:

**1. Necessidade Imediata:**
- Equipamento para exames de rotina (hemograma/bioquímico)

**2. Necessidades Futuras (3-6 meses):**
- Expansão para gasometria
- Aumento volume testes

**3. Oportunidades Cross-sell:**
- Reagentes mensais
- Manutenção preventiva
- Treinamento equipe

**Timing:** Abordar em 30 dias após primeira venda`,

  suggestTasks: (client) => `**SUGESTÕES DE TAREFAS - ${client?.first_name}**

**1. Follow-up WhatsApp**
Prioridade: Alta
Prazo: 2 dias
Descrição: Enviar mensagem de follow-up referenciando última conversa e compartilhar caso de sucesso

**2. Preparar Proposta Comercial**
Prioridade: Alta
Prazo: 3 dias
Descrição: Montar proposta personalizada com ROI calculado e condições de bonificação

**3. Agendar Demonstração**
Prioridade: Média
Prazo: 5 dias
Descrição: Propor visita técnica presencial com demonstração do equipamento

**4. Enviar Material Técnico**
Prioridade: Média
Prazo: 1 dia
Descrição: Compartilhar catálogo e especificações técnicas por email`
};

export const getFallbackResponse = (type, client) => {
  const fn = localFallbacks[type];
  return fn ? fn(client) : 'Conteúdo não disponível no momento. Tente novamente mais tarde.';
};

// Fallback genérico para qualquer prompt
export const getGenericFallback = (context = '') => {
  return `⚠️ **MODO OFFLINE - RESPOSTA LOCAL**

O limite mensal de IA foi atingido. Esta é uma resposta genérica baseada em templates locais.

**Contexto:** ${context}

**Ações Disponíveis:**
1. Use os botões rápidos com templates pré-programados
2. Consulte o cache de respostas anteriores
3. Aguarde reset mensal do limite

**Recursos Offline:**
- Templates de apresentação
- Guias de objeções
- Scripts de follow-up
- Playbooks estáticos

Entre em contato com suporte para upgrade do plano.`;
};
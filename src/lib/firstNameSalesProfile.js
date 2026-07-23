const letterValues = {
  a: 1, j: 1, s: 1, b: 2, k: 2, t: 2, c: 3, l: 3, u: 3,
  d: 4, m: 4, v: 4, e: 5, n: 5, w: 5, f: 6, o: 6, x: 6,
  g: 7, p: 7, y: 7, h: 8, q: 8, z: 8, i: 9, r: 9,
};

const profiles = {
  1: { title: 'Líder Decidido', description: 'Independente, pioneiro e orientado à autonomia.', decision: 'Decide rápido quando percebe vantagem clara e diferenciação.', triggers: ['exclusividade regional', 'inovação', 'liderança'], communication: 'Seja direto, objetivo e apresente a solução como vantagem competitiva.' },
  2: { title: 'Parceiro Diplomático', description: 'Cooperativo, sensível e atento ao relacionamento.', decision: 'Avança quando sente confiança, segurança e parceria.', triggers: ['prova social', 'suporte próximo', 'confiança'], communication: 'Escute, evite pressão e destaque acompanhamento pós-venda.' },
  3: { title: 'Comunicador Criativo', description: 'Expressivo, otimista e receptivo a novidades.', decision: 'Engaja por entusiasmo, histórias e reconhecimento.', triggers: ['cases de sucesso', 'novidade', 'reconhecimento'], communication: 'Use exemplos visuais, histórias curtas e uma conversa dinâmica.' },
  4: { title: 'Gestor Metódico', description: 'Prático, organizado e orientado a processos seguros.', decision: 'Decide com dados, garantias e previsibilidade.', triggers: ['evidência técnica', 'garantia', 'redução de risco'], communication: 'Apresente especificações, validações, implantação e ROI documentado.' },
  5: { title: 'Explorador Versátil', description: 'Curioso, adaptável e aberto a novas possibilidades.', decision: 'Avança quando percebe liberdade, flexibilidade e oportunidade.', triggers: ['versatilidade', 'oportunidade real', 'flexibilidade'], communication: 'Mostre opções de uso e caminhos flexíveis sem limitar a escolha.' },
  6: { title: 'Cuidador Responsável', description: 'Protetor, comprometido e atento à qualidade da equipe.', decision: 'Decide pelo impacto positivo em pessoas, pacientes e rotina.', triggers: ['segurança', 'bem-estar da equipe', 'qualidade'], communication: 'Conecte benefícios à segurança clínica, ao cuidado e ao suporte.' },
  7: { title: 'Analista Especialista', description: 'Investigativo, criterioso e orientado a conhecimento profundo.', decision: 'Decide após análise técnica completa e sem pressão.', triggers: ['autoridade científica', 'comparativo técnico', 'demonstração'], communication: 'Entregue documentação, responda com precisão e respeite o tempo de análise.' },
  8: { title: 'Empreendedor de Resultados', description: 'Pragmático, ambicioso e focado em desempenho financeiro.', decision: 'Decide por retorno, eficiência e crescimento mensurável.', triggers: ['ROI', 'payback', 'aumento de margem'], communication: 'Quantifique economia, produtividade e ganho por exame.' },
  9: { title: 'Visionário de Propósito', description: 'Inspirador, idealista e orientado a impacto amplo.', decision: 'Decide quando a solução se conecta a propósito e futuro.', triggers: ['impacto clínico', 'propósito', 'visão de futuro'], communication: 'Mostre como a decisão eleva o padrão de cuidado e deixa impacto positivo.' },
  11: { title: 'Inspirador Intuitivo', description: 'Visionário, sensível e aberto a transformações relevantes.', decision: 'Decide por inspiração, inovação e impacto significativo.', triggers: ['transformação', 'inovação disruptiva', 'propósito'], communication: 'Apresente uma visão marcante, humana e conectada à evolução da clínica.' },
  22: { title: 'Construtor Estratégico', description: 'Converte grandes ideias em projetos sólidos e escaláveis.', decision: 'Decide com visão de longo prazo, estrutura e legado.', triggers: ['escala', 'legado', 'plano de longo prazo'], communication: 'Mostre implantação estruturada, escalabilidade e impacto duradouro.' },
};

const calculateProfileNumber = (firstName = '') => {
  const clean = firstName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z]/g, '');
  let total = [...clean].reduce((sum, letter) => sum + (letterValues[letter] || 0), 0);
  while (total > 9 && total !== 11 && total !== 22) total = [...String(total)].reduce((sum, digit) => sum + Number(digit), 0);
  return total || 1;
};

export function getFirstNameSalesProfile(firstName) {
  const number = calculateProfileNumber(firstName);
  const profile = profiles[number] || profiles[1];
  return { number, ...profile, approach: `Gatilhos comerciais: ${profile.triggers.join(', ')}. ${profile.communication}` };
}
/**
 * Cálculo Numerológico CORRETO com Números Mestres 11 e 22
 * Números Mestres NÃO são reduzidos!
 */

export const calculateNumerology = (fullName) => {
  if (!fullName) return null;

  const letterValues = {
    'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 6, 'G': 7, 'H': 8, 'I': 9,
    'J': 1, 'K': 2, 'L': 3, 'M': 4, 'N': 5, 'O': 6, 'P': 7, 'Q': 8, 'R': 9,
    'S': 1, 'T': 2, 'U': 3, 'V': 4, 'W': 5, 'X': 6, 'Y': 7, 'Z': 8
  };

  const cleanName = fullName.toUpperCase().replace(/[^A-Z]/g, '');
  let sum = 0;

  for (let char of cleanName) {
    sum += letterValues[char] || 0;
  }

  // IMPORTANTE: Verificar números mestres ANTES de reduzir
  if (sum === 11 || sum === 22) {
    return sum; // NÃO REDUZ
  }

  // Reduzir até chegar a um dígito ou número mestre
  while (sum > 9 && sum !== 11 && sum !== 22) {
    const digits = sum.toString().split('');
    sum = digits.reduce((acc, digit) => acc + parseInt(digit), 0);
    
    // Verificar se virou número mestre após redução
    if (sum === 11 || sum === 22) {
      return sum;
    }
  }

  return sum;
};

export const calculateLifePath = (birthdate) => {
  if (!birthdate) return null;

  const date = new Date(birthdate);
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  let sum = day + month + year;

  // Reduzir, preservando números mestres
  while (sum > 9 && sum !== 11 && sum !== 22) {
    const digits = sum.toString().split('');
    sum = digits.reduce((acc, digit) => acc + parseInt(digit), 0);
    
    if (sum === 11 || sum === 22) {
      return sum;
    }
  }

  return sum;
};

export const getNumerologyProfile = (number) => {
  const profiles = {
    1: {
      name: "O Líder",
      traits: "Independente, pioneiro, assertivo, competitivo",
      communication: "Direto ao ponto, valoriza eficiência",
      triggers: ["Exclusividade", "Ser o primeiro", "Liderança de mercado"],
      objections: ["Preço alto", "Tempo de entrega"],
      approach: "Mostre como o equipamento vai colocá-lo à frente da concorrência"
    },
    2: {
      name: "O Diplomata",
      traits: "Cooperativo, detalhista, precisa de consenso",
      communication: "Paciente, detalhada, parceria",
      triggers: ["Segurança", "Parcerias", "Apoio contínuo"],
      objections: ["Falta de suporte", "Risco"],
      approach: "Enfatize garantias, suporte técnico e parceria de longo prazo"
    },
    3: {
      name: "O Comunicador",
      traits: "Criativo, entusiasta, sociável, otimista",
      communication: "Entusiástica, visual, storytelling",
      triggers: ["Inovação", "Cases de sucesso", "Networking"],
      objections: ["Complexidade técnica"],
      approach: "Use histórias de sucesso e materiais visuais impactantes"
    },
    4: {
      name: "O Organizador",
      traits: "Metódico, prático, valoriza dados concretos",
      communication: "Estruturada, com números e fatos",
      triggers: ["ROI comprovado", "Dados técnicos", "Processos claros"],
      objections: ["Falta de dados", "Mudança de processo"],
      approach: "Apresente planilhas, ROI calculado e especificações técnicas detalhadas"
    },
    5: {
      name: "O Aventureiro",
      traits: "Flexível, busca novidades, adaptável",
      communication: "Dinâmica, foco em inovação",
      triggers: ["Tecnologia de ponta", "Liberdade", "Versatilidade"],
      objections: ["Limitações do equipamento"],
      approach: "Destaque as inovações tecnológicas e múltiplas aplicações"
    },
    6: {
      name: "O Conselheiro",
      traits: "Responsável, cauteloso, valoriza relacionamentos",
      communication: "Próxima, humanizada, long-term",
      triggers: ["Benefício para os pets", "Responsabilidade", "Qualidade"],
      objections: ["Impacto na equipe", "Treinamento"],
      approach: "Mostre como melhora o cuidado animal e inclui treinamento completo"
    },
    7: {
      name: "O Analista",
      traits: "Pesquisador, introspectivo, questiona tudo",
      communication: "Técnica, científica, baseada em evidências",
      triggers: ["Validação científica", "Estudos", "Precisão"],
      objections: ["Falta de evidências"],
      approach: "Forneça estudos, white papers e validações técnicas"
    },
    8: {
      name: "O Executivo",
      traits: "Pragmático, focado em resultados e lucro",
      communication: "ROI, números, bottom-line",
      triggers: ["Retorno financeiro", "Produtividade", "Escala"],
      objections: ["Custo-benefício"],
      approach: "Foco total em ROI, aumento de faturamento e payback rápido"
    },
    9: {
      name: "O Humanitário",
      traits: "Idealista, compassivo, visão ampla",
      communication: "Propósito, impacto, valores",
      triggers: ["Bem-estar animal", "Impacto social", "Legado"],
      objections: ["Alinhamento com valores"],
      approach: "Conecte com missão de salvar vidas e melhorar medicina veterinária"
    },
    11: {
      name: "O Iluminado (NÚMERO MESTRE)",
      traits: "Intuitivo, visionário, inspirador, alta sensibilidade",
      communication: "Inspiradora, visionária, espiritual",
      triggers: ["Inovação revolucionária", "Visão de futuro", "Transformação"],
      objections: ["Muito pragmático", "Falta de visão"],
      approach: "Apresente como uma revolução na medicina veterinária, visão de futuro da clínica. Use linguagem inspiradora e mostre o impacto transformador. Conecte com propósito maior."
    },
    22: {
      name: "O Mestre Construtor (NÚMERO MESTRE)",
      traits: "Visionário prático, construtor de impérios, ambição elevada com execução",
      communication: "Grande escala, visão estratégica, legado",
      triggers: ["Escalabilidade", "Construir algo maior", "Domínio de mercado", "Legado"],
      objections: ["Visão pequena", "Limitações"],
      approach: "Mostre como o equipamento é peça fundamental para EXPANDIR e DOMINAR o mercado regional. Fale de crescimento, múltiplas unidades, rede de clínicas. Use visão de longo prazo e construção de império veterinário."
    }
  };

  return profiles[number] || profiles[1];
};

export const getMasterNumberInsight = (number) => {
  if (number === 11) {
    return `🔮 NÚMERO MESTRE 11 - ALTÍSSIMO potencial espiritual e intuitivo. Cliente com visão diferenciada. 
    
ESTRATÉGIA DE VENDA:
✓ Use linguagem inspiradora e visionária
✓ Mostre o equipamento como TRANSFORMADOR
✓ Conecte com propósito maior (salvar vidas)
✓ Apresente inovações revolucionárias
✓ Evite abordagem muito técnica/fria
✓ Foque em impacto e diferenciação`;
  }

  if (number === 22) {
    return `⚡ NÚMERO MESTRE 22 - O CONSTRUTOR DE IMPÉRIOS. Cliente extremamente ambicioso com capacidade de execução.

ESTRATÉGIA DE VENDA:
✓ Apresente VISÃO DE CRESCIMENTO (não só uma máquina, mas EXPANSÃO)
✓ Fale de dominação de mercado regional
✓ Mostre ROI de longo prazo e escalabilidade
✓ Sugira plano de múltiplas unidades/franquias
✓ Use termos: "construir", "expandir", "legado", "império"
✓ Cliente pensa grande - sua proposta deve ser AMBICIOSA`;
  }

  return null;
};
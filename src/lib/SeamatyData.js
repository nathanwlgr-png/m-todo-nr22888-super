/**
 * SEAMATY BRASIL — Fonte Central de Dados Técnicos e Comerciais
 * NR22888 CRM — Nathan Rosa | Consultor Técnico Comercial
 *
 * NUNCA espalhar preços fixos em templates.
 * SEMPRE buscar desta fonte central.
 */

// ─── TABELA OFICIAL DE PREÇOS ───────────────────────────────────────────────
export const EQUIPAMENTOS = {
  'SMT-120VP': {
    nome: 'SMT-120VP',
    categoria: 'Bioquímica',
    preco_avista: 23500,
    preco_5x: 25000,
    descricao: 'Analisador bioquímico com rotores circulares',
    parametros: 'Até 24 parâmetros',
    volume: '100 µL',
    tempo: '12 minutos',
    amostra: 'Soro ou plasma',
    rotores: 'Circulares (não setorizados)',
    diferenciais: [
      'Bioquímica completa em campo',
      'Até 24 parâmetros por rotor',
      'Ideal para clínicas e ambulatório',
    ],
    erros_proibidos: [
      '36 parâmetros',
      'rotor setorizado',
      'SMT setorizado',
    ],
  },
  'QT3': {
    nome: 'QT3',
    categoria: 'Bioquímica',
    preco_avista: 31000,
    preco_5x: 32900,
    descricao: 'Analisador bioquímico com rotores circulares e setorizados',
    parametros: 'Bioquímica, eletrólitos, coagulação, inflamação',
    volume: '100 µL',
    tempo: '12–15 minutos',
    amostra: 'Soro, plasma, sangue total',
    rotores: 'Circulares e setorizados',
    diferenciais: [
      'Flexibilidade de painéis',
      'Eletrólitos e coagulação',
      'Ideal para hospitais veterinários',
    ],
    erros_proibidos: [
      '36 parâmetros',
    ],
  },
  'VG1': {
    nome: 'VG1',
    categoria: 'Hemogasometria',
    preco_avista: 28000,
    preco_5x: 29700,
    descricao: 'Hemogasômetro veterinário portátil',
    parametros: '17 parâmetros de hemogasometria e eletrólitos',
    volume: '100 µL',
    tempo: '4 minutos',
    amostra: 'Sangue total com heparina lítica',
    rotores: null,
    diferenciais: [
      'Hemogasometria em 4 minutos',
      '17 parâmetros incluindo eletrólitos',
      'Portátil, ideal para UTI e emergência',
    ],
    erros_proibidos: [],
  },
  'VG2': {
    nome: 'VG2',
    categoria: 'Hemogasometria + Imunofluorescência',
    preco_avista: 33000,
    preco_5x: 35000,
    descricao: 'Hemogasômetro + imunofluorescência em um único equipamento',
    parametros: '17 parâmetros hemogasometria + 11 parâmetros imunoensaio',
    volume: 'Varia por módulo',
    tempo: 'Hemogasometria: 4 min | Imunofluorescência: até 10 min conforme teste',
    amostra: 'Sangue total com heparina lítica (gases) / soro (imunoensaio)',
    rotores: null,
    diferenciais: [
      'Hemogasometria + imunofluorescência no mesmo aparelho',
      'Inflamação, cardíaco, renal, hormônios',
      'Diagnóstico completo point-of-care',
    ],
    erros_proibidos: [
      'tudo em 4 minutos',
      'imunofluorescência em 4 minutos',
      'VG2 tudo em 4 minutos',
    ],
  },
  '3DX': {
    nome: '3DX',
    categoria: 'Bioquímica + Imunofluorescência + Hemogasometria',
    preco_avista: 55000,
    preco_5x: 58000,
    descricao: '3 em 1: bioquímica, imunofluorescência e gases sanguíneos',
    parametros: 'Bioquímica (rotores circ/set) + 11 imunoensaio + 17 gases/eletrólitos',
    volume: 'Varia por módulo',
    tempo: 'Varia por módulo',
    amostra: 'Múltiplos tipos conforme módulo',
    rotores: 'Circulares e setorizados',
    diferenciais: [
      'Solução diagnóstica completa 3 em 1',
      'Reduz necessidade de múltiplos equipamentos',
      'Ideal para hospitais de alta complexidade',
    ],
    erros_proibidos: [
      'confundir com SMT',
    ],
  },
  'VBC50A': {
    nome: 'VBC50A',
    categoria: 'Hematologia',
    preco_avista: 70000,
    preco_5x: 74000,
    descricao: 'Analisador hematológico veterinário 5 partes',
    parametros: 'CBC 5 partes — diferencial leucocitário completo',
    volume: '20 µL',
    tempo: 'Rápido',
    amostra: 'Sangue total com EDTA',
    rotores: null,
    diferenciais: [
      'Diferencial 5 partes veterinário',
      'Volume mínimo de 20 µL',
      'Alta precisão diagnóstica',
    ],
    erros_proibidos: [],
  },
  'VI1': {
    nome: 'VI1',
    categoria: 'Imunofluorescência',
    preco_avista: 8500,
    preco_5x: 9000,
    descricao: 'Analisador de imunofluorescência veterinário',
    parametros: 'Inflamação, hormônios, cardíaco, renal',
    volume: null, // não mencionar volume em campanhas principais
    tempo: 'Geralmente até 10 minutos conforme teste',
    amostra: 'Soro ou plasma',
    rotores: null,
    diferenciais: [
      'Diagnóstico point-of-care de imunofluorescência',
      'Inflamação (PCRv, SAA), hormônios (T4, progesterona)',
      'Cardíaco, renal, pancreático',
      'Acesso à linha de testes Seamaty',
    ],
    erros_proibidos: [
      'volume de amostra em campanhas principais',
    ],
  },
  'VQ1': {
    nome: 'VQ1',
    categoria: 'PCR Molecular',
    preco_avista: 45000,
    preco_5x: 47700,
    descricao: 'PCR em tempo real veterinário',
    parametros: 'Painéis moleculares caninos e felinos',
    volume: null,
    tempo: 'Conforme painel',
    amostra: 'Swab, sangue (conforme painel)',
    rotores: null,
    diferenciais: [
      'PCR molecular veterinário in-house',
      'Cartucho fechado — fácil operação',
      'Diagnóstico molecular point-of-care',
    ],
    erros_proibidos: [],
  },
  'Maleta VG1': {
    nome: 'Maleta VG1',
    categoria: 'Acessório',
    preco_avista: 1500,
    preco_5x: 1600,
    descricao: 'Maleta para transporte do VG1',
    parametros: null,
    volume: null,
    tempo: null,
    amostra: null,
    rotores: null,
    diferenciais: [],
    erros_proibidos: [],
  },
};

// ─── FORMATAÇÃO DE PREÇO ─────────────────────────────────────────────────────
export const formatPreco = (valor) =>
  valor != null ? `R$ ${Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'Consultar';

export const getPrecoAvista = (modelo) => EQUIPAMENTOS[modelo]?.preco_avista;
export const getPreco5x = (modelo) => EQUIPAMENTOS[modelo]?.preco_5x;

export const getTextoPreco = (modelo) => {
  const eq = EQUIPAMENTOS[modelo];
  if (!eq) return 'Consulte valores com o consultor.';
  return `À vista: ${formatPreco(eq.preco_avista)} | 5x cartão: ${formatPreco(eq.preco_5x)}`;
};

// ─── ESTRUTURA DE INSUMOS ────────────────────────────────────────────────────
// Preços de insumos APENAS de tabela oficial cadastrada.
// Se não tiver valor confirmado → mostrar "Preço sob validação"
export const INSUMOS_PLACEHOLDER = {
  aviso: 'Preço sob validação. Confirmar com tabela oficial SEAMATY Brasil.',
};

export const formatPrecoInsumo = (preco) => {
  if (!preco || preco === 0) return 'Preço sob validação';
  return formatPreco(preco);
};

// ─── IDENTIDADE COMERCIAL ────────────────────────────────────────────────────
export const IDENTIDADE = {
  consultor: 'Nathan Rosa',
  cargo: 'Consultor Técnico Comercial',
  empresa: 'SEAMATY Brasil',
  assinatura: 'Nathan Rosa\nConsultor Técnico Comercial\nSEAMATY Brasil',
  assinatura_whatsapp: '\n\nNathan Rosa\nConsultor Técnico Comercial\nSEAMATY Brasil',
};

// ─── VALIDAÇÃO TÉCNICA ────────────────────────────────────────────────────────
const TERMOS_PROIBIDOS = [
  { termo: '36 parâmetros', motivo: 'SMT-120VP tem até 24 parâmetros' },
  { termo: 'SEAMATY Brasil', motivo: 'Empresa correta: SEAMATY Brasil' },
  { termo: 'Ricardo representante', motivo: 'Ricardo é destinatário interno, não vendedor' },
  { termo: 'SMT setorizado', motivo: 'SMT-120VP usa apenas rotores circulares' },
  { termo: 'VG2 tudo em 4 minutos', motivo: 'Imunofluorescência no VG2 pode levar até 10 minutos' },
  { termo: 'imunofluorescência em 4 minutos', motivo: 'Tempo varia conforme teste, geralmente até 10 minutos' },
  { termo: 'Sou o Ricardo', motivo: 'Consultor correto: Nathan Rosa' },
  { termo: 'Seamatti', motivo: 'Grafia correta: Seamaty' },
  { termo: 'Seatmat', motivo: 'Grafia correta: Seamaty' },
];

export const validarTextoTecnico = (texto) => {
  const erros = [];
  TERMOS_PROIBIDOS.forEach(({ termo, motivo }) => {
    if (texto && texto.toLowerCase().includes(termo.toLowerCase())) {
      erros.push({ termo, motivo });
    }
  });
  return erros; // [] = texto ok | [...] = há conflitos
};

// ─── TEMPLATES DE WHATSAPP ───────────────────────────────────────────────────
export const TEMPLATES_WHATSAPP = {
  abordagem_fria: (c) =>
    `Olá, ${c?.first_name || 'Dr(a)'}. Tudo bem? Sou o Nathan Rosa, Consultor Técnico Comercial da SEAMATY Brasil. Trabalho com tecnologia diagnóstica veterinária para trazer resultado rápido dentro da clínica, com mais segurança clínica e oportunidade de receita com exames internos. Posso te mostrar em 10 minutos como isso funciona na prática?${IDENTIDADE.assinatura_whatsapp}`,

  followup: (c) =>
    `Olá, ${c?.first_name || 'Dr(a)'}. Tudo bem? Sou o Nathan da SEAMATY Brasil. Passando para saber se conseguiu avaliar a proposta e se ficou alguma dúvida sobre o equipamento, ROI ou operação na rotina da clínica.${IDENTIDADE.assinatura_whatsapp}`,

  pos_visita: (c) =>
    `${c?.first_name || 'Dr(a)'}, obrigado pela atenção hoje. Pelo perfil da ${c?.clinic_name || 'clínica'}, vejo uma oportunidade real de melhorar tempo de resposta, reduzir terceirização e aumentar receita com exames internos. Posso te enviar o próximo passo?${IDENTIDADE.assinatura_whatsapp}`,

  proposta: (c) =>
    `${c?.first_name || 'Dr(a)'}, segue a proposta personalizada da SEAMATY Brasil. Montei pensando na rotina da ${c?.clinic_name || 'clínica'}, volume de exames e retorno financeiro. Posso te explicar o ROI em poucos minutos?${IDENTIDADE.assinatura_whatsapp}`,

  comodato: (c) =>
    `${c?.first_name || 'Dr(a)'}, pela rotina da ${c?.clinic_name || 'clínica'}, pode fazer sentido avaliar uma condição de comodato. A ideia é reduzir barreira de entrada e gerar recorrência com exames internos. Posso te explicar as condições?${IDENTIDADE.assinatura_whatsapp}`,

  treinamento: (c) =>
    `${c?.first_name || 'Dr(a)'}, passando para acompanhar o uso do equipamento Seamaty e garantir que a equipe esteja segura na operação. Quer que eu organize um treinamento rápido?${IDENTIDADE.assinatura_whatsapp}`,

  reativacao: (c) =>
    `${c?.first_name || 'Dr(a)'}, tudo bem? Faz um tempo que não nos falamos. A SEAMATY Brasil tem condições e soluções que podem encaixar bem na rotina da ${c?.clinic_name || 'clínica'}. Posso te atualizar rapidamente?${IDENTIDADE.assinatura_whatsapp}`,
};

// ─── SUGESTÃO DE UPGRADE ─────────────────────────────────────────────────────
// Dado o equipamento atual do cliente, retorna oportunidade de upgrade
export const sugerirUpgrade = (equipamentoAtual, equipamentosVendidos = []) => {
  const possuidos = [equipamentoAtual, ...equipamentosVendidos].filter(Boolean).map(e => e.toUpperCase());
  const sugestoes = [];

  if (!possuidos.includes('VG1') && !possuidos.includes('VG2')) {
    sugestoes.push({
      equipamento: 'VG1',
      motivo: 'Fechar o ciclo diagnóstico com hemogasometria em 4 minutos. 17 parâmetros, 100 µL.',
      urgencia: 'alta',
    });
  }
  if (!possuidos.includes('VI1') && !possuidos.includes('VG2') && !possuidos.includes('3DX')) {
    sugestoes.push({
      equipamento: 'VI1',
      motivo: 'Adicionar imunofluorescência (inflamação, hormônios, cardíaco, renal) sem necessidade de terceirização.',
      urgencia: 'media',
    });
  }
  if (!possuidos.includes('VBC50A')) {
    sugestoes.push({
      equipamento: 'VBC50A',
      motivo: 'Hematologia 5 partes com apenas 20 µL — completar diagnóstico de sangue in-house.',
      urgencia: 'media',
    });
  }
  if (!possuidos.includes('VQ1')) {
    sugestoes.push({
      equipamento: 'VQ1',
      motivo: 'PCR molecular veterinário in-house — diagnóstico definitivo com cartucho fechado.',
      urgencia: 'baixa',
    });
  }

  return sugestoes;
};

export default EQUIPAMENTOS;
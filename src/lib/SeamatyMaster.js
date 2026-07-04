/**
 * SeamatyMaster.js — Fonte central de identidade, preços e especificações técnicas
 * NR22888 | SEAMATY Brasil
 * NUNCA espalhar preços fixos em templates. Sempre importar daqui.
 */

// ── IDENTIDADE ────────────────────────────────────────────────────────────────
export const IDENTIDADE = {
  consultor: 'Nathan Rosa',
  cargo: 'Consultor Técnico Comercial',
  empresa: 'SEAMATY Brasil',
  assinatura: 'Nathan Rosa\nConsultor Técnico Comercial\nSEAMATY Brasil',
  destinatario_relatorio: 'Ricardo',
};

// ── PREÇOS OFICIAIS ───────────────────────────────────────────────────────────
export const PRECOS = {
  'SMT-120VP': { avista: 23500, cartao5x: 25000 },
  'QT3':       { avista: 31000, cartao5x: 32900 },
  'VG1':       { avista: 28000, cartao5x: 29700 },
  'VG2':       { avista: 33000, cartao5x: 35000 },
  '3DX':       { avista: 55000, cartao5x: 58000 },
  'VBC50A':    { avista: 70000, cartao5x: 74000 },
  'VI1':       { avista: 6500,  cartao5x: 7000  },
  'VQ1':       { avista: 45000, cartao5x: 47700 },
  'Maleta VG1':{ avista: 1500,  cartao5x: 1600  },
};

export const getPreco = (modelo) => PRECOS[modelo] || null;

export const formatPreco = (valor) =>
  valor ? valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'Preço sob validação';

// ── ESPECIFICAÇÕES TÉCNICAS ───────────────────────────────────────────────────
export const SPECS = {
  'VG1': {
    categoria: 'Hemogasometria',
    descricao: 'Hemogasometria + eletrólitos',
    parametros: '17 parâmetros',
    tempo: '4 minutos',
    volume: '100 µL',
    amostra: 'Sangue total com heparina lítica',
    rotores: 'Cartucho fechado',
    diferenciais: ['Resultado em 4 minutos', 'Hemogasometria Point-of-Care', 'Eletrólitos integrados'],
    alertas: [],
  },
  'VG2': {
    categoria: 'Hemogasometria + Imunofluorescência',
    descricao: 'Gases sanguíneos + eletrólitos + imunofluorescência',
    parametros: '17 parâmetros hemogas + 11 parâmetros imunoensaio',
    tempo: 'Hemogas: 4 min | Imunoensaio: até 10 min conforme teste',
    volume: '100 µL',
    amostra: 'Sangue total com heparina lítica',
    rotores: 'Cartucho fechado',
    diferenciais: [
      'Hemogasometria em 4 minutos',
      'Imunofluorescência veterinária integrada',
      'Inflamação, hormônios, cardíaco, renal',
    ],
    alertas: ['NÃO dizer: tudo sai em 4 minutos', 'Imunofluorescência: tempo variável conforme teste'],
  },
  'VI1': {
    categoria: 'Imunofluorescência',
    descricao: 'Imunofluorescência veterinária — inflamação, hormônios, cardíaco, renal',
    parametros: 'Conforme painel selecionado',
    tempo: 'Até 10 minutos conforme teste',
    volume: 'Não mencionar volume em campanhas principais',
    amostra: 'Soro ou sangue total conforme painel',
    rotores: 'Cartucho fechado',
    diferenciais: [
      'Inflamação (PCR, SAA)',
      'Hormônios (T4, cortisol)',
      'Cardíaco (troponina)',
      'Renal e metabólico',
    ],
    alertas: ['NÃO mencionar volume de amostra em campanhas principais'],
  },
  'SMT-120VP': {
    categoria: 'Bioquímica',
    descricao: 'Analisador bioquímico de rotor circular',
    parametros: 'Até 24 parâmetros',
    tempo: '12 minutos',
    volume: '100 µL',
    amostra: 'Soro ou plasma',
    rotores: 'Apenas rotores circulares',
    diferenciais: ['Bioquímica completa', 'Compacto e portátil', 'Rotor circular de alta precisão'],
    alertas: ['NÃO dizer: 36 parâmetros', 'NÃO dizer: rotor setorizado'],
  },
  'QT3': {
    categoria: 'Bioquímica',
    descricao: 'Analisador bioquímico com rotores circulares e setorizados',
    parametros: 'Variável conforme rotor',
    tempo: 'Conforme rotor',
    volume: 'Conforme rotor',
    amostra: 'Soro, plasma ou sangue total',
    rotores: 'Circulares e setorizados — eletrólitos, coagulação, inflamação',
    diferenciais: [
      'Flexibilidade de rotores',
      'Ideal para hospitais e rotinas complexas',
      'Eletrólitos, coagulação e inflamação',
    ],
    alertas: ['NÃO dizer: 36 parâmetros'],
  },
  '3DX': {
    categoria: 'Bioquímica + Imunofluorescência + Hemogasometria',
    descricao: '3 em 1: Bioquímica + Imunofluorescência + Gases sanguíneos/eletrólitos',
    parametros: 'Múltiplos conforme módulo',
    tempo: 'Conforme módulo utilizado',
    volume: 'Conforme módulo',
    amostra: 'Variável por módulo',
    rotores: 'Circulares e setorizados',
    diferenciais: [
      'Único equipamento 3 em 1',
      'Bioquímica + Imunoensaio + Hemogasometria',
      'Para hospitais de alta complexidade',
    ],
    alertas: ['NÃO confundir com SMT-120VP'],
  },
  'VBC50A': {
    categoria: 'Hematologia',
    descricao: 'Hematologia 5 partes diferencial',
    parametros: '5 partes (neutrófilos, eosinófilos, basófilos, linfócitos, monócitos)',
    tempo: 'Rápido — Point-of-Care',
    volume: '20 µL',
    amostra: 'Sangue total com EDTA',
    rotores: 'N/A',
    diferenciais: [
      'Hematologia 5 partes completa',
      'Volume mínimo de amostra (20 µL)',
      'Padrão comercial CRM',
    ],
    alertas: [],
  },
  'VQ1': {
    categoria: 'PCR Molecular',
    descricao: 'PCR em tempo real — diagnóstico molecular veterinário',
    parametros: 'Painéis caninos e felinos',
    tempo: 'Conforme painel',
    volume: 'Conforme painel',
    amostra: 'Swab, sangue ou tecido conforme painel',
    rotores: 'Cartucho fechado',
    diferenciais: [
      'PCR em tempo real veterinário',
      'Painéis caninos e felinos prontos',
      'Cartucho fechado — sem contaminação',
      'Diagnóstico molecular on-site',
    ],
    alertas: [],
  },
};

// ── OPORTUNIDADES DE UPGRADE ──────────────────────────────────────────────────
/**
 * Retorna sugestão de upgrade baseado no que o cliente possui.
 * @param {string|null} equipAtual — equipamento atual do cliente
 * @returns {object|null} sugestão
 */
export const getSugestaoUpgrade = (equipAtual) => {
  const mapa = {
    'SMT-120VP': {
      sugestao: 'QT3',
      motivo: 'Ampliar para rotores setorizados com eletrólitos e coagulação',
      ganho: 'Maior flexibilidade diagnóstica para rotinas hospitalares',
    },
    'VG1': {
      sugestao: 'VG2',
      motivo: 'Adicionar imunofluorescência veterinária ao hemogasômetro',
      ganho: 'Fechar o ciclo diagnóstico com inflamação, hormônios e cardíaco',
    },
    'VI1': {
      sugestao: 'VG2',
      motivo: 'Unificar imunofluorescência com hemogasometria em 1 equipamento',
      ganho: 'Reduzir custo e espaço com solução integrada',
    },
  };
  return equipAtual ? (mapa[equipAtual] || null) : null;
};

/**
 * Retorna equipamentos faltantes baseado no que a clínica possui.
 * @param {string|string[]} equipamentos — equipamento(s) atual(is)
 * @returns {string[]} sugestões de completar o ciclo
 */
export const getEquipamentosFaltantes = (equipamentos) => {
  const possuiArray = Array.isArray(equipamentos)
    ? equipamentos
    : (equipamentos ? [equipamentos] : []);

  const tem = (e) => possuiArray.some(p => p?.toLowerCase().includes(e.toLowerCase()));

  const sugestoes = [];
  if (!tem('VG') && !tem('hemogas')) {
    sugestoes.push({ equip: 'VG1', motivo: 'Fechar o ciclo diagnóstico com hemogasometria em 4 minutos.' });
  }
  if (!tem('VBC') && !tem('hematol')) {
    sugestoes.push({ equip: 'VBC50A', motivo: 'Hematologia 5 partes — diferencial completo.' });
  }
  if (!tem('VI1') && !tem('imuno') && !tem('VG2')) {
    sugestoes.push({ equip: 'VI1', motivo: 'Imunofluorescência para inflamação, hormônios e cardíaco.' });
  }
  if (!tem('SMT') && !tem('QT3') && !tem('bioquim')) {
    sugestoes.push({ equip: 'SMT-120VP', motivo: 'Bioquímica on-site — até 24 parâmetros em 12 min.' });
  }
  return sugestoes.slice(0, 2); // Máx 2 sugestões para não sobrecarregar o card
};

// ── VALIDAÇÃO TÉCNICA ─────────────────────────────────────────────────────────
const TERMOS_BLOQUEADOS = [
  { regex: /36\s*par[aâ]metros/gi, msg: '"36 parâmetros" — SMT-120VP tem até 24 parâmetros.' },
  { regex: /CMAT\s*Brasil/gi, msg: '"SEAMATY Brasil" — empresa correta é SEAMATY Brasil.' },
  { regex: /Ricardo\s*representante/gi, msg: '"Ricardo representante" — Ricardo é destinatário interno, não vendedor.' },
  { regex: /SMT.*setoriz/gi, msg: '"SMT setorizado" — SMT-120VP usa apenas rotores circulares.' },
  { regex: /VG2.*tudo.*4\s*min/gi, msg: '"VG2 tudo em 4 minutos" — apenas hemogasometria é em 4 min; imunofluorescência pode levar até 10 min.' },
  { regex: /Seamatti/gi, msg: '"Seamatti" — grafia correta é Seamaty.' },
  { regex: /Seatmat/gi, msg: '"Seatmat" — grafia correta é Seamaty.' },
];

/**
 * Valida um texto antes de enviar/exportar.
 * @param {string} texto
 * @returns {string[]} lista de erros encontrados (array vazio = ok)
 */
export const validarTexto = (texto) => {
  if (!texto) return [];
  return TERMOS_BLOQUEADOS
    .filter(({ regex }) => regex.test(texto))
    .map(({ msg }) => msg);
};

// ── SCRIPT SPIN BASE ──────────────────────────────────────────────────────────
export const gerarScriptSPIN = (client) => {
  const nome = client?.first_name || client?.full_name || 'Dr(a)';
  const clinica = client?.clinic_name || 'clínica';
  const equip = client?.equipment_interest || 'equipamento Seamaty';
  return {
    situacao: `"${nome}, como está o fluxo atual de exames laboratoriais na ${clinica}? A equipe consegue ter o resultado na hora da consulta?"`,
    problema: `"Quando vocês precisam de hemograma ou bioquímica de urgência, quanto tempo leva? Isso já gerou algum atraso em diagnóstico?"`,
    implicacao: `"Quando o resultado demora, vocês perdem oportunidade de fechar o diagnóstico na consulta, certo? Isso impacta faturamento e satisfação do tutor?"`,
    necessidade: `"Se vocês pudessem ter resultado em até 12 minutos dentro da clínica, isso mudaria a experiência do atendimento e a receita com exames internos?"`,
    fechamento: `"Então faz sentido eu te mostrar como o ${equip} funciona na prática para a rotina da ${clinica}?"`,
  };
};
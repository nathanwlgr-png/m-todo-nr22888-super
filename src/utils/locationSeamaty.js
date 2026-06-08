/**
 * Utilitários para cálculo de scores, cores e lógica de mapa Seamaty
 */

export const CORES = {
  // Cidades
  PRIORIDADE_MAXIMA: '#d32f2f',    // Vermelho
  CIDADE_QUENTE: '#ff6f00',         // Laranja
  CIDADE_MEDIA: '#1976d2',          // Azul
  MONITORAMENTO: '#9e9e9e',         // Cinza
  BAIXA_PRIORIDADE: '#bdbdbd',      // Cinza claro

  // Clientes
  CLIENTE_ATIVO_COM_EQ: '#388e3c',  // Verde
  CLIENTE_ATIVO_SEM_EQ: '#ff6f00',  // Laranja
  CLIENTE_INATIVO: '#9e9e9e',       // Cinza
  CLIENTE_ESTRATEGICO: '#fbc02d',   // Dourado

  // Oportunidades
  VENDA_ALTA: '#d32f2f',            // Vermelho
  COMODATO: '#7b1fa2',              // Roxo
  RECOMPRA: '#1976d2',              // Azul
  POS_VENDA: '#fbc02d',             // Amarelo
  SEM_COMPRA: '#424242',            // Cinza escuro

  // Equipamentos (para filtros/legenda)
  EQUIPAMENTO_SMT: '#ff6f00',       // Laranja
  EQUIPAMENTO_QT3: '#1976d2',       // Azul
  EQUIPAMENTO_VG1: '#d32f2f',       // Vermelho
  EQUIPAMENTO_VG2: '#7b1fa2',       // Roxo
  EQUIPAMENTO_VI1: '#388e3c',       // Verde
  EQUIPAMENTO_3DX: '#fbc02d',       // Dourado
  EQUIPAMENTO_VBC: '#9e9e9e',       // Cinza
  EQUIPAMENTO_VQ1: '#212121',       // Preto
};

/**
 * Calcula score da cidade baseado em critérios
 * @param {Object} dadosCidade — {total_clientes, total_oportunidades, total_comodato, total_recompra, total_influentes, eh_estrategica}
 * @returns {number} Score 0-100
 */
export function calcularScoreCidade(dadosCidade) {
  let score = 0;

  if (dadosCidade.total_clientes > 0) score += 25;
  if (dadosCidade.total_oportunidades > 0) score += 20;
  if (dadosCidade.total_comodato > 0) score += 20;
  if (dadosCidade.total_recompra > 0) score += 15;
  if (dadosCidade.total_influentes > 0) score += 10;
  if (dadosCidade.eh_estrategica) score += 10;

  return Math.min(score, 100);
}

/**
 * Classifica cidade por score
 */
export function classificarCidade(score) {
  if (score >= 80) return 'prioridade_maxima';
  if (score >= 60) return 'cidade_quente';
  if (score >= 40) return 'cidade_media';
  if (score >= 20) return 'monitorar';
  return 'baixa_prioridade';
}

/**
 * Retorna cor da cidade baseado na prioridade
 */
export function corCidade(prioridade) {
  const mapa = {
    prioridade_maxima: CORES.PRIORIDADE_MAXIMA,
    cidade_quente: CORES.CIDADE_QUENTE,
    cidade_media: CORES.CIDADE_MEDIA,
    monitorar: CORES.MONITORAMENTO,
    baixa_prioridade: CORES.BAIXA_PRIORIDADE,
  };
  return mapa[prioridade] || CORES.MONITORAMENTO;
}

/**
 * Calcula score de oportunidade do cliente
 * @param {Object} dados — {tem_equipamento, volume, compra_insumos, hospital_24h, cidade_estrategica, relacionamento_anterior, whatsapp_valido, sem_telefone, sem_endereco, dado_incompleto, nao_contatar}
 * @returns {number} Score 0-100
 */
export function calcularScoreCliente(dados) {
  let score = 0;

  // Pontos positivos
  if (!dados.tem_equipamento && dados.perfil_clinico) score += 25;
  if (dados.volume_compativel_comodato) score += 20;
  if (dados.compra_insumos) score += 15;
  if (dados.hospital_24h || dados.referencia_regional) score += 15;
  if (dados.cidade_estrategica) score += 10;
  if (dados.relacionamento_anterior) score += 10;
  if (dados.whatsapp_valido) score += 5;

  // Penalizações
  if (dados.sem_telefone) score -= 20;
  if (dados.sem_endereco) score -= 15;
  if (dados.dado_incompleto) score -= 20;
  if (dados.nao_contatar) score -= 30;

  return Math.max(0, Math.min(score, 100));
}

/**
 * Classifica cliente por score
 */
export function classificarCliente(score) {
  if (score >= 80) return 'a_quente';
  if (score >= 60) return 'b_morno';
  if (score >= 40) return 'c_frio';
  return 'd_baixa_prioridade';
}

/**
 * Retorna cor do pin baseado no tipo/prioridade
 */
export function corPin(tipo, prioridade, dias_sem_compra) {
  if (tipo === 'cliente') {
    if (dias_sem_compra > 120) return CORES.CLIENTE_INATIVO;
    if (prioridade === 'a_quente') return CORES.CLIENTE_ATIVO_COM_EQ;
    return CORES.CLIENTE_ATIVO_SEM_EQ;
  }
  if (tipo === 'lead') return CORES.CLIENTE_ATIVO_SEM_EQ;
  if (tipo === 'oportunidade_equipamento') return CORES.VENDA_ALTA;
  if (tipo === 'comodato') return CORES.COMODATO;
  if (tipo === 'recompra_insumo') return CORES.RECOMPRA;
  if (tipo === 'pós_venda') return CORES.POS_VENDA;
  if (tipo === 'inativo') return CORES.SEM_COMPRA;

  return '#9e9e9e';
}

/**
 * Gera URL Google Maps por endereço ou cidade
 */
export function gerarURLGoogleMaps(endereco, cidade, uf) {
  if (endereco && endereco.trim()) {
    const query = encodeURIComponent(`${endereco}, ${cidade}, ${uf}`);
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
  }
  if (cidade && uf) {
    const query = encodeURIComponent(`${cidade}, ${uf}, Brasil`);
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
  }
  return null;
}

/**
 * Gera URL WhatsApp
 */
export function gerarURLWhatsApp(telefone, mensagem) {
  if (!telefone) return null;
  const num = telefone.replace(/\D/g, '');
  const msg = encodeURIComponent(mensagem || 'Olá!');
  return `https://wa.me/${num}?text=${msg}`;
}

/**
 * Calcula rota otimizada por proximidade (versão simplificada)
 * Usa algoritmo do vizinho mais próximo (nearest neighbor)
 */
export function otimizarRota(pontos, startLatLng) {
  if (!pontos || pontos.length === 0) return [];
  
  const visited = new Set();
  const rota = [];
  let current = startLatLng;

  while (rota.length < pontos.length) {
    let nearest = null;
    let minDist = Infinity;
    let nearestIdx = -1;

    pontos.forEach((ponto, idx) => {
      if (visited.has(idx)) return;

      const dist = calcularDistancia(
        current.lat,
        current.lng,
        ponto.latitude,
        ponto.longitude
      );

      if (dist < minDist) {
        minDist = dist;
        nearest = ponto;
        nearestIdx = idx;
      }
    });

    if (nearest) {
      visited.add(nearestIdx);
      rota.push(nearest);
      current = { lat: nearest.latitude, lng: nearest.longitude };
    } else {
      break;
    }
  }

  return rota;
}

/**
 * Calcula distância entre dois pontos (fórmula de Haversine)
 */
function calcularDistancia(lat1, lon1, lat2, lon2) {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Valida coordenadas
 */
export function coordenadasValidas(lat, lng) {
  return typeof lat === 'number' && typeof lng === 'number' &&
         lat >= -90 && lat <= 90 &&
         lng >= -180 && lng <= 180;
}
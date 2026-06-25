// ModoVendedor — controle global do modo de visualização
// 'vendedor' = menu simplificado | 'admin' = tudo visível

export const MODO_KEY = 'nr22888_modo';

export const getModo = () => {
  try { return localStorage.getItem(MODO_KEY) || 'vendedor'; } catch { return 'vendedor'; }
};

export const setModo = (modo) => {
  try { localStorage.setItem(MODO_KEY, modo); } catch {}
};

// Páginas do MODO VENDEDOR — ordenadas pelo FLUXO COMERCIAL REAL de campo:
// 1º Dia (o que fazer agora) → Cliente → Investigação → SPIN/WhatsApp → Proposta/Fechamento → Apoio
export const VENDEDOR_PAGES = [
  // 1. COMEÇO DO DIA — para onde ir e quem atacar primeiro
  { page: 'Clients', label: '👥 Clientes', category: '1. Meu Dia' },
  { page: 'MapaSeamatyBrasil', label: '📍 Mapa de Clientes', category: '1. Meu Dia' },
  { page: 'SmartRouteOptimizer', label: '🗺️ Rota do Dia', category: '1. Meu Dia' },
  { page: 'VisitManager', label: '📍 Visitas', category: '1. Meu Dia' },
  { page: 'TasksUnified', label: '✅ Tarefas', category: '1. Meu Dia' },

  // 2. INVESTIGAR — antes de abordar
  { page: 'ModoInvestigativoSupremo', label: '🕵️ Investigar Cliente', category: '2. Investigar' },
  { page: 'ModoCacaComercial', label: '🎯 Modo Caça', category: '2. Investigar' },

  // 3. ABORDAR — SPIN + WhatsApp
  { page: 'GenerateWhatsAppIntegrated', label: '⚡ Gerar SPIN', category: '3. Abordar' },
  { page: 'WhatsAppHub', label: '💬 WhatsApp', category: '3. Abordar' },

  // 4. FECHAR — proposta e equipamento
  { page: 'ProposalGenerator', label: '📄 Proposta', category: '4. Fechar' },
  { page: 'EquipmentCatalog', label: '🔬 Catálogo Seamaty', category: '4. Fechar' },

  // 5. APOIO — usado eventualmente
  { page: 'CentralIAMaster', label: '🧠 Central IA', category: '5. Apoio' },
  { page: 'Leads', label: '🎯 Leads', category: '5. Apoio' },
  { page: 'OfflineMode', label: '📴 Offline', category: '5. Apoio' },
];

// Botões de ação rápida no modo vendedor — ordem do fluxo de campo
export const QUICK_ACTIONS = [
  { label: '+ Cliente', page: 'Clients', icon: '👥', color: '#4f8ef7' },
  { label: '+ Visita', page: 'VisitManager', icon: '📍', color: '#ff9500' },
  { label: 'Rota', page: 'SmartRouteOptimizer', icon: '🗺️', color: '#ff6b00' },
  { label: 'WhatsApp', page: 'WhatsAppHub', icon: '💬', color: '#25d366' },
  { label: 'Proposta', page: 'ProposalGenerator', icon: '📄', color: '#0ea5e9' },
  { label: '+ Tarefa', page: 'TasksUnified', icon: '✅', color: '#b44ef7' },
  { label: 'Briefing', page: 'CentralIAMaster', icon: '🧠', color: '#7c3aed' },
  { label: 'Ranking', page: 'RankingAndConsumables', icon: '🏆', color: '#f59e0b' },
];
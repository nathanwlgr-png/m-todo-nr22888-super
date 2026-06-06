// ModoVendedor — controle global do modo de visualização
// 'vendedor' = menu simplificado | 'admin' = tudo visível

export const MODO_KEY = 'nr22888_modo';

export const getModo = () => {
  try { return localStorage.getItem(MODO_KEY) || 'vendedor'; } catch { return 'vendedor'; }
};

export const setModo = (modo) => {
  try { localStorage.setItem(MODO_KEY, modo); } catch {}
};

// Páginas do MODO VENDEDOR — o que Nathan usa em campo
export const VENDEDOR_PAGES = [
  { page: 'ModoInvestigacaoSuprema', label: '🕵️ Investigar', category: 'IA' },
  { page: 'CentralIAMaster', label: '🧠 Central IA', category: 'IA' },
  { page: 'ModoCacaComercial', label: '🎯 Modo Caça', category: 'IA' },
  { page: 'Clients', label: '👥 Clientes', category: 'CRM' },
  { page: 'Leads', label: '🎯 Leads', category: 'CRM' },
  { page: 'TasksUnified', label: '✅ Tarefas', category: 'CRM' },
  { page: 'VisitManager', label: '📍 Visitas', category: 'CRM' },
  { page: 'GenerateWhatsAppIntegrated', label: '⚡ Gerar SPIN', category: 'Vendas' },
  { page: 'ProposalGenerator', label: '📄 Propostas', category: 'Vendas' },
  { page: 'EquipmentCatalog', label: '🔬 Catálogo', category: 'Vendas' },
  { page: 'WhatsAppHub', label: '💬 WhatsApp', category: 'Comunicação' },
  { page: 'SmartRouteOptimizer', label: '🗺️ Rota Smart', category: 'Campo' },
  { page: 'OfflineMode', label: '📴 Offline', category: 'Sistema' },
];

// Botões de ação rápida no modo vendedor
export const QUICK_ACTIONS = [
  { label: '+ Cliente', page: 'Clients', icon: '👥', color: '#4f8ef7' },
  { label: '+ Lead', page: 'Leads', icon: '🎯', color: '#00c853' },
  { label: '+ Visita', page: 'VisitManager', icon: '📍', color: '#ff9500' },
  { label: '+ Tarefa', page: 'TasksUnified', icon: '✅', color: '#b44ef7' },
  { label: 'WhatsApp', page: 'WhatsAppHub', icon: '💬', color: '#25d366' },
  { label: 'Rota', page: 'SmartRouteOptimizer', icon: '🗺️', color: '#ff6b00' },
  { label: 'Briefing', page: 'CentralIAMaster', icon: '🧠', color: '#7c3aed' },
  { label: 'Ranking', page: 'RankingAndConsumables', icon: '🏆', color: '#f59e0b' },
];
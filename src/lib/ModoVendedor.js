// ModoVendedor — controle global do modo de visualização
// 'vendedor' = menu simplificado | 'admin' = tudo visível

export const MODO_KEY = 'nr22888_modo';

export const getModo = () => {
  try { return localStorage.getItem(MODO_KEY) || 'vendedor'; } catch { return 'vendedor'; }
};

export const setModo = (modo) => {
  try { localStorage.setItem(MODO_KEY, modo); } catch {}
};

// Menu principal — ordem única, limpa e objetiva
export const VENDEDOR_PAGES = [
  { page: '', label: '🏠 Dashboard', category: 'Menu' },
  { page: 'Clients', label: '👥 Clientes', category: 'Menu' },
  { page: 'ClienteDetalhe360', label: '🧿 Cliente 360', category: 'Menu' },
  { page: 'PipelineView', label: '🔀 Pipeline', category: 'Menu' },
  { page: 'TasksUnified', label: '✅ Tarefas', category: 'Menu' },
  { page: 'WhatsAppHub', label: '💬 Mensagens', category: 'Menu' },
  { page: 'VisitManager', label: '📍 Visitas', category: 'Menu' },
  { page: 'MapaSeamatyBrasil', label: '🗺️ Mapa', category: 'Menu' },
  { page: 'ProposalGenerator', label: '📄 Propostas', category: 'Menu' },
  { page: 'SalesFunnel', label: '🏁 Vendas', category: 'Menu' },
  { page: 'AutoFollowUpDashboard', label: '🔁 Pós-venda', category: 'Menu' },
  { page: 'DuplicateManager', label: '🧹 Duplicados', category: 'Menu' },
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
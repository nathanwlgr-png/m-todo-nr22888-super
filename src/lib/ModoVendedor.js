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
  { page: '', label: '🏠 Hoje', category: 'Operação de Rua' },
  { page: 'Clients', label: '👥 Clientes', category: 'Operação de Rua' },
  { page: 'SeamatyHunter', label: '📡 Buscar clínicas por cidade', category: 'Operação de Rua' },
  { page: 'AracatubaClinics', label: '📍 Araçatuba', category: 'Operação de Rua' },
  { page: 'MessageApproval', label: '✅ Aprovar mensagens', category: 'Operação de Rua' },
  { page: 'WhatsAppHub', label: '💬 Mensagens', category: 'Operação de Rua' },
  { page: 'DayFieldView', label: '🗺️ Rota', category: 'Operação de Rua' },
  { page: 'ProposalGenerator', label: '📄 Propostas', category: 'Operação de Rua' },
  { page: 'AutoFollowUpDashboard', label: '🔁 Pós-venda', category: 'Operação de Rua' },
  { page: 'MapaSeamatyBrasil', label: '🗺️ Mapa', category: 'Mais' },
  { page: 'DuplicateManager', label: '🧹 Duplicados', category: 'Mais' },
  { page: 'NotificationSettings', label: '⚙️ Configurações', category: 'Mais' },
  { page: 'AutomationSettings', label: '⚡ Preparação automática', category: 'Mais' },
  { page: 'Reports', label: '📊 Central de Relatórios', category: 'Mais' },
  { page: 'CentralIAMaster', label: '🧠 Ferramentas avançadas', category: 'Mais' },
  { page: 'DashboardSniper', label: '🎯 Dashboard Sniper clássico', category: 'Mais' },
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
# Auditoria de Rotas e Páginas — NR22888

**Data:** 20/06/2026 · Fonte: leitura do `App.jsx` + capturas de preview.

## Evidência
- App.jsx lido integralmente: ~70 rotas explícitas + ~12 redirects legacy + fallback `*`.
- Todas as páginas usam **lazy loading** (correto, conforme prioridade 9).
- Imports verificados: todos resolvem para `./pages/*` existentes.

## Rotas principais testadas com preview real

| Rota | Página | Status | Erro | Prioridade comercial | Recomendação |
|------|--------|--------|------|----------------------|--------------|
| `/` | DashboardSniper | ✅ renderiza | — | máxima | manter como home |
| `/WhatsAppHub` | WhatsAppHub | ✅ renderiza | — | máxima | manter |
| `/ScoreElite` | ScoreElite | ✅ renderiza (scroll excessivo) | — | alta | unificar c/ Ranking |
| `/RouteOptimizer` | RouteOptimizer | ✅ renderiza (tema claro) | — | alta | corrigir tema |
| `/Clients` | Clients | ✅ renderiza | — | máxima | manter |
| `/RankingOportunidades` | RankingOportunidades | preview indisponível no momento | — | alta | unificar c/ ScoreElite |
| `/ClienteDetalhe360` | ClienteDetalhe360 | ✅ (auditado por código) | — | máxima | manter |

## Redirects legacy (consolidação já feita — correto)
`/PossibleSales`→`/` · `/AIAssistant`→`/CentralIAMaster` · `/ProposalTemplates`→`/ProposalGenerator` · `/Reports`→`/` · `/MasterCRM`→`/Clients` · `/WhatsAppMasterAssistant`→`/WhatsAppHub` etc. — **bom**, evita 404 e duplicação de rota.

## Observações
- Fallback `*` → `/SalesCommandCenter`. ⚠️ Considerar redirecionar para `/` (DashboardSniper) que é a home real de campo. **Pende aprovação.**
- Rota duplicada potencial: `/RouteOptimizer` e `/RouteOptimization` e `/SmartRouteOptimizer` coexistem → 3 telas de rota. Ver relatório de unificação.
- Nenhuma tela branca ou erro de import detectado nas rotas testadas.

## Prioridade de correção
1. Avaliar fallback `*` → `/`.
2. Unificar as 3 rotas de rota.
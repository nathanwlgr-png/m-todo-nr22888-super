# Auditoria de Unificação e Organização — NR22888

**Data:** 20/06/2026 · Nenhuma tela apagada. Apenas recomendação de organização.

## Duplicidades detectadas (com evidência)

| Conjunto | Evidência | Tela principal | Vira detalhe / recolhida | Pode remover (futuro, c/ aprovação) |
|----------|-----------|----------------|--------------------------|-------------------------------------|
| **ScoreElite × RankingOportunidades** | screenshot ScoreElite full-page = dezenas de cards iguais ao Ranking | **Ranking rápido (topo)** | ScoreElite = detalhe ao clicar | nenhuma agora |
| **RouteOptimizer × RouteOptimization × SmartRouteOptimizer** | 3 rotas no App.jsx | **Card "Rotas"** com 3 botões: Rota rápida / Otimizador / Mapa | as outras viram botões internos | nenhuma agora |
| **WhatsAppHub × Central SAFE** | ambos mostram "mensagens pendentes" | **WhatsAppHub** (ação completa) | Central SAFE = só resumo + link | nenhuma |
| **Clients × ClienteDetalhe360** | lista vs detalhe | **Clients** (lista) | C360 = detalhe (correto, não é duplicado) | manter ambos |
| **Propostas × ProposalGenerator** | redirect já feito | **ProposalGenerator** | — | já consolidado |
| **Tarefas × follow-ups** | follow-ups criam Task | **TasksUnified** | follow-up = tipo de task | manter |

## Ordem ideal do DashboardSniper (comparação com atual)

| Posição ideal | Bloco | Está no lugar? |
|---------------|-------|----------------|
| 1 | Sniper do Dia | ✅ topo (correto) |
| 2 | Ação urgente | 🔺 hoje aparece **depois** de Plano Elite/Central SAFE — deve **subir** |
| 3 | WhatsApp pendente | 🔺 está dentro da Central SAFE — pode subir como card próprio |
| 4 | Visitas / Rota do Dia | 🔻 hoje no meio-baixo — ok |
| 5 | Oportunidades quentes / Score | ✅ "Alta Prioridade" presente |
| 6 | Central SAFE compacta | 🔻 hoje ocupa bloco grande — **compactar** |
| 7 | Pendências 100% recolhida | ✅ recolhida (correto) |
| 8 | Relatórios/imagens recolhidos | ✅ no rodapé (correto) |
| 9 | Ferramentas/config no final | 🔺 botão "Limpar Base" já no fim (correto), mas atalhos espalhados — agrupar em "Ferramentas" |

## O que deve subir / descer / recolher
- **Subir:** Ação Urgente, WhatsApp pendente (acima de Plano Elite/Central SAFE).
- **Descer/compactar:** Central de Comandos (Central SAFE) — hoje é o maior bloco da tela.
- **Recolher:** já corretos (Pendências, Relatório de Clínicas, Imagem institucional).
- **Agrupar:** atalhos soltos (Prioridade Comercial, Prospecção, Mapa Clientes, Agenda Mensal, Relatório, Teste Agentes) num card "Ferramentas".

## Tudo isso PENDE APROVAÇÃO (reordenar é mudança estrutural do Dashboard).
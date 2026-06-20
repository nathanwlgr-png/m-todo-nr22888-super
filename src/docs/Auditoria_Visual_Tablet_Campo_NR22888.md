# Auditoria Visual Tablet/Campo — NR22888

**Data:** 20/06/2026 · Fonte: screenshots reais de preview (desktop + full-page).

## Telas avaliadas com screenshot real
DashboardSniper (full-page), WhatsAppHub, ScoreElite (full-page), RouteOptimizer, Clients.

## Checklist visual de campo

| Critério | DashboardSniper | WhatsAppHub | RouteOptimizer | Clients | ScoreElite |
|----------|-----------------|-------------|----------------|---------|------------|
| Botões grandes o suficiente | ✅ | ✅ | ✅ | ✅ | ⚠️ cards pequenos |
| Texto legível | ✅ | ✅ | ✅ | ✅ | ⚠️ denso |
| Botão sobreposto | ⚠️ laranja flutuante | ⚠️ laranja flutuante | ⚠️ laranja flutuante | ⚠️ laranja flutuante | ⚠️ |
| Rodapé cobre ação | ✅ menu inferior fixo ok | ✅ | ✅ | ✅ | ✅ |
| Excesso de cards | ⚠️ tela muito longa | ✅ | ✅ | ✅ | 🔴 scroll enorme |
| Cores competem | ✅ dark coeso | ✅ | 🔴 tema claro destoa | ✅ | ✅ |
| Scroll demais | ⚠️ | ✅ | ✅ | ✅ | 🔴 |
| Imagem grande competindo | ✅ recolhida no fim | ✅ | ✅ | ✅ | ✅ |
| Usável com pressa em campo | ✅ | ✅ | ✅ | ✅ | ⚠️ |

## Achados visuais principais
1. **Botão laranja flutuante (canto inferior direito)** aparece em TODAS as telas e sobrepõe conteúdo. ⚠️ **Atenção:** o componente `FloatingExportButton` é **indigo, no topo, e só aparece com documento** — NÃO é esse o botão laranja. O botão laranja inferior é **outro componente** (a identificar: FloatingButtonsGroup / FloatingHomeButton / CentralIAFab / FloatingCreditsButton). **Não alterei nada para não mexer no componente errado.** → Pende identificação + aprovação.
2. **RouteOptimizer em tema claro** enquanto o app é dark — quebra consistência. → Corrigir (aprovação).
3. **ScoreElite** com scroll gigantesco (dezenas de cards) — candidato nº1 a unificar com Ranking. → Aprovação.
4. **Dashboard muito longo** — reordenar/compactar Central SAFE ajuda (ver relatório de unificação).

## Correções simples aplicadas nesta auditoria
- Nenhuma alteração visual cega aplicada: o suspeito do botão laranja era um componente diferente do esperado. Registrei para identificação correta antes de qualquer mudança (regra: não quebrar funcionalidade).

## Correções que precisam aprovação
1. Identificar e recolher/mover o botão laranja flutuante inferior.
2. RouteOptimizer → tema dark.
3. ScoreElite → unificar com Ranking (reduz scroll).
4. Compactar Central de Comandos no Dashboard.

## Nota visual
Atual: **8.6** (mantida — não apliquei mudança visual cega para não mexer no componente errado).
# Auditoria Funcional Total — Botões NR22888

**Data:** 20/06/2026 · **Modo:** teste real (screenshots de preview + teste de backend functions) · **Nenhum dado alterado, nenhuma mensagem enviada.**

## Evidência usada
- **Screenshots reais de preview** capturados por mim: DashboardSniper (full-page), WhatsAppHub, ScoreElite (full-page), RouteOptimizer, Clients.
- **Testes reais de backend** (payload não-destrutivo): geocodeClientLocation, limpezaCompletaCRM (dry_run), sendWhatsAppMessage, processTelegramCommandSafe, generateOptimizedRoute, aplicarAtualizacaoCRMComSeguranca, calculateRankingDoDia.
- **Leitura de código**: ClienteDetalhe360, WhatsAppHub, PlanoEliteStatus, PendenciasPara100, ExportClinicReportWithROI.
- Registro estruturado na entidade **ButtonAuditItem** (18 itens).

> ⚠️ **Não houve gravação contínua de vídeo** — o ambiente só permite screenshots/preview estáticos. Auditoria feita por screenshots antes/depois + leitura de código + teste de função.

## Resumo de botões auditados
- **Telas testadas:** 5 com screenshot real + Cliente 360 por código = 6.
- **Botões/itens auditados:** 18 registrados em ButtonAuditItem.
- **Funcionando/OK:** 11
- **Confusos:** 4 (botão flutuante laranja, Link Trac., tema claro RouteOptimizer, duplicação ScoreElite)
- **Quebrados:** 3 (/resumo_dia Telegram, 500 cru CRM, ranking zerado)
- **Perigosos sem controle:** 0 (limpeza e geocode confirmados SAFE)

## Bugs encontrados (com evidência)
1. **calculateRankingDoDia retorna tudo zerado** (urgente:0, quente:0) enquanto o Sniper do Dia mostra leads quentes — desconexão de fonte de dados. **Gravidade alta.**
2. **/resumo_dia não reconhecido** no Telegram (retorna "Comando não reconhecido"; envio_automatico=false). **Gravidade média.**
3. **aplicarAtualizacaoCRMComSeguranca** devolve **500 cru** ("Object not found") em id inexistente em vez de 404 amigável. **Gravidade média.**
4. **Botão download laranja flutuante** sobreposto em todas as telas, cobrindo conteúdo. **Gravidade média.**

## Correções simples aplicadas (rodada anterior, confirmadas)
- ✅ Cliente 360: telefone limpo (`\D`) antes do wa.me — corrige link quebrado no campo.
- ✅ Cliente 360: "Enviar p/ Aprovação" → "Preparar p/ Aprovação"; "Aprovar" → "Aprovar texto".
- ✅ WhatsAppHub: fluxo "Aprovar texto antes de abrir o WhatsApp" confirmado em tela.

## Correções que precisam de aprovação
- Conectar `calculateRankingDoDia` à mesma fonte do Sniper (ou Ranking puxar do Sniper).
- Adicionar/renomear comando `/resumo_dia` no processTelegramCommandSafe.
- Envolver `aplicarAtualizacaoCRMComSeguranca` em try/catch → 404 amigável.
- Recolher/mover o botão flutuante de download.
- Unificar ScoreElite × RankingOportunidades.

## Prioridade de correção
1. (alta) Ranking zerado vs Sniper populado.
2. (média) Botão flutuante sobreposto.
3. (média) /resumo_dia Telegram.
4. (média) 500 cru CRM.
5. (baixa) Tema claro RouteOptimizer.
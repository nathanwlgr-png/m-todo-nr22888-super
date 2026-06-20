# Auditoria de Backend Functions — NR22888

**Data:** 20/06/2026 · Testes reais com payload **não-destrutivo**. Nenhuma alterou dados.

| Função | Payload | Retorno real | HTTP | Alterou dados? | Risco | Status |
|--------|---------|--------------|------|----------------|-------|--------|
| geocodeClientLocation | client_id inexistente | "Cliente não encontrado", queued=false | 404 | Não | — | ✅ SAFE |
| limpezaCompletaCRM | dry_run=true | "0 corrigidos, 2 grupos duplicados detectados. Nada foi alterado." | 200 | Não | — | ✅ SAFE |
| sendWhatsAppMessage | phone inválido | "Número de telefone inválido (mín. 12 dígitos)" | 422 | Não | — | ✅ SAFE |
| processTelegramCommandSafe | /resumo_dia | **"Comando não reconhecido"** (envio_automatico=false) | 200 | Log apenas | baixo | ⚠️ comando faltando |
| generateOptimizedRoute | {} vazio | "Nenhum cliente fornecido." | 422 | Não | — | ✅ SAFE |
| aplicarAtualizacaoCRMComSeguranca | queue_id inexistente | **500 "Object not found"** (erro cru) | 500 | Não | baixo | ⚠️ falta try/catch |
| calculateRankingDoDia | {} | summary **tudo zerado** (urgente:0, quente:0) | 200 | Não | — | ⚠️ dados desconectados |

## Achados
- **SAFE confirmado:** geocode não cria fila para cliente inexistente; limpeza dry_run não altera nada e só **detecta** duplicatas (não arquiva); WhatsApp rejeita telefone inválido. As travas de segurança funcionam.
- **Bug de dados:** `calculateRankingDoDia` zera tudo enquanto o Sniper do Dia (mesma tela inicial) mostra leads com score 90-100. Provável fonte de dados diferente (EliteLeadScore vazio vs Client populado).
- **Robustez:** `aplicarAtualizacaoCRMComSeguranca` precisa de guarda para id inexistente → 404 amigável em vez de 500.
- **Telegram:** `/resumo_dia` não está na lista reconhecida (`/cliente, /visita, /followup, /whatsapp, /quentes, /propostas_paradas, /inativos, /atualizar`).

## Precisa aprovação para corrigir
1. Conectar ranking à fonte real.
2. Adicionar `/resumo_dia`.
3. try/catch no aplicarAtualizacao.

## Não testado (proposital — destrutivo)
- sendApprovedMessages com envio real, removeDuplicates, autoFixSystem aplicado. Conforme regras, não executados.
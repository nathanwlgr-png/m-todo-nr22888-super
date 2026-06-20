# Snapshot Pré-Correção Total SAFE — NR22888

Data: 20/06/2026  
Objetivo: registrar o estado do sistema antes da Correção Total SAFE. Nenhum dado foi apagado. Este é apenas um registro lógico.

## Volume de dados (medição real)

| Entidade | Quantidade |
|---|---:|
| Client | 433 |
| Lead | 141 |
| Sale | 61 |
| Visit | 349 |
| Task | 338 |
| PendingMessage | 10 |
| CRMUpdateQueue | 7 |
| EliteLeadScore | 110 |
| ProductCatalog | 29 |
| SeamatyPriceTable | 120 |
| Equipment | 9 |
| SeamatyImage | 0 |
| GeoAuditReport | 2 |
| GeoAuditItem | 200 |
| EliteToolConnection | 36 |
| EliteActionLog | 55 |
| TelegramCommandLog | 18 |

## Qualidade de dados crítica

- Clientes com coordenada válida: **0 de 433**
- Clientes com endereço: 375
- Clientes com cidade: 423
- Visitas sem local: 46
- Duplicatas prováveis cliente (nome+cidade): 4 grupos
- Duplicatas prováveis lead (telefone): 4 grupos

## Automações ativas relevantes (antes da correção)

- Geocodificar Cliente Novo/Alterado (geocode direto) — RISCO ALTO
- limpezaCompletaCRM (a cada 3 dias, arquiva duplicatas) — RISCO ALTO
- autoFixSystem (pode deletar Alert) — RISCO MÉDIO
- followUpWhatsApp (cria PendingMessage) — aceitável
- clinicCompetitiveMonitor (cria alertas) — aceitável

## Agentes existentes

- nr22888_dia_dia — ativo, permissões amplas
- whatsapp_master_agent_NR22888 — ativo, permissões amplas
- telegram_operacional_nr22888 — SAFE
- vendas_supremo — legado neutralizado

## Funções críticas existentes

- geocodeClientLocation (atualizava Client direto)
- optimizeRoute / generateOptimizedRoute
- sendWhatsAppMessage (log como enviada)
- sendApprovedMessages (email automático)
- limpezaCompletaCRM (arquivava duplicatas)
- autoFixSystem (delete Alert)
- aplicarAtualizacaoCRMComSeguranca (SAFE existente)

## Principais riscos da auditoria

1. Geocodificação direta sem aprovação.
2. 0 coordenadas reais.
3. RouteOptimizer incompatível com optimizeRoute.
4. GPSClinicaRadar com distância aleatória.
5. WhatsApp marcado como enviado antes de confirmação manual.
6. E-mail automático em sendApprovedMessages.
7. Limpeza automática arquiva duplicatas.
8. autoFixSystem deleta Alert.
9. ProductCatalog sem fotos oficiais.
10. Permissões amplas de agentes.

## Regra desta fase

Toda alteração crítica → CRMUpdateQueue ou DuplicateReviewQueue.  
Toda mensagem externa → PendingMessage.  
Toda correção → EliteActionLog ou relatório.  
Nada destrutivo. Nenhuma coordenada aplicada. Nenhuma mensagem enviada.
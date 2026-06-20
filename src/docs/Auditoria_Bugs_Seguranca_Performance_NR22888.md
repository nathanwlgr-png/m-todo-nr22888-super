# Auditoria Bugs, Segurança e Performance — NR22888

Data: 20/06/2026

## Resumo executivo

Segurança: **66% — aceitável**  
Performance campo/tablet: **67% — aceitável**  
Bugs/estabilidade geral: **70% — aceitável**

O sistema está operacional, mas possui pontos de risco que impedem uma nova fase agressiva sem revisão: automações que alteram dados, funções com SDK antigo, queries sem paginação, WhatsApp registrado como enviado antes de confirmação, geocode direto e permissões amplas de agentes.

## Bugs e falhas encontrados

### Críticos

1. **RouteOptimizer incompatível com optimizeRoute**
   - Página envia `client_ids`, `start_address`, `visit_duration_minutes`.
   - Função espera `locations`, `startPoint`.
   - Risco: botão otimizar rota falhar.

2. **geocodeClientLocation altera Client direto**
   - Usa GOOGLE_MAPS_API_KEY quando disponível.
   - Se falhar, usa mock por cidade.
   - Atualiza latitude/longitude diretamente.
   - Risco: coordenada incorreta no cliente.

3. **Automação ativa de geocode**
   - “Geocodificar Cliente Novo/Alterado” está ativa.
   - Deve passar por CRMUpdateQueue antes de produção.

4. **limpezaCompletaCRM arquiva duplicatas automaticamente**
   - Não deleta, mas altera status, pipeline_stage e lost_reason.
   - Risco: arquivamento sem revisão individual.

5. **autoFixSystem pode deletar Alert duplicado**
   - Não apaga clientes, mas usa delete em Alert.
   - Em fase SAFE, deve ser revisado.

### Altos

6. **WhatsAppSendModal tem fallback direto**
   - Se a função falhar, abre wa.me diretamente.
   - Não passa por PendingMessage.

7. **WhatsAppHub registra WhatsAppMessage com status `sent` ao abrir WhatsApp**
   - Abrir WhatsApp não garante envio real.
   - Precisa separar `whatsapp_aberto` de `envio_confirmado_manual`.

8. **sendWhatsAppMessage registra AutomatedMessageLog como enviada**
   - A função gera link manual, mas log usa `sent_status: enviada`.
   - Deve virar `prepared/opened`, não `sent`.

9. **sendApprovedMessages envia e-mail automático**
   - WhatsApp fica manual, mas e-mail é enviado automaticamente.
   - Externo crítico deveria passar por aprovação explícita.

10. **Agentes com permissões amplas**
   - Alguns agentes podem criar/update Client, Lead, Sale, Visit.
   - Devem ter limites em campos críticos.

### Médios

11. `TasksUnified` carrega Task, Client e Lead sem limite.
12. `ProposalGenerator` carrega Client sem limite.
13. `Clients` tem importação com IA e pode criar clientes direto após extração.
14. `syncWeeklyReportToSheets` lista Client, Lead e Sale sem limite.
15. `clinicCompetitiveMonitor` usa internet/LLM em automação semanal.
16. `AIRouteOptimizer` chama LLM com internet e muitos clientes.
17. `MapaSeamatyBrasil` depende de entidades/pontos não garantidos.

## Segurança SAFE

### Confirmado como positivo

- PendingMessage existe.
- CRMUpdateQueue existe.
- TelegramCommandLog existe.
- EliteActionLog existe.
- CentralComandosSafe existe.
- WhatsApp API oficial não está configurada; o fluxo principal é manual.
- `aplicarAtualizacaoCRMComSeguranca` bloqueia campos críticos se não aprovados.
- `sendApprovedMessages` não marca WhatsApp como enviado automaticamente; prepara link.

### Ainda precisa ajuste

- Geocode deve passar por CRMUpdateQueue.
- WhatsApp aberto deve ser diferente de enviado confirmado.
- E-mail externo automático deve ser tratado como canal sensível.
- Venda rápida em Clients altera Sale e Client direto.
- Agentes precisam menor permissão em dados críticos.
- Auto-fix/limpeza devem ser protegidos por aprovação ou modo auditoria.

## Performance

### Pontos positivos

- App.jsx usa lazy loading em páginas secundárias.
- DashboardSniper lazy-load em widgets pesados.
- WhatsAppHub limita clientes a 150 e mensagens a 100.
- ScoreElite limita scores a 300.
- RankingOportunidades limita clientes/vendas/leads em algumas queries.
- PWA e offline existem.

### Pontos de atenção

| Local | Problema | Prioridade |
|---|---|---|
| TasksUnified | Task/Client/Lead sem limite | alta |
| ProposalGenerator | Client sem limite | alta |
| Clients | importação com IA e Client list grande | média |
| SalesFunnel | várias listas de 500 + charts | média |
| syncWeeklyReportToSheets | listas sem limite | média |
| optimizeDayRoute | 10.000 clientes via service role | alta |
| ClientLocationMap | pode renderizar 500 pins | média após geocode |
| AIRouteOptimizer | LLM com internet em massa | alta |

## Layout tablet/celular

### Positivo
- DashboardSniper é mobile-first e centralizado.
- WhatsAppHub é mobile-first.
- Cliente 360 é mobile-first.
- ScheduledAgenda é mobile-first.
- PWAInstallButtonFloating está discreto.

### Parcial
- Páginas antigas/administrativas ainda podem ser desktop-heavy.
- TasksUnified usa Kanban largo em mobile/tablet.
- ProposalGenerator pode ficar pesado em tablet.
- SalesFunnel tem gráficos que podem exigir scroll.

## Correção simples feita

Foi adicionada confirmação no botão `Limpar Base de Dados` antes de executar a função de limpeza. Isso reduz risco de clique acidental sem alterar a lógica interna.

## Itens que precisam aprovação antes de correção

1. Pausar automação de geocode.
2. Alterar geocode para CRMUpdateQueue.
3. Alterar logs de WhatsApp para `opened/prepared` em vez de `sent`.
4. Reduzir permissões dos agentes.
5. Revisar automações de limpeza/auto-fix.
6. Ajustar venda rápida para confirmação/EliteActionLog.
7. Padronizar e-mail externo com aprovação.
8. Corrigir RouteOptimizer.

## Próximos passos

1. Corrigir RouteOptimizer com payload compatível.
2. Proteger geocode por fila.
3. Separar status de WhatsApp aberto/enviado.
4. Paginar TasksUnified e ProposalGenerator.
5. Revisar permissões dos agentes.
6. Revisar automações agressivas.
7. Reexecutar auditoria de build/preview após correções.

## Decisão

O sistema pode continuar operando, mas **não deve entrar em fase agressiva** antes de blindar geocode, WhatsApp, automações e permissões.
# Auditoria Total Sistema NR22888 — Evidência Real

Data: 20/06/2026  
Modo: medir antes de corrigir  
Regra aplicada: nenhuma porcentagem abaixo foi estimada sem evidência. Cada nota tem motivo, evidência, falta para 100% e risco.

## Percentual geral do sistema

**Percentual geral: 68% → 80% → 87% após Fechamento Total SAFE (20/06/2026)**

> Ver docs/Correcao_Total_SAFE_NR22888.md para todas as correções aplicadas.

### Recalculo pós-fechamento (evidência real)
| Categoria | Antes | Depois | Motivo do ganho |
|---|---:|---:|---|
| GPS/Mapa/Rotas | 58% | 75% | RouteOptimizer corrigido e testado (3 cenários); geocode 100% SAFE; mapa paginado |
| Segurança | 69% | 92% | autoFix sem delete, limpeza em auditoria, radar sem envio fantasma, agentes blindados |
| Performance campo/tablet | 63% | 80% | queries com teto (500), geocode em lote (50), mapa só render com coordenada |
| Agentes | 75% | 88% | campos críticos protegidos via instrução + CRMUpdateQueue nas tools |
| WhatsAppHub | 70% | 88% | status manual confirmado, sem envio automático |
| Produtos/Catálogo | 65% | 70% | campos de validação adicionados; falta só foto oficial (manual) |

**Pendências para 100% são humanas/físicas**: foto oficial de 29 produtos, validação física de 423 coordenadas, habilitar Geocoding API no Google Cloud, teste em tablet/Android real, conexão Gmail/Drive/Docs/Instagram, teste do bot Telegram.

Fórmula usada: média simples das 11 categorias exigidas nesta auditoria.  
Categorias: Estrutura CRM, DashboardSniper, WhatsAppHub, Telegram SAFE, GPS/Mapa/Rotas, Produtos/Fotos/Catálogo, Ferramentas/Conectores, Agentes, Segurança, Performance campo/tablet, Preparação Material Premium.

> Observação obrigatória: GPS físico, PWA offline físico e uso real em Samsung Galaxy Tab/celular Android foram marcados como **NÃO VALIDADO EM DISPOSITIVO REAL**. Não foram considerados elite.

## Notas por categoria

| Categoria | Nota | Classificação | Evidência usada |
|---|---:|---|---|
| Estrutura CRM | 80% | bom | Entidades reais consultadas: 433 Client, 141 Lead, 61 Sale, 338 Task, 349 Visit, 10 PendingMessage, 7 CRMUpdateQueue, 55 EliteActionLog |
| DashboardSniper | 70% | aceitável | Arquivo lido; fluxo principal presente; lazy loading presente; preview anterior capturou apenas tela de carregamento |
| WhatsAppHub | 70% | aceitável | Arquivo lido; PendingMessage existe; wa.me manual; risco de status sent antes de confirmação manual |
| Telegram SAFE | 70% | aceitável | Agente `telegram_operacional_nr22888` lido; Central SAFE lida; 18 TelegramCommandLog; bot físico não validado |
| GPS/Mapa/Rotas | 58% | fraco | GeoAuditReport real: 58%; 433 clientes analisados; 0 coordenadas; 349 visitas; 46 sem local |
| Produtos/Fotos/Catálogo | 65% | aceitável | ProductCatalog criado/consultado: 29/29 produtos obrigatórios; 0/29 com foto oficial |
| Ferramentas/Conectores | 69% | aceitável | EliteToolConnection consultado: 36 ferramentas; 22 conectadas/nativas; 6 parciais |
| Agentes | 75% | aceitável | 4 agentes lidos: 2 ativos amplos, 1 SAFE, 1 legado neutralizado |
| Segurança | 69% | aceitável | PendingMessage, CRMUpdateQueue, logs e funções lidos/testados; riscos em limpeza, geocode, email e WhatsApp status |
| Performance campo/tablet | 63% | aceitável | Arquivos lidos mostram lazy loading, mas também várias queries sem limite e mapas/listas pesadas |
| Material Premium futuro | 55% | fraco | ProductCatalog preparado; checklist estratégico documentado; geração premium não implementada/testada |

## Evidências gerais de banco

- Client: 433
- Lead: 141
- Sale: 61
- Task: 338
- Visit: 349
- PendingMessage: 10
- CRMUpdateQueue: 7
- EliteLeadScore: 110
- ProductCatalog: 29
- SeamatyPriceTable: 120
- Equipment: 9
- SeamatyImage: 0
- GeoAuditReport: 2
- GeoAuditItem: 200

## Principais bugs/riscos críticos encontrados

1. **Geocodificação direta em cliente**  
   Evidência: `functions/geocodeClientLocation.js` atualiza `Client` diretamente com latitude/longitude. Há automação ativa “Geocodificar Cliente Novo/Alterado”.  
   Risco: coordenada errada pode ser aplicada sem aprovação.

2. **0 clientes com coordenada real**  
   Evidência: consulta real: 433 clientes, 0 com latitude/longitude.  
   Risco: pins, distância e rota real ficam fracos.

3. **RouteOptimizer incompatível com optimizeRoute**  
   Evidência: `pages/RouteOptimizer.jsx` envia `client_ids/start_address`; `functions/optimizeRoute.js` espera `locations/startPoint`. Teste com payload vazio retornou 400 “Sem localizações”.  
   Risco: rota clássica pode falhar em uso real.

4. **Botão “Limpar Base de Dados” sem confirmação forte**  
   Evidência: `components/BotaoLimpezaCRM.jsx` chama `limpezaCompletaCRM` direto.  
   Risco: alteração em massa por toque acidental no tablet.

5. **limpezaCompletaCRM altera/arquiva duplicatas**  
   Evidência: `functions/limpezaCompletaCRM.js` normaliza telefones, aplica defaults e marca duplicatas como perdido/frio. Automação ativa a cada 3 dias.  
   Risco: alteração de produção sem revisão caso o match esteja errado.

6. **WhatsAppHub registra “sent” antes de confirmação manual real**  
   Evidência: `pages/WhatsAppHub.jsx` cria `WhatsAppMessage` com status `sent` antes do usuário apertar enviar no WhatsApp.  
   Risco: histórico indicar envio que talvez não ocorreu.

7. **sendApprovedMessages envia email automaticamente**  
   Evidência: `functions/sendApprovedMessages.js` usa `Core.SendEmail` para canal email.  
   Risco: regra “e-mail não envia automático” precisa aprovação/ajuste.

8. **ProposalGenerator tem SelectItem com valor null**  
   Evidência: `pages/ProposalGenerator.jsx` linha com `<SelectItem value={null}>`.  
   Risco: Radix Select pode quebrar renderização.

9. **GPSClinicaRadar usa distância aleatória**  
   Evidência: `components/GPSClinicaRadar.jsx` usa `Math.random()` para `dist_estimada`.  
   Risco: “clínicas próximas” pode ser falso em campo.

10. **Produtos cadastrados sem foto oficial**  
   Evidência: ProductCatalog: 29 produtos obrigatórios cadastrados, 0 com `foto_oficial` + `imagem_url`.  
   Risco: proposta/material premium sem foto oficial.

## O que precisa aprovação antes de corrigir

- Aplicar coordenadas em clientes.
- Pausar/alterar automações de geocode/limpeza/follow-up.
- Alterar comportamento de envio de email.
- Arquivar registros de teste.
- Consolidar agentes com permissões amplas.
- Alterar ProductCatalog com fotos oficiais.
- Remover/ocultar telas duplicadas.

## Próximos 10 passos recomendados

1. Aprovar pausa da automação ativa de geocodificação direta.
2. Alterar geocode para criar CRMUpdateQueue, não atualizar Client direto.
3. Corrigir `RouteOptimizer` ou consolidar em `SmartRouteMap/generateOptimizedRoute`.
4. Adicionar confirmação forte ao botão Limpar Base.
5. Corrigir WhatsAppHub para separar `whatsapp_aberto` de `envio_confirmado_manual`.
6. Corrigir `SelectItem value={null}` no ProposalGenerator.
7. Trocar distância aleatória do GPSClinicaRadar por cálculo real ou label “sem coordenada”.
8. Vincular fotos oficiais no ProductCatalog.
9. Revisar permissões dos agentes com update em Client/Sale.
10. Fazer teste físico em Samsung Galaxy Tab/celular Android com GPS, PWA offline, mapa e WhatsApp.
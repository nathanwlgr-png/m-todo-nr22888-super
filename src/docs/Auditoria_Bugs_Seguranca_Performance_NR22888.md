# Auditoria Bugs, Segurança e Performance — NR22888

Data: 20/06/2026

## Resultado resumido

- Bugs/build/rotas: 70% — aceitável
- Segurança: 69% — aceitável
- Performance campo/tablet: 63% — aceitável

As notas são baseadas em arquivos lidos, funções testadas, entidades consultadas e automações listadas.

## Evidência usada

Arquivos lidos:
- DashboardSniper
- PlanoEliteStatus
- CentralComandosSafe
- WhatsAppHub
- ScoreElite
- RankingOportunidades
- TasksUnified
- ProposalGenerator
- Clients
- Leads
- SalesFunnel
- ClientProfile
- ClientLocationMap
- MapaSeamatyBrasil
- RouteOptimizer
- ScheduledAgenda
- ClienteDetalhe360
- SmartRouteMap
- GPSClinicaRadar
- BotaoLimpezaCRM
- WhatsAppSendModal
- funções críticas listadas abaixo

Funções testadas:
- `generateOptimizedRoute`: payload vazio retornou 422 “Nenhum cliente fornecido.”
- `optimizeRoute`: payload vazio retornou 400 “Sem localizações.”
- `sendWhatsAppMessage`: telefone inválido retornou 422 “Número de telefone inválido”.

Automações listadas: 22.

## Bugs principais encontrados

### 1. ProposalGenerator — SelectItem com valor null
Evidência: arquivo lido contém `<SelectItem value={null}>`.  
Risco: componente Select pode quebrar em runtime.

### 2. RouteOptimizer incompatível com optimizeRoute
Evidência: página envia `client_ids/start_address`; função espera `locations/startPoint`.  
Teste: função retorna 400 sem `locations`.  
Risco: rota clássica quebrada.

### 3. Geocode direto + automação ativa
Evidência: `geocodeClientLocation.js` atualiza Client diretamente; automação ativa “Geocodificar Cliente Novo/Alterado”.  
Risco: coordenada errada sem aprovação.

### 4. GPSClinicaRadar distância aleatória
Evidência: arquivo usa `Math.random()` para distância estimada.  
Risco: campo recebe informação falsa de proximidade.

### 5. WhatsAppHub registra sent sem confirmação real
Evidência: `WhatsAppMessage.create({status:'sent'})` antes de confirmar envio no app WhatsApp.  
Risco: histórico comercial falso.

### 6. WhatsAppSendModal fallback abre WhatsApp direto
Evidência: catch abre wa.me diretamente.  
Risco: fora do PendingMessage se usado sem aprovação.

### 7. sendApprovedMessages envia email automático
Evidência: usa `Core.SendEmail` para canal email.  
Risco: e-mail automático sem revisão.

### 8. BotaoLimpezaCRM sem confirmação forte
Evidência: botão chama `limpezaCompletaCRM` direto.  
Risco: toque acidental no tablet altera dados.

### 9. autoFixSystem deleta Alert duplicado
Evidência: função usa `Alert.delete`.  
Risco: remove log/notificação sem revisão.

### 10. Queries pesadas sem paginação
Evidência: `TasksUnified` usa `Task.list()`, `Client.list()`, `Lead.list()` sem limite; `Clients` e relatórios também têm listagens grandes.  
Risco: lentidão em tablet/celular.

## Segurança

**Nota: 69%**

Motivo da nota:
- Pontos positivos: PendingMessage, CRMUpdateQueue, TelegramCommandLog, EliteActionLog existem e têm registros reais.
- Pontos negativos: geocode direto, limpeza automática, email automático, WhatsApp status sent sem confirmação, agentes com permissões amplas.

Evidência:
- PendingMessage: 10 registros.
- CRMUpdateQueue: 7 registros.
- TelegramCommandLog: 18 registros.
- EliteActionLog: 55 registros.
- Funções lidas: `aplicarAtualizacaoCRMComSeguranca`, `sendApprovedMessages`, `limpezaCompletaCRM`, `geocodeClientLocation`, `autoFixSystem`.

Falta para 100%:
1. Toda alteração crítica via CRMUpdateQueue.
2. Email externo via aprovação.
3. WhatsApp só confirma envio após confirmação manual.
4. Geocode sem update direto.
5. Botões perigosos com confirmação forte.
6. Agentes sem update crítico direto.

Risco se usar sem corrigir:
- Dado de produção pode ser alterado por automação/ação rápida sem revisão.
- Histórico pode indicar envio não realizado.

## Performance campo/tablet

**Nota: 63%**

Motivo da nota:
- Há lazy loading no App e DashboardSniper.
- Existem limites em várias queries.
- Mas há telas com `list()` sem limite e componentes pesados.
- Preview físico em tablet não foi validado.

Evidência:
- App.jsx tem lazy loading em páginas.
- DashboardSniper lazy-loads widgets pesados.
- WhatsAppHub limita clientes a 150 e mensagens a 100.
- ClientLocationMap lista 500 clientes.
- TasksUnified usa listas sem limite.
- ProposalGenerator lista clientes sem limite.

Falta para 100%:
1. Limitar/paginar `list()` pesados.
2. Clusterizar pins no mapa.
3. Medir carregamento real no Galaxy Tab.
4. Validar PWA offline real.
5. Reduzir LLM em telas de lista.

Risco:
- Travamento/lentidão em campo.
- Consumo alto de créditos/IA.

## Duplicidades e testes

Evidência real:
- Duplicidade provável cliente por nome+cidade: 4 grupos.
- Duplicidade provável lead por telefone: 4 grupos.
- Clientes com tag de teste: 4.
- PendingMessage com tag de teste: 3.
- CRMUpdateQueue com tag de teste: 7.
- Tasks com tag de teste: 8.

Ação recomendada:
- Não apagar.
- Marcar para revisão.
- Arquivar somente com aprovação.

## Agentes

Agentes lidos:
- `nr22888_dia_dia`: ativo, útil, mas com permissões amplas de update/create em Client/Lead/Task/Visit/Sale.
- `telegram_operacional_nr22888`: SAFE, mais controlado.
- `whatsapp_master_agent_NR22888`: estratégico, permissões amplas.
- `vendas_supremo`: legado neutralizado, sem tools.

Risco:
- Agentes amplos podem alterar dados críticos se não forem contidos por instrução/função SAFE.

Próximo passo:
- Reduzir permissões diretas de Sale/Client para agentes estratégicos ou exigir funções SAFE.
# Auditoria GPS, Mapas, Rotas e Uso em Campo — NR22888

Data: 20/06/2026  
Modo: Auditoria sem alteração de dados antigos  
Escopo: localização, mapa, GPS, clientes no mapa, rotas, pins, endereço, cidade, distância, visitas, tablet/celular e segurança CRM.

## 1. Resumo executivo

Resultado geral: **58% — classificação FRACO**.

O módulo GPS/Mapa/Rotas existe, tem várias partes funcionais e já possui boa base para uso em campo, mas **não está pronto para ser considerado nível elite** porque a base real de clientes está praticamente sem coordenadas utilizáveis.

O maior gargalo não é visual: é **qualidade de dados de geolocalização**.

Ponto mais crítico encontrado:
- Foram analisados **433 clientes**.
- **375 clientes têm endereço**.
- **423 clientes têm cidade**.
- **349 clientes têm CEP**.
- **0 clientes têm latitude/longitude válidas registradas**.
- Sem coordenadas, mapa com pins reais, distância real, rota inteligente e proximidade por GPS ficam limitados.

Importante: **nenhum dado antigo do CRM foi alterado nesta auditoria**. Foram criadas apenas entidades e registros de auditoria para diagnóstico.

## 2. Percentual por categoria

Pesos solicitados:

| Categoria | Peso | Nota |
|---|---:|---:|
| Qualidade dos dados de localização | 20% | 33% |
| Mapa visual e pins | 20% | 55% |
| GPS/localização do usuário | 15% | 68% |
| Rotas e navegação | 15% | 62% |
| Check-in/check-out e visitas | 10% | 61% |
| Integração com CRM/EliteLeadScore | 10% | 78% |
| Performance mobile/tablet | 5% | 74% |
| Segurança/logs/aprovação | 5% | 72% |

Resultado solicitado:

- **GPS / Localização atual:** 68%
- **Mapa / Pins:** 55%
- **Rotas / Google Maps:** 62%
- **Dados de endereço/coordenadas:** 33%
- **Visitas / Check-in / Check-out:** 61%
- **Integração com CRM e Score Elite:** 78%
- **Performance em campo:** 74%
- **Segurança e logs:** 72%

**Percentual geral: 58%**

Classificação: **fraco**  
Faixa: 41% a 60% = fraco.

## 3. Dados auditados

### Entidades principais auditadas

- Client
- Lead
- Visit
- Task
- Sale
- EliteLeadScore
- EliteActionLog
- OptimizedRoute
- GeoAuditReport
- GeoAuditItem

### Entidades/páginas relacionadas verificadas

- ClientLocationMap
- MapaSeamatyBrasil
- RouteOptimizer
- SmartRouteOptimizer
- ScheduledAgenda
- DayFieldView
- ClienteDetalhe360
- SmartRouteMap
- ClientsMap
- RouteMap
- GPSClinicaRadar
- AIRouteOptimizer
- VisitFlowManager
- QuickVisitButton

### Entidades esperadas mas sem arquivo encontrado

- LocationPointSeamaty
- CidadeTerritorioSeamaty

Observação: `MapaSeamatyBrasil` tenta ler essas entidades com proteção (`?.list?.()` e `catch`), então tende a não quebrar, mas pode ficar vazio se as entidades não existirem ou não tiverem dados.

## 4. Qualidade real dos dados de localização

Medição feita com dados reais via serviço:

| Métrica | Valor |
|---|---:|
| Clientes analisados | 433 |
| Leads analisados | 141 |
| Visitas analisadas | 349 |
| Tasks analisadas | 338 |
| EliteLeadScore analisados | 110 |
| Rotas salvas em OptimizedRoute | 0 |
| Clientes com endereço | 375 |
| Clientes sem endereço | 58 |
| Clientes com cidade | 423 |
| Clientes com CEP | 349 |
| Clientes com coordenada | 0 |
| Clientes sem coordenada | 433 |
| Coordenadas válidas | 0 |
| Coordenadas inválidas registradas | 0 |
| Endereços duplicados suspeitos | 3 |
| Visitas sem local | 46 |

### Classificação dos itens auditados

Foram analisados clientes, leads e visitas para status de geolocalização.

| Status | Total |
|---|---:|
| Completo | 0 |
| Incompleto | 866 |
| Suspeito | 0 |
| Inválido | 57 |

Interpretação:
- A base tem bastante endereço/cidade, mas quase nenhuma geolocalização pronta para mapa/rota real.
- A ausência de latitude/longitude impede pins precisos e cálculo real de distância.
- A base ainda depende de geocodificação controlada e aprovada.

## 5. Entidades criadas para auditoria

Foram criadas as entidades solicitadas:

### GeoAuditReport
Armazena o resumo consolidado da auditoria.

Último relatório gerado:
- ID: `6a365c58fd5ca6e7d100cce8`
- Percentual: 58%
- Status: fraco

### GeoAuditItem
Armazena itens individuais de auditoria para clientes/leads/visitas.

Registros criados nesta auditoria:
- 100 itens principais de problema foram registrados para inspeção.
- Todos ficaram como `pendente`.
- Todos exigem aprovação.
- Nenhum item corrige dados automaticamente.

## 6. Auditoria de mapa visual

### ClientLocationMap
Status: **parcialmente funcional**

O que funciona:
- Usa Leaflet/OpenStreetMap.
- Tem MapContainer, TileLayer, Marker, Popup e Circle.
- Pede GPS ao abrir.
- Mostra localização atual quando permitida.
- Calcula distância por Haversine quando cliente tem coordenada.
- Tem filtro por status.
- Tem pins com cores por status.
- Popup mostra nome, cidade, status e distância.
- Tem link para WhatsApp.
- Tem link para perfil do cliente.
- Tem link para Google Maps por coordenada.
- Tem alerta para clientes sem coordenadas.

Problemas:
- Como **0 clientes têm coordenadas válidas**, o mapa tende a abrir sem pins reais.
- O botão “Geocodificar” chama função que atualmente pode atualizar o cliente diretamente, o que conflita com a regra SAFE de não sobrescrever coordenadas sem aprovação.
- GPS real do dispositivo não pôde ser validado integralmente no preview.

Risco comercial:
- Vendedor pode abrir mapa e não ver clientes, mesmo tendo muitos clientes com endereço/cidade.

Prioridade: **ALTA**

### ClientsMap
Status: **funcional como mapa por cidade, não como mapa por endereço real**

O que funciona:
- Usa Leaflet/OpenStreetMap.
- Agrupa clientes por cidade.
- Usa coordenadas fixas de cidades conhecidas.
- Mostra círculos por cidade.
- Cores por temperatura comercial.
- Popup mostra cidade, quantidade de clientes, quentes/mornos/frios e receita.

Limitação:
- Não posiciona o cliente no endereço real.
- Depende de dicionário fixo de cidades.

Prioridade: **MÉDIA**

### MapaSeamatyBrasil
Status: **parcial / visual-simulado**

O que funciona:
- Tem filtros por representante, cidade, status e equipamento.
- Tem painel lateral de cidades/clientes/oportunidades.
- Exporta CSV/PDF.
- Gera rota sniper em lógica simplificada.
- Links de Google Maps usam função segura de URL.

Problemas:
- Área principal informa “Mapa Interativo (Leaflet)”, mas o mapa real está simulado/placeholder.
- Depende de `CidadeTerritorioSeamaty` e `LocationPointSeamaty`, que não foram encontrados como arquivos de entidade.
- Se não houver dados nessas entidades, a página fica sem pontos.

Prioridade: **ALTA** se for usado como mapa principal territorial.

### ClienteDetalhe360 — Aba Mapa
Status: **funcional básico**

O que funciona:
- Tem botão “Ver Mapa”.
- Abre Google Maps por endereço/cidade.
- Exibe iframe do Google Maps.
- Tem botão para incluir cliente na rota do dia.

Limitações:
- Usa endereço/cidade, não coordenada validada.
- Não mostra distância do vendedor.
- Não valida se o endereço resolve para local correto.

Prioridade: **MÉDIA**

### SmartRouteOptimizer / RouteMap
Status: **funcional visualmente, limitado por dados**

O que funciona:
- Interface de rota do dia.
- Rota visual estilizada.
- Estatísticas de economia.
- Mensagem WhatsApp da rota.
- Abre Google Maps quando há rota calculada.

Problemas:
- Depende de visitas/tarefas do dia com local.
- `OptimizedRoute` tem 0 rotas salvas.
- Algumas rotas são otimizadas por IA com endereço textual, não necessariamente por coordenada real.

Prioridade: **MÉDIA/ALTA**

## 7. Auditoria do GPS do usuário

### O que existe

Componentes/funções encontrados:
- `ClientLocationMap` usa `navigator.geolocation.getCurrentPosition`.
- `GPSClinicaRadar` usa `navigator.geolocation.watchPosition`.
- `utils/locationSafe.js` tem `getCurrentGPS`, fallback e cálculo de distância.

### O que funciona em código

- Pede permissão do navegador.
- Captura latitude/longitude quando permitido.
- Mostra erro claro quando indisponível.
- Tem timeout.
- Tem fallback seguro em utilitário.
- Pode calcular distância Haversine.
- Pode abrir Google Maps/Waze.

### Limitações encontradas

- Preview não permite validar GPS real físico com precisão de tablet/celular.
- `GPSClinicaRadar` lista clínicas próximas usando estimativa aleatória (`Math.random`) em vez de distância real por coordenada.
- Não existe campo formal de check-in/check-out com latitude/longitude no schema de `Visit`.
- O GPS pode registrar visita, mas ainda não há separação robusta entre check-in, check-out, distância do cliente e alerta de longe demais.

### Checklist obrigatório para teste físico em Samsung Galaxy Tab/celular

1. Abrir `/ClientLocationMap` no tablet.
2. Permitir localização.
3. Confirmar se aparece “Você está aqui”.
4. Confirmar precisão em metros.
5. Negar localização e confirmar mensagem clara.
6. Entrar em `/ScheduledAgenda`, aba GPS.
7. Ativar GPS.
8. Andar/parar por mais de 2 minutos.
9. Verificar se parada é detectada.
10. Registrar visita.
11. Verificar se a visita foi criada com coordenada em `location`.
12. Parar cronômetro.
13. Verificar se duração foi salva.
14. Testar Google Maps e Waze no Android.

Nota GPS atual: **68%**.

## 8. Auditoria de rotas

### RouteOptimizer
Status: **parcial**

O que funciona:
- Seleciona clientes por cidade.
- Otimiza via função `optimizeRoute`.
- Salva rota em `OptimizedRoute`.
- Mostra distância/tempo quando retorno existe.
- Abre Google Maps.

Problemas:
- A função `optimizeRoute` espera `locations` e `startPoint`, mas a página envia `client_ids`, `start_address` e `visit_duration_minutes`.
- Isso indica risco alto de incompatibilidade entre frontend e backend.
- Usa SDK antigo `@base44/sdk@0.8.6`.
- Usa distância euclidiana, não rota real por rua.

Prioridade: **CRÍTICA** para rota otimizada clássica.

### SmartRouteMap
Status: **bom para link rápido Google Maps**

O que funciona:
- Deduplica por nome+cidade.
- Valida coordenadas.
- Usa fallback por endereço quando não há coordenada.
- Limita rota a 12 paradas.
- Monta URL do Google Maps com `origin`, `destination`, `waypoints`, `travelmode=driving` e `optimize=true`.
- Mostra alerta de clientes sem GPS.

Limitações:
- Sem coordenadas, depende de endereço textual.
- Não salva rota.
- Não calcula distância real.

Prioridade: **MÉDIA**

### optimizeDayRoute
Status: **parcial**

O que funciona:
- Busca visitas do dia.
- Usa tasks como fallback.
- Enriquece visitas com cliente/endereço.
- Gera ordem por IA.
- Retorna mensagem WhatsApp.

Problemas:
- Se `notify_phone` for informado, tenta enviar WhatsApp via `sendWhatsAppMessage`, o que pode contrariar fluxo SAFE dependendo do uso.
- Não usa coordenadas reais.
- Usa IA para estimar km, não Google Maps Distance Matrix.
- Carrega até 10.000 clientes via service role.

Prioridade: **ALTA** para segurança/consumo/performance.

### generateOptimizedRoute
Status: **mais seguro tecnicamente**

O que funciona:
- Valida coordenadas.
- Deduplica clientes.
- Ignora clientes sem coordenadas.
- Prioriza por score/status/prioridade.
- Gera URL Google Maps com waypoints.

Problema:
- Com 0 clientes com coordenada, rota fica vazia.

Prioridade: **MÉDIA** após geocodificação aprovada.

## 9. Auditoria Google Maps e links externos

O que está OK:
- Muitos links usam `encodeURIComponent`.
- Links abrem em nova aba.
- `SmartRouteMap` constrói URL correta com API Google Maps Directions.
- `ClienteDetalhe360` usa iframe Google Maps com endereço/cidade.
- `ClientLocationMap` usa coordenadas quando existem.

Problemas:
- Alguns links usam `wa.me/${client.phone}` sem sanitizar em certas telas.
- Links de mapa por cidade/endereço podem abrir local errado se endereço estiver incompleto.
- Sem coordenada, Google Maps pode buscar pelo nome da clínica e errar.

Prioridade: **MÉDIA**

## 10. Auditoria visitas / check-in / check-out

### Visit schema atual
Campos encontrados:
- client_id
- client_name
- scheduled_date
- duration_minutes
- visit_type
- location
- notes
- status
- result_notes
- google_calendar_synced
- google_calendar_event_id

### O que existe

- Visitas podem ser agendadas.
- Visitas podem ser marcadas como realizadas.
- GPSClinicaRadar pode criar visita realizada com `location` contendo `lat,lng`.
- Cronômetro pode salvar duração em `duration_minutes` e `result_notes`.
- ScheduledAgenda mostra visitas de hoje.
- DayFieldView mostra visitas do dia e permite marcar realizada.

### O que falta

Não há campos formais para:
- checkin_at
- checkin_latitude
- checkin_longitude
- checkout_at
- checkout_latitude
- checkout_longitude
- checkin_distance_from_client_meters
- checkout_distance_from_client_meters
- alerta_checkin_distante

Também não há regra clara de:
- alerta se check-in estiver longe demais.
- geração obrigatória de EliteActionLog na visita.
- geração segura de CRMUpdateQueue para atualização pós-visita.
- geração controlada de PendingMessage pós-visita.

Prioridade: **ALTA**

## 11. Auditoria de performance

Nota: **74% — bom/aceitável para campo, com riscos**.

Pontos positivos:
- Páginas secundárias estão lazy-loaded em App.jsx.
- Algumas queries usam limite: 100, 150, 200, 500.
- `ClientLocationMap` usa staleTime e memoização.
- `SmartRouteMap` limita rota a 12 paradas.
- Uso mobile/tablet já é considerado em várias telas.

Riscos:
- `RouteOptimizer` carrega `Client.list()` sem limite.
- `optimizeDayRoute` lê até 10.000 clientes via service role.
- `ClientLocationMap` carrega 500 clientes e renderiza todos os pins, o que pode ficar pesado depois da geocodificação.
- `MapaSeamatyBrasil` pode ficar pesado se pontos/cidades crescerem muito sem paginação.
- `AIRouteOptimizer` usa LLM com internet para muitos clientes; alto consumo.

Classificação performance: **bom**, mas precisa controle antes de geocodificar toda a base.

## 12. Auditoria de segurança

Nota: **72% — aceitável, com ponto crítico em geocodificação**.

Confirmado:
- A auditoria não apagou clientes.
- A auditoria não alterou endereços antigos.
- A auditoria não alterou coordenadas antigas.
- GeoAuditItem exige aprovação por padrão.
- Algumas rotinas já preservam dados e usam logs.

Risco crítico:
- `geocodeClientLocation` atualiza `Client` diretamente com latitude/longitude.
- Isso deve ser alterado futuramente para criar `CRMUpdateQueue` de localização antes de aplicar.
- Correção de localização deve exigir aprovação manual quando envolver cliente real.

Outros riscos:
- `GPSClinicaRadar` atualiza `Client.last_visit_date` e `last_contact_date` diretamente ao registrar visita.
- `optimizeDayRoute` pode tentar envio WhatsApp direto se `notify_phone` for informado.

Recomendação SAFE:
- Toda alteração de endereço, coordenada, localização validada, cidade/UF e rota crítica deve passar por `CRMUpdateQueue` e gerar `EliteActionLog`.

## 13. Previews capturados

### DashboardSniper — portrait/tablet
Resultado: captura realizada parcialmente.

Observação:
- O preview capturado ficou na tela de carregamento Seamaty.
- Botão PWA “Instalar app” apareceu discreto, sem cobrir o CRM.
- Não houve captura conclusiva do dashboard após carregamento nesta rodada.

### ClientLocationMap — desktop/tablet
Resultado: captura falhou no preview.

Registro:
- A ferramenta de preview retornou falha.
- A auditoria foi feita por código e dados.

### SmartRouteOptimizer — tablet
Resultado: captura falhou no preview.

Registro:
- A ferramenta de preview retornou falha.
- A auditoria foi feita por código.

### ClienteDetalhe360 — tablet
Resultado: captura falhou no preview.

Registro:
- A ferramenta de preview retornou falha.
- A auditoria foi feita por código.

### ScheduledAgenda — tablet
Resultado: captura falhou no preview.

Registro:
- A ferramenta de preview retornou falha.
- A auditoria foi feita por código.

### MapaSeamatyBrasil — desktop
Resultado: captura falhou no preview.

Registro:
- A ferramenta de preview retornou falha.
- A auditoria foi feita por código.

## 14. Problemas encontrados por prioridade

## CRÍTICO

### 1. Clientes sem coordenadas reais
Impacto no campo:
- Sem pins reais.
- Sem distância real.
- Sem rota por proximidade real.
- GPS não consegue indicar cliente próximo com precisão.

Risco comercial:
- Vendedor pode perder tempo, fazer zigue-zague e visitar clientes menos relevantes.

Correção sugerida:
- Criar fluxo de geocodificação SAFE: endereço/cidade/CEP → sugestão de coordenada → `CRMUpdateQueue` → aprovação → aplicar.

Precisa aprovação: **sim**  
Dificuldade: **média**

### 2. `RouteOptimizer` incompatível com `optimizeRoute`
Impacto no campo:
- Otimizador clássico pode falhar ou retornar erro.

Risco comercial:
- Rota prometida pode não funcionar no dia de campo.

Correção sugerida:
- Alinhar payload da página com a função ou redirecionar para `generateOptimizedRoute`/`SmartRouteMap`.

Precisa aprovação: **não altera dados**, mas altera lógica.  
Dificuldade: **média**

### 3. Geocodificação atual pode alterar cliente direto
Impacto no campo:
- Coordenada incorreta pode sobrescrever cliente sem revisão.

Risco comercial:
- Pin pode mandar o vendedor para local errado.

Correção sugerida:
- Alterar `geocodeClientLocation` para criar `CRMUpdateQueue` com risco médio/alto antes de aplicar.

Precisa aprovação: **sim**  
Dificuldade: **média**

## ALTO

### 4. Check-in/check-out formal não existe
Impacto no campo:
- Não há prova robusta de visita por localização.
- Não há alerta de check-in longe do cliente.

Risco comercial:
- Gestão de campo fica menos confiável.

Correção sugerida:
- Adicionar campos formais de check-in/check-out na entidade Visit ou criar entidade complementar segura.

Precisa aprovação: **sim**  
Dificuldade: **média**

### 5. MapaSeamatyBrasil depende de entidades ausentes/vazias
Impacto no campo:
- Mapa territorial pode abrir sem dados.

Risco comercial:
- Visão territorial pode parecer quebrada ou incompleta.

Correção sugerida:
- Consolidar mapa principal em `ClientLocationMap` ou alimentar `LocationPointSeamaty` com fluxo aprovado.

Precisa aprovação: **sim se gerar dados**  
Dificuldade: **média/alta**

### 6. optimizeDayRoute pode tentar enviar WhatsApp
Impacto no campo:
- Pode conflitar com fluxo SAFE de aprovação humana.

Risco comercial:
- Mensagem externa fora da fila `PendingMessage`.

Correção sugerida:
- Remover envio direto e transformar em PendingMessage/WhatsAppHub.

Precisa aprovação: **não para lógica SAFE; sim se mudar operação real**  
Dificuldade: **baixa/média**

## MÉDIO

### 7. GPSClinicaRadar usa distância estimada aleatória
Impacto no campo:
- Lista de clínicas próximas pode não refletir proximidade real.

Risco comercial:
- Priorização errada em campo.

Correção sugerida:
- Usar latitude/longitude real quando disponível; caso contrário mostrar “sem coordenada”.

Precisa aprovação: **não altera dados se só UI/lógica de exibição**  
Dificuldade: **baixa/média**

### 8. Tooltip/popup ainda incompleto em alguns mapas
Impacto no campo:
- Vendedor vê nome/cidade, mas nem sempre score, próxima ação e oportunidade.

Risco comercial:
- Decisão em campo fica menos consultiva.

Correção sugerida:
- Padronizar popup: cliente, cidade, score, status, próxima ação, WhatsApp, perfil, Maps.

Precisa aprovação: **não**  
Dificuldade: **baixa**

### 9. Rotas salvas inexistentes
Impacto no campo:
- Histórico/planejamento de rota ainda não está sendo usado.

Risco comercial:
- Perda de aprendizado operacional.

Correção sugerida:
- Salvar rotas otimizadas aprovadas em `OptimizedRoute`.

Precisa aprovação: **sim se criar dados operacionais**  
Dificuldade: **baixa/média**

## BAIXO

### 10. Labels e nomes de mapas duplicados
Impacto no campo:
- Pode confundir qual mapa é o oficial.

Risco comercial:
- Baixo, mas aumenta complexidade.

Correção sugerida:
- Definir um mapa oficial de campo e manter os outros como apoio/legacy.

Precisa aprovação: **não**  
Dificuldade: **baixa**

## 15. O que já está funcionando

- Base de clientes possui cidade/endereço/CEP em boa parte dos registros.
- Leaflet/OpenStreetMap funciona em componentes de mapa.
- Google Maps é aberto por links externos.
- Cliente 360 tem aba de mapa básica.
- Agenda/Visitas existem e integram com clientes.
- GPS do navegador é usado em componentes.
- Há fallback quando GPS indisponível.
- Há rotas visuais e links para Google Maps/Waze.
- EliteLeadScore existe e pode integrar priorização.
- DashboardSniper segue preservado.
- PWA aparece discreto.

## 16. O que está parcialmente funcionando

- Pins: dependem de coordenadas que ainda não existem na base real.
- Rotas: funcionam melhor por endereço textual do que por coordenada real.
- GPS: captura posição do usuário, mas não cruza bem com clientes sem coordenadas.
- Visitas: registram data/status/local textual, mas não possuem check-in/check-out formal.
- Mapa territorial: tem UI e filtros, mas depende de dados/entidades de pontos.

## 17. O que não está funcionando plenamente

- Coordenadas reais de clientes.
- Distância real cliente ↔ vendedor para toda a base.
- Pins reais por endereço.
- Rota otimizada confiável por proximidade real.
- Check-in/check-out com validação de distância.
- Correção de coordenadas via fluxo SAFE/aprovação.
- Mapa territorial real com pins em produção.

## 18. Plano de correção recomendado

### Fase Geo-SAFE 1 — Não mexer em cliente ainda
1. Consolidar mapa oficial de campo: `ClientLocationMap`.
2. Desativar ou ocultar geocodificação direta sem aprovação.
3. Criar fila `CRMUpdateQueue` para coordenadas sugeridas.
4. Criar tela simples de aprovação de coordenadas dentro da Central SAFE, se necessário.
5. Padronizar popup dos pins.

### Fase Geo-SAFE 2 — Coordenadas aprovadas
1. Geocodificar clientes com endereço/cidade/CEP.
2. Marcar confiança: alta, média, baixa.
3. Aplicar somente após aprovação.
4. Registrar antes/depois em `EliteActionLog`.
5. Recalcular auditoria.

### Fase Geo-SAFE 3 — Rota de campo real
1. Usar coordenadas aprovadas no `generateOptimizedRoute`.
2. Salvar rotas aprovadas em `OptimizedRoute`.
3. Integrar com DashboardSniper e Ranking do Dia.
4. Gerar link Google Maps com limite de paradas.
5. Criar alerta para cliente sem coordenada.

### Fase Geo-SAFE 4 — Check-in/check-out
1. Criar campos formais ou entidade complementar de visita GPS.
2. Capturar check-in latitude/longitude/hora.
3. Capturar check-out latitude/longitude/hora.
4. Calcular distância do cliente.
5. Alertar se longe demais.
6. Gerar EliteActionLog.

## 19. Recomendação final

Status final da auditoria: **APROVADO COM AJUSTES — módulo ainda fraco para uso elite**.

Não está crítico porque:
- As telas principais existem.
- O GPS do navegador existe.
- Os links Google Maps existem.
- As visitas existem.
- O CRM não foi quebrado.

Mas ainda não é nível elite porque:
- A base real não tem coordenadas.
- A rota real fica dependente de texto/endereço.
- Check-in/check-out não está formalizado.
- Geocodificação direta precisa virar fluxo SAFE.

## 20. Decisão

**Não iniciar correções automáticas de dados ainda.**

Próxima ação recomendada:
- Aprovar uma fase curta chamada **Geo-SAFE 1**, focada apenas em blindar geocodificação e consolidar o mapa oficial, sem alterar coordenadas antigas automaticamente.
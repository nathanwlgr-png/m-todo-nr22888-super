# Auditoria GPS, Mapas, Rotas e Campo — NR22888

Data: 20/06/2026  
Modo: auditoria e medição, sem alterar coordenadas/endereço/rotas de clientes.

## Resumo executivo

Percentual GPS/Mapa/Rotas: **58%**  
Classificação: **fraco**.

A estrutura de mapa, GPS, agenda e rota existe, mas o sistema ainda não opera como elite de campo porque a base real de clientes não possui coordenadas validadas.

## Percentual por categoria

| Categoria | Percentual | Classificação |
|---|---:|---|
| GPS/localização atual | 68% | aceitável |
| Mapa/pins | 55% | fraco |
| Rotas/Google Maps | 62% | aceitável |
| Dados de endereço/coordenadas | 33% | crítico |
| Visitas/check-in/check-out | 61% | aceitável |
| Integração com CRM/Score Elite | 78% | bom |
| Performance em campo | 74% | aceitável |
| Segurança/logs/aprovação | 72% | aceitável |

**Percentual geral GPS/Mapa/Rotas: 58% — fraco.**

## Dados medidos

| Métrica | Valor |
|---|---:|
| Clientes analisados | 433 |
| Clientes com telefone | 385 |
| Clientes com endereço | 375 |
| Clientes com cidade | 423 |
| Clientes com CEP | 349 |
| Clientes com coordenada | 0 |
| Clientes sem coordenada | 433 |
| Visitas analisadas | 349 |
| Visitas agendadas | 344 |
| Visitas sem local | 46 |
| Rotas salvas em OptimizedRoute | 0 |

## O que está funcionando

- `ClientLocationMap` usa Leaflet/OpenStreetMap.
- `ClientLocationMap` solicita localização do usuário.
- `SmartRouteMap` monta link Google Maps com origin, destination e waypoints.
- `ClienteDetalhe360` tem aba/botão de mapa por endereço/cidade.
- `ScheduledAgenda` tem aba GPS e Rota IA.
- `GPSClinicaRadar` usa watchPosition, cronômetro e registro de visita.
- `Visit` integra com Google Calendar.
- `EliteLeadScore` pode priorizar oportunidades.
- Links Google Maps e Waze existem em múltiplos pontos.

## O que está parcial

- Pins existem no código, mas não aparecem em massa porque 0 clientes têm coordenadas.
- Distância real só funciona quando latitude/longitude existem.
- `GPSClinicaRadar` calcula parada, mas lista clínicas próximas por estimativa aleatória enquanto não há coordenadas.
- `MapaSeamatyBrasil` tem UI/filtros, mas o mapa principal ainda está visualmente simulado e depende de entidades/pontos que podem estar ausentes.
- `optimizeDayRoute` usa IA e endereço textual, não distância real por coordenada.

## O que está quebrado ou de alto risco

1. **Sem coordenadas:** bloqueia pins reais, rota real e proximidade.
2. **geocodeClientLocation atualiza Client direto:** deve ir para CRMUpdateQueue antes de aplicar.
3. **Fallback mock de geocode:** pode criar coordenadas aproximadas erradas.
4. **Automação ativa de geocode:** deve ser revisada antes de qualquer fase agressiva.
5. **RouteOptimizer incompatível com optimizeRoute:** payload da tela não bate com payload da função.
6. **Check-in/check-out formal ausente:** Visit não tem campos próprios para latitude/hora de entrada/saída.

## Riscos

- Vendedor abrir mapa e não ver clientes.
- Google Maps levar para cidade, não endereço exato.
- Rota do dia parecer inteligente, mas ser baseada em texto/IA, não coordenada real.
- Coordenada errada sobrescrever cliente sem aprovação.
- Check-in sem distância real do cliente.

## Correções sugeridas

### Precisa aprovação
- Pausar ou alterar automação “Geocodificar Cliente Novo/Alterado”.
- Alterar `geocodeClientLocation` para criar CRMUpdateQueue em vez de atualizar Client direto.
- Adicionar campos ou entidade complementar para check-in/check-out GPS.
- Geocodificar clientes em lote com aprovação manual.
- Salvar rotas reais em OptimizedRoute após aprovação.

### Pode ser correção simples futura
- Padronizar botão “Abrir mapa”.
- Padronizar popup de pin com score, próxima ação, WhatsApp, perfil e rota.
- Exibir “sem coordenada” claramente onde necessário.
- Consolidar mapa oficial em `ClientLocationMap`.

## Próximos passos

1. Aprovar SAFE-GEO 1.
2. Transformar geocode em fila de aprovação.
3. Criar revisão visual de coordenadas sugeridas.
4. Aplicar coordenadas aprovadas em lote pequeno.
5. Recalcular nota GPS.
6. Corrigir RouteOptimizer ou consolidar no SmartRouteMap.
7. Criar check-in/check-out formal.
8. Testar no Samsung Galaxy Tab com GPS real.

## Decisão

Não corrigir dados de coordenada automaticamente. Primeiro blindar o fluxo SAFE de geolocalização.
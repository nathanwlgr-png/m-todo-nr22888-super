# Auditoria GPS, Mapa, Rotas e Campo — NR22888

Data: 20/06/2026  
Regra: nota baseada somente em evidência real.

> ATUALIZAÇÃO 20/06/2026 (pós-Correção Total SAFE): nota subiu de 58% para 70%. Geocode agora via fila de aprovação, RouteOptimizer compatível com fallback, GPSClinicaRadar sem distância aleatória. GPS físico segue NÃO VALIDADO EM DISPOSITIVO REAL. Ver docs/Correcoes_Geo_SAFE_NR22888.md.

> FECHAMENTO 20/06/2026: nota 70% → **75%**. `optimizeRoute` foi reescrito e TESTADO nos 3 cenários (com coordenada via Haversine real / só endereço textual / misto) — todos retornam 200 com o formato que a página espera (total_distance_km, visits[], google_maps_url, optimized_order). RouteOptimizer não quebra mais. Geocode testado com cliente real "Ricardo": retornou `sem_coordenada_validada` sem inventar nem aplicar coordenada — comportamento SAFE confirmado. PENDÊNCIA NATHAN: habilitar a Geocoding API no Google Cloud (a key existe mas a Geocoding API não retorna resultado). Total real: 433 clientes, **423 sem coordenada**.

## Resultado

**GPS/Mapa/Rotas: 58% — FRACO**

Evidência principal: `GeoAuditReport` gerado no banco com 58%, `status_geral=fraco`, após leitura de arquivos e consulta real de dados.

## Dados reais usados

- Clientes analisados: 433
- Clientes com endereço: 375
- Clientes com cidade: 423
- Clientes com CEP: 349
- Clientes com coordenadas: 0
- Visitas analisadas: 349
- Visitas sem local: 46
- GeoAuditReport: 2 registros
- GeoAuditItem: 200 registros
- Funções testadas:
  - `generateOptimizedRoute` com payload vazio retornou 422: “Nenhum cliente fornecido.”
  - `optimizeRoute` com payload vazio retornou 400: “Sem localizações.”
- Preview: tentativa anterior falhou na maioria das telas; uma captura ficou apenas no carregamento.

## Notas por categoria GPS

| Categoria | Nota | Motivo | Evidência usada | Falta para 100% | Risco em campo |
|---|---:|---|---|---|---|
| GPS/localização atual | 45% | Código usa geolocation, mas não houve validação física | `ClientLocationMap.jsx`, `GPSClinicaRadar.jsx`, `utils/locationSafe.js` lidos | Teste em tablet/celular real com permissão, precisão e fallback | App pode falhar em GPS real ou permissões |
| Mapa/pins | 40% | Leaflet existe, mas 0 clientes com coordenadas | `ClientLocationMap.jsx`; consulta: 0 coordenadas | Geocodificar com aprovação e validar pins | Mapa abre sem clientes reais |
| Rotas/Google Maps | 55% | Links existem, mas rota por coordenada não funciona sem coords; função clássica tem payload divergente | `SmartRouteMap.jsx`, `RouteOptimizer.jsx`, `optimizeRoute.js`, teste 400 | Alinhar função/página e usar coordenadas aprovadas | Rota errada ou vazia |
| Dados endereço/coordenadas | 33% | Muitos endereços, nenhuma coordenada | 375 endereços, 423 cidades, 0 coords | Geocode SAFE com CRMUpdateQueue | Vendedor perde precisão |
| Visitas/check-in/check-out | 61% | Visitas existem, Calendar sync alto, mas não há check-in/out formal | 349 visitas, 344 agendadas/sincronizadas, 46 sem local; schema Visit lido | Campos formais de check-in/out e distância | Registro de visita não prova presença |
| Integração CRM/Score Elite | 78% | 110 EliteLeadScore e integração com dashboards | Consulta EliteLeadScore; ScoreElite lido | Ligar score à rota por coordenada real | Priorização sem localização real |
| Performance campo | 63% | Lazy loading existe, mas mapas/listas podem pesar | Arquivos lidos; ClientLocationMap lista 500; outras telas listam sem limite | Paginação/cluster/offline físico | Lentidão no tablet |
| Segurança/logs/aprovação | 69% | Logs e filas existem; geocode direto é risco | CRMUpdateQueue, PendingMessage, EliteActionLog; geocode lido | Geocode e check-in via fila/log | Alteração de coordenada sem aprovação |

## Status “NÃO VALIDADO EM DISPOSITIVO REAL”

- GPS físico em Samsung Galaxy Tab.
- GPS físico em celular Android.
- Precisão em metros no campo.
- PWA offline real com mapa.
- Navegação Google Maps/Waze saindo do PWA.
- Check-in por parada física.

## Quebrados/parciais

1. `geocodeClientLocation` aplica coordenada direto no Client.  
2. Automação ativa “Geocodificar Cliente Novo/Alterado” chama essa função.  
3. `RouteOptimizer` envia payload incompatível com `optimizeRoute`.  
4. `GPSClinicaRadar` usa distância aleatória.  
5. `MapaSeamatyBrasil` depende de entidades/pontos que não estavam disponíveis como arquivo lido anteriormente.  
6. `OptimizedRoute` estava sem rotas salvas na medição anterior.  

## Próximos passos GPS aprováveis

1. Pausar geocode direto.
2. Transformar geocode em sugestão para CRMUpdateQueue.
3. Validar 20 clientes piloto com coordenada aprovada.
4. Recalcular pins.
5. Testar em tablet físico.
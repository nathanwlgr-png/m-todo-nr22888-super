# Correções Geo SAFE — NR22888

Data: 20/06/2026

## O que foi corrigido

### 1. geocodeClientLocation (função)
- ANTES: atualizava o Client diretamente com latitude/longitude; usava mock (Math.random) como fallback.
- AGORA:
  - Não atualiza o Client direto.
  - Cria item em `CRMUpdateQueue` (tipo_atualizacao=geocodificacao, campo_alvo=latitude_longitude, risco=alto, exige_aprovacao=true).
  - Observação registra endereço usado, fonte, precisão, cidade, UF, valor anterior (se houver) e link Google Maps.
  - Se geocode falhar/sem API: retorna `sem_coordenada_validada`. Nenhuma coordenada simulada é gerada ou aplicada.
- Teste real: client inexistente retornou `success:false, status:sem_coordenada_validada` (nenhuma coordenada inventada). ✅

### 2. Automação "Geocodificar Cliente Novo/Alterado"
- Estava ATIVA (id 6a246861eb1eca872fe38cd6).
- Ação: **PAUSADA**. Como a função agora é SAFE (só cria fila), não há mais risco de coordenada direta. Pausada também para reduzir processamento até a aprovação de coordenadas.
- A automação antiga "Geocodificar Cliente Automaticamente" (id 6a24696a83eb1f2a49315237) já estava arquivada/inativa (979 falhas).

### 3. GPSClinicaRadar (componente)
- ANTES: `dist_estimada` usava `Math.random()`.
- AGORA: distância real (Haversine) só quando o cliente tem coordenada validada. Sem coordenada exibe "sem coordenada validada". Nunca mostra distância falsa.

### 4. RouteOptimizer (página)
- ANTES: enviava `client_ids/start_address` (incompatível com optimizeRoute).
- AGORA: transforma clientes selecionados em `locations` (coordenada quando existe, senão endereço/cidade) e envia `locations/startPoint/options`.
- Fallback: se nenhum cliente tem localização suficiente, abre Google Maps aproximado por cidade. Rota com clientes sem coordenada é marcada como "aproximada". Botão nunca quebra.

## Pendente de validação humana / dispositivo real

- GPS físico no Samsung Galaxy Tab e celular Android.
- Aprovação das coordenadas sugeridas na fila CRMUpdateQueue.
- Geocodificação em lote dos 433 clientes (apenas após aprovação).
- Check-in/check-out GPS real (entidade VisitCheckinLog criada, aguardando uso em campo).
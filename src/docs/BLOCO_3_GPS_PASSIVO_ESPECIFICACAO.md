# BLOCO 3+ — GPS Passivo Inteligente

**Status:** Especificação para implementação futura (após BLOCO 1 e BLOCO 2 concluídos)

## Objetivo
Detectar no fim do dia possíveis visitas realizadas e clínicas novas próximas ao trajeto do Nathan, com confirmação explícita antes de qualquer registro.

## Regras Absolutas
- ✋ **Nunca cadastrar cliente automaticamente** sem confirmação manual
- ✋ **Nunca registrar fora do horário comercial** sem permissão prévia
- 📅 **Horário Padrão:** Seg–Qui 08h–18h
- 📅 **Sexta:** Apenas se ativado manualmente pelo usuário
- 🔋 **Otimizar:** Bateria, privacidade, limpeza do CRM

## Fluxo de Detecção

### 1. Monitoramento Passivo
- Detectar paradas >10 minutos próximas a clínicas veterinárias
- Usar geolocalização só durante horário comercial
- Pausar automaticamente após horário (sex 18h, seg-qui 18h)

### 2. Sugestões ao Fim do Dia
Se parada detectada:
- **Cliente Existente:** "Você visitou [Clínica]?" → Registrar visita
- **Clínica Nova:** "Clínica próxima detectada" → Sugerir cadastrar como Prospecção

### 3. Modal de Confirmação
**Texto:** "Você visitou estes locais?"
**Botões:**
- ✅ Visitei — registra visita em Visit entity
- 👀 Só passei perto — ignora
- 🆕 Cadastrar prospecção — cria registro em LeadHunter com status "pendente confirmação"
- 🚫 Ignorar — descarta sugestão

### 4. Status e Histórico
- Novo campo em Visit: `gps_detected: boolean` (default false)
- Novo campo em LeadHunter: `gps_source: boolean`, `gps_confirmed_at: datetime`
- Salvar histórico **somente após confirmação explícita**

## Dados Necessários
- Latitude/Longitude (background location)
- Timestamp de parada (duração)
- Distância até clínica (Haversine formula)
- Confirmação do usuário (timestamp)

## Integrações Necessárias
- Google Maps API (Nearby Search Veterinary Clinics)
- Geolocation API (background geolocation)
- Visit entity (novo campo: `gps_detected`)
- LeadHunter entity (novo campo: `gps_source`, `gps_confirmed_at`)

## Privacy & Battery
- Usar cordova/capacitor geolocation com `background: false` por padrão
- Ativar background tracking apenas Seg–Qui 08h–18h (via Service Worker)
- Parar automaticamente após 18h
- Mostrar indicador visual de rastreamento ativo
- Opção "Pausar rastreamento hoje" na AgendaMensal

## Estimativa de Esforço
- Backend: Geolocation tracking + Nearby clinics query (~3h)
- Frontend: Modal confirmação + histórico visual (~2h)
- Testes: Privacy, battery impact, false positives (~2h)

## Prioridade Comercial
⭐⭐⭐ Alta — Aumenta visitas registradas automaticamente

---
**Não implementar antes de BLOCO 2 estar estável.**
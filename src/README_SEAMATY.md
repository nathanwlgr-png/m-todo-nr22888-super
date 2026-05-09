# 🎯 SEAMATY DEEPHUNTER SUPREMO

**Sistema de Investigação Comercial + CRM para Vendas de Equipamentos Veterinários**

---

## 📊 Visão Geral

Plataforma de análise inteligente para vender **12+ máquinas Seamaty/mês** com:
- ✅ **DeepHunter** — Investigação de leads da base
- ✅ **SuperMasterHunter** — Busca IA profunda por zona geográfica
- ✅ **GPS Hunter** — Radar de clínicas por raio
- ✅ **Central de Controle** — ON/OFF de módulos + seletor de modo
- ✅ **Auditoria** — Rastreamento de créditos e ações
- ✅ **Agente WhatsApp Master** — Automação 29 IAs (já integrado)

---

## 🚀 Começar

### Para Vendedores
1. Abrir app: https://[seu-app].base44.com
2. Fazer login
3. Clicar botão Settings (canto inferior direito)
4. Ativar módulos desejados
5. Começar:
   - **DeepHunter** → Buscar leads qualificados
   - **SuperMaster** → Scan profundo de zona
   - **WhatsApp Master** → Enviar mensagens automáticas

### Para Gerentes
1. **AuditDashboard** → Monitorar créditos e ações
2. **ControlCenter** → Gerenciar modo operacional (Econômico/Supremo/Offline)
3. **CRM Clients** → Visualizar pipeline

---

## 🎛️ Central de Controle

Botão **Settings** (canto inferior direito) permite:

| Módulo | Status | Descrição |
|--------|--------|-----------|
| IA Investigativa | ON/OFF | Análise profunda de leads |
| GPS Hunter | ON/OFF | Busca por proximidade geográfica |
| Super Master Hunter | ON/OFF | Investigação zona completa |
| Ranking do Dia | ON/OFF | Top clientes para visitar |
| Briefing Inteligente | ON/OFF | Dicas por cliente |
| Follow-up | ON/OFF | Lembretes automáticos |
| Aniversários | ON/OFF | Parabéns e reativação |
| Catálogo/Rastreamento | ON/OFF | Envio e rastreamento |
| Auditoria | ON/OFF | Registro de ações |

**Modos:**
- 💰 **Econômico** — Sem IA, menos créditos, rápido
- 🔥 **Supremo** — IA completa, análise profunda
- 📱 **Offline** — Apenas cache, sem internet

---

## 📍 DeepHunter

Busca + análise de leads investigados:

```
1. Abrir DeepHunter
2. Filtrar por: Cidade, Prioridade
3. Buscar pelo nome
4. Clicar "Analisar" para IA gerar:
   - Resumo estratégico
   - Potencial de compra
   - Pressões financeiras
   - Abordagem recomendada
   - Roteiro de ligação (copiar para WhatsApp)
5. Clique WhatsApp para enviar direto
```

**Adicionar empresa manual:**
- Nome, telefone, cidade
- IA enriquece automaticamente com dados públicos
- Salva na base para futuras análises

---

## ⚠️ Super Master Hunter

Investigação IA profunda em zona geográfica:

```
1. Clicar botão "⚠️ Super Master Hunter"
2. Confirmar consumo de créditos
3. Escolher:
   - Cidade (obrigatório)
   - Raio: 5km, 10km, 25km, 50km, 100km
   - Segmento: veterinário, hospital, lab, etc
   - Quantidade: até 25 leads
   - Profundidade: leve, média, profunda, suprema
4. Aguardar resultado (max 2 min)
5. Ver leads com scores de urgência
6. Investigar ou enviar WhatsApp direto
```

**Limites:**
- Máximo 25 leads por execução
- Timeout 2 minutos
- Sem execução simultânea
- Cache 30 dias (não reduplica)

---

## 📍 GPS Hunter

Encontrar clínicas por proximidade:

```
1. Clicar "📍 Buscar por GPS"
2. Selecionar raio (5/10/25/50/100km)
3. Ver clínicas, hospitais, labs, centros diagnósticos
4. Por cada um:
   - Distância
   - Endereço
   - Telefone/site
   - Botão Maps
   - Botão WhatsApp
   - Salvar como Lead
   - Investigar (IA)
```

---

## 💰 Venda de Insumos

Sistema integrado (em desenvolvimento):
- Ver equipamento do cliente
- Sugerir insumos compatíveis
- Alerta quando vencer (30/45/60 dias)
- Gerar mensagem automática
- Registrar venda

---

## 📤 Catálogo

Rastreamento de envios:
- SMT-120VP
- VG1, VI1
- 3DX
- VBC50A
- QT3
- Catálogo geral

Registra:
- Data enviada
- Produto
- Cliente
- Se abriu
- Se respondeu
- Próximo follow-up

---

## 📊 Auditoria

Dashboard em `/AuditDashboard`:
- **Total de ações** — Quantas foram executadas
- **Créditos consumidos** — ⚡ Total gasto
- **Taxa de sucesso** — % de ações bem-sucedidas
- **Ações com IA** — Quantas usaram IA

Gráficos:
- Créditos por módulo
- Créditos por dia
- Últimas 20 ações (módulo, status, créditos)

---

## 📋 WhatsApp Master Agent

Agente integrado com 29 IAs:

```
Link: [Fornecido na Home]

Comandos:
  pesquisa [nome] → Encontra clínica e gera briefing
  score [CNPJ] → Calcula score de crédito
  rota hoje → Otimiza sequência de visitas
  relatório → KPIs do dia
  sugestões → 3 ações recomendadas
  limpar dupl. → Remove duplicatas do CRM
```

---

## 🔧 Configuração Inicial

### 1. Entidades Criadas
- **LeadHunter** — Leads investigados
- **Client** — Clientes CRM
- **Sale** — Vendas de equipamentos
- **Task** — Tarefas e follow-ups
- **Visit** — Visitas agendadas
- **Equipment** — Produtos Seamaty
- **AuditLog** — Auditoria de ações

### 2. Backend Functions
- `superMasterHunterScan` — Scan IA zona
- `deepHunterAnalysis` — Análise lead
- `investigateLeadPublicData` — Enriquecimento manual
- `auditTracker` — Registro auditoria

### 3. Cache
- 30 dias para análises IA
- LocalStorage para settings
- Query cache 5 min para leads

---

## 📈 Metas Comerciais

**Vendendo 12+ máquinas/mês:**
1. **DeepHunter** — 5-10 leads/semana investigados
2. **SuperMaster** — 1 scan/semana profundo
3. **WhatsApp Master** — 1-2 mensagens/dia automáticas
4. **GPS Hunter** — 2-3 prospecções/semana por raio
5. **Follow-up** — Histórico completo no CRM
6. **Insumos** — Venda recorrente pós-equipamento

---

## 🛡️ Segurança

- ✅ Autenticação Base44
- ✅ RLS em dados sensíveis
- ✅ Apenas dados públicos comerciais
- ✅ Auditoria de cada ação
- ✅ Rate limiting automático
- ✅ Sem dados privados coletados

---

## 📱 Responsividade

- ✅ Desktop completo
- ✅ Tablet otimizado
- ✅ Mobile-first design
- ✅ Funciona offline (modo Leve)

---

## 🎓 Rotina Recomendada

### Segunda a Quinta
1. Abrir Home
2. Verificar "Resumo do Dia" (tarefas, visitas, alertas)
3. Usar DeepHunter + GPS Hunter
4. Visitar clientes quentes
5. Enviar catálogo
6. Registrar follow-up

### Sexta
1. Revisar Insumos (alertas de recompra)
2. Aniversários (parabéns personalizados)
3. Clientes parados (reativação)
4. Propostas abertas (follow-up)
5. Ranking semanal (próximas ações)
6. Auditoria (créditos consumidos)

---

## 🚀 Deploy

Seguir **DEPLOY_GUIDE.md** para publicar:
1. Testar login
2. Testar DeepHunter
3. Testar SuperMaster (Modo Econômico)
4. Testar ControlCenter
5. Testar AuditDashboard
6. Deploy via Base44 Dashboard

---

## 📞 Suporte

- **Dashboard Base44:** https://base44.com
- **Documentação:** Veja DEPLOY_GUIDE.md
- **Checklist:** Veja PUBLICACAO_CHECKLIST.md
- **Bugs:** Reportar via AuditDashboard + Base44 support

---

## 📊 Próximas Versões

**MVP2:**
- Briefing de Visita (ao abrir cliente)
- Ranking do Dia (top por categoria)
- Score Seamaty (cálculo 0-100)
- Mapa Sniper (visualização geo)
- Consumables Manager (alerta recompra)
- Catalog Tracking completo
- Birthday Automation

---

**Versão:** 1.0.0 RC1  
**Status:** ✅ PRONTO PARA PUBLICAÇÃO  
**Data:** 2026-05-09

Seguir DEPLOY_GUIDE.md para ir ao ar.
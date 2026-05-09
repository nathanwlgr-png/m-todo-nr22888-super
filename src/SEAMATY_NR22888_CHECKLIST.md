# ✅ SEAMATY NR22888 — Checklist de Implementação

## 🎯 OBJETIVO PRINCIPAL
Vender 12+ máquinas Seamaty/mês com máxima eficiência operacional.

---

## ✅ MÓDULOS CRIADOS

### Core Control
- [x] **SeamtyNR22888CoreControl** — Central de ON/OFF + Modo Verdade Absoluta
- [x] **SeamtyNR22888** — Página principal com guia

### Investigação
- [x] **SuperMasterHunterModal** — Busca suprema (25 leads máx, timeout 2min)
- [x] **RankingDoDiaSeamaty** — TOP 10 oportunidades por score

### Vendas
- [x] **BriefingInteligente** — Resumo + SPIN + ROI + produto ideal
- [x] **SeamtyAdminSecurity** — Autenticação + auditoria

### Rotas
- [x] Route adicionada em App.jsx: `/SeamtyNR22888`

---

## 🔧 FUNÇÕES BACKEND NECESSÁRIAS

| Função | Status | Descrição |
|--------|--------|-----------|
| `superMasterHunter` | ⏳ TODO | Busca investigativa com Google + Maps + Instagram |
| `generatePersonalizedProposal` | ⏳ TODO | Gera briefing inteligente |
| `auditTracker` | ✅ EXISTE | Registra ações para auditoria |
| `generateMarketingContent` | ✅ EXISTE | Marketing Commander |
| `generateConsumableAlerts` | ✅ EXISTE | Alertas de insumos |

---

## 📋 FUNCIONALIDADES POR MÓDULO

### ✅ Central de Controle (COMPLETO)
- [x] ON/OFF para cada módulo
- [x] Modo Supremo (liga tudo)
- [x] Desligar Tudo Pesado
- [x] Modo Econômico (IA sob demanda)
- [x] Modo Verdade Absoluta (🟢 Confirmado / 🟡 Provável / 🔴 Não Confirmado)
- [x] Persistência em localStorage

### ⏳ Super Master Hunter (ESTRUTURA, FALTA BACKEND)
- [x] Modal de configuração
- [x] Seleção de cidade (Botucatu, Marília, Garça, Bauru, Ourinhos, Jaú, Assis, Lins, Tupã, Avaré, etc)
- [x] Raio de busca (5, 10, 20, 30, 50 km)
- [x] Profundidade (Rápida/Completa/Suprema)
- [x] Segmentos (Clínica, Hospital, Laboratório, Centro Diagnóstico, Universidade)
- [x] Limite 25 leads
- [x] Estimativa de créditos
- [ ] Backend: Busca Google + Maps + Instagram + cruzamento CRM

### 🏆 Ranking do Dia (COMPLETO)
- [x] Score Seamaty (0-100)
- [x] Priorização: Raro (90+) > Urgente (75+) > Quente (60+) > Potencial (40+) > Frio
- [x] TOP 10 oportunidades
- [x] Botões rápidos (WhatsApp, Visita)
- [x] Motivos do score

### 📋 Briefing Inteligente (ESTRUTURA, FALTA DADOS)
- [x] Resumo executivo
- [x] Dores prováveis
- [x] Perguntas SPIN
- [x] Objeções prováveis + respostas
- [x] ROI + financeiro
- [x] Produto ideal
- [x] Insumos associados
- [x] Mensagem pronta
- [x] Próximo passo
- [ ] Backend: Integrar com dados do cliente

### 🔐 Segurança Admin (COMPLETO)
- [x] Autenticação com senha
- [x] Bloqueio após 3 tentativas
- [x] Log de auditoria (20 últimas ações)
- [x] Proteção de recursos críticos
- [x] Logout

### 🎚️ Intensidade Comercial (TODO)
Criar slider 1-5 que aplica em:
- [ ] WhatsApp (tom da mensagem)
- [ ] Propostas (linguagem)
- [ ] Instagram (CTA)
- [ ] Campanhas (urgência)

### 📢 Marketing Commander (EXISTE)
- [x] Criar posts, stories, reels
- [x] Integração com Marketing AI Studio
- [x] Base de copywriting veterinário

### 📸 Instagram Studio (ESTRUTURA)
Necessário:
- [ ] Integração Meta OAuth (ou modo manual)
- [ ] Agendamento de publicações
- [ ] Aprovação antes de publicar
- [ ] Histórico de posts
- [ ] Rastreamento de engagement

### 💾 Mob Vendedor Import (TODO)
- [ ] Upload de Excel/CSV
- [ ] Pré-visualização
- [ ] Mapeamento de colunas
- [ ] Detecção de duplicados (por CNPJ)
- [ ] Auditoria de importação
- [ ] Desfazer

### 📦 Gestão de Insumos (PARCIAL)
- [ ] Equipamento confirmado → sugerir insumo
- [ ] Alertas 30/45/60 dias
- [ ] Sugestão de recompra
- [ ] Integração WhatsApp

### 🎁 Aniversários (TODO)
- [ ] Salvar data do responsável + clínica
- [ ] Lembretes automáticos (sem envio automático)
- [ ] Pedir aprovação antes enviar
- [ ] Registrar envio

### 📚 Biblioteca Seamaty (TODO)
- [ ] Galeria de logos, banners, fotos
- [ ] Filtro por categoria
- [ ] Download para usar em campanhas

---

## 🚨 PRINCÍPIOS OBRIGATÓRIOS

✅ **Verdade Absoluta:**
- [x] Nunca inventar dados, clientes, telefones, cidades
- [x] Nunca afirmar sem confirmação
- [x] Usar 🟢 Confirmado / 🟡 Provável / 🔴 Não Confirmado
- [x] Separar hipótese de fato

✅ **Custos:**
- [x] Toda IA é sob demanda (clique, não background)
- [x] Nenhum crédito sem aprovação
- [x] Modo Econômico: IA somente clique + cache 30 dias
- [x] Mostrar estimativa antes de executar

✅ **Automação:**
- [x] Nenhuma mensagem enviada sozinha
- [x] Nenhuma publicação automática
- [x] Sempre pedir aprovação
- [x] Nunca scraping ilegal

✅ **UX:**
- [x] Mobile-first
- [x] Tablet-first
- [x] Rápido e simples
- [x] Modo Offline para dados críticos

---

## 🛠️ FUNÇÕES A CRIAR

### 1. `superMasterHunter` (CRÍTICA)
```javascript
Entrada:
- city: string
- radius_km: number
- depth: 'rapid' | 'complete' | 'supreme'
- segments: string[]
- quantity: number (max 25)

Saída:
- results_count: number
- leads: []
  - name
  - cnpj
  - city
  - distance_km
  - phone
  - website
  - instagram
  - maps_url
  - score_seamaty (0-100)
  - priority (raro|urgente|quente|potencial|frio)
  - potencial_seamaty (VG2, SMT, etc)
  - potencial_insumo (reagentes, rotores)
  - next_action
  - data_sources (Google, Maps, Instagram, Facebook, Website)

Cache: 30 dias por (cidade, raio, depth, segments)
Timeout: 2 minutos máximo
```

### 2. `generatePersonalizedProposal` (UPDATE)
Adicionar modo: `briefing_inteligente`
```javascript
Entrada:
- client_id
- client_data
- mode: 'briefing_inteligente'

Saída:
- summary
- pains: []
- spin_questions: [{type, question, goal}]
- probable_objections: [{objection, response}]
- roi: {investment, payback, monthly_savings, main_argument}
- ideal_product: {name, description, consumables: []}
- ready_message
- next_step
```

### 3. `generateMarketingContentSeamaty` (NEW)
```javascript
Entrada:
- product: 'SMT-120VP' | 'VG2' | etc
- sales_angle: 'roi' | 'speed' | 'retention' | 'quality'
- platform: 'instagram' | 'whatsapp' | 'email'
- intensity: 1-5

Saída:
- headline
- caption
- cta
- hashtags
- design_prompt
- colors: {primary, secondary}
- target_audience
```

### 4. `importMobVendedorData` (NEW)
```javascript
Entrada:
- file: File (CSV/Excel/JSON)
- mapping: {crm_field: file_column}

Saída:
- preview: rows[]
- duplicates_found: number
- ready_to_import: boolean
- errors: []
```

### 5. `auditTracker` (USAR EXISTENTE)
```javascript
- super_master_hunter_search
- briefing_generated
- instagram_scheduled
- mob_import
- admin_login
- failed_login
```

---

## 📊 SCORE SEAMATY (0-100)

| Pontos | Critério |
|--------|----------|
| +20 | 🔴 Emergência (sem contato há 30+ dias) |
| +15 | 📤 Envia exame para fora (sem equipamento) |
| +15 | ⏰ Cliente parado (proposta há 30+ dias) |
| +15 | 🌟 Cidade estratégica |
| +10 | 📈 Crescimento (múltiplas compras) |
| +10 | 💻 Forte digital (Instagram/Website) |
| +10 | 🎪 Comodato (clínica pequena sem equip) |
| +10 | ⚙️ Gap equipamento (tem velho) |
| +5 | 👑 Influência regional (hospital/lab) |
| +5 | 📦 Potencial insumo (tem equip confirmado) |

**Classificação:**
- 🔴 0-39: Frio
- 🟠 40-59: Potencial
- 🟡 60-74: Quente
- 🔥 75-89: Urgente
- 🌟 90-100: Raro

---

## 🗺️ CIDADES VÁLIDAS

✅ Permitidas:
- Botucatu, Marília, Garça, Bauru, Ourinhos, Jaú, Assis, Lins, Tupã, Avaré
- Tietê, Agudos, Pederneiras, Iacanga, Igaraçu do Tietê, Novo Horizonte, São Manuel
- Todas do CRM/planilha do Nathan (normalizar duplicatas)

❌ Não permitidas:
- Ribeirão Preto
- Presidente Prudente

---

## 🔌 INTEGRAÇÕES

### Instagram Studio
- [ ] Meta Official API (ou modo manual)
- [ ] OAuth seguro (nunca pedir senha)
- [ ] Agendamento
- [ ] Aprovação antes publicar
- [ ] Rastreamento

### WhatsApp
- [ ] Integração com número oficial Seamaty
- [ ] Mensagens sob aprovação
- [ ] Histórico
- [ ] Templates

### Google Calendar (EXISTE)
- [ ] Sincronização de visitas
- [ ] Lembretes

### CRM (EXISTE)
- [ ] Importação de clientes
- [ ] Sincronização de dados
- [ ] Logs de atividade

---

## 🎯 PRÓXIMOS PASSOS

### Fase 1 — CRÍTICA (Esta semana)
- [ ] Criar função `superMasterHunter` (backend)
- [ ] Testar Super Master Hunter com 5 cidades
- [ ] Implementar Intensidade Comercial (slider)
- [ ] Integração Briefing com dados reais

### Fase 2 — ALTA (Próxima semana)
- [ ] Instagram Studio (OAuth ou manual)
- [ ] Mob Vendedor Import
- [ ] Aniversários + Follow-up automático

### Fase 3 — MÉDIA (Semanas 3-4)
- [ ] Biblioteca Seamaty
- [ ] Gestão de Insumos (alertas)
- [ ] Marketing Commander (templates)

### Fase 4 — OTIMIZAÇÃO
- [ ] Cache inteligente de 30 dias
- [ ] Modo Offline completo
- [ ] Testes mobile/tablet
- [ ] Performance

---

## 📱 TESTES OBRIGATÓRIOS

- [ ] Mobile (iPhone, Android)
- [ ] Tablet (iPad, Android tablet)
- [ ] Desktop (Chrome, Firefox, Safari)
- [ ] GPS Hunter (acurácia)
- [ ] Instagram manual (copiar/colar)
- [ ] Catálogo (envio)
- [ ] IA cache (30 dias sem re-processing)
- [ ] Auditoria (log completo)
- [ ] Segurança (autenticação admin)
- [ ] Build final (sem erros)

---

## 🎓 COMO USAR NO DIA A DIA

### Manhã:
1. Ir para `/SeamtyNR22888`
2. Clicar em **Ranking do Dia** → Ver TOP 10 oportunidades
3. Clicar em cliente → Abrir **Briefing Inteligente**
4. Copiar mensagem pronta → Enviar via WhatsApp

### Tarde:
1. Novo prospecto? Clicar **Super Master Hunter**
2. Selecionar cidade + profundidade
3. Obter TOP 25 leads com score
4. Contatar quentes (score 60+)

### Administrativa:
1. **Marketing Commander** → Criar post do dia
2. **Instagram Studio** → Agendar publicação
3. **Mob Vendedor** → Importar novos clientes
4. **Auditoria** → Revisar logs

### Financeira:
1. **Painel Financeiro** → Ver ROI por cliente
2. **Gestão de Insumos** → Alertar recompra
3. **Consumo IA** → Verificar créditos

---

## 🎉 META FINAL: 12+ Seamaty/mês com máxima eficiência!
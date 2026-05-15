# ⚡ CHECKLIST DEPLOY RÁPIDO NR22888

**Versão:** 1.0 | **Tempo:** ~15 minutos | **Risco:** BAIXO

---

## 🔴 PRÉ-DEPLOY (5 min)

```
[ ] npm run build
    └─ Deve terminar SEM erros
    └─ Output: dist/ criado

[ ] npm run preview
    └─ Deve abrir sem erro
    └─ URL: http://localhost:4173
    └─ Clicar Home → deve carregar <3s

[ ] DevTools Console
    └─ Sem erros vermelhos
    └─ Avisos são OK
```

---

## 🟡 VALIDAÇÃO HOME (3 min)

```
[ ] Home page
    ├─ Carrega em 2-3s
    ├─ Banner hero visível
    ├─ KPIs aparecem (clientes, tarefas, msgs)
    ├─ EconomicModeControlPanel visível
    ├─ 9 quick links aparecem
    └─ Sem travamentos

[ ] Lazy components
    ├─ SniperDoDia carrega após 500ms
    ├─ ComodatoMonitor após 1s
    ├─ WeeklyHealthReport após 1.5s
    └─ Nenhum erro console

[ ] Offline indicator
    ├─ Status visível
    ├─ PWA checklist funciona
    └─ Botão sincronização presente
```

---

## 🟢 FUNCIONALIDADES (5 min)

### WhatsApp Master
```
[ ] Link WhatsApp no Home
    ├─ Clica → abre chat WhatsApp agent
    ├─ Mostra: "🔥 NR22888 — Agente Master"
    └─ Descrição: "WhatsApp • 29 IAs • CRM Total"

[ ] Central IA Master
    ├─ Clica → abre CentralIAMaster
    ├─ 9 botões aparecem
    ├─ Clicar /ranking → responde <3s
    └─ Nenhum erro console
```

### Rotas Críticas
```
[ ] /Clients
    ├─ Lista clientes (cache)
    ├─ Score mostra para cada um
    └─ Sem travamentos

[ ] /TasksUnified
    ├─ Lista tarefas
    ├─ Criar nova → funciona
    └─ Filtros funcionam

[ ] /CentralIAMaster
    ├─ /briefing funciona
    ├─ /ranking funciona
    ├─ /rota funciona
    └─ Consumo trackado no EconomicMode
```

### Offline
```
[ ] DevTools → Network → Offline
    ├─ Home ainda carrega (cache)
    ├─ Clientes listam
    ├─ Sem erro "failed to fetch"

[ ] Voltar Online
    ├─ Sync automático
    ├─ Dados atualizados
    └─ Badge "sincronizando" desaparece
```

---

## 🟢 CONSUMO IA (2 min)

```
[ ] EconomicModeControlPanel
    ├─ Mostra: $X.XX gasto
    ├─ Mostra: Y% usado
    ├─ Mostra: Z chamadas hoje
    ├─ Mostra: modelo selecionado
    └─ Sem erros de undefined

[ ] localStorage
    ├─ Abrir DevTools → Console:
    │   localStorage.getItem('economicMode_v2')
    ├─ Deve retornar JSON com state
    └─ Verificar: monthlySpent, callsUsedToday, enabled
```

---

## 📱 MOBILE (Se aplicável - 2 min)

```
[ ] DevTools → iPhone SE (375x667)
    ├─ Home carrega
    ├─ Grid 3 colunas funciona (pode ser pequeno)
    └─ Nenhum overflow horizontal

[ ] DevTools → Tablet (1024x768)
    ├─ Home carrega
    ├─ Layout responsivo
    └─ Todos botões acessíveis

⚠️ NOTA: Testar em device REAL (Samsung 800x1280)
   depois do deploy para ajustar se necessário
```

---

## 🚀 DEPLOY (Depende da plataforma)

```
[ ] Build pronto
    └─ dist/ contém:
        ├─ index.html
        ├─ assets/
        └─ manifest.json (PWA)

[ ] Deploy command (exemplo)
    └─ npm run deploy
    ou manual upload dist/ para hosting

[ ] Aguardar build
    └─ Deve terminar <1 min
    └─ Sem erros

[ ] Validar produção
    ├─ Acessar app.seamaty.com.br (ou URL final)
    ├─ Home carrega
    ├─ Sem console errors
    └─ EconomicMode funciona
```

---

## 🔍 PÓS-DEPLOY (5 min)

```
[ ] Produção
    ├─ Home.jsx → carrega <3s
    ├─ WhatsApp → responde /ranking <3s
    ├─ Offline → cache funciona
    ├─ Consumo → EconomicMode trackado
    └─ Console → 0 erros críticos

[ ] Monitoramento
    ├─ Verificar consumo OpenAI (deve ser <$1 no deploy)
    ├─ Verificar AIInteractionLog (comandos / aparecem)
    ├─ Verificar offline sync (mensagens pendentes)
    └─ Nenhum erro crítico

[ ] Finalizar
    ├─ Notificar Nathan: ✅ Deploy bem-sucedido
    ├─ Enviar links: Home | WhatsApp Master | Central IA
    └─ Pedir feedback: Mobile, UX, performance
```

---

## ✅ SE TUDO OK

```
🟢 DEPLOY CONCLUÍDO COM SUCESSO

Próximos passos:
  1. Monitoramento primeiros 3 dias
  2. Relatório semanal consumo OpenAI
  3. Ajustes mobile conforme feedback
  4. Documentação final para Nathan
```

---

## 🚨 SE ALGO QUEBRAR

### Rápido Rollback
```
OPÇÃO 1: Revert commit anterior
  git revert HEAD
  npm run build
  npm run deploy

OPÇÃO 2: Limpar cache
  localStorage.clear()
  Cache Storage → limpar todos
  Reload página

OPÇÃO 3: Desabilitar IA temporariamente
  economicModeV2.enabled = false
  CRM continua 100% funcional
  (avisar Nathan)
```

### Erro Comum: "Cannot read properties of undefined"
```
Solução:
  1. Verificar localStorage.getItem('economicMode_v2')
  2. Se vazio → limpar cache
  3. Se persiste → verificar EconomicModeV2.js
  4. Confirmar inicialização em constructor
```

---

## 📊 TEMPOS ESPERADOS

```
Build:        1-2 min ✅
Deploy:       <1 min ✅
Home load:    2-3 seg ✅
AI Command:   1-3 seg ✅
Offline sync: <1 seg ✅
```

---

## ✅ CHECKLIST RESUMIDO

```
PRÉ-DEPLOY:
  ✅ npm run build (sem erros)
  ✅ npm run preview (funciona)
  ✅ Console (sem erros críticos)

HOME PAGE:
  ✅ Carrega <3s
  ✅ KPIs aparecem
  ✅ EconomicMode visível

FUNCIONALIDADES:
  ✅ WhatsApp link funciona
  ✅ Central IA /ranking funciona
  ✅ Clientes listam
  ✅ Offline funciona

PÓS-DEPLOY:
  ✅ App abre
  ✅ Consumo trackado
  ✅ Sem console errors

🎯 DEPLOY PRONTO!
```

---

**Tempo Total:** ~15 minutos  
**Risco:** BAIXO  
**Rollback:** <5 minutos  
**Status:** ✅ PRONTO
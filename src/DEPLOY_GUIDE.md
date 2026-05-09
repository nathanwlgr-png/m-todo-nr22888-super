# 🚀 GUIA DE DEPLOY — SEAMATY DEEPHUNTER

## Pré-Deploy (5 min)

### 1. Verificar Builds
```bash
# No terminal Base44:
npm run build
# Verificar se há erros
```

### 2. Testar Login
- [ ] Acessar app em preview
- [ ] Fazer login com email de teste
- [ ] Dashboard carrega normalmente

### 3. Testar Funcionalidades Críticas
```
DeepHunter:
- [ ] Buscar leads existentes
- [ ] Analisar lead com IA
- [ ] Adicionar empresa manual

SuperMasterHunter:
- [ ] Abrir botão ⚠️
- [ ] Confirmar modal
- [ ] Executar scan (pode consumir crédito — usar Econômico primeiro)

ControlCenter:
- [ ] Abrir Settings (canto inferior direito)
- [ ] Toggle módulo ON/OFF
- [ ] Mudar modo Econômico/Supremo
- [ ] Fechar sem erros

AuditDashboard:
- [ ] Acessar /AuditDashboard
- [ ] Ver logs e gráficos
- [ ] Verificar KPIs
```

---

## Deploy via Base44 Dashboard

### Opção 1: Web Dashboard
1. Acesse https://base44.com/dashboard
2. Selecione seu app
3. Clique "Publish" ou "Deploy"
4. Aguarde confirmação (geralmente 1-2 min)
5. Teste app em produção

### Opção 2: CLI (se disponível)
```bash
base44 login
base44 deploy
```

---

## Pós-Deploy (5 min de validação)

### URLs Críticas
- **Home:** https://[seu-app].base44.com/
- **DeepHunter:** https://[seu-app].base44.com/DeepHunter
- **AuditDashboard:** https://[seu-app].base44.com/AuditDashboard
- **Agente WhatsApp:** Ver WhatsApp Master Agent link

### Testar em Produção
1. **Mobile:** Abrir em celular, testar DeepHunter
2. **Tablet:** Verificar responsividade
3. **Desktop:** Teste completo
4. **Offline:** Se Modo Offline habilitado, desligar internet e testar cache

### Checklist Final
- [ ] Login funciona
- [ ] Home carrega sem erros
- [ ] DeepHunter busca leads
- [ ] SuperMaster executa (Modo Econômico)
- [ ] ControlCenter salva settings
- [ ] AuditDashboard mostra logs
- [ ] WhatsApp Master Agent acessível
- [ ] Nenhum erro no console

---

## Rollback (Se necessário)

### Via Dashboard
1. Vá para versões anteriores
2. Clique "Restore"

### Ou espere build anterior
- Base44 mantém histórico automático
- Contacte suporte@base44.com se emergência

---

## Monitoramento Pós-Deploy

### Auditoria
- Verificar `/AuditDashboard` regularmente
- Monitorar consumo de créditos
- Reportar erros ao suporte Base44

### Feedback
- Testar com usuário real
- Validar módulos críticos
- Documentar bugs/improvements

---

## Configuração Comercial

### Agente WhatsApp Master
```
URL: https://[seu-app].base44.com/
Link WhatsApp: [fornecido na página Home]
Comandos:
  - pesquisa [nome] → encontra clínica
  - score [CNPJ] → calcula score
  - rota hoje → otimiza visitas
  - relatório → gera KPIs
  - sugestões → 3 ações do dia
  - limpar dupl. → remove duplicatas
```

### Modo Operacional Recomendado
- **Segunda-Quinta:** Modo Econômico + GPS + DeepHunter
- **Sexta:** Modo Supremo + Auditoria completa
- **Gerentes:** Acesso AuditDashboard + ControlCenter

---

## Suporte & Troubleshooting

### Erro "Function not found"
- Verificar se backend functions foram criadas
- Redeployar funções via `base44 functions deploy`

### Erro "Entity not found"
- Verificar entidades em `entities/` estão criadas
- Testar criar lead manualmente em Clients

### Performance lenta
- Ativar Modo Offline/Leve
- Limpar cache: `localStorage.clear()`
- Contatar Base44 para análise

### Créditos consumindo rápido
- Usar Modo Econômico
- Desativar IA em ControlCenter
- Usar cache mais (dados já analisados)

---

## Contato

**Base44 Support:** support@base44.com  
**Documentação:** https://base44.com/docs  
**Status:** Production Ready ✅

---

**Versão Deploy:** 1.0.0  
**Data:** 2026-05-09  
**Approved:** ✅ Ready for Production
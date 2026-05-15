# 🔑 MODO ECONOMIA NR22888 - GUIA IMPLEMENTAÇÃO

## Objetivo Geral
Reduzir consumo OpenAI de **~$500/mês** para **$20/mês** mantendo CRM funcional.

---

## 📊 Arquitetura Implementada

### 1️⃣ `lib/EconomicModeV2.js` - Controle Central
**Responsabilidades:**
- ✅ Orçamento mensal: **$20 USD**
- ✅ Limite diário: **~$0.67**
- ✅ Limite de calls: **50/dia**
- ✅ Cache inteligente: **24h TTL**
- ✅ Seleção automática de modelo:
  - `gpt-4.1-mini` se > 95% orçamento
  - `gpt-4o-mini` se 80-95%
  - `gpt-4o` se < 80%
- ✅ Log de consumo por função
- ✅ Alertas em 50%, 75%, 90% (para Nathan)

### 2️⃣ `lib/SafeAICallV2.js` - Wrapper de Segurança
**Protege toda chamada IA:**
- ✅ Verifica cache antes
- ✅ Valida modo economia
- ✅ Exige aprovação se necessário
- ✅ Aplica timeout
- ✅ Bloqueia retries infinitos
- ✅ Debounce automático

### 3️⃣ `lib/AIFunctionsWithEconomy.js` - Wrappers por Função
**Para cada função IA:**
```javascript
// Exemplo: SPIN SELLING
export async function generateSpinWithEconomy(clientId, userApproval = false) {
  // 1. Exigir aprovação manual
  if (!userApproval) return { requiresApproval: true };
  
  // 2. Verificar cache 24h
  const cached = economicModeV2.getCache(`spin_${clientId}`);
  if (cached) return { data: cached, source: 'cache' };
  
  // 3. Verificar mode
  if (!economicModeV2.canMakeAICall('generateSpinSellingMessages')) {
    return { error: 'ECONOMY_MODE', status: economicModeV2.getStatus() };
  }
  
  // 4. Chamar com modelo automático
  const res = await base44.functions.invoke('generateSpinSellingMessages', {
    clientId,
    model: economicModeV2.selectOptimalModel(),
    maxTokens: 300
  });
  
  // 5. Registrar consumo
  economicModeV2.registerTokenUsage(
    'generateSpinSellingMessages',
    res.data?.tokensUsed || 300
  );
  
  return res;
}
```

### 4️⃣ `functions/economicModeAICall.js` - Backend Handler
**Centraliza todas chamadas IA:**
- ✅ Rate limiting diário (50 calls)
- ✅ Seleção automática de modelo
- ✅ Cache 2h em memória
- ✅ Log de consumo
- ✅ Detecção de quota excedida

### 5️⃣ `components/EconomicModeControlPanel.jsx` - Monitor Visual
**Painel flutuante com:**
- ✅ Saldo mensal / percentual gasto
- ✅ Chamadas usadas hoje
- ✅ Modelo IA ativo
- ✅ Cores adaptativas (green/yellow/orange/red)
- ✅ Detalhamento por função
- ✅ Alertas de crítico

---

## 🎯 Regras Obrigatórias Implementadas

### NUNCA executar IA automaticamente
❌ Ao abrir página  
❌ Ao digitar  
❌ Ao fazer scroll  
❌ Em loop de dados  
✅ SOMENTE ao clicar button explícito

### FUNÇÕES QUE EXIGEM APROVAÇÃO
1. **generateSpinSellingMessages** - Exigir clique "Gerar Mensagem"
2. **generateWhatsAppProposal** - Exigir confirmação modal
3. **investigacaoCampoReal** - Exigir autorização com detalhes

### FUNÇÕES COM CACHE 24H
- SPIN SELLING (key: `spin_${clientId}`)
- WHATSAPP PROPOSAL (key: `proposal_${clientId}`)
- MARKETING (key: `marketing_${clientId}_${type}`)
- ANÁLISE (key: `analysis_${clientId}_${type}`)
- NUMEROLOGIA (key: `numerology_${clientId}`)

### FUNÇÕES QUE PODEM RODAR
- Briefing de visita (sob aprovação)
- Geração WhatsApp (sob aprovação)
- Marketing IA (cache 24h)
- Investigação (sob aprovação)
- Análise comercial (sob comando)
- Numerologia (sem aprovação - info)

### FUNÇÕES QUE NÃO USAM IA
✅ CRM / Clientes  
✅ Agenda  
✅ Rotas  
✅ Dashboard  
✅ WhatsApp manual  
✅ Cadastro  
✅ Funil de vendas  
✅ Alertas  
✅ Histórico  

---

## 🔧 Como Integrar em Páginas

### Template para Geração SPIN
```jsx
import { generateSpinWithEconomy, getAIStatus } from '@/lib/AIFunctionsWithEconomy';
import EconomicModeControlPanel from '@/components/EconomicModeControlPanel';

export default function MyPage() {
  const [messages, setMessages] = useState([]);
  const [showApproval, setShowApproval] = useState(false);

  const handleGenerateSPIN = async () => {
    setShowApproval(true); // Exigir aprovação do usuário
  };

  const confirmGenerate = async () => {
    const result = await generateSpinWithEconomy(clientId, true); // userApproval = true
    
    if (result.requiresApproval) {
      toast.error('Exigir aprovação do usuário');
      return;
    }
    
    if (result.error === 'ECONOMY_MODE') {
      toast.error('Modo Economia ativo. Tente mais tarde.');
      return;
    }
    
    setMessages(result.data?.messages || []);
    toast.success(`Mensagens geradas! (Cache: ${result.source === 'cache' ? 'Sim' : 'Não'})`);
  };

  return (
    <div>
      <Button onClick={handleGenerateSPIN}>Gerar Mensagens SPIN</Button>
      
      {showApproval && (
        <Modal>
          <p>Usar IA para gerar 3 mensagens SPIN?</p>
          <Button onClick={confirmGenerate}>Sim, gerar</Button>
        </Modal>
      )}
      
      {/* Painel automático */}
      <EconomicModeControlPanel />
    </div>
  );
}
```

### Template para Investigação Campo
```jsx
import { investigateClinicWithEconomy } from '@/lib/AIFunctionsWithEconomy';

const handleInvestigate = async () => {
  // Exigir aprovação com confirmação
  const confirmed = window.confirm(
    `Analisar clínica? Consumirá tokens IA.\n\nStatus: ${getAIStatus().percentageUsed}% do orçamento`
  );
  
  if (!confirmed) return;
  
  const result = await investigateClinicWithEconomy(clinicData, true);
  
  if (result.error === 'ECONOMY_MODE') {
    showAlert('Orçamento IA esgotado. Volte amanhã.');
    return;
  }
  
  setAnalysis(result.data);
};
```

---

## 📈 Modelo Econômico

### Consumo Estimado
| Função | Tokens | Custo | Limite |
|--------|--------|-------|--------|
| SPIN Selling | 300 | $0.006 | 3x/dia |
| Proposal | 500 | $0.010 | 2x/dia |
| Investigação | 800 | $0.016 | 1x/dia |
| Marketing | 400 | $0.008 | 2x/dia |
| Análise | 600 | $0.012 | 5x/dia |

### Orçamento Mensal
```
Total: $20 USD / mês
Diário: $0.67 USD
Máximo: 50 chamadas/dia
Modelo padrão: gpt-4o-mini
```

---

## 🚨 Comportamento em Modo ECONOMICO

### Quando 80% do orçamento
```javascript
modeLevel = 'ECONOMICO'
model = 'gpt-4o-mini' // menos tokens
maxTokens = 250 // reduzido
```

### Quando 95% do orçamento
```javascript
modeLevel = 'ECONOMICO'
model = 'gpt-4.1-mini' // mais barato ainda
maxTokens = 150 // bem reduzido
```

### Quando 100% do orçamento
```javascript
canMakeAICall() = false
IA bloqueada até próximo mês
Sistema entra em "MODO OFFLINE CRM"
App continua 100% funcional sem IA
```

---

## 📋 Checklist de Migração

- [ ] EconomicModeV2.js criado
- [ ] SafeAICallV2.js criado
- [ ] AIFunctionsWithEconomy.js criado
- [ ] economicModeAICall.js criado
- [ ] EconomicModeControlPanel adicionado ao App.jsx
- [ ] GenerateWhatsAppIntegrated migrada para novo wrapper
- [ ] CentralIAMaster migrada para novo wrapper
- [ ] Todas páginas IA com aprovação manual
- [ ] Cache 24h testado
- [ ] Rate limiting testado
- [ ] Alertas em 50/75/90% testados
- [ ] Modo offline CRM testado

---

## 🎮 Teste Manual

```bash
# 1. Abrir painel de controle
# Deve aparecer painel flutuante com status

# 2. Gerar mensagem SPIN
# Deve exigir clique "Confirmar"
# Deve aparecer no log do painel

# 3. Gerar segunda vez (mesmo cliente)
# Deve vir do cache
# Deve mostrar "source: cache"

# 4. Simular 80% consumo (dev tools)
# localStorage economicMode_v2 → monthlySpent = 16
# Deve mudar para gpt-4o-mini

# 5. Simular 95% consumo
# localStorage economicMode_v2 → monthlySpent = 19
# Deve mudar para gpt-4.1-mini

# 6. Simular 100% consumo
# localStorage economicMode_v2 → monthlySpent = 20
# Deve bloquear chamadas com "ECONOMY_MODE"
```

---

## 🔐 Segurança & Controle

**Quem pode resetar?**
- Admin via localStorage
- Command: `economicModeV2.resetMonth()`

**Como monitorar?**
- Painel EconomicModeControlPanel flutuante
- Detalhamento por função
- Log de consumo em AIInteractionLog

**Como alertar Nathan?**
- Implementar em `checkAndSendAlerts()`
- Via WhatsApp em 50%, 75%, 90%
- Via email em 90% (crítico)

---

## 📝 Notas Finais

**Prioridade implementada:**
1. ✅ Estabilidade (CRM funciona sem IA)
2. ✅ Economia (reduz consumo drasticamente)
3. ✅ IA avançada (quando orçamento permite)

**Diferencial:**
- Sistema NOT quebra sem OpenAI
- Cache agressivo (24h)
- Aprovação obrigatória para funções caras
- Modelo automático conforme budget
- Monitor visual em tempo real

---

**Build: 2026-05-15 14:30**
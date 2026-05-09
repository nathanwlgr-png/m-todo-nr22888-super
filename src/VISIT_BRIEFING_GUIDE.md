# 📋 BRIEFING DE VISITA + GALERIA SEAMATY + MOB VENDEDOR

**Status:** ✅ IMPLEMENTADO  
**Data:** 2026-05-09  
**Objetivo:** Módulo completo de preparação de visita com dados confirmados, sugestão inteligente de produtos e importação de inventário.

---

## 🎯 MÓDULO 1: BRIEFING DE VISITA

### O que faz:
Gera um resumo estruturado do cliente com **dados confirmados** (Modo Verdade Absoluta) e os **3 produtos com maior probabilidade de venda**.

### Como usar:

**Acesso:**
```
ClientProfile → Botão "Briefing de Visita"
ou
https://[seu-app].base44.com/VisitBriefing?clientId=[ID]
```

### Dados Mostrados

#### Seção 1: Dados Confirmados do Cliente
| Campo | Origem | Validação |
|-------|--------|-----------|
| **Localização** | CRM | ✓ Confirmado |
| **Tipo de Cliente** | CRM | ✓ Enum validado |
| **Equipamento Atual** | CRM | ✓ Informado |
| **Orçamento Disponível** | CRM | ✓ Range 0-150k |
| **Último Contato** | CRM | ✓ Data confirmada |
| **Status** | CRM | ✓ quente/morno/frio |

#### Seção 2: Necessidades de Laboratório
```
Vem do campo "lab_needs" do cliente
Exemplo:
- hemograma
- bioquimico
- hemogasio
- imunofluorescencia
```

#### Seção 3: Top 3 Produtos Recomendados
**Algoritmo de scoring:**

```
Score = 0

IF cliente SEM equipamento + produto é hematológico:
  Score += 50 (alta prioridade)

IF cliente tem VG1 + produto é VG2:
  Score += 40 (upgrade direto)

IF cliente JÁ COMPROU esse SKU:
  Score += 30 (confiança, pode vender consumíveis)

IF lab_needs inclui esse tipo:
  Score += 35 (atende necessidade identificada)

IF produto com validade válida:
  Score += 10

IF quantidade > 0:
  Score += 5

VENCIDO:
  Score -= 50 (elimina)

TOP 3 = Ordenar descente, pegar primeiros 3
```

### Dados Mostrados por Produto

Para cada um dos 3 recomendados:
- **Nome + Modelo** (ex: "SMT-120VP")
- **Score de Recomendação** (0-100%)
- **Preço** (R$)
- **Quantidade Disponível**
- **Status de Validade** (se aplicável)
- **Notas** (observações do importador)

### PDF Download

Botão **"Download PDF"** gera documento de visita com:
- ✓ Dados do cliente
- ✓ 3 produtos recomendados
- ✓ Próximas ações sugeridas

### Modo Verdade Absoluta - Garantido

```
🔒 REGRAS:
1. Nunca hipótese — apenas dados no CRM
2. Se campo vazio → marcar como "❓" ou "❌ Não informado"
3. Se dúvida → marcar "VALIDAR EM VISITA"
4. Próximas ações lembram de confirmar na visita
```

---

## 🖼️ MÓDULO 2: GALERIA SEAMATY

### O que faz:
Repositório centralizado de imagens Seamaty com **metadados e regras de uso**, permitindo que Marketing AI Studio consulte antes de incluir imagens.

### Como usar:

**Acesso:**
```
Menu → Configurações Marketing → Galeria Seamaty
ou
https://[seu-app].base44.com/MarketingConfig?tab=gallery
```

### Estrutura de uma Imagem

#### Metadados Obrigatórios
```
- Título: "Logo Seamaty Horizontal"
- Categoria: logo | produto | equipamento | case_sucesso | tecnico | marketing
- Proprietário dos Direitos: "Seamaty" | "Nosso Negócio" | "Cliente"
```

#### Regras de Uso (Configuráveis)

| Regra | Significado | Efeito no Marketing AI |
|-------|-----------|----------------------|
| **comercial** | Pode usar em anúncios pagos | ✓ Aprova automático |
| **educativo** | Apenas conteúdo educativo | ⚠️ Aviso ao gerar |
| **interno** | Apenas para time interno | ❌ Bloqueia Marketing AI |
| **sem_restricao** | Uso livre | ✓ Aprova automático |
| **sob_demanda** | Precisa pedir autorização | ⚠️ Requer revisão |

#### Metadados Adicionais

```
- Produto Relacionado: SMT-120VP (opcional)
- Precisa Crédito: [ ] (obrigatório mencionar fonte)
- Crédito Obrigatório: "Imagem © Seamaty 2026"
- Permite Modificação: [Sim/Não]
- Data de Expiração: 2026-12-31 (opcional)
- Aprovada para Marketing AI: [Sim/Não]
- Tags: ["hematologia", "diagnostico", "rapido"]
```

### Fluxo de Adição de Imagem

1. **Clique "Adicionar Imagem"**
2. **Preencha:**
   - URL da imagem
   - Título
   - Categoria
   - Proprietário
3. **Configure Regras:**
   - Restrições de uso
   - Crédito obrigatório?
   - Pode modificar?
4. **Aprove para Marketing AI Studio**
5. **Salve**

### Como Marketing AI Usa Regras

Quando Marketing AI Studio gera conteúdo:

```
1. Procura imagem no catálogo
2. Verifica "approved_for_marketing_ai"
3. Verifica restrições:
   - "interno" → NÃO usa (bloqueia)
   - "sob_demanda" → usa com aviso
   - "comercial/educativo" → aprova
4. Se "required_credit":
   → Adiciona "#FotoSeamaty" ou crédito obrigatório
5. Se "can_modify":
   → Pode editar no Canva
   → Senão, apenas use como-está
```

### Galeria Visual

Grid mostra:
- **Thumbnail** da imagem
- **Título + Categoria**
- **Restrições** (badges coloridas)
- **Status de Aprovação** (verde = OK, amarelo = pendente)
- **Botões:** Editar | Remover

---

## 📦 MÓDULO 3: IMPORTADOR MOB VENDEDOR

### O que faz:
Importa inventário do seu tablet (Mob Vendedor) automaticamente, **valida dados** e atualiza catálogo Seamaty para uso em Marketing AI Studio.

### Como usar:

**Acesso:**
```
Menu → Configurações Marketing → Importar Mob Vendedor
ou
https://[seu-app].base44.com/MarketingConfig?tab=importer
```

### Formatos Aceitos

- ✓ **CSV** (.csv) — Separado por vírgula
- ✓ **Excel** (.xlsx, .xls) — Planilha

### Estrutura do Arquivo

Mínimo esperado (colunas):

```
SKU | Produto | Categoria | Modelo | Preço | Quantidade | Localização
----------------------------------------
001 | Analisador VG2 | Analisador Hematológico | VG2 | 45000 | 2 | Galpão A
002 | Rotor Hematologia | Consumível | Hematologia | 1500 | 50 | Prateleira 3
003 | SMT-120VP | Analisador | SMT-120VP | 35000 | 1 | Exibição
```

**Colunas opcionais:**
```
Fornecedor | Data Validade (YYYY-MM-DD)
```

### Validação Automática

O sistema valida **cada linha**:

```
✓ SKU não vazio
✓ Produto não vazio
✓ Categoria mapeada (ou aviso)
✓ Preço >= 0
✓ Quantidade >= 0
✓ Data validade em formato YYYY-MM-DD
✓ Data validade no futuro (reagentes)
```

Se um campo falhar → **Erro registrado**, linha **não importada**.

### Mapeamento de Categoria

```
"Analisador Hematológico" → analisador_hematologico
"Hematológico" → analisador_hematologico
"Analisador Bioquímico" → analisador_bioquimico
"Bioquímico" → analisador_bioquimico
"Contador" → contador_celulas
"Gasômetro" → gasometro
"Ultrassom" → ultrassom
"Acessório" → acessorio
"Reagente" → reagente
```

### Resultado da Importação

Mostra 3 cards:

| Card | Significado | Ação |
|------|-------------|------|
| **Importados** | Linhas criadas com sucesso | ✓ Prontos para vender |
| **Validados** | Linhas sem erros | ✓ Qualidade OK |
| **Erros** | Linhas rejeitadas | ⚠️ Revisar e corrigir |

### Exemplo de Erro

```
"SKU-001: Preço não pode ser negativo; Data de validade inválida"
```

### Após Importação

1. **Produtos aparecem em 5 minutos** no Marketing AI Studio
2. **Catálogo Seamaty atualizado** — sugestões de venda mais precisas
3. **Briefing de Visita mostra produtos do inventário** — recomendações reais
4. **Histórico mantido** — cada import rastreado (origem + data)

---

## 🔄 INTEGRAÇÃO ENTRE MÓDULOS

### Fluxo Completo: Visita → Venda

```
1️⃣ IMPORTAR (Mod 3)
   Upload Mob Vendedor.xlsx
   Validação automática
   ✓ 50 produtos importados

2️⃣ GALERIA (Mod 2)
   Upload imagens Seamaty.png
   Define regras (comercial/educativo/etc)
   ✓ 5 imagens aprovadas

3️⃣ BRIEFING (Mod 1)
   Abrir cliente "Clínica XYZ"
   Sistema sugere TOP 3:
     - VG2 (score 95%)
     - Rotor Hematologia (score 80%)
     - Reagentes (score 70%)

4️⃣ MARKETING AI STUDIO
   Vendedor clica "Gerar Post"
   IA inclui imagens da galeria
   IA respeita regras (crédito, restrições)
   Post pronto → Copiar e postar

5️⃣ VISITA
   Vendedor leva PDF do briefing
   Apresenta 3 produtos recomendados
   Cliente confiante (dados validados)
   ✓ VENDA FECHADA
```

---

## 📊 DADOS TÉCNICOS

### Entidades Criadas

1. **SeamatyImage** — Galeria com metadados
2. **SeamatyInventory** — Inventário importado
3. **VisitBriefing** (página) — Resumo do cliente

### Backend Functions

- **importMobVendedorInventory** — Processa arquivo CSV/Excel

### Validações

- ✓ CNPJ/CPF do cliente (se houver)
- ✓ Datas em formato YYYY-MM-DD
- ✓ Preços positivos
- ✓ URLs de imagens acessíveis
- ✓ SKU único (evita duplicação)

---

## 💡 MELHORES PRÁTICAS

### Importador

```
❌ NÃO: Upload manual mensal
✅ SIM: Automação: sincronizar Mob Vendedor toda segunda 09h

❌ NÃO: Ignorar erros de validação
✅ SIM: Corrigir no arquivo origem, fazer novo import

❌ NÃO: Manter valores vencidos
✅ SIM: Atualizar validade mensalmente
```

### Galeria

```
❌ NÃO: "Comercial = pode fazer anúncio enganoso"
✅ SIM: "Comercial = pode vender, mas Verdade Absoluta obrigatória"

❌ NÃO: Sem restrições em imagens de cliente
✅ SIM: "Sob demanda" = pedir permissão antes

❌ NÃO: Crédito em fonte pequena
✅ SIM: Crédito visível (hashtag ou legenda)
```

### Briefing

```
❌ NÃO: Confiar 100% em score automático
✅ SIM: Usar como orientação, validar em visita

❌ NÃO: Apresentar produto sem orçamento do cliente
✅ SIM: Checar "available_budget" antes

❌ NÃO: Ignorar "lab_needs" incompleto
✅ SIM: Marcar "VALIDAR EM VISITA"
```

---

## 🎓 EXEMPLO PASSO A PASSO

### Cenário: Você vendedor, precisa visitar Clínica PetCare

**1. Importar Inventário (Segunda)**
```
Login → Configurações Marketing → Importar
Upload: inventario_maio_2026.xlsx
Validação: ✓ 47 produtos importados, 3 erros
Revisar erros, refazer upload
Status: ✓ Catálogo atualizado
```

**2. Adicionar Imagens (Terça)**
```
Configurações Marketing → Galeria
Adicionar logo_seamaty_laranja.png
- Título: "Logo Seamaty Laranja"
- Categoria: logo
- Proprietário: Seamaty
- Restrições: comercial, sem_restricao
- Crédito: "Logo © Seamaty 2026"
Status: ✓ Aprovada para Marketing AI
```

**3. Gerar Briefing (Quarta antes de visitar)**
```
Abrir: CRM → Cliente "Clínica PetCare"
Botão: "Briefing de Visita"
Abre página com:
- Dados confirmados: Localização São Paulo, VG1, Orçamento R$50k
- Necessidades: Hemograma, Bioquímico
- Top 3: VG2 (95%), Rotor (85%), Reagentes (70%)
Botão: Download PDF
Imprimir e levar para visita ✓
```

**4. Gerar Conteúdo Marketing (Quarta depois de visita)**
```
Visita fechada! Agora vender para outros.
Clique: Marketing AI Studio
Selecione: Instagram, Post, Tema "Diagnóstico Rápido", Intensidade 4
Gera automático:
- Conteúdo (copy-paste)
- Imagem da galeria (respeitando regras)
- Hashtags
- CTA: "DM para saber mais"
Post pronto: Copiar → Instagram → VENDER ✓
```

---

**✨ Sistema pronto. Dados, imagens e inventário sincronizados. Vender Seamaty com segurança.**
# Auditoria Produtos, Fotos e Catálogo — NR22888

Data: 20/06/2026

## Resultado

**Produtos/Fotos/Catálogo: 65% — ACEITÁVEL**

Fórmula real usada:
- 65 pontos = cobertura de cadastro dos 29 produtos obrigatórios.
- 35 pontos = cobertura de foto oficial validada.
- Cadastro: 29/29 = 65 pontos.
- Foto oficial: 0/29 = 0 pontos.
- Total: 65%.

## Evidência usada

Arquivos/entidades lidos ou consultados:
- `entities/Product.json` existe, mas Product tinha 0 registros na medição.
- `entities/Equipment.json` existe e tinha 9 registros.
- `entities/SeamatyEquipment.json` existe, mas tinha 0 registros.
- `entities/SeamatyPriceTable.json` existe e tinha 120 registros.
- `entities/SeamatyImage.json` existe, mas tinha 0 registros.
- `entities/ProductCatalog.json` foi criado como entidade complementar.
- ProductCatalog consultado: 29 registros.

## Produtos obrigatórios cadastrados no ProductCatalog

Todos os 29 itens obrigatórios foram cadastrados como estrutura auditável, sem inventar especificações não confirmadas.

### Equipamentos
- VG1 Hemogás
- VG2 Hemogás + Imuno
- VI1 Imuno
- SMT-120VP Bioquímica
- QT3 Bioquímica
- 3DX
- VBC50A Hematologia
- VQ1 PCR

### Cartuchos Hemogás
- BG17
- BG17-N
- BG15
- BE5

### Cassetes Imuno
- cPL
- fPL
- cCRP
- fSAA
- TT4
- Cortisol
- Progesterona
- TSH
- cNT-proBNP
- CysC

### Rotores Bioquímica
- 24 Comprehensive
- 16 Comprehensive
- 10 Pre-Operation
- 9 Kidney
- 4 Coagulation
- Ammonia
- 19 Reptilian

## Produtos sem foto oficial

Evidência: ProductCatalog tinha 29 registros e 0 registros com `foto_oficial=true` + `imagem_url`.

Sem foto oficial:
- VG1 Hemogás
- VG2 Hemogás + Imuno
- VI1 Imuno
- SMT-120VP Bioquímica
- QT3 Bioquímica
- 3DX
- VBC50A Hematologia
- VQ1 PCR
- BG17
- BG17-N
- BG15
- BE5
- cPL
- fPL
- cCRP
- fSAA
- TT4
- Cortisol
- Progesterona
- TSH
- cNT-proBNP
- CysC
- 24 Comprehensive
- 16 Comprehensive
- 10 Pre-Operation
- 9 Kidney
- 4 Coagulation
- Ammonia
- 19 Reptilian

## O que está funcionando

- Existe estrutura complementar ProductCatalog.
- Produtos obrigatórios estão mapeados.
- VI1 recebeu preço base interno já documentado no agente: R$ 6.500 à vista.
- Dados técnicos confirmados foram limitados ao que já estava nos agentes/documentos.
- Itens sem especificação confirmada foram marcados como pendência.

## Parcial

- SeamatyPriceTable tem 120 registros, mas não foi vinculada automaticamente ao ProductCatalog.
- Equipment tem 9 registros, mas Product tem 0 e SeamatyImage tem 0.
- Catálogo ainda não tem foto oficial.

## Quebrado/risco

- Proposta/material premium pode sair sem foto oficial.
- Produto pode ser citado com especificação pendente se o agente não respeitar ProductCatalog.
- Rotores/cassetes precisam validação técnica final antes de PDF premium.

## Falta para 100%

1. Vincular fotos oficiais.
2. Validar especificações técnicas e parâmetros por fonte oficial.
3. Ligar ProductCatalog ao gerador de proposta.
4. Bloquear uso de imagem IA para equipamento.
5. Marcar produtos com `status_auditoria=ok` só após validação Nathan/Karoline.

## Precisa aprovação

- Vincular fotos oficiais.
- Corrigir preços.
- Exibir produtos em propostas.
- Gerar materiais premium automaticamente.
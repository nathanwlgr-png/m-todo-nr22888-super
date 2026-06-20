# Auditoria Produtos, Fotos e Catálogo — NR22888

Data: 20/06/2026  
Modo: auditoria e estrutura complementar, sem substituir entidades existentes.

## Resumo executivo

Percentual Produtos/Fotos/Catálogo: **65%**  
Classificação: **aceitável**.

Foi criada a entidade complementar `ProductCatalog` para centralizar o catálogo auditável de produtos Seamaty, insumos e materiais futuros. Ela não substitui `Product`, `Equipment` nem `SeamatyPriceTable`.

O catálogo obrigatório foi cadastrado com 29 itens principais, mas **nenhum produto possui foto oficial vinculada ainda**. Portanto, o sistema ainda não está pronto para geração automática de material premium com imagens oficiais.

## Entidades relacionadas encontradas

- Product: existe, mas sem registros medidos no recorte atual.
- Equipment: existe e possui registros.
- SeamatyEquipment: existe, mas sem registros medidos no recorte atual.
- SeamatyPriceTable: existe com 120 registros.
- SeamatyImage: existe, mas com 0 registros.
- Consumable: existe.
- ProductCatalog: criado nesta auditoria, com 29 registros.

## ProductCatalog criado

Campos principais:
- nome_produto
- categoria
- linha
- descricao_curta
- descricao_comercial
- especificacoes
- tempo_resultado
- parametros
- volume_amostra
- tipo_insumo
- preco_base
- custo_insumo
- imagem_url
- foto_oficial
- ativo
- prioridade_comercial
- indicado_para
- argumentos_venda
- objecoes_comuns
- resposta_objecoes
- materiais_relacionados
- observacao
- status_auditoria

## Produtos obrigatórios cadastrados/auditados

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

## Produtos sem cadastro

Nenhum dos produtos obrigatórios ficou ausente no `ProductCatalog` complementar.

## Produtos sem foto oficial

Todos os 29 itens do `ProductCatalog` estão sem foto oficial vinculada.

Lista:
- VG1 Hemogás
- VG2 Hemogás + Imuno
- VI1 Imuno
- SMT-120VP Bioquímica
- QT3 Bioquímica
- 3DX
- VBC50A Hematologia
- VQ1 PCR
- Cartucho Hemogás BG17
- Cartucho Hemogás BG17-N
- Cartucho Hemogás BG15
- Cartucho Hemogás BE5
- Cassete Imuno cPL
- Cassete Imuno fPL
- Cassete Imuno cCRP
- Cassete Imuno fSAA
- Cassete Imuno TT4
- Cassete Imuno Cortisol
- Cassete Imuno Progesterona
- Cassete Imuno TSH
- Cassete Imuno cNT-proBNP
- Cassete Imuno CysC
- Rotor Bioquímica 24 Comprehensive
- Rotor Bioquímica 16 Comprehensive
- Rotor Bioquímica 10 Pre-Operation
- Rotor Bioquímica 9 Kidney
- Rotor Bioquímica 4 Coagulation
- Rotor Bioquímica Ammonia
- Rotor Bioquímica 19 Reptilian

## Regras preservadas

- Não foi usada imagem IA para substituir foto oficial.
- Não foi redesenhado nenhum equipamento.
- Especificações não confirmadas foram marcadas como pendentes.
- Produtos foram cadastrados com observação de validação quando necessário.
- VI1 recebeu preço base de R$ 6.500 porque já estava presente como dado interno oficial dos agentes.
- Demais preços ficaram pendentes quando não confirmados.

## O que está funcionando

- Entidade complementar criada.
- Produtos obrigatórios listados.
- Status de auditoria por item.
- Priorização comercial nos equipamentos principais.
- Estrutura pronta para proposta/material futuro.

## O que está parcial

- Sem fotos oficiais.
- Sem vínculo completo com `SeamatyPriceTable`.
- Sem parâmetros técnicos completos nos cartuchos/cassetes/rotores.
- Sem materiais relacionados vinculados.
- Sem tela dedicada, porque não foi solicitada nova tela e criar uma agora aumentaria complexidade.

## Riscos

- Material premium pode sair sem foto oficial.
- Proposta pode usar especificação incompleta se não houver validação.
- Confusão entre Product, Equipment, SeamatyPriceTable e ProductCatalog se não houver regra clara.

## Correções sugeridas

### Precisa aprovação
1. Subir fotos oficiais para `SeamatyImage`.
2. Vincular `imagem_url` e `foto_oficial=true` em ProductCatalog.
3. Validar parâmetros técnicos de cada cartucho/cassete/rotor.
4. Validar preços por tabela oficial.
5. Definir regra visual: quando mostrar ou ocultar insumos em peças principais.

### Pode ser feito depois
- Criar painel simples de revisão do ProductCatalog se isso aumentar conversão.
- Integrar ProductCatalog ao gerador de proposta.
- Integrar ProductCatalog ao futuro Material Premium Automático.

## Próximos passos

1. Nathan aprovar lista de produtos obrigatórios.
2. Subir fotos oficiais.
3. Validar parâmetros técnicos.
4. Validar preços.
5. Só depois ativar geração premium com imagens oficiais.

## Decisão

Catálogo estrutural aprovado como base de auditoria. Ainda não usar para material automático sem fotos oficiais e validação técnica.
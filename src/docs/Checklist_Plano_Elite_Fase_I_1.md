# Checklist Plano Elite - Fase I.1

## Objetivo
Correção técnica e validação da Fase I antes de avançar para Fase II, sem apagar dados e sem alterar o fluxo antigo.

## IDs de modelos válidos considerados
Modelos aceitos pelo InvokeLLM neste app/workspace conforme integração Base44 disponível:
- gpt_5_5
- gpt_5_4
- gpt_5_mini
- claude_opus_4_8
- claude_opus_4_7
- claude_opus_4_6
- claude_sonnet_4_6
- gemini_3_1_pro
- gemini_3_flash
- automatic

## Fallback de modelos implementado
- Comercial: gpt_5_5 → gpt_5_4 → gpt_5_mini → automatic.
- Auditoria/arquitetura: claude_opus_4_8 → claude_opus_4_7 → claude_opus_4_6 → claude_sonnet_4_6 → automatic.
- Documento/visual: gemini_3_1_pro → gemini_3_flash → automatic.
- Rotina: claude_sonnet_4_6 → gpt_5_mini → automatic.
- Simples: automatic.

## Arquivos corrigidos
- lib/EliteAIEngine.js: adicionada escolha por chave, fallback seguro e mensagem amigável se todos os modelos falharem.
- entities/EliteAIRecommendationLog.json: adicionado modo_operacional.
- entities/EliteToolConnection.json: adicionado prioridade_rank.
- components/elite/PlanoEliteStatus.jsx: ordenação por prioridade_rank e filtro local de mensagens pendentes/legadas.
- pages/DashboardSniper: contadores protegidos com fallback seguro.

## Registros atualizados
- EliteToolConnection recebeu prioridade_rank conforme regra: baixa=1, media=2, alta=3, maxima=4.

## Rotas validadas
- /RankingOportunidades existe no App.jsx.
- /WhatsAppHub existe no App.jsx.
Nenhuma página provisória foi criada porque as rotas já existem.

## Filtros corrigidos
O bloco Plano Elite agora considera mensagens com status:
- pending
- aguardando_aprovacao
- ready_to_send
- rascunho

## DashboardSniper
O bloco Plano Elite foi mantido como camada complementar e protegido contra variáveis undefined.

## Riscos restantes
- A validação final visual deve ser feita no preview, principalmente em Samsung Tab/celular.
- O fallback de modelo só será acionado em chamadas reais de IA nas próximas fases.
- Gmail, Drive amplo e Docs seguem pendentes até autorização/conexão específica.

## Status de compilação esperado
Sem imports novos quebrados, sem rotas pendentes nos botões do bloco e sem filtro incompatível de OR no frontend.
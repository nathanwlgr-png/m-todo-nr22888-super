# Checklist Plano Elite - Fase II

## Objetivo
Ativar a camada complementar de Score Elite, Próxima Melhor Ação e card “Como vender agora?”, sem apagar dados antigos, sem substituir Client/Lead/Sale/DashboardSniper e mantendo aprovação humana obrigatória para comunicação externa.

## Entidades usadas
- Client
- Lead
- Sale como equivalente operacional de oportunidade comercial
- Visit
- Interaction
- ProposalEngagement
- PendingMessage
- EliteLeadScore
- EliteActionLog

## Arquivos criados
- lib/EliteScoreEngine.js
- functions/activateEliteScore.js
- functions/gerarMensagemElite.js
- components/elite/ComoVenderAgoraCard.jsx
- pages/ScoreElite.jsx
- docs/Checklist_Plano_Elite_Fase_II.md

## Componentes criados
- ComoVenderAgoraCard: card complementar de conversão com chance de fechamento, score, dor provável, produto recomendado, argumento principal, objeção, resposta, próxima ação e criação segura de PendingMessage.

## Páginas alteradas
- DashboardSniper via bloco PlanoEliteStatus.
- ClientProfile para incluir o card “Como vender agora?”.
- LeadProfile para incluir o card “Como vender agora?”.
- PipelineView como equivalente de oportunidade/funil comercial.
- App.jsx para rotas /ScoreElite e /LeadProfile.
- PWAInstallButtonFloating para trocar “Offline” por “Acesso rápido”.

## Segurança comercial
- Nenhum WhatsApp, e-mail ou Telegram é enviado automaticamente.
- gerarMensagemElite cria PendingMessage com status aguardando_aprovacao.
- O botão Abrir WhatsApp é manual e orientado para uso somente após aprovação.

## Quantidade de scores criados
Execução real testada pela função activateEliteScore com lote seguro: 16 scores criados.

## Quantidade de scores atualizados
Execução real testada pela função activateEliteScore com lote seguro: 2 scores atualizados.

## Erros encontrados
- Primeira execução ampla encontrou limite de chamadas da plataforma. Correção aplicada: processamento em lote menor e busca única de scores existentes, evitando consultas repetidas.
- Execução validada depois da correção: 18 analisados, 16 criados, 2 atualizados, 2 oportunidades quentes, 0 fechamentos imediatos, 0 erros.

## Dados que ainda faltam
- Entidade Opportunity dedicada não existe; Sale/PipelineView foram tratados como equivalente operacional de oportunidade.
- Alguns registros podem não ter telefone, valor potencial, proposta visualizada ou histórico de interação suficiente.

## Status do DashboardSniper
Validado no preview: bloco Plano Elite usa dados reais de EliteLeadScore, mostrando 2 oportunidades quentes, 0 fechamento imediato, 3 visitas prioritárias e 4 mensagens pendentes. O modal PWA já mostra “Acesso rápido”, “Rápido” e “Tela cheia”.

## Status do card Como vender agora
Criado e integrado em ClientProfile e LeadProfile; PipelineView exibe o card para a principal oportunidade do funil. O card cria PendingMessage e mantém envio manual.

## Validação PendingMessage
Função gerarMensagemElite testada com score real. Resultado: PendingMessage criado com status aguardando_aprovacao, envio_automatico=false e sem disparo de WhatsApp/e-mail/Telegram.

## Próximos passos para Fase III
- Automatizar cálculo periódico controlado por agenda.
- Ampliar análise por produto Seamaty e recorrência de insumos.
- Validar conectores de Gmail/Docs/Drive em fluxo real antes de usar em automações.
- Criar visão executiva de forecast Elite.
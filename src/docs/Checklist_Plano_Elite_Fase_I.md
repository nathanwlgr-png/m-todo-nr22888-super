# Checklist Plano Elite - Fase I

## Status
Fase I implementada como camada complementar. Nenhum dado de Client, Lead, Opportunity ou DashboardSniper foi migrado, apagado ou substituído.

## Entidades criadas/atualizadas
- EliteLeadScore: camada de score comercial Elite de 0 a 100.
- EliteToolConnection: auditoria de ferramentas, integrações e recursos de campo.
- PendingMessage: fila obrigatória de aprovação humana, preservando campos legados.
- EliteActionLog: registro rastreável de ações sugeridas e executadas.
- EliteAIRecommendationLog: log informativo de recomendação e uso de modelos de IA.

## Lib criada
- lib/EliteAIEngine.js
  - Venda/CRM/funil/score/proposta/decisão comercial: gpt_5_5.
  - Auditoria/bug difícil/backend/arquitetura/erro recorrente: claude_opus_4_8.
  - PDF/imagem/print/planilha/arquivo/extração: gemini_3_1_pro.
  - Mensagem simples/follow-up/texto comercial/rotina: claude_sonnet_4_6.
  - Automatic apenas para tarefa simples sem impacto comercial.

## Página alterada
- DashboardSniper recebeu um bloco inicial “Plano Elite ativo / Central Elite · Fase I”.
- A página antiga continua funcionando e o novo bloco é complementar.

## Componente criado
- components/elite/PlanoEliteStatus.jsx
  - Mostra oportunidades quentes.
  - Mostra visitas de hoje.
  - Mostra clientes inativos.
  - Mostra mensagens aguardando aprovação.
  - Mostra próxima melhor ação inicial.
  - Mostra ferramentas pendentes/desconectadas.

## Ferramentas mapeadas na Fase I
Registros iniciais preparados para Gmail, Google Calendar, Google Drive, Google Sheets, Google Docs, Google Contacts, Instagram Business, WhatsApp manual/API, Telegram, Google Maps/link de rota, SendEmail, UploadFile, ExtractDataFromUploadedFile, invokeLLM, Backend Functions, Secrets, External API, Superagent, App Mobile/PWA, Logs, Auditoria e Dashboards.

## Riscos encontrados
- PendingMessage já existia e era usada por fluxos legados; por isso os campos antigos foram preservados.
- Gmail ainda não aparece como conector autorizado no app, então ficou como pendência de conexão.
- WhatsApp permanece manual por segurança e para respeitar a regra de aprovação humana.

## Pronto para usar no campo
- Base de score Elite criada.
- Fila de aprovação de mensagens reforçada.
- Auditoria de ferramentas criada.
- Painel inicial do Plano Elite visível no Dashboard Sniper.
- Decisão de modelo centralizada para próximas fases.

## Próximos passos recomendados
1. Criar automação diária para alimentar EliteLeadScore sem migrar dados antigos.
2. Criar card “Como vender agora?” em Cliente/Lead/Oportunidade.
3. Criar agentes especializados sem apagar agentes existentes.
4. Mapear permissões de conectores antes de ativar Gmail, Drive e Docs.
5. Evoluir DashboardSniper para Central Elite completa após validação da Fase I.
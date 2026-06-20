# Checklist Plano Elite — Fase II-SAFE Telegram, WhatsApp e CRM

## Objetivo
Implementar uma camada complementar e segura para uso diário via Telegram, WhatsApp com aprovação manual e atualização controlada do CRM, sem substituir o fluxo atual.

## Arquivos criados
- `entities/CRMUpdateQueue.json`
- `entities/TelegramCommandLog.json`
- `agents/telegram_operacional_nr22888.json`
- `functions/aplicarAtualizacaoCRMComSeguranca.js`
- `functions/processTelegramCommandSafe.js`
- `components/elite/CentralComandosSafe.jsx`
- `docs/Checklist_Plano_Elite_Fase_II_SAFE_Telegram_WhatsApp_CRM.md`

## Entidades criadas
### CRMUpdateQueue
Fila segura para impedir que Telegram, agentes ou comandos alterem o CRM diretamente sem controle. Inclui origem, texto original, comando interpretado, vínculo com cliente/lead/oportunidade, campo alvo, valor novo, risco, status e datas de aprovação/aplicação.

### TelegramCommandLog
Log de todos os comandos interpretados a partir do Telegram, com intenção detectada, cliente detectado, ação sugerida, vínculos com CRMUpdateQueue/PendingMessage, resposta gerada e erro.

## Agente configurado
### Agente Telegram Operacional NR22888
Criado como agente complementar com regras SAFE:
- Telegram pode criar tarefas, logs, sugestões e filas.
- Telegram não altera dados críticos diretamente.
- Mensagens externas viram PendingMessage.
- Atualizações de risco médio/alto passam por CRMUpdateQueue.
- Modelos operacionais definidos: GPT-5.5 para decisão comercial, Sonnet 4.6 para respostas simples/follow-up e Opus 4.8 para erro/auditoria.

## Comandos preparados
- `/resumo_dia`
- `/cliente [nome]`
- `/visita [nome do cliente] [anotação]`
- `/followup [nome do cliente] [data ou prazo]`
- `/whatsapp [nome do cliente] [objetivo]`
- `/quentes`
- `/propostas_paradas`
- `/inativos`
- `/atualizar [cliente] [informação]`

## O que já funciona
- Criação de fila segura CRMUpdateQueue.
- Registro de comandos TelegramCommandLog.
- Processamento seguro de comandos por função complementar.
- Criação de PendingMessage para WhatsApp sem envio automático.
- Aplicação segura de atualizações via função com validação de risco, registro antes/depois e EliteActionLog.
- Bloco Central de Comandos no DashboardSniper, sem substituir DashboardSniper.
- Consulta de mensagens pendentes, filas CRM, logs Telegram, follow-ups e erros.
- WhatsAppHub ajustado para reconhecer PendingMessage com status aguardando_aprovacao, mantendo envio manual.

## O que depende de conectar Telegram
- Receber mensagens reais do Telegram pelo canal do agente.
- Teste operacional direto pelo Telegram do Nathan.
- Confirmação final de status conectado em EliteToolConnection.

## O que depende de conectar WhatsApp
- WhatsApp segue manual via WhatsAppHub/PendingMessage.
- Nenhum disparo automático foi criado.
- O envio real continua dependendo de Nathan revisar, aprovar, abrir WhatsApp e enviar manualmente.

## Riscos controlados
- Campos críticos exigem aprovação antes de aplicar.
- Valor vazio ou inválido não é aplicado.
- Campo não permitido fica pendente.
- Registro inexistente marca erro e não altera CRM.
- Nenhum dado antigo foi migrado automaticamente.
- Nenhuma entidade antiga foi apagada.
- Nenhuma automação de envio automático foi criada.

## Validação obrigatória
- DashboardSniper deve continuar como home e painel principal.
- WhatsAppHub deve continuar como fila/manual de conversão.
- PendingMessage continua exigindo aprovação.
- CRMUpdateQueue criada.
- TelegramCommandLog criada.
- Nenhuma entidade antiga apagada.
- Nenhuma automação de envio automático criada.

## Próximos passos
1. Aprovar permissões do agente Telegram Operacional NR22888.
2. Conectar Telegram no editor do agente, se disponível no workspace.
3. Testar `/resumo_dia` e `/whatsapp [cliente] [objetivo]`.
4. Validar uma atualização baixo risco em CRMUpdateQueue.
5. Manter médio/alto sempre com aprovação manual.
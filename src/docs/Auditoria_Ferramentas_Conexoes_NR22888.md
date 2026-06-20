# Auditoria Ferramentas e Conexões — NR22888

Data: 20/06/2026

## Resultado

**Ferramentas/Conectores: 69% — ACEITÁVEL**

Fórmula real usada:
- 36 ferramentas registradas/consultadas em EliteToolConnection.
- 22 com status conectado/nativo.
- 6 com status parcial/configuração manual.
- Cálculo: (conectadas + parciais*0,5) / total = (22 + 6*0,5) / 36 = 69%.

## Evidência usada

- `get_connectors_info` retornou conectores autorizados:
  - Google Sheets
  - Dropbox
  - Google Calendar
  - Google Slides
  - Notion
- Secrets existentes:
  - SUPERAGENT_TOKEN
  - GOOGLE_MAPS_API_KEY
  - OPENAI_API_KEY
- EliteToolConnection atualizado/consultado: 36 ferramentas.
- Funções lidas/testadas:
  - `sendWhatsAppMessage` testada com telefone inválido: retornou 422, validação funcionando.
  - `syncWeeklyReportToSheets` lida.
  - `autoSyncVisitToCalendar` lida.

## Ferramentas conectadas/nativas relevantes

- Google Calendar: conectado.
- Google Sheets: conectado via workspace connector.
- Google Slides: conectado.
- Dropbox: autorizado.
- Notion: autorizado/registrado.
- Google Maps/link externo: API key configurada.
- UploadFile: nativo.
- SendEmail: nativo.
- InvokeLLM: nativo.
- Backend Functions: nativo.
- PWA/mobile: nativo.

## Pendentes ou parciais

- Gmail: não autorizado atualmente.
- Google Drive: não autorizado atualmente.
- Google Docs: não autorizado atualmente.
- Google Contacts: não listado como conector disponível no workspace.
- Instagram Business: não autorizado atualmente.
- WhatsApp API Oficial: não configurada; WhatsApp atual é manual/link.
- Telegram: agente configurado, mas conexão física do bot não validada.
- SuperAgent: token existe, mas permissões dos agentes precisam revisão.

## O que está funcionando

- Google Calendar tem automação de visitas.
- Google Sheets tem relatório semanal configurado.
- Google Slides tem suporte para proposta.
- WhatsApp manual via wa.me funciona como link.
- SendEmail e UploadFile existem.
- Logs e auditoria existem parcialmente.

## Parcial/quebrado

- `syncWeeklyReportToSheets` usa APP_USER connector em função agendada; precisa garantir conexão do usuário correto no contexto da automação.
- `sendApprovedMessages` envia email automático, o que precisa revisão SAFE.
- `clinicCompetitiveMonitor` marca `whatsapp_alert_sent` mesmo sem envio real via WhatsApp oficial.
- Google Drive/Docs/Gmail/Instagram não estão autorizados.

## Falta para 100%

1. Validar OAuth real de cada conector em fluxo do CRM.
2. Conectar Gmail/Drive/Docs/Instagram apenas se aumentar conversão.
3. Separar claramente “conectado visualmente” de “testado em fluxo real”.
4. Revisar funções que usam conector em automação.
5. Garantir que toda comunicação externa respeite PendingMessage.

## Risco em campo sem corrigir

- Relatórios podem falhar se conector APP_USER não estiver conectado no usuário certo.
- Materiais premium podem não salvar no Drive/Docs.
- Email pode ser enviado automaticamente fora do fluxo desejado.
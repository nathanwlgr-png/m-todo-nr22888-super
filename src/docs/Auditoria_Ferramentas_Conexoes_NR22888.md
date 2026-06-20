# Auditoria Ferramentas e Conexões — NR22888

Data: 20/06/2026

## Resumo executivo

Percentual Ferramentas/Conexões: **68%**  
Classificação: **aceitável**.

O app tem boa base de conectores e ferramentas, mas ainda há lacunas para operação elite: Gmail/Drive/Docs/Instagram não estão autorizados, Telegram precisa conferência de bot no agente, WhatsApp API oficial não existe e SuperAgent/agentes têm permissões amplas.

## Conectores autorizados

- Google Sheets
- Dropbox
- Google Calendar
- Google Slides
- Notion

## Secrets existentes

- SUPERAGENT_TOKEN
- GOOGLE_MAPS_API_KEY
- OPENAI_API_KEY

## EliteToolConnection

Foram atualizados/criados registros de ferramentas no `EliteToolConnection`. Total medido: 36 registros.

## Matriz de ferramentas

| Ferramenta | Status | Ajuda venda | Ajuda campo | Próximo passo |
|---|---|---|---|---|
| Telegram Operacional SAFE | configuração manual | alta | alta | Conferir conexão do bot no editor do agente |
| WhatsApp Manual | nativo | máxima | máxima | Manter manual e corrigir confirmação de envio |
| WhatsApp API Oficial | pendente | média | média | Não conectar agora sem aprovação SAFE |
| Gmail | pendente | média | baixa | Autorizar OAuth se e-mail virar prioridade |
| Google Calendar | conectado | alta | alta | Revisar automação anti-loop |
| Google Sheets | conectado | média | média | Validar conexão por usuário nos relatórios |
| Google Slides | conectado | alta | média | Usar com propostas aprovadas |
| Google Drive | pendente | média | média | Autorizar quando materiais premium forem aprovados |
| Google Docs | pendente | média | baixa | Autorizar quando apostilas/docs forem aprovados |
| Google Contacts | indisponível | baixa | baixa | Não priorizar |
| Instagram Business | pendente | média | média | Autorizar apenas para análise permitida |
| Google Maps/API | conectado | máxima | máxima | Blindar geocode com CRMUpdateQueue |
| SendEmail | nativo | média | baixa | Garantir aprovação para e-mail externo crítico |
| UploadFile | nativo | alta | alta | Manter, sem base64 em entidades |
| ExtractDataFromUploadedFile | nativo | alta | média | Preferir para importação estruturada |
| InvokeLLM | nativo | alta | alta | Manter sob demanda e modo econômico |
| Backend Functions | nativo | alta | alta | Auditar funções agressivas |
| SuperAgent | parcial | alta | alta | Reduzir permissões críticas |
| PWA/mobile | nativo | máxima | máxima | Testar offline real em Samsung Galaxy Tab |
| Logs/Auditoria | parcial | alta | média | Padronizar EliteActionLog |
| PDF/CSV | parcial | média | baixa | Padronizar com ProductCatalog |

## O que está funcionando

- Google Calendar autorizado e usado por `autoSyncVisitToCalendar`.
- Google Sheets workspace connector registrado.
- Google Slides autorizado e usado para propostas.
- Dropbox autorizado para inventário/read-only.
- Notion autorizado.
- Google Maps API key configurada.
- Core UploadFile/SendEmail/InvokeLLM disponíveis.
- Backend Functions habilitadas e numerosas.
- PWA/mobile presente.

## O que está parcial

- Telegram depende de conexão do bot no agente.
- SuperAgent/agentes ainda precisam revisão de permissões.
- Logs existem, mas cobertura não é total.
- Exportação PDF/CSV existe dispersa em telas.
- Google Sheets usa APP_USER em função semanal; cada usuário precisa conexão.

## O que está desconectado/pendente

- Gmail
- Google Drive
- Google Docs
- Instagram Business
- WhatsApp API oficial
- Google Contacts indisponível como conector atual

## Riscos

1. Prometer WhatsApp automático sem API oficial.
2. Enviar e-mail automático sem aprovação.
3. Criar documentos premium sem Drive/Docs/fotos oficiais.
4. Google Sheets semanal falhar para usuário sem APP_USER conectado.
5. Agentes acessarem funções de envio/link sem confirmação humana.

## Correções sugeridas

### Precisa aprovação
- Autorizar Gmail, Drive, Docs ou Instagram somente se entrar no fluxo comercial real.
- Definir se Google Sheets será compartilhado por builder ou por usuário final.
- Definir se Telegram será canal oficial operacional.
- Decidir se WhatsApp API oficial será configurado futuramente.

### Correções simples futuras
- Exibir status real das ferramentas em Central SAFE.
- Marcar claramente “conectado”, “parcial”, “manual” e “pendente”.
- Bloquear envio automático por padrão em qualquer canal externo.

## Próximos passos

1. Conferir conexão real do bot Telegram.
2. Validar Google Sheets no usuário que recebe relatório.
3. Manter WhatsApp manual.
4. Autorizar Drive/Docs só na fase Material Premium.
5. Autorizar Gmail só se e-mail externo for realmente necessário.

## Decisão

Ferramentas estão aceitáveis, mas não prontas para automação agressiva. O foco deve continuar em conversão via WhatsApp manual, agenda, rota e proposta aprovada.
# Plano — Comando de Voz de Campo SAFE (NR22888)

**Data:** 20/06/2026 · **Status:** Estrutura SAFE preparada. **Fase agressiva NÃO iniciada.**
**Garantias:** nenhum envio automático · nenhum dado crítico alterado · nenhuma coordenada aplicada · nenhuma duplicata arquivada.

---

## 1. Arquitetura recomendada

```
Bixby / voz do tablet (Galaxy Tab)
        │  (só abre o app/PWA ou Telegram — NÃO mexe no CRM)
        ▼
Telegram Operacional  ──ou──  Botão "Comando de Voz" no CRM
        │                              │
        │ (áudio/texto)                │ (transcrição manual digitada)
        ▼                              ▼
            processVoiceCommandSafe  ← interpretação SAFE
        │
        ├─ Navegação  → abre tela (sem dado)
        ├─ CRMUpdateQueue   → visita / atualização (baixo risco aplica após conferência; crítico exige aprovação)
        ├─ PendingMessage   → rascunho WhatsApp (SEMPRE aguardando aprovação — nunca envia)
        ├─ Task             → follow-up / preparar proposta
        ├─ EliteActionLog   → registro comercial
        └─ VoiceCommandLog  → rastreio de todo comando
```

**Princípio:** a voz **prepara**, Nathan **confirma**. Nada crítico acontece sozinho.

---

## 2. Comandos de voz suportados (linguagem natural)

| Frase falada | O que faz | Risco |
|--------------|-----------|-------|
| "Abrir NR Campo" / "Abrir Sniper do Dia" | abre o Dashboard | baixo (navegação) |
| "Abrir WhatsAppHub" | abre o WhatsApp Hub | baixo |
| "Abrir rota do dia" | abre Rota Inteligente | baixo |
| "Abrir cliente [nome]" | abre o Cliente 360 | baixo |
| "Mostrar clientes quentes" | abre Ranking de Oportunidades | baixo |
| "Mostrar propostas paradas" | abre Funil | baixo |
| "Mostrar pendências" | abre Tarefas | baixo |
| "Registrar visita [cliente] [anotação]" | cria CRMUpdateQueue (anotação de visita) | baixo |
| "Criar follow-up [cliente] [prazo]" | cria Task de follow-up | baixo |
| "Criar proposta para [cliente]" | cria Task + abre Gerador de Propostas | médio |
| "Gerar WhatsApp [cliente] [objetivo]" | cria **rascunho** PendingMessage | **alto — exige aprovação** |
| "Agendar visita [cliente] [dia/hora]" | cria fila de agendamento | **médio — exige confirmação** |
| "Confirmar que enviei" | abre tela de aprovação para Nathan marcar como enviado (não marca sozinho) | — |

> A interpretação é por palavras-chave em português, com normalização de acento. Não depende de IA paga para os comandos básicos (economiza tokens).

---

## 3. Entidade VoiceCommandLog

Criada. Rastreia **todo** comando: `data_hora, origem, usuario, texto_transcrito, comando_detectado, cliente_detectado, cliente_id, acao_sugerida, crm_update_queue_id, pending_message_id, task_id, elite_action_log_id, navegacao_destino, status, risco, exige_aprovacao, resposta_gerada, erro, observacao`.

---

## 4. Função processVoiceCommandSafe

Criada. Recebe `{ texto_transcrito, origem, usuario }`. Reaproveita exatamente o padrão SAFE do `processTelegramCommandSafe`. Sempre retorna `envio_automatico: false` e `alterou_dado_critico: false`.

**Regras de risco embutidas (alto risco = exige aprovação):**
- mudar status_funil · alterar telefone/e-mail/endereço · alterar valor · marcar fechado · alterar coordenada · **enviar mensagem** · arquivar duplicata.

Nenhuma dessas é executada pela voz — viram fila/rascunho.

---

## 5. Botão no CRM

Componente `ComandoVozSafe` criado (compacto, modal com transcrição manual). Onde adicionar (próximo passo, sob aprovação):
- **Central SAFE** (CentralComandosSafe)
- **DashboardSniper** — recolhido/compacto
- **Cliente 360** (ClienteDetalhe360)

Hoje aceita **texto digitado** (transcrição manual). Gravação de áudio real fica para depois (depende de permissão de microfone do navegador — Web Speech API).

---

## 6. Integração Telegram Operacional

O Telegram já transcreve áudio no próprio app. Quando Nathan mandar texto/áudio transcrito, o fluxo pode chamar `processVoiceCommandSafe` (origem: `telegram`) e responder curto:
> "Preparei isso. Nada foi enviado. Está aguardando aprovação."

*(Ligar o roteamento do bot a esta função é o próximo passo, sob aprovação.)*

---

## 7. Bixby / Samsung — configuração MANUAL de Nathan

Bixby **não** acessa o CRM. Serve só para **abrir** o app e preparar o campo.

**Rotina 1 — "Bixby, abrir NR Campo":**
- abrir o PWA/app do NR22888
- ativar localização (se permitido)
- ajustar brilho para uso externo
- abrir a rotina de campo

**Rotina 2 — "Bixby, abrir Telegram NR":**
- abrir o Telegram no chat/agente operacional

Configurar em: *Bixby Routines → criar rotina → gatilho de voz → ação "abrir app".*

---

## 8. Segurança obrigatória (cumprida na estrutura)

- ✅ Bixby nunca altera o CRM diretamente.
- ✅ Voz nunca envia WhatsApp.
- ✅ Voz nunca envia e-mail.
- ✅ Voz nunca aplica coordenada.
- ✅ Voz nunca arquiva duplicata.
- ✅ Voz pode criar fila, rascunho, tarefa e sugestão.
- ✅ Nathan confirma tudo que for crítico.

---

## 9. O que depende de quê

| Item | Depende de |
|------|-----------|
| Abrir app por voz | Bixby Routines (config manual do tablet) |
| Transcrição de áudio no Telegram | recurso do próprio Telegram |
| Gravação de áudio dentro do CRM | permissão de microfone do navegador + Web Speech API (Android/Chrome) |
| Navegação e filas SAFE | já pronto, funciona com texto agora |

---

## 10. O que pode ser feito AGORA vs DEPOIS

**Agora (pronto / baixo risco):**
- Entidade VoiceCommandLog ✅
- Função processVoiceCommandSafe ✅
- Botão Comando de Voz (transcrição manual) ✅
- Relatório ✅

**Depois (sob aprovação):**
- Plugar o botão no Dashboard/Central SAFE/Cliente 360.
- Ligar o Telegram a `processVoiceCommandSafe`.
- Ativar gravação de áudio real (Web Speech API) no tablet.
- Refinar interpretação com IA só quando o comando básico falhar (economia de tokens).

**Nunca (proibido por design):** envio automático de WhatsApp/e-mail, alteração direta de campo crítico, aplicação de coordenada por voz, arquivamento de duplicata por voz.
# Auditoria Visual e Funcional — NR22888 (guiada pela evidência do Nathan)

**Data:** 20/06/2026 · **Modo:** auditar primeiro, corrigir só o seguro, listar o resto para aprovação.
**Regras respeitadas:** não apagar dados · não substituir DashboardSniper · não iniciar fase nova · não enviar mensagens · não alterar dados críticos.

---

## 0. Sobre a evidência enviada

O arquivo enviado é um **print da interface do editor Base44** (cabeçalho "Painel de controle / Visualizar", seletor "Modelo IA — Opus 4.8", "Controles IA", barra "Discutir"), **não uma tela do CRM NR22888 em campo**. Ou seja, ele **não mostra botões do app** para auditar visualmente.

> ⚠️ Para a auditoria "como o CRM é usado no campo", o ideal é enviar **prints/vídeo das telas do app publicado** (DashboardSniper, WhatsAppHub, Cliente 360, RouteOptimizer, ScoreElite, Central SAFE). Mesmo assim, fiz a auditoria **lendo o código real** dessas telas — registrado abaixo.

---

## 1. Nota visual atual

| Tela | Nota | Observação |
|------|------|-----------|
| DashboardSniper | 8.5/10 | Fluxo de vendas claro, imagem/pendências recolhidas. Excesso leve de atalhos coloridos. |
| WhatsAppHub | 9/10 | Fluxo seguro inequívoco (Aprovar texto › Abrir WhatsApp › Confirmar). |
| Central SAFE | 8/10 | Compacta e correta. Botões Aprovar/Rejeitar/Aplicar/Editar OK. |
| ScoreElite | 7.5/10 | Botão "Abrir WhatsApp" era enganoso (corrigido). |
| RouteOptimizer | 8/10 | Sólido, com fallback de cidade. Compete com "Rota do Dia" e "Mapa". |
| **Média** | **8.2/10** | Sistema maduro e seguro; ganhos agora são de organização/unificação. |

---

## 2. Auditoria de botões críticos

| Botão | Tela | Status | Veredito |
|-------|------|--------|----------|
| Instalar app | flutuante | essencial | ✅ Já discreto (ícone 40px). OK. |
| WhatsApp | Central SAFE / Dashboard | essencial | ✅ Leva ao WhatsAppHub. |
| Telegram | Central SAFE | útil | ✅ Desabilitado com aviso quando agente não conectado. Correto. |
| Atualizar | Central SAFE / Histórico | útil | ✅ Só invalida cache (seguro). |
| Aprovar / Rejeitar / Aplicar | Central SAFE | essencial | ✅ Fila CRMUpdateQueue com risco. Seguro. |
| Editar | Central SAFE | confuso | ⚠️ Só mostra toast "edite na fila"; não abre edição. **Aprovação** p/ ligar a uma edição real ou ocultar. |
| Aprovar texto | WhatsAppHub | essencial | ✅ Renomeado, claro. |
| Abrir WhatsApp | WhatsAppHub / Central / Pendentes | essencial | ✅ `window.open(wa.me)`, sem disparo automático. |
| Confirmar que enviei | WhatsAppHub | essencial | ✅ Única forma de marcar enviado. Perfeito. |
| Gerar com IA | WhatsAppHub | essencial | ✅ Gera e pede revisão. |
| Ativar Score Elite | ScoreElite | essencial | ✅ Recalcula via função. OK. |
| Abrir WhatsApp | ScoreElite | **confuso → corrigido** | ✅ Era um toast disfarçado de "Abrir WhatsApp". **Renomeado p/ "Como enviar" (ícone info).** |
| Gerar mensagem | ScoreElite | essencial | ✅ Cria PendingMessage (não envia). |
| Ver ranking / Prioridade Comercial | Dashboard | útil | ✅ Vai p/ RankingOportunidades. |
| Criar proposta | ScoreElite / Dashboard | essencial | ✅ ProposalGenerator. |
| Agendar visita | ScoreElite | essencial | ✅ VisitManager. |
| Abrir mapa | Dashboard | útil | ✅ ClientLocationMap. |
| Otimizar/Salvar rota / Navegar | RouteOptimizer | essencial | ✅ Fallback de cidade quando sem coordenada. Seguro. |
| Geocodificar | (função geocodeClientLocation) | seguro | ✅ Gera fila de aprovação, não grava direto. |
| Limpar Base de Dados | Dashboard (rodapé) | perigoso-controlado | ✅ Dry-run + confirmação por texto. Mantido no rodapé. |
| Revisar | BotaoLimpezaCRM | útil | ✅ Abre dry-run seguro. |
| Setas (ChevronRight/ArrowRight) | vários | decorativo | ✅ Apenas indicador visual, sem ação solta. |
| Aviãozinho (Send) | — | **eliminado** | ✅ Nenhum ícone de envio automático restante. Import morto removido. |

---

## 3. Botões que pareciam envio automático

✅ **Nenhum disparo automático restante.** Histórico:
- `Send` (aviãozinho) já havia sido trocado por `ExternalLink`/`Pencil` em WhatsAppHub e Central SAFE.
- Import morto de `Send` em WhatsAppHub **removido agora** (limpeza).
- Textos já padronizados: **Aprovar texto · Abrir WhatsApp · Confirmar que enviei · Preparar mensagem · Aguardar aprovação**.

---

## 4. Links quebrados ("Não é possível acessar esse site")

| Origem | URL gerada | Problema | Correção | Risco |
|--------|-----------|----------|----------|-------|
| Botão "Abrir no Chrome" (instruções PWA Android) | `intent://host/path#Intent;scheme=https;package=com.android.chrome;end` | Esquema `intent://` não resolve no desktop nem dentro do preview/iframe | **Já corrigido** → `https://origin/path` com `target="_blank"`, rótulo "Abrir em nova aba" | Baixo (era só instrução de instalação) |

> Demais aberturas externas auditadas usam `https://wa.me/...` ou `google.com/maps/...` (válidas). Não encontrei outro link malformado no código das telas auditadas.
> Se o "Não é possível acessar esse site" do vídeo veio de **outra tela específica**, envie o print do clique para rastrear a origem exata.

---

## 5. Telas/ações duplicadas — unificação proposta (precisa aprovação)

| Sobreposição | Proposta | Apaga algo? |
|--------------|----------|-------------|
| **ScoreElite × RankingOportunidades** | Ranking = visão principal rápida; ScoreElite = detalhe técnico (recolher do topo, manter via atalho). | Não |
| **WhatsAppHub × Central SAFE (pendentes)** | Manter **resumo** na Central SAFE e **ação completa** no WhatsAppHub (já é assim — só padronizar wording). | Não |
| **Rota do Dia × RouteOptimizer × Mapa Clientes** | Ordem fixa: **Rota do Dia (rápida) → RouteOptimizer (avançado) → Mapa (completo)**; agrupar num só card "Rotas". | Não |
| **Pendências para 100%** | Já recolhido por padrão. ✅ | Não |
| **Atalhos do Dashboard (8 cards)** | "Teste Agentes" e "Relatório" são manutenção → mover p/ um grupo "Ferramentas" recolhido. | Não |

---

## 6. Ordem ideal da tela principal (proposta)

1. 🎯 Sniper do Dia *(topo absoluto — mantido)*
2. 🚨 Ação mais urgente (sem contato +7d)
3. 💬 WhatsApp pendente / aprovação (resumo Central SAFE)
4. 📅 Visitas e Rota do Dia
5. 🏆 Oportunidades quentes / Score Elite
6. 🛡️ Central SAFE compacta
7. ✅ Pendências para 100% *(recolhida — já está)*
8. 🖼️ Relatórios e imagens grandes *(recolhidos — imagem já está)*
9. ⚙️ Ferramentas/config (Teste Agentes, Limpeza) no final

> O Dashboard atual já segue ~80% disso. O ajuste pendente é **agrupar os atalhos** (item 5) e **mover Teste Agentes/Relatório** para um bloco "Ferramentas" — requer aprovação por mexer em layout de navegação.

---

## 7. Poluição visual

- **Atalhos rápidos:** 8 cards com 8 cores diferentes competem por atenção. Sugestão: 4 comerciais em destaque + grupo "Ferramentas" recolhido.
- **Imagem institucional:** ✅ já recolhida.
- **Botão Instalar:** ✅ já discreto, não cobre rodapé.
- **KPIs:** OK (4 cards compactos).

---

## 8. Correções visuais aplicadas agora (seguras)

1. ✅ **ScoreElite:** botão "Abrir WhatsApp" (que só dava toast) → **"Como enviar"** com ícone de info — não engana mais o vendedor.
2. ✅ **WhatsAppHub:** removido import morto do ícone `Send` (aviãozinho) — zero resíduo de envio automático.

> (Em turnos anteriores, já aplicados: imagem institucional recolhível, Pendências recolhida, botão Instalar discreto, wording WhatsApp seguro, correção do link `intent://`.)

---

## 9. Correções que precisam de aprovação

1. **Editar (Central SAFE):** ligar a uma edição real da fila ou ocultar o botão (hoje só mostra toast).
2. **Agrupar atalhos do Dashboard:** 4 comerciais visíveis + "Ferramentas" (Teste Agentes, Relatório, Limpeza) recolhido.
3. **Unificar Rotas:** card único "Rotas" com ordem Rota do Dia → Otimizador → Mapa.
4. **ScoreElite × Ranking:** definir Ranking como principal e ScoreElite como detalhe (tirar do topo).

---

## 10. Próximos passos

- [ ] Nathan envia **prints reais do app em campo** (não do editor) para fechar a parte visual.
- [ ] Aprovar itens da seção 9 para eu aplicar com segurança.
- [ ] Confirmar se o "site indisponível" do vídeo veio de outra tela além do botão PWA.

**Nota visual antes → depois:** 8.0 → **8.4** (após as 2 correções seguras desta rodada).

---

# 🎥 Revisão após vídeo real do Nathan (20/06/2026)

## ⚠️ Limitação de acesso — declaração honesta
**Não tenho acesso ao conteúdo do vídeo `.mp4`.** Recebo o link do arquivo, mas **não consigo reproduzir vídeo nem extrair frames** — só analiso **imagens estáticas (PNG/JPG)** anexadas e o **código real** das telas.

Portanto, esta revisão é feita por **auditoria de código tela-por-tela, botão-por-botão** (que reflete exatamente o que renderiza no campo) — **não** por leitura do vídeo. Para fechar 100% o lado visual, preciso de **prints estáticos** do vídeo, especialmente o **frame do erro "Não é possível acessar esse site" com a barra de URL visível**.

## Inventário de botões — ClienteDetalhe360 (tela auditada agora a fundo)

| Botão | Tela | Função esperada | Função real | Status | Ação |
|-------|------|-----------------|-------------|--------|------|
| Validar ID | C360 topo | Consultar CNPJ/CPF | `consultarCNPJScore` | ✅ funcionando | manter |
| Ver Mapa | C360 topo | Abrir Google Maps | `maps.google.com/?q=` | ✅ funcionando | manter |
| Instagram | C360 topo | Abrir perfil | `instagram.com/handle` | ✅ funcionando | manter |
| SPIN | C360 topo | Ir p/ SPIN | navega GenerateWhatsApp | ✅ funcionando | manter |
| Proposta | C360 | Abrir gerador | navega ProposalGenerator | ✅ funcionando | manter |
| Gerar PDF | C360 | PDF do cliente | `generatePDFForWhatsApp` | ✅ funcionando | manter |
| **Link Trac.** | C360 | Copiar link rastreável | copia `nr22888.base44.app/...` | ⚠️ **suspeito** | **verificar domínio (aprovação)** |
| Prioridade | C360 | Marcar quente | update cliente | ✅ funcionando | manter |
| Funil (6 estágios) | C360 Geral | Mudar pipeline | update cliente | ✅ funcionando | manter |
| Criar Follow-up | C360 Geral | Cria tarefa +3d | `Task.create` | ✅ funcionando | manter |
| Gerar via SPIN | C360 Mensagens | Gera texto IA | `generateSpinSellingMessages` | ✅ funcionando | manter |
| **Enviar p/ Aprovação** | C360 Mensagens | Mandar p/ fila | só adiciona à fila local | confuso (aviãozinho) | ✅ **renomeado → "Preparar p/ Aprovação" (ícone revisão)** |
| Enviar Direto (BLOQUEADO) | C360 Mensagens | — | toast de bloqueio | ✅ proposital | manter |
| **Aprovar** | C360 Aprovação | Aprovar texto | muda status (não envia) | confuso | ✅ **renomeado → "Aprovar texto"** |
| Reprovar / Nova Versão | C360 Aprovação | — | muda status | ✅ funcionando | manter |
| **Abrir WhatsApp (pré-preenchido)** | C360 Aprovação | Abrir wa.me | usava `client.phone` **cru** | ⚠️ **quebrava com telefone mascarado** | ✅ **corrigido — limpa `\D` antes do wa.me** |
| Confirmar que enviei | C360 Aprovação | Marcar enviado | muda status | ✅ funcionando | manter |
| Anexar Print Real | C360 Anexos | Upload imagem | `UploadFile` real | ✅ funcionando | manter |
| Abrir Google Maps / iframe | C360 Mapa | Mapa | iframe embed + link | ✅ funcionando | manter |
| Incluir na Rota do Dia | C360 Mapa | Ir p/ rota | navega SmartRouteOptimizer | ✅ funcionando | manter |
| Site (do cadastro) | C360 Geral | Abrir site | `safeOpenUrl` valida domínio | ✅ **já tem fallback seguro** | manter |

## 🔗 Link quebrado — lista de suspeitos (não consegui reproduzir pelo vídeo)

Ordenados por probabilidade de causar "Não é possível acessar esse site":

| # | Origem | URL | Por que pode quebrar | Status |
|---|--------|-----|----------------------|--------|
| 1 | **C360 → "Abrir WhatsApp (pré-preenchido)"** | `wa.me/<phone cru>` | Telefone com máscara `(14) 99999-9999` ia direto no wa.me, gerando URL inválida | ✅ **CORRIGIDO agora** (limpa `\D`) |
| 2 | **C360 → "Link Trac."** | `https://nr22888.base44.app/...` | Domínio **hardcoded**; se o app publicado tiver outro domínio, o link copiado abre "site indisponível" | ⚠️ **Pendente aprovação** (confirmar domínio real) |
| 3 | PWA → "Abrir no Chrome" | `intent://...` | Não resolve no preview/desktop | ✅ corrigido em rodada anterior |
| 4 | RouteOptimizer / Mapa | `google.com/maps/...` | Válido | OK |
| 5 | WhatsAppHub | `wa.me/...` (já limpa `\D`) | Válido | OK |

> **Para confirmar a causa exata:** envie o **print do erro com a URL visível**. Se a URL começar com `nr22888.base44.app`, é o suspeito #2; se for um `wa.me` com parênteses/espaços, era o #1 (já corrigido).

## Botões com aparência de envio automático (varredura completa)
- ✅ C360 "Enviar p/ Aprovação" (aviãozinho `Send`) → **"Preparar p/ Aprovação"** (ícone `ClipboardCheck`).
- ✅ Nenhum outro ícone `Send`/aviãozinho restante em DashboardSniper, WhatsAppHub, Central SAFE, ScoreElite, C360.

## Telas auditadas nesta rodada (código real)
- **PlanoEliteStatus:** botões "Ativar Score Elite", "Ver ranking", "Aprovar mensagens" → todos funcionam e navegam certo. OK.
- **PendenciasPara100:** ✅ recolhido por padrão (`useState(false)`). OK.
- **ExportClinicReportWithROI:** gera PDF local (jsPDF), sem função externa. OK.
- **ClienteDetalhe360:** fluxo de aprovação com 3 estados separados (aprovado → wa aberto → envio confirmado) — **modelo seguro exemplar**. 2 correções de wording + 1 de telefone aplicadas.

## Ajustes aplicados nesta rodada (seguros)
1. ✅ C360: telefone limpo (`\D`) antes do `wa.me` — corrige link quebrado provável no campo.
2. ✅ C360: "Enviar p/ Aprovação" → "Preparar p/ Aprovação" (sem aviãozinho).
3. ✅ C360: "Aprovar" → "Aprovar texto" (fluxo seguro padronizado).

## Ajustes que precisam de aprovação
1. **"Link Trac." (C360):** confirmar/parametrizar o domínio real publicado em vez de `nr22888.base44.app` hardcoded.
2. **Unificações** (seção 5): ScoreElite×Ranking · Rotas (Rápida/Otimizador/Mapa) · agrupar atalhos do Dashboard em "Ferramentas".
3. **"Editar" (Central SAFE):** ligar a edição real ou ocultar.

## Nova nota visual
**8.4 → 8.6** (após corrigir o link de WhatsApp quebrável e padronizar wording no Cliente 360).

> **Próximo passo para você:** mandar o **print do erro "site indisponível" com a URL** para eu confirmar o suspeito #2 e propor a correção exata do domínio.
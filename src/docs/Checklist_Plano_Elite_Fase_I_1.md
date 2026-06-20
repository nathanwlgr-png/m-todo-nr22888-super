# Checklist Plano Elite - Fase I.1

## Objetivo
Correção técnica e validação da Fase I antes de avançar para Fase II, sem apagar dados e sem alterar o fluxo antigo.

## Atualização real de prioridade_rank
Registros atualizados em EliteToolConnection:
- baixa → prioridade_rank 1: 2 registros.
- media → prioridade_rank 2: 5 registros.
- alta → prioridade_rank 3: 9 registros.
- maxima → prioridade_rank 4: 6 registros.

## Modelos testados com InvokeLLM real
Prompt usado: “Responda apenas OK_MODELO_VALIDADO.”

Resultados:
- comercial / gpt_5_5: sucesso — OK_MODELO_VALIDADO.
- auditoria / claude_opus_4_8: sucesso — OK_MODELO_VALIDADO.
- documento / gemini_3_1_pro: sucesso — OK_MODELO_VALIDADO.
- rotina / claude_sonnet_4_6: sucesso — OK_MODELO_VALIDADO.
- simples / automatic: sucesso — OK_MODELO_VALIDADO.

## Fallback definitivo mantido
- Comercial: gpt_5_5 → gpt_5_4 → gpt_5_mini → automatic.
- Auditoria/arquitetura: claude_opus_4_8 → claude_opus_4_7 → claude_opus_4_6 → claude_sonnet_4_6 → automatic.
- Documento/visual: gemini_3_1_pro → gemini_3_flash → automatic.
- Rotina: claude_sonnet_4_6 → gpt_5_mini → automatic.
- Simples: automatic.

## Regra de internet corrigida
O EliteAIEngine agora tenta executar com add_context_from_internet usando o modelo recomendado e seus fallbacks. Se todos falharem com internet, executa sem internet e registra o fallback no EliteAIRecommendationLog, sem quebrar a tela.

## Arquivos corrigidos
- lib/EliteAIEngine.js: fallback seguro, tentativa com internet e fallback sem internet registrado.
- entities/EliteAIRecommendationLog.json: campo modo_operacional adicionado.
- entities/EliteToolConnection.json: campo prioridade_rank adicionado.
- components/elite/PlanoEliteStatus.jsx: ordenação por prioridade_rank e filtro local de mensagens pendentes/legadas.
- pages/DashboardSniper: contadores protegidos contra undefined.

## Rotas validadas
- /RankingOportunidades existe no App.jsx.
- /WhatsAppHub existe no App.jsx.
Nenhuma página provisória foi criada porque as rotas já existem.

## Filtros corrigidos
O bloco Plano Elite considera mensagens com status:
- pending
- aguardando_aprovacao
- ready_to_send
- rascunho

## Status real do DashboardSniper
O DashboardSniper carregou no preview sem tela branca ou erro crítico. A captura mostrou o painel principal renderizando normalmente. O modal de instalação PWA apareceu sobre o conteúdo, então o bloco Plano Elite pode ficar abaixo/oculto no primeiro viewport, mas a página compilou e renderizou.

## Bloco Plano Elite no preview
O bloco foi inserido logo após o Sniper do Dia. No preview capturado, o app abriu com o modal “Instalar Seamaty NR22”, cobrindo parte da tela; não foi possível confirmar visualmente o bloco inteiro nessa captura sem fechar o modal/rolar, mas não houve erro de importação, rota ou variável.

## Riscos restantes
- Validar visualmente o bloco Plano Elite após fechar o modal PWA e rolar abaixo do Sniper do Dia.
- Gmail, Drive amplo e Docs seguem pendentes até autorização/conexão específica.
- Próxima fase deve continuar complementar, sem substituir DashboardSniper.

## Status final Fase I.1
Finalizada e apta para seguir para Fase II somente após conferência visual do bloco no preview sem o modal PWA.
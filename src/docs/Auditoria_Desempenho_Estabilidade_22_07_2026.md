# Auditoria de Desempenho e Estabilidade — NR22888

Data: 22/07/2026
Escopo: problemas críticos e importantes, com foco em Samsung Galaxy Tab, Android, PWA/offline, navegação e consumo de chamadas.

## Resumo executivo

A base está estruturalmente forte: páginas secundárias usam carregamento sob demanda, o cache global evita recargas agressivas, o fluxo principal está roteado explicitamente e existe proteção contra builds antigos do PWA. Os principais riscos encontrados não exigiam mudança comercial: eram sobrecarga no início, consultas repetidas, detecção estática do tablet e uma configuração de cache incompatível com a versão atual.

## Pontos fortes confirmados

- Páginas secundárias carregadas sob demanda, reduzindo o pacote inicial.
- Rotas principais explícitas e protegidas pelo mesmo layout.
- Cache global conservador, sem atualização a cada foco da janela.
- Recuperação automática de módulos antigos armazenados pelo PWA.
- Fila offline preserva operações críticas de Cliente, Lead, Visita, Venda e Tarefa.
- Investigação executa fontes independentes em paralelo.
- Mensagens externas continuam dependentes de aprovação humana.
- Layout dedicado para tablet e navegação inferior dedicada ao celular.

## Problemas críticos corrigidos

### 1. Layout de tablet não reagia à rotação ou ao modo DeX
A detecção era calculada apenas uma vez. O estado agora é recalculado de forma controlada após rotação e redimensionamento, mantendo a interface correta sem recarregar a página.

### 2. Galaxy Tab podia ser identificado como celular
A identificação dependia principalmente do texto do navegador. Agora também considera tela touch com lado menor de pelo menos 600 px, cobrindo navegadores Samsung que usam identificação móvel.

### 3. Cache específico do tablet usava opção incompatível
A configuração antiga usava `cacheTime`, enquanto a versão atual trabalha com coleta por `gcTime`. O limite de memória agora é efetivamente aplicado.

### 4. Trabalho inútil durante a abertura
A inicialização lia toda a fila offline apenas para escrever uma mensagem técnica. Essa leitura foi removida; o banco offline e a fila continuam intactos.

## Problemas importantes corrigidos

### 5. Alertas eram consultados separadamente
Celular, tablet e Dashboard usavam chaves diferentes para os mesmos alertas. Agora compartilham o mesmo cache, reduzindo chamadas repetidas e memória.

### 6. Tablet consultava alertas a cada minuto
A atualização automática fixa foi removida. Os alertas usam cache de dois minutos e renovação natural, suficiente para operação de campo e mais econômica.

### 7. Limpeza administrativa era executada na abertura diária
O Dashboard chamava uma função de revisão de limpeza a cada entrada, mesmo sem relação com conversão. A chamada foi removida da tela operacional; a rotina existente continua disponível fora do caminho crítico.

### 8. Botão PWA aparecia onde não deveria
O botão podia renderizar no editor, em instalação já ativa ou durante o período de dispensa. Agora só é montado quando o ambiente realmente permite instalação.

## Pontos fracos residuais observados

- O Dashboard ainda agrega várias fontes porque precisa montar uma visão operacional completa. Reduzir mais chamadas exigiria um endpoint consolidado e aumentaria risco antes do uso de amanhã.
- Há muitos módulos legados no repositório, embora a maioria não entre no pacote inicial por causa do carregamento sob demanda.
- Algumas páginas antigas ainda usam estilos e padrões diferentes; uma consolidação ampla agora aumentaria risco sem ganho imediato de conversão.
- A validação ponta a ponta de todos os botões deve ser feita pelo Testing Agent no ambiente publicado.

## Decisão arquitetural

Não foram criadas páginas, funções ou integrações. As correções alteram apenas infraestrutura de carregamento, cache, detecção de dispositivo e chamadas redundantes. O fluxo Dashboard Sniper → Cliente → Investigação → SPIN → WhatsApp → Proposta → Fechamento foi preservado.
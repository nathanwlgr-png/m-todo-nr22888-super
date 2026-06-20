# Regra de Evidência para Percentuais — NR22888

Esta auditoria não considera nenhuma área como nível elite sem evidência prática.

## Evidências aceitas

- Arquivo lido.
- Entidade consultada.
- Preview capturado.
- Função testada.
- Log encontrado.
- Rota validada.
- Print gerado.
- Erro retornado.
- Quantidade real de registros analisados.

## Marcação obrigatória

Se algo não foi validado fisicamente, registrar:

**NÃO VALIDADO EM DISPOSITIVO REAL**

Áreas marcadas assim nesta auditoria:
- GPS físico do tablet/celular.
- Precisão de localização real.
- PWA offline real em campo.
- Navegação Google Maps/Waze a partir do PWA em Android.
- Uso real de Telegram bot no app Telegram.

## Fórmulas usadas

### Produtos/Fotos
`(produtos_obrigatórios_cadastrados / 29 * 65) + (produtos_com_foto_oficial / 29 * 35)`

Resultado: 65%.

### Ferramentas/Conexões
`(conectadas/nativas + parciais*0,5) / total_de_ferramentas`

Resultado: 69%.

### GPS/Mapa/Rotas
Resultado vindo de GeoAuditReport real e seus subcritérios: clientes, coordenadas, visitas, arquivos lidos e funções testadas.

Resultado: 58%.

### Sistema geral
Média simples das 11 categorias auditadas, todas com evidência declarada.

Resultado: 68%.
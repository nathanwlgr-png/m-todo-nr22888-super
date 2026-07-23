import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const catalogFields = ['nome_produto', 'codigo_produto', 'categoria', 'linha', 'descricao_curta', 'descricao_comercial', 'especificacoes', 'tempo_resultado', 'parametros', 'volume_amostra', 'tipo_insumo', 'quantidade_caixa', 'unidade_venda', 'equipamentos_compativeis', 'preco_base', 'preco_faixa_2', 'preco_faixa_3', 'preco_faixa_4', 'rotulo_faixa_1', 'rotulo_faixa_2', 'rotulo_faixa_3', 'rotulo_faixa_4', 'custo_insumo', 'preco_visivel_cliente', 'imagem_url', 'foto_oficial', 'status_foto', 'fonte_validacao', 'data_validacao', 'ativo', 'prioridade_comercial', 'indicado_para', 'argumentos_venda', 'objecoes_comuns', 'resposta_objecoes', 'materiais_relacionados', 'observacao', 'status_auditoria'];
const productFields = ['name', 'description', 'category', 'sku', 'price', 'stock', 'supplier', 'specifications', 'status', 'is_active'];
const nonNegativeFields = new Set(['quantidade_caixa', 'preco_base', 'preco_faixa_2', 'preco_faixa_3', 'preco_faixa_4', 'custo_insumo', 'price', 'stock']);

const cleanUpdate = (data, allowed) => Object.fromEntries(Object.entries(data || {}).filter(([key]) => allowed.includes(key)));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Acesso restrito a administradores' }, { status: 403 });

    const body = await req.json();
    if (body.confirmed !== true) return Response.json({ error: 'Confirmação explícita obrigatória' }, { status: 400 });
    const source = String(body.source || '').trim();
    if (!source) return Response.json({ error: 'Fonte da alteração obrigatória' }, { status: 400 });
    if (!body.id) return Response.json({ error: 'Produto obrigatório' }, { status: 400 });

    const isCatalog = body.entity === 'ProductCatalog';
    const isProduct = body.entity === 'Product';
    if (!isCatalog && !isProduct) return Response.json({ error: 'Entidade não permitida' }, { status: 400 });

    const before = isCatalog
      ? await base44.asServiceRole.entities.ProductCatalog.get(body.id)
      : await base44.asServiceRole.entities.Product.get(body.id);
    const update = cleanUpdate(body.data, isCatalog ? catalogFields : productFields);
    if (!Object.keys(update).length) return Response.json({ error: 'Nenhum campo permitido informado' }, { status: 400 });

    for (const [field, value] of Object.entries(update)) {
      if (nonNegativeFields.has(field) && value != null && (!Number.isFinite(Number(value)) || Number(value) < 0)) {
        return Response.json({ error: `${field} deve ser um número não negativo` }, { status: 400 });
      }
    }

    const after = isCatalog
      ? await base44.asServiceRole.entities.ProductCatalog.update(body.id, update)
      : await base44.asServiceRole.entities.Product.update(body.id, update);

    await base44.asServiceRole.entities.EliteActionLog.create({
      data_hora: new Date().toISOString(),
      usuario: user.email,
      agente: 'adminProductChange',
      ferramenta_usada: isCatalog ? 'ProductCatalog' : 'Product',
      acao_sugerida: `Atualizar produto ${body.id}`,
      acao_executada: 'update',
      aprovado_pelo_usuario: true,
      resultado: 'alteração aplicada e auditada',
      observacao: JSON.stringify({ source, before, after }).slice(0, 15000)
    });

    return Response.json({ success: true, id: after.id, updated_date: after.updated_date, audit_recorded: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
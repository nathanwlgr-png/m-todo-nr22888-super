import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Search, Send, ShieldCheck } from 'lucide-react';
import CatalogProductCard from '@/components/catalog/CatalogProductCard';
import { Input } from '@/components/ui/input';

const normalizeProducts = (catalog, products) => {
  const combined = [
    ...catalog.filter(p => p.ativo !== false).map(p => ({ id: p.id, source: 'ProductCatalog', name: p.nome_produto, category: p.linha || p.categoria, image_url: p.imagem_url || '' })),
    ...products.filter(p => p.is_active !== false && p.status !== 'inativo').map(p => ({ id: p.id, source: 'Product', name: p.name, category: p.category, image_url: '' })),
  ];
  const seen = new Set();
  return combined.filter(p => p.name && !seen.has(p.name.trim().toLowerCase()) && seen.add(p.name.trim().toLowerCase()));
};

export default function CatalogoCliente() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('codigo');
  const requestId = params.get('pedido');
  const token = params.get('token');
  const [request, setRequest] = useState(null);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  useEffect(() => {
    Promise.all([
      base44.entities.CatalogRequest.filter({ id: requestId, client_code: code, access_token: token }),
      base44.entities.ProductCatalog.list('nome_produto', 500),
      base44.entities.Product.list('name', 500),
    ]).then(([requests, catalog, allProducts]) => {
      if (!requests[0]) throw new Error('Link inválido ou expirado');
      setRequest(requests[0]);
      setProducts(normalizeProducts(catalog, allProducts));
    }).catch(err => setError(err.message || 'Não foi possível abrir o catálogo')).finally(() => setLoading(false));
  }, [code, requestId, token]);

  const selectedIds = useMemo(() => new Set((request?.selected_items || []).map(item => `${item.product_source}:${item.product_id}`)), [request]);
  const filtered = products.filter(p => `${p.name} ${p.category || ''}`.toLowerCase().includes(search.toLowerCase()));

  const toggleProduct = async (product) => {
    if (!request || request.status === 'validado') return;
    setSaving(true); setSent(false); setError('');
    const key = `${product.source}:${product.id}`;
    const exists = selectedIds.has(key);
    const item = { product_id: product.id, product_source: product.source, product_name: product.name, category: product.category || '', image_url: product.image_url || '' };
    const selected = exists ? request.selected_items.filter(i => `${i.product_source}:${i.product_id}` !== key) : [...(request.selected_items || []), item];
    const history = [...(request.change_history || []), { changed_at: new Date().toISOString(), action: exists ? 'removido' : 'adicionado', product_id: product.id, product_name: product.name, actor: 'cliente' }];
    const updated = { ...request, selected_items: selected, change_history: history, revision: (request.revision || 0) + 1 };
    try {
      await base44.entities.CatalogRequest.update(request.id, { selected_items: selected, change_history: history, revision: updated.revision });
      setRequest(updated);
    } catch {
      setError('Não foi possível salvar a alteração. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const submit = async () => {
    if (!request?.selected_items?.length) { setError('Selecione pelo menos um item.'); return; }
    setSaving(true); setError('');
    const now = new Date().toISOString();
    const history = [...(request.change_history || []), { changed_at: now, action: 'enviado', actor: 'cliente' }];
    try {
      await base44.entities.CatalogRequest.update(request.id, { status: 'aguardando_validacao', submitted_at: now, change_history: history });
      setRequest(prev => ({ ...prev, status: 'aguardando_validacao', submitted_at: now, change_history: history }));
      setSent(true);
    } catch {
      setError('Não foi possível enviar. Verifique a conexão e tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (error && !request) return <div className="flex min-h-screen items-center justify-center bg-background p-6 text-center text-destructive">{error}</div>;

  return <main className="min-h-screen bg-background pb-28 text-foreground">
    <header className="sticky top-0 z-20 border-b bg-background/95 px-4 py-4 backdrop-blur"><div className="mx-auto max-w-5xl"><div className="flex items-center gap-2 text-primary"><ShieldCheck className="h-5 w-5" /><span className="text-sm font-bold">Seleção protegida · Código {code}</span></div><h1 className="mt-2 text-2xl font-black">Escolha os produtos de interesse</h1><p className="mt-1 text-sm text-muted-foreground">Marque ou desmarque quando quiser. Nenhum valor é exibido; o orçamento será validado depois.</p><div className="relative mt-4"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar produto ou insumo" className="h-10 pl-9" /></div></div></header>
    <section className="mx-auto grid max-w-5xl grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-4">{filtered.map(product => <CatalogProductCard key={`${product.source}:${product.id}`} product={product} selected={selectedIds.has(`${product.source}:${product.id}`)} disabled={saving || request.status === 'validado'} onToggle={toggleProduct} />)}</section>
    {!filtered.length && <p className="p-8 text-center text-muted-foreground">Nenhum produto encontrado.</p>}
    <footer className="fixed bottom-0 left-0 right-0 z-30 border-t bg-background/95 p-3 backdrop-blur"><div className="mx-auto flex max-w-5xl items-center gap-3"><div className="flex-1"><p className="font-bold">{request.selected_items?.length || 0} selecionados</p><p className="text-xs text-muted-foreground">{saving ? 'Salvando alteração...' : sent ? 'Seleção enviada para validação.' : 'Cada alteração fica registrada.'}</p></div><button onClick={submit} disabled={saving || request.status === 'validado'} className="flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 font-bold text-primary-foreground disabled:opacity-50"><Send className="h-4 w-4" />{request.status === 'validado' ? 'Validado' : 'Enviar'}</button></div>{error && <p className="mx-auto mt-2 max-w-5xl text-sm text-destructive">{error}</p>}</footer>
  </main>;
}
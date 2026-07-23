import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Search, Send, ShieldCheck } from 'lucide-react';
import CatalogProductCard from '@/components/catalog/CatalogProductCard';
import CatalogAccessGate from '@/components/catalog/CatalogAccessGate';
import { Input } from '@/components/ui/input';

const PAGE_VIEW_ID = crypto.randomUUID();

export default function CatalogoCliente() {
  const params = new URLSearchParams(window.location.search);
  const credentials = { request_id: params.get('pedido'), client_code: params.get('codigo'), access_token: params.get('token') };
  const [request, setRequest] = useState(null);
  const [products, setProducts] = useState([]);
  const [sessionToken, setSessionToken] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  useEffect(() => {
    base44.functions.invoke('catalogOrderAccess', { action: 'load', view_id: PAGE_VIEW_ID, ...credentials })
      .then((access) => setRequest(access.data.request))
      .catch((err) => setError(err.response?.data?.error || err.message || 'Não foi possível abrir o catálogo'))
      .finally(() => setLoading(false));
  }, []);

  const verify = async (code) => {
    const response = await base44.functions.invoke('catalogOrderAccess', { action: 'verify', code, ...credentials });
    setRequest(response.data.request);
    setProducts(response.data.products || []);
    setSessionToken(response.data.session_token);
  };
  const selectedByKey = useMemo(() => new Map((request?.selected_items || []).map((item) => [`${item.product_source}:${item.product_id}`, item])), [request]);
  const selectedUnits = useMemo(() => [...selectedByKey.values()].reduce((total, item) => total + (item.quantity || 1), 0), [selectedByKey]);
  const filtered = products.filter((product) => `${product.name} ${product.category || ''}`.toLowerCase().includes(search.toLowerCase()));

  const saveSelection = async (selectedItems, change) => {
    setSaving(true); setSent(false); setError('');
    try {
      const response = await base44.functions.invoke('catalogOrderAccess', { action: 'update_selection', selected_items: selectedItems, change, session_token: sessionToken, ...credentials });
      setRequest(response.data.request);
    } catch (err) { setError(err.response?.data?.error || 'Não foi possível salvar a alteração.'); }
    finally { setSaving(false); }
  };
  const toggleProduct = (product) => {
    if (!request || request.status === 'validado') return;
    const key = `${product.source}:${product.id}`;
    const exists = selectedByKey.has(key);
    const item = { product_id: product.id, product_source: product.source, product_name: product.name, category: product.category || '', image_url: product.image_url || '', quantity: 1 };
    const selected = exists ? request.selected_items.filter((row) => `${row.product_source}:${row.product_id}` !== key) : [...(request.selected_items || []), item];
    saveSelection(selected, { action: exists ? 'removido' : 'adicionado', product_id: product.id, product_name: product.name });
  };
  const updateQuantity = (product, quantity) => {
    const nextQuantity = Math.max(1, Math.min(999, quantity));
    const selected = (request.selected_items || []).map((item) => `${item.product_source}:${item.product_id}` === `${product.source}:${product.id}` ? { ...item, quantity: nextQuantity } : item);
    saveSelection(selected, { action: 'quantidade_alterada', product_id: product.id, product_name: product.name, quantity: nextQuantity });
  };
  const submit = async () => {
    if (!request?.selected_items?.length) { setError('Selecione pelo menos um item.'); return; }
    setSaving(true); setError('');
    try {
      const response = await base44.functions.invoke('catalogOrderAccess', { action: 'submit', session_token: sessionToken, ...credentials });
      setRequest((current) => ({ ...current, status: 'aguardando_validacao', signed_at: response.data.signed_at }));
      setSent(true);
    } catch (err) { setError(err.response?.data?.error || 'Não foi possível confirmar a seleção.'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (error && !request) return <div className="flex min-h-screen items-center justify-center bg-background p-6 text-center text-destructive">{error}</div>;
  if (!sessionToken) return <CatalogAccessGate clientName={request.client_name} expiresAt={request.expires_at} onVerify={verify} />;

  return <main className="min-h-screen bg-background pb-28 text-foreground">
    <header className="sticky top-0 z-20 border-b bg-background/95 px-4 py-4 backdrop-blur"><div className="mx-auto max-w-5xl"><div className="flex items-center gap-2 text-primary"><ShieldCheck className="h-5 w-5" /><span className="text-sm font-bold">Confirmado por código · válido por 24 horas</span></div><h1 className="mt-2 text-2xl font-black">Escolha os produtos e quantidades</h1><p className="mt-1 text-sm text-muted-foreground">Rotores, cassetes, instrumentos, acessórios e insumos. Nenhum valor é exibido.</p><div className="relative mt-4"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar produto ou insumo" className="h-10 pl-9" /></div></div></header>
    <section className="mx-auto grid max-w-5xl grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-4">{filtered.map((product) => { const selected = selectedByKey.get(`${product.source}:${product.id}`); return <CatalogProductCard key={`${product.source}:${product.id}`} product={product} selected={!!selected} quantity={selected?.quantity || 1} disabled={saving || ['validado', 'aguardando_validacao'].includes(request.status)} onToggle={toggleProduct} onQuantityChange={updateQuantity} />; })}</section>
    {!filtered.length && <p className="p-8 text-center text-muted-foreground">Nenhum produto encontrado.</p>}
    <footer className="fixed bottom-0 left-0 right-0 z-30 border-t bg-background/95 p-3 backdrop-blur"><div className="mx-auto flex max-w-5xl items-center gap-3"><div className="flex-1"><p className="font-bold">{request.selected_items?.length || 0} produtos · {selectedUnits} unidades</p><p className="text-xs text-muted-foreground">{saving ? 'Salvando...' : sent || (request.signed_at && request.status !== 'reaberto') ? 'Seleção confirmada e enviada.' : 'Cada alteração fica salva.'}</p></div><button onClick={submit} disabled={saving || ['validado', 'aguardando_validacao'].includes(request.status)} className="flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 font-bold text-primary-foreground disabled:opacity-50"><Send className="h-4 w-4" />{request.signed_at && request.status !== 'reaberto' ? 'Confirmado' : 'Confirmar pedido'}</button></div>{error && <p className="mx-auto mt-2 max-w-5xl text-sm text-destructive">{error}</p>}</footer>
  </main>;
}
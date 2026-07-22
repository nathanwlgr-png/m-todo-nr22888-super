import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Loader2, Search, PackageOpen } from 'lucide-react';
import ClientProductDemoCard from '@/components/catalog/ClientProductDemoCard';
import ClientProductDemoDetails from '@/components/catalog/ClientProductDemoDetails';

export default function ClientProductDemo({ client }) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const { data: products = [], isLoading } = useQuery({ queryKey: ['client-product-demo'], queryFn: () => base44.entities.ProductCatalog.list('-prioridade_comercial', 100), staleTime: 5 * 60 * 1000 });
  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();
    const interest = (client?.equipment_interest || '').toLowerCase();
    return products.filter((p) => p.ativo !== false && (!term || [p.nome_produto, p.linha, p.categoria, p.parametros].some((v) => v?.toLowerCase().includes(term)))).sort((a, b) => Number((b.nome_produto + b.linha).toLowerCase().includes(interest) && !!interest) - Number((a.nome_produto + a.linha).toLowerCase().includes(interest) && !!interest));
  }, [products, search, client?.equipment_interest]);
  const visible = showAll ? filtered : filtered.slice(0, 6);

  return <section className="rounded-2xl p-4" style={{ background: '#111', border: '1px solid rgba(255,107,0,0.3)' }}>
    <div className="mb-3"><p className="text-[10px] font-black uppercase tracking-widest text-orange-400">Demonstração rápida</p><h2 className="text-base font-black text-white">Produtos Seamaty</h2></div>
    <div className="relative mb-3"><Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar produto, linha ou parâmetro" className="border-zinc-700 bg-zinc-900 pl-9 text-white" /></div>
    {isLoading ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-orange-400" /></div> : visible.length ? <div className="grid grid-cols-2 gap-3 md:grid-cols-3">{visible.map((product) => <ClientProductDemoCard key={product.id} product={product} onOpen={setSelected} />)}</div> : <div className="flex flex-col items-center py-8 text-slate-500"><PackageOpen className="mb-2 h-8 w-8" /><p className="text-xs">Nenhum produto encontrado</p></div>}
    {filtered.length > 6 && <button type="button" onClick={() => setShowAll((value) => !value)} className="mt-3 w-full rounded-xl border border-orange-500/30 py-2 text-xs font-black text-orange-400">{showAll ? 'Mostrar menos' : `Ver todos (${filtered.length})`}</button>}
    <ClientProductDemoDetails product={selected} onClose={() => setSelected(null)} />
  </section>;
}
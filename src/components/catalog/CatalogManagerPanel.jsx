import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import CatalogProductEditor from '@/components/catalog/CatalogProductEditor';
import { toast } from 'sonner';

export default function CatalogManagerPanel() {
  const [search, setSearch] = useState('');
  const client = useQueryClient();
  const { data: catalog = [], isLoading } = useQuery({ queryKey: ['product-catalog'], queryFn: () => base44.entities.ProductCatalog.list('nome_produto', 500) });
  const update = useMutation({ mutationFn: ({ id, data }) => base44.entities.ProductCatalog.update(id, data), onSuccess: () => { client.invalidateQueries({ queryKey: ['product-catalog'] }); toast.success('Catálogo atualizado'); }, onError: (error) => toast.error(error.message) });
  const filtered = catalog.filter((item) => `${item.nome_produto} ${item.codigo_produto || ''} ${item.linha || ''}`.toLowerCase().includes(search.toLowerCase()));
  return <section className="space-y-3"><div><h2 className="text-xl font-bold">Catálogo oficial Seamaty</h2><p className="text-sm text-muted-foreground">Produtos, fotos, caixas e preços internos. O link do cliente não recebe valores.</p></div><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar equipamento, insumo ou código" className="max-w-md" />{isLoading ? <p className="text-sm text-muted-foreground">Carregando catálogo...</p> : <div className="grid gap-3 lg:grid-cols-2">{filtered.map((product) => <CatalogProductEditor key={product.id} product={product} saving={update.isPending} onSave={(id, data) => update.mutateAsync({ id, data })} />)}</div>}</section>;
}
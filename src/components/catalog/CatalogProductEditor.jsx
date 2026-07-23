import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Edit2, Save, X } from 'lucide-react';

export default function CatalogProductEditor({ product, onSave, saving }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(product);
  const change = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const save = async () => {
    const source = window.prompt('Informe a fonte oficial desta alteração:');
    if (!source?.trim()) return;
    if (!window.confirm('Confirma a alteração? O estado anterior será registrado para auditoria e reversão.')) return;
    await onSave(product.id, form, source.trim());
    setEditing(false);
  };
  if (!editing) return <Card className="flex gap-3 p-3"><div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">{product.imagem_url && <img src={product.imagem_url} alt="" className="h-full w-full object-contain" />}</div><div className="min-w-0 flex-1"><p className="font-semibold">{product.nome_produto}</p><p className="text-xs text-muted-foreground">{product.linha || product.categoria} · {product.quantidade_caixa || 1} por {product.unidade_venda || 'caixa'}</p><p className="mt-1 font-bold">{product.preco_base == null ? 'Preço pendente' : product.preco_base.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p></div><Button variant="outline" size="icon" onClick={() => setEditing(true)} aria-label="Editar produto" className="min-h-11 min-w-11"><Edit2 /></Button></Card>;
  return <Card className="space-y-3 p-3"><div className="grid gap-2 sm:grid-cols-2"><Input value={form.nome_produto || ''} onChange={(e) => change('nome_produto', e.target.value)} placeholder="Nome" /><Input value={form.codigo_produto || ''} onChange={(e) => change('codigo_produto', e.target.value)} placeholder="Código" /><Input type="number" step="0.01" value={form.preco_base ?? ''} onChange={(e) => change('preco_base', e.target.value === '' ? null : Number(e.target.value))} placeholder="Preço faixa 1" /><Input type="number" step="0.01" value={form.preco_faixa_2 ?? ''} onChange={(e) => change('preco_faixa_2', e.target.value === '' ? null : Number(e.target.value))} placeholder="Preço faixa 2" /><Input type="number" step="0.01" value={form.preco_faixa_3 ?? ''} onChange={(e) => change('preco_faixa_3', e.target.value === '' ? null : Number(e.target.value))} placeholder="Preço faixa 3" /><Input type="number" step="0.01" value={form.preco_faixa_4 ?? ''} onChange={(e) => change('preco_faixa_4', e.target.value === '' ? null : Number(e.target.value))} placeholder="Preço faixa 4" /><Input type="number" value={form.quantidade_caixa || 1} onChange={(e) => change('quantidade_caixa', Number(e.target.value))} placeholder="Unidades por caixa" /><Input value={form.imagem_url || ''} onChange={(e) => change('imagem_url', e.target.value)} placeholder="URL da foto oficial" /><Input value={form.equipamentos_compativeis?.join(', ') || ''} onChange={(e) => change('equipamentos_compativeis', e.target.value.split(',').map((v) => v.trim()).filter(Boolean))} placeholder="Equipamentos compatíveis" /></div><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setEditing(false)}><X />Cancelar</Button><Button onClick={save} disabled={saving}><Save />Salvar</Button></div></Card>;
}
import React from 'react';
import { Check, ShieldAlert, Trash2 } from 'lucide-react';

const money = (value) => Number(value || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function SalesCaptureCard({ result, loading, onApprove, onDiscard }) {
  const draft = result.draft;
  if (result.applied) return <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-300">Venda cadastrada após sua aprovação.</div>;
  return <div className="space-y-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
    <p className="flex items-center gap-2 font-bold text-amber-300"><ShieldAlert className="h-4 w-4" /> Pronto para sua aprovação</p>
    <div><p className="font-semibold">{draft.client_name || 'Cliente não identificado'}</p><p className="text-xs text-slate-400">{result.client_matched ? 'Cliente localizado no CRM' : 'Cliente não localizado — aprovação bloqueada'}</p></div>
    <ul className="space-y-1">{draft.items?.map((item, index) => <li key={index}>{item.quantity || 1}x {item.name} — {money(item.total_value || item.unit_value)}</li>)}</ul>
    <p className="text-lg font-black text-white">Total: {money(draft.total_value)}</p>
    <p className="text-xs text-slate-400">{draft.sale_date || 'Data não identificada'} · {draft.payment_terms || 'Condição não identificada'}</p>
    <div className="flex gap-2"><button onClick={onApprove} disabled={loading || !result.client_matched} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-500 p-3 font-bold text-black disabled:opacity-40"><Check className="h-4 w-4" /> Aceitar e cadastrar</button><button onClick={onDiscard} disabled={loading} aria-label="Descartar" className="rounded-lg border border-white/20 p-3"><Trash2 className="h-4 w-4" /></button></div>
  </div>;
}
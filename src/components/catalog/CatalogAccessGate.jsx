import React, { useState } from 'react';
import { KeyRound, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function CatalogAccessGate({ clientName, expiresAt, onVerify }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const verify = async () => { setLoading(true); setError(''); try { await onVerify(code); } catch (e) { setError(e.response?.data?.error || e.message || 'Código incorreto'); } finally { setLoading(false); } };
  return <main className="flex min-h-screen items-center justify-center bg-background p-5"><section className="w-full max-w-sm rounded-2xl border bg-card p-6 shadow-lg"><KeyRound className="mb-4 h-9 w-9 text-primary" /><h1 className="text-xl font-black">Confirme o código</h1><p className="mt-2 text-sm text-muted-foreground">Digite o código de 6 números enviado no WhatsApp para acessar a seleção de {clientName}.</p><Input inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} placeholder="000000" className="mt-5 h-12 text-center text-xl tracking-[0.35em]" /><button onClick={verify} disabled={loading || code.length !== 6} className="mt-3 flex min-h-11 w-full items-center justify-center rounded-xl bg-primary font-bold text-primary-foreground disabled:opacity-50">{loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Confirmar e abrir'}</button>{error && <p className="mt-3 text-sm text-destructive">{error}</p>}<p className="mt-4 text-center text-xs text-muted-foreground">Link válido até {new Date(expiresAt).toLocaleString('pt-BR')}</p></section></main>;
}
import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AuditComposer({ onSend, disabled }) {
  const [text, setText] = useState('');
  const submit = async (event) => {
    event.preventDefault();
    const content = text.trim();
    if (!content || disabled) return;
    setText('');
    await onSend(content);
  };
  return (
    <form onSubmit={submit} className="flex gap-2 border-t border-slate-800 bg-slate-950 p-3">
      <label htmlFor="audit-message" className="sr-only">Solicitação de auditoria</label>
      <textarea id="audit-message" value={text} onChange={(event) => setText(event.target.value)} rows={2}
        placeholder="Ex.: Audite o fluxo Dashboard Sniper → Cliente → Proposta"
        className="min-h-12 flex-1 resize-none rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-violet-500" />
      <Button type="submit" disabled={disabled || !text.trim()} className="min-h-12 min-w-12 bg-violet-600" aria-label="Enviar solicitação">
        <Send className="h-4 w-4" />
      </Button>
    </form>
  );
}
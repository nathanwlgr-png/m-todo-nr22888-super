import React, { useCallback, useEffect, useState } from 'react';
import { Bot, Loader2, ShieldCheck } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import AuditConversationPanel from '@/components/superagent/AuditConversationPanel';

const AGENT = 'nr22888_superagent_auditor';

export default function SuperAgentAudit() {
  const [conversation, setConversation] = useState(null);
  useEffect(() => {
    const load = async () => {
      const existing = await base44.agents.listConversations({ agent_name: AGENT });
      const current = existing?.[0] || await base44.agents.createConversation({ agent_name: AGENT, metadata: { name: 'Auditoria final NR22888', description: 'Validação controlada pré-publicação' } });
      const full = current.messages ? current : await base44.agents.getConversation(current.id);
      setConversation(full);
    };
    load();
  }, []);
  const updateMessages = useCallback((messages) => setConversation((current) => current ? { ...current, messages } : current), []);
  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 p-3 sm:p-6">
      <header className="rounded-2xl border border-violet-500/30 bg-slate-950 p-4 text-white">
        <div className="flex items-center gap-3"><Bot className="h-6 w-6 text-violet-400" /><div><h1 className="text-xl font-black">SuperAgent Auditor NR22888</h1><p className="text-sm text-slate-400">Diagnóstico seguro, sem envio, exclusão ou publicação automática.</p></div></div>
        <div className="mt-3 flex items-center gap-2 text-xs text-emerald-300"><ShieldCheck className="h-4 w-4" />Aprovação final exclusiva do Nathan</div>
      </header>
      {conversation ? <AuditConversationPanel conversation={conversation} onMessages={updateMessages} /> : <div className="flex min-h-48 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-violet-500" /></div>}
    </div>
  );
}
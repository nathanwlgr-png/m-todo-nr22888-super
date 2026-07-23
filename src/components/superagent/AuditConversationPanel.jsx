import React, { useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import AuditMessage from '@/components/superagent/AuditMessage';
import AuditComposer from '@/components/superagent/AuditComposer';

export default function AuditConversationPanel({ conversation, onMessages }) {
  const bottomRef = useRef(null);
  useEffect(() => {
    if (!conversation?.id) return undefined;
    const unsubscribe = base44.agents.subscribeToConversation(conversation.id, (data) => onMessages(data.messages || []));
    return unsubscribe;
  }, [conversation?.id, onMessages]);
  useEffect(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), [conversation?.messages]);
  const send = async (content) => {
    await base44.agents.addMessage(conversation, { role: 'user', content });
  };
  return (
    <section className="flex min-h-[65vh] flex-col overflow-hidden rounded-2xl border border-violet-500/30 bg-slate-950" aria-label="Conversa de auditoria">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {(conversation?.messages || []).length === 0 && (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-sm text-slate-300">Solicite uma auditoria por prioridade. O agente apenas lê dados e registra achados aprováveis.</div>
        )}
        {(conversation?.messages || []).map((message, index) => <AuditMessage key={message.id || index} message={message} />)}
        <div ref={bottomRef} />
      </div>
      <AuditComposer onSend={send} disabled={!conversation} />
    </section>
  );
}
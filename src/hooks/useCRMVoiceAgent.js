import { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

export default function useCRMVoiceAgent() {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!conversation?.id) return;
    return base44.agents.subscribeToConversation(conversation.id, (data) => {
      setMessages(data.messages || []);
      const last = data.messages?.at(-1);
      if (last?.role === 'assistant' && last.content) setLoading(false);
    });
  }, [conversation?.id]);

  const send = useCallback(async (content) => {
    if (!content.trim() || loading) return;
    setLoading(true); setError('');
    try {
      let current = conversation;
      if (!current) {
        current = await base44.agents.createConversation({ agent_name: 'nr22888_dia_dia', metadata: { name: 'Voz Campo Gemini', description: 'Assistência investigativa segura por voz' } });
        setConversation(current);
      }
      setMessages((items) => [...items, { role: 'user', content }]);
      await base44.agents.addMessage(current, { role: 'user', content });
    } catch (_error) {
      setError('Não consegui consultar o CRM agora. Nada foi alterado.');
      setLoading(false);
    }
  }, [conversation, loading]);

  return { messages, loading, error, send };
}
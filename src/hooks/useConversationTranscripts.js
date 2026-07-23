import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function useConversationTranscripts(clientId, clientPhone) {
  const interactions = useQuery({
    queryKey: ['client-transcripts', clientId],
    queryFn: () => base44.entities.Interaction.filter({ client_id: clientId }, '-created_date', 20),
    enabled: !!clientId,
  });
  const messages = useQuery({
    queryKey: ['client-whatsapp-transcripts', clientId],
    queryFn: () => base44.entities.WhatsAppMessage.filter({ contact_id: clientId }, '-created_date', 20),
    enabled: !!clientId,
  });
  const phoneMessages = useQuery({
    queryKey: ['client-whatsapp-transcripts-phone', clientPhone],
    queryFn: () => base44.entities.WhatsAppMessage.filter({ contact_phone: clientPhone }, '-created_date', 20),
    enabled: !!clientPhone,
  });

  const transcripts = useMemo(() => {
    const analyzedTexts = new Set((interactions.data || []).map(item => item.notes));
    const uniqueMessages = [...(messages.data || []), ...(phoneMessages.data || [])]
      .filter((item, index, list) => list.findIndex(candidate => candidate.id === item.id) === index);
    return [
      ...(interactions.data || []).map(item => ({ ...item, text: item.notes || item.subject, source: 'interaction' })),
      ...uniqueMessages.filter(item => !analyzedTexts.has(item.message)).map(item => ({
        ...item, text: item.message, source: 'whatsapp',
      })),
    ].filter(item => item.text).sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).slice(0, 20);
  }, [interactions.data, messages.data, phoneMessages.data]);

  return { transcripts, isLoading: interactions.isLoading || messages.isLoading || phoneMessages.isLoading };
}
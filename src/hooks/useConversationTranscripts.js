import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function useConversationTranscripts(clientId, clientPhone, clientName) {
  const interactions = useQuery({
    queryKey: ['client-transcripts', clientId],
    queryFn: () => base44.entities.Interaction.filter({ client_id: clientId }, '-created_date', 20),
    enabled: !!clientId,
  });
  const messages = useQuery({
    queryKey: ['client-whatsapp-transcripts', clientId],
    queryFn: () => base44.entities.WhatsAppMessage.list('-created_date', 100),
    enabled: !!clientId,
  });

  const transcripts = useMemo(() => {
    const analyzedTexts = new Set((interactions.data || []).map(item => item.notes));
    const normalizePhone = value => String(value || '').replace(/\D/g, '').slice(-11);
    const normalizeName = value => String(value || '').trim().toLocaleLowerCase('pt-BR');
    const clientPhoneKey = normalizePhone(clientPhone);
    const clientNameKey = normalizeName(clientName);
    const uniqueMessages = (messages.data || []).filter(item =>
      item.contact_id === clientId ||
      (clientPhoneKey && normalizePhone(item.contact_phone) === clientPhoneKey) ||
      (clientNameKey && normalizeName(item.contact_name) === clientNameKey)
    );
    return [
      ...(interactions.data || []).map(item => ({ ...item, text: item.notes || item.subject, source: 'interaction' })),
      ...uniqueMessages.filter(item => !analyzedTexts.has(item.message)).map(item => ({
        ...item, text: item.message, source: 'whatsapp',
      })),
    ].filter(item => item.text).sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).slice(0, 20);
  }, [interactions.data, messages.data, clientId, clientPhone, clientName]);

  return { transcripts, isLoading: interactions.isLoading || messages.isLoading };
}
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function useSentimentActions(client) {
  const queryClient = useQueryClient();

  const analyze = async (transcript) => {
    const interaction = transcript.source === 'interaction' ? transcript : await base44.entities.Interaction.create({
      client_id: client.id,
      client_name: client.clinic_name || client.first_name,
      type: 'whatsapp',
      direction: transcript.direction === 'received' ? 'inbound' : 'outbound',
      notes: transcript.text,
    });
    await base44.functions.invoke('analyzeSentiment', { interaction_id: interaction.id, text: interaction.notes });
    await queryClient.invalidateQueries({ queryKey: ['client-transcripts', client.id] });
  };

  const addNote = async (text, sentiment) => {
    const label = { positive: 'positivo', neutral: 'neutro', negative: 'negativo' }[sentiment] || 'não analisado';
    const entry = `[Sentimento ${label} — ${new Date().toLocaleDateString('pt-BR')}] ${text.trim()}`;
    await base44.entities.Client.update(client.id, { notes: [client.notes, entry].filter(Boolean).join('\n\n') });
    await queryClient.invalidateQueries({ queryKey: ['c360-client', client.id] });
  };

  const updateSegment = async (ai_segment) => {
    await base44.entities.Client.update(client.id, { ai_segment });
    await queryClient.invalidateQueries({ queryKey: ['c360-client', client.id] });
  };

  return { analyze, addNote, updateSegment };
}
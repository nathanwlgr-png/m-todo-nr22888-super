import React, { useEffect, useState } from 'react';
import useConversationTranscripts from '@/hooks/useConversationTranscripts';
import useSentimentActions from '@/hooks/useSentimentActions';
import SentimentTranscriptList from '@/components/sentiment/SentimentTranscriptList';
import SentimentActions from '@/components/sentiment/SentimentActions';

export default function ConversationSentimentPanel({ client }) {
  const { transcripts, isLoading } = useConversationTranscripts(client.id);
  const { analyze, addNote, updateSegment } = useSentimentActions(client);
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState('');
  const [status, setStatus] = useState('');
  useEffect(() => {
    const selectedStillVisible = transcripts.some(item => item.id === selected?.id && item.source === selected?.source);
    if (transcripts.length && !selectedStillVisible) setSelected(transcripts[0]);
  }, [transcripts, selected]);
  const run = async (key, action, success) => {
    setBusy(key); setStatus('');
    try { await action(); setStatus(success); } catch { setStatus('Não foi possível concluir. Tente novamente.'); }
    finally { setBusy(''); }
  };
  return <section className="rounded-2xl p-4 space-y-3" style={{ background: '#111', border: '1px solid rgba(168,85,247,0.3)' }}>
    <div><h2 className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Conversas e sentimento</h2><p className="text-[9px] text-slate-500">Transcrições recentes com análise positivo, neutro ou negativo.</p></div>
    <SentimentTranscriptList items={transcripts} selected={selected} loading={isLoading} analyzing={busy} onSelect={setSelected} onAnalyze={item => run(item.id, () => analyze(item), 'Sentimento analisado.')} />
    <SentimentActions selected={selected} currentSegment={client.ai_segment} saving={!!busy} onAddNote={(text, sentiment) => run('note', () => addNote(text, sentiment), 'Nota contextual salva.')} onUpdateSegment={segment => run('segment', () => updateSegment(segment), 'Segmento atualizado.')} />
    {status && <p role="status" className="text-[10px] font-bold text-orange-300">{status}</p>}
  </section>;
}
import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Bot, Loader2, Mic, Send, ShieldCheck, Volume2 } from 'lucide-react';
import useVoiceInput from '@/hooks/useVoiceInput';
import useCRMVoiceAgent from '@/hooks/useCRMVoiceAgent';

export default function VoiceAgentPanel() {
  const [text, setText] = useState('');
  const endRef = useRef(null);
  const { messages, loading, error, send } = useCRMVoiceAgent();
  const onTranscript = useCallback((value) => { setText(''); send(value); }, [send]);
  const voice = useVoiceInput(onTranscript);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => {
    const last = messages.at(-1);
    if (last?.role !== 'assistant' || !last.content || loading || !window.speechSynthesis) return;
    const timer = setTimeout(() => {
      window.speechSynthesis.cancel();
      const speech = new SpeechSynthesisUtterance(last.content.replace(/[*#_`]/g, ''));
      speech.lang = 'pt-BR'; speech.rate = 1.05;
      window.speechSynthesis.speak(speech);
    }, 700);
    return () => clearTimeout(timer);
  }, [messages, loading]);

  const submit = () => { if (text.trim()) { send(text); setText(''); } };
  return <div className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-2xl flex-col gap-3 rounded-2xl border border-orange-500/20 bg-neutral-950 p-4 text-white">
    <header><h1 className="flex items-center gap-2 text-xl font-black text-orange-400"><Bot /> Assistente de Voz Gemini</h1><p className="mt-1 flex items-center gap-1 text-xs text-emerald-400"><ShieldCheck className="h-4 w-4" /> Consulta o CRM; anotações ficam pendentes para aprovação.</p></header>
    <div className="flex-1 space-y-3 overflow-y-auto rounded-xl bg-black/40 p-3">
      {!messages.length && <p className="text-sm text-slate-400">Toque no microfone e fale. Consulte pedidos ou diga “anote na visita do cliente...” — a fala será enviada automaticamente.</p>}
      {messages.map((message, index) => <div key={index} className={`max-w-[88%] rounded-xl p-3 text-sm ${message.role === 'user' ? 'ml-auto bg-orange-500 text-black' : 'bg-neutral-800 text-slate-100'}`}>{message.role === 'assistant' ? <ReactMarkdown>{message.content}</ReactMarkdown> : message.content}</div>)}
      {loading && <Loader2 className="h-5 w-5 animate-spin text-orange-400" />}<div ref={endRef} />
    </div>
    {(error || voice.error) && <p className="text-xs text-rose-300">{error || voice.error}</p>}
    <div className="flex gap-2"><button onClick={voice.toggle} aria-label="Ativar microfone" className={`h-12 w-12 rounded-xl border ${voice.listening ? 'border-rose-400 bg-rose-500/20' : 'border-orange-500/40 bg-orange-500/10'}`}><Mic className="mx-auto" /></button><textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} placeholder="Toque no microfone ou digite..." className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 p-3 text-sm" /><button onClick={submit} disabled={loading || !text.trim()} aria-label="Enviar consulta" className="h-12 w-12 self-end rounded-xl bg-orange-500 text-black disabled:opacity-50">{loading ? <Volume2 className="mx-auto" /> : <Send className="mx-auto" />}</button></div>
  </div>;
}
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, MicOff, Loader2, ShieldCheck, Send, AlertTriangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';

// /VozCampo — tela dedicada de Comando de Voz SAFE.
// Web Speech API (pt-BR) com fallback manual por texto. NÃO envia nada,
// NÃO altera dado crítico: tudo de risco vira fila/rascunho para aprovação.
export default function VozCampo() {
  const navigate = useNavigate();
  const [texto, setTexto] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [ouvindo, setOuvindo] = useState(false);
  const [micErro, setMicErro] = useState('');
  const recognitionRef = useRef(null);

  const speechSupported = typeof window !== 'undefined' &&
    (window.SpeechRecognition || window.webkitSpeechRecognition);

  useEffect(() => {
    if (!speechSupported) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = 'pt-BR';
    rec.continuous = false;
    rec.interimResults = true;
    rec.onresult = (e) => {
      const t = Array.from(e.results).map(r => r[0].transcript).join(' ');
      setTexto(t);
    };
    rec.onerror = (e) => {
      setOuvindo(false);
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        setMicErro('Microfone bloqueado. Libere a permissão de microfone do app nas configurações do Android e tente de novo — ou digite o comando abaixo.');
      } else if (e.error === 'no-speech') {
        setMicErro('Não captei áudio. Tente de novo ou digite o comando.');
      } else {
        setMicErro('Não consegui usar o microfone. Digite o comando abaixo.');
      }
    };
    rec.onend = () => setOuvindo(false);
    recognitionRef.current = rec;
    return () => { try { rec.stop(); } catch (_e) {} };
  }, [speechSupported]);

  const toggleMic = () => {
    setMicErro('');
    if (!speechSupported) {
      setMicErro('Este aparelho/navegador não tem reconhecimento de voz. Digite o comando abaixo.');
      return;
    }
    if (ouvindo) {
      try { recognitionRef.current?.stop(); } catch (_e) {}
      setOuvindo(false);
    } else {
      try { setTexto(''); recognitionRef.current?.start(); setOuvindo(true); }
      catch (_e) { setMicErro('Não consegui iniciar o microfone. Digite o comando abaixo.'); }
    }
  };

  const enviar = async () => {
    if (!texto.trim()) return;
    setLoading(true);
    setResultado(null);
    try {
      const res = await base44.functions.invoke('processVoiceCommandSafe', { texto_transcrito: texto, origem: 'voz_tablet' });
      const data = res.data || {};
      setResultado(data);
      if (data.navegacao_destino) {
        setTimeout(() => navigate(data.navegacao_destino), 900);
      }
    } catch (_e) {
      setResultado({ resposta: 'Erro ao interpretar. Nada foi alterado.', status: 'erro' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white pb-24 flex flex-col items-center p-4">
      <div className="w-full max-w-md space-y-4">
        <div className="px-4 py-4 rounded-2xl bg-[#0f0f11] border border-orange-500/25 text-center">
          <h1 className="text-xl font-black text-orange-400 flex items-center gap-2 justify-center">
            <Mic className="w-5 h-5" /> Voz Campo
          </h1>
          <p className="text-[11px] text-orange-200/80 mt-1">
            Use a voz para preparar ações. Confirme envios e alterações somente quando estiver parado e seguro.
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 px-1">
          <ShieldCheck className="w-3.5 h-3.5" />
          Nada é enviado. Dados críticos viram fila para sua aprovação.
        </div>

        <button
          onClick={toggleMic}
          className={`w-full flex flex-col items-center justify-center gap-2 rounded-2xl py-8 font-black transition-colors ${
            ouvindo ? 'bg-rose-500/15 border border-rose-500/40 text-rose-300' : 'bg-orange-500/10 border border-orange-500/30 text-orange-300'
          }`}
        >
          {ouvindo ? <Mic className="w-10 h-10 animate-pulse" /> : <Mic className="w-10 h-10" />}
          {ouvindo ? 'Ouvindo... toque para parar' : 'Toque e fale o comando'}
        </button>

        {micErro && (
          <div className="rounded-xl p-3 text-xs flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-300">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{micErro}</span>
          </div>
        )}

        <div>
          <p className="text-[11px] text-slate-400 mb-1 flex items-center gap-1">
            <MicOff className="w-3 h-3" /> Sem microfone? Digite o comando:
          </p>
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder='Ex: "mostrar clientes quentes", "abrir cliente Center", "registrar visita Center cliente pediu ROI do VG2", "criar follow-up Center amanhã", "gerar WhatsApp Center retomar VG2"'
            rows={3}
            className="w-full rounded-xl p-3 text-sm text-white outline-none resize-none bg-white/5 border border-white/10"
          />
        </div>

        <button
          onClick={enviar}
          disabled={loading || !texto.trim()}
          className="w-full flex items-center justify-center gap-2 rounded-xl py-3 font-black text-sm text-black disabled:opacity-50"
          style={{ background: '#ff9500' }}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {loading ? 'Interpretando...' : 'Preparar com segurança'}
        </button>

        {resultado && (
          <div
            className="rounded-xl p-3 text-sm"
            style={{
              background: resultado.status === 'erro' ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
              border: `1px solid ${resultado.status === 'erro' ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
              color: resultado.status === 'erro' ? '#fca5a5' : '#6ee7b7',
            }}
          >
            {resultado.resposta}
            {resultado.exige_aprovacao && (
              <div className="mt-1 text-[11px] text-orange-300">⚠️ Item crítico — aguardando sua aprovação.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
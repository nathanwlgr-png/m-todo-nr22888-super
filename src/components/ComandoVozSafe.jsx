import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, X, Loader2, ShieldCheck, Send } from 'lucide-react';
import { base44 } from '@/api/base44Client';

// Botão compacto "Comando de Voz" — Fase SAFE.
// Aceita transcrição manual (texto). NÃO envia mensagem, NÃO altera dado crítico.
// Tudo de risco vira fila/rascunho aguardando aprovação. Navegação é aberta na hora.
export default function ComandoVozSafe({ origem = 'crm', compact = false }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [texto, setTexto] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);

  const enviar = async () => {
    if (!texto.trim()) return;
    setLoading(true);
    setResultado(null);
    try {
      const res = await base44.functions.invoke('processVoiceCommandSafe', { texto_transcrito: texto, origem });
      const data = res.data || {};
      setResultado(data);
      if (data.navegacao_destino) {
        setTimeout(() => { setOpen(false); navigate(data.navegacao_destino); }, 900);
      }
    } catch (e) {
      setResultado({ resposta: 'Erro ao interpretar. Nada foi alterado.', status: 'erro' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl font-bold transition-opacity hover:opacity-85"
        style={{
          background: 'rgba(255,107,0,0.12)',
          border: '1px solid rgba(255,107,0,0.3)',
          color: '#ff9500',
          padding: compact ? '6px 10px' : '8px 14px',
          fontSize: compact ? 12 : 13,
        }}
      >
        <Mic className={compact ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
        Comando de Voz
      </button>

      {open && (
        <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-3" >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div
            className="relative w-full max-w-md rounded-2xl p-4 flex flex-col gap-3"
            style={{ background: '#0d0d0d', border: '1px solid rgba(255,107,0,0.25)' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mic className="w-5 h-5 text-orange-400" />
                <span className="font-black text-white text-sm">Comando de Voz SAFE</span>
              </div>
              <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              Nada é enviado. Dados críticos viram fila para sua aprovação.
            </div>

            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder='Ex: "abrir cliente João", "registrar visita João boa reunião", "criar follow-up João amanhã", "gerar WhatsApp João retomar contato", "mostrar clientes quentes"'
              rows={3}
              className="w-full rounded-xl p-3 text-sm text-white outline-none resize-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
            />

            <button
              onClick={enviar}
              disabled={loading || !texto.trim()}
              className="flex items-center justify-center gap-2 rounded-xl py-2.5 font-black text-sm text-black disabled:opacity-50"
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
      )}
    </>
  );
}
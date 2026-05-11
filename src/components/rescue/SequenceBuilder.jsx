import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Zap, Clock, CheckCircle, Copy, Phone, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

const STATUS_CONFIG = {
  pendente: { color: '#888', label: 'Pendente' },
  enviada: { color: '#00bfff', label: 'Enviada' },
  visualizada: { color: '#ff9500', label: 'Visualizada' },
  respondida: { color: '#00ff88', label: 'Respondida' },
};

export default function SequenceBuilder({ sequence, client, onUpdate }) {
  const [markingStep, setMarkingStep] = useState(null);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Mensagem copiada!');
  };

  const handleWhatsApp = (text) => {
    const phone = sequence.client_phone?.replace(/\D/g, '');
    if (!phone) { toast.error('Sem telefone cadastrado'); return; }
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleMarkSent = async (step) => {
    setMarkingStep(step);
    try {
      await base44.functions.invoke('generateRescueSequence', {
        mode: 'mark_sent', sequence_id: sequence.id, step
      });
      toast.success(`Passo ${step} marcado como enviado!`);
      onUpdate();
    } catch (e) {
      toast.error('Erro ao marcar');
    }
    setMarkingStep(null);
  };

  const scoreColor = (sequence.ai_score || 0) >= 70 ? '#00ff88'
    : (sequence.ai_score || 0) >= 45 ? '#ff9500' : '#ff4444';

  return (
    <div>
      {/* AI Header */}
      <div className="rounded-xl p-3 mb-3" style={{ background: 'rgba(255,107,0,0.08)', border: '1px solid rgba(255,107,0,0.2)' }}>
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-black text-orange-400 flex items-center gap-1">
            <Zap className="w-3 h-3" /> Análise IA
          </p>
          <div className="flex items-center gap-1">
            <span className="text-sm font-black" style={{ color: scoreColor }}>{sequence.ai_score || 0}</span>
            <span className="text-[9px] text-slate-500">/100 resgate</span>
          </div>
        </div>
        <p className="text-xs text-slate-400">{sequence.ai_approach}</p>
      </div>

      {/* Messages */}
      <div className="space-y-3">
        {(sequence.messages || []).map((msg, idx) => {
          const cfg = STATUS_CONFIG[msg.status] || STATUS_CONFIG.pendente;
          const isSent = msg.status === 'enviada' || msg.status === 'visualizada' || msg.status === 'respondida';
          return (
            <div key={idx} className="rounded-xl p-3"
              style={{ background: '#141414', border: `1px solid ${isSent ? '#00ff8833' : 'rgba(255,107,0,0.15)'}` }}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black"
                    style={{ background: isSent ? '#00ff8833' : 'rgba(255,107,0,0.2)', color: isSent ? '#00ff88' : '#ff9500' }}>
                    {msg.step}
                  </span>
                  <span className="text-[10px] font-bold" style={{ color: cfg.color }}>{cfg.label}</span>
                </div>
                {msg.scheduled_for && (
                  <span className="text-[10px] text-slate-600 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {new Date(msg.scheduled_for).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-300 leading-relaxed mb-3 whitespace-pre-wrap">{msg.text}</p>

              <div className="flex gap-2">
                <button onClick={() => handleWhatsApp(msg.text)}
                  className="flex-1 h-8 rounded-lg text-[11px] font-black flex items-center justify-center gap-1"
                  style={{ background: 'rgba(0,255,136,0.12)', color: '#00ff88', border: '1px solid rgba(0,255,136,0.25)' }}>
                  <Phone className="w-3 h-3" /> Abrir WA
                </button>
                <button onClick={() => handleCopy(msg.text)}
                  className="h-8 px-3 rounded-lg text-[11px] font-black flex items-center gap-1"
                  style={{ background: 'rgba(255,107,0,0.1)', color: '#ff9500', border: '1px solid rgba(255,107,0,0.2)' }}>
                  <Copy className="w-3 h-3" /> Copiar
                </button>
                {!isSent && (
                  <button onClick={() => handleMarkSent(msg.step)} disabled={markingStep === msg.step}
                    className="h-8 px-3 rounded-lg text-[11px] font-black flex items-center gap-1"
                    style={{ background: 'rgba(0,191,255,0.1)', color: '#00bfff', border: '1px solid rgba(0,191,255,0.2)' }}>
                    {markingStep === msg.step
                      ? <RefreshCw className="w-3 h-3 animate-spin" />
                      : <CheckCircle className="w-3 h-3" />}
                    Enviada
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
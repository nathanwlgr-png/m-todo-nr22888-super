import React, { useState } from 'react';
import { MessageSquare, Send, Copy, CheckCircle, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

export default function WhatsAppRouteAlert({ message, date, totalVisits }) {
  const [phone, setPhone] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    toast.success('Mensagem copiada!');
  };

  const handleSendWA = async () => {
    if (!phone.trim()) {
      // Abrir WhatsApp Web direto
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
      return;
    }
    setSending(true);
    try {
      await base44.functions.invoke('sendWhatsAppMessage', {
        phone: phone.replace(/\D/g, ''),
        message,
      });
      setSent(true);
      toast.success('Rota enviada via WhatsApp!');
    } catch (e) {
      // Fallback: abrir WhatsApp Web
      const cleanPhone = phone.replace(/\D/g, '');
      window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
    }
    setSending(false);
  };

  const handleSendToSelf = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="rounded-2xl p-4" style={{ background: '#111', border: '1px solid rgba(0,255,136,0.3)' }}>
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare className="w-4 h-4 text-green-400" />
        <p className="text-xs font-black text-green-400 uppercase tracking-widest">Notificação WhatsApp</p>
      </div>

      {/* Preview da mensagem */}
      <div className="rounded-xl p-3 mb-3 max-h-40 overflow-y-auto"
        style={{ background: '#0d1117', border: '1px solid rgba(0,255,136,0.15)', fontFamily: 'monospace' }}>
        <pre className="text-[11px] text-green-200 whitespace-pre-wrap leading-relaxed">{message}</pre>
      </div>

      {/* Campo de telefone */}
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <input
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="55119999999999 (opcional)"
            className="w-full pl-8 h-9 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none"
            style={{ background: '#1a1a1a', border: '1px solid rgba(0,255,136,0.2)' }}
          />
        </div>
      </div>

      {/* Botões de ação */}
      <div className="flex gap-2">
        <button onClick={handleCopy}
          className="flex-1 h-9 rounded-xl text-xs font-black flex items-center justify-center gap-1"
          style={{ background: 'rgba(255,107,0,0.1)', color: '#ff9500', border: '1px solid rgba(255,107,0,0.2)' }}>
          <Copy className="w-3 h-3" /> Copiar
        </button>
        <button onClick={handleSendToSelf}
          className="flex-1 h-9 rounded-xl text-xs font-black flex items-center justify-center gap-1"
          style={{ background: 'rgba(0,255,136,0.1)', color: '#00ff88', border: '1px solid rgba(0,255,136,0.25)' }}>
          <MessageSquare className="w-3 h-3" /> Enviar p/ mim
        </button>
        <Button onClick={handleSendWA} disabled={sending || sent} size="sm"
          className="flex-1 h-9 text-xs font-black gap-1"
          style={{ background: sent ? '#1a3a1a' : 'linear-gradient(135deg, #00c851, #00ff88)', color: sent ? '#00ff88' : '#000' }}>
          {sent ? <><CheckCircle className="w-3 h-3" /> Enviado</> : <><Send className="w-3 h-3" /> Enviar</>}
        </Button>
      </div>
    </div>
  );
}
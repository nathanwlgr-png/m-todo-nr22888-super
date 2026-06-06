import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { MessageSquare, X, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function WhatsAppSendModal({ client, initialMessage = '', onClose }) {
  const [message, setMessage] = useState(initialMessage);
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) { toast.error('Digite uma mensagem'); return; }
    if (!client?.phone) { toast.error('Sem telefone cadastrado'); return; }

    setSending(true);
    try {
      const res = await base44.functions.invoke('sendWhatsAppMessage', {
        client_id: client.id,
        client_phone: client.phone,
        message: message.trim(),
        auto_log: true,
      });

      const waUrl = res.data?.wa_url;
      if (waUrl) {
        window.open(waUrl, '_blank');
        toast.success('WhatsApp aberto e contato registrado no CRM!');
        onClose();
      } else {
        toast.error('Erro ao gerar link WhatsApp');
      }
    } catch (e) {
      // Fallback direto se função falhar
      const phone = client.phone.replace(/\D/g, '');
      window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
      toast.success('WhatsApp aberto!');
      onClose();
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-lg rounded-t-3xl p-5" style={{ background: '#111', border: '1px solid rgba(37,211,102,0.3)' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(37,211,102,0.15)', border: '1px solid rgba(37,211,102,0.3)' }}>
              <MessageSquare className="w-4 h-4 text-green-400" />
            </div>
            <div>
              <p className="text-sm font-black text-white">Enviar WhatsApp</p>
              <p className="text-[10px] text-slate-500">{client?.first_name} · {client?.phone}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: '#1a1a1a', border: '1px solid #333' }}>
            <X className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>

        {/* Textarea */}
        <textarea
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Digite a mensagem ou use o botão Gerar Msg SPIN..."
          rows={5}
          className="w-full rounded-xl p-3 text-sm text-slate-300 resize-none focus:outline-none mb-3"
          style={{ background: '#1a1a1a', border: '1px solid rgba(37,211,102,0.25)' }}
          autoFocus
        />

        <div className="flex gap-2">
          <button onClick={onClose}
            className="py-3 px-4 rounded-xl text-xs font-black"
            style={{ background: '#1a1a1a', color: '#666', border: '1px solid #333' }}>
            Cancelar
          </button>
          <button onClick={handleSend} disabled={sending || !message.trim()}
            className="flex-1 py-3 rounded-xl text-sm font-black flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ background: 'rgba(37,211,102,0.2)', color: '#25d366', border: '1px solid rgba(37,211,102,0.4)' }}>
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {sending ? 'Abrindo...' : 'Enviar no WhatsApp'}
          </button>
        </div>
      </div>
    </div>
  );
}
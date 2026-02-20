import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { MessageSquare, Send, Copy, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';

export default function WhatsAppChunkedSender({ client, defaultPhone = '' }) {
  const [phone, setPhone] = useState(client?.phone || defaultPhone || '');
  const [message, setMessage] = useState('');
  const [chunks, setChunks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState({});

  const handleSplit = async () => {
    if (!message.trim() || !phone.trim()) {
      toast.error('Preencha o telefone e a mensagem');
      return;
    }

    setLoading(true);
    try {
      const res = await base44.functions.invoke('whatsappSendChunked', {
        message,
        phone: phone.replace(/\D/g, ''),
        client_id: client?.id || null,
        client_name: client?.first_name || client?.clinic_name || null
      });

      setChunks(res.data.chunks);

      if (res.data.total_chunks === 1) {
        toast.success('Mensagem pronta para enviar!');
      } else {
        toast.success(`Mensagem dividida em ${res.data.total_chunks} partes para não cortar!`);
      }
    } catch (err) {
      toast.error('Erro: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const openWhatsApp = (url) => {
    window.open(url, '_blank');
  };

  const copyText = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado!');
  };

  const toggleExpand = (i) => {
    setExpanded(prev => ({ ...prev, [i]: !prev[i] }));
  };

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <MessageSquare className="w-5 h-5 text-green-600" />
        <h3 className="font-bold text-sm text-slate-800">WhatsApp — Mensagem Completa</h3>
        <Badge className="bg-green-100 text-green-800 text-xs">Sem cortes</Badge>
      </div>

      <Input
        placeholder="Telefone (ex: 5511999999999)"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        className="text-sm"
      />

      <Textarea
        placeholder="Cole aqui a resposta/mensagem completa..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="text-sm min-h-[120px]"
      />

      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>{message.length} caracteres</span>
        {message.length > 3800 && (
          <Badge className="bg-orange-100 text-orange-700">
            Será dividida em ~{Math.ceil(message.length / 3800)} partes
          </Badge>
        )}
      </div>

      <Button
        onClick={handleSplit}
        disabled={loading || !message.trim() || !phone.trim()}
        className="w-full bg-green-600 hover:bg-green-700"
      >
        <Send className="w-4 h-4 mr-2" />
        {loading ? 'Preparando...' : 'Preparar e Enviar'}
      </Button>

      {chunks.length > 0 && (
        <div className="space-y-2 pt-2 border-t">
          <p className="text-xs font-semibold text-slate-600">
            {chunks.length === 1 ? '✅ 1 mensagem pronta' : `✅ ${chunks.length} partes — envie em ordem:`}
          </p>
          {chunks.map((chunk, i) => (
            <div key={i} className="border rounded-lg p-3 bg-slate-50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">
                  Parte {chunk.part}/{chunk.total} — {chunk.length} chars
                </span>
                <button
                  onClick={() => toggleExpand(i)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  {expanded[i] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>

              {expanded[i] && (
                <pre className="text-xs text-slate-700 whitespace-pre-wrap bg-white border rounded p-2 max-h-40 overflow-y-auto">
                  {chunk.text}
                </pre>
              )}

              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 bg-green-600 hover:bg-green-700 text-xs h-8"
                  onClick={() => openWhatsApp(chunk.whatsapp_url)}
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Abrir WhatsApp
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs"
                  onClick={() => copyText(chunk.text)}
                >
                  <Copy className="w-3 h-3 mr-1" />
                  Copiar
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
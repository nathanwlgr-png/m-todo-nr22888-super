import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff, BellRing } from 'lucide-react';
import { toast } from 'sonner';

export default function PushNotificationManager({ messages = [] }) {
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  );
  const [enabled, setEnabled] = useState(false);
  const prevCountRef = useRef(messages.length);
  const prevIdsRef = useRef(new Set(messages.map(m => m.id)));

  const requestPermission = async () => {
    if (typeof Notification === 'undefined') {
      toast.error('Notificações não suportadas neste navegador');
      return;
    }
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === 'granted') {
      setEnabled(true);
      toast.success('Notificações ativadas!');
      new Notification('✅ CRM NR22888', {
        body: 'Você receberá alertas de novas mensagens.',
        icon: '/favicon.ico',
      });
    } else {
      toast.error('Permissão negada para notificações');
    }
  };

  // Detecta novas mensagens e dispara notificação
  useEffect(() => {
    if (!enabled || permission !== 'granted') return;

    const currentIds = new Set(messages.map(m => m.id));
    const newMessages = messages.filter(m => !prevIdsRef.current.has(m.id));

    newMessages.forEach(msg => {
      const isUrgent = msg.contact_name?.toLowerCase().includes('urgent') ||
        msg.message?.toLowerCase().includes('urgente') ||
        msg.automated === false;

      new Notification(isUrgent ? '🚨 Mensagem Urgente - CRM NR22888' : '💬 Nova Mensagem - WhatsApp', {
        body: `${msg.contact_name || 'Contato'}: ${msg.message?.substring(0, 80)}...`,
        icon: '/favicon.ico',
        tag: msg.id,
        requireInteraction: isUrgent,
      });

      if (isUrgent) {
        toast.error(`🚨 Urgente: ${msg.contact_name}`, { duration: 8000 });
      }
    });

    prevIdsRef.current = currentIds;
  }, [messages, enabled, permission]);

  // Também monitora pendentes aprovação via subscribe
  useEffect(() => {
    if (!enabled || permission !== 'granted') return;
    const unsubscribe = base44.entities.WhatsAppMessage.subscribe((event) => {
      if (event.type === 'create' && event.data) {
        new Notification('💬 Nova mensagem WhatsApp', {
          body: `${event.data.contact_name || 'Contato'}: ${event.data.message?.substring(0, 80)}`,
          icon: '/favicon.ico',
        });
      }
    });
    return unsubscribe;
  }, [enabled, permission]);

  return (
    <div className="flex items-center gap-2">
      {permission === 'granted' ? (
        <Button
          size="sm"
          variant={enabled ? 'default' : 'outline'}
          onClick={() => setEnabled(!enabled)}
          className={enabled ? 'bg-green-600 hover:bg-green-700' : ''}
        >
          {enabled ? (
            <><BellRing className="w-3.5 h-3.5 mr-1 animate-bounce" /> Notificações On</>
          ) : (
            <><BellOff className="w-3.5 h-3.5 mr-1" /> Notificações Off</>
          )}
        </Button>
      ) : (
        <Button size="sm" variant="outline" onClick={requestPermission} className="border-orange-400 text-orange-600">
          <Bell className="w-3.5 h-3.5 mr-1" />
          Ativar Alertas
        </Button>
      )}
    </div>
  );
}
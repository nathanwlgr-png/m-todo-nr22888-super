import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function FloatingWhatsAppButton() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-updated_date', 100),
  });

  const sendQuickMessage = async () => {
    if (!user?.whatsapp_number) {
      toast.error('Configure WhatsApp em Configurações');
      return;
    }

    const summary = `📊 *RESUMO RÁPIDO - ${new Date().toLocaleString('pt-BR')}*\n\n` +
      `✅ Total: ${clients.length} clientes\n` +
      `🔥 Quentes: ${clients.filter(c => c.status === 'quente').length}\n` +
      `🌡️ Mornos: ${clients.filter(c => c.status === 'morno').length}\n` +
      `❄️ Frios: ${clients.filter(c => c.status === 'frio').length}\n\n` +
      `_Enviado automaticamente_`;

    await navigator.clipboard.writeText(summary);
    window.open(`https://wa.me/${user.whatsapp_number}?text=${encodeURIComponent(summary)}`, '_blank');
    toast.success('Mensagem enviada!');
  };

  return (
    <motion.div
      drag
      dragMomentum={false}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={(e, info) => {
        setIsDragging(false);
        setPosition({ x: info.offset.x, y: info.offset.y });
      }}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="fixed bottom-44 right-6 z-50 cursor-move"
      style={{ x: position.x, y: position.y }}
    >
      <Button
        onClick={() => !isDragging && sendQuickMessage()}
        size="lg"
        className="w-14 h-14 rounded-full shadow-2xl bg-gradient-to-r from-green-500 to-emerald-500"
      >
        <Send className="w-6 h-6 text-white" />
      </Button>
    </motion.div>
  );
}
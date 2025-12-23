import React, { useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

/**
 * WhatsApp Notification Service
 * Envia notificações automáticas via WhatsApp em intervalos configurados
 */
export default function WhatsAppNotificationService() {
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-updated_date', 100),
    refetchInterval: 300000, // 5 min
    staleTime: 240000
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['all-tasks'],
    queryFn: () => base44.entities.Task.list('-created_date', 100),
    refetchInterval: 300000,
    staleTime: 240000
  });

  useEffect(() => {
    if (!user?.enable_whatsapp_notifications || !user?.whatsapp_number) return;

    const intervalMinutes = user.notification_interval_minutes || 15;
    const intervalMs = intervalMinutes * 60 * 1000;

    const sendNotification = async () => {
      try {
        // Coletar dados relevantes
        const hotClients = clients.filter(c => c.status === 'quente');
        const urgentTasks = tasks.filter(t => t.status === 'pendente' && t.priority === 'alta');
        const highEngagement = clients.filter(c => (c.engagement_score || 0) > 70);

        // Montar mensagem
        let message = `🔔 *Atualização ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}*\n\n`;
        
        if (hotClients.length > 0) {
          message += `🔥 *${hotClients.length} clientes quentes*\n`;
          hotClients.slice(0, 3).forEach(c => {
            message += `   • ${c.first_name} (${c.purchase_score}%)\n`;
          });
          message += '\n';
        }

        if (urgentTasks.length > 0) {
          message += `⚠️ *${urgentTasks.length} tarefas urgentes*\n`;
          urgentTasks.slice(0, 3).forEach(t => {
            message += `   • ${t.title}\n`;
          });
          message += '\n';
        }

        if (highEngagement.length > 0) {
          message += `📊 *${highEngagement.length} clientes altamente engajados*\n`;
          highEngagement.slice(0, 2).forEach(c => {
            message += `   • ${c.first_name} (engagement: ${c.engagement_score}%)\n`;
          });
          message += '\n';
        }

        if (hotClients.length === 0 && urgentTasks.length === 0 && highEngagement.length === 0) {
          message += '✅ Tudo tranquilo! Sem alertas urgentes no momento.\n\n';
        }

        message += `_Próxima atualização em ${intervalMinutes} minutos_`;

        // Abrir WhatsApp com mensagem
        window.open(`https://wa.me/${user.whatsapp_number}?text=${encodeURIComponent(message)}`, '_blank');
        
        console.log(`📱 Notificação enviada: ${new Date().toLocaleTimeString()}`);
      } catch (error) {
        console.error('Erro ao enviar notificação WhatsApp:', error);
      }
    };

    // Primeira notificação após 1 minuto
    const initialTimeout = setTimeout(sendNotification, 60000);

    // Notificações recorrentes
    const interval = setInterval(sendNotification, intervalMs);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [user, clients, tasks]);

  return null; // Serviço em background
}
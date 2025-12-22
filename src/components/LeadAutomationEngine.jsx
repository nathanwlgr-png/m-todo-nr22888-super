import React, { useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

export default function LeadAutomationEngine() {
  const { data: leads = [] } = useQuery({
    queryKey: ['leads-automation'],
    queryFn: () => base44.entities.Lead.list('-updated_date', 100),
    refetchInterval: 60000 // Refetch a cada minuto
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients-automation'],
    queryFn: () => base44.entities.Client.list('-updated_date', 100),
    refetchInterval: 60000
  });

  const { data: rules = [] } = useQuery({
    queryKey: ['automation-rules'],
    queryFn: () => base44.entities.LeadAutomationRule.filter({ active: true }),
    refetchInterval: 60000
  });

  const { data: currentUser } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  useEffect(() => {
    if (!leads.length || !rules.length || !currentUser) return;

    const processAutomations = async () => {
      for (const rule of rules) {
        try {
          // Lead criado recentemente
          if (rule.trigger_type === 'lead_created') {
            const newLeads = leads.filter(lead => {
              const createdDate = new Date(lead.created_date);
              const now = new Date();
              const diffMinutes = (now - createdDate) / (1000 * 60);
              return diffMinutes <= 5 && !lead.automation_processed;
            });

            for (const lead of newLeads) {
              await executeAction(rule, lead, 'lead');
            }
          }

          // Lead com score alto
          if (rule.trigger_type === 'lead_score_threshold') {
            const threshold = rule.trigger_condition?.score_threshold || 70;
            const highScoreLeads = leads.filter(lead => 
              (lead.lead_score || 0) >= threshold && 
              lead.status !== 'convertido' &&
              !lead.assigned_to
            );

            for (const lead of highScoreLeads) {
              await executeAction(rule, lead, 'lead');
            }
          }

          // Lead inativo
          if (rule.trigger_type === 'lead_inactive_days') {
            const inactiveDays = rule.trigger_condition?.days || 7;
            const inactiveLeads = leads.filter(lead => {
              if (!lead.last_contact_date) return false;
              const lastContact = new Date(lead.last_contact_date);
              const now = new Date();
              const diffDays = (now - lastContact) / (1000 * 60 * 60 * 24);
              return diffDays >= inactiveDays && lead.status !== 'convertido';
            });

            for (const lead of inactiveLeads) {
              await executeAction(rule, lead, 'lead');
            }
          }

          // Cliente esfriando
          if (rule.trigger_type === 'client_status_change') {
            const targetStatus = rule.trigger_condition?.status || 'frio';
            const affectedClients = clients.filter(client => 
              client.status === targetStatus
            );

            for (const client of affectedClients) {
              await executeAction(rule, client, 'client');
            }
          }
        } catch (error) {
          console.error('Automation error:', error);
        }
      }
    };

    processAutomations();
  }, [leads, rules, currentUser, clients]);

  const executeAction = async (rule, entity, entityType) => {
    const isLead = entityType === 'lead';
    const entityId = entity.id;

    // Verificar se já processamos este item recentemente
    const checkKey = `automation_${rule.id}_${entityId}`;
    const lastProcessed = localStorage.getItem(checkKey);
    if (lastProcessed) {
      const lastTime = new Date(lastProcessed);
      const now = new Date();
      const diffHours = (now - lastTime) / (1000 * 60 * 60);
      if (diffHours < 24) return; // Não processar mais de 1x por dia
    }

    if (rule.action_type === 'create_task') {
      const taskData = {
        title: rule.action_config?.task_title || `Follow-up ${isLead ? 'Lead' : 'Cliente'}`,
        description: rule.action_config?.task_description || '',
        due_date: calculateDueDate(rule.action_config?.days_offset || 1),
        priority: rule.action_config?.priority || 'alta',
        type: 'follow_up',
        status: 'pendente',
        auto_created: true
      };

      if (isLead) {
        taskData.client_id = entityId;
        taskData.client_name = entity.full_name;
      } else {
        taskData.client_id = entityId;
        taskData.client_name = entity.first_name;
      }

      if (entity.assigned_to) {
        taskData.assigned_to = entity.assigned_to;
        taskData.assigned_to_name = entity.assigned_to_name;
      }

      await base44.entities.Task.create(taskData);
    }

    if (rule.action_type === 'send_alert') {
      const targetUser = entity.assigned_to || currentUser.email;
      
      await base44.entities.Alert.create({
        user_email: targetUser,
        title: rule.action_config?.alert_title || '🔔 Atenção!',
        message: rule.action_config?.alert_message || `${isLead ? 'Lead' : 'Cliente'} precisa de atenção: ${entity.full_name || entity.first_name}`,
        type: rule.trigger_type === 'lead_score_threshold' ? 'high_score_lead' : 'lead_inactive',
        priority: 'alta',
        link_to: isLead ? `LeadProfile?id=${entityId}` : `ClientProfile?id=${entityId}`
      });
    }

    if (rule.action_type === 'send_whatsapp' && entity.phone) {
      const message = rule.action_config?.whatsapp_message || 
        `Olá ${entity.full_name || entity.first_name}, tudo bem?`;
      
      // Enviar via WhatsApp
      await base44.entities.WhatsAppMessage.create({
        contact_id: entityId,
        contact_name: entity.full_name || entity.first_name,
        contact_phone: entity.phone,
        direction: 'sent',
        message: message,
        status: 'sent',
        automated: true
      });
      
      // Registrar no histórico
      if (isLead) {
        await base44.entities.Lead.update(entityId, {
          last_contact_date: new Date().toISOString().split('T')[0]
        });
      }
    }

    // Marcar como processado
    localStorage.setItem(checkKey, new Date().toISOString());
  };

  const calculateDueDate = (daysOffset) => {
    const date = new Date();
    date.setDate(date.getDate() + daysOffset);
    return date.toISOString().split('T')[0];
  };

  return null; // Componente invisível
}
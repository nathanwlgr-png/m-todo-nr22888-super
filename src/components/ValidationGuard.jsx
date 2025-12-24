import React from 'react';
import { toast } from 'sonner';

/**
 * Sistema de Validação Global
 * Previne erros antes de operações críticas
 */
export const validateClient = (client) => {
  if (!client || !client.id) {
    toast.error('Cliente inválido');
    return false;
  }
  if (client.is_deleted) {
    toast.error('Cliente foi removido');
    return false;
  }
  if (!client.first_name) {
    toast.error('Cliente sem nome');
    return false;
  }
  return true;
};

export const validateBeforeSend = (action, client, message) => {
  if (!client?.phone && action === 'whatsapp') {
    toast.error('Cliente sem WhatsApp cadastrado');
    return false;
  }
  if (!client?.email && action === 'email') {
    toast.error('Cliente sem email cadastrado');
    return false;
  }
  if (!message || message.trim().length < 10) {
    toast.error('Mensagem muito curta');
    return false;
  }
  return true;
};

export const validateTask = (task) => {
  if (!task.client_id || !task.title) {
    toast.error('Tarefa incompleta');
    return false;
  }
  if (!task.due_date) {
    toast.error('Tarefa sem prazo');
    return false;
  }
  return true;
};

export const validateVisit = (visit) => {
  if (!visit.client_id || !visit.scheduled_date) {
    toast.error('Visita incompleta');
    return false;
  }
  const visitDate = new Date(visit.scheduled_date);
  if (visitDate < new Date()) {
    toast.warning('Data no passado');
  }
  return true;
};

export const safeExecute = async (fn, errorMessage = 'Erro na operação') => {
  try {
    return await fn();
  } catch (error) {
    console.error(errorMessage, error);
    toast.error(errorMessage);
    return null;
  }
};
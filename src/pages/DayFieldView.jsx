import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Phone, MapPin, Clock, CheckCircle2,
  MessageSquare, Target, ChevronRight, RefreshCw, Calendar
} from 'lucide-react';
import { toast } from 'sonner';

export default function DayFieldView() {
  const now = new Date();
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  const [completedTasks, setCompletedTasks] = useState(new Set());

  // Buscar tarefas do dia
  const { data: allTasks = [], refetch: refetchTasks } = useQuery({
    queryKey: ['field-tasks-today'],
    queryFn: () => base44.entities.Task.list('-due_date', 100),
    staleTime: 2 * 60 * 1000,
  });

  // Buscar visitas agendadas do dia
  const { data: allVisits = [], refetch: refetchVisits } = useQuery({
    queryKey: ['field-visits-today'],
    queryFn: () => base44.entities.Visit.list('-scheduled_date', 100),
    staleTime: 2 * 60 * 1000,
  });

  // Buscar dados de clientes para as visitas
  const { data: clients = [] } = useQuery({
    queryKey: ['field-clients'],
    queryFn: () => base44.entities.Client.list('-updated_date', 200),
    staleTime: 5 * 60 * 1000,
  });

  // Filtrar tarefas do dia (pendentes)
  const tasksToday = allTasks.filter(t => {
    if (!t.due_date || t.status === 'concluida') return false;
    const dueDate = new Date(t.due_date);
    return dueDate >= dayStart && dueDate < dayEnd;
  });

  // Filtrar visitas agendadas do dia
  const visitsToday = allVisits
    .filter(v => {
      if (v.status === 'cancelada') return false;
      const scheduled = new Date(v.scheduled_date);
      return scheduled >= dayStart && scheduled < dayEnd;
    })
    .sort((a, b) => new Date(a.scheduled_date) - new Date(b.scheduled_date));

  // Mapear clients para visitas
  const visitsWithClients = visitsToday.map(v => ({
    ...v,
    client: clients.find(c => c.id === v.client_id)
  }));

  const handleCompleteTask = async (taskId) => {
    await base44.entities.Task.update(taskId, { status: 'concluida' });
    setCompletedTasks(prev => new Set([...prev, taskId]));
    toast.success('Tarefa concluída!');
    refetchTasks();
  };

  const handleCompleteVisit = async (visitId) => {
    await base44.entities.Visit.update(visitId, { status: 'realizada' });
    toast.success('Visita marcada como realizada!');
    refetchVisits();
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  return (
    <div className="min-h-screen pb-32" style={{ background: '#0a0a0a' }}>
      {/* Header simples */}
      <div className="sticky top-0 z-40 px-4 py-4" style={{ background: '#111', borderBottom: '1px solid rgba(255,107,0,0.2)' }}>
        <div className="flex items-center justify-between mb-2">
          <Link to="/SalesCommandCenter">
            <button className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(255,107,0,0.1)', border: '1px solid rgba(255,107,0,0.3)' }}>
              <ArrowLeft className="w-6 h-6 text-orange-400" />
            </button>
          </Link>
          <div className="text-center flex-1">
            <h1 className="text-2xl font-black text-white">📋 Dia de Campo</h1>
            <p className="text-xs text-slate-500 mt-1">{formatDate(now)}</p>
          </div>
          <button onClick={() => { refetchTasks(); refetchVisits(); }}
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.3)' }}>
            <RefreshCw className="w-6 h-6 text-green-400" />
          </button>
        </div>

        {/* Status rápido */}
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl p-2.5 text-center" style={{ background: '#1a1a1a' }}>
            <p className="text-xl font-black text-orange-400">{tasksToday.length}</p>
            <p className="text-[10px] text-slate-500">Tarefas</p>
          </div>
          <div className="rounded-xl p-2.5 text-center" style={{ background: '#1a1a1a' }}>
            <p className="text-xl font-black text-blue-400">{visitsWithClients.length}</p>
            <p className="text-[10px] text-slate-500">Visitas</p>
          </div>
          <div className="rounded-xl p-2.5 text-center" style={{ background: '#1a1a1a' }}>
            <p className="text-xl font-black text-green-400">{completedTasks.size}</p>
            <p className="text-[10px] text-slate-500">Feitas</p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-6 space-y-6">
        {/* TAREFAS */}
        {tasksToday.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-orange-400" />
              <h2 className="text-xl font-black text-white">Tarefas do Dia</h2>
            </div>

            <div className="space-y-2.5">
              {tasksToday.map(task => (
                <div key={task.id} className="rounded-2xl p-4" style={{ background: '#141414', border: '1px solid rgba(255,107,0,0.2)' }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-black text-white mb-1">{task.title}</h3>
                      {task.client_name && (
                        <p className="text-sm text-slate-400 mb-2">📌 {task.client_name}</p>
                      )}
                      {task.description && (
                        <p className="text-sm text-slate-500">{task.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 items-center mb-3">
                    {task.due_date && (
                      <div className="px-3 py-1.5 rounded-xl text-xs font-bold"
                        style={{ background: 'rgba(255,149,0,0.1)', color: '#ff9500' }}>
                        {formatTime(task.due_date)}
                      </div>
                    )}
                    {task.priority && (
                      <div className="px-3 py-1.5 rounded-xl text-xs font-bold"
                        style={{
                          background: task.priority === 'alta' ? 'rgba(255,68,68,0.1)' : 'rgba(100,116,139,0.1)',
                          color: task.priority === 'alta' ? '#ff4444' : '#64748b'
                        }}>
                        {task.priority === 'alta' ? '🔴 Alta' : '⚪ ' + (task.priority || 'Normal')}
                      </div>
                    )}
                  </div>

                  <button onClick={() => handleCompleteTask(task.id)}
                    className="w-full py-3 rounded-xl text-lg font-black transition-all"
                    style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '2px solid rgba(34,197,94,0.4)' }}>
                    ✓ CONCLUIR
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VISITAS */}
        {visitsWithClients.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-5 h-5 text-blue-400" />
              <h2 className="text-xl font-black text-white">Visitas Agendadas</h2>
            </div>

            <div className="space-y-2.5">
              {visitsWithClients.map(visit => (
                <div key={visit.id} className="rounded-2xl p-4" style={{ background: '#141414', border: '1px solid rgba(0,191,255,0.2)' }}>
                  {/* Cabeçalho com hora */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="px-3 py-1 rounded-lg font-black text-lg text-blue-400"
                      style={{ background: 'rgba(0,191,255,0.15)' }}>
                      {formatTime(visit.scheduled_date)}
                    </div>
                  </div>

                  {/* Nome do cliente grande */}
                  <h3 className="text-2xl font-black text-white mb-1">
                    {visit.client_name || 'Cliente desconhecido'}
                  </h3>

                  {/* Clínica */}
                  {visit.client && visit.client.clinic_name && (
                    <p className="text-sm text-slate-400 mb-2">🏥 {visit.client.clinic_name}</p>
                  )}

                  {/* Localização */}
                  {visit.location && (
                    <p className="text-sm text-slate-400 mb-3 flex items-center gap-1">
                      <MapPin className="w-4 h-4" /> {visit.location}
                    </p>
                  )}

                  {/* Tipo de visita */}
                  {visit.visit_type && (
                    <p className="text-xs text-slate-500 mb-3">
                      Tipo: <span className="font-bold text-slate-300">{visit.visit_type}</span>
                    </p>
                  )}

                  {/* Botões de ação */}
                  <div className="grid grid-cols-2 gap-2">
                    {visit.client?.phone && (
                      <a href={`https://wa.me/${visit.client.phone.replace(/\D/g, '')}`}
                        target="_blank" rel="noopener noreferrer"
                        className="py-3 rounded-xl text-base font-black text-green-400 flex items-center justify-center gap-2"
                        style={{ background: 'rgba(37,211,102,0.15)', border: '2px solid rgba(37,211,102,0.4)' }}>
                        <MessageSquare className="w-5 h-5" /> WhatsApp
                      </a>
                    )}
                    <Link to={`/ClientProfile?id=${visit.client_id}`}
                      className="py-3 rounded-xl text-base font-black text-purple-400 flex items-center justify-center gap-2"
                      style={{ background: 'rgba(168,85,247,0.15)', border: '2px solid rgba(168,85,247,0.4)' }}>
                      <Target className="w-5 h-5" /> Perfil
                    </Link>
                  </div>

                  {/* Botão concluir visita */}
                  <button onClick={() => handleCompleteVisit(visit.id)}
                    className="w-full mt-2 py-3 rounded-xl text-lg font-black text-blue-400 transition-all"
                    style={{ background: 'rgba(0,191,255,0.15)', border: '2px solid rgba(0,191,255,0.4)' }}>
                    ✓ VISITA REALIZADA
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sem tarefas ou visitas */}
        {tasksToday.length === 0 && visitsWithClients.length === 0 && (
          <div className="text-center py-16">
            <p className="text-3xl mb-4">🎉</p>
            <h3 className="text-xl font-black text-white mb-2">Dia livre!</h3>
            <p className="text-slate-400">Nenhuma tarefa ou visita agendada para hoje.</p>
            <Link to="/Clients" className="mt-6 inline-block px-6 py-3 rounded-xl text-white font-bold"
              style={{ background: 'rgba(255,107,0,0.15)', border: '1px solid rgba(255,107,0,0.3)' }}>
              Ver clientes
            </Link>
          </div>
        )}

        {/* Agente Supremo — Acesso Rápido */}
        <div className="rounded-2xl p-4 mb-4" style={{ background: 'rgba(168,85,247,0.08)', border: '2px solid rgba(168,85,247,0.4)' }}>
          <p className="text-xs font-black text-purple-400 uppercase tracking-widest mb-2">👑 AGENTE SUPREMO DE VENDAS</p>
          <p className="text-[11px] text-slate-400 mb-3">IA Master 24/7 — SPIN Selling, Propostas, CRM, Objeções</p>
          <Link to="/WhatsAppHub"
            className="w-full py-3 px-3 rounded-xl text-center text-sm font-black text-green-400 flex items-center justify-center gap-2"
            style={{ background: 'rgba(37,211,102,0.15)', border: '1px solid rgba(37,211,102,0.4)' }}>
            💬 Conectar ao Agente WhatsApp
          </Link>
          <div className="mt-3 text-[10px] text-slate-500 space-y-1 px-2">
            <p>✓ Qualifica leads em tempo real</p>
            <p>✓ Gera propostas personalizadas</p>
            <p>✓ Detecta objeções automaticamente</p>
            <p>✓ Agenda visitas direto</p>
          </div>
        </div>

        {/* Links rápidos */}
        <div className="rounded-2xl p-4 mb-4" style={{ background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.2)' }}>
          <p className="text-xs font-black text-green-400 uppercase tracking-widest mb-3">⚡ Ações Rápidas</p>
          <div className="grid grid-cols-2 gap-2">
            <Link to="/WhatsAppHub"
              className="py-3 px-3 rounded-xl text-center text-base font-black text-green-400"
              style={{ background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.3)' }}>
              💬 WhatsApp Hub
            </Link>
            <Link to="/TasksUnified"
              className="py-3 px-3 rounded-xl text-center text-base font-black text-orange-400"
              style={{ background: 'rgba(255,107,0,0.1)', border: '1px solid rgba(255,107,0,0.3)' }}>
              📋 Tarefas
            </Link>
            <Link to="/Clients"
              className="py-3 px-3 rounded-xl text-center text-base font-black text-purple-400"
              style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.3)' }}>
              👥 Clientes
            </Link>
            <Link to="/SalesCommandCenter"
              className="py-3 px-3 rounded-xl text-center text-base font-black text-red-400"
              style={{ background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.3)' }}>
              🎯 Command
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
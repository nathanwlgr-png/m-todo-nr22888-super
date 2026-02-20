import React, { useState, useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { Bell, X, AlertTriangle, TrendingUp, Calendar, Zap, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';

export default function AlertasTempoReal() {
  const [alertas, setAlertas] = useState([]);
  const [aberto, setAberto] = useState(false);
  const [naoLidos, setNaoLidos] = useState(0);
  const intervalRef = useRef(null);
  const previousCount = useRef(0);

  const checkAlertas = async () => {
    try {
      const [alerts, tasks, visits] = await Promise.all([
        base44.entities.Alert.filter({ read: false, dismissed: false }).catch(() => []),
        base44.entities.Task.filter({ status: 'pendente' }).catch(() => []),
        base44.entities.Visit.filter({ status: 'agendada' }).catch(() => []),
      ]);

      const hoje = new Date().toISOString().split('T')[0];
      const now = new Date();

      const novos = [];

      // Alertas do CRM
      alerts.slice(0, 5).forEach(a => {
        novos.push({
          id: a.id,
          tipo: a.type,
          titulo: a.title,
          mensagem: a.message,
          prioridade: a.priority,
          link: a.link_to,
          fonte: 'crm',
        });
      });

      // Tarefas atrasadas
      const atrasadas = tasks.filter(t => t.due_date && t.due_date < hoje);
      if (atrasadas.length > 0) {
        novos.push({
          id: 'tasks_overdue',
          tipo: 'task_overdue',
          titulo: `${atrasadas.length} tarefa(s) atrasada(s)`,
          mensagem: atrasadas.slice(0, 3).map(t => t.title).join(', '),
          prioridade: 'alta',
          link: 'TasksUnified',
          fonte: 'sistema',
        });
      }

      // Visitas de hoje
      const visitasHoje = visits.filter(v => v.scheduled_date?.startsWith(hoje));
      if (visitasHoje.length > 0) {
        novos.push({
          id: 'visits_today',
          tipo: 'visita_hoje',
          titulo: `${visitasHoje.length} visita(s) hoje`,
          mensagem: visitasHoje.slice(0, 3).map(v => v.client_name).join(', '),
          prioridade: 'media',
          link: 'ScheduledAgenda',
          fonte: 'sistema',
        });
      }

      const totalNaoLidos = novos.length;

      // Notificar se há novos alertas
      if (totalNaoLidos > previousCount.current && previousCount.current > 0) {
        const diff = totalNaoLidos - previousCount.current;
        toast.warning(`🔔 ${diff} novo(s) alerta(s)!`, { duration: 4000 });
      }

      previousCount.current = totalNaoLidos;
      setAlertas(novos);
      setNaoLidos(totalNaoLidos);
    } catch (e) {
      // Silent fail
    }
  };

  useEffect(() => {
    checkAlertas();
    intervalRef.current = setInterval(checkAlertas, 60000); // a cada 1 minuto
    return () => clearInterval(intervalRef.current);
  }, []);

  // Subscrever a novos alertas em tempo real
  useEffect(() => {
    const unsub = base44.entities.Alert.subscribe?.((event) => {
      if (event.type === 'create') {
        const a = event.data;
        if (!a.read && !a.dismissed) {
          toast.warning(`🔔 ${a.title}`, { description: a.message?.substring(0, 80), duration: 5000 });
          checkAlertas();
        }
      }
    });
    return () => unsub?.();
  }, []);

  const dismissAlerta = async (alertaId) => {
    setAlertas(prev => prev.filter(a => a.id !== alertaId));
    if (alertaId && !alertaId.includes('_')) {
      await base44.entities.Alert.update(alertaId, { dismissed: true, read: true }).catch(() => {});
    }
    setNaoLidos(prev => Math.max(0, prev - 1));
  };

  const markAllRead = async () => {
    const crmAlerts = alertas.filter(a => a.fonte === 'crm');
    await Promise.all(crmAlerts.map(a => base44.entities.Alert.update(a.id, { read: true }).catch(() => {})));
    setAlertas([]);
    setNaoLidos(0);
    setAberto(false);
    toast.success('Todos os alertas marcados como lidos');
  };

  const prioridadeConfig = {
    alta: { color: 'bg-red-100 border-red-300', badge: 'bg-red-500', icon: AlertTriangle },
    media: { color: 'bg-yellow-50 border-yellow-200', badge: 'bg-yellow-500', icon: TrendingUp },
    baixa: { color: 'bg-blue-50 border-blue-200', badge: 'bg-blue-400', icon: Bell },
    visita_hoje: { color: 'bg-purple-50 border-purple-200', badge: 'bg-purple-500', icon: Calendar },
    task_overdue: { color: 'bg-red-50 border-red-200', badge: 'bg-red-500', icon: AlertTriangle },
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setAberto(!aberto)}
        className="relative"
      >
        <Bell className={`w-5 h-5 ${naoLidos > 0 ? 'text-orange-500' : 'text-slate-500'}`} />
        {naoLidos > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold animate-pulse">
            {naoLidos > 9 ? '9+' : naoLidos}
          </span>
        )}
      </Button>

      {/* Dropdown */}
      {aberto && (
        <div className="absolute right-0 top-10 w-80 bg-white rounded-xl shadow-2xl border z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-indigo-50 to-purple-50">
            <span className="font-semibold text-sm text-slate-700 flex items-center gap-2">
              <Bell className="w-4 h-4 text-indigo-600" />
              Alertas em Tempo Real
              {naoLidos > 0 && <Badge className="bg-red-500 text-xs h-4">{naoLidos}</Badge>}
            </span>
            <div className="flex gap-1">
              {naoLidos > 0 && (
                <Button size="sm" variant="ghost" onClick={markAllRead} className="text-xs h-6 px-2 text-slate-500 hover:text-slate-700">
                  Limpar
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => setAberto(false)} className="h-6 w-6 p-0">
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          <div className="max-h-72 overflow-y-auto">
            {alertas.length === 0 ? (
              <div className="py-8 text-center text-slate-400">
                <Bell className="w-8 h-8 mx-auto mb-2 text-slate-200" />
                <p className="text-sm">Tudo em dia! 🎉</p>
              </div>
            ) : alertas.map((alerta, i) => {
              const config = prioridadeConfig[alerta.tipo] || prioridadeConfig[alerta.prioridade] || prioridadeConfig.baixa;
              const Icon = config.icon;
              return (
                <div key={alerta.id || i} className={`p-3 border-b last:border-0 ${config.color} border-l-4`}>
                  <div className="flex items-start gap-2">
                    <Icon className="w-4 h-4 mt-0.5 text-slate-600 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-800">{alerta.titulo}</p>
                      {alerta.mensagem && <p className="text-xs text-slate-600 truncate">{alerta.mensagem}</p>}
                      {alerta.link && (
                        <Link
                          to={createPageUrl(alerta.link)}
                          className="text-xs text-indigo-600 hover:underline"
                          onClick={() => setAberto(false)}
                        >
                          Ver detalhes →
                        </Link>
                      )}
                    </div>
                    <button onClick={() => dismissAlerta(alerta.id)} className="shrink-0 text-slate-400 hover:text-slate-600">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-2 border-t bg-slate-50">
            <Button size="sm" variant="ghost" onClick={checkAlertas} className="w-full text-xs h-7 text-slate-500">
              <Zap className="w-3 h-3 mr-1" /> Atualizar agora
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
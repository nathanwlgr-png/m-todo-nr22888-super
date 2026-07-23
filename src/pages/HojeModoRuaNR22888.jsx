import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Bot, CalendarDays, CheckCircle2, Clock3, Flame, Radar } from 'lucide-react';
import ProximaAcaoConsultivaModal from '@/components/ProximaAcaoConsultivaModal';
import OperationalMetricCards from '@/components/dashboard/OperationalMetricCards';
import FieldQuickActions from '@/components/dashboard/FieldQuickActions';

const localDateKey = (date = new Date()) => {
  const localTime = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localTime.toISOString().slice(0, 10);
};

const safeArray = (value) => Array.isArray(value) ? value : [];
const clientName = (client) => client?.clinic_name || client?.full_name || client?.first_name || client?.client_name || 'Cliente sem nome';
const hasPhone = (value) => String(value || '').replace(/\D/g, '').length >= 10;
const isToday = (value, todayKey) => String(value || '').slice(0, 10) === todayKey;

function PriorityClient({ client }) {
  const [showNext, setShowNext] = useState(false);
  const phone = client?.phone;

  return (
    <div className="rounded-2xl border border-orange-500/25 bg-card p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-widest text-orange-400">Prioridade do dia</p>
          <h2 className="mt-1 truncate text-lg font-black text-foreground">{clientName(client)}</h2>
          <p className="mt-1 text-xs text-muted-foreground">Score {client.purchase_score || 0} · {client.city || 'cidade não informada'}</p>
        </div>
        <Flame className="h-5 w-5 shrink-0 text-orange-400" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {hasPhone(phone) ? <a href={`https://wa.me/${String(phone).replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex h-11 items-center justify-center rounded-xl border border-green-500/30 bg-green-500/10 text-xs font-black text-green-300">WhatsApp</a> : <button disabled className="h-11 rounded-xl border border-border text-xs font-black text-muted-foreground">WhatsApp</button>}
        <Link to={`/ClienteDetalhe360?id=${client.id}`} className="flex h-11 items-center justify-center rounded-xl border border-purple-500/30 bg-purple-500/10 text-xs font-black text-purple-300">Cliente 360</Link>
        <button onClick={() => setShowNext(true)} className="h-11 rounded-xl border border-orange-500/30 bg-orange-500/10 text-xs font-black text-orange-300">Próxima ação</button>
      </div>
      <ProximaAcaoConsultivaModal client={client} isOpen={showNext} onClose={() => setShowNext(false)} />
    </div>
  );
}

function TaskRow({ task, todayKey }) {
  const overdue = task.due_date && task.due_date < todayKey;
  return (
    <Link to="/TasksUnified" className="flex min-h-16 items-center gap-3 rounded-2xl border border-border bg-card p-3 active:scale-[0.99]">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${overdue ? 'bg-red-500/10 text-red-300' : 'bg-orange-500/10 text-orange-300'}`}>
        {overdue ? <Clock3 className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-black text-foreground">{task.title || 'Tarefa pendente'}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{task.client_name || 'Cliente não informado'}</p>
      </div>
      <span className={`text-[10px] font-black ${overdue ? 'text-red-300' : 'text-muted-foreground'}`}>{overdue ? 'Atrasada' : task.due_date ? new Date(`${task.due_date}T12:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : 'Sem data'}</span>
    </Link>
  );
}

export default function HojeModoRuaNR22888() {
  const [activeTab, setActiveTab] = useState('today');
  const todayKey = localDateKey();

  const { data: clientsRaw = [] } = useQuery({ queryKey: ['hoje-rua-clients'], queryFn: () => base44.entities.Client.list('-updated_date', 300).catch(() => []), staleTime: 120000 });
  const { data: tasksRaw = [] } = useQuery({ queryKey: ['hoje-rua-tasks'], queryFn: () => base44.entities.Task.list('-due_date', 200).catch(() => []), staleTime: 120000 });
  const { data: visitsRaw = [] } = useQuery({ queryKey: ['hoje-rua-visits'], queryFn: () => base44.entities.Visit.list('-scheduled_date', 100).catch(() => []), staleTime: 120000 });
  const { data: proposalsRaw = [] } = useQuery({ queryKey: ['hoje-rua-proposals'], queryFn: () => base44.entities.ConsultativeProposal.list('-updated_date', 100).catch(() => []), staleTime: 120000 });

  const clients = safeArray(clientsRaw);
  const tasks = safeArray(tasksRaw);
  const visits = safeArray(visitsRaw);
  const proposals = safeArray(proposalsRaw);
  const pendingTasks = useMemo(() => tasks.filter((task) => task.status === 'pendente').sort((a, b) => String(a.due_date || '9999').localeCompare(String(b.due_date || '9999'))), [tasks]);
  const todayTasks = pendingTasks.filter((task) => isToday(task.due_date, todayKey));
  const todayVisits = visits.filter((visit) => isToday(visit.scheduled_date, todayKey) && visit.status !== 'cancelada');
  const overdueTasks = pendingTasks.filter((task) => task.due_date && task.due_date < todayKey);
  const hotClients = useMemo(() => clients.filter((client) => client.status === 'quente' || client.pipeline_stage === 'negociacao' || (client.purchase_score || 0) >= 70).sort((a, b) => (b.purchase_score || 0) - (a.purchase_score || 0)), [clients]);
  const pendingProposals = proposals.filter((proposal) => ['draft', 'sent', 'viewed', 'shared'].includes(proposal.status));
  const metrics = { today: todayTasks.length + todayVisits.length, overdue: overdueTasks.length, hot: hotClients.length, proposals: pendingProposals.length };
  const visibleTasks = activeTab === 'today' ? todayTasks : pendingTasks;

  return (
    <div className="min-h-screen bg-background pb-28 text-foreground">
      <div className="mx-auto max-w-3xl space-y-4 p-4 md:p-6">
        <header className="flex items-center gap-3 py-1">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-orange-500/25 bg-orange-500/10">
            <Bot className="h-5 w-5 text-orange-400" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-orange-400">NR22888 · Modo Rua</p>
            <h1 className="text-xl font-black md:text-2xl">Painel de hoje</h1>
          </div>
        </header>

        <OperationalMetricCards metrics={metrics} />
        <FieldQuickActions />

        <div className="grid grid-cols-2 rounded-2xl border border-border bg-card p-1" role="tablist" aria-label="Conteúdo do painel">
          <button role="tab" aria-selected={activeTab === 'today'} onClick={() => setActiveTab('today')} className={`flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-black ${activeTab === 'today' ? 'bg-orange-500 text-black' : 'text-muted-foreground'}`}><CalendarDays className="h-4 w-4" />Hoje</button>
          <button role="tab" aria-selected={activeTab === 'pending'} onClick={() => setActiveTab('pending')} className={`flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-black ${activeTab === 'pending' ? 'bg-orange-500 text-black' : 'text-muted-foreground'}`}><Clock3 className="h-4 w-4" />Pendentes ({pendingTasks.length})</button>
        </div>

        {activeTab === 'today' && hotClients[0] && <PriorityClient client={hotClients[0]} />}

        <section aria-labelledby="task-list-title">
          <div className="mb-2 flex items-center justify-between">
            <h2 id="task-list-title" className="flex items-center gap-2 text-sm font-black"><Radar className="h-4 w-4 text-orange-400" />{activeTab === 'today' ? 'Compromissos de hoje' : 'Tarefas pendentes'}</h2>
            <Link to="/TasksUnified" className="text-xs font-bold text-orange-400">Ver todas</Link>
          </div>
          {visibleTasks.length === 0 ? <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">Nenhuma tarefa nesta lista.</div> : <div className="space-y-2">{visibleTasks.slice(0, 8).map((task) => <TaskRow key={task.id} task={task} todayKey={todayKey} />)}</div>}
          {activeTab === 'today' && todayVisits.length > 0 && <Link to="/ScheduledAgenda" className="mt-2 flex h-12 items-center justify-between rounded-2xl border border-blue-500/25 bg-blue-500/10 px-4 text-sm font-black text-blue-300"><span>{todayVisits.length} visita{todayVisits.length > 1 ? 's' : ''} agendada{todayVisits.length > 1 ? 's' : ''}</span><CalendarDays className="h-4 w-4" /></Link>}
        </section>

        <p className="text-center text-[10px] text-muted-foreground">Dashboard Sniper → Cliente → Investigação → SPIN → WhatsApp → Proposta → Fechamento</p>
      </div>
    </div>
  );
}
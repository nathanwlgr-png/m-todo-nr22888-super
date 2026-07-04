import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Bot, Calendar, CheckCircle2, ClipboardList, FileText, Flame,
  MapPin, MessageSquare, Package, Radar, Route, ShieldCheck, Siren
} from 'lucide-react';

const COMMANDS = [
  { cmd: '/hoje', label: 'Hoje', target: 'campo' },
  { cmd: '/sniper', label: 'Sniper', target: 'sniper' },
  { cmd: '/ranking', label: 'Ranking = Sniper', target: 'sniper' },
  { cmd: '/rota', label: 'Rota', target: 'campo' },
  { cmd: '/pendencias', label: 'Pendências', target: 'pendencias' },
  { cmd: '/alertas', label: 'Alertas', target: 'alertas' },
  { cmd: '/quentes', label: 'Quentes', target: 'quentes' },
  { cmd: '/followups', label: 'Follow-ups', target: 'followups' },
  { cmd: '/comodato', label: 'Comodato', target: 'posvenda' },
];

const pendingStatuses = ['pending', 'aguardando_aprovacao', 'rascunho', 'ready_to_send'];
const todayKey = new Date().toISOString().slice(0, 10);

const safeArray = (value) => Array.isArray(value) ? value : [];
const clientName = (client) => client?.clinic_name || client?.full_name || client?.first_name || client?.client_name || 'Cliente sem nome';
const hasPhone = (value) => String(value || '').replace(/\D/g, '').length >= 10;
const isToday = (value) => String(value || '').slice(0, 10) === todayKey;
const daysSince = (value) => {
  if (!value) return 999;
  const time = new Date(value).getTime();
  if (Number.isNaN(time)) return 999;
  return Math.floor((Date.now() - time) / 86400000);
};

function EmptyState({ text = 'base ainda não alimentada' }) {
  return <p className="text-sm text-slate-500 py-4 text-center">{text}</p>;
}

function Section({ id, icon: Icon, title, count, children }) {
  return (
    <section id={id} className="rounded-3xl border p-4 md:p-5 bg-[#101012] border-orange-500/20 shadow-lg">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-orange-500/10 border border-orange-500/25">
            <Icon className="w-5 h-5 text-orange-400" />
          </div>
          <h2 className="text-lg md:text-xl font-black text-white">{title}</h2>
        </div>
        <span className="text-xs font-black px-3 py-1 rounded-full bg-orange-500/10 text-orange-300 border border-orange-500/20">{count}</span>
      </div>
      {children}
    </section>
  );
}

function ClientCard({ client, context, recommendation }) {
  const [showNext, setShowNext] = useState(false);
  const phone = client?.phone || client?.recipient_phone || client?.destinatario_contato;
  const clientId = client?.client_id || client?.cliente_id || client?.id;

  return (
    <div className="rounded-2xl p-4 bg-black/35 border border-white/10">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h3 className="text-base md:text-lg font-black text-white leading-tight break-words">{clientName(client)}</h3>
          <p className="text-xs text-slate-400 mt-1 break-words">{context}</p>
        </div>
        <Flame className="w-5 h-5 text-orange-400 shrink-0" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {hasPhone(phone) ? (
          <a href={`https://wa.me/${String(phone).replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="h-12 rounded-xl flex items-center justify-center text-xs md:text-sm font-black text-green-300 bg-green-500/10 border border-green-500/30">WhatsApp</a>
        ) : (
          <button className="h-12 rounded-xl text-xs md:text-sm font-black text-slate-500 bg-slate-800/60 border border-slate-700" disabled>WhatsApp</button>
        )}
        <Link to={`/ClienteDetalhe360?id=${clientId}`} className="h-12 rounded-xl flex items-center justify-center text-xs md:text-sm font-black text-purple-300 bg-purple-500/10 border border-purple-500/30">Cliente 360</Link>
        <button onClick={() => setShowNext((value) => !value)} className="h-12 rounded-xl text-xs md:text-sm font-black text-orange-300 bg-orange-500/10 border border-orange-500/30">Próxima ação</button>
      </div>
      {showNext && (
        <div className="mt-3 rounded-xl p-3 bg-orange-500/8 border border-orange-500/20">
          <p className="text-xs font-bold text-orange-200">Rascunho visual: {recommendation}</p>
          <p className="text-[11px] text-slate-500 mt-1">Nada foi salvo, enviado ou alterado.</p>
        </div>
      )}
    </div>
  );
}

export default function HojeModoRuaNR22888() {
  const [activeCommand, setActiveCommand] = useState('/hoje');

  const { data: clientsRaw = [] } = useQuery({
    queryKey: ['hoje-rua-clients'],
    queryFn: () => base44.entities.Client.list('-updated_date', 300).catch(() => []),
    staleTime: 120000,
  });
  const { data: tasksRaw = [] } = useQuery({
    queryKey: ['hoje-rua-tasks'],
    queryFn: () => base44.entities.Task.list('-due_date', 200).catch(() => []),
    staleTime: 120000,
  });
  const { data: visitsRaw = [] } = useQuery({
    queryKey: ['hoje-rua-visits'],
    queryFn: () => base44.entities.Visit.list('-scheduled_date', 100).catch(() => []),
    staleTime: 120000,
  });
  const { data: pendingRaw = [] } = useQuery({
    queryKey: ['hoje-rua-pending-messages'],
    queryFn: () => base44.entities.PendingMessage.list('-created_date', 100).catch(() => []),
    staleTime: 120000,
  });
  const { data: queueRaw = [] } = useQuery({
    queryKey: ['hoje-rua-crm-queue'],
    queryFn: () => base44.entities.CRMUpdateQueue.list('-created_date', 100).catch(() => []),
    staleTime: 120000,
  });
  const { data: alertsRaw = [] } = useQuery({
    queryKey: ['hoje-rua-alerts'],
    queryFn: () => base44.entities.Alert.list('-created_date', 100).catch(() => []),
    staleTime: 120000,
  });

  const clients = safeArray(clientsRaw);
  const tasks = safeArray(tasksRaw);
  const visits = safeArray(visitsRaw);
  const pendingMessages = safeArray(pendingRaw).filter((m) => pendingStatuses.includes(m.status));
  const crmQueue = safeArray(queueRaw).filter((q) => ['pendente', 'erro'].includes(q.status));
  const openAlerts = safeArray(alertsRaw).filter((a) => !a.read && !a.dismissed);

  const hotClients = useMemo(() => clients
    .filter((c) => c.status === 'quente' || c.pipeline_stage === 'negociacao' || (c.purchase_score || 0) >= 70)
    .sort((a, b) => (b.purchase_score || 0) - (a.purchase_score || 0))
    .slice(0, 5), [clients]);

  const followups = tasks.filter((t) => t.status !== 'concluida' && (t.type === 'follow_up' || String(t.title || '').toLowerCase().includes('follow'))).slice(0, 6);
  const fieldTasks = tasks.filter((t) => t.status !== 'concluida' && (isToday(t.due_date) || t.type === 'visita')).slice(0, 6);
  const fieldVisits = visits.filter((v) => v.status !== 'cancelada' && (isToday(v.scheduled_date) || v.status === 'agendada')).slice(0, 6);
  const hotProposals = clients.filter((c) => ['proposta', 'negociacao'].includes(c.pipeline_stage) || c.sale_closed === true).slice(0, 5);
  const postSaleRisk = clients.filter((c) => (c.equipment_sold || c.current_equipment || c.contract_renewal_date) && daysSince(c.last_purchase_date) > 45).slice(0, 5);
  const sniper = hotClients[0] || clients[0];

  const goToCommand = (command) => {
    setActiveCommand(command.cmd);
    document.getElementById(command.target)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-black text-white pb-32">
      <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-4">
        <header className="rounded-3xl p-5 md:p-6 bg-gradient-to-br from-[#171717] to-[#080808] border border-orange-500/25 shadow-xl">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-orange-500/15 border border-orange-500/30">
              <Bot className="w-6 h-6 text-orange-400" />
            </div>
            <div className="flex-1">
              <p className="text-[11px] font-black text-orange-400 uppercase tracking-[0.25em]">Telegram + NR22888 SuperAgent</p>
              <h1 className="text-2xl md:text-4xl font-black mt-1">Hoje — Modo Rua NR22888</h1>
              <p className="text-sm text-slate-400 mt-2">Tela operacional para decidir o que fazer agora. Mensagens externas continuam exigindo aprovação humana.</p>
            </div>
          </div>
        </header>

        <div className="rounded-3xl border border-green-500/20 bg-green-500/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="w-5 h-5 text-green-400" />
            <p className="text-sm font-black text-green-300">Modo seguro: sem envio automático e sem alteração de dados</p>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-9 gap-2">
            {COMMANDS.map((command) => (
              <button key={command.cmd} onClick={() => goToCommand(command)} className="min-h-14 rounded-2xl px-2 text-center border text-xs font-black transition-all" style={{ background: activeCommand === command.cmd ? 'rgba(255,107,0,0.18)' : 'rgba(255,255,255,0.04)', borderColor: activeCommand === command.cmd ? 'rgba(255,107,0,0.55)' : 'rgba(255,255,255,0.08)', color: activeCommand === command.cmd ? '#ffb86b' : '#cbd5e1' }}>
                <span className="block">{command.cmd}</span>
                <span className="block text-[9px] opacity-70 mt-0.5">{command.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="rounded-2xl p-3 bg-[#101012] border border-orange-500/20"><p className="text-2xl font-black text-orange-300">{hotClients.length}</p><p className="text-[10px] text-slate-500 font-bold uppercase">Quentes</p></div>
          <div className="rounded-2xl p-3 bg-[#101012] border border-green-500/20"><p className="text-2xl font-black text-green-300">{pendingMessages.length}</p><p className="text-[10px] text-slate-500 font-bold uppercase">Aprovações</p></div>
          <div className="rounded-2xl p-3 bg-[#101012] border border-cyan-500/20"><p className="text-2xl font-black text-cyan-300">{fieldTasks.length + fieldVisits.length}</p><p className="text-[10px] text-slate-500 font-bold uppercase">Campo</p></div>
          <div className="rounded-2xl p-3 bg-[#101012] border border-red-500/20"><p className="text-2xl font-black text-red-300">{openAlerts.length + crmQueue.length}</p><p className="text-[10px] text-slate-500 font-bold uppercase">Pendências</p></div>
        </div>

        <Section id="sniper" icon={Radar} title="Sniper do dia" count={sniper ? 1 : 0}>
          {sniper ? <ClientCard client={sniper} context={`Score ${sniper.purchase_score || 0} • ${sniper.city || 'cidade não informada'}`} recommendation="priorizar contato consultivo, validar necessidade de equipamento e preparar abordagem SPIN antes do WhatsApp." /> : <EmptyState />}
        </Section>

        <Section id="pendencias" icon={MessageSquare} title="Mensagens aguardando aprovação" count={pendingMessages.length}>
          {pendingMessages.length === 0 ? <EmptyState /> : <div className="space-y-2">{pendingMessages.slice(0, 5).map((m) => <ClientCard key={m.id} client={{ ...m, clinic_name: m.recipient_name || m.destinatario_nome, phone: m.recipient_phone || m.destinatario_contato }} context={m.channel || m.canal || 'mensagem pendente'} recommendation="revisar texto, confirmar contexto e aprovar manualmente somente se estiver pronto para envio." />)}</div>}
        </Section>

        <Section id="campo" icon={Route} title="Visitas e tarefas de campo" count={fieldTasks.length + fieldVisits.length}>
          {fieldTasks.length + fieldVisits.length === 0 ? <EmptyState /> : <div className="space-y-3">
            {fieldVisits.map((v) => <ClientCard key={`v-${v.id}`} client={{ id: v.client_id, clinic_name: v.client_name }} context={`${v.location || 'sem endereço'} • ${v.status || 'visita'}`} recommendation="confirmar rota, objetivo da visita e principal dor antes de chegar na clínica." />)}
            {fieldTasks.map((t) => <ClientCard key={`t-${t.id}`} client={{ id: t.client_id, clinic_name: t.client_name || t.title }} context={t.description || t.type || 'tarefa de campo'} recommendation="executar a tarefa pendente e registrar conclusão somente na tela de tarefas, se necessário." />)}
          </div>}
        </Section>

        <Section id="quentes" icon={Flame} title="Clientes quentes" count={hotClients.length}>
          {hotClients.length === 0 ? <EmptyState /> : <div className="space-y-3">{hotClients.map((c) => <ClientCard key={c.id} client={c} context={`${c.pipeline_stage || c.status || 'oportunidade'} • ${c.city || 'sem cidade'}`} recommendation="abrir Cliente 360, revisar histórico e conduzir próximo passo para proposta ou fechamento." />)}</div>}
        </Section>

        <Section id="followups" icon={CheckCircle2} title="Follow-ups pendentes" count={followups.length}>
          {followups.length === 0 ? <EmptyState /> : <div className="space-y-3">{followups.map((t) => <ClientCard key={t.id} client={{ id: t.client_id, clinic_name: t.client_name || t.title }} context={t.description || 'follow-up pendente'} recommendation="retomar conversa com contexto, sem disparo automático; preparar mensagem para aprovação se necessário." />)}</div>}
        </Section>

        <Section id="propostas" icon={FileText} title="Propostas quentes" count={hotProposals.length}>
          {hotProposals.length === 0 ? <EmptyState /> : <div className="space-y-3">{hotProposals.map((c) => <ClientCard key={c.id} client={c} context={`${c.pipeline_stage || 'proposta'} • ${c.equipment_interest || c.equipment_sold || 'equipamento a validar'}`} recommendation="validar objeção final, condição comercial e abrir proposta para avançar fechamento." />)}</div>}
        </Section>

        <Section id="posvenda" icon={Package} title="Pós-venda e insumos em risco" count={postSaleRisk.length}>
          {postSaleRisk.length === 0 ? <EmptyState /> : <div className="space-y-3">{postSaleRisk.map((c) => <ClientCard key={c.id} client={c} context={`${c.equipment_sold || c.current_equipment || 'equipamento'} • última compra ${c.last_purchase_date || 'não informada'}`} recommendation="verificar consumo, risco de reposição e oportunidade de recompra sem criar mensagem automática." />)}</div>}
        </Section>

        <Section id="alertas" icon={Siren} title="Alertas abertos" count={openAlerts.length}>
          {openAlerts.length === 0 ? <EmptyState /> : <div className="space-y-2">{openAlerts.slice(0, 6).map((a) => <div key={a.id} className="rounded-2xl p-4 bg-red-500/8 border border-red-500/20"><p className="font-black text-red-200">{a.title}</p><p className="text-sm text-slate-400 mt-1">{a.message}</p>{a.link_to && <Link to={a.link_to.startsWith('/') ? a.link_to : `/${a.link_to}`} className="inline-flex mt-3 h-11 px-4 rounded-xl items-center justify-center text-sm font-black text-red-200 bg-red-500/10 border border-red-500/25">Abrir alerta</Link>}</div>)}</div>}
        </Section>

        <Section id="fila-crm" icon={ClipboardList} title="Pendências da fila CRM" count={crmQueue.length}>
          {crmQueue.length === 0 ? <EmptyState /> : <div className="space-y-2">{crmQueue.slice(0, 6).map((q) => <div key={q.id} className="rounded-2xl p-4 bg-purple-500/8 border border-purple-500/20"><p className="font-black text-purple-200">{q.comando_interpretado || q.tipo_atualizacao || 'Atualização pendente'}</p><p className="text-sm text-slate-400 mt-1">{q.texto_original || q.observacao || 'Aguardando revisão humana.'}</p><p className="text-[11px] text-slate-500 mt-2">Status: {q.status} • Risco: {q.risco}</p></div>)}</div>}
        </Section>

        <div className="rounded-3xl p-4 bg-[#101012] border border-slate-700 text-center">
          <p className="text-xs text-slate-500">Fluxo mestre: Dashboard Sniper → Cliente → Investigação → SPIN → WhatsApp → Proposta → Fechamento.</p>
        </div>
      </div>
    </div>
  );
}
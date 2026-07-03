import React from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import {
  Target, MessageSquare, Mic, Send, MapPin, Flame,
  FileText, CheckSquare, Shield, ListChecks, ChevronRight
} from 'lucide-react';

// Bloco "Campo Total NR22888" — visão compacta de campo, SAFE.
// Não envia nada, não altera dado crítico: apenas consolida e navega.
export default function CampoTotalNR22888() {
  const { data: pending = [] } = useQuery({
    queryKey: ['campo-pending'],
    queryFn: () => base44.entities.PendingMessage.list('-created_date', 50).catch(() => []),
    staleTime: 60000,
  });
  const { data: scores = [] } = useQuery({
    queryKey: ['campo-scores'],
    queryFn: () => base44.entities.EliteLeadScore.list('-elite_score', 50).catch(() => []),
    staleTime: 60000,
  });
  const { data: tasks = [] } = useQuery({
    queryKey: ['campo-tasks-hoje'],
    queryFn: () => base44.entities.Task.filter({ status: 'pendente' }).catch(() => []),
    staleTime: 60000,
  });
  const { data: telLogs = [] } = useQuery({
    queryKey: ['campo-tel'],
    queryFn: () => base44.entities.TelegramCommandLog.list('-data_hora', 1).catch(() => []),
    staleTime: 120000,
  });

  const safePending = Array.isArray(pending) ? pending : [];
  const safeScores = Array.isArray(scores) ? scores : [];
  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const safeTelLogs = Array.isArray(telLogs) ? telLogs : [];

  const pendStatus = ['pending', 'aguardando_aprovacao', 'ready_to_send', 'rascunho', 'aprovado', 'approved'];
  const whatsappPendentes = safePending.filter(m => pendStatus.includes(m.status)).length;
  const quentes = safeScores.filter(s => (s.elite_score || 0) >= 71).length;
  const propostasPendentes = safePending.filter(m => (m.contexto || m.context || '').toLowerCase().includes('proposta')).length;
  const hoje = new Date().toISOString().slice(0, 10);
  const followUpsHoje = safeTasks.filter(t => (t.due_date || '').slice(0, 10) <= hoje).length;
  const telegramOk = safeTelLogs.length > 0;

  const Item = ({ icon: Icon, label, value, to, color }) => {
    const inner = (
      <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#0b0b0d] border border-white/5 hover:border-orange-500/30 transition-colors">
        <div className="flex items-center gap-2.5">
          <Icon className={`w-4 h-4 ${color}`} />
          <span className="text-xs font-bold text-orange-100">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          {value != null && <span className={`text-xs font-black ${color}`}>{value}</span>}
          <ChevronRight className="w-3.5 h-3.5 text-white/30" />
        </div>
      </div>
    );
    return to ? <Link to={to}>{inner}</Link> : inner;
  };

  return (
    <div className="rounded-2xl p-4 bg-gradient-to-b from-[#12100c] to-[#0f0f11] border border-orange-500/25 shadow-xl space-y-2">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-xs font-black text-orange-400 uppercase tracking-widest flex items-center gap-2">
          <Target className="w-4 h-4" /> Campo Total NR22888
        </h2>
        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${telegramOk ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'}`}>
          {telegramOk ? 'Telegram: conectado' : 'Telegram: pendente'}
        </span>
      </div>

      <Item icon={Flame} label="1 · Sniper do Dia" to="/RankingOportunidades" color="text-orange-400" />
      <Item icon={MessageSquare} label="2 · WhatsApp pendentes" value={whatsappPendentes} to="/WhatsAppHub?tab=pendentes" color="text-rose-400" />
      <Item icon={Mic} label="3 · Voz Campo" to="/VozCampo" color="text-purple-400" />
      <Item icon={Send} label="4 · Telegram" value={telegramOk ? 'OK' : '—'} to="/CentralIAMaster" color="text-sky-400" />
      <Item icon={MapPin} label="5 · Rota do Dia" to="/RouteOptimizer" color="text-amber-400" />
      <Item icon={Flame} label="6 · Clientes quentes" value={quentes} to="/RankingOportunidades" color="text-red-400" />
      <Item icon={FileText} label="7 · Propostas pendentes" value={propostasPendentes} to="/ProposalGenerator" color="text-orange-300" />
      <Item icon={CheckSquare} label="8 · Follow-ups de hoje" value={followUpsHoje} to="/TasksUnified" color="text-cyan-400" />
      <Item icon={Shield} label="9 · Central SAFE" to="/CentralIAMaster" color="text-emerald-400" />
      <Item icon={ListChecks} label="10 · Pendências para 100%" to="/SystemManual" color="text-yellow-400" />
    </div>
  );
}
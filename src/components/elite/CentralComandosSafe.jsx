import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, MessageSquare, RefreshCw, Send, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

export default function CentralComandosSafe() {
  const qc = useQueryClient();
  const [busy, setBusy] = useState('');
  const { data: queues = [] } = useQuery({ queryKey: ['crm-update-queue-safe'], queryFn: () => base44.entities.CRMUpdateQueue.list('-created_date', 20), staleTime: 20000 });
  const { data: logs = [] } = useQuery({ queryKey: ['telegram-command-log-safe'], queryFn: () => base44.entities.TelegramCommandLog.list('-data_hora', 12), staleTime: 20000 });
  const { data: pendingMessages = [] } = useQuery({ queryKey: ['pending-message-safe'], queryFn: () => base44.entities.PendingMessage.list('-created_date', 20), staleTime: 20000 });
  const { data: tasks = [] } = useQuery({ queryKey: ['followups-safe'], queryFn: () => base44.entities.Task.filter({ status: 'pendente' }), staleTime: 30000 });

  const pendingQueues = queues.filter(q => ['pendente', 'aprovado', 'erro'].includes(q.status));
  const pendingWhats = pendingMessages.filter(m => ['pending', 'aguardando_aprovacao', 'rascunho', 'ready_to_send'].includes(m.status));
  const errors = logs.filter(l => l.status === 'erro' || l.erro);

  const updateQueue = async (item, data) => {
    setBusy(item.id);
    await base44.entities.CRMUpdateQueue.update(item.id, data);
    qc.invalidateQueries({ queryKey: ['crm-update-queue-safe'] });
    setBusy('');
  };

  const applyQueue = async (item) => {
    setBusy(item.id);
    const res = await base44.functions.invoke('aplicarAtualizacaoCRMComSeguranca', { queue_id: item.id });
    toast[res.data?.applied ? 'success' : 'info'](res.data?.applied ? 'Atualização aplicada com log.' : 'Atualização ficou pendente de aprovação.');
    qc.invalidateQueries({ queryKey: ['crm-update-queue-safe'] });
    setBusy('');
  };

  const openWhatsApp = (msg) => {
    const phone = (msg.recipient_phone || msg.destinatario_contato || '').replace(/\D/g, '');
    const text = encodeURIComponent(msg.message_content || msg.mensagem || msg.edited_content || '');
    if (!phone || !text) { toast.error('Telefone ou mensagem ausente.'); return; }
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  };

  const telegramConnectUrl = typeof base44?.agents?.getTelegramConnectURL === 'function'
    ? base44.agents.getTelegramConnectURL('telegram_operacional_nr22888')
    : '';

  return <div className="rounded-2xl p-4 bg-[#0f0f11] border-2 border-cyan-500/30 shadow-xl space-y-3">
    <div className="flex items-center justify-between gap-3">
      <div><p className="text-xs font-black text-cyan-300 uppercase tracking-widest">Fase II-SAFE</p><h2 className="text-lg font-black text-white">Central de Comandos</h2></div>
      <ShieldAlert className="w-7 h-7 text-cyan-300" />
    </div>
    <div className="grid grid-cols-2 gap-2 text-xs">
      <Metric label="Comandos Telegram" value={logs.length} />
      <Metric label="Atualizações CRM" value={pendingQueues.length} />
      <Metric label="WhatsApp pendentes" value={pendingWhats.length} />
      <Metric label="Follow-ups" value={tasks.length} />
      <Metric label="Erros" value={errors.length} />
      <Metric label="Aguardando aprovação" value={pendingQueues.filter(q => q.exige_aprovacao || q.risco !== 'baixo').length + pendingWhats.length} />
    </div>

    <div className="rounded-xl p-3 bg-black/35 border border-cyan-500/20 space-y-2">
      <p className="text-[10px] text-cyan-300 font-black uppercase">Atualizações pendentes do CRM</p>
      {pendingQueues.slice(0, 4).map(item => <div key={item.id} className="p-2 rounded-lg bg-black/45 border border-cyan-500/10">
        <div className="flex justify-between gap-2"><b className="text-xs text-white truncate">{item.campo_alvo || item.tipo_atualizacao}</b><Badge className={item.risco === 'alto' ? 'bg-red-600' : item.risco === 'medio' ? 'bg-orange-600' : 'bg-emerald-600'}>{item.risco}</Badge></div>
        <p className="text-[11px] text-slate-400 line-clamp-2">{item.valor_novo || item.texto_original}</p>
        <div className="grid grid-cols-4 gap-1 mt-2">
          <Button size="sm" disabled={busy === item.id} onClick={() => updateQueue(item, { status: 'aprovado', data_aprovacao: new Date().toISOString() })} className="text-[10px] bg-emerald-700 hover:bg-emerald-600"><CheckCircle className="w-3 h-3" /></Button>
          <Button size="sm" disabled={busy === item.id} onClick={() => updateQueue(item, { status: 'rejeitado' })} className="text-[10px] bg-red-700 hover:bg-red-600"><XCircle className="w-3 h-3" /></Button>
          <Button size="sm" disabled={busy === item.id} onClick={() => applyQueue(item)} className="text-[10px] bg-cyan-700 hover:bg-cyan-600">Aplicar</Button>
          <Button size="sm" disabled={busy === item.id} onClick={() => toast.info('Edite o item na fila antes de aplicar.')} variant="outline" className="text-[10px]">Editar</Button>
        </div>
      </div>)}
      {pendingQueues.length === 0 && <p className="text-xs text-slate-500">Nenhuma atualização de CRM aguardando ação.</p>}
    </div>

    <div className="rounded-xl p-3 bg-black/35 border border-green-500/20 space-y-2">
      <p className="text-[10px] text-green-300 font-black uppercase">Mensagens pendentes WhatsApp</p>
      {pendingWhats.slice(0, 3).map(msg => <div key={msg.id} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-black/45 border border-green-500/10">
        <div className="min-w-0"><p className="text-xs text-white font-bold truncate">{msg.destinatario_nome || msg.recipient_name || 'Cliente'}</p><p className="text-[10px] text-slate-500 truncate">{msg.mensagem || msg.message_content}</p></div>
        <Button size="sm" onClick={() => openWhatsApp(msg)} className="bg-green-700 hover:bg-green-600"><Send className="w-3 h-3" /></Button>
      </div>)}
      {pendingWhats.length === 0 && <p className="text-xs text-slate-500">Nenhuma mensagem externa pendente.</p>}
    </div>

    <div className="rounded-xl p-3 bg-black/35 border border-purple-500/20">
      <p className="text-[10px] text-purple-300 font-black uppercase mb-2">Últimos comandos Telegram</p>
      {logs.slice(0, 4).map(log => <p key={log.id} className="text-[11px] text-slate-400 py-1 border-b border-purple-500/10 last:border-0">{log.intencao_detectada} · {log.resposta_gerada || log.erro}</p>)}
      {logs.length === 0 && <p className="text-xs text-slate-500">Telegram ainda depende de conexão do agente.</p>}
    </div>

    <div className="grid grid-cols-3 gap-2">
      <Link to="/WhatsAppHub"><Button size="sm" className="w-full bg-green-700 hover:bg-green-600"><MessageSquare className="w-4 h-4 mr-1" />WhatsApp</Button></Link>
      {telegramConnectUrl ? (
        <a href={telegramConnectUrl} target="_blank" rel="noopener noreferrer"><Button size="sm" className="w-full bg-sky-700 hover:bg-sky-600">Telegram</Button></a>
      ) : (
        <Button size="sm" disabled variant="outline" className="w-full text-[10px] leading-tight">Conectar Telegram no editor do agente</Button>
      )}
      <Button size="sm" variant="outline" onClick={() => { qc.invalidateQueries({ queryKey: ['crm-update-queue-safe'] }); qc.invalidateQueries({ queryKey: ['telegram-command-log-safe'] }); qc.invalidateQueries({ queryKey: ['pending-message-safe'] }); }}><RefreshCw className="w-4 h-4 mr-1" />Atualizar</Button>
    </div>
  </div>;
}

function Metric({ label, value }) { return <div className="rounded-xl p-3 bg-black/35 border border-cyan-500/20"><span className="text-slate-400">{label}</span><br /><b className="text-white">{value}</b></div>; }
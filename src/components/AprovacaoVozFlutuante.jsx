import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Mic, X, Check, Trash2, Loader2, ShieldCheck, ClipboardList, MessageSquare } from 'lucide-react';

// Botão flutuante de Aprovação por Voz — valida com 1 clique as ações geradas pelo comando de voz.
// SAFE: aprovar uma mensagem apenas a marca como pronta (não envia). Descartar remove da fila.
export default function AprovacaoVozFlutuante() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [busyId, setBusyId] = useState(null);

  // Fila CRM gerada por voz (visita, agendamento) ainda pendente
  const { data: queueItems = [], refetch: refetchQueue } = useQuery({
    queryKey: ['voz-crm-queue'],
    queryFn: () => base44.entities.CRMUpdateQueue.filter({ agente_origem: 'comando_voz_safe', status: 'pendente' }, '-data_criacao', 30).catch(() => []),
    staleTime: 30000,
  });

  // Rascunhos de WhatsApp gerados por voz aguardando aprovação
  const { data: pendingMsgs = [], refetch: refetchMsgs } = useQuery({
    queryKey: ['voz-pending-msgs'],
    queryFn: () => base44.entities.PendingMessage.filter({ criado_por_agente: 'comando_voz_safe', status: 'aguardando_aprovacao' }, '-data_criacao', 30).catch(() => []),
    staleTime: 30000,
  });

  const total = queueItems.length + pendingMsgs.length;

  const refreshAll = () => {
    refetchQueue();
    refetchMsgs();
    queryClient.invalidateQueries({ queryKey: ['dashboard-tasks'] });
  };

  // ── Fila CRM ──
  const aprovarQueue = async (item) => {
    setBusyId(item.id);
    try {
      // marca como aprovado e tenta aplicar com segurança
      await base44.entities.CRMUpdateQueue.update(item.id, { status: 'aprovado', data_aprovacao: new Date().toISOString() });
      await base44.functions.invoke('aplicarAtualizacaoCRMComSeguranca', { queue_id: item.id }).catch(() => {});
    } finally {
      setBusyId(null);
      refreshAll();
    }
  };
  const descartarQueue = async (item) => {
    setBusyId(item.id);
    try {
      await base44.entities.CRMUpdateQueue.update(item.id, { status: 'rejeitado' });
    } finally {
      setBusyId(null);
      refreshAll();
    }
  };

  // ── Mensagens (SAFE: aprovar só prepara, não envia) ──
  const aprovarMsg = async (msg) => {
    setBusyId(msg.id);
    try {
      await base44.entities.PendingMessage.update(msg.id, { status: 'aprovado', aprovado_por_nathan: true, data_aprovacao: new Date().toISOString() });
    } finally {
      setBusyId(null);
      refreshAll();
    }
  };
  const descartarMsg = async (msg) => {
    setBusyId(msg.id);
    try {
      await base44.entities.PendingMessage.update(msg.id, { status: 'rejeitado' });
    } finally {
      setBusyId(null);
      refreshAll();
    }
  };

  return (
    <>
      {/* ── Botão flutuante ── */}
      <button
        onClick={() => setOpen(true)}
        className="fixed z-[110] bottom-24 right-4 flex items-center gap-2 rounded-full px-4 py-3 font-black text-sm text-black shadow-2xl"
        style={{ background: '#ff9500' }}
      >
        <Mic className="w-5 h-5" />
        Aprovar Voz
        {total > 0 && (
          <span className="ml-1 min-w-[20px] h-5 px-1 rounded-full bg-black text-orange-400 text-xs flex items-center justify-center font-black">
            {total}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-[130] flex items-end sm:items-center justify-center p-3">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-md rounded-2xl p-4 flex flex-col gap-3 max-h-[85vh]" style={{ background: '#0d0d0d', border: '1px solid rgba(255,107,0,0.25)' }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mic className="w-5 h-5 text-orange-400" />
                <span className="font-black text-white text-sm">Aprovação por Voz</span>
              </div>
              <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              Nada é enviado automaticamente. Você valida cada ação antes de aplicar.
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {total === 0 && (
                <div className="text-center py-8 text-slate-500 text-sm">
                  Nenhuma pendência de voz aguardando aprovação.
                </div>
              )}

              {/* Fila CRM (visita/agendamento) */}
              {queueItems.map((item) => (
                <div key={item.id} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,149,0,0.25)' }}>
                  <div className="flex items-center gap-1.5 mb-1 text-[11px] font-black text-orange-400 uppercase tracking-wide">
                    <ClipboardList className="w-3.5 h-3.5" />
                    {item.tipo_atualizacao || 'Atualização CRM'}
                  </div>
                  <p className="text-xs text-slate-300 mb-2 line-clamp-3">{item.valor_novo || item.comando_interpretado || item.texto_original}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => aprovarQueue(item)} disabled={busyId === item.id} className="flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-black text-black disabled:opacity-50" style={{ background: '#10b981' }}>
                      {busyId === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Aprovar
                    </button>
                    <button onClick={() => descartarQueue(item)} disabled={busyId === item.id} className="flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-black text-rose-300 disabled:opacity-50" style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)' }}>
                      <Trash2 className="w-3.5 h-3.5" /> Descartar
                    </button>
                  </div>
                </div>
              ))}

              {/* Rascunhos WhatsApp */}
              {pendingMsgs.map((msg) => (
                <div key={msg.id} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(168,85,247,0.3)' }}>
                  <div className="flex items-center gap-1.5 mb-1 text-[11px] font-black text-purple-400 uppercase tracking-wide">
                    <MessageSquare className="w-3.5 h-3.5" />
                    Rascunho WhatsApp · {msg.destinatario_nome || msg.recipient_name || 'cliente'}
                  </div>
                  <p className="text-xs text-slate-300 mb-2 line-clamp-3">{msg.mensagem || msg.message_content}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => aprovarMsg(msg)} disabled={busyId === msg.id} className="flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-black text-black disabled:opacity-50" style={{ background: '#10b981' }}>
                      {busyId === msg.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Aprovar
                    </button>
                    <button onClick={() => descartarMsg(msg)} disabled={busyId === msg.id} className="flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-black text-rose-300 disabled:opacity-50" style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)' }}>
                      <Trash2 className="w-3.5 h-3.5" /> Descartar
                    </button>
                  </div>
                  <p className="mt-1.5 text-[10px] text-purple-300">Aprovar só prepara — o envio é feito manualmente por você no WhatsApp Hub.</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Bot, FileText, Bell, Clock, AlertTriangle, ChevronRight } from 'lucide-react';

const statusDot = (ok) => (
  <span className={`inline-block w-2 h-2 rounded-full ${ok ? 'bg-emerald-400' : 'bg-slate-600'}`} />
);

export default function SuperAgentWidget() {
  const { data: auditLogs = [] } = useQuery({
    queryKey: ['superagent-audit'],
    queryFn: () => base44.entities.AuditLog.list('-created_date', 20),
    staleTime: 30000,
    select: (d) => d.filter(l =>
      (l.module || '').toLowerCase().includes('superagent') ||
      (l.action || '').toLowerCase().includes('superagent') ||
      (l.user_email || '').toLowerCase().includes('superagent')
    ).slice(0, 5),
  });

  const { data: docs = [] } = useQuery({
    queryKey: ['superagent-docs'],
    queryFn: () => base44.entities.ClientDocument.list('-created_date', 10),
    staleTime: 30000,
    select: (d) => d.slice(0, 4),
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['superagent-alerts'],
    queryFn: () => base44.entities.Alert.list('-created_date', 10).catch(() => []),
    staleTime: 30000,
    select: (d) => d.filter(a => !a.read).slice(0, 4),
  });

  const { data: pendencias = [] } = useQuery({
    queryKey: ['superagent-arquivos'],
    queryFn: () => base44.entities.ArquivoNR22888.filter({ precisa_revisao_nathan: true }).catch(() => []),
    staleTime: 30000,
    select: (d) => d.slice(0, 4),
  });

  const totalPendencias = pendencias.length + alerts.length;
  const agentAtivo = auditLogs.length > 0 || docs.length > 0;

  return (
    <div className="rounded-2xl bg-[#0f0f11] border border-violet-500/30 shadow-[0_0_20px_rgba(139,92,246,0.08)] overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-violet-500/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-violet-400" />
          <span className="text-xs font-black text-violet-300 uppercase tracking-widest">SuperAgent NR22888</span>
        </div>
        <div className="flex items-center gap-1.5">
          {statusDot(agentAtivo)}
          <span className="text-[10px] text-slate-500">{agentAtivo ? 'Ativo' : 'Aguardando'}</span>
          {totalPendencias > 0 && (
            <span className="ml-2 bg-rose-500/80 text-white text-[10px] font-black rounded-full px-1.5 py-0.5">
              {totalPendencias}
            </span>
          )}
        </div>
      </div>

      <div className="p-3 space-y-3">

        {/* Ações recentes */}
        <div>
          <p className="text-[10px] font-black text-violet-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Ações Recentes
          </p>
          {auditLogs.length === 0 ? (
            <p className="text-[10px] text-slate-600 italic px-1">Nenhuma ação do SuperAgent registrada ainda.</p>
          ) : (
            <div className="space-y-1">
              {auditLogs.map((log) => (
                <div key={log.id} className="flex items-start justify-between px-2 py-1.5 rounded-lg bg-violet-500/5 border border-violet-500/10">
                  <div>
                    <p className="text-[11px] font-bold text-violet-200">{log.action || 'Ação'}</p>
                    <p className="text-[9px] text-slate-500">{log.module || '—'}</p>
                  </div>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${log.success ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                    {log.success ? 'OK' : 'Erro'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Documentos recentes */}
        {docs.length > 0 && (
          <div>
            <p className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
              <FileText className="w-3 h-3" /> Documentos Validados
            </p>
            <div className="space-y-1">
              {docs.map((doc) => (
                <Link key={doc.id} to={`/ClientProfile?id=${doc.client_id}`}>
                  <div className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-cyan-500/5 border border-cyan-500/10 hover:bg-cyan-500/10 transition-colors">
                    <div>
                      <p className="text-[11px] font-bold text-cyan-200">{doc.title || 'Documento'}</p>
                      <p className="text-[9px] text-slate-500">{doc.client_name || '—'}</p>
                    </div>
                    <ChevronRight className="w-3 h-3 text-cyan-600" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Alertas comerciais */}
        {alerts.length > 0 && (
          <div>
            <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
              <Bell className="w-3 h-3" /> Alertas Comerciais
            </p>
            <div className="space-y-1">
              {alerts.map((alert) => (
                <div key={alert.id} className="px-2 py-1.5 rounded-lg bg-amber-500/5 border border-amber-500/10">
                  <p className="text-[11px] font-bold text-amber-200">{alert.title || alert.message || 'Alerta'}</p>
                  <p className="text-[9px] text-slate-500">{alert.type || '—'}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pendências Nathan */}
        {pendencias.length > 0 && (
          <div>
            <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Pendências para Nathan
            </p>
            <div className="space-y-1">
              {pendencias.map((arq) => (
                <div key={arq.id} className="px-2 py-1.5 rounded-lg bg-rose-500/5 border border-rose-500/10">
                  <p className="text-[11px] font-bold text-rose-200">{arq.nome || 'Arquivo'}</p>
                  <p className="text-[9px] text-slate-500">{arq.tipo || '—'} · {arq.status || '—'}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Vazio total */}
        {auditLogs.length === 0 && docs.length === 0 && alerts.length === 0 && pendencias.length === 0 && (
          <div className="text-center py-3">
            <Bot className="w-6 h-6 text-violet-600 mx-auto mb-1" />
            <p className="text-[10px] text-slate-600">SuperAgent ainda não registrou eventos.<br />Conecte o Telegram para ativar.</p>
          </div>
        )}
      </div>
    </div>
  );
}
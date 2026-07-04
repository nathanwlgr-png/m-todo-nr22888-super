import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clipboard, Copy, ExternalLink, ShieldAlert, X } from 'lucide-react';
import { toast } from 'sonner';
import { buildConsultativeApproach, getClientDisplayName } from '@/lib/seamatyConsultativeSales';

export default function ProximaAcaoConsultivaModal({ client, isOpen, onClose }) {
  const approach = useMemo(() => buildConsultativeApproach(client), [client]);
  const [draft, setDraft] = useState(approach.openingPhrase);
  const clientId = client?.client_id || client?.cliente_id || client?.id;

  if (!isOpen) return null;

  const copyDraft = async () => {
    await navigator.clipboard.writeText(draft);
    toast.success('Rascunho copiado — não enviado automaticamente');
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end md:items-center justify-center p-3">
      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl bg-[#101012] border border-orange-500/30 shadow-2xl p-4 md:p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Próxima ação consultiva SEAMATY</p>
            <h2 className="text-xl md:text-2xl font-black text-white mt-1">{getClientDisplayName(client)}</h2>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="rounded-2xl p-3 mb-3 bg-red-500/8 border border-red-500/25 flex items-start gap-2">
          <ShieldAlert className="w-5 h-5 text-red-300 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-black text-red-200">não envia automaticamente</p>
            <p className="text-xs text-slate-400">Este painel apenas monta um rascunho visual com dados existentes. Qualquer mensagem externa continua exigindo aprovação humana.</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-2 mb-3">
          <div className="rounded-2xl p-3 bg-orange-500/8 border border-orange-500/25">
            <p className="text-[9px] font-black text-orange-300 uppercase tracking-widest mb-1">Motivo da prioridade</p>
            <p className="text-sm text-white font-bold">{approach.priorityReason}</p>
          </div>
          <div className="rounded-2xl p-3 bg-purple-500/8 border border-purple-500/25">
            <p className="text-[9px] font-black text-purple-300 uppercase tracking-widest mb-1">Numerologia</p>
            <p className="text-sm text-white font-bold">{approach.numerologyText}</p>
          </div>
          <div className="rounded-2xl p-3 bg-blue-500/8 border border-blue-500/25">
            <p className="text-[9px] font-black text-blue-300 uppercase tracking-widest mb-1">Técnica recomendada</p>
            <p className="text-sm text-white font-bold">{approach.technique}</p>
          </div>
          <div className="rounded-2xl p-3 bg-green-500/8 border border-green-500/25">
            <p className="text-[9px] font-black text-green-300 uppercase tracking-widest mb-1">Gatilho ético sugerido</p>
            <p className="text-sm text-white font-bold">{approach.ethicalTrigger}</p>
          </div>
        </div>

        <div className="rounded-2xl p-3 bg-white/5 border border-white/10 mb-3">
          <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Objeção provável</p>
          <p className="text-sm text-slate-200 font-bold">{approach.likelyObjection}</p>
        </div>

        <div className="rounded-2xl p-3 bg-black/35 border border-white/10 mb-3">
          <div className="flex items-center gap-2 mb-2"><Clipboard className="w-4 h-4 text-orange-300" /><p className="text-[9px] font-black text-orange-300 uppercase tracking-widest">Mensagem rascunho</p></div>
          <textarea value={draft} onChange={(event) => setDraft(event.target.value)} rows={4} className="w-full rounded-xl p-3 text-sm text-white bg-[#080808] border border-white/10 focus:outline-none focus:border-orange-400/50" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button onClick={copyDraft} className="h-12 rounded-2xl flex items-center justify-center gap-2 text-sm font-black text-orange-200 bg-orange-500/10 border border-orange-500/30">
            <Copy className="w-4 h-4" /> Copiar rascunho
          </button>
          {clientId ? (
            <Link to={`/ClienteDetalhe360?id=${clientId}`} className="h-12 rounded-2xl flex items-center justify-center gap-2 text-sm font-black text-purple-200 bg-purple-500/10 border border-purple-500/30" onClick={onClose}>
              <ExternalLink className="w-4 h-4" /> Abrir Cliente 360
            </Link>
          ) : (
            <button disabled className="h-12 rounded-2xl text-sm font-black text-slate-500 bg-slate-800/60 border border-slate-700">Cliente 360</button>
          )}
        </div>
      </div>
    </div>
  );
}
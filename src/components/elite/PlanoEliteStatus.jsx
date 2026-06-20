import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Flame, MessageSquare, PlugZap } from 'lucide-react';

export default function PlanoEliteStatus({ hotCount, visitsCount, inactiveCount }) {
  const { data: scores = [] } = useQuery({
    queryKey: ['elite-lead-score-preview'],
    queryFn: () => base44.entities.EliteLeadScore.list('-elite_score', 10),
    staleTime: 60000,
  });
  const { data: tools = [] } = useQuery({
    queryKey: ['elite-tool-connection-preview'],
    queryFn: () => base44.entities.EliteToolConnection.list('-prioridade_comercial', 50),
    staleTime: 300000,
  });
  const { data: pending = [] } = useQuery({
    queryKey: ['elite-pending-message-preview'],
    queryFn: () => base44.entities.PendingMessage.filter({ status: 'aguardando_aprovacao' }),
    staleTime: 60000,
  });

  const disconnected = tools.filter(t => ['pendente', 'configuracao_manual', 'parcial'].includes(t.status_conexao));
  const bestScore = scores[0];

  return (
    <div className="rounded-2xl p-4 bg-gradient-to-br from-orange-500/15 to-yellow-500/5 border-2 border-orange-500/40 shadow-xl space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black text-orange-300 uppercase tracking-widest">Plano Elite ativo</p>
          <h2 className="text-lg font-black text-white">Central Elite · Fase I</h2>
        </div>
        <ShieldCheck className="w-7 h-7 text-orange-300" />
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-xl p-3 bg-black/35 border border-orange-500/25"><Flame className="w-4 h-4 text-orange-300 mb-1" />Oportunidades quentes<br /><b>{hotCount}</b></div>
        <div className="rounded-xl p-3 bg-black/35 border border-cyan-500/25">Visitas de hoje<br /><b>{visitsCount}</b></div>
        <div className="rounded-xl p-3 bg-black/35 border border-rose-500/25">Clientes inativos<br /><b>{inactiveCount}</b></div>
        <div className="rounded-xl p-3 bg-black/35 border border-purple-500/25"><MessageSquare className="w-4 h-4 text-purple-300 mb-1" />Mensagens pendentes<br /><b>{pending.length}</b></div>
      </div>
      <div className="rounded-xl p-3 bg-black/40 border border-yellow-500/30">
        <p className="text-xs text-yellow-300 font-black">Próxima melhor ação</p>
        <p className="text-xs text-yellow-100 mt-1">{bestScore?.proxima_melhor_acao || 'Usar Ranking do Dia para priorizar contato, visita ou proposta.'}</p>
      </div>
      <div className="flex gap-2">
        <Link to="/RankingOportunidades" className="flex-1"><Button size="sm" className="w-full bg-orange-600 hover:bg-orange-500 font-black">Ranking</Button></Link>
        <Link to="/WhatsAppHub" className="flex-1"><Button size="sm" className="w-full bg-purple-600 hover:bg-purple-500 font-black">Aprovar mensagens</Button></Link>
      </div>
      {disconnected.length > 0 && <p className="text-[11px] text-orange-200 flex gap-1"><PlugZap className="w-3 h-3" />{disconnected.length} ferramenta(s) aguardando conexão/configuração.</p>}
    </div>
  );
}
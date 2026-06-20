import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Flame, MessageSquare, PlugZap, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function PlanoEliteStatus() {
  const qc = useQueryClient();
  const { data: scores = [] } = useQuery({ queryKey: ['elite-lead-score-preview'], queryFn: () => base44.entities.EliteLeadScore.list('-elite_score', 50), staleTime: 60000 });
  const { data: tools = [] } = useQuery({ queryKey: ['elite-tool-connection-preview'], queryFn: () => base44.entities.EliteToolConnection.list('-prioridade_rank', 50), staleTime: 300000 });
  const { data: pendingMessages = [] } = useQuery({ queryKey: ['elite-pending-message-preview'], queryFn: () => base44.entities.PendingMessage.list('-created_date', 50), staleTime: 60000 });
  const activate = useMutation({ mutationFn: () => base44.functions.invoke('activateEliteScore', {}), onSuccess: (res) => { qc.invalidateQueries({ queryKey: ['elite-lead-score-preview'] }); toast.success(`Score Elite ativado: ${res.data?.total_analisado || 0} analisados`); } });

  const pending = pendingMessages.filter(m => ['pending', 'aguardando_aprovacao', 'ready_to_send', 'rascunho'].includes(m.status));
  const disconnected = tools.filter(t => ['pendente', 'configuracao_manual', 'parcial'].includes(t.status_conexao));
  const hot = scores.filter(s => s.classificacao_score === 'quente');
  const immediate = scores.filter(s => s.classificacao_score === 'fechamento_imediato');
  const priorityVisits = scores.filter(s => (s.prioridade_visita || 0) >= 75);
  const inactivePotential = scores.filter(s => (s.dias_sem_compra || 0) > 60 && (s.elite_score || 0) >= 51);
  const totalValue = scores.reduce((sum, s) => sum + (s.valor_estimado || 0), 0);
  const bestScore = scores[0];

  return <div className="rounded-2xl p-4 bg-gradient-to-br from-orange-500/15 to-yellow-500/5 border-2 border-orange-500/40 shadow-xl space-y-3">
    <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-black text-orange-300 uppercase tracking-widest">Plano Elite ativo</p><h2 className="text-lg font-black text-white">Central Elite · Fase II</h2></div><ShieldCheck className="w-7 h-7 text-orange-300" /></div>
    {scores.length === 0 ? <div className="rounded-xl p-4 bg-black/40 border border-yellow-500/30 text-center"><p className="text-sm text-yellow-100 mb-3">Score Elite ainda não calculado. Clique em Ativar Score Elite.</p><Button onClick={() => activate.mutate()} disabled={activate.isPending} className="w-full bg-orange-600 hover:bg-orange-500 font-black">{activate.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}Ativar Score Elite</Button></div> : <>
      <div className="grid grid-cols-2 gap-2 text-xs"><Metric icon={<Flame className="w-4 h-4 text-orange-300 mb-1" />} label="Oportunidades quentes" value={hot.length} /><Metric label="Fechamento imediato" value={immediate.length} /><Metric label="Visitas prioritárias" value={priorityVisits.length} /><Metric icon={<MessageSquare className="w-4 h-4 text-purple-300 mb-1" />} label="Mensagens pendentes" value={pending.length} /><Metric label="Inativos com potencial" value={inactivePotential.length} /><Metric label="Valor potencial" value={`R$ ${(totalValue / 1000).toFixed(0)}k`} /></div>
      <div className="rounded-xl p-3 bg-black/40 border border-yellow-500/30"><p className="text-xs text-yellow-300 font-black">Próxima melhor ação</p><p className="text-xs text-yellow-100 mt-1">{bestScore?.proxima_melhor_acao || 'Sem ação calculada'} · {bestScore?.produto_recomendado || ''}</p></div>
      <div className="rounded-xl p-3 bg-black/30 border border-orange-500/20"><p className="text-[10px] text-orange-300 font-black uppercase mb-2">Top 5 oportunidades do dia</p>{scores.slice(0,5).map(s => <div key={s.id} className="flex justify-between text-xs py-1 border-b border-orange-500/10 last:border-0"><span className="text-orange-100 truncate">{s.cidade || s.produto_recomendado || 'Oportunidade'}</span><b className="text-orange-300">{s.elite_score}</b></div>)}</div>
      <div className="flex gap-2"><Button onClick={() => activate.mutate()} disabled={activate.isPending} size="sm" className="flex-1 bg-orange-600 hover:bg-orange-500 font-black">{activate.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ativar Score Elite'}</Button><Link to="/ScoreElite" className="flex-1"><Button size="sm" className="w-full bg-yellow-600 hover:bg-yellow-500 font-black">Ver ranking</Button></Link></div>
    </>}
    <div className="flex gap-2"><Link to="/WhatsAppHub" className="flex-1"><Button size="sm" className="w-full bg-purple-600 hover:bg-purple-500 font-black">Aprovar mensagens</Button></Link></div>
    {disconnected.length > 0 && <p className="text-[11px] text-orange-200 flex gap-1"><PlugZap className="w-3 h-3" />{disconnected.length} ferramenta(s) aguardando conexão/configuração.</p>}
  </div>;
}
function Metric({ label, value, icon }) { return <div className="rounded-xl p-3 bg-black/35 border border-orange-500/25">{icon}<span>{label}</span><br /><b>{value}</b></div>; }
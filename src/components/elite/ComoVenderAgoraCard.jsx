import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { calcularEliteScore, calcularProximaMelhorAcao, formatCurrencyBRL } from '@/lib/EliteScoreEngine';
import { MessageSquare, FileText, Calendar, Loader2, Target } from 'lucide-react';
import { toast } from 'sonner';

export default function ComoVenderAgoraCard({ target, type = 'cliente' }) {
  const qc = useQueryClient();
  const [loading, setLoading] = useState(false);
  const scoreQuery = type === 'lead' ? { lead_id: target?.id } : { cliente_id: target?.id };
  const { data: stored = [] } = useQuery({ queryKey: ['elite-score-target', type, target?.id], queryFn: () => base44.entities.EliteLeadScore.filter(scoreQuery), enabled: !!target?.id, staleTime: 60000 });
  const score = stored[0] || calcularEliteScore({ pessoa: target || {}, tipo: type });
  const action = useMemo(() => calcularProximaMelhorAcao({ pessoa: target || {}, score }), [target, score]);
  const waMessage = action.mensagem_sugerida;
  const phone = target?.phone || target?.recipient_phone || '';

  const createPending = async () => {
    setLoading(true);
    const payload = type === 'lead' ? { lead_id: target.id } : { cliente_id: target.id };
    const res = await base44.functions.invoke('gerarMensagemElite', { ...payload, score_id: stored[0]?.id });
    await qc.invalidateQueries({ queryKey: ['elite-score-target', type, target?.id] });
    toast.success(`Mensagem criada para aprovação: ${res.data?.status || 'aguardando_aprovacao'}`);
    setLoading(false);
  };

  const openWhatsApp = () => {
    if (!phone) { toast.error('Sem WhatsApp cadastrado'); return; }
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(waMessage)}`, '_blank', 'noopener,noreferrer');
    toast.info('WhatsApp aberto manualmente; envie somente após aprovação do Nathan.');
  };

  return <div className="rounded-2xl p-4 bg-gradient-to-br from-orange-500/10 to-black border border-orange-500/30 space-y-3">
    <div className="flex items-center justify-between"><div><p className="text-[10px] font-black text-orange-400 uppercase tracking-widest">Como vender agora?</p><h3 className="text-lg font-black text-white">Plano Elite</h3></div><Target className="w-6 h-6 text-orange-300" /></div>
    <div className="grid grid-cols-2 gap-2 text-xs"><Metric label="Chance" value={`${score.chance_fechamento || 0}%`} /><Metric label="Score" value={score.classificacao_score || '—'} /><Metric label="Produto" value={score.produto_recomendado || '—'} /><Metric label="Valor" value={formatCurrencyBRL(score.valor_estimado)} /></div>
    <Info label="Dor provável" value={target?.main_pains?.[0] || 'Tempo de resultado, custo de terceirização e perda de autonomia.'} />
    <Info label="Argumento principal" value={`Use ${score.produto_recomendado || 'Seamaty'} para vender autonomia, velocidade de exame e ROI.`} />
    <Info label="Objeção provável" value={action.objecao_provavel} />
    <Info label="Resposta pronta" value={action.resposta_da_objecao} />
    <Info label="Próxima melhor ação" value={`${action.proxima_melhor_acao} — ${action.motivo}`} />
    <Info label="Risco se não agir" value={action.risco_se_nao_agir} />
    <textarea readOnly value={waMessage} className="w-full min-h-24 rounded-xl p-3 text-xs bg-black/40 border border-orange-500/20 text-orange-50" />
    <div className="grid grid-cols-2 gap-2"><Button size="sm" onClick={() => navigator.clipboard.writeText(waMessage).then(() => toast.success('Mensagem copiada'))}>Gerar mensagem</Button><Button size="sm" disabled={loading} onClick={createPending}>{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Criar PendingMessage'}</Button><Button size="sm" variant="outline" onClick={openWhatsApp}><MessageSquare className="w-4 h-4 mr-1" />Abrir WhatsApp</Button><Link to={`/ProposalGenerator?client_id=${target?.id || ''}`}><Button size="sm" variant="outline" className="w-full"><FileText className="w-4 h-4 mr-1" />Criar proposta</Button></Link><Link to={`/VisitManager?client_id=${target?.id || ''}`} className="col-span-2"><Button size="sm" variant="outline" className="w-full"><Calendar className="w-4 h-4 mr-1" />Agendar visita</Button></Link></div>
    <p className="text-[10px] text-orange-200">Segurança: nenhuma mensagem é enviada automaticamente; tudo passa por aprovação manual.</p>
  </div>;
}

function Metric({ label, value }) { return <div className="rounded-xl p-2 bg-black/35 border border-orange-500/15"><p className="text-[10px] text-orange-300">{label}</p><p className="font-black text-white truncate">{value}</p></div>; }
function Info({ label, value }) { return <div><p className="text-[10px] text-orange-300 font-black uppercase">{label}</p><p className="text-xs text-orange-50 leading-relaxed">{value}</p></div>; }
import React, { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { useMutation } from '@tanstack/react-query';
import { Trophy, Zap, Loader2, MessageSquare, UserRound, CheckCircle, ChevronRight, Target } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const PRIORITY_STYLES = {
  'urgente': { bg: 'bg-red-500/10 border-red-500/40', badge: 'bg-red-500/20 text-red-300', label: '🔴 Alta' },
  'quente':  { bg: 'bg-orange-500/10 border-orange-500/40', badge: 'bg-orange-500/20 text-orange-300', label: '🔥 Quente' },
  'potencial':{ bg: 'bg-blue-500/10 border-blue-500/35', badge: 'bg-blue-500/20 text-blue-300', label: '💡 Potencial' },
  'frio':    { bg: 'bg-slate-800/60 border-slate-700/40', badge: 'bg-slate-700/40 text-slate-400', label: '❄️ Frio' },
};

// Linguagem segura — nunca mostrar termos sensíveis em tela
const SAFE_ACTION_TYPE = {
  'venda_equipamento': { label: '🔬 Equipamento', cls: 'bg-amber-600/20 text-amber-300' },
  'reposicao_insumo':  { label: '📦 Insumo', cls: 'bg-green-600/20 text-green-300' },
  'follow_up':         { label: '📞 Retomar contato', cls: 'bg-blue-600/20 text-blue-300' },
  'reativacao':        { label: '🔄 Reengajar', cls: 'bg-purple-600/20 text-purple-300' },
};

function normalizeWhatsAppPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';
  return digits.startsWith('55') ? digits : `55${digits}`;
}

export default function RankingDoDia() {
  const [loading, setLoading] = useState(false);
  const [ranking, setRanking] = useState(null);
  const autoLoaded = useRef(false);

  // Gerar ranking
  const computeRanking = useMutation({
    mutationFn: async () => {
      setLoading(true);
      toast.info('🧠 Processando ranking...');

      const result = await base44.functions.invoke('calculateRankingDoDia', {});

      return result.data;
    },
    onSuccess: (data) => {
      setRanking(data);
      setLoading(false);
      toast.success('✅ Ranking gerado!');
    },
    onError: (err) => {
      toast.error('Erro: ' + err.message);
      setLoading(false);
    }
  });

  const handleGenerateRanking = () => {
    computeRanking.mutate();
  };

  // Ranking NÃO dispara automaticamente — apenas quando o usuário clicar
  // useEffect removido para não consumir IA/créditos sem demanda explícita

  if (!ranking) {
    return (
      <div className="rounded-2xl bg-[#0d0d0d] border border-orange-500/25 overflow-hidden">
        <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(255,107,0,0.15)' }}>
          <Trophy className="w-4 h-4 text-orange-400" />
          <span className="text-sm font-black text-orange-400">RANKING DO DIA</span>
        </div>
        <div className="text-center py-8 px-4">
          <p className="text-xs text-slate-500 mb-4">Top oportunidades por receita esperada</p>
          <button
            onClick={handleGenerateRanking}
            disabled={loading}
            className="flex items-center gap-2 mx-auto px-5 py-2.5 rounded-xl font-black text-sm bg-orange-500/15 text-orange-300 border border-orange-500/35 hover:bg-orange-500/25 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            Gerar Ranking
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-[#0d0d0d] border border-orange-500/25 overflow-hidden">
      {/* HEADER */}
      <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,107,0,0.15)' }}>
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-orange-400" />
          <span className="text-sm font-black text-orange-400">RANKING DO DIA</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-300 font-bold">{ranking.priorities?.length || 0}</span>
        </div>
        <button onClick={handleGenerateRanking} disabled={loading}
          className="text-[10px] font-bold text-slate-500 hover:text-orange-400 flex items-center gap-1 transition-colors">
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : '🔄'} Atualizar
        </button>
      </div>

      {/* RESUMO */}
      <div className="grid grid-cols-4 gap-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        {[
          { label: 'Alta', val: ranking.summary?.urgente || 0, color: 'text-red-400' },
          { label: 'Quente', val: ranking.summary?.quente || 0, color: 'text-orange-400' },
          { label: 'Potencial', val: ranking.summary?.potencial || 0, color: 'text-blue-400' },
          { label: 'Insumo', val: ranking.summary?.consumables || 0, color: 'text-green-400' },
        ].map(({ label, val, color }) => (
          <div key={label} className="py-2 text-center" style={{ borderRight: '1px solid rgba(255,255,255,0.04)' }}>
            <p className={`text-lg font-black ${color}`}>{val}</p>
            <p className="text-[9px] text-slate-600 uppercase">{label}</p>
          </div>
        ))}
      </div>

      {/* TOP 10 */}
      <div className="divide-y divide-white/5 max-h-[520px] overflow-y-auto">
        {ranking.priorities?.map((item, idx) => {
          const styles = PRIORITY_STYLES[item.priority] || PRIORITY_STYLES.frio;
          const actionInfo = SAFE_ACTION_TYPE[item.action_type];
          const waUrl = item.phone ? `https://wa.me/${normalizeWhatsAppPhone(item.phone)}` : null;
          return (
            <div key={idx} className={`p-3 border-l-2 ${styles.bg}`}>
              {/* Linha 1: rank + nome + score */}
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black bg-orange-500/20 text-orange-300 shrink-0">{idx + 1}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-white truncate">{item.name}</p>
                  <p className="text-[10px] text-slate-500">{item.city}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-black text-orange-300">{item.score}%</p>
                  {item.potential_value > 0 && (
                    <p className="text-[9px] text-green-400">R$ {item.potential_value.toLocaleString('pt-BR')}</p>
                  )}
                </div>
              </div>

              {/* Linha 2: tipo + ação segura */}
              <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                {actionInfo && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${actionInfo.cls}`}>{actionInfo.label}</span>
                )}
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${styles.badge}`}>{styles.label}</span>
              </div>

              {/* Próxima ação — linguagem segura */}
              <p className="text-[11px] text-slate-300 mb-2">
                <span className="text-orange-400 font-bold">Próxima ação: </span>
                {item.action_description}
              </p>

              {/* Botões padronizados */}
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => { window.location.href = `/ClienteDetalhe360?id=${encodeURIComponent(item.id)}`; }}
                  className="py-2 rounded-lg text-[10px] font-black text-orange-300 bg-orange-500/12 border border-orange-500/25 flex items-center justify-center gap-1"
                >
                  <Target className="w-3 h-3" /> Ver 360°
                </button>
                {waUrl ? (
                  <a href={waUrl} target="_blank" rel="noopener noreferrer"
                    className="py-2 rounded-lg text-[10px] font-black text-center text-green-300 bg-green-500/12 border border-green-500/25 flex items-center justify-center gap-1">
                    <MessageSquare className="w-3 h-3" /> WhatsApp
                  </a>
                ) : (
                  <span className="py-2 rounded-lg text-[10px] text-center text-slate-600 bg-slate-800/30 border border-slate-700/30">Sem WA</span>
                )}
                <button
                  onClick={() => { window.location.href = `/ClientProfile?id=${encodeURIComponent(item.id)}`; }}
                  className="py-2 rounded-lg text-[10px] font-black text-slate-300 bg-white/5 border border-white/10 flex items-center justify-center gap-1"
                >
                  <ChevronRight className="w-3 h-3" /> Perfil
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* INSIGHTS — linguagem interna segura */}
      {ranking.insights?.length > 0 && (
        <div className="px-4 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
          <p className="text-[10px] font-black text-slate-500 uppercase mb-1.5">Pontos de Atenção</p>
          {ranking.insights.map((insight, i) => (
            <p key={i} className="text-[11px] text-slate-400">• {insight}</p>
          ))}
        </div>
      )}
    </div>
  );
}
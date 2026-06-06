import React, { useState } from 'react';
import { buildWhatsAppUrl, isValidWhatsApp } from '@/utils/phoneUtils';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { MessageSquare, Target, Phone, ChevronRight, CheckCircle, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

function getScore(c) {
  let s = c.purchase_score || c.health_score || 0;
  if (c.status === 'quente') s += 30;
  if (c.status === 'morno') s += 10;
  if (c.pipeline_stage === 'negociacao') s += 20;
  if (c.pipeline_stage === 'proposta') s += 10;
  const dias = c.last_contact_date
    ? Math.floor((Date.now() - new Date(c.last_contact_date)) / 86400000)
    : 99;
  if (dias <= 3) s += 10;
  if (dias > 14) s -= 10;
  return Math.min(100, Math.max(0, s));
}

const TODAY_TYPE = (() => {
  const d = new Date().getDay(); // 0=Dom, 5=Sex, 6=Sab
  if (d === 5) return 'sexta';
  if (d === 0 || d === 6) return 'fds';
  return 'util';
})();

const DAY_LABELS = { util: '🎯 Seg–Qui: VISITAS & CONTATOS', sexta: '🧹 Sexta: Follow-up & Limpeza', fds: '😴 Fim de Semana — Descanse!' };

export default function SniperDoDia() {
  const [done, setDone] = useState({});
  const [expanded, setExpanded] = useState(true);

  const { data: clients = [] } = useQuery({
    queryKey: ['sniper-clients'],
    queryFn: () => base44.entities.Client.list('-updated_date', 200),
    staleTime: 60000,
  });

  const top10 = [...clients]
    .map(c => ({ ...c, _score: getScore(c) }))
    .filter(c => c.phone || c.email)
    .sort((a, b) => b._score - a._score)
    .slice(0, 10);

  const doneCount = Object.values(done).filter(Boolean).length;

  return (
    <div className="rounded-2xl mb-4 overflow-hidden" style={{ background: '#0d0d0d', border: '1px solid rgba(255,107,0,0.35)' }}>
      {/* Header */}
      <button
        onClick={() => setExpanded(p => !p)}
        className="w-full flex items-center justify-between px-4 py-3"
        style={{ background: 'linear-gradient(90deg, #1a0800, #0a0000)' }}
      >
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-orange-400" />
          <span className="text-sm font-black text-orange-400">SNIPER DO DIA — TOP 10</span>
          <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: 'rgba(255,107,0,0.2)', color: '#ff9500' }}>
            {doneCount}/10 feitos
          </span>
        </div>
        <ChevronRight className={`w-4 h-4 text-orange-400 transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </button>

      {/* Subtítulo dia */}
      <div className="px-4 py-1.5" style={{ background: '#111', borderBottom: '1px solid rgba(255,107,0,0.15)' }}>
        <p className="text-xs font-bold text-orange-600">{DAY_LABELS[TODAY_TYPE]}</p>
      </div>

      {expanded && (
        <div className="divide-y" style={{ borderColor: 'rgba(255,107,0,0.08)' }}>
          {top10.length === 0 && (
            <div className="px-4 py-6 text-center text-xs text-gray-500">Nenhum cliente com contato cadastrado.</div>
          )}
          {top10.map((c, i) => {
            const isDone = done[c.id];
            const whatsUrl = c.phone && isValidWhatsApp(c.phone) ? buildWhatsAppUrl(c.phone) : null;
            return (
              <div key={c.id} className="px-4 py-3 flex items-center gap-3" style={{ background: isDone ? 'rgba(0,255,136,0.03)' : 'transparent', opacity: isDone ? 0.5 : 1 }}>
                {/* Rank */}
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                  style={{ background: i < 3 ? 'rgba(255,107,0,0.3)' : '#1a1a1a', color: i < 3 ? '#ff6b00' : '#666' }}>
                  {i + 1}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-white truncate">{c.first_name} {c.full_name?.split(' ').slice(-1)[0] || ''}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <p className="text-xs truncate" style={{ color: '#ff9500' }}>{c.clinic_name || c.city || '—'}</p>
                    {c.pipeline_stage === 'negociacao' && <span className="text-[8px] px-1 rounded font-bold shrink-0" style={{ background: 'rgba(239,68,68,0.2)', color: '#ef4444' }}>NEGOC.</span>}
                    {c.pipeline_stage === 'proposta' && <span className="text-[8px] px-1 rounded font-bold shrink-0" style={{ background: 'rgba(245,158,11,0.2)', color: '#f59e0b' }}>PROP.</span>}
                    {c.pipeline_stage === 'fechado' && <span className="text-[8px] px-1 rounded font-bold shrink-0" style={{ background: 'rgba(0,200,81,0.2)', color: '#00c851' }}>FECHADO</span>}
                  </div>
                </div>

                {/* Score */}
                <div className="text-center flex-shrink-0">
                  <p className="text-xs font-black" style={{ color: c._score >= 70 ? '#ef4444' : c._score >= 40 ? '#f59e0b' : '#6b7280' }}>{c._score}</p>
                  <p className="text-[9px] text-gray-600">score</p>
                </div>

                {/* Ações */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {whatsUrl && (
                    <a href={whatsUrl} target="_blank" rel="noopener noreferrer">
                      <button className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,200,81,0.15)', border: '1px solid rgba(0,200,81,0.3)' }}>
                        <MessageSquare className="w-3.5 h-3.5 text-green-400" />
                      </button>
                    </a>
                  )}
                  <Link to={`${createPageUrl('ClientProfile')}?id=${c.id}`}>
                    <button className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,107,0,0.12)', border: '1px solid rgba(255,107,0,0.25)' }}>
                      <ChevronRight className="w-3.5 h-3.5 text-orange-400" />
                    </button>
                  </Link>
                  <button
                    onClick={() => setDone(p => ({ ...p, [c.id]: !p[c.id] }))}
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                    style={{ background: isDone ? 'rgba(0,255,136,0.2)' : '#1a1a1a', border: `1px solid ${isDone ? 'rgba(0,255,136,0.4)' : '#333'}` }}
                  >
                    <CheckCircle className="w-3.5 h-3.5" style={{ color: isDone ? '#00ff88' : '#444' }} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Progresso */}
      {expanded && top10.length > 0 && (
        <div className="px-4 py-2" style={{ background: '#0a0a0a', borderTop: '1px solid rgba(255,107,0,0.1)' }}>
          <div className="w-full h-1.5 rounded-full" style={{ background: '#1a1a1a' }}>
            <div className="h-1.5 rounded-full transition-all" style={{ width: `${(doneCount / 10) * 100}%`, background: 'linear-gradient(90deg, #00c851, #00ff88)' }} />
          </div>
          <p className="text-xs text-center mt-1" style={{ color: '#555' }}>{doneCount === 10 ? '🏆 Meta do dia batida!' : `${10 - doneCount} contatos restantes`}</p>
        </div>
      )}
    </div>
  );
}
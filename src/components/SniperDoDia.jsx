import React, { useState } from 'react';
import { buildWhatsAppUrl, isValidWhatsApp } from '@/utils/phoneUtils';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { MessageSquare, Target, ChevronRight, CheckCircle, MapPin, Phone, CalendarPlus, ShieldAlert } from 'lucide-react';

const CACHE_KEY = 'nr22888_sniper_cache_v2';
const CACHE_MS = 5 * 60 * 1000;

function readCache() {
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
    if (cached?.created_at && Date.now() - cached.created_at < CACHE_MS) return cached.items || [];
  } catch (_e) {}
  return null;
}

function writeCache(items) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ created_at: Date.now(), items })); } catch (_e) {}
}

function matchCompetitor(client, competitors) {
  const city = String(client?.city || '').toLowerCase();
  const equipment = String(client?.current_equipment || client?.equipment_interest || '').toLowerCase();
  return competitors.find(c =>
    (city && String(c.cidade || '').toLowerCase() === city) ||
    (equipment && String(c.marca_concorrente || '').toLowerCase() && equipment.includes(String(c.marca_concorrente).toLowerCase()))
  );
}

const TODAY_TYPE = (() => {
  const d = new Date().getDay();
  if (d === 5) return 'sexta';
  if (d === 0 || d === 6) return 'fds';
  return 'util';
})();

const DAY_LABELS = { util: '🎯 Seg–Qui: VISITAS & CONTATOS', sexta: '🧹 Sexta: Follow-up & Limpeza', fds: '😴 Fim de Semana — Descanse!' };

export default function SniperDoDia() {
  const [done, setDone] = useState({});
  const [expanded, setExpanded] = useState(true);

  const { data: items = [] } = useQuery({
    queryKey: ['sniper-rua-v2'],
    staleTime: CACHE_MS,
    queryFn: async () => {
      const cached = readCache();
      if (cached) return cached;

      const [scores, competitors] = await Promise.all([
        base44.entities.EliteLeadScore.list('-elite_score', 12).catch(() => []),
        base44.entities.CompetitorTracker.filter({ ativo: true }, '-ultima_investigacao', 20).catch(() => []),
      ]);

      let clients = [];
      if (scores.length > 0) {
        const uniqueIds = [...new Set(scores.map(s => s.cliente_id).filter(Boolean))].slice(0, 10);
        clients = (await Promise.all(uniqueIds.map(id => base44.entities.Client.get(id).catch(() => null)))).filter(Boolean);
      }

      if (clients.length === 0) {
        clients = await base44.entities.Client.list('-purchase_score', 50).catch(() => []);
      }

      const mapped = clients.slice(0, 10).map((client, index) => {
        const score = scores.find(s => s.cliente_id === client.id);
        const competitor = matchCompetitor(client, competitors);
        return {
          id: client.id,
          rank: index + 1,
          name: client.clinic_name || client.first_name || client.full_name || 'Cliente',
          city: client.city || 'Sem cidade',
          phone: client.phone || '',
          score: score?.elite_score || client.purchase_score || client.health_score || 0,
          reason: score?.motivo_score || client.next_action || client.pipeline_stage || 'Prioridade comercial',
          nextAction: score?.proxima_melhor_acao || client.next_action || 'Abrir conversa comercial',
          equipment: score?.produto_recomendado || client.equipment_interest || client.current_equipment || '',
          competitorName: competitor?.nome || '',
          competitorArgument: competitor?.argumento_contra || competitor?.oportunidade_detectada || '',
        };
      });

      writeCache(mapped);
      return mapped;
    },
  });

  const doneCount = Object.values(done).filter(Boolean).length;
  const progressBase = Math.max(items.length, 1);

  return (
    <div className="rounded-2xl mb-4 overflow-hidden bg-[#0d0d0d] border border-orange-500/35">
      <button onClick={() => setExpanded(p => !p)} className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-[#1a0800] to-[#0a0000]">
        <div className="flex items-center gap-2 min-w-0">
          <Target className="w-4 h-4 text-orange-400 shrink-0" />
          <span className="text-sm font-black text-orange-400 truncate">SNIPER DO DIA — MODO RUA</span>
          <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-orange-500/20 text-orange-300">{doneCount}/{items.length || 10}</span>
        </div>
        <ChevronRight className={`w-4 h-4 text-orange-400 transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </button>

      <div className="px-4 py-1.5 bg-[#111] border-b border-orange-500/15">
        <p className="text-xs font-bold text-orange-600">{DAY_LABELS[TODAY_TYPE]} · cache 5 min</p>
      </div>

      {expanded && (
        <div className="divide-y divide-orange-500/10">
          {items.length === 0 && <div className="px-4 py-6 text-center text-xs text-gray-500">Nenhuma oportunidade carregada.</div>}
          {items.map((item) => {
            const isDone = done[item.id];
            const whatsUrl = item.phone && isValidWhatsApp(item.phone) ? buildWhatsAppUrl(item.phone) : null;
            return (
              <div key={item.id} className="px-4 py-3 space-y-2" style={{ background: isDone ? 'rgba(0,255,136,0.03)' : 'transparent', opacity: isDone ? 0.58 : 1 }}>
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 bg-orange-500/25 text-orange-300">{item.rank}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-white truncate">{item.name}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-orange-300">
                      <MapPin className="w-3 h-3" /> <span className="truncate">{item.city}</span>
                      {item.phone && <><Phone className="w-3 h-3" /><span>WhatsApp</span></>}
                    </div>
                  </div>
                  <div className="text-center shrink-0">
                    <p className="text-sm font-black text-red-300">{Math.round(item.score || 0)}</p>
                    <p className="text-[9px] text-gray-600">score</p>
                  </div>
                </div>

                <div className="rounded-xl p-2 bg-white/5 border border-white/10">
                  <p className="text-[11px] text-slate-300"><b className="text-orange-300">Motivo:</b> {item.reason}</p>
                  <p className="text-[11px] text-slate-300"><b className="text-emerald-300">Próxima ação:</b> {item.nextAction}</p>
                  {item.equipment && <p className="text-[11px] text-slate-300"><b className="text-cyan-300">Oportunidade:</b> {item.equipment}</p>}
                  {item.competitorName && (
                    <p className="mt-1 text-[11px] text-red-200 flex gap-1"><ShieldAlert className="w-3.5 h-3.5 shrink-0 text-red-300" /> Concorrente detectado: {item.competitorName}. {item.competitorArgument}</p>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-1.5">
                  {whatsUrl ? (
                    <a href={whatsUrl} target="_blank" rel="noopener noreferrer" className="rounded-lg py-2 text-[10px] font-black text-center bg-green-500/15 text-green-300 border border-green-500/30 flex items-center justify-center gap-1"><MessageSquare className="w-3 h-3" /> WhatsApp manual</a>
                  ) : <span className="rounded-lg py-2 text-[10px] font-black text-center bg-slate-700/30 text-slate-500 border border-slate-700">Sem WhatsApp</span>}
                  <Link to={`/ClienteDetalhe360?id=${item.id}`} className="rounded-lg py-2 text-[10px] font-black text-center bg-orange-500/15 text-orange-300 border border-orange-500/30">Ver resumo</Link>
                  <Link to={`/VisitManager?client_id=${item.id}`} className="rounded-lg py-2 text-[10px] font-black text-center bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 flex items-center justify-center gap-1"><CalendarPlus className="w-3 h-3" /> Visita</Link>
                  <button onClick={() => setDone(p => ({ ...p, [item.id]: !p[item.id] }))} className="rounded-lg py-2 text-[10px] font-black bg-white/5 text-slate-300 border border-white/10 flex items-center justify-center gap-1"><CheckCircle className="w-3 h-3" /> Feito</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {expanded && items.length > 0 && (
        <div className="px-4 py-2 bg-[#0a0a0a] border-t border-orange-500/10">
          <div className="w-full h-1.5 rounded-full bg-[#1a1a1a]"><div className="h-1.5 rounded-full transition-all bg-gradient-to-r from-emerald-500 to-green-300" style={{ width: `${Math.min(100, (doneCount / progressBase) * 100)}%` }} /></div>
          <p className="text-xs text-center mt-1 text-gray-600">{doneCount >= items.length ? 'Meta do dia batida' : `${Math.max(0, items.length - doneCount)} ações restantes`}</p>
        </div>
      )}
    </div>
  );
}
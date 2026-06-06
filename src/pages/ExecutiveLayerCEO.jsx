import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Zap, TrendingUp, MapPin, Target, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ExecutiveLayerCEO() {
  const [modoAtaque, setModoAtaque] = useState(false);

  const { data: comando = {}, isLoading: loadingComando } = useQuery({
    queryKey: ['comando-do-dia'],
    queryFn: () => base44.functions.invoke('gerarComandoDoDia', {}).then(r => r?.data || {}),
    staleTime: 60 * 60 * 1000,
    refetchInterval: 60 * 60 * 1000,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients-for-ceo'],
    queryFn: () => base44.entities.Client.list('-purchase_score', 100),
  });

  // Calcular stats
  const metaDoMes = comando.metaDoMes || { equipamentos_alvo: 5, receita_alvo: 100000 };
  const topEquipamentos = comando.topEquipamentos || [];
  const topComodatos = comando.topComodatos || [];
  const topRecorrencias = comando.topRecorrencias || [];
  const topEmRisco = comando.topEmRisco || [];
  const topFechamentos = comando.topFechamentos || [];

  const totalReceita = topFechamentos.reduce((a, f) => a + (f.receita_prevista || 0), 0);
  const gapMeta = metaDoMes.receita_alvo - totalReceita;

  return (
    <div className="min-h-screen pb-32" style={{ background: '#0a0a0a' }}>
      {/* HEADER EXECUTIVO */}
      <div className="px-4 pt-5 pb-4 sticky top-0 z-40" style={{ background: '#0f0f0f', borderBottom: '2px solid rgba(255,107,0,0.3)' }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white">👑 MODO CEO</h1>
            <p className="text-[11px] text-orange-500 font-bold uppercase tracking-widest">Camada Executiva Suprema</p>
          </div>
          <button
            onClick={() => setModoAtaque(!modoAtaque)}
            className="px-4 py-2 rounded-lg font-black text-white flex items-center gap-2"
            style={{
              background: modoAtaque ? 'rgba(255,68,68,0.2)' : 'rgba(0,255,136,0.2)',
              border: modoAtaque ? '2px solid #ff4444' : '2px solid #00ff88',
              color: modoAtaque ? '#ff4444' : '#00ff88'
            }}>
            {modoAtaque ? '🔴 MODO ATAQUE' : '🟢 MODO NORMAL'}
          </button>
        </div>
      </div>

      <div className="px-4">
        {/* KPI EXECUTIVOS */}
        <div className="grid grid-cols-3 gap-2 mb-4 mt-4">
          <div className="rounded-xl p-3" style={{ background: '#141414', border: '1px solid rgba(255,107,0,0.2)' }}>
            <p className="text-[10px] text-orange-500 font-bold uppercase tracking-widest mb-1">Receita Prevista</p>
            <p className="text-lg font-black text-white">
              R$ {(totalReceita / 1000).toFixed(0)}k
            </p>
            <p className="text-[10px] text-red-500 mt-1">Gap: R$ {(gapMeta / 1000).toFixed(0)}k</p>
          </div>

          <div className="rounded-xl p-3" style={{ background: '#141414', border: '1px solid rgba(0,255,136,0.2)' }}>
            <p className="text-[10px] text-green-500 font-bold uppercase tracking-widest mb-1">Equipamentos</p>
            <p className="text-lg font-black text-white">{topEquipamentos.length}</p>
            <p className="text-[10px] text-slate-500 mt-1">Meta: {metaDoMes.equipamentos_alvo}</p>
          </div>

          <div className="rounded-xl p-3" style={{ background: '#141414', border: '1px solid rgba(0,191,255,0.2)' }}>
            <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mb-1">Fechamentos</p>
            <p className="text-lg font-black text-white">{topFechamentos.length}</p>
            <p className="text-[10px] text-slate-500 mt-1">Em negociação</p>
          </div>
        </div>

        {/* BOTÃO ÚNICO DE ATAQUE */}
        <Link to="/ModoInvestigativoSupremo">
          <button
            className="w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-3 mb-4"
            style={{
              background: 'linear-gradient(135deg, rgba(255,107,0,0.3) 0%, rgba(255,68,68,0.2) 100%)',
              border: '2px solid #ff6b00',
              color: '#ff6b00'
            }}>
            <Zap className="w-6 h-6" />
            🎯 ATACAR OPORTUNIDADES
            <ArrowRight className="w-5 h-5" />
          </button>
        </Link>

        {/* MODO ATAQUE — VISÃO ULTRA FOCADA */}
        {modoAtaque && (
          <div className="mb-4 space-y-3">
            {/* TOP EQUIPAMENTOS */}
            {topEquipamentos.length > 0 && (
              <div className="rounded-xl p-3" style={{ background: '#1a0500', border: '1px solid rgba(255,107,0,0.3)' }}>
                <p className="text-xs font-black text-orange-400 uppercase tracking-widest mb-2">🔥 TOP EQUIPAMENTOS</p>
                {topEquipamentos.slice(0, 3).map((eq, i) => (
                  <div key={i} className="flex items-center justify-between py-1 border-b border-slate-900 last:border-0">
                    <div>
                      <p className="text-xs font-bold text-white">{eq.name}</p>
                      <p className="text-[10px] text-orange-500">{eq.city}</p>
                    </div>
                    <span className="text-xs font-black px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,107,0,0.2)', color: '#ff6b00' }}>
                      Score {eq.score}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* TOP FECHAMENTOS */}
            {topFechamentos.length > 0 && (
              <div className="rounded-xl p-3" style={{ background: '#001a0f', border: '1px solid rgba(0,255,136,0.3)' }}>
                <p className="text-xs font-black text-green-400 uppercase tracking-widest mb-2">✅ TOP FECHAMENTOS</p>
                {topFechamentos.slice(0, 3).map((f, i) => (
                  <div key={i} className="flex items-center justify-between py-1 border-b border-slate-900 last:border-0">
                    <div>
                      <p className="text-xs font-bold text-white">{f.name}</p>
                      <p className="text-[10px] text-green-500">R$ {(f.receita_prevista / 1000).toFixed(0)}k</p>
                    </div>
                    <Target className="w-4 h-4 text-green-500" />
                  </div>
                ))}
              </div>
            )}

            {/* TOP RECORRÊNCIAS */}
            {topRecorrencias.length > 0 && (
              <div className="rounded-xl p-3" style={{ background: '#0a0a1a', border: '1px solid rgba(0,191,255,0.3)' }}>
                <p className="text-xs font-black text-blue-400 uppercase tracking-widest mb-2">💰 TOP RECORRÊNCIAS</p>
                {topRecorrencias.slice(0, 3).map((r, i) => (
                  <div key={i} className="flex items-center justify-between py-1 border-b border-slate-900 last:border-0">
                    <div>
                      <p className="text-xs font-bold text-white">{r.client}</p>
                      <p className="text-[10px] text-blue-400">{r.consumable}</p>
                    </div>
                    <TrendingUp className="w-4 h-4 text-blue-400" />
                  </div>
                ))}
              </div>
            )}

            {/* TOP EM RISCO */}
            {topEmRisco.length > 0 && (
              <div className="rounded-xl p-3" style={{ background: '#1a0000', border: '1px solid rgba(255,68,68,0.3)' }}>
                <p className="text-xs font-black text-red-400 uppercase tracking-widest mb-2">⚠️ TOP EM RISCO</p>
                {topEmRisco.slice(0, 3).map((r, i) => (
                  <div key={i} className="flex items-center justify-between py-1 border-b border-slate-900 last:border-0">
                    <div>
                      <p className="text-xs font-bold text-white">{r.name}</p>
                      <p className="text-[10px] text-red-400">{r.dias_sem_contato} dias sem contato</p>
                    </div>
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VISÃO NORMAL — TODOS OS TOPS */}
        {!modoAtaque && (
          <div className="space-y-3">
            <div className="rounded-xl p-3" style={{ background: '#111', border: '1px solid rgba(255,107,0,0.15)' }}>
              <p className="text-xs font-bold text-orange-400 mb-2">TOP 10 EQUIPAMENTOS</p>
              <div className="text-[11px] text-slate-400 space-y-1">
                {topEquipamentos.map((e, i) => (
                  <p key={i}>{i + 1}. {e.name} ({e.city})</p>
                ))}
              </div>
            </div>

            <div className="rounded-xl p-3" style={{ background: '#111', border: '1px solid rgba(0,255,136,0.15)' }}>
              <p className="text-xs font-bold text-green-400 mb-2">TOP 10 COMODATOS</p>
              <div className="text-[11px] text-slate-400 space-y-1">
                {topComodatos.map((c, i) => (
                  <p key={i}>{i + 1}. {c.name} ({c.city})</p>
                ))}
              </div>
            </div>

            <div className="rounded-xl p-3" style={{ background: '#111', border: '1px solid rgba(0,191,255,0.15)' }}>
              <p className="text-xs font-bold text-blue-400 mb-2">TOP 10 FECHAMENTOS</p>
              <div className="text-[11px] text-slate-400 space-y-1">
                {topFechamentos.map((f, i) => (
                  <p key={i}>{i + 1}. {f.name} - R$ {(f.receita_prevista / 1000).toFixed(0)}k</p>
                ))}
              </div>
            </div>

            <div className="rounded-xl p-3" style={{ background: '#111', border: '1px solid rgba(255,68,68,0.15)' }}>
              <p className="text-xs font-bold text-red-400 mb-2">TOP 10 EM RISCO</p>
              <div className="text-[11px] text-slate-400 space-y-1">
                {topEmRisco.map((r, i) => (
                  <p key={i}>{i + 1}. {r.name} ({r.dias_sem_contato}d sem contato)</p>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
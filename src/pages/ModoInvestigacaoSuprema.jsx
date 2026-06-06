import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import {
  Search, Brain, Target, DollarSign, Users, ChevronRight,
  Copy, Check, RefreshCw, AlertCircle, TrendingUp, MapPin, Star
} from 'lucide-react';
import { toast } from 'sonner';

export default function ModoInvestigacaoSuprema() {
  const [query, setQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const { data: clients = [] } = useQuery({
    queryKey: ['investigacao-clients'],
    queryFn: () => base44.entities.Client.list('-updated_date', 300),
    staleTime: 5 * 60 * 1000,
  });

  const filtered = clients.filter(c =>
    !query ||
    c.first_name?.toLowerCase().includes(query.toLowerCase()) ||
    c.full_name?.toLowerCase().includes(query.toLowerCase()) ||
    c.clinic_name?.toLowerCase().includes(query.toLowerCase()) ||
    c.city?.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 8);

  const handleInvestigate = async (client) => {
    setSelectedClient(client);
    setQuery('');
    setResult(null);
    setLoading(true);
    try {
      const res = await base44.functions.invoke('aiCommandCenter', {
        action: 'investigar_area',
        client_name: client.first_name || client.full_name,
        clinic_name: client.clinic_name,
        city: client.city,
        client_type: client.client_type,
        current_volume: client.current_volume,
        equipment_sold: client.equipment_sold,
        equipment_interest: client.equipment_interest,
        purchase_score: client.purchase_score,
        pipeline_stage: client.pipeline_stage,
        available_budget: client.available_budget,
        decision_style: client.decision_style,
        main_pains: client.main_pains,
        notes: client.notes,
      });
      setResult(res?.data);
    } catch (e) {
      toast.error('Erro na investigação: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copiado!');
  };

  const scoreColor = (s) => {
    if (!s) return '#64748b';
    if (s >= 80) return '#00ff88';
    if (s >= 60) return '#ff9500';
    if (s >= 40) return '#f59e0b';
    return '#ff4444';
  };

  return (
    <div className="min-h-screen pb-24" style={{ background: '#0a0a0a' }}>
      {/* HEADER */}
      <div className="px-4 pt-5 pb-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.4)' }}>
            <Brain className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-lg font-black text-white">🕵️ Investigação Suprema</h1>
            <p className="text-[10px] text-purple-500 uppercase tracking-widest">Análise IA completa do cliente</p>
          </div>
        </div>
        <p className="text-xs text-slate-600 mt-2">
          Selecione um cliente para análise automática: score comercial, perfil do decisor, potencial de compra,
          oportunidade de comodato e abordagem recomendada.
        </p>
      </div>

      <div className="px-4 space-y-3">

        {/* BUSCA */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar cliente por nome, clínica ou cidade..."
            className="w-full pl-9 h-11 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none"
            style={{ background: '#161616', border: '1px solid rgba(168,85,247,0.3)' }}
          />
        </div>

        {/* LISTA DE CLIENTES */}
        {query && filtered.length > 0 && !loading && (
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(168,85,247,0.2)' }}>
            {filtered.map(c => (
              <button key={c.id} onClick={() => handleInvestigate(c)}
                className="w-full flex items-center justify-between p-3 text-left transition-all hover:opacity-80"
                style={{ background: '#141414', borderBottom: '1px solid rgba(168,85,247,0.1)' }}>
                <div>
                  <p className="text-sm font-black text-white">{c.first_name} {c.full_name?.split(' ').slice(1).join(' ')}</p>
                  <p className="text-[11px] text-slate-500">{c.clinic_name} {c.city && `• ${c.city}`}</p>
                </div>
                <div className="flex items-center gap-2">
                  {c.purchase_score > 0 && (
                    <span className="text-xs font-black px-2 py-0.5 rounded-full"
                      style={{ background: `${scoreColor(c.purchase_score)}15`, color: scoreColor(c.purchase_score) }}>
                      {c.purchase_score}
                    </span>
                  )}
                  <ChevronRight className="w-4 h-4 text-purple-700" />
                </div>
              </button>
            ))}
          </div>
        )}

        {/* CLIENTE SELECIONADO */}
        {selectedClient && (
          <div className="rounded-xl p-3 flex items-center justify-between"
            style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.3)' }}>
            <div>
              <p className="text-xs font-black text-purple-300">{selectedClient.first_name} {selectedClient.full_name?.split(' ').slice(1).join(' ')}</p>
              <p className="text-[11px] text-slate-500">{selectedClient.clinic_name}</p>
            </div>
            <button onClick={() => handleInvestigate(selectedClient)}
              disabled={loading}
              className="px-3 py-1.5 rounded-lg text-xs font-black disabled:opacity-40"
              style={{ background: 'rgba(168,85,247,0.2)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.4)' }}>
              {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : '🔄 Re-analisar'}
            </button>
          </div>
        )}

        {/* LOADING */}
        {loading && (
          <div className="rounded-2xl p-8 text-center" style={{ background: '#111', border: '1px solid rgba(168,85,247,0.2)' }}>
            <RefreshCw className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-3" />
            <p className="text-sm font-black text-purple-300">🧠 IA analisando cliente...</p>
            <p className="text-xs text-slate-600 mt-1">Score comercial, perfil decisor, potencial comodato...</p>
          </div>
        )}

        {/* RESULTADO */}
        {result && !loading && (
          <div className="space-y-3">

            {/* Score Comercial */}
            {(result.score_comercial !== undefined || result.purchase_score !== undefined) && (
              <div className="rounded-2xl p-4" style={{ background: '#111', border: '1px solid rgba(168,85,247,0.3)' }}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest">🎯 Score Comercial</p>
                  <div className="text-right">
                    <p className="text-2xl font-black" style={{ color: scoreColor(result.score_comercial || result.purchase_score) }}>
                      {result.score_comercial || result.purchase_score || 0}
                    </p>
                    <p className="text-[10px] text-slate-600">/100</p>
                  </div>
                </div>
                <div className="w-full h-2 rounded-full" style={{ background: '#1a1a1a' }}>
                  <div className="h-2 rounded-full transition-all"
                    style={{ width: `${result.score_comercial || result.purchase_score || 0}%`, background: scoreColor(result.score_comercial || result.purchase_score) }} />
                </div>
              </div>
            )}

            {/* Potencial de Compra */}
            {result.potencial_compra && (
              <div className="rounded-2xl p-4" style={{ background: '#111', border: '1px solid rgba(0,255,136,0.2)' }}>
                <p className="text-[10px] font-black text-green-400 uppercase tracking-widest mb-2">💰 Potencial de Compra</p>
                <p className="text-sm text-green-200">{result.potencial_compra}</p>
              </div>
            )}

            {/* Potencial de Comodato */}
            {result.potencial_comodato && (
              <div className="rounded-2xl p-4" style={{ background: '#111', border: '1px solid rgba(6,182,212,0.2)' }}>
                <p className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-2">🔬 Oportunidade de Comodato</p>
                <p className="text-sm text-cyan-200">{result.potencial_comodato}</p>
              </div>
            )}

            {/* Perfil do Decisor */}
            {result.perfil_decisor && (
              <div className="rounded-2xl p-4" style={{ background: '#111', border: '1px solid rgba(255,149,0,0.2)' }}>
                <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-2">🧠 Perfil do Decisor</p>
                <p className="text-sm text-orange-200">{result.perfil_decisor}</p>
              </div>
            )}

            {/* Abordagem Recomendada */}
            {result.abordagem_recomendada && (
              <div className="rounded-2xl p-4" style={{ background: '#111', border: '1px solid rgba(255,107,0,0.3)' }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest">⚡ Abordagem Recomendada</p>
                  <button onClick={() => handleCopy(result.abordagem_recomendada)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: 'rgba(255,107,0,0.1)' }}>
                    {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-orange-400" />}
                  </button>
                </div>
                <p className="text-sm text-orange-100 whitespace-pre-wrap">{result.abordagem_recomendada}</p>
              </div>
            )}

            {/* Resposta completa se for texto livre */}
            {typeof result === 'string' && (
              <div className="rounded-2xl p-4" style={{ background: '#111', border: '1px solid rgba(168,85,247,0.3)' }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest">📊 Análise Completa</p>
                  <button onClick={() => handleCopy(result)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: 'rgba(168,85,247,0.1)' }}>
                    {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-purple-400" />}
                  </button>
                </div>
                <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{result}</p>
              </div>
            )}

            {/* Resposta como objeto genérico */}
            {result && typeof result === 'object' && !result.score_comercial && !result.potencial_compra && !result.abordagem_recomendada && !result.perfil_decisor && (
              <div className="rounded-2xl p-4" style={{ background: '#111', border: '1px solid rgba(168,85,247,0.3)' }}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest">📊 Resultado</p>
                  <button onClick={() => handleCopy(JSON.stringify(result, null, 2))}
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{ background: 'rgba(168,85,247,0.1)' }}>
                    {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 text-purple-400" />}
                  </button>
                </div>
                <pre className="text-xs text-slate-400 whitespace-pre-wrap overflow-x-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* EMPTY STATE */}
        {!selectedClient && !loading && !result && (
          <div className="rounded-2xl p-8 text-center" style={{ background: '#111', border: '1px solid rgba(168,85,247,0.15)' }}>
            <Brain className="w-12 h-12 text-purple-800 mx-auto mb-3" />
            <p className="text-sm font-black text-purple-600 mb-1">Busque um cliente</p>
            <p className="text-xs text-slate-700">
              Digite o nome, clínica ou cidade para encontrar o cliente e iniciar a análise completa por IA.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
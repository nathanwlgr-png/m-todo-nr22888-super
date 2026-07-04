import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Loader2, Bot, Zap, Brain, AlertTriangle } from 'lucide-react';

const AGENTES = [
  {
    id: 'whatsapp_master_agent_NR22888',
    nome: '🧠 Investigativo Supremo',
    canal: 'Telegram',
    cor: 'border-purple-500/50',
    corBadge: 'bg-purple-500/20 text-purple-300',
    descricao: 'SPIN + Numerologia + Dossiê Elite + Timing',
    modelo: 'claude_opus_4_8',
    status: 'ATIVO',
    recomendado: true,
  },
  {
    id: 'nr22888_dia_dia',
    nome: '⚡ Dia Dia — Campo',
    canal: 'WhatsApp',
    cor: 'border-green-500/50',
    corBadge: 'bg-green-500/20 text-green-300',
    descricao: 'Fotos · Áudios · Lembretes · Exportar Conversas',
    modelo: 'gpt_5_5',
    status: 'ATIVO',
    recomendado: true,
  },
  {
    id: 'vendas_supremo',
    nome: '⚠️ Vendas Supremo',
    canal: '—',
    cor: 'border-red-500/30',
    corBadge: 'bg-red-500/20 text-red-400',
    descricao: 'DESCONTINUADO — Unificado no Investigativo',
    modelo: 'gpt_5_5',
    status: 'DESCONTINUADO',
    recomendado: false,
  },
  {
    id: 'whatsapp_nr22888_turbo',
    nome: '⚠️ Turbo NR22888',
    canal: '—',
    cor: 'border-red-500/30',
    corBadge: 'bg-red-500/20 text-red-400',
    descricao: 'DESCONTINUADO — Unificado no Investigativo',
    modelo: 'gpt_5_5',
    status: 'DESCONTINUADO',
    recomendado: false,
  },
];

const PROMPT_TESTE = 'Olá! Confirme que está funcionando corretamente. Responda apenas: OK [nome do agente].';

export default function TesteAgentes() {
  const [resultados, setResultados] = useState({});
  const [loadingId, setLoadingId] = useState(null);
  const [churnLoading, setChurnLoading] = useState(false);
  const [churnResult, setChurnResult] = useState(null);

  const testarAgente = async (agente) => {
    if (agente.status === 'DESCONTINUADO') return;
    setLoadingId(agente.id);
    try {
      const conv = await base44.agents.createConversation({
        agent_name: agente.id,
        metadata: { name: 'Teste diagnóstico' },
      });
      await base44.agents.addMessage(conv, { role: 'user', content: PROMPT_TESTE });
      // Aguarda resposta com retry — modelos grandes podem demorar até 20s
      let convAtualizada;
      for (let i = 0; i < 6; i++) {
        await new Promise(r => setTimeout(r, 4000));
        convAtualizada = await base44.agents.getConversation(conv.id);
        const ultimaMsg = convAtualizada.messages?.filter(m => m.role === 'assistant').pop();
        if (ultimaMsg?.content && ultimaMsg.content.length > 0) break;
      }
      const ultimaMensagem = convAtualizada.messages?.filter(m => m.role === 'assistant').pop();
      const resposta = ultimaMensagem?.content || '';
      setResultados(prev => ({
        ...prev,
        [agente.id]: {
          ok: resposta.length > 0,
          resposta: resposta.slice(0, 180) || 'Sem resposta',
        },
      }));
    } catch (e) {
      setResultados(prev => ({
        ...prev,
        [agente.id]: { ok: false, resposta: e.message },
      }));
    } finally {
      setLoadingId(null);
    }
  };

  const testarChurn = async () => {
    setChurnLoading(true);
    setChurnResult(null);
    try {
      const res = await base44.functions.invoke('churnSilenciosoAlert', {});
      setChurnResult(res.data);
    } catch (e) {
      setChurnResult({ error: e.message });
    } finally {
      setChurnLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 pb-20">
      <div className="max-w-xl mx-auto space-y-4">

        {/* Header */}
        <div className="rounded-2xl p-4 bg-[#0f0f11] border border-purple-500/30 text-center">
          <h1 className="text-xl font-black text-purple-400 flex items-center justify-center gap-2">
            <Bot className="w-5 h-5" /> Diagnóstico de Agentes
          </h1>
          <p className="text-xs text-slate-500 mt-1">NR22888 — SEAMATY Brasil</p>
        </div>

        {/* Arquitetura explicada */}
        <div className="rounded-xl p-4 bg-[#0f0f11] border border-orange-500/20 space-y-2">
          <p className="text-xs font-black text-orange-400 uppercase tracking-widest">📐 Arquitetura Ativa</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg p-3 bg-purple-500/10 border border-purple-500/30">
              <p className="text-xs font-black text-purple-400">🧠 INVESTIGATIVO</p>
              <p className="text-[10px] text-purple-300 mt-1">Telegram · SPIN · Numerologia · Dossiê · Timing · Proposta Elite</p>
            </div>
            <div className="rounded-lg p-3 bg-green-500/10 border border-green-500/30">
              <p className="text-xs font-black text-green-400">⚡ DIA DIA</p>
              <p className="text-[10px] text-green-300 mt-1">WhatsApp · Fotos · Áudios · Lembretes · Exportar Log</p>
            </div>
          </div>
          <p className="text-[10px] text-slate-500">Ambos compartilham o mesmo banco de dados. Nada se perde entre os canais.</p>
        </div>

        {/* Cards de agentes */}
        {AGENTES.map(agente => {
          const resultado = resultados[agente.id];
          const loading = loadingId === agente.id;
          const descontinuado = agente.status === 'DESCONTINUADO';

          return (
            <div key={agente.id} className={`rounded-xl p-4 bg-[#0f0f11] border ${agente.cor} ${descontinuado ? 'opacity-50' : ''}`}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-black text-white">{agente.nome}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{agente.descricao}</p>
                  <p className="text-[9px] text-slate-600 mt-0.5">Modelo: {agente.modelo}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${agente.corBadge}`}>
                    {agente.status}
                  </span>
                  {agente.canal !== '—' && (
                    <span className="text-[9px] text-slate-500">{agente.canal}</span>
                  )}
                </div>
              </div>

              {resultado && (
                <div className={`rounded-lg p-2 mb-2 text-xs ${resultado.ok ? 'bg-green-500/10 border border-green-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                  <div className="flex items-center gap-1 mb-1">
                    {resultado.ok
                      ? <CheckCircle className="w-3 h-3 text-green-400" />
                      : <XCircle className="w-3 h-3 text-red-400" />}
                    <span className={resultado.ok ? 'text-green-400 font-bold' : 'text-red-400 font-bold'}>
                      {resultado.ok ? 'Funcionando' : 'Erro'}
                    </span>
                  </div>
                  <p className="text-slate-300 text-[10px]">{resultado.resposta}</p>
                </div>
              )}

              <Button
                onClick={() => testarAgente(agente)}
                disabled={loading || descontinuado}
                size="sm"
                className={`w-full text-xs font-bold ${
                  descontinuado
                    ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                    : agente.recomendado
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-500 text-white'
                    : 'bg-slate-700 text-slate-300'
                }`}
              >
                {loading ? (
                  <><Loader2 className="w-3 h-3 animate-spin mr-1" /> Testando...</>
                ) : descontinuado ? (
                  'Descontinuado'
                ) : (
                  <><Zap className="w-3 h-3 mr-1" /> Testar Agente</>
                )}
              </Button>
            </div>
          );
        })}

        {/* Teste Churn Silencioso */}
        <div className="rounded-xl p-4 bg-[#0f0f11] border border-amber-500/30">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <p className="text-sm font-black text-amber-400">Alerta Churn Silencioso</p>
          </div>
          <p className="text-[10px] text-slate-400 mb-3">
            Detecta clientes quentes que pararam de comprar/responder. Gera alerta com mensagem SPIN + timing numerológico.
          </p>

          {churnResult && (
            <div className={`rounded-lg p-2 mb-3 text-xs ${churnResult.error ? 'bg-red-500/10 border border-red-500/20' : 'bg-amber-500/10 border border-amber-500/20'}`}>
              {churnResult.error ? (
                <p className="text-red-400">{churnResult.error}</p>
              ) : (
                <>
                  <p className="text-amber-400 font-bold">✅ {churnResult.alertasGerados} alertas gerados de {churnResult.processados} clientes</p>
                  {churnResult.detalhes?.slice(0, 3).map((d, i) => (
                    <p key={i} className="text-slate-300 text-[10px] mt-1">• {d.cliente} — {d.tipoAlerta} — {d.timing}</p>
                  ))}
                </>
              )}
            </div>
          )}

          <Button
            onClick={testarChurn}
            disabled={churnLoading}
            size="sm"
            className="w-full bg-gradient-to-r from-amber-600 to-orange-500 text-white text-xs font-bold"
          >
            {churnLoading ? (
              <><Loader2 className="w-3 h-3 animate-spin mr-1" /> Analisando...</>
            ) : (
              <><Brain className="w-3 h-3 mr-1" /> Rodar Análise de Churn</>
            )}
          </Button>
        </div>

        {/* Guia de uso */}
        <div className="rounded-xl p-4 bg-[#0f0f11] border border-cyan-500/20 space-y-3">
          <p className="text-xs font-black text-cyan-400 uppercase tracking-widest">📖 Como usar</p>
          <div className="space-y-2">
            <div className="rounded-lg p-2 bg-cyan-500/5 border border-cyan-500/15">
              <p className="text-xs font-black text-cyan-400">🧠 INVESTIGATIVO (Telegram)</p>
              <p className="text-[10px] text-slate-400 mt-1">/quentes · /investigar_clinica · /proposta · /timing · /churn · /briefing · /hunter</p>
            </div>
            <div className="rounded-lg p-2 bg-green-500/5 border border-green-500/15">
              <p className="text-xs font-black text-green-400">⚡ DIA DIA (WhatsApp)</p>
              <p className="text-[10px] text-slate-400 mt-1">Foto de pedido · Áudio do cliente → resposta SPIN · Lembrete · Exportar histórico</p>
            </div>
            <div className="rounded-lg p-2 bg-slate-800/50 border border-slate-700/30">
              <p className="text-[10px] text-slate-500">
                💡 Ambos leem o mesmo banco de dados. O que o Dia Dia salva, o Investigativo lembra. Sem silo de informação.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
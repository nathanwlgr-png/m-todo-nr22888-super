import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { CheckCircle2, XCircle, Loader2, Bot, Trash2, Crown } from 'lucide-react';

const AGENTES = [
  {
    id: 'whatsapp_master_agent_NR22888',
    nome: 'NR22888 Agente Mestre',
    descricao: 'Agente principal unificado — 30 IAs, SPIN, Hunter, Telegram, fotos',
    recomendado: true,
  },
  {
    id: 'whatsapp_nr22888_turbo',
    nome: 'NR22888 Turbo',
    descricao: 'Agente descontinuado — foi unificado no Mestre',
    recomendado: false,
  },
  {
    id: 'vendas_supremo',
    nome: 'Vendas Supremo',
    descricao: 'Agente descontinuado — foi unificado no Mestre',
    recomendado: false,
  },
];

const MENSAGEM_TESTE = 'Olá! Confirme que está ativo respondendo: ATIVO + seu nome de agente.';

export default function TesteAgentes() {
  const [resultados, setResultados] = useState({});
  const [loading, setLoading] = useState({});

  const testarAgente = async (agenteId) => {
    setLoading(prev => ({ ...prev, [agenteId]: true }));
    setResultados(prev => ({ ...prev, [agenteId]: null }));

    try {
      const inicio = Date.now();

      // Criar conversa de teste
      const conversa = await base44.agents.createConversation({
        agent_name: agenteId,
        metadata: { name: 'Teste de Conectividade', description: 'teste_automatico' },
      });

      // Enviar mensagem de teste
      await base44.agents.addMessage(conversa, {
        role: 'user',
        content: MENSAGEM_TESTE,
      });

      // Aguardar resposta (polling simples)
      let resposta = null;
      for (let i = 0; i < 12; i++) {
        await new Promise(r => setTimeout(r, 2500));
        const conv = await base44.agents.getConversation(conversa.id);
        const msgs = conv.messages || [];
        const assistente = msgs.filter(m => m.role === 'assistant' && m.content);
        if (assistente.length > 0) {
          resposta = assistente[assistente.length - 1].content;
          break;
        }
      }

      const duracao = ((Date.now() - inicio) / 1000).toFixed(1);

      if (resposta) {
        setResultados(prev => ({
          ...prev,
          [agenteId]: { ok: true, resposta, duracao },
        }));
      } else {
        setResultados(prev => ({
          ...prev,
          [agenteId]: { ok: false, resposta: 'Sem resposta após 30s', duracao },
        }));
      }
    } catch (err) {
      setResultados(prev => ({
        ...prev,
        [agenteId]: { ok: false, resposta: `Erro: ${err.message}`, duracao: '-' },
      }));
    } finally {
      setLoading(prev => ({ ...prev, [agenteId]: false }));
    }
  };

  const testarTodos = () => {
    AGENTES.forEach(a => testarAgente(a.id));
  };

  const okCount = Object.values(resultados).filter(r => r?.ok).length;
  const doneCount = Object.values(resultados).filter(r => r !== null).length;

  return (
    <div className="min-h-screen bg-black text-white pb-20 flex flex-col items-center p-4">
      <div className="w-full max-w-xl space-y-4">

        {/* Header */}
        <div className="px-4 py-4 rounded-2xl bg-[#0f0f11] border border-cyan-500/20 text-center">
          <h1 className="text-xl font-black text-cyan-400 flex items-center justify-center gap-2">
            <Bot className="w-5 h-5" /> Teste de Agentes
          </h1>
          <p className="text-xs text-slate-500 mt-1">Identifique qual agente está ativo e funcionando</p>
        </div>

        {/* Botão testar todos */}
        <button
          onClick={testarTodos}
          disabled={Object.values(loading).some(Boolean)}
          className="w-full rounded-xl p-4 bg-gradient-to-r from-cyan-700 to-blue-600 hover:from-cyan-600 hover:to-blue-500 disabled:opacity-50 font-black text-white text-sm transition-all"
        >
          {Object.values(loading).some(Boolean)
            ? '⏳ Testando todos os agentes...'
            : '🚀 Testar Todos de Uma Vez'}
        </button>

        {/* Resultado resumo */}
        {doneCount > 0 && (
          <div className={`rounded-xl p-3 border text-center ${okCount > 0 ? 'border-emerald-500/40 bg-emerald-900/20' : 'border-red-500/40 bg-red-900/20'}`}>
            <p className="text-sm font-black text-emerald-300">
              {okCount}/{doneCount} agentes responderam
            </p>
            {okCount === 1 && (
              <p className="text-xs text-emerald-400 mt-1">
                ✅ Use apenas o agente que respondeu. Apague os outros.
              </p>
            )}
          </div>
        )}

        {/* Cards dos agentes */}
        {AGENTES.map(agente => {
          const res = resultados[agente.id];
          const isLoading = loading[agente.id];

          return (
            <div
              key={agente.id}
              className={`rounded-2xl p-4 bg-[#0f0f11] border space-y-3 ${
                agente.recomendado ? 'border-orange-500/40' : 'border-slate-700/40'
              }`}
            >
              {/* Cabeçalho do agente */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {agente.recomendado && <Crown className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />}
                    <p className={`text-sm font-black ${agente.recomendado ? 'text-orange-300' : 'text-slate-400'}`}>
                      {agente.nome}
                    </p>
                  </div>
                  <p className="text-[10px] text-slate-600 mt-0.5">{agente.descricao}</p>
                  <p className="text-[9px] text-slate-700 font-mono mt-0.5">{agente.id}</p>
                </div>
                {agente.recomendado && (
                  <span className="text-[9px] bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-full px-2 py-0.5 font-bold flex-shrink-0">
                    RECOMENDADO
                  </span>
                )}
                {!agente.recomendado && (
                  <span className="text-[9px] bg-red-500/10 text-red-400 border border-red-500/20 rounded-full px-2 py-0.5 font-bold flex-shrink-0 flex items-center gap-1">
                    <Trash2 className="w-2.5 h-2.5" /> APAGAR
                  </span>
                )}
              </div>

              {/* Resultado */}
              {res && (
                <div className={`rounded-xl p-3 ${res.ok ? 'bg-emerald-900/20 border border-emerald-500/30' : 'bg-red-900/20 border border-red-500/20'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    {res.ok
                      ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      : <XCircle className="w-3.5 h-3.5 text-red-400" />
                    }
                    <span className={`text-xs font-bold ${res.ok ? 'text-emerald-400' : 'text-red-400'}`}>
                      {res.ok ? `Ativo ✅ (${res.duracao}s)` : `Sem resposta ❌ (${res.duracao}s)`}
                    </span>
                  </div>
                  {res.resposta && (
                    <p className="text-[10px] text-slate-400 line-clamp-3">{res.resposta}</p>
                  )}
                </div>
              )}

              {/* Botão individual */}
              <button
                onClick={() => testarAgente(agente.id)}
                disabled={isLoading}
                className={`w-full rounded-xl py-2 text-xs font-bold transition-all ${
                  agente.recomendado
                    ? 'bg-orange-600/20 hover:bg-orange-600/30 text-orange-300 border border-orange-500/20'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700'
                } disabled:opacity-50 flex items-center justify-center gap-2`}
              >
                {isLoading
                  ? <><Loader2 className="w-3 h-3 animate-spin" /> Testando... (~30s)</>
                  : '▶ Testar este agente'
                }
              </button>
            </div>
          );
        })}

        {/* Guia de decisão */}
        <div className="rounded-2xl p-4 bg-[#0f0f11] border border-slate-700/40 space-y-2">
          <p className="text-xs font-black text-slate-300">📋 Como decidir qual manter:</p>
          <div className="space-y-1.5 text-[10px] text-slate-500">
            <p>1. Clique em <strong className="text-slate-300">Testar Todos de Uma Vez</strong></p>
            <p>2. Veja qual respondeu com ✅ (geralmente só o Mestre responde)</p>
            <p>3. Os marcados com 🗑️ APAGAR → vá no painel Base44 → Agentes → Apagar</p>
            <p>4. Mantenha <strong className="text-orange-400">somente o NR22888 Agente Mestre</strong></p>
          </div>
        </div>

      </div>
    </div>
  );
}
import React, { useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import InactiveClientSelector from '@/components/rescue/InactiveClientSelector';
import SequenceBuilder from '@/components/rescue/SequenceBuilder';
import RescueFunnelBoard from '@/components/rescue/RescueFunnelBoard';
import { Zap, Users, TrendingUp, RefreshCw, ChevronLeft, Calendar, CheckCircle, MessageSquare, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const TABS = ['funil', 'inativos', 'sequencia'];

export default function ActiveProspecting() {
  const [tab, setTab] = useState('funil');
  const [threshold, setThreshold] = useState(30);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedSequence, setSelectedSequence] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [loadingInactive, setLoadingInactive] = useState(false);
  const [inactiveClients, setInactiveClients] = useState([]);
  const queryClient = useQueryClient();

  // Sequências existentes
  const { data: sequences = [], refetch: refetchSeqs } = useQuery({
    queryKey: ['rescue-sequences'],
    queryFn: () => base44.entities.RescueSequence.list('-created_date', 200),
    staleTime: 30000,
  });

  const kpis = {
    total: sequences.length,
    enviadas: sequences.filter(s => s.funnel_status === 'mensagem_enviada').length,
    respostas: sequences.filter(s => s.funnel_status === 'resposta_recebida').length,
    convertidos: sequences.filter(s => s.funnel_status === 'convertido').length,
  };

  const loadInactive = useCallback(async () => {
    setLoadingInactive(true);
    try {
      const res = await base44.functions.invoke('generateRescueSequence', {
        mode: 'list_inactive', inactive_days_threshold: threshold, limit: 60
      });
      setInactiveClients(res.data?.inactive_clients || []);
    } catch (e) {
      toast.error('Erro ao carregar inativos: ' + e.message);
    }
    setLoadingInactive(false);
  }, [threshold]);

  const handleSelectClient = async (client) => {
    setSelectedClient(client);
    setTab('sequencia');
    setSelectedSequence(null);
    // Verifica se já existe sequência ativa para esse cliente
    const existing = sequences.find(s => s.client_id === client.id && s.funnel_status !== 'descartado');
    if (existing) {
      setSelectedSequence(existing);
      toast.info('Sequência existente carregada');
    }
  };

  const handleGenerate = async () => {
    if (!selectedClient) return;
    setGenerating(true);
    try {
      const res = await base44.functions.invoke('generateRescueSequence', {
        mode: 'generate', client_id: selectedClient.id
      });
      if (res.data?.sequence_id) {
        toast.success('Sequência gerada com IA!');
        await refetchSeqs();
        const updated = await base44.entities.RescueSequence.filter({ id: res.data.sequence_id });
        setSelectedSequence(updated[0] || null);
      }
    } catch (e) {
      toast.error('Erro: ' + e.message);
    }
    setGenerating(false);
  };

  const handleStatusChange = async (sequenceId, status, extra = {}) => {
    try {
      await base44.functions.invoke('generateRescueSequence', {
        mode: 'update_status', sequence_id: sequenceId, funnel_status: status, ...extra
      });
      toast.success('Status atualizado!');
      refetchSeqs();
      if (selectedSequence?.id === sequenceId) {
        setSelectedSequence(s => s ? { ...s, funnel_status: status } : s);
      }
    } catch (e) {
      toast.error('Erro ao atualizar');
    }
  };

  const handleSelectFunnelItem = (seq) => {
    setSelectedSequence(seq);
    setSelectedClient({ id: seq.client_id, name: seq.client_name, phone: seq.client_phone });
    setTab('sequencia');
  };

  return (
    <div className="min-h-screen pb-24" style={{ background: '#0a0a0a' }}>
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(0,255,136,0.15)', border: '1px solid rgba(0,255,136,0.3)' }}>
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">Prospecção Ativa</h1>
            <p className="text-xs text-green-700">Resgatar inativos • Sequências IA • Funil WhatsApp</p>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Sequências', val: kpis.total, color: '#ff9500' },
            { label: 'Enviadas', val: kpis.enviadas, color: '#00bfff' },
            { label: 'Respostas', val: kpis.respostas, color: '#00ff88' },
            { label: 'Convertidos', val: kpis.convertidos, color: '#ff6b00' },
          ].map(({ label, val, color }) => (
            <div key={label} className="rounded-xl p-2 text-center"
              style={{ background: '#141414', border: `1px solid ${color}33` }}>
              <p className="text-lg font-black" style={{ color }}>{val}</p>
              <p className="text-[9px] text-slate-600">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-4 mb-4">
        {[
          { key: 'funil', label: '🎯 Funil' },
          { key: 'inativos', label: '💤 Inativos' },
          { key: 'sequencia', label: '✉️ Sequência' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="flex-1 py-2 rounded-xl text-xs font-black transition-all"
            style={tab === t.key
              ? { background: 'rgba(0,255,136,0.2)', color: '#00ff88', border: '1px solid rgba(0,255,136,0.4)' }
              : { background: '#111', color: '#666', border: '1px solid rgba(255,255,255,0.05)' }}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="px-4">

        {/* ── TAB: FUNIL ─────────────────────────────────────────────────────── */}
        {tab === 'funil' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-slate-500">{sequences.length} sequências no funil</p>
              <button onClick={() => { setTab('inativos'); loadInactive(); }}
                className="text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1"
                style={{ background: 'rgba(0,255,136,0.1)', color: '#00ff88', border: '1px solid rgba(0,255,136,0.2)' }}>
                <Zap className="w-3 h-3" /> Nova Sequência
              </button>
            </div>
            {sequences.length === 0 ? (
              <div className="text-center py-16">
                <MessageSquare className="w-10 h-10 mx-auto mb-3 text-slate-700" />
                <p className="text-sm text-slate-600 mb-3">Nenhuma sequência criada ainda</p>
                <Button size="sm" onClick={() => { setTab('inativos'); loadInactive(); }}
                  className="text-xs bg-green-700 hover:bg-green-600">
                  Buscar Clientes Inativos
                </Button>
              </div>
            ) : (
              <RescueFunnelBoard
                sequences={sequences}
                selectedId={selectedSequence?.id}
                onSelect={handleSelectFunnelItem}
              />
            )}

            {/* Quick status update for selected */}
            {selectedSequence && (
              <div className="mt-4 rounded-2xl p-4" style={{ background: '#111', border: '1px solid rgba(0,255,136,0.2)' }}>
                <p className="text-xs font-black text-green-400 mb-2">
                  ✉️ {selectedSequence.client_name} — Atualizar Status
                </p>
                <div className="flex flex-wrap gap-2">
                  {['resposta_recebida', 'agendado', 'convertido', 'sem_resposta', 'descartado'].map(s => (
                    <button key={s} onClick={() => handleStatusChange(selectedSequence.id, s)}
                      className="px-2 py-1 rounded-lg text-[10px] font-bold capitalize"
                      style={{ background: 'rgba(255,107,0,0.1)', color: '#ff9500', border: '1px solid rgba(255,107,0,0.2)' }}>
                      {s.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
                <button onClick={() => setTab('sequencia')}
                  className="mt-2 text-xs text-blue-400 underline">Ver sequência completa →</button>
              </div>
            )}
          </div>
        )}

        {/* ── TAB: INATIVOS ──────────────────────────────────────────────────── */}
        {tab === 'inativos' && (
          <div>
            {inactiveClients.length === 0 && !loadingInactive ? (
              <div className="text-center py-10">
                <Users className="w-10 h-10 mx-auto mb-3 text-slate-700" />
                <p className="text-sm text-slate-600 mb-3">Clique para carregar inativos</p>
                <Button onClick={loadInactive} className="bg-orange-600 hover:bg-orange-500 text-xs">
                  Carregar Clientes Inativos
                </Button>
              </div>
            ) : (
              <InactiveClientSelector
                clients={inactiveClients}
                loading={loadingInactive}
                threshold={threshold}
                onThresholdChange={(v) => { setThreshold(v); }}
                onSelect={handleSelectClient}
                onRefresh={loadInactive}
              />
            )}
          </div>
        )}

        {/* ── TAB: SEQUÊNCIA ─────────────────────────────────────────────────── */}
        {tab === 'sequencia' && (
          <div>
            {!selectedClient ? (
              <div className="text-center py-10">
                <AlertCircle className="w-10 h-10 mx-auto mb-3 text-slate-700" />
                <p className="text-sm text-slate-600 mb-3">Selecione um cliente inativo primeiro</p>
                <Button size="sm" onClick={() => setTab('inativos')} className="text-xs bg-orange-700">
                  Ir para Inativos
                </Button>
              </div>
            ) : (
              <div>
                {/* Client info bar */}
                <div className="rounded-xl p-3 mb-3 flex items-center justify-between"
                  style={{ background: '#141414', border: '1px solid rgba(0,255,136,0.2)' }}>
                  <div>
                    <p className="text-sm font-black text-white">{selectedClient.name}</p>
                    <p className="text-xs text-green-700">{selectedClient.inactive_days}d inativo · {selectedClient.city || ''}</p>
                  </div>
                  <button onClick={() => { setSelectedClient(null); setSelectedSequence(null); setTab('inativos'); }}
                    className="text-xs text-slate-500 flex items-center gap-1 hover:text-slate-300">
                    <ChevronLeft className="w-3 h-3" /> Trocar
                  </button>
                </div>

                {/* Generate or show sequence */}
                {!selectedSequence ? (
                  <div className="text-center py-8 rounded-2xl"
                    style={{ background: '#111', border: '1px dashed rgba(0,255,136,0.2)' }}>
                    <Zap className="w-8 h-8 mx-auto mb-2 text-green-700" />
                    <p className="text-sm text-slate-500 mb-4">Gerar sequência personalizada com IA</p>
                    <Button onClick={handleGenerate} disabled={generating}
                      className="font-black gap-2 bg-green-700 hover:bg-green-600">
                      {generating
                        ? <><RefreshCw className="w-4 h-4 animate-spin" /> Gerando IA...</>
                        : <><Zap className="w-4 h-4" /> Gerar Sequência</>}
                    </Button>
                  </div>
                ) : (
                  <div>
                    <SequenceBuilder
                      sequence={selectedSequence}
                      client={selectedClient}
                      onUpdate={() => refetchSeqs().then(() => {
                        base44.entities.RescueSequence.filter({ id: selectedSequence.id })
                          .then(r => setSelectedSequence(r[0] || selectedSequence));
                      })}
                    />

                    {/* Status actions */}
                    <div className="mt-4 rounded-xl p-3" style={{ background: '#111', border: '1px solid rgba(255,107,0,0.15)' }}>
                      <p className="text-xs font-black text-orange-400 mb-2">📊 Status da Sequência</p>
                      <div className="flex flex-wrap gap-2">
                        {['resposta_recebida', 'agendado', 'convertido', 'sem_resposta'].map(s => (
                          <button key={s} onClick={() => handleStatusChange(selectedSequence.id, s)}
                            disabled={selectedSequence.funnel_status === s}
                            className="px-2 py-1.5 rounded-lg text-[11px] font-bold capitalize transition-all disabled:opacity-40"
                            style={{ background: 'rgba(255,107,0,0.1)', color: '#ff9500', border: '1px solid rgba(255,107,0,0.2)' }}>
                            {s.replace(/_/g, ' ')}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Regenerate */}
                    <button onClick={() => { setSelectedSequence(null); }}
                      className="mt-3 w-full py-2 rounded-xl text-xs text-slate-500 hover:text-slate-300 border border-slate-800">
                      Gerar nova sequência para este cliente
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
import React, { useEffect, useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Copy, Send, CheckCircle2, X, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';
import EconomicMode from '@/lib/EconomicMode';
import AIUnavailableNotice from '@/components/AIUnavailableNotice';

export default function GenerateWhatsAppIntegrated() {
  const initialClientId = new URLSearchParams(window.location.search).get('client_id') || '';
  const [clientId, setClientId] = useState(initialClientId);
  const [searchText, setSearchText] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [messages, setMessages] = useState([]);
  const [selectedMessageIdx, setSelectedMessageIdx] = useState(null);
  const [showApproval, setShowApproval] = useState(false);
  const [loading, setLoading] = useState(false);
  const [economicStatus, setEconomicStatus] = useState(EconomicMode.getStatus());
  const messagesEndRef = useRef(null);

  // Lista de todos os clientes para busca por nome
  const { data: allClients = [] } = useQuery({
    queryKey: ['all-clients-spin'],
    queryFn: () => base44.entities.Client.list('-updated_date', 200),
    staleTime: 300000,
  });

  // Sugestões filtradas pelo texto digitado
  const suggestions = searchText.length >= 2
    ? allClients.filter(c => {
        const q = searchText.toLowerCase();
        return (
          c.clinic_name?.toLowerCase().includes(q) ||
          c.full_name?.toLowerCase().includes(q) ||
          c.first_name?.toLowerCase().includes(q) ||
          c.city?.toLowerCase().includes(q)
        );
      }).slice(0, 8)
    : [];

  useEffect(() => {
    const selected = allClients.find(c => c.id === clientId);
    if (selected && !searchText) {
      setSearchText(selected.clinic_name || selected.full_name || selected.first_name || '');
    }
  }, [allClients, clientId, searchText]);

  // Selecionar cliente da lista
  const selectClient = (c) => {
    setClientId(c.id);
    setSearchText(c.clinic_name || c.full_name || c.first_name || '');
    setShowSuggestions(false);
    setMessages([]);
  };

  // Busca dados do cliente selecionado
  const { data: client, isLoading: clientLoading } = useQuery({
    queryKey: ['client', clientId],
    queryFn: () => clientId ? allClients.find(x => x.id === clientId) || null : null,
    enabled: !!clientId,
  });

  // Busca histórico de interações
  const { data: interactions = [] } = useQuery({
    queryKey: ['interactions', clientId],
    queryFn: () => clientId ? base44.entities.Interaction?.filter({ client_id: clientId }).catch(() => []) : [],
    enabled: !!clientId,
  });

  // Busca equipamentos
  const { data: equipments = [] } = useQuery({
    queryKey: ['equipments', clientId],
    queryFn: () => clientId ? 
      base44.entities.Client.list().then(clients => {
        const c = clients.find(x => x.id === clientId);
        return c?.current_equipment ? [{ name: c.current_equipment }] : [];
      }).catch(() => []) : [],
    enabled: !!clientId,
  });

  // Gera mensagens SPIN
  const generateMessages = async () => {
    if (!client) {
      toast.error('Cliente não encontrado');
      return;
    }

    // Valida modo econômico
    if (!EconomicMode.canMakeAICall()) {
      toast.error('Limite de créditos atingido. Desative Modo Econômico para continuar.');
      return;
    }

    setLoading(true);
    try {
      const res = await base44.functions.invoke('generateSpinSellingMessages', {
        client_id: clientId,
        client_name: client.full_name || client.first_name,
        city: client.city,
        last_interaction: client.last_contact_date,
        current_equipment: client.current_equipment,
        pipeline_stage: client.pipeline_stage,
        main_pains: client.main_pains || [],
      });

      setMessages(res.data?.messages || []);
      setShowApproval(false);
      toast.success('3 mensagens SPIN geradas com sucesso!');
    } catch (err) {
      toast.error(`Erro ao gerar mensagens: ${err.message}`);
    } finally {
      setLoading(false);
      EconomicMode.addCreditUsage(1);
      setEconomicStatus(EconomicMode.getStatus());
    }
  };

  // Copiar mensagem
  const copyMessage = (msg) => {
    navigator.clipboard.writeText(msg);
    toast.success('Mensagem copiada!');
  };

  // Enviar via WhatsApp
  const sendWhatsApp = (msg) => {
    if (!client?.phone) {
      toast.error('Cliente sem WhatsApp registrado');
      return;
    }
    const digits = client.phone.replace(/\D/g, '');
    const phone = digits.startsWith('55') ? digits : `55${digits}`;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  // Salvar no histórico
  const saveInteraction = async (msg) => {
    try {
      await base44.entities.Interaction?.create({
        client_id: clientId,
        type: 'whatsapp_mensagem_gerada',
        content: msg,
      }).catch(() => null);

      toast.success('Interação salva no CRM');
    } catch {
      toast.warning('Não foi possível salvar no histórico');
    }
  };

  // Aprovar e enviar
  const approveAndSend = async (msg) => {
    await saveInteraction(msg);
    sendWhatsApp(msg);
    setShowApproval(false);
  };

  const lastInteraction = interactions[0]?.created_date || client?.last_contact_date;

  return (
    <div className="min-h-screen pb-20" style={{ background: '#0a0a0a' }}>
      <div className="max-w-4xl mx-auto p-4 pt-6">
        
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-black text-orange-400 mb-2">💬 WhatsApp SPIN Selling</h1>
          <p className="text-orange-200 text-sm">Gere mensagens personalizadas baseadas no perfil do cliente</p>
          
          {/* Status Econômico */}
          {economicStatus.enabled && (
            <div className="mt-3 p-2 rounded bg-green-950/30 border border-green-500/30 text-[10px] text-green-400">
              💚 Modo Econômico Ativo · {economicStatus.remainingCalls} chamadas restantes
            </div>
          )}
        </div>

        {/* Busca Cliente */}
        <Card className="mb-6 border-orange-500/20" style={{ background: '#111' }}>
          <CardContent className="pt-6">
            <div className="flex gap-3 mb-4 relative">
              <div className="flex-1 relative">
                <input
                  placeholder="Nome da clínica ou cliente..."
                  value={searchText}
                  onChange={(e) => {
                    setSearchText(e.target.value);
                    setClientId('');
                    setShowSuggestions(true);
                    setMessages([]);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onKeyPress={(e) => e.key === 'Enter' && clientId && generateMessages()}
                  className="w-full px-4 py-2 rounded-lg text-sm text-white"
                  style={{ background: '#1a1a1a', border: '1px solid rgba(255,107,0,0.2)' }}
                />
                {showSuggestions && suggestions.length > 0 && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowSuggestions(false)} />
                    <div className="absolute left-0 right-0 top-full mt-1 rounded-lg overflow-hidden z-20 shadow-xl" style={{ background: '#1a1a1a', border: '1px solid rgba(255,107,0,0.3)' }}>
                      {suggestions.map(c => (
                        <button
                          key={c.id}
                          onClick={() => selectClient(c)}
                          className="w-full text-left px-4 py-2.5 hover:bg-orange-950/40 border-b border-orange-500/10 last:border-0"
                        >
                          <p className="text-sm text-white font-bold">{c.clinic_name || c.full_name || c.first_name}</p>
                          <p className="text-[11px] text-orange-400">{c.city || ''}{c.pipeline_stage ? ` · ${c.pipeline_stage}` : ''}</p>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
              <Button
                onClick={generateMessages}
                disabled={!clientId || clientLoading || loading}
                className="bg-orange-600 hover:bg-orange-700 shrink-0"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Gerar SPIN
              </Button>
            </div>

            {/* Dados do Cliente */}
            {client && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 rounded" style={{ background: '#1a1a1a', border: '1px solid rgba(255,107,0,0.15)' }}>
                  <p className="text-xs text-orange-600 font-bold">NOME</p>
                  <p className="text-sm text-white font-bold">{client.full_name || client.first_name}</p>
                </div>
                <div className="p-3 rounded" style={{ background: '#1a1a1a', border: '1px solid rgba(255,107,0,0.15)' }}>
                  <p className="text-xs text-orange-600 font-bold">CIDADE</p>
                  <p className="text-sm text-white font-bold">{client.city || '—'}</p>
                </div>
                <div className="p-3 rounded" style={{ background: '#1a1a1a', border: '1px solid rgba(255,107,0,0.15)' }}>
                  <p className="text-xs text-orange-600 font-bold">ESTÁGIO</p>
                  <p className="text-sm text-white font-bold capitalize">{client.pipeline_stage || '—'}</p>
                </div>
                <div className="p-3 rounded" style={{ background: '#1a1a1a', border: '1px solid rgba(255,107,0,0.15)' }}>
                  <p className="text-xs text-orange-600 font-bold">EQUIPAMENTO</p>
                  <p className="text-sm text-white font-bold">{client.current_equipment || '—'}</p>
                </div>
                {lastInteraction && (
                  <div className="p-3 rounded col-span-2" style={{ background: '#1a1a1a', border: '1px solid rgba(255,107,0,0.15)' }}>
                    <p className="text-xs text-orange-600 font-bold">ÚLTIMA INTERAÇÃO</p>
                    <p className="text-sm text-white font-bold">
                      {new Date(lastInteraction).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mensagens Geradas */}
        {messages.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-black text-orange-400">3 Mensagens SPIN Personalizadas</h2>
            
            {messages.map((msg, idx) => (
              <Card
                key={idx}
                className="cursor-pointer transition-all border-orange-500/20 hover:border-orange-500/40"
                style={{ background: selectedMessageIdx === idx ? 'rgba(255,107,0,0.05)' : '#111' }}
                onClick={() => setSelectedMessageIdx(selectedMessageIdx === idx ? null : idx)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-xs font-bold text-orange-500 bg-orange-950 px-2 py-1 rounded">
                      OPÇÃO {idx + 1}
                    </span>
                    {client?.phone && (
                      <span className="text-xs text-orange-600">✓ Pronto para enviar</span>
                    )}
                  </div>

                  {/* Análise SPIN */}
                  {msg.spin_analysis && (
                    <div className="grid grid-cols-4 gap-2 mb-3 pb-3 border-b border-orange-500/10">
                      {msg.spin_analysis.situation && (
                        <div className="text-xs">
                          <p className="font-bold text-orange-400">SITUAÇÃO</p>
                          <p className="text-orange-200 text-[10px]">{msg.spin_analysis.situation}</p>
                        </div>
                      )}
                      {msg.spin_analysis.problem && (
                        <div className="text-xs">
                          <p className="font-bold text-orange-400">PROBLEMA</p>
                          <p className="text-orange-200 text-[10px]">{msg.spin_analysis.problem}</p>
                        </div>
                      )}
                      {msg.spin_analysis.implication && (
                        <div className="text-xs">
                          <p className="font-bold text-orange-400">IMPLICAÇÃO</p>
                          <p className="text-orange-200 text-[10px]">{msg.spin_analysis.implication}</p>
                        </div>
                      )}
                      {msg.spin_analysis.need_payoff && (
                        <div className="text-xs">
                          <p className="font-bold text-orange-400">BENEFÍCIO</p>
                          <p className="text-orange-200 text-[10px]">{msg.spin_analysis.need_payoff}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Mensagem */}
                  <p className="text-sm text-white leading-relaxed p-3 rounded" style={{ background: '#1a1a1a' }}>
                    {msg.text}
                  </p>

                  {/* Botões */}
                  {selectedMessageIdx === idx && (
                    <div className="flex gap-2 mt-4 pt-4 border-t border-orange-500/10">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyMessage(msg.text)}
                        className="flex-1 text-orange-400 border-orange-500/30"
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        Copiar
                      </Button>

                      {client?.phone && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowApproval(idx)}
                            className="flex-1 text-orange-400 border-orange-500/30"
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Aprovar
                          </Button>
                          <Button
                            size="sm"
                            className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                            onClick={() => sendWhatsApp(msg.text)}
                          >
                            <Send className="w-4 h-4 mr-1" />
                            WhatsApp Direto
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Modal Aprovação */}
        {showApproval !== false && messages[showApproval] && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.75)' }}>
            <Card className="w-full max-w-lg" style={{ background: '#111', border: '1px solid rgba(255,107,0,0.3)' }}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-black text-orange-400">Aprovar Envio?</h3>
                  <button onClick={() => setShowApproval(false)}>
                    <X className="w-5 h-5 text-orange-600" />
                  </button>
                </div>

                <p className="text-sm text-white p-3 rounded mb-4" style={{ background: '#1a1a1a' }}>
                  {messages[showApproval].text}
                </p>

                <p className="text-xs text-orange-600 mb-4">
                  Será enviado para: <strong>{client?.phone}</strong>
                </p>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowApproval(false)}
                    className="flex-1 border-orange-500/30"
                  >
                    Cancelar
                  </Button>
                  <Button
                    className="flex-1 bg-orange-600 hover:bg-orange-700"
                    onClick={() => approveAndSend(messages[showApproval].text)}
                  >
                    <Send className="w-4 h-4 mr-1" />
                    Enviar via WhatsApp
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Estado Vazio */}
        {!messages.length && client && !loading && (
          <div className="text-center py-12 text-orange-600/50">
            <p className="text-sm">Clique em "Buscar & Gerar" para criar mensagens SPIN</p>
          </div>
        )}
      </div>
    </div>
  );
}
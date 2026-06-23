import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  MessageSquare, Search, Phone,
  ChevronRight, CheckCircle, AlertCircle, Loader2,
  Zap, Copy, Check, ExternalLink, RefreshCw,
  Shield, X, Pencil
} from 'lucide-react';
import { toast } from 'sonner';

export default function WhatsAppHub() {
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [message, setMessage] = useState('');
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const [approvedMsg, setApprovedMsg] = useState('');
  const [openedMsg, setOpenedMsg] = useState(null); // { id, client, text } aguardando confirmação manual
  const [copied, setCopied] = useState(false);
  const urlParams = new URLSearchParams(window.location.search);
  const initialTab = ['enviar', 'pendentes', 'historico', 'contatos'].includes(urlParams.get('tab')) ? urlParams.get('tab') : 'enviar';
  const [activeTab, setActiveTab] = useState(initialTab);
  const queryClient = useQueryClient();

  const { data: clients = [] } = useQuery({
    queryKey: ['wa-clients'],
    queryFn: () => base44.entities.Client.filter({ phone: { $exists: true } }, '-updated_date', 50).catch(() => base44.entities.Client.list('-updated_date', 50)),
    staleTime: 5 * 60 * 1000,
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['wa-messages'],
    queryFn: () => base44.entities.WhatsAppMessage?.list('-created_date', 100).catch(() => []),
    staleTime: 30 * 1000,
  });

  const { data: pendingMessagesRaw = [] } = useQuery({
    queryKey: ['wa-pending'],
    queryFn: () => base44.entities.PendingMessage?.list('-created_date', 100).catch(() => []),
    staleTime: 15 * 1000,
  });
  const pendingMessages = pendingMessagesRaw.filter(m => ['pending', 'aguardando_aprovacao', 'rascunho', 'ready_to_send'].includes(m.status));

  const filteredClients = clients.filter(c =>
    c.phone && (
      !search ||
      c.first_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.clinic_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search)
    )
  );

  // ─── GERAÇÃO IA ───
  const handleGenerateAI = async () => {
    if (!selectedClient) { toast.error('Selecione um cliente'); return; }
    setGenerating(true);
    try {
      const res = await base44.functions.invoke('generateSpinSellingMessages', {
        client_id: selectedClient.id,
        client_name: selectedClient.first_name,
        clinic_name: selectedClient.clinic_name,
        equipment_interest: selectedClient.equipment_interest,
        status: selectedClient.status,
        pipeline_stage: selectedClient.pipeline_stage,
      });
      if (res?.data?.message || res?.data?.whatsapp_message) {
        setMessage(res.data.message || res.data.whatsapp_message);
        toast.success('Mensagem IA gerada! Revise antes de aprovar.');
      }
    } catch (e) {
      toast.error('Erro ao gerar: ' + e.message);
    } finally {
      setGenerating(false);
    }
  };

  // ─── APROVAR MENSAGEM ───
  const handleApprove = () => {
    if (!message.trim()) { toast.error('Escreva ou gere uma mensagem'); return; }
    setApprovedMsg(message);
    toast.success('✅ Mensagem aprovada! Agora você pode enviar.');
  };

  // ─── ENVIAR (só funciona após aprovação) ───
  const handleSend = async () => {
    if (!approvedMsg) { toast.error('Aprove a mensagem antes de enviar'); return; }
    if (!selectedClient) { toast.error('Selecione um cliente'); return; }

    setSending(true);
    try {
      // Registrar apenas que o WhatsApp foi ABERTO (não enviado). Confirmação é manual.
      const created = await base44.entities.WhatsAppMessage?.create({
        client_id: selectedClient.id,
        client_name: selectedClient.first_name,
        phone: selectedClient.phone,
        message: approvedMsg,
        status: 'whatsapp_opened',
        approved: true,
        approved_at: new Date().toISOString(),
      }).catch(() => null);

      // Abre WhatsApp
      const phone = selectedClient.phone.replace(/\D/g, '');
      const encoded = encodeURIComponent(approvedMsg);
      window.open(`https://wa.me/${phone}?text=${encoded}`, '_blank');

      setOpenedMsg({ id: created?.id || null, client: selectedClient, text: approvedMsg });
      toast.message('WhatsApp aberto', { description: 'Confirme abaixo após enviar de fato.' });
      setMessage('');
      setApprovedMsg('');
      queryClient.invalidateQueries(['wa-messages']);
    } catch (e) {
      toast.error('Erro: ' + e.message);
    } finally {
      setSending(false);
    }
  };

  // ─── CONFIRMAR ENVIO MANUAL (única forma de marcar como enviado) ───
  const handleConfirmSent = async () => {
    if (!openedMsg) return;
    try {
      if (openedMsg.id) {
        await base44.entities.WhatsAppMessage?.update(openedMsg.id, {
          status: 'manual_sent_confirmed',
        }).catch(() => {});
      }
      await base44.entities.EliteActionLog?.create({
        data_hora: new Date().toISOString(),
        cliente_id: openedMsg.client.id,
        ferramenta_usada: 'whatsapp_hub',
        acao_executada: 'whatsapp_envio_confirmado_manual',
        mensagem_gerada: openedMsg.text,
        aprovado_pelo_usuario: true,
        resultado: 'enviado_manual_confirmado',
      }).catch(() => {});
      toast.success('Envio confirmado e registrado!');
      setOpenedMsg(null);
      queryClient.invalidateQueries(['wa-messages']);
    } catch (e) {
      toast.error('Erro: ' + e.message);
    }
  };

  // ─── APROVAR MSG PENDENTE ───
  const handleApprovePending = async (msg) => {
    try {
      await base44.entities.PendingMessage?.update(msg.id, {
        status: 'approved',
        approved_at: new Date().toISOString(),
      }).catch(() => {});
      toast.success('Mensagem aprovada!');
      queryClient.invalidateQueries(['wa-pending']);
    } catch (e) {
      toast.error('Erro: ' + e.message);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copiado!');
  };

  const openPendingWhatsApp = (msg) => {
    const phone = (msg.phone || msg.destinatario_contato || msg.recipient_phone || '').replace(/\D/g, '');
    const text = encodeURIComponent(msg.message || msg.content || msg.mensagem || msg.message_content || '');
    if (!phone || !text) { toast.error('Telefone ou mensagem ausente.'); return; }
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  };

  // Histórico filtrado por cliente
  const clientMessages = selectedClient
    ? messages.filter(m => m.client_id === selectedClient.id)
    : messages;

  return (
    <div className="min-h-screen pb-24" style={{ background: '#0a0a0a' }}>
      <div className="px-4 pt-5 pb-3">
        <h1 className="text-xl font-black text-white mb-0.5">💬 WhatsApp Hub</h1>
        <p className="text-[10px] text-green-600 font-bold uppercase tracking-widest mb-4">
          Aprovação Obrigatória • Histórico Total • Modo Seguro
        </p>

        {/* Alerta pendentes */}
        {pendingMessages.length > 0 && (
          <div className="rounded-xl p-3 mb-3 flex items-center justify-between"
            style={{ background: 'rgba(255,149,0,0.08)', border: '1px solid rgba(255,149,0,0.3)' }}>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-orange-400" />
              <p className="text-xs font-bold text-orange-400">{pendingMessages.length} mensagens aguardando aprovação</p>
            </div>
            <button onClick={() => setActiveTab('pendentes')}
              className="text-xs text-orange-300 underline">Ver</button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 rounded-xl p-1 mb-4" style={{ background: '#111', border: '1px solid rgba(0,255,136,0.1)' }}>
          {[
            { key: 'enviar', label: '✉️ Enviar' },
            { key: 'pendentes', label: `⏳ Pendentes${pendingMessages.length > 0 ? ` (${pendingMessages.length})` : ''}` },
            { key: 'historico', label: '📋 Histórico' },
            { key: 'contatos', label: '👥 Contatos' },
          ].map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)}
              className="flex-1 py-1.5 rounded-lg text-[10px] font-black transition-all"
              style={activeTab === t.key
                ? { background: '#25d366', color: 'white' }
                : { color: '#555' }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4">

        {/* ── TAB: ENVIAR ── */}
        {activeTab === 'enviar' && (
          <div className="space-y-3">
            {/* Busca cliente */}
            <div className="rounded-2xl p-3" style={{ background: '#111', border: '1px solid rgba(0,255,136,0.2)' }}>
              <p className="text-xs font-black text-green-400 mb-2">👤 Destinatário</p>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-green-600" />
                <input
                  value={search}
                  onChange={e => { setSearch(e.target.value); if (selectedClient) setSelectedClient(null); }}
                  placeholder="Buscar cliente com WhatsApp..."
                  className="w-full pl-8 pr-3 h-9 rounded-xl text-xs focus:outline-none"
                  style={{ background: '#1a1a1a', border: '1px solid rgba(0,255,136,0.2)', color: '#e2e8f0' }}
                />
              </div>

              {/* Dropdown clientes */}
              {search && !selectedClient && filteredClients.length > 0 && (
                <div className="mt-2 rounded-xl overflow-hidden" style={{ border: '1px solid rgba(0,255,136,0.15)' }}>
                  {filteredClients.slice(0, 5).map(c => (
                    <button key={c.id} onClick={() => { setSelectedClient(c); setSearch(''); }}
                      className="w-full flex items-center justify-between px-3 py-2 hover:opacity-80 border-b last:border-0"
                      style={{ background: '#141414', borderColor: 'rgba(0,255,136,0.1)' }}>
                      <div className="text-left">
                        <p className="text-xs font-bold text-white">{c.first_name}</p>
                        <p className="text-[10px] text-slate-500">{c.clinic_name} • {c.phone}</p>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-green-600" />
                    </button>
                  ))}
                </div>
              )}

              {/* Cliente selecionado */}
              {selectedClient && (
                <div className="mt-2 rounded-xl px-3 py-2 flex items-center justify-between"
                  style={{ background: 'rgba(37,211,102,0.08)', border: '1px solid rgba(37,211,102,0.3)' }}>
                  <div>
                    <p className="text-xs font-black text-green-400">{selectedClient.first_name}</p>
                    <p className="text-[10px] text-slate-500">{selectedClient.clinic_name} • {selectedClient.phone}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <a href={`https://wa.me/${selectedClient.phone?.replace(/\D/g, '')}`}
                      target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-3.5 h-3.5 text-green-500" />
                    </a>
                    <button onClick={() => setSelectedClient(null)}>
                      <X className="w-3.5 h-3.5 text-slate-500" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mensagem */}
            <div className="rounded-2xl p-3" style={{ background: '#111', border: '1px solid rgba(0,255,136,0.2)' }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-black text-green-400">✏️ Mensagem</p>
                <button
                  onClick={handleGenerateAI}
                  disabled={!selectedClient || generating}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black disabled:opacity-40"
                  style={{ background: 'rgba(168,85,247,0.15)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.3)' }}>
                  {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                  {generating ? 'Gerando...' : 'Gerar com IA'}
                </button>
              </div>
              <textarea
                value={message}
                onChange={e => { setMessage(e.target.value); setApprovedMsg(''); }}
                placeholder="Digite ou gere a mensagem..."
                rows={5}
                className="w-full text-xs focus:outline-none resize-none rounded-xl p-3"
                style={{ background: '#1a1a1a', border: '1px solid rgba(0,255,136,0.15)', color: '#e2e8f0' }}
              />
              <p className="text-[10px] text-slate-600 mt-1">{message.length} caracteres</p>
            </div>

            {/* Zona de aprovação */}
            <div className="rounded-2xl p-3" style={{
              background: approvedMsg ? 'rgba(0,255,136,0.05)' : 'rgba(255,107,0,0.05)',
              border: `1px solid ${approvedMsg ? 'rgba(0,255,136,0.4)' : 'rgba(255,107,0,0.3)'}`,
            }}>
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4" style={{ color: approvedMsg ? '#00ff88' : '#ff9500' }} />
                <p className="text-xs font-black" style={{ color: approvedMsg ? '#00ff88' : '#ff9500' }}>
                {approvedMsg ? '✅ Texto aprovado — Aprovar texto › Abrir WhatsApp › Confirmar que enviei' : '⚠️ Aprovar texto antes de abrir o WhatsApp'}
                </p>
              </div>
              {!approvedMsg ? (
                <button
                  onClick={handleApprove}
                  disabled={!message.trim()}
                  className="w-full py-2.5 rounded-xl text-sm font-black disabled:opacity-40 transition-all"
                  style={{ background: 'rgba(255,107,0,0.2)', color: '#ff9500', border: '1px solid rgba(255,107,0,0.4)' }}>
                  ✅ Aprovar texto
                </button>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-green-300 italic px-2 py-1 rounded-lg"
                    style={{ background: 'rgba(0,255,136,0.08)' }}>
                    "{approvedMsg.slice(0, 100)}{approvedMsg.length > 100 ? '...' : ''}"
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSend}
                      disabled={!selectedClient || sending}
                      className="flex-1 py-2.5 rounded-xl text-sm font-black disabled:opacity-40 flex items-center justify-center gap-2"
                      style={{ background: '#25d366', color: 'white' }}>
                      {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                      {sending ? 'Abrindo...' : 'Abrir WhatsApp'}
                    </button>
                    <button
                      onClick={() => { handleCopy(approvedMsg); }}
                      className="px-3 py-2.5 rounded-xl"
                      style={{ background: 'rgba(0,255,136,0.1)', color: '#00ff88', border: '1px solid rgba(0,255,136,0.2)' }}>
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => setApprovedMsg('')}
                      className="px-3 py-2.5 rounded-xl"
                      style={{ background: 'rgba(255,68,68,0.1)', color: '#ff4444', border: '1px solid rgba(255,68,68,0.2)' }}>
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Confirmação de envio manual */}
            {openedMsg && (
              <div className="rounded-2xl p-3" style={{ background: 'rgba(37,211,102,0.06)', border: '1px solid rgba(37,211,102,0.4)' }}>
                <p className="text-xs font-black text-green-400 mb-1">📲 WhatsApp aberto para {openedMsg.client.first_name}</p>
                <p className="text-[10px] text-slate-400 mb-2">O histórico só marca como ENVIADO depois que você confirmar.</p>
                <div className="flex gap-2">
                  <button onClick={handleConfirmSent}
                    className="flex-1 py-2.5 rounded-xl text-sm font-black flex items-center justify-center gap-2"
                    style={{ background: '#25d366', color: 'white' }}>
                    <CheckCircle className="w-4 h-4" /> Confirmar que enviei
                  </button>
                  <button onClick={() => setOpenedMsg(null)}
                    className="px-3 py-2.5 rounded-xl"
                    style={{ background: 'rgba(255,68,68,0.1)', color: '#ff4444', border: '1px solid rgba(255,68,68,0.2)' }}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Templates */}
            <div className="rounded-2xl p-3" style={{ background: '#111', border: '1px solid rgba(0,255,136,0.1)' }}>
              <p className="text-xs font-black text-green-400 mb-2">📋 Templates Rápidos</p>
              {[
                { label: 'Apresentação', text: 'Olá! Sou Nathan, Consultor Técnico da CMAT Brasil. Gostaria de apresentar nossos equipamentos laboratoriais Seamaty para sua clínica. Posso agendar uma demonstração?' },
                { label: 'Follow-up', text: 'Olá! Passando para verificar se surgiu alguma dúvida sobre os equipamentos Seamaty que apresentamos. Fico à disposição! 😊' },
                { label: 'Proposta enviada', text: 'Acabei de enviar uma proposta personalizada para você. Assim que tiver oportunidade, dê uma olhada e me retorne com qualquer dúvida!' },
              ].map(tpl => (
                <div key={tpl.label} className="flex items-center justify-between py-2 border-b last:border-0"
                  style={{ borderColor: 'rgba(0,255,136,0.08)' }}>
                  <div className="flex-1 mr-2">
                    <p className="text-xs font-bold text-white">{tpl.label}</p>
                    <p className="text-[10px] text-slate-500 truncate">{tpl.text.slice(0, 50)}...</p>
                  </div>
                  <button onClick={() => { setMessage(tpl.text); setApprovedMsg(''); }}
                    className="text-[10px] px-2.5 py-1 rounded-lg font-bold"
                    style={{ background: 'rgba(0,255,136,0.1)', color: '#00ff88', border: '1px solid rgba(0,255,136,0.2)' }}>
                    Usar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB: PENDENTES ── */}
        {activeTab === 'pendentes' && (
          <div className="space-y-2">
            {pendingMessages.length === 0 && (
              <div className="text-center py-8">
                <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-sm text-slate-600">Nenhuma mensagem pendente!</p>
              </div>
            )}
            {pendingMessages.map(msg => (
              <div key={msg.id} className="rounded-xl p-3" style={{ background: '#111', border: '1px solid rgba(255,149,0,0.25)' }}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-xs font-black text-white">{msg.client_name || msg.destinatario_nome || msg.recipient_name || 'Cliente'}</p>
                    <p className="text-[10px] text-slate-500">{msg.phone || msg.destinatario_contato || msg.recipient_phone}</p>
                  </div>
                  <span className="text-[9px] px-2 py-0.5 rounded-full font-bold"
                    style={{ background: 'rgba(255,149,0,0.15)', color: '#ff9500' }}>{msg.status || 'aguardando_aprovacao'}</span>
                </div>
                <p className="text-xs text-slate-300 mb-3 p-2 rounded-lg" style={{ background: '#1a1a1a' }}>
                  {msg.message || msg.content || msg.mensagem || msg.message_content}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={() => handleApprovePending(msg)}
                    className="py-3 rounded-xl text-xs font-black"
                    style={{ background: '#25d366', color: 'white' }}>
                    Aprovar texto
                  </button>
                  <button onClick={() => { handleCopy(msg.message || msg.content || msg.mensagem || msg.message_content || ''); }}
                    className="py-3 rounded-xl flex items-center justify-center gap-1 text-xs font-black"
                    style={{ background: 'rgba(0,255,136,0.1)', color: '#00ff88', border: '1px solid rgba(0,255,136,0.2)' }}>
                    <Copy className="w-4 h-4" /> Copiar
                  </button>
                  <button onClick={() => openPendingWhatsApp(msg)}
                    className="py-3 rounded-xl flex items-center justify-center gap-1 text-xs font-black"
                    style={{ background: 'rgba(37,211,102,0.18)', color: '#25d366', border: '1px solid rgba(37,211,102,0.35)' }}>
                    <ExternalLink className="w-4 h-4" /> Abrir WhatsApp
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── TAB: HISTÓRICO ── */}
        {activeTab === 'historico' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-slate-500">{clientMessages.length} mensagens{selectedClient ? ` de ${selectedClient.first_name}` : ''}</p>
              <button onClick={() => queryClient.invalidateQueries(['wa-messages'])}
                className="text-[10px] text-green-500 flex items-center gap-1">
                <RefreshCw className="w-3 h-3" /> Atualizar
              </button>
            </div>
            {clientMessages.slice(0, 30).map(msg => (
              <div key={msg.id} className="rounded-xl p-3" style={{ background: '#111', border: '1px solid rgba(0,255,136,0.1)' }}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-bold text-white">{msg.client_name || 'Cliente'}</p>
                  <div className="flex items-center gap-2">
                    {msg.approved && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                        style={{ background: 'rgba(0,255,136,0.1)', color: '#00ff88' }}>✅ aprovado</span>
                    )}
                    <span className="text-[9px] text-slate-600">
                      {msg.created_date ? new Date(msg.created_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : ''}
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400">{(msg.message || msg.content || '').slice(0, 120)}</p>
              </div>
            ))}
            {clientMessages.length === 0 && (
              <div className="text-center py-8 text-slate-600 text-sm">Nenhum histórico encontrado.</div>
            )}
          </div>
        )}

        {/* ── TAB: CONTATOS ── */}
        {activeTab === 'contatos' && (
          <div className="space-y-2">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-green-600" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar contato..."
                className="w-full pl-8 h-9 rounded-xl text-xs focus:outline-none"
                style={{ background: '#111', border: '1px solid rgba(0,255,136,0.2)', color: '#e2e8f0' }}
              />
            </div>
            {filteredClients.slice(0, 50).map(c => (
              <div key={c.id} className="rounded-xl p-3 flex items-center justify-between"
                style={{ background: '#111', border: '1px solid rgba(0,255,136,0.1)' }}>
                <div>
                  <p className="text-xs font-bold text-white">{c.first_name}</p>
                  <p className="text-[10px] text-slate-500">{c.clinic_name}</p>
                  <p className="text-[10px] text-green-600 flex items-center gap-1 mt-0.5">
                    <Phone className="w-2.5 h-2.5" />{c.phone}
                  </p>
                </div>
                <div className="flex gap-2">
                  <a href={`https://wa.me/${c.phone?.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: '#25d366', color: 'white' }}>
                      <MessageSquare className="w-3.5 h-3.5" />
                    </div>
                  </a>
                  <button onClick={() => { setSelectedClient(c); setActiveTab('enviar'); }}
                    title="Preparar mensagem"
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.2)', color: '#00ff88' }}>
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
            {filteredClients.length === 0 && (
              <p className="text-center py-6 text-slate-600 text-sm">Nenhum contato com WhatsApp cadastrado.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
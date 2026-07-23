import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Phone, MapPin, Building2, Star, MessageSquare,
  Calendar, TrendingUp, Target, Edit3, CheckCircle, Clock,
  Zap, Globe, Instagram, Loader2, ShieldCheck, FileText,
  Link2, ClipboardCheck, ThumbsUp, ThumbsDown, RefreshCw, Paperclip,
  Flag, Bell, Cpu, X,
  ExternalLink, Download, Image, Lock, CheckSquare
} from 'lucide-react';
import { toast } from 'sonner';
import AbordagemInteligente from '@/components/AbordagemInteligente';
import ConversationSentimentPanel from '@/components/sentiment/ConversationSentimentPanel';

// ── Constantes ──────────────────────────────────────────────────────────────
const STATUS_COLORS = { quente: '#ff4444', morno: '#ff9500', frio: '#64748b' };
const STAGE_LABELS = {
  lead: 'Lead', qualificado: 'Qualificado', proposta: 'Proposta',
  negociacao: 'Negociação', fechado: 'Fechado', perdido: 'Perdido'
};
const STAGE_COLORS = {
  lead: '#64748b', qualificado: '#3b82f6', proposta: '#f59e0b',
  negociacao: '#f97316', fechado: '#22c55e', perdido: '#ef4444'
};

// FONTE REAL: conectores validados visualmente na interface Base44
// Status: ativo_visual = aparece conectado na UI | nao_testado_em_fluxo = conectado mas sem teste de operação real
const CONECTORES_STATUS = [
  { nome: 'Google Calendar', status: 'ativo_testado', icon: '📅', nota: 'Sync de visitas funcional' },
  { nome: 'Google Slides', status: 'ativo_testado', icon: '📊', nota: 'Proposta/slides funcional' },
  { nome: 'Notion', status: 'ativo_testado', icon: '📓', nota: 'Workspace connector registrado' },
  { nome: 'Gmail', status: 'ativo_visual_nao_testado', icon: '✉️', nota: 'Ativo na UI — leitura real não testada ainda' },
  { nome: 'Google Drive', status: 'ativo_visual_nao_testado', icon: '💾', nota: 'Ativo na UI — upload/PDF não testado ainda' },
  { nome: 'Google Docs', status: 'ativo_visual_nao_testado', icon: '📄', nota: 'Ativo na UI — criação de docs não testada' },
  { nome: 'Google Sheets', status: 'ativo_visual_nao_testado', icon: '📋', nota: 'Ativo na UI — leitura de planilha não testada' },
  { nome: 'Instagram Business', status: 'ativo_visual_nao_testado', icon: '📸', nota: 'Ativo na UI — cruzamento real não testado' },
  { nome: 'Google Analytics', status: 'ativo_visual_nao_testado', icon: '📈', nota: 'Ativo na UI — tracking de evento não testado' },
  { nome: 'Google Search Console', status: 'ativo_visual_nao_testado', icon: '🔍', nota: 'Ativo na UI' },
  { nome: 'LinkedIn', status: 'ativo_visual_nao_testado', icon: '💼', nota: 'Ativo na UI' },
  { nome: 'GitHub', status: 'ativo_visual_nao_testado', icon: '🐙', nota: 'Ativo na UI' },
  { nome: 'Outlook', status: 'ativo_visual_nao_testado', icon: '📧', nota: 'Ativo na UI' },
  { nome: 'Dropbox', status: 'ativo_visual_nao_testado', icon: '📦', nota: 'Ativo na UI' },
  { nome: 'TikTok', status: 'ativo_visual_nao_testado', icon: '🎵', nota: 'Ativo na UI' },
];

// ── Componente Principal ────────────────────────────────────────────────────
export default function ClienteDetalhe360() {
  const params = new URLSearchParams(window.location.search);
  const clientId = params.get('id');
  const qc = useQueryClient();

  // Estados locais
  const [activeTab, setActiveTab] = useState('visao_geral');
  const [showAprovModal, setShowAprovModal] = useState(false);
  const [msgParaAprov, setMsgParaAprov] = useState('');
  const [approvalQueue, setApprovalQueue] = useState([]);
  const [printPreview, setPrintPreview] = useState(null);
  const [showConectores, setShowConectores] = useState(false);
  const [loadingAction, setLoadingAction] = useState(null);
  const fileInputRef = useRef(null);

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: client, isLoading } = useQuery({
    queryKey: ['c360-client', clientId],
    queryFn: () => base44.entities.Client.get(clientId),
    enabled: !!clientId,
    staleTime: 2 * 60 * 1000,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['c360-tasks', clientId],
    queryFn: () => base44.entities.Task.filter({ client_id: clientId }),
    enabled: !!clientId,
    staleTime: 60000,
  });

  const { data: visits = [] } = useQuery({
    queryKey: ['c360-visits', clientId],
    queryFn: () => base44.entities.Visit.filter({ client_id: clientId }),
    enabled: !!clientId,
    staleTime: 60000,
  });

  // ── Mutations ──────────────────────────────────────────────────────────────
  const updateClient = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Client.update(id, data),
    onSuccess: () => qc.invalidateQueries(['c360-client', clientId]),
  });

  // ── Utilitário: URL segura ─────────────────────────────────────────────────
  const safeOpenUrl = (rawUrl, label = 'site') => {
    if (!rawUrl || !rawUrl.trim()) {
      toast.error(`${label} não cadastrado neste cliente`);
      return;
    }
    let url = rawUrl.trim().replace(/\s+/g, '');
    // Adiciona protocolo se ausente
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }
    // Valida formato mínimo de URL
    try {
      const parsed = new URL(url);
      if (!parsed.hostname || !parsed.hostname.includes('.')) throw new Error('domínio inválido');
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      toast.error(`⚠️ Site não validado: "${rawUrl}". Verifique o link no cadastro antes de abrir.`);
    }
  };

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleUpdateStage = async (stage) => {
    await updateClient.mutateAsync({ id: client.id, data: { pipeline_stage: stage } });
    toast.success(`Funil: ${STAGE_LABELS[stage]}`);
  };

  const handleGerarProposta = () => {
    window.location.href = `/ProposalGenerator?client_id=${client.id}`;
  };

  const handleGerarSPIN = () => {
    window.location.href = `/GenerateWhatsAppIntegrated?client_id=${client.id}`;
  };

  const handleVerMapa = () => {
    const addr = encodeURIComponent(client.address || client.city || 'Marília SP');
    window.open(`https://maps.google.com/?q=${addr}`, '_blank', 'noopener,noreferrer');
  };

  const handleAbrirInstagram = () => {
    if (!client?.instagram_handle) { toast.error('Sem Instagram cadastrado'); return; }
    const handle = client.instagram_handle.replace('@', '').trim();
    window.open(`https://instagram.com/${handle}`, '_blank', 'noopener,noreferrer');
  };

  const handleGerarPDF = async () => {
    setLoadingAction('pdf');
    try {
      const res = await base44.functions.invoke('generatePDFForWhatsApp', {
        client_id: client.id,
        client_name: client.first_name,
        clinic_name: client.clinic_name,
        equipment: client.equipment_interest || client.equipment_sold || client.current_equipment || '',
      });
      const url = res.data?.pdf_url || res.data?.url;
      if (url) {
        window.open(url, '_blank');
        toast.success('PDF gerado!');
      } else {
        toast.info('PDF em processamento — verifique em instantes');
      }
    } catch {
      toast.error('Erro ao gerar PDF');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleGerarLink = async () => {
    setLoadingAction('link');
    try {
      const trackingUrl = `https://nr22888.base44.app/ProposalGenerator?client_id=${client.id}&utm_source=crm&utm_medium=whatsapp&utm_campaign=proposta_360`;
      await navigator.clipboard.writeText(trackingUrl);
      toast.success('Link rastreável copiado!');
    } catch {
      toast.error('Erro ao copiar link');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleCriarMensagem = async () => {
    setLoadingAction('msg');
    try {
      const res = await base44.functions.invoke('generateSpinSellingMessages', {
        client_id: client.id,
        client_name: client.first_name,
        clinic_name: client.clinic_name,
        equipment_interest: client.equipment_interest,
      });
      const msg = res.data?.message || res.data?.spin_message || '';
      setMsgParaAprov(msg);
      toast.success('Mensagem gerada — revise antes de enviar');
    } catch {
      toast.error('Erro ao gerar mensagem');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleEnviarParaAprovacao = () => {
    if (!msgParaAprov.trim()) {
      toast.error('Escreva ou gere uma mensagem antes de enviar para aprovação');
      return;
    }
    const item = {
      id: Date.now(),
      text: msgParaAprov,
      status: 'aguardando',
      criadoEm: new Date().toLocaleTimeString('pt-BR'),
    };
    setApprovalQueue(prev => [item, ...prev]);
    toast.success('Mensagem enviada para fila de aprovação do Nathan');
    setMsgParaAprov('');
  };

  const handleAprovar = (id) => {
    // Aprovar apenas muda status — NÃO abre WhatsApp automaticamente
    setApprovalQueue(prev => prev.map(i => i.id === id ? { ...i, status: 'aprovado_aguardando_envio_manual', envio_realizado: false, canal: 'whatsapp_pre_preenchido' } : i));
    toast.success('✅ Aprovado por Nathan — clique em "Abrir WhatsApp" para enviar manualmente');
  };

  const handleAbrirWhatsAppManual = (id) => {
    const item = approvalQueue.find(i => i.id === id);
    if (!item || !client?.phone) { toast.error('Sem telefone cadastrado'); return; }
    const phone = client.phone.replace(/\D/g, '');
    if (!phone) { toast.error('Telefone inválido para WhatsApp'); return; }
    const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(item.text)}`;
    window.open(waUrl, '_blank');
    // Abre WhatsApp mas NÃO marca envio como realizado — apenas registra que foi aberto
    setApprovalQueue(prev => prev.map(i => i.id === id ? {
      ...i,
      whatsapp_aberto: true,
      envio_realizado: false,        // permanece false — só muda após confirmação manual
      envio_confirmado_manual: false,
      status: 'whatsapp_aberto_aguardando_envio_manual_nathan',
      canal: 'whatsapp_pre_preenchido',
    } : i));
    toast.info('📱 WhatsApp aberto — texto pré-preenchido. Você ainda precisa apertar ENVIAR no WhatsApp.');
  };

  const handleConfirmarEnvioManual = (id) => {
    setApprovalQueue(prev => prev.map(i => i.id === id ? {
      ...i,
      envio_realizado: true,
      envio_confirmado_manual: true,
      status: 'enviado_manual_confirmado_por_nathan',
      data_confirmacao_envio: new Date().toLocaleString('pt-BR'),
    } : i));
    toast.success('✅ Envio confirmado manualmente por Nathan — registrado no log.');
  };

  const handleReprovar = (id) => {
    setApprovalQueue(prev => prev.map(i => i.id === id ? { ...i, status: 'reprovada' } : i));
    toast.error('Mensagem reprovada');
  };

  const handlePedirNovaVersao = (id) => {
    setApprovalQueue(prev => prev.filter(i => i.id !== id));
    setMsgParaAprov('');
    toast.info('Solicitada nova versão — edite e reenvie');
  };

  const handleTentarEnviarSemAprovacao = () => {
    toast.error('🔒 BLOQUEADO — Envio direto não permitido. Use "Enviar para Aprovação" primeiro.');
  };

  const handleAnexarPrint = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Apenas imagens'); return; }
    setLoadingAction('print');
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setPrintPreview(file_url);
      toast.success('Print salvo com sucesso!');
    } catch {
      toast.error('Erro ao salvar print');
    } finally {
      setLoadingAction(null);
      e.target.value = '';
    }
  };

  const handleMarcarPrioridade = async () => {
    await updateClient.mutateAsync({ id: client.id, data: { status: 'quente', priority_level: 1 } });
    toast.success('🔥 Cliente marcado como QUENTE — Prioridade 1');
  };

  const handleCriarFollowUp = async () => {
    await base44.entities.Task.create({
      client_id: client.id,
      client_name: client.clinic_name || client.first_name,
      title: `Follow-up SEAMATY — ${client.clinic_name || client.first_name || 'cliente'}`,
      type: 'follow_up',
      priority: 'alta',
      status: 'pendente',
      due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });
    qc.invalidateQueries(['c360-tasks', clientId]);
    toast.success('Follow-up criado para 3 dias!');
  };

  const handleValidarIdentidade = async () => {
    if (!client?.cnpj && !client?.cpf) {
      toast.info('Sem CNPJ/CPF cadastrado para validar — adicione no perfil do cliente');
      return;
    }
    setLoadingAction('cnpj');
    try {
      const res = await base44.functions.invoke('consultarCNPJScore', {
        cnpj: client.cnpj || client.cpf,
        client_id: client.id,
      });
      toast.success(`Identidade validada — Score: ${res.data?.score_estimado || 'calculado'}`);
    } catch {
      toast.error('Erro na validação — CNPJ não encontrado ou inválido');
    } finally {
      setLoadingAction(null);
    }
  };

  // ── Guards ─────────────────────────────────────────────────────────────────
  if (!clientId) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0a' }}>
      <p className="text-red-400">ID de cliente não informado. <Link to="/Clients" className="text-orange-400 underline">← Clientes</Link></p>
    </div>
  );

  if (isLoading) return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
      <div className="px-4 pt-5 flex items-center gap-3">
        <Link to="/Clients"><ArrowLeft className="w-5 h-5 text-orange-400" /></Link>
        <div className="h-5 w-40 rounded animate-pulse" style={{ background: '#1a1a1a' }} />
      </div>
      <div className="px-4 mt-4 space-y-3">
        {[1,2,3,4].map(i => <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: '#1a1a1a' }} />)}
      </div>
    </div>
  );

  if (!client) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0a' }}>
      <p className="text-red-400">Cliente não encontrado. <Link to="/Clients" className="text-orange-400 underline">← Clientes</Link></p>
    </div>
  );

  const statusColor = STATUS_COLORS[client.status] || '#ff9500';
  const stageColor = STAGE_COLORS[client.pipeline_stage] || '#64748b';
  const pendingApproval = approvalQueue.filter(i => i.status === 'aguardando');

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen pb-24" style={{ background: '#0a0a0a' }}>
      {/* ── INPUT FILE oculto ── */}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

      {/* ── HEADER ── */}
      <div className="sticky top-0 z-20 px-4 pt-4 pb-3" style={{ background: 'rgba(10,10,10,0.97)', borderBottom: '1px solid rgba(255,107,0,0.15)' }}>
        <div className="flex items-center gap-3">
          <Link to="/Clients">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#1a1a1a', border: '1px solid rgba(255,107,0,0.2)' }}>
              <ArrowLeft className="w-4 h-4 text-orange-400" />
            </div>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-black text-white truncate">{client.clinic_name || client.first_name}</h1>
            <p className="text-[10px] text-slate-500 truncate">{client.first_name} · {client.city}</p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] px-2 py-0.5 rounded-full font-black"
              style={{ background: `${statusColor}20`, color: statusColor, border: `1px solid ${statusColor}40` }}>
              {client.status?.toUpperCase()}
            </span>
            {pendingApproval.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-yellow-500 text-black text-[10px] font-black flex items-center justify-center">
                {pendingApproval.length}
              </span>
            )}
          </div>
        </div>

        {/* Indicador de modo seguro — apenas interno */}
        {client.sale_closed && (
          <div className="mt-2 px-2 py-1 rounded-lg flex items-center gap-2" style={{ background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.25)' }}>
            <CheckCircle className="w-3 h-3 text-green-400 shrink-0" />
            <span className="text-[9px] text-green-400 font-black">Venda fechada — aguardando entrega</span>
          </div>
        )}
      </div>

      {/* ── SCORES RÁPIDOS ── */}
      <div className="px-4 pt-3">
        <div className="grid grid-cols-4 gap-1.5 mb-3">
          <div className="rounded-xl p-2 text-center" style={{ background: '#111', border: '1px solid rgba(255,68,68,0.25)' }}>
            <p className="text-lg font-black" style={{ color: '#ff4444' }}>{client.purchase_score || 0}</p>
            <p className="text-[8px] text-slate-500 uppercase">Score</p>
          </div>
          <div className="rounded-xl p-2 text-center" style={{ background: '#111', border: `1px solid ${stageColor}40` }}>
            <p className="text-[10px] font-black capitalize" style={{ color: stageColor }}>{STAGE_LABELS[client.pipeline_stage] || 'Lead'}</p>
            <p className="text-[8px] text-slate-500 uppercase">Funil</p>
          </div>
          <div className="rounded-xl p-2 text-center" style={{ background: '#111', border: '1px solid rgba(34,197,94,0.25)' }}>
            <p className="text-lg font-black text-green-400">{client.health_score || 0}</p>
            <p className="text-[8px] text-slate-500 uppercase">Health</p>
          </div>
          <div className="rounded-xl p-2 text-center" style={{ background: '#111', border: '1px solid rgba(255,149,0,0.25)' }}>
            <p className="text-lg font-black text-orange-400">{tasks.length}</p>
            <p className="text-[8px] text-slate-500 uppercase">Tarefas</p>
          </div>
        </div>

        {/* ── TABS ── */}
        <div className="flex gap-1 overflow-x-auto pb-1 mb-3 scrollbar-hide">
          {[
            { id: 'visao_geral', label: '📋 Geral' },
            { id: 'proposta', label: '💼 Proposta' },
            { id: 'mensagens', label: '💬 Mensagens' },
            { id: 'aprovacao', label: `✅ Aprovação${pendingApproval.length > 0 ? ` (${pendingApproval.length})` : ''}` },
            { id: 'anexos', label: '📎 Anexos' },
            { id: 'mapa', label: '🗺️ Mapa' },
            { id: 'alertas', label: '⚠️ Alertas' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className="whitespace-nowrap px-3 py-1.5 rounded-xl text-[10px] font-black shrink-0 transition-all"
              style={{
                background: activeTab === tab.id ? 'rgba(255,107,0,0.15)' : '#111',
                border: `1px solid ${activeTab === tab.id ? 'rgba(255,107,0,0.5)' : '#222'}`,
                color: activeTab === tab.id ? '#ff6b00' : '#666',
              }}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── BOTÕES DE AÇÃO PRINCIPAIS ── */}
      <div className="px-4 mb-3">
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { label: 'Validar ID', icon: ShieldCheck, color: '#a78bfa', action: handleValidarIdentidade, key: 'cnpj' },
            { label: 'Ver Mapa', icon: MapPin, color: '#60a5fa', action: handleVerMapa, key: 'mapa' },
            { label: 'Instagram', icon: Instagram, color: '#f472b6', action: handleAbrirInstagram, key: 'insta' },
            { label: 'SPIN', icon: Zap, color: '#fbbf24', action: handleGerarSPIN, key: 'spin' },
          ].map(btn => (
            <button key={btn.key} onClick={btn.action} disabled={loadingAction === btn.key}
              className="py-2 rounded-xl flex flex-col items-center gap-0.5 transition-all active:scale-95 disabled:opacity-50"
              style={{ background: `${btn.color}15`, border: `1px solid ${btn.color}40` }}>
              {loadingAction === btn.key
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: btn.color }} />
                : <btn.icon className="w-3.5 h-3.5" style={{ color: btn.color }} />}
              <span className="text-[9px] font-black" style={{ color: btn.color }}>{btn.label}</span>
            </button>
          ))}
        </div>
        <div className="grid grid-cols-4 gap-1.5 mt-1.5">
          {[
            { label: 'Proposta', icon: FileText, color: '#fb923c', action: handleGerarProposta, key: 'prop' },
            { label: 'Gerar PDF', icon: Download, color: '#34d399', action: handleGerarPDF, key: 'pdf' },
            { label: 'Link Trac.', icon: Link2, color: '#38bdf8', action: handleGerarLink, key: 'link' },
            { label: 'Prioridade', icon: Flag, color: '#f87171', action: handleMarcarPrioridade, key: 'prio' },
          ].map(btn => (
            <button key={btn.key} onClick={btn.action} disabled={loadingAction === btn.key}
              className="py-2 rounded-xl flex flex-col items-center gap-0.5 transition-all active:scale-95 disabled:opacity-50"
              style={{ background: `${btn.color}15`, border: `1px solid ${btn.color}40` }}>
              {loadingAction === btn.key
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: btn.color }} />
                : <btn.icon className="w-3.5 h-3.5" style={{ color: btn.color }} />}
              <span className="text-[9px] font-black" style={{ color: btn.color }}>{btn.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── CONTEÚDO POR TAB ── */}
      <div className="px-4 space-y-3">

        {/* ━━ TAB: VISÃO GERAL ━━ */}
        {activeTab === 'visao_geral' && (
          <>
            {/* Dados do cliente */}
            <div className="rounded-2xl p-4" style={{ background: '#111', border: '1px solid rgba(255,107,0,0.15)' }}>
              <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-3">📋 Dados do Cliente</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                {[
                  { icon: Building2, label: 'Clínica', value: client.clinic_name },
                  { icon: Phone, label: 'Telefone', value: client.phone },
                  { icon: MapPin, label: 'Cidade', value: client.city },
                  { icon: Star, label: 'Rep', value: client.representante },
                  { icon: TrendingUp, label: 'Interesse', value: client.equipment_interest },
                  { icon: Cpu, label: 'Atual', value: client.current_equipment },
                ].filter(f => f.value).map((f, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <f.icon className="w-3 h-3 text-slate-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[8px] text-slate-600 uppercase">{f.label}</p>
                      <p className="text-xs text-slate-300 truncate">{f.value}</p>
                    </div>
                  </div>
                ))}
              </div>
              {client.website && (
                <button onClick={() => safeOpenUrl(client.website, 'Site')}
                  className="mt-2 flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors">
                  <Globe className="w-3 h-3" />{client.website}
                </button>
              )}
            </div>

            <AbordagemInteligente client={client} />

            {/* Funil */}
            <div className="rounded-2xl p-4" style={{ background: '#111', border: '1px solid rgba(255,107,0,0.15)' }}>
              <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-2">🔄 Funil</p>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(STAGE_LABELS).map(([key, label]) => (
                  <button key={key} onClick={() => handleUpdateStage(key)}
                    className="px-2.5 py-1 rounded-xl text-[10px] font-black transition-all"
                    style={{
                      background: client.pipeline_stage === key ? `${STAGE_COLORS[key]}25` : '#1a1a1a',
                      border: `1px solid ${client.pipeline_stage === key ? STAGE_COLORS[key] : '#333'}`,
                      color: client.pipeline_stage === key ? STAGE_COLORS[key] : '#555',
                    }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Dores e motivadores */}
            {(client.main_pains?.length > 0 || client.purchase_motivators?.length > 0) && (
              <div className="grid grid-cols-2 gap-2">
                {client.main_pains?.length > 0 && (
                  <div className="rounded-xl p-3" style={{ background: '#111', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <p className="text-[9px] font-black text-red-400 uppercase mb-1.5">🩸 Dores</p>
                    {client.main_pains.map((p, i) => <p key={i} className="text-[10px] text-slate-400 leading-relaxed">• {p}</p>)}
                  </div>
                )}
                {client.purchase_motivators?.length > 0 && (
                  <div className="rounded-xl p-3" style={{ background: '#111', border: '1px solid rgba(34,197,94,0.2)' }}>
                    <p className="text-[9px] font-black text-green-400 uppercase mb-1.5">✅ Motivadores</p>
                    {client.purchase_motivators.map((m, i) => <p key={i} className="text-[10px] text-slate-400 leading-relaxed">• {m}</p>)}
                  </div>
                )}
              </div>
            )}

            {/* Pontos de atenção (linguagem segura) */}
            {client.real_objections?.length > 0 && (
              <div className="rounded-xl p-3" style={{ background: '#111', border: '1px solid rgba(251,191,36,0.2)' }}>
                <p className="text-[9px] font-black text-yellow-400 uppercase mb-1.5">⚠️ Pontos de Atenção</p>
                {client.real_objections.map((o, i) => <p key={i} className="text-[10px] text-slate-400">• {o}</p>)}
              </div>
            )}

            {/* Próxima ação */}
            {client.next_action && (
              <div className="rounded-xl p-3" style={{ background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.25)' }}>
                <p className="text-[9px] font-black text-green-400 uppercase mb-1">🎯 Próxima Ação</p>
                <p className="text-xs text-white font-semibold">{client.next_action}</p>
              </div>
            )}

            {/* Tarefas */}
            {tasks.length > 0 && (
              <div className="rounded-2xl p-4" style={{ background: '#111', border: '1px solid rgba(255,107,0,0.15)' }}>
                <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-2">✅ Tarefas ({tasks.length})</p>
                {tasks.map(t => (
                  <div key={t.id} className="flex items-center gap-2 py-1.5 border-b border-slate-900 last:border-0">
                    <Clock className="w-3 h-3 text-orange-600 shrink-0" />
                    <span className="text-xs text-slate-300 flex-1">{t.title}</span>
                    <span className="text-[9px]" style={{
                      color: t.priority === 'alta' ? '#ef4444' : t.priority === 'media' ? '#f59e0b' : '#64748b'
                    }}>{t.priority}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Visitas */}
            {visits.length > 0 && (
              <div className="rounded-2xl p-4" style={{ background: '#111', border: '1px solid rgba(0,191,255,0.15)' }}>
                <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">📍 Visitas ({visits.length})</p>
                {visits.slice(0, 4).map(v => (
                  <div key={v.id} className="flex items-center justify-between py-1.5 border-b border-slate-900 last:border-0">
                    <p className="text-xs text-slate-300">{v.visit_type || 'Visita'}</p>
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] text-blue-400">
                        {new Date(v.scheduled_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                      </p>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                        style={{ background: v.status === 'realizada' ? 'rgba(34,197,94,0.15)' : 'rgba(255,149,0,0.15)', color: v.status === 'realizada' ? '#22c55e' : '#ff9500' }}>
                        {v.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Follow-up rápido */}
            <button onClick={handleCriarFollowUp}
              className="w-full py-3 rounded-2xl flex items-center justify-center gap-2 font-black text-sm transition-all active:scale-98"
              style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.3)', color: '#a78bfa' }}>
              <Bell className="w-4 h-4" /> Criar Follow-up Automático
            </button>
          </>
        )}

        {/* ━━ TAB: PROPOSTA ━━ */}
        {activeTab === 'proposta' && (
          <>
            <div className="rounded-2xl p-4" style={{ background: '#111', border: '1px solid rgba(251,191,36,0.3)' }}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-[10px] font-black text-yellow-400 uppercase tracking-widest">💼 Proposta Ativa</p>
                  <p className="text-base font-black text-white mt-1">{client.equipment_interest || client.equipment_sold || client.current_equipment || 'Equipamento pendente'} — Equipamento SEAMATY</p>
                </div>
                <span className="text-[9px] font-black px-2 py-1 rounded-full" style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)' }}>
                  Em elaboração
                </span>
              </div>
              <div className="space-y-2 mb-3">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Preço/condição</span>
                  <span className="text-yellow-400 font-black">⚠️ AGUARDANDO VALIDAÇÃO</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Orçamento cliente</span>
                  <span className="text-white font-bold">{client.available_budget ? `R$ ${client.available_budget.toLocaleString('pt-BR')}` : 'base ainda não alimentada'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">ROI</span>
                  <span className="text-yellow-400 font-bold">AGUARDANDO VALIDAÇÃO</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Economia mensal</span>
                  <span className="text-yellow-400 font-bold">AGUARDANDO VALIDAÇÃO</span>
                </div>
              </div>
              <div className="rounded-xl p-2.5" style={{ background: 'rgba(255,68,68,0.06)', border: '1px solid rgba(255,68,68,0.2)' }}>
                <p className="text-[9px] text-red-400 font-black">⚠️ Proposta em elaboração — não enviar ao cliente antes de confirmar valores.</p>
              </div>
            </div>

            {/* Gaps */}
            <div className="rounded-2xl p-4" style={{ background: '#111', border: '1px solid rgba(239,68,68,0.15)' }}>
              <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-2">🩸 Gaps Identificados</p>
              <div className="space-y-1.5">
                {((client.main_pains?.length || client.real_objections?.length) ? [...(client.main_pains || []), ...(client.real_objections || [])] : ['base ainda não alimentada']).map((g, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-slate-400">
                    <span className="text-red-500 shrink-0">▸</span>{g}
                  </div>
                ))}
              </div>
            </div>

            <button onClick={handleGerarProposta}
              className="w-full py-3 rounded-2xl flex items-center justify-center gap-2 font-black text-sm"
              style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', color: '#fbbf24' }}>
              <FileText className="w-4 h-4" /> Abrir Gerador de Proposta
            </button>
            <button onClick={handleGerarPDF} disabled={loadingAction === 'pdf'}
              className="w-full py-3 rounded-2xl flex items-center justify-center gap-2 font-black text-sm"
              style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', color: '#34d399' }}>
              {loadingAction === 'pdf' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Gerar PDF
            </button>
            <button onClick={handleGerarLink} disabled={loadingAction === 'link'}
              className="w-full py-3 rounded-2xl flex items-center justify-center gap-2 font-black text-sm"
              style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.3)', color: '#38bdf8' }}>
              {loadingAction === 'link' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
              Gerar Link Rastreável
            </button>
          </>
        )}

        {/* ━━ TAB: MENSAGENS ━━ */}
        {activeTab === 'mensagens' && (
          <>
            <ConversationSentimentPanel client={client} />

            <div className="rounded-2xl p-4" style={{ background: '#111', border: '1px solid rgba(34,211,102,0.2)' }}>
              <p className="text-[10px] font-black text-green-400 uppercase tracking-widest mb-3">💬 Criar Mensagem</p>
              <textarea
                value={msgParaAprov}
                onChange={e => setMsgParaAprov(e.target.value)}
                placeholder="Escreva ou gere uma mensagem via SPIN abaixo..."
                rows={5}
                className="w-full rounded-xl p-3 text-xs text-slate-300 resize-none focus:outline-none mb-2"
                style={{ background: '#1a1a1a', border: '1px solid rgba(34,211,102,0.2)' }}
              />
              <div className="grid grid-cols-2 gap-2">
                <button onClick={handleCriarMensagem} disabled={loadingAction === 'msg'}
                  className="py-2.5 rounded-xl flex items-center justify-center gap-1.5 font-black text-xs"
                  style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', color: '#fbbf24' }}>
                  {loadingAction === 'msg' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                  Gerar via SPIN
                </button>
                <button onClick={handleEnviarParaAprovacao}
                  className="py-2.5 rounded-xl flex items-center justify-center gap-1.5 font-black text-xs"
                  style={{ background: 'rgba(34,211,102,0.1)', border: '1px solid rgba(34,211,102,0.3)', color: '#22d36a' }}>
                  <ClipboardCheck className="w-3.5 h-3.5" /> Preparar p/ Aprovação
                </button>
              </div>
            </div>

            {/* Bloqueio de envio direto */}
            <button onClick={handleTentarEnviarSemAprovacao}
              className="w-full py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs"
              style={{ background: 'rgba(255,68,68,0.05)', border: '1px dashed rgba(255,68,68,0.3)', color: '#ef4444' }}>
              <Lock className="w-3.5 h-3.5" /> Enviar Direto (BLOQUEADO)
            </button>

            <Link to={`/GenerateWhatsAppIntegrated?client_id=${client.id}`}>
              <div className="w-full py-3 rounded-2xl flex items-center justify-center gap-2 font-black text-sm"
                style={{ background: 'rgba(255,107,0,0.1)', border: '1px solid rgba(255,107,0,0.3)', color: '#ff6b00' }}>
                <Zap className="w-4 h-4" /> Abrir SPIN Completo
              </div>
            </Link>
          </>
        )}

        {/* ━━ TAB: APROVAÇÃO ━━ */}
        {activeTab === 'aprovacao' && (
          <>
            <div className="rounded-2xl p-3" style={{ background: 'rgba(251,191,36,0.05)', border: '1px solid rgba(251,191,36,0.2)' }}>
              <p className="text-[9px] text-yellow-400 font-black">FILA DE APROVAÇÃO — Toda mensagem precisa da aprovação do Nathan antes de ser enviada ao cliente.</p>
            </div>

            {approvalQueue.length === 0 ? (
              <div className="rounded-2xl p-8 text-center" style={{ background: '#111', border: '1px solid #222' }}>
                <CheckSquare className="w-10 h-10 mx-auto text-slate-700 mb-2" />
                <p className="text-slate-600 text-sm">Fila vazia. Crie uma mensagem na aba "Mensagens".</p>
              </div>
            ) : (
              approvalQueue.map(item => (
                <div key={item.id} className="rounded-2xl p-4" style={{
                  background: '#111',
                  border: `1px solid ${item.status === 'aprovada' ? 'rgba(34,197,94,0.3)' : item.status === 'reprovada' ? 'rgba(239,68,68,0.3)' : 'rgba(251,191,36,0.3)'}`
                }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full" style={{
                      background: item.status === 'aprovada' ? 'rgba(34,197,94,0.15)' : item.status === 'reprovada' ? 'rgba(239,68,68,0.15)' : 'rgba(251,191,36,0.15)',
                      color: item.status === 'aprovada' ? '#22c55e' : item.status === 'reprovada' ? '#ef4444' : '#fbbf24'
                    }}>{item.status.toUpperCase()}</span>
                    <span className="text-[9px] text-slate-600">{item.criadoEm}</span>
                  </div>
                  <p className="text-xs text-slate-300 mb-3 leading-relaxed whitespace-pre-wrap">{item.text}</p>
                  {item.status === 'aguardando' && (
                    <div className="grid grid-cols-3 gap-1.5">
                      <button onClick={() => handleAprovar(item.id)}
                        className="py-2 rounded-xl flex items-center justify-center gap-1 text-[10px] font-black"
                        style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e' }}>
                        <ThumbsUp className="w-3 h-3" /> Aprovar texto
                      </button>
                      <button onClick={() => handleReprovar(item.id)}
                        className="py-2 rounded-xl flex items-center justify-center gap-1 text-[10px] font-black"
                        style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}>
                        <ThumbsDown className="w-3 h-3" /> Reprovar
                      </button>
                      <button onClick={() => handlePedirNovaVersao(item.id)}
                        className="py-2 rounded-xl flex items-center justify-center gap-1 text-[10px] font-black"
                        style={{ background: 'rgba(148,163,184,0.1)', border: '1px solid rgba(148,163,184,0.2)', color: '#94a3b8' }}>
                        <RefreshCw className="w-3 h-3" /> Nova Versão
                      </button>
                    </div>
                  )}
                  {/* Estado: aprovado mas WhatsApp ainda não aberto */}
                  {item.status === 'aprovado_aguardando_envio_manual' && (
                    <div className="space-y-1.5">
                      <div className="rounded-lg px-2 py-1.5" style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)' }}>
                        <p className="text-[9px] text-yellow-400 font-black">✅ APROVADO — WhatsApp ainda não aberto</p>
                        <p className="text-[9px] text-slate-500 mt-0.5">whatsapp_aberto=false · envio_realizado=false · envio_confirmado_manual=false</p>
                      </div>
                      <button onClick={() => handleAbrirWhatsAppManual(item.id)}
                        className="w-full py-2 rounded-xl flex items-center justify-center gap-1.5 text-[10px] font-black"
                        style={{ background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.3)', color: '#25d366' }}>
                        <MessageSquare className="w-3 h-3" /> Abrir WhatsApp (pré-preenchido)
                      </button>
                    </div>
                  )}

                  {/* Estado: WhatsApp aberto mas envio ainda não confirmado */}
                  {item.status === 'whatsapp_aberto_aguardando_envio_manual_nathan' && (
                    <div className="space-y-1.5">
                      <div className="rounded-lg px-2 py-1.5" style={{ background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.25)' }}>
                        <p className="text-[9px] text-blue-400 font-black">📱 WhatsApp aberto — aguardando Nathan apertar ENVIAR</p>
                        <p className="text-[9px] text-slate-500 mt-0.5">whatsapp_aberto=true · envio_realizado=false · canal=whatsapp_pre_preenchido</p>
                      </div>
                      <button onClick={() => handleAbrirWhatsAppManual(item.id)}
                        className="w-full py-2 rounded-xl flex items-center justify-center gap-1.5 text-[10px] font-black"
                        style={{ background: 'rgba(37,211,102,0.08)', border: '1px solid rgba(37,211,102,0.2)', color: '#6ee7b7' }}>
                        <MessageSquare className="w-3 h-3" /> Reabrir WhatsApp
                      </button>
                      <button onClick={() => handleConfirmarEnvioManual(item.id)}
                        className="w-full py-2.5 rounded-xl flex items-center justify-center gap-1.5 text-[10px] font-black"
                        style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.5)', color: '#22c55e' }}>
                        <CheckCircle className="w-3.5 h-3.5" /> ✔ Confirmar que enviei manualmente
                      </button>
                    </div>
                  )}

                  {/* Estado: envio confirmado manualmente */}
                  {item.status === 'enviado_manual_confirmado_por_nathan' && (
                    <div className="rounded-lg px-3 py-2" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.3)' }}>
                      <p className="text-[9px] text-green-400 font-black">✅ ENVIADO — confirmado manualmente por Nathan</p>
                      <p className="text-[9px] text-slate-500 mt-0.5">envio_realizado=true · envio_confirmado_manual=true · {item.data_confirmacao_envio}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </>
        )}

        {/* ━━ TAB: ANEXOS / PRINTS ━━ */}
        {activeTab === 'anexos' && (
          <>
            <div className="rounded-2xl p-4" style={{ background: '#111', border: '1px solid rgba(251,191,36,0.2)' }}>
              <p className="text-[10px] font-black text-yellow-400 uppercase tracking-widest mb-3">📎 Prints e Anexos</p>
              <button onClick={handleAnexarPrint} disabled={loadingAction === 'print'}
                className="w-full py-3 rounded-xl flex items-center justify-center gap-2 font-black text-sm mb-3"
                style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.3)', color: '#fbbf24' }}>
                {loadingAction === 'print' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
                Anexar Print Real
              </button>
              {printPreview ? (
                <div className="rounded-xl overflow-hidden border border-yellow-500/30">
                  <div className="flex items-center justify-between px-3 py-1.5" style={{ background: 'rgba(251,191,36,0.1)' }}>
                    <span className="text-[10px] text-yellow-400 font-black">Print salvo ✓</span>
                    <button onClick={() => setPrintPreview(null)}>
                      <X className="w-3.5 h-3.5 text-slate-500" />
                    </button>
                  </div>
                  <img src={printPreview} alt="Print anexado" className="w-full max-h-64 object-contain" style={{ background: '#000' }} />
                  <div className="px-3 py-2 flex gap-2">
                    <a href={printPreview} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[10px] text-blue-400">
                      <ExternalLink className="w-3 h-3" /> Abrir original
                    </a>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl p-6 flex flex-col items-center gap-2 text-center" style={{ background: '#1a1a1a', border: '1px dashed #333' }}>
                  <Image className="w-8 h-8 text-slate-700" />
                  <p className="text-xs text-slate-600">Nenhum print anexado. Toque acima para fazer upload.</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* ━━ TAB: MAPA ━━ */}
        {activeTab === 'mapa' && (
          <>
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(96,165,250,0.3)' }}>
              <div className="px-4 py-3 flex items-center justify-between" style={{ background: '#111' }}>
                <p className="text-[10px] font-black text-blue-400 uppercase">🗺️ Localização do Cliente</p>
                <button onClick={handleVerMapa}
                  className="flex items-center gap-1 text-[10px] text-blue-400 font-bold">
                  <ExternalLink className="w-3 h-3" /> Abrir Google Maps
                </button>
              </div>
              {client.city && (
                <iframe
                  title="Mapa cliente"
                  width="100%"
                  height="280"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://maps.google.com/maps?q=${encodeURIComponent((client.address || client.city) + ', Brasil')}&output=embed&z=14`}
                />
              )}
              <div className="px-4 py-2" style={{ background: '#111' }}>
                <p className="text-xs text-slate-400">{client.address || client.city}</p>
              </div>
            </div>

            <Link to={`/SmartRouteOptimizer?city=${encodeURIComponent(client.city || '')}`}>
              <div className="w-full py-3 rounded-2xl flex items-center justify-center gap-2 font-black text-sm"
                style={{ background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.3)', color: '#60a5fa' }}>
                <MapPin className="w-4 h-4" /> Incluir na Rota do Dia
              </div>
            </Link>
          </>
        )}

        {/* ━━ TAB: ALERTAS ━━ */}
        {activeTab === 'alertas' && (
          <>
            {/* Conectores */}
            <div className="rounded-2xl p-4" style={{ background: '#111', border: '1px solid rgba(255,107,0,0.15)' }}>
              <button className="w-full flex items-center justify-between" onClick={() => setShowConectores(!showConectores)}>
                <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest">🔌 Status dos Conectores</p>
                <span className="text-[10px] text-slate-500">{showConectores ? '▲ fechar' : '▼ ver todos'}</span>
              </button>
              {showConectores && (
                <div className="mt-3 space-y-1.5">
                  {CONECTORES_STATUS.map((c, i) => (
                    <div key={i} className="py-1 border-b border-slate-900 last:border-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-300">{c.icon} {c.nome}</span>
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full" style={{
                          background: c.status === 'ativo_testado' ? 'rgba(34,197,94,0.15)' : 'rgba(56,189,248,0.15)',
                          color: c.status === 'ativo_testado' ? '#22c55e' : '#38bdf8',
                        }}>
                          {c.status === 'ativo_testado' ? '✅ TESTADO' : '🔵 ATIVO/N.TESTADO'}
                        </span>
                      </div>
                      <p className="text-[9px] text-slate-600 mt-0.5">{c.nota}</p>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-3 p-2.5 rounded-xl" style={{ background: 'rgba(56,189,248,0.05)', border: '1px solid rgba(56,189,248,0.2)' }}>
                <p className="text-[9px] text-blue-400 font-black mb-1">LEGENDA REAL DOS CONECTORES:</p>
                <p className="text-[9px] text-slate-500 leading-relaxed">✅ TESTADO = conectado e função real validada | 🔵 ATIVO/N.TESTADO = aparece ativo na UI Base44, mas operação real (leitura de e-mail, criação de doc, etc.) ainda não foi testada no fluxo do CRM. Não são desconectados — são conectados mas pendentes de teste de uso real.</p>
              </div>
            </div>

            {/* Status do sistema — resumido */}
            <div className="rounded-2xl p-4" style={{ background: '#111', border: '1px solid rgba(168,85,247,0.2)' }}>
              <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-2">🔧 Funcionalidades</p>
              <div className="space-y-1.5 text-xs">
                {[
                  'WhatsApp assistido',
                  'Envio direto bloqueado',
                  'Fila de aprovação ativa',
                  'PDF sob demanda',
                  'Mapa integrado',
                  'Google Calendar',
                  'Google Slides',
                ].map((label, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-500 shrink-0" />
                    <span className="text-slate-400">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Phone, MapPin, Building2, Star, MessageSquare,
  Calendar, TrendingUp, Target, Edit3, CheckCircle, Clock,
  Zap, ChevronRight, Globe, Instagram
} from 'lucide-react';
import { toast } from 'sonner';

const STATUS_COLORS = { quente: '#ff4444', morno: '#ff9500', frio: '#64748b' };
const STAGE_COLORS = {
  lead: '#64748b', qualificado: '#3b82f6', proposta: '#f59e0b',
  negociacao: '#f97316', fechado: '#22c55e', perdido: '#ef4444'
};

export default function ClientProfile() {
  const params = new URLSearchParams(window.location.search);
  const clientId = params.get('id');
  const [editingNote, setEditingNote] = useState(false);
  const [noteText, setNoteText] = useState('');

  const { data: client, isLoading, refetch } = useQuery({
    queryKey: ['client-profile', clientId],
    queryFn: () => base44.entities.Client.filter({ id: clientId }).then(r => r[0]),
    enabled: !!clientId,
    staleTime: 2 * 60 * 1000,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['client-tasks', clientId],
    queryFn: () => base44.entities.Task.filter({ client_id: clientId, status: 'pendente' }),
    enabled: !!clientId,
    staleTime: 60000,
  });

  const { data: visits = [] } = useQuery({
    queryKey: ['client-visits', clientId],
    queryFn: () => base44.entities.Visit.filter({ client_id: clientId }),
    enabled: !!clientId,
    staleTime: 60000,
  });

  const handleSaveNote = async () => {
    if (!noteText.trim() || !client) return;
    await base44.entities.Client.update(client.id, { notes: noteText });
    toast.success('Nota salva!');
    setEditingNote(false);
    refetch();
  };

  const handleWhatsApp = () => {
    if (!client?.phone) { toast.error('Sem telefone cadastrado'); return; }
    const phone = client.phone.replace(/\D/g, '');
    window.open(`https://wa.me/${phone}`, '_blank');
  };

  const handleUpdateStage = async (stage) => {
    await base44.entities.Client.update(client.id, { pipeline_stage: stage });
    toast.success(`Funil atualizado para: ${stage}`);
    refetch();
  };

  if (!clientId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#0a0a0a' }}>
        <div className="text-center">
          <p className="text-red-400 font-bold mb-4">ID de cliente não informado</p>
          <Link to="/Clients" className="text-orange-400 underline text-sm">← Voltar aos Clientes</Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
        <div className="px-4 pt-5 pb-3 flex items-center gap-3">
          <Link to="/Clients">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#1a1a1a' }}>
              <ArrowLeft className="w-4 h-4 text-slate-400" />
            </div>
          </Link>
          <div className="h-6 w-40 rounded-xl animate-pulse" style={{ background: '#1a1a1a' }} />
        </div>
        <div className="px-4 space-y-3">
          {[1,2,3].map(i => (
            <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ background: '#1a1a1a' }} />
          ))}
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: '#0a0a0a' }}>
        <div className="text-center">
          <p className="text-red-400 font-bold mb-4">Cliente não encontrado</p>
          <Link to="/Clients" className="text-orange-400 underline text-sm">← Voltar aos Clientes</Link>
        </div>
      </div>
    );
  }

  const statusColor = STATUS_COLORS[client.status] || '#ff9500';
  const stageColor = STAGE_COLORS[client.pipeline_stage] || '#64748b';

  return (
    <div className="min-h-screen pb-24" style={{ background: '#0a0a0a' }}>
      {/* Header */}
      <div className="px-4 pt-5 pb-4">
        <div className="flex items-center gap-3 mb-4">
          <Link to="/Clients">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: '#1a1a1a', border: '1px solid rgba(255,107,0,0.2)' }}>
              <ArrowLeft className="w-4 h-4 text-orange-400" />
            </div>
          </Link>
          <div>
            <h1 className="text-lg font-black text-white">{client.first_name || client.full_name}</h1>
            <p className="text-[10px] text-slate-500">{client.clinic_name}</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-[11px] px-2 py-0.5 rounded-full font-black"
              style={{ background: `${statusColor}20`, color: statusColor, border: `1px solid ${statusColor}40` }}>
              {client.status || 'morno'}
            </span>
          </div>
        </div>

        {/* Score & Stage */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="rounded-xl p-2.5 text-center" style={{ background: '#111', border: '1px solid rgba(255,68,68,0.2)' }}>
            <p className="text-xl font-black" style={{ color: '#ff4444' }}>{client.purchase_score || 0}</p>
            <p className="text-[9px] text-slate-500 uppercase">Score</p>
          </div>
          <div className="rounded-xl p-2.5 text-center" style={{ background: '#111', border: `1px solid ${stageColor}40` }}>
            <p className="text-xs font-black capitalize" style={{ color: stageColor }}>{client.pipeline_stage || 'lead'}</p>
            <p className="text-[9px] text-slate-500 uppercase">Funil</p>
          </div>
          <div className="rounded-xl p-2.5 text-center" style={{ background: '#111', border: '1px solid rgba(255,149,0,0.2)' }}>
            <p className="text-xl font-black text-orange-400">{tasks.length}</p>
            <p className="text-[9px] text-slate-500 uppercase">Tarefas</p>
          </div>
        </div>

        {/* Ações rápidas */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <button onClick={handleWhatsApp}
            className="py-2.5 rounded-xl flex flex-col items-center gap-1"
            style={{ background: 'rgba(37,211,102,0.1)', border: '1px solid rgba(37,211,102,0.3)' }}>
            <MessageSquare className="w-4 h-4 text-green-400" />
            <span className="text-[10px] font-black text-green-400">WhatsApp</span>
          </button>
          <Link to={`/GenerateWhatsAppIntegrated?client_id=${client.id}`}>
            <div className="py-2.5 rounded-xl flex flex-col items-center gap-1"
              style={{ background: 'rgba(255,107,0,0.1)', border: '1px solid rgba(255,107,0,0.3)' }}>
              <Zap className="w-4 h-4 text-orange-400" />
              <span className="text-[10px] font-black text-orange-400">Gerar SPIN</span>
            </div>
          </Link>
          <Link to={`/ModoInvestigativoSupremo?query=${encodeURIComponent(client.first_name || '')}`}>
            <div className="py-2.5 rounded-xl flex flex-col items-center gap-1"
              style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.3)' }}>
              <Target className="w-4 h-4 text-purple-400" />
              <span className="text-[10px] font-black text-purple-400">Investigar</span>
            </div>
          </Link>
        </div>
      </div>

      <div className="px-4 space-y-3">
        {/* Dados básicos */}
        <div className="rounded-2xl p-4" style={{ background: '#111', border: '1px solid rgba(255,107,0,0.15)' }}>
          <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-3">📋 Dados do Cliente</p>
          <div className="space-y-2">
            {client.clinic_name && (
              <div className="flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="text-xs text-slate-300">{client.clinic_name}</span>
              </div>
            )}
            {client.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="text-xs text-slate-300">{client.phone}</span>
              </div>
            )}
            {client.city && (
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="text-xs text-slate-300">{client.city}</span>
              </div>
            )}
            {client.website && (
              <div className="flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <a href={client.website} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-blue-400 underline truncate">{client.website}</a>
              </div>
            )}
            {client.instagram_handle && (
              <div className="flex items-center gap-2">
                <Instagram className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="text-xs text-slate-300">@{client.instagram_handle}</span>
              </div>
            )}
            {client.representante && (
              <div className="flex items-center gap-2">
                <Star className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="text-xs text-slate-300">Rep: {client.representante}</span>
              </div>
            )}
            {client.equipment_interest && (
              <div className="flex items-center gap-2">
                <TrendingUp className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                <span className="text-xs text-orange-300">Interesse: {client.equipment_interest}</span>
              </div>
            )}
          </div>
        </div>

        {/* Funil — atualização rápida */}
        <div className="rounded-2xl p-4" style={{ background: '#111', border: '1px solid rgba(255,107,0,0.15)' }}>
          <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-3">🔄 Mover no Funil</p>
          <div className="flex flex-wrap gap-2">
            {['lead', 'qualificado', 'proposta', 'negociacao', 'fechado', 'perdido'].map(stage => (
              <button key={stage} onClick={() => handleUpdateStage(stage)}
                className="px-2.5 py-1 rounded-xl text-[11px] font-black capitalize transition-all"
                style={{
                  background: client.pipeline_stage === stage ? `${STAGE_COLORS[stage]}30` : '#1a1a1a',
                  border: `1px solid ${client.pipeline_stage === stage ? STAGE_COLORS[stage] : '#333'}`,
                  color: client.pipeline_stage === stage ? STAGE_COLORS[stage] : '#666',
                }}>
                {stage}
              </button>
            ))}
          </div>
        </div>

        {/* Tarefas pendentes */}
        {tasks.length > 0 && (
          <div className="rounded-2xl p-4" style={{ background: '#111', border: '1px solid rgba(255,107,0,0.15)' }}>
            <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-3">✅ Tarefas Pendentes</p>
            <div className="space-y-2">
              {tasks.map(t => (
                <div key={t.id} className="flex items-center gap-2 py-1.5 border-b border-slate-900 last:border-0">
                  <Clock className="w-3 h-3 text-orange-600 shrink-0" />
                  <span className="text-xs text-slate-300 flex-1">{t.title}</span>
                  {t.due_date && (
                    <span className="text-[10px] text-slate-500">
                      {new Date(t.due_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Visitas */}
        {visits.length > 0 && (
          <div className="rounded-2xl p-4" style={{ background: '#111', border: '1px solid rgba(0,191,255,0.15)' }}>
            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-3">📍 Histórico de Visitas</p>
            <div className="space-y-2">
              {visits.slice(0, 5).map(v => (
                <div key={v.id} className="flex items-center justify-between py-1.5 border-b border-slate-900 last:border-0">
                  <div>
                    <p className="text-xs text-slate-300">{v.visit_type || 'Visita'}</p>
                    {v.notes && <p className="text-[10px] text-slate-500 truncate max-w-[180px]">{v.notes}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-blue-400">
                      {new Date(v.scheduled_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    </p>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full`}
                      style={{
                        background: v.status === 'realizada' ? 'rgba(34,197,94,0.15)' : 'rgba(255,149,0,0.15)',
                        color: v.status === 'realizada' ? '#22c55e' : '#ff9500'
                      }}>
                      {v.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notas */}
        <div className="rounded-2xl p-4" style={{ background: '#111', border: '1px solid rgba(255,107,0,0.15)' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest">📝 Observações</p>
            <button onClick={() => { setEditingNote(true); setNoteText(client.notes || ''); }}
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(255,107,0,0.1)', border: '1px solid rgba(255,107,0,0.3)' }}>
              <Edit3 className="w-3.5 h-3.5 text-orange-400" />
            </button>
          </div>
          {editingNote ? (
            <div>
              <textarea value={noteText} onChange={e => setNoteText(e.target.value)} rows={4}
                className="w-full rounded-xl p-3 text-sm text-slate-300 resize-none focus:outline-none mb-2"
                style={{ background: '#1a1a1a', border: '1px solid rgba(255,107,0,0.3)' }} />
              <div className="flex gap-2">
                <button onClick={handleSaveNote}
                  className="flex-1 py-2 rounded-xl text-xs font-black"
                  style={{ background: 'rgba(0,255,136,0.15)', color: '#00ff88', border: '1px solid rgba(0,255,136,0.3)' }}>
                  <CheckCircle className="w-3.5 h-3.5 inline mr-1" />Salvar
                </button>
                <button onClick={() => setEditingNote(false)}
                  className="py-2 px-4 rounded-xl text-xs font-black"
                  style={{ background: '#1a1a1a', color: '#666', border: '1px solid #333' }}>
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 leading-relaxed">
              {client.notes || <span className="italic text-slate-600">Sem observações. Toque no lápis para adicionar.</span>}
            </p>
          )}
        </div>

        {/* Próxima ação sugerida */}
        {client.next_action && (
          <div className="rounded-2xl p-4" style={{ background: 'rgba(0,255,136,0.04)', border: '1px solid rgba(0,255,136,0.25)' }}>
            <p className="text-[10px] font-black text-green-400 uppercase tracking-widest mb-1">✅ Próxima Ação Sugerida</p>
            <p className="text-sm font-bold text-white">{client.next_action}</p>
          </div>
        )}

        {/* Links de ação */}
        <div className="grid grid-cols-2 gap-2">
          <Link to={`/ProposalGenerator?client_id=${client.id}`}>
            <div className="rounded-xl p-3 flex items-center gap-2"
              style={{ background: '#141414', border: '1px solid rgba(255,149,0,0.2)' }}>
              <Calendar className="w-4 h-4 text-orange-400" />
              <span className="text-xs font-black text-orange-400">Gerar Proposta</span>
            </div>
          </Link>
          <Link to={`/SmartRouteOptimizer?city=${encodeURIComponent(client.city || '')}`}>
            <div className="rounded-xl p-3 flex items-center gap-2"
              style={{ background: '#141414', border: '1px solid rgba(0,191,255,0.2)' }}>
              <MapPin className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-black text-blue-400">Ver Rota</span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
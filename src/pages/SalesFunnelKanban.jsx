import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { RefreshCw, Eye, DollarSign, TrendingUp, Users, Zap } from 'lucide-react';

const STAGES = ['lead', 'qualificado', 'proposta', 'negociacao', 'fechado', 'perdido'];

const STAGE_CONFIG = {
  lead:       { label: 'Lead',       color: '#64748b', bg: 'rgba(100,116,139,0.12)', border: 'rgba(100,116,139,0.3)' },
  qualificado:{ label: 'Qualificado',color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.3)' },
  proposta:   { label: 'Proposta',   color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.3)' },
  negociacao: { label: 'Negociação', color: '#ff6b00', bg: 'rgba(255,107,0,0.12)',   border: 'rgba(255,107,0,0.3)' },
  fechado:    { label: 'Fechado ✓',  color: '#00ff88', bg: 'rgba(0,255,136,0.12)',   border: 'rgba(0,255,136,0.3)' },
  perdido:    { label: 'Perdido',    color: '#ff4444', bg: 'rgba(255,68,68,0.08)',    border: 'rgba(255,68,68,0.2)' },
};

const PRIORITY_STYLE = {
  critical: { bg: 'rgba(255,50,50,0.2)',  text: '#ff4444', label: 'CRÍTICO' },
  high:     { bg: 'rgba(255,107,0,0.2)', text: '#ff9500', label: 'ALTA' },
  medium:   { bg: 'rgba(255,200,0,0.15)',text: '#ffc800', label: 'MÉDIA' },
  low:      { bg: 'rgba(100,100,100,0.15)',text:'#888',   label: 'BAIXA' },
};

function formatCurrency(v) {
  if (!v) return 'R$ 0';
  if (v >= 1000) return `R$ ${(v / 1000).toFixed(0)}k`;
  return `R$ ${v}`;
}

export default function SalesFunnelKanban() {
  const [leads, setLeads] = useState({});
  const queryClient = useQueryClient();

  const { data: allLeads = [], refetch, isLoading } = useQuery({
    queryKey: ['kanban-leads'],
    queryFn: () => base44.entities.Lead.list('-created_date', 300),
    staleTime: 60000,
  });

  useEffect(() => {
    if (allLeads.length > 0) {
      const organized = {};
      STAGES.forEach(stage => {
        organized[stage] = allLeads.filter(lead => lead.stage === stage);
      });
      setLeads(organized);
    }
  }, [allLeads]);

  const moveLeadMutation = useMutation({
    mutationFn: async ({ leadId, newStage }) => {
      await base44.entities.Lead.update(leadId, { stage: newStage });
      base44.functions.invoke('processFunnelMovement', {
        lead_id: leadId,
        to_stage: newStage,
      }).catch(() => null); // fire and forget
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban-leads'] });
    },
  });

  const handleDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    // Atualização otimista imediata
    const newStage = destination.droppableId;
    setLeads(prev => {
      const updated = { ...prev };
      const srcItems = [...(updated[source.droppableId] || [])];
      const [moved] = srcItems.splice(source.index, 1);
      updated[source.droppableId] = srcItems;
      const destItems = [...(updated[newStage] || [])];
      destItems.splice(destination.index, 0, { ...moved, stage: newStage });
      updated[newStage] = destItems;
      return updated;
    });

    moveLeadMutation.mutate({ leadId: draggableId, newStage });
  };

  const pipelineTotal = useMemo(() =>
    Object.values(leads).flat().reduce((sum, l) => sum + (l.estimated_deal_value || 0), 0),
    [leads]
  );

  return (
    <div className="min-h-screen pb-24" style={{ background: '#0a0a0a' }}>
      {/* HEADER */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-black text-white">🎯 Funil de Vendas</h1>
            <p className="text-xs text-orange-600">Pipeline • Kanban • Drag & Drop</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="rounded-xl px-3 py-2 text-center" style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.25)' }}>
              <p className="text-xs font-black text-green-400">{formatCurrency(pipelineTotal)}</p>
              <p className="text-[9px] text-slate-600">Pipeline Total</p>
            </div>
            <button onClick={() => refetch()} disabled={isLoading}
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: '#141414', border: '1px solid rgba(255,107,0,0.3)' }}>
              <RefreshCw className={`w-4 h-4 text-orange-400 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: 'Total', val: allLeads.length, icon: Users, color: '#ff9500' },
            { label: 'Em Proposta', val: (leads.proposta?.length || 0) + (leads.negociacao?.length || 0), icon: TrendingUp, color: '#00bfff' },
            { label: 'Fechados', val: leads.fechado?.length || 0, icon: Zap, color: '#00ff88' },
          ].map(({ label, val, icon: Icon, color }) => (
            <div key={label} className="rounded-xl p-2.5 flex items-center gap-2"
              style={{ background: '#141414', border: `1px solid ${color}33` }}>
              <Icon className="w-4 h-4 shrink-0" style={{ color }} />
              <div>
                <p className="text-sm font-black text-white">{val}</p>
                <p className="text-[10px]" style={{ color: color + 'aa' }}>{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* KANBAN BOARD */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-3 px-4 overflow-x-auto pb-4" style={{ minWidth: 'max-content' }}>
          {STAGES.map(stage => {
            const cfg = STAGE_CONFIG[stage];
            const stageLeads = leads[stage] || [];
            const stageTotal = stageLeads.reduce((s, l) => s + (l.estimated_deal_value || 0), 0);

            return (
              <div key={stage} style={{ width: 220, minWidth: 220 }}>
                {/* Column header */}
                <div className="rounded-t-2xl px-3 py-2.5 flex items-center justify-between"
                  style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, borderBottom: 'none' }}>
                  <div>
                    <p className="text-xs font-black" style={{ color: cfg.color }}>{cfg.label}</p>
                    <p className="text-[10px] text-slate-500">{formatCurrency(stageTotal)}</p>
                  </div>
                  <span className="text-xs font-black px-2 py-0.5 rounded-full"
                    style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
                    {stageLeads.length}
                  </span>
                </div>

                <Droppable droppableId={stage}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="rounded-b-2xl p-2 space-y-2 min-h-[480px]"
                      style={{
                        background: snapshot.isDraggingOver ? `${cfg.color}08` : '#0f0f0f',
                        border: `1px solid ${snapshot.isDraggingOver ? cfg.border : 'rgba(255,255,255,0.05)'}`,
                        borderTop: 'none',
                        transition: 'background 0.2s',
                      }}>

                      {stageLeads.map((lead, index) => {
                        const pStyle = PRIORITY_STYLE[lead.priority_level] || PRIORITY_STYLE.medium;
                        return (
                          <Draggable key={lead.id} draggableId={lead.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className="rounded-xl p-3 cursor-grab active:cursor-grabbing transition-all"
                                style={{
                                  background: snapshot.isDragging ? '#2a2a2a' : '#1a1a1a',
                                  border: `1px solid ${snapshot.isDragging ? cfg.color : 'rgba(255,255,255,0.07)'}`,
                                  boxShadow: snapshot.isDragging ? `0 8px 24px rgba(0,0,0,0.6)` : 'none',
                                  ...provided.draggableProps.style,
                                }}>
                                {/* Lead name */}
                                <p className="text-xs font-black text-white truncate mb-0.5">
                                  {lead.full_name}
                                </p>
                                {lead.company && (
                                  <p className="text-[11px] text-slate-500 truncate mb-2">{lead.company}</p>
                                )}

                                {/* Deal value */}
                                {lead.estimated_deal_value > 0 && (
                                  <p className="text-xs font-black mb-2" style={{ color: cfg.color }}>
                                    {formatCurrency(lead.estimated_deal_value)}
                                  </p>
                                )}

                                {/* Priority badge */}
                                {lead.priority_level && (
                                  <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-black"
                                    style={{ background: pStyle.bg, color: pStyle.text }}>
                                    {pStyle.label}
                                  </span>
                                )}

                                {/* City */}
                                {lead.city && (
                                  <p className="text-[10px] text-slate-600 mt-1.5 truncate">📍 {lead.city}</p>
                                )}
                              </div>
                            )}
                          </Draggable>
                        );
                      })}

                      {provided.placeholder}

                      {stageLeads.length === 0 && (
                        <div className="flex items-center justify-center h-24">
                          <p className="text-[11px] text-slate-700">Arraste leads aqui</p>
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {/* Pipeline summary bottom */}
      <div className="px-4 mt-2">
        <div className="rounded-2xl p-3" style={{ background: '#111', border: '1px solid rgba(255,107,0,0.15)' }}>
          <p className="text-[10px] font-black text-orange-400 mb-2 uppercase tracking-widest">📊 Resumo do Pipeline</p>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {STAGES.map(stage => {
              const cfg = STAGE_CONFIG[stage];
              const count = leads[stage]?.length || 0;
              const total = (leads[stage] || []).reduce((s, l) => s + (l.estimated_deal_value || 0), 0);
              return (
                <div key={stage} className="rounded-xl p-2 text-center"
                  style={{ background: '#1a1a1a', border: `1px solid ${cfg.border}` }}>
                  <p className="text-xs font-black" style={{ color: cfg.color }}>{count}</p>
                  <p className="text-[9px] text-slate-600 capitalize">{cfg.label}</p>
                  <p className="text-[9px] font-bold text-slate-500 mt-0.5">{formatCurrency(total)}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
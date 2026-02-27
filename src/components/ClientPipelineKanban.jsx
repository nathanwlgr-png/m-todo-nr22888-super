import React, { useState, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { differenceInDays, format } from 'date-fns';
import { Clock, TrendingUp, Users, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';

const STAGES = ['lead', 'qualificado', 'proposta', 'negociacao', 'fechado', 'perdido'];

const STAGE_META = {
  lead:        { label: 'Lead',        emoji: '🆕', bg: 'bg-slate-50',   border: 'border-slate-300',  header: 'bg-slate-100',   dot: 'bg-slate-400'   },
  qualificado: { label: 'Qualificado', emoji: '✅', bg: 'bg-blue-50',    border: 'border-blue-300',   header: 'bg-blue-100',    dot: 'bg-blue-500'    },
  proposta:    { label: 'Proposta',    emoji: '📄', bg: 'bg-yellow-50',  border: 'border-yellow-300', header: 'bg-yellow-100',  dot: 'bg-yellow-500'  },
  negociacao:  { label: 'Negociação',  emoji: '💰', bg: 'bg-orange-50',  border: 'border-orange-300', header: 'bg-orange-100',  dot: 'bg-orange-500'  },
  fechado:     { label: 'Fechado',     emoji: '🎉', bg: 'bg-green-50',   border: 'border-green-300',  header: 'bg-green-100',   dot: 'bg-green-500'   },
  perdido:     { label: 'Perdido',     emoji: '❌', bg: 'bg-red-50',     border: 'border-red-300',    header: 'bg-red-100',     dot: 'bg-red-400'     },
};

const STATUS_COLOR = {
  quente: 'bg-red-500',
  morno:  'bg-yellow-500',
  frio:   'bg-blue-400',
};

function fmtCurrency(val) {
  if (!val) return 'R$ 0';
  if (val >= 1_000_000) return `R$ ${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1000) return `R$ ${(val / 1000).toFixed(0)}k`;
  return `R$ ${val.toLocaleString('pt-BR')}`;
}

function avgDaysInStage(clients) {
  const withDates = clients.filter(c => c.updated_date);
  if (!withDates.length) return null;
  const avg = withDates.reduce((sum, c) => sum + differenceInDays(new Date(), new Date(c.updated_date)), 0) / withDates.length;
  return Math.round(avg);
}

function StageColumn({ stage, clients, provided, snapshot }) {
  const meta = STAGE_META[stage];
  const totalValue = clients.reduce((s, c) => s + (c.projected_revenue || c.available_budget || 0), 0);
  const avgDays = avgDaysInStage(clients);

  return (
    <div
      ref={provided.innerRef}
      {...provided.droppableProps}
      className={`flex flex-col min-w-[230px] w-[230px] rounded-xl border-2 ${meta.border} ${meta.bg} transition-all ${
        snapshot.isDraggingOver ? 'ring-2 ring-indigo-400 ring-offset-1' : ''
      }`}
    >
      {/* Column header */}
      <div className={`${meta.header} rounded-t-xl px-3 py-2.5 border-b ${meta.border}`}>
        <div className="flex items-center justify-between mb-1">
          <span className="font-semibold text-sm text-slate-800">
            {meta.emoji} {meta.label}
          </span>
          <span className="text-xs text-slate-500 font-medium bg-white rounded-full px-2 py-0.5 border">
            {clients.length}
          </span>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-2 text-[11px] text-slate-600">
          <span className="flex items-center gap-0.5">
            <DollarSign className="w-3 h-3 text-green-600" />
            <strong className="text-green-700">{fmtCurrency(totalValue)}</strong>
          </span>
          {avgDays !== null && (
            <span className="flex items-center gap-0.5 ml-auto">
              <Clock className="w-3 h-3 text-slate-400" />
              <span className="text-slate-500">~{avgDays}d</span>
            </span>
          )}
        </div>
      </div>

      {/* Cards */}
      <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-280px)]">
        {clients.map((client, index) => (
          <ClientCard key={client.id} client={client} index={index} stage={stage} />
        ))}
        {provided.placeholder}
        {clients.length === 0 && (
          <div className="text-center py-8 text-slate-300 text-xs">
            Arraste clientes aqui
          </div>
        )}
      </div>
    </div>
  );
}

function ClientCard({ client, index, stage }) {
  const navigate = useNavigate();
  const daysHere = client.updated_date
    ? differenceInDays(new Date(), new Date(client.updated_date))
    : null;

  return (
    <Draggable draggableId={client.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`bg-white rounded-lg border border-slate-200 p-2.5 shadow-sm hover:shadow-md transition-all cursor-grab active:cursor-grabbing ${
            snapshot.isDragging ? 'shadow-xl rotate-1 scale-105 opacity-95' : ''
          }`}
          onClick={(e) => {
            if (!snapshot.isDragging) navigate(createPageUrl(`ClientProfile?id=${client.id}`));
          }}
        >
          {/* Name + status dot */}
          <div className="flex items-start gap-1.5 mb-1">
            <span className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${STATUS_COLOR[client.status] || 'bg-slate-300'}`} />
            <p className="text-xs font-semibold text-slate-800 leading-tight line-clamp-1">
              {client.first_name || client.full_name}
            </p>
          </div>

          {client.clinic_name && (
            <p className="text-[11px] text-slate-500 truncate pl-3.5 mb-1.5">{client.clinic_name}</p>
          )}

          <div className="flex items-center gap-1.5 flex-wrap pl-3.5">
            {/* Score */}
            {client.purchase_score > 0 && (
              <span className="text-[10px] bg-indigo-100 text-indigo-700 rounded px-1 py-0.5 font-medium">
                {client.purchase_score}%
              </span>
            )}
            {/* Value */}
            {(client.projected_revenue || client.available_budget) > 0 && (
              <span className="text-[10px] bg-green-100 text-green-700 rounded px-1 py-0.5 font-medium">
                {fmtCurrency(client.projected_revenue || client.available_budget)}
              </span>
            )}
            {/* Days in stage */}
            {daysHere !== null && (
              <span className="text-[10px] text-slate-400 ml-auto flex items-center gap-0.5">
                <Clock className="w-2.5 h-2.5" />{daysHere}d
              </span>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}

export default function ClientPipelineKanban() {
  const queryClient = useQueryClient();

  const { data: allClients = [], isLoading } = useQuery({
    queryKey: ['clients-pipeline-kanban'],
    queryFn: () => base44.entities.Client.list('-updated_date', 500),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, pipeline_stage }) => base44.entities.Client.update(id, { pipeline_stage }),
    onSuccess: () => queryClient.invalidateQueries(['clients-pipeline-kanban']),
    onError: () => toast.error('Erro ao mover cliente'),
  });

  // Group clients by pipeline stage
  const columns = useMemo(() => {
    const cols = {};
    STAGES.forEach(s => { cols[s] = []; });
    allClients.forEach(c => {
      const stage = c.pipeline_stage || 'lead';
      if (cols[stage]) cols[stage].push(c);
    });
    return cols;
  }, [allClients]);

  // Summary totals
  const totals = useMemo(() => {
    const totalClients = allClients.length;
    const totalValue = allClients.reduce((s, c) => s + (c.projected_revenue || c.available_budget || 0), 0);
    const activeStages = ['qualificado', 'proposta', 'negociacao'];
    const activeValue = activeStages.reduce((s, stage) => 
      s + (columns[stage] || []).reduce((ss, c) => ss + (c.projected_revenue || c.available_budget || 0), 0), 0);
    return { totalClients, totalValue, activeValue };
  }, [allClients, columns]);

  const handleDragEnd = ({ source, destination, draggableId }) => {
    if (!destination || source.droppableId === destination.droppableId) return;
    const newStage = destination.droppableId;
    const client = allClients.find(c => c.id === draggableId);
    if (!client) return;

    updateMutation.mutate({ id: draggableId, pipeline_stage: newStage });
    toast.success(`${client.first_name} → ${STAGE_META[newStage].label}`);
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-64 text-slate-400">Carregando pipeline...</div>
  );

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border p-3 flex items-center gap-3">
          <Users className="w-8 h-8 text-indigo-500 bg-indigo-50 rounded-lg p-1.5" />
          <div>
            <p className="text-xs text-slate-500">Total Clientes</p>
            <p className="font-bold text-lg text-slate-800">{totals.totalClients}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-3 flex items-center gap-3">
          <DollarSign className="w-8 h-8 text-green-500 bg-green-50 rounded-lg p-1.5" />
          <div>
            <p className="text-xs text-slate-500">Pipeline Ativo</p>
            <p className="font-bold text-lg text-green-700">{fmtCurrency(totals.activeValue)}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-3 flex items-center gap-3">
          <TrendingUp className="w-8 h-8 text-purple-500 bg-purple-50 rounded-lg p-1.5" />
          <div>
            <p className="text-xs text-slate-500">Potencial Total</p>
            <p className="font-bold text-lg text-purple-700">{fmtCurrency(totals.totalValue)}</p>
          </div>
        </div>
      </div>

      {/* Kanban board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-4">
          {STAGES.map(stage => (
            <Droppable key={stage} droppableId={stage}>
              {(provided, snapshot) => (
                <StageColumn
                  stage={stage}
                  clients={columns[stage] || []}
                  provided={provided}
                  snapshot={snapshot}
                />
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>

      <p className="text-xs text-slate-400 text-center">
        ⏱ Tempo médio calculado desde a última atualização do cliente · Clique no card para abrir o perfil
      </p>
    </div>
  );
}
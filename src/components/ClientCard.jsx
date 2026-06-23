import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle } from 'lucide-react';
import ProposalModal from './ProposalModal';
import ScheduleVisitModal from './ScheduleVisitModal';
import { calcHealthScore } from './WeeklyHealthReport';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import ClientDetailsModal from './ClientDetailsModal';
import { toast } from 'sonner';

const statusColors = {
  quente: 'bg-red-500 text-white',
  morno: 'bg-yellow-500 text-white',
  frio: 'bg-blue-400 text-white'
};

const statusLabels = {
  quente: 'Quente',
  morno: 'Morno',
  frio: 'Frio'
};

const clientTypeLabels = {
  clinica_pequena: 'Clínica Pequena',
  clinica_media: 'Clínica Média',
  hospital_veterinario: 'Hospital Veterinário',
  laboratorio_terceirizado: 'Lab. Terceirizado',
  clinica_especializada: 'Clínica Especializada'
};

export default function ClientCard({ client, hasPurchase = false, scheduledVisit = null, lastVisit = null }) {
  const navigate = useNavigate();
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showProposal, setShowProposal] = useState(false);
  const [showVisitModal, setShowVisitModal] = useState(false);

  const healthScore = calcHealthScore(client);
  const healthBadge = healthScore >= 70
    ? { label: '🟢 Quente', cls: 'bg-green-100 text-green-700' }
    : healthScore >= 40
    ? { label: '🟡 Morno', cls: 'bg-yellow-100 text-yellow-700' }
    : { label: '🔴 Frio', cls: 'bg-red-100 text-red-700' };
  
  // Validação rigorosa
  if (!client || !client.id || client.is_deleted) {
    return null;
  }
  
  // Validar ID
  if (typeof client.id !== 'string' || client.id.length < 10) {
    return null;
  }
  
  const handleMoreClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDetailsModal(true);
  };
  
  const handleCardClick = () => {
    if (!client || !client.id || client.is_deleted) {
      toast.error('Cliente não encontrado ou foi removido');
      return;
    }
    navigate(createPageUrl(`ClientProfile?id=${client.id}`));
  };

  const pipelineStages = {
    diagnosticar_necessidades: { label: 'Diagnóstico', color: 'bg-blue-500' },
    apresentar_equipamento: { label: 'Apresentação', color: 'bg-purple-500' },
    demonstracao_tecnica: { label: 'Demo Técnica', color: 'bg-orange-500' },
    negociar_proposta: { label: 'Negociação', color: 'bg-amber-500' },
    fechar_venda: { label: 'Fechamento', color: 'bg-green-600' }
  };

  const currentStage = client.visit_objective || client.pipeline_stage;

  // Determinar próxima ação visível (linguagem segura)
  const nextActionLabel = client.next_action || client.ai_next_best_action || '';
  const equipFocus = client.equipment_interest || client.current_equipment || '';

  return (
    <>
      <div onClick={handleCardClick} className="cursor-pointer">
        <Card className={`p-3 hover:shadow-md transition-all duration-200 border-l-4 ${hasPurchase ? 'border-l-green-500 bg-green-50/30' : statusColors[client.status] === 'bg-red-500 text-white' ? 'border-l-red-400' : 'border-l-slate-200'} active:scale-[0.99]`}>
          {/* Linha 1: avatar + info + temperatura + score */}
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-base">
                {client.first_name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-800 truncate">{client.first_name}</h3>
                <Badge className={`${statusColors[client.status]} text-xs shrink-0`}>
                  {client.status === 'quente' ? '🔥' : client.status === 'morno' ? '🌡️' : '❄️'}
                </Badge>
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-500 flex-wrap">
                {client.clinic_name && <span className="truncate max-w-[120px]">{client.clinic_name}</span>}
                {client.clinic_name && client.city && <span>·</span>}
                {client.city && <span>{client.city}</span>}
                {client.phone && <MessageCircle className="w-3 h-3 text-green-500 ml-1 shrink-0" />}
              </div>
            </div>
            <div className="text-right shrink-0">
              {client.purchase_score > 0 && (
                <p className="text-sm font-black text-slate-700">{client.purchase_score}%</p>
              )}
              {equipFocus && (
                <p className="text-[9px] text-orange-600 font-bold truncate max-w-[70px]">{equipFocus}</p>
              )}
              {currentStage && pipelineStages[currentStage] && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded ${pipelineStages[currentStage].color} text-white font-bold`}>
                  {pipelineStages[currentStage].label}
                </span>
              )}
            </div>
          </div>

          {/* Linha 2: próxima ação (se existir) */}
          {nextActionLabel && (
            <div className="mb-2 px-2 py-1 rounded-lg bg-orange-50 border border-orange-100">
              <p className="text-[11px] text-orange-700"><span className="font-bold">→ </span>{nextActionLabel}</p>
            </div>
          )}

          {/* Linha 3: indicadores compactos */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {scheduledVisit && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold">📅 Visita agendada</span>}
            {lastVisit && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 font-bold">✓ Visitado</span>}
            {hasPurchase && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 font-bold">💰 Comprou</span>}
            {client.ai_segment && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 font-bold">{client.ai_segment}</span>}
          </div>
        </Card>
      </div>
      
      <ClientDetailsModal 
        client={client}
        open={showDetailsModal}
        onOpenChange={setShowDetailsModal}
      />
      <ProposalModal
        client={client}
        open={showProposal}
        onOpenChange={setShowProposal}
      />
      <ScheduleVisitModal
        client={client}
        open={showVisitModal}
        onOpenChange={setShowVisitModal}
      />
    </>
  );
}
import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Building2, ThermometerSun, ChevronRight, MessageCircle, MoreVertical, Tag } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
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
  
  if (!client || !client.id || client.is_deleted) {
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

  return (
    <>
      <div onClick={handleCardClick} className="cursor-pointer">
        <Card className={`p-4 hover:shadow-lg transition-all duration-200 border-l-4 ${hasPurchase ? 'border-l-green-600 bg-green-50/50' : 'border-l-slate-800'} active:scale-[0.98]`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {client.first_name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">{client.first_name}</h3>
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    {client.razao_social && <span>{client.razao_social}</span>}
                    {client.razao_social && client.clinic_name && <span>•</span>}
                    {client.clinic_name && <span>{client.clinic_name}</span>}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-400">
                    {client.cnpj && <span>CNPJ: {client.cnpj}</span>}
                    {client.cnpj && client.city && <span>•</span>}
                    {client.city && <span>{client.city}</span>}
                    {client.phone && (
                      <MessageCircle className="w-3 h-3 text-green-500 ml-1" />
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="flex flex-col gap-1 mb-1">
                  <div className="flex items-center gap-2">
                    <Badge className={`${statusColors[client.status]} text-xs`}>
                      {statusLabels[client.status]}
                    </Badge>
                    {client.custom_tags?.length > 0 && (
                      <Badge variant="outline" className="text-xs flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        {client.custom_tags.length}
                      </Badge>
                    )}
                  </div>
                  
                  {/* Indicadores de Visita */}
                  <div className="flex items-center gap-1">
                    {scheduledVisit && (
                      <Badge className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5">
                        📅 Agendada
                      </Badge>
                    )}
                    {lastVisit && (
                      <Badge className="bg-green-100 text-green-700 text-xs px-2 py-0.5">
                        ✓ Visitado
                      </Badge>
                    )}
                  </div>
                  
                  {/* Fase da Negociação */}
                  {currentStage && pipelineStages[currentStage] && (
                    <Badge className={`${pipelineStages[currentStage].color} text-white text-xs px-2 py-0.5`}>
                      {pipelineStages[currentStage].label}
                    </Badge>
                  )}
                </div>
                {client.purchase_score && (
                  <div className="text-xs text-slate-400">
                    Score: {client.purchase_score}%
                  </div>
                )}
              </div>
              <button 
                onClick={handleMoreClick}
                className="p-1 hover:bg-slate-100 rounded"
              >
                <MoreVertical className="w-4 h-4 text-slate-400" />
              </button>
              <ChevronRight className="w-5 h-5 text-slate-300" />
            </div>
          </div>
        </Card>
      </div>
      
      <ClientDetailsModal 
        client={client}
        open={showDetailsModal}
        onOpenChange={setShowDetailsModal}
      />
    </>
  );
}
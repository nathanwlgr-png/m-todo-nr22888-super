import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Building2, ThermometerSun, ChevronRight, MessageCircle, MoreVertical, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import ClientDetailsModal from './ClientDetailsModal';

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

export default function ClientCard({ client }) {
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  const handleMoreClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowDetailsModal(true);
  };

  return (
    <>
      <Link to={createPageUrl(`ClientProfile?id=${client.id}`)}>
        <Card className="p-4 hover:shadow-lg transition-all duration-200 border-l-4 border-l-slate-800 active:scale-[0.98]">
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
                <div className="flex items-center gap-2 mb-1">
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
      </Link>
      
      <ClientDetailsModal 
        client={client}
        open={showDetailsModal}
        onOpenChange={setShowDetailsModal}
      />
    </>
  );
}
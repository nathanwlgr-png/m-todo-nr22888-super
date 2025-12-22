import React from 'react';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Building2, ThermometerSun, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

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
  laboratorio: 'Laboratório',
  pet_shop: 'Pet Shop',
  agronegocio: 'Agronegócio'
};

export default function ClientCard({ client }) {
  return (
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
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Building2 className="w-3 h-3" />
                <span>{clientTypeLabels[client.client_type] || client.client_type}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <Badge className={`${statusColors[client.status]} text-xs`}>
                {statusLabels[client.status]}
              </Badge>
              {client.purchase_score && (
                <div className="text-xs text-slate-400 mt-1">
                  Score: {client.purchase_score}%
                </div>
              )}
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300" />
          </div>
        </div>
      </Card>
    </Link>
  );
}
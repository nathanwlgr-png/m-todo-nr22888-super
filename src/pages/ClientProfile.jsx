import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  MessageSquare, 
  ClipboardCheck,
  Building2,
  UserCog,
  Loader2,
  ThermometerSun
} from 'lucide-react';
import NumerologyCard from '@/components/NumerologyCard';
import ScoreBar from '@/components/ScoreBar';

const clientTypeLabels = {
  clinica_pequena: 'Clínica Pequena',
  clinica_media: 'Clínica Média',
  hospital_veterinario: 'Hospital Veterinário',
  laboratorio: 'Laboratório',
  pet_shop: 'Pet Shop',
  agronegocio: 'Agronegócio'
};

const roleLabels = {
  proprietario: 'Proprietário',
  gerente: 'Gerente',
  veterinario_chefe: 'Veterinário-Chefe',
  comprador: 'Comprador',
  socio: 'Sócio'
};

const statusColors = {
  quente: 'bg-red-500',
  morno: 'bg-yellow-500',
  frio: 'bg-blue-400'
};

export default function ClientProfile() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const clientId = urlParams.get('id');

  const { data: client, isLoading } = useQuery({
    queryKey: ['client', clientId],
    queryFn: async () => {
      const clients = await base44.entities.Client.filter({ id: clientId });
      return clients[0];
    },
    enabled: !!clientId
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">Cliente não encontrado</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 px-4 pt-4 pb-24 rounded-b-[2rem]">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-white/10">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-lg font-semibold text-white">Perfil do Cliente</h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
            <span className="text-3xl font-bold text-white">
              {client.first_name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">{client.first_name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={`${statusColors[client.status]} text-white text-xs`}>
                {client.status === 'quente' ? '🔥 Quente' : client.status === 'morno' ? '🌡️ Morno' : '❄️ Frio'}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 -mt-16 space-y-4">
        {/* Info Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 bg-white shadow-lg border-none">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-500">Tipo</span>
            </div>
            <p className="font-semibold text-slate-800 text-sm">
              {clientTypeLabels[client.client_type]}
            </p>
          </Card>
          
          <Card className="p-4 bg-white shadow-lg border-none">
            <div className="flex items-center gap-2 mb-1">
              <UserCog className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-500">Decisor</span>
            </div>
            <p className="font-semibold text-slate-800 text-sm">
              {roleLabels[client.decision_role]}
            </p>
          </Card>
        </div>

        {/* Score */}
        <Card className="p-5 bg-white shadow-md border-none">
          <ScoreBar score={client.purchase_score || 50} />
        </Card>

        {/* Numerology Profile */}
        <NumerologyCard number={client.numerology_number || 1} />

        {/* Next Action */}
        {client.next_action && (
          <Card className="p-4 bg-amber-50 border-amber-200">
            <p className="text-xs text-amber-600 font-medium mb-1">Próxima Ação</p>
            <p className="text-slate-700">{client.next_action}</p>
          </Card>
        )}
      </div>

      {/* Fixed Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t space-y-3">
        <Button
          onClick={() => navigate(createPageUrl(`PreVisitChecklist?id=${client.id}`))}
          variant="outline"
          className="w-full h-14 rounded-xl border-2 text-base font-semibold"
        >
          <ClipboardCheck className="w-5 h-5 mr-2" />
          Checklist Pré-Visita
        </Button>
        
        <Button
          onClick={() => navigate(createPageUrl(`AIAssistant?id=${client.id}`))}
          className="w-full h-14 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-xl text-base font-semibold"
        >
          <MessageSquare className="w-5 h-5 mr-2" />
          Abrir Assistente IA
        </Button>
      </div>
    </div>
  );
}
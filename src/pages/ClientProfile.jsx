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
  ThermometerSun,
  Phone,
  Sparkles
} from 'lucide-react';
import NumerologyCard from '@/components/NumerologyCard';
import ScoreBar from '@/components/ScoreBar';
import ScheduleVisitButton from '@/components/ScheduleVisitButton';
import ClientEquipmentManager from '@/components/ClientEquipmentManager';

const clientTypeLabels = {
  clinica_pequena: 'Clínica Pequena',
  clinica_media: 'Clínica Média',
  hospital_veterinario: 'Hospital Veterinário',
  laboratorio_terceirizado: 'Lab. Terceirizado',
  clinica_especializada: 'Clínica Especializada'
};

const roleLabels = {
  proprietario: 'Proprietário',
  veterinario_responsavel: 'Veterinário Responsável',
  gestor_laboratorio: 'Gestor de Laboratório',
  coordenador_tecnico: 'Coordenador Técnico',
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
      <div className="relative bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-4 pt-4 pb-24 rounded-b-[2rem] overflow-hidden tech-grid">
        <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl"></div>

        <div className="relative flex items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full glass hover:bg-white/10">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-lg font-semibold text-white">Perfil do Cliente</h1>
        </div>

        <div className="relative flex items-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg glow-orange">
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

        {/* WhatsApp Card */}
        {client.phone && (
          <a
            href={`https://wa.me/${client.phone}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <Card className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 shadow-md hover:shadow-lg transition-all active:scale-[0.98]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                    <Phone className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">Abrir WhatsApp</p>
                    <p className="text-sm text-slate-500">Conversar com {client.first_name}</p>
                  </div>
                </div>
                <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
              </div>
            </Card>
          </a>
        )}

        {/* Score */}
        <Card className="p-5 bg-white shadow-md border-none">
          <ScoreBar score={client.purchase_score || 50} />
        </Card>

        {/* Numerology Profile */}
        <NumerologyCard number={client.numerology_number || 1} />

        {/* Equipment Manager */}
        <ClientEquipmentManager clientId={client.id} clientName={client.first_name} />

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
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => navigate(createPageUrl(`FollowUpAssistant?id=${client.id}`))}
            variant="outline"
            className="h-12 rounded-xl border-2 text-sm font-semibold"
          >
            <Sparkles className="w-4 h-4 mr-1" />
            Follow-Up IA
          </Button>

          <Button
            onClick={() => navigate(createPageUrl(`PreVisitChecklist?id=${client.id}`))}
            variant="outline"
            className="h-12 rounded-xl border-2 text-sm font-semibold"
          >
            <ClipboardCheck className="w-4 h-4 mr-1" />
            Checklist
          </Button>
        </div>

        <ScheduleVisitButton client={client} />

        <Button
          onClick={() => navigate(createPageUrl(`AIAssistant?id=${client.id}`))}
          className="w-full h-14 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 rounded-xl text-base font-semibold shadow-lg shadow-orange-500/30 glow-orange"
        >
          <MessageSquare className="w-5 h-5 mr-2" />
          Abrir Assistente IA
        </Button>
      </div>
    </div>
  );
}
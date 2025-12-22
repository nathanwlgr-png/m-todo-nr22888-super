import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Plus,
  Play,
  Pause,
  Trash2,
  Mail,
  Bell,
  Clock,
  Users,
  Loader2,
  Settings
} from 'lucide-react';

const triggerLabels = {
  no_response_days: 'Sem resposta há X dias',
  proposal_sent: 'Proposta enviada',
  first_visit_done: 'Primeira visita realizada',
  status_change: 'Mudança de status',
  manual: 'Manual'
};

const statusColors = {
  quente: 'bg-red-100 text-red-700',
  morno: 'bg-yellow-100 text-yellow-700',
  frio: 'bg-blue-100 text-blue-700'
};

export default function FollowUpSequences() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: sequences = [], isLoading } = useQuery({
    queryKey: ['followup-sequences'],
    queryFn: () => base44.entities.FollowUpSequence.list('-created_date', 50)
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, active }) => base44.entities.FollowUpSequence.update(id, { active }),
    onSuccess: () => queryClient.invalidateQueries(['followup-sequences'])
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.FollowUpSequence.delete(id),
    onSuccess: () => queryClient.invalidateQueries(['followup-sequences'])
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-900 to-purple-900 px-4 pt-4 pb-16 rounded-b-[2rem]">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full glass hover:bg-white/10">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-white">Follow-Up Automático</h1>
            <p className="text-sm text-indigo-200">Sequências personalizadas</p>
          </div>
          <Button
            onClick={() => navigate(createPageUrl('CreateFollowUpSequence'))}
            className="bg-orange-600 hover:bg-orange-700"
          >
            <Plus className="w-4 h-4 mr-1" />
            Nova
          </Button>
        </div>
      </div>

      <div className="px-6 -mt-8 space-y-3">
        {sequences.length === 0 ? (
          <Card className="p-8 text-center">
            <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 mb-4">Nenhuma sequência criada</p>
            <Button onClick={() => navigate(createPageUrl('CreateFollowUpSequence'))}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeira Sequência
            </Button>
          </Card>
        ) : (
          sequences.map((seq) => (
            <Card key={seq.id} className="p-4 bg-white">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-slate-800">{seq.name}</h3>
                    {seq.active ? (
                      <Badge className="bg-green-100 text-green-700">Ativa</Badge>
                    ) : (
                      <Badge variant="outline" className="text-slate-500">Pausada</Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">{triggerLabels[seq.trigger_type]}</p>
                  {seq.trigger_days && (
                    <p className="text-xs text-amber-600 mt-1">
                      <Clock className="w-3 h-3 inline mr-1" />
                      Após {seq.trigger_days} dias sem contato
                    </p>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => toggleActiveMutation.mutate({ 
                      id: seq.id, 
                      active: !seq.active 
                    })}
                  >
                    {seq.active ? (
                      <Pause className="w-4 h-4 text-amber-600" />
                    ) : (
                      <Play className="w-4 h-4 text-green-600" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (window.confirm('Remover sequência?')) {
                        deleteMutation.mutate(seq.id);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>

              {/* Target Status */}
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-3 h-3 text-slate-400" />
                <div className="flex gap-1">
                  {seq.target_status?.map((status) => (
                    <Badge key={status} className={`${statusColors[status]} text-xs`}>
                      {status}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Steps */}
              <div className="mt-3 pt-3 border-t">
                <p className="text-xs text-slate-500 mb-2">
                  {seq.steps?.length || 0} passos configurados
                </p>
                <div className="flex gap-1">
                  {seq.steps?.map((step, i) => (
                    <div key={i} className="flex items-center gap-1 text-xs text-slate-600">
                      {step.channel === 'email' ? (
                        <Mail className="w-3 h-3 text-indigo-500" />
                      ) : step.channel === 'whatsapp' ? (
                        <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                        </svg>
                      ) : (
                        <Bell className="w-3 h-3 text-purple-500" />
                      )}
                      <span>D+{step.day_offset}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Info Card */}
      <div className="px-6 mt-6">
        <Card className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
          <div className="flex items-start gap-3">
            <Settings className="w-5 h-5 text-indigo-600 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-800 mb-1">Como funciona</p>
              <ul className="text-xs text-slate-600 space-y-1">
                <li>• Sequências são ativadas automaticamente por gatilhos</li>
                <li>• Mensagens personalizadas com dados do cliente</li>
                <li>• Adaptação por numerologia e perfil comportamental</li>
                <li>• Logs de todos os envios ficam salvos</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
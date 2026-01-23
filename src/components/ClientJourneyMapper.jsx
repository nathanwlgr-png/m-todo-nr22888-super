import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Circle, ArrowRight, Calendar, MessageSquare, TrendingUp, Target } from 'lucide-react';

export default function ClientJourneyMapper({ client }) {
  const { data: visits = [] } = useQuery({
    queryKey: ['client-visits', client.id],
    queryFn: () => base44.entities.Visit.filter({ client_id: client.id })
  });

  const { data: interactions = [] } = useQuery({
    queryKey: ['client-interactions', client.id],
    queryFn: () => base44.entities.Interaction.filter({ client_id: client.id })
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['client-sales', client.id],
    queryFn: () => base44.entities.Sale.filter({ client_id: client.id })
  });

  // Define journey stages
  const stages = [
    { id: 'discovery', label: 'Descoberta', icon: Target, color: 'bg-blue-500' },
    { id: 'qualification', label: 'Qualificação', icon: MessageSquare, color: 'bg-purple-500' },
    { id: 'demo', label: 'Demonstração', icon: TrendingUp, color: 'bg-orange-500' },
    { id: 'proposal', label: 'Proposta', icon: Calendar, color: 'bg-yellow-500' },
    { id: 'negotiation', label: 'Negociação', icon: TrendingUp, color: 'bg-indigo-500' },
    { id: 'closed', label: 'Fechado', icon: CheckCircle2, color: 'bg-green-500' }
  ];

  // Determine current stage
  const getCurrentStage = () => {
    if (sales.some(s => s.status === 'fechada')) return 5;
    if (client.pipeline_stage === 'negociacao') return 4;
    if (client.pipeline_stage === 'proposta') return 3;
    if (visits.some(v => v.visit_type === 'demonstracao')) return 2;
    if (interactions.length > 0) return 1;
    return 0;
  };

  const currentStage = getCurrentStage();

  // Calculate stage metrics
  const getStageMetrics = (stageIndex) => {
    switch (stageIndex) {
      case 0:
        return {
          completed: interactions.length > 0,
          count: interactions.filter(i => i.type === 'call' || i.type === 'email').length,
          date: interactions[0]?.created_date
        };
      case 1:
        return {
          completed: client.purchase_score >= 60,
          count: interactions.filter(i => i.type === 'meeting').length,
          date: interactions.find(i => i.type === 'meeting')?.created_date
        };
      case 2:
        return {
          completed: visits.some(v => v.visit_type === 'demonstracao'),
          count: visits.filter(v => v.visit_type === 'demonstracao').length,
          date: visits.find(v => v.visit_type === 'demonstracao')?.created_date
        };
      case 3:
        return {
          completed: client.pipeline_stage === 'proposta' || currentStage > 3,
          count: interactions.filter(i => i.type === 'proposal_sent').length,
          date: interactions.find(i => i.type === 'proposal_sent')?.created_date
        };
      case 4:
        return {
          completed: client.pipeline_stage === 'negociacao' || currentStage > 4,
          count: interactions.filter(i => i.type === 'negotiation').length,
          date: interactions.find(i => i.type === 'negotiation')?.created_date
        };
      case 5:
        return {
          completed: sales.some(s => s.status === 'fechada'),
          count: sales.filter(s => s.status === 'fechada').length,
          date: sales.find(s => s.status === 'fechada')?.created_date
        };
      default:
        return { completed: false, count: 0, date: null };
    }
  };

  // Calculate journey duration
  const journeyDuration = () => {
    if (interactions.length === 0) return 'Novo';
    const firstContact = new Date(interactions[interactions.length - 1].created_date);
    const now = new Date();
    const days = Math.floor((now - firstContact) / (1000 * 60 * 60 * 24));
    return `${days} dias`;
  };

  // Next action recommendation
  const getNextAction = () => {
    if (currentStage === 0) return 'Agendar primeira reunião';
    if (currentStage === 1) return 'Qualificar necessidades e orçamento';
    if (currentStage === 2) return 'Agendar demonstração técnica';
    if (currentStage === 3) return 'Enviar proposta comercial';
    if (currentStage === 4) return 'Negociar condições e fechar';
    return 'Pós-venda e upsell';
  };

  return (
    <Card className="p-4 bg-gradient-to-br from-slate-50 to-white border-2 border-slate-300">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-bold text-slate-900">🗺️ Jornada do Cliente</h4>
        <Badge className="bg-indigo-600 text-white">{journeyDuration()}</Badge>
      </div>

      {/* Timeline */}
      <div className="relative">
        {stages.map((stage, index) => {
          const metrics = getStageMetrics(index);
          const isActive = currentStage === index;
          const isCompleted = currentStage > index;
          const Icon = stage.icon;

          return (
            <div key={stage.id} className="relative">
              <div className={`flex items-start gap-3 pb-4 ${index < stages.length - 1 ? 'border-l-2 ml-4' : ''} ${isCompleted ? 'border-green-500' : isActive ? 'border-orange-500' : 'border-slate-300'}`}>
                <div className={`w-10 h-10 rounded-full ${isCompleted ? 'bg-green-500' : isActive ? 'bg-orange-500' : 'bg-slate-300'} flex items-center justify-center shadow-lg -ml-5 z-10`}>
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  ) : isActive ? (
                    <Icon className="w-5 h-5 text-white animate-pulse" />
                  ) : (
                    <Circle className="w-5 h-5 text-white" />
                  )}
                </div>

                <div className="flex-1 -mt-1">
                  <div className="flex items-center justify-between mb-1">
                    <p className={`text-sm font-bold ${isCompleted ? 'text-green-700' : isActive ? 'text-orange-700' : 'text-slate-600'}`}>
                      {stage.label}
                    </p>
                    {metrics.count > 0 && (
                      <Badge variant="outline" className="text-xs">
                        {metrics.count}x
                      </Badge>
                    )}
                  </div>

                  {metrics.date && (
                    <p className="text-xs text-slate-500">
                      {new Date(metrics.date).toLocaleDateString('pt-BR')}
                    </p>
                  )}

                  {isActive && (
                    <div className="mt-2 p-2 bg-orange-50 rounded-lg border border-orange-300">
                      <p className="text-xs font-semibold text-orange-800">
                        <ArrowRight className="w-3 h-3 inline mr-1" />
                        Próxima ação: {getNextAction()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Journey Stats */}
      <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-2">
        <div className="text-center">
          <p className="text-xs text-slate-600">Interações</p>
          <p className="text-lg font-bold text-indigo-600">{interactions.length}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-600">Visitas</p>
          <p className="text-lg font-bold text-purple-600">{visits.length}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-600">Progresso</p>
          <p className="text-lg font-bold text-green-600">{Math.round((currentStage / 5) * 100)}%</p>
        </div>
      </div>
    </Card>
  );
}
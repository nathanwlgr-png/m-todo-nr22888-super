import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Brain, TrendingUp, Clock, DollarSign, Zap, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';

export default function AIPriorityLeads() {
  const [generating, setGenerating] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: priorities = [] } = useQuery({
    queryKey: ['lead-priorities', user?.email],
    queryFn: () => base44.entities.LeadPriority.filter({ assigned_to: user.email }),
    enabled: !!user,
  });

  const generatePriorities = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('prioritizeLeads', {
        user_email: user.email
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['lead-priorities']);
      toast.success('Prioridades atualizadas!');
      setGenerating(false);
    },
    onError: () => {
      toast.error('Erro ao gerar prioridades');
      setGenerating(false);
    }
  });

  const handleGenerate = () => {
    setGenerating(true);
    generatePriorities.mutate();
  };

  const sortedPriorities = priorities
    .sort((a, b) => b.priority_score - a.priority_score)
    .slice(0, 10);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-indigo-600" />
            Próximas Ações Prioritárias (IA)
          </CardTitle>
          <Button 
            size="sm" 
            onClick={handleGenerate} 
            disabled={generating}
            className="bg-indigo-600"
          >
            <Zap className="w-4 h-4 mr-2" />
            {generating ? 'Gerando...' : 'Atualizar'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {sortedPriorities.length === 0 ? (
          <div className="text-center py-8">
            <Brain className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-slate-500 mb-4">Nenhuma prioridade gerada ainda</p>
            <Button onClick={handleGenerate} disabled={generating}>
              {generating ? 'Analisando...' : 'Gerar Prioridades com IA'}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedPriorities.map((priority) => (
              <Card 
                key={priority.id}
                className={
                  priority.priority_level === 'urgente' ? 'bg-red-50 border-red-200' :
                  priority.priority_level === 'alta' ? 'bg-orange-50 border-orange-200' :
                  priority.priority_level === 'media' ? 'bg-yellow-50 border-yellow-200' :
                  'bg-blue-50 border-blue-200'
                }
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{priority.lead_name}</h4>
                        <Badge className={
                          priority.priority_level === 'urgente' ? 'bg-red-500' :
                          priority.priority_level === 'alta' ? 'bg-orange-500' :
                          priority.priority_level === 'media' ? 'bg-yellow-500' : 'bg-blue-500'
                        }>
                          {priority.priority_level}
                        </Badge>
                      </div>
                      <p className="text-sm font-semibold text-indigo-600 mb-2">
                        {priority.recommended_action}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-indigo-600">{priority.priority_score}</div>
                      <p className="text-xs text-slate-500">score</p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-3">
                    {priority.ai_reasoning?.slice(0, 3).map((reason, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <TrendingUp className="w-4 h-4 text-indigo-600 mt-0.5" />
                        <p className="text-xs text-slate-700">{reason}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-600 mb-3">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {priority.best_contact_time}
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {priority.conversion_probability}% conversão
                    </div>
                    {priority.estimated_value > 0 && (
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        R$ {priority.estimated_value?.toLocaleString('pt-BR')}
                      </div>
                    )}
                  </div>

                  <Link to={createPageUrl(`ClientProfile?id=${priority.lead_id}`)}>
                    <Button size="sm" variant="outline" className="w-full">
                      Ver Perfil
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
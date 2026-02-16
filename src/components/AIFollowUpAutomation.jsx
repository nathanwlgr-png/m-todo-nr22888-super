import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Sparkles, Send, Clock, AlertCircle, CheckCircle2,
  Zap, TrendingUp, MessageSquare, Calendar
} from 'lucide-react';

export default function AIFollowUpAutomation({ clientId = null }) {
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const queryClient = useQueryClient();

  // Analyze single client
  const analyzeQuery = useQuery({
    queryKey: ['followup-analysis', clientId],
    queryFn: async () => {
      if (!clientId) return null;
      const response = await base44.functions.invoke('aiFollowUpAutomation', {
        action: 'analyze',
        clientId
      });
      return response.data;
    },
    enabled: !!clientId
  });

  // Get all suggestions
  const suggestionsQuery = useQuery({
    queryKey: ['followup-suggestions'],
    queryFn: async () => {
      const response = await base44.functions.invoke('aiFollowUpAutomation', {
        action: 'get_suggestions'
      });
      return response.data.suggestions;
    },
    refetchInterval: 60000
  });

  // Schedule follow-up
  const scheduleMutation = useMutation({
    mutationFn: async ({ cId, data }) => {
      const response = await base44.functions.invoke('aiFollowUpAutomation', {
        action: 'schedule_followup',
        clientId: cId,
        followUpData: data
      });
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
      queryClient.invalidateQueries(['followup-suggestions']);
      setSelectedSuggestion(null);
    },
    onError: () => toast.error('Erro ao agendar')
  });

  if (clientId && analyzeQuery.isLoading) {
    return (
      <Card className="p-6 text-center">
        <Sparkles className="w-8 h-8 mx-auto mb-2 animate-spin text-purple-600" />
        <p className="text-sm text-slate-600">Analisando cliente...</p>
      </Card>
    );
  }

  const analysis = clientId ? analyzeQuery.data?.analysis : null;

  return (
    <div className="space-y-4">
      {/* ANÁLISE DO CLIENTE */}
      {analysis && (
        <Card className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <h3 className="font-bold text-purple-900">Análise de Follow-up IA</h3>
            </div>
            <Badge className={
              analysis.urgency === 'alto' ? 'bg-red-500' :
              analysis.urgency === 'médio' ? 'bg-orange-500' : 'bg-blue-500'
            }>
              {analysis.urgency?.toUpperCase()}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white p-3 rounded-lg">
              <p className="text-xs text-slate-600 mb-1">Probabilidade Conversão</p>
              <p className="text-2xl font-bold text-purple-600">{analysis.predicted_conversion_probability || 0}%</p>
            </div>
            <div className="bg-white p-3 rounded-lg">
              <p className="text-xs text-slate-600 mb-1">Contatar em</p>
              <p className="text-2xl font-bold text-purple-600">{analysis.days_to_contact || 3} dias</p>
            </div>
          </div>

          <div className="space-y-3 mb-4">
            <div>
              <p className="text-xs font-semibold text-slate-700 mb-1">Canal Recomendado</p>
              <Badge className="bg-white text-slate-800">{analysis.recommended_channel}</Badge>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-700 mb-1">Melhor Horário</p>
              <p className="text-sm text-slate-600">{analysis.best_time_window}</p>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-700 mb-1">Principais Dores</p>
              <div className="flex flex-wrap gap-1">
                {analysis.key_pain_points?.map((pain, i) => (
                  <Badge key={i} variant="outline" className="text-xs">{pain}</Badge>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-700 mb-1">Motivo</p>
              <p className="text-sm text-slate-600">{analysis.reason}</p>
            </div>
          </div>

          <div className="bg-white p-3 rounded-lg mb-4">
            <p className="text-xs font-semibold text-slate-700 mb-2">Sugestão de Mensagem</p>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{analysis.message_suggestion}</p>
          </div>

          <Button
            onClick={() => scheduleMutation.mutate({ cId: clientId, data: analysis })}
            disabled={scheduleMutation.isPending}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Agendar Follow-up
          </Button>
        </Card>
      )}

      {/* SUGESTÕES GERAIS */}
      {!clientId && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-600" />
              Follow-ups Sugeridos
            </h3>
            <Badge variant="outline">{suggestionsQuery.data?.length || 0}</Badge>
          </div>

          {suggestionsQuery.isLoading ? (
            <p className="text-sm text-slate-500 text-center py-4">Carregando sugestões...</p>
          ) : suggestionsQuery.data?.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">Nenhum follow-up necessário no momento</p>
          ) : (
            <div className="space-y-3">
              {suggestionsQuery.data?.map((suggestion, idx) => (
                <Card
                  key={idx}
                  className={`p-3 cursor-pointer transition-all border-l-4 ${
                    suggestion.urgency === 'alto' ? 'border-red-500 bg-red-50' :
                    suggestion.urgency === 'médio' ? 'border-orange-500 bg-orange-50' :
                    'border-blue-500 bg-blue-50'
                  }`}
                  onClick={() => setSelectedSuggestion(suggestion)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-sm">{suggestion.client_name}</p>
                      <p className="text-xs text-slate-600">Conversão: {suggestion.predicted_conversion_probability}%</p>
                    </div>
                    <Badge className={
                      suggestion.urgency === 'alto' ? 'bg-red-500' :
                      suggestion.urgency === 'médio' ? 'bg-orange-500' : 'bg-blue-500'
                    }>
                      {suggestion.urgency?.toUpperCase()}
                    </Badge>
                  </div>

                  <p className="text-xs text-slate-600 mb-2">{suggestion.reason}</p>

                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      scheduleMutation.mutate({
                        cId: suggestion.client_id,
                        data: suggestion
                      });
                    }}
                    disabled={scheduleMutation.isPending}
                    size="sm"
                    className="w-full bg-slate-800 hover:bg-slate-900 h-8"
                  >
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Agendar
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
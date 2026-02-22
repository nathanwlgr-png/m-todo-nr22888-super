import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Lightbulb, TrendingUp, Zap } from 'lucide-react';
import { toast } from 'sonner';

export default function AIAutomationSuggestions({ onSuggestionsLoaded }) {
  const [suggestions, setSuggestions] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const loadSuggestions = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('suggestAutomations', {});
      setSuggestions(response.data.suggestions || []);
      setMetrics(response.data.crmMetrics);
      setExpanded(true);
      if (onSuggestionsLoaded) {
        onSuggestionsLoaded(response.data.suggestions);
      }
      toast.success('Automações sugeridas com sucesso!');
    } catch (error) {
      toast.error('Erro ao gerar sugestões');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const priorityColors = {
    alta: 'bg-red-100 text-red-800 border-red-300',
    media: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    baixa: 'bg-green-100 text-green-800 border-green-300'
  };

  return (
    <Card className="border-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Lightbulb className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-black text-lg text-slate-900">Sugestões IA</h3>
              <p className="text-xs text-slate-600">Automações inteligentes baseadas no CRM</p>
            </div>
          </div>
          <Button
            onClick={loadSuggestions}
            disabled={loading}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Analisando...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Gerar Sugestões
              </>
            )}
          </Button>
        </div>

        {/* Métricas do CRM */}
        {metrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 bg-white rounded-lg p-4 border border-slate-200">
            <div className="text-center">
              <p className="text-2xl font-black text-indigo-600">{metrics.coldClients}</p>
              <p className="text-xs text-slate-600">❄️ Clientes Frios</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-yellow-600">{metrics.warmClients}</p>
              <p className="text-xs text-slate-600">🌡️ Clientes Mornos</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-red-600">{metrics.hotClients}</p>
              <p className="text-xs text-slate-600">🔥 Clientes Quentes</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-black text-purple-600">{metrics.clientsWithoutContactDays}</p>
              <p className="text-xs text-slate-600">⏰ Sem contato 30+d</p>
            </div>
          </div>
        )}

        {/* Sugestões */}
        {expanded && suggestions.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              {suggestions.length} Automação(ões) Sugerida(s)
            </p>
            {suggestions.map((suggestion, idx) => (
              <div
                key={idx}
                className="bg-white rounded-lg p-4 border-2 border-purple-200 hover:border-purple-400 transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-bold text-slate-900">{suggestion.name}</h4>
                    <p className="text-xs text-slate-600 mt-1">{suggestion.description}</p>
                  </div>
                  <Badge className={`${priorityColors[suggestion.priority]} border`}>
                    {suggestion.priority === 'alta' ? '🔴' : suggestion.priority === 'media' ? '🟡' : '🟢'} {suggestion.priority}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                  <div className="bg-purple-50 p-2 rounded border border-purple-200">
                    <span className="font-semibold text-purple-900">Gatilho:</span> {suggestion.trigger_type.replace(/_/g, ' ')}
                  </div>
                  <div className="bg-indigo-50 p-2 rounded border border-indigo-200">
                    <span className="font-semibold text-indigo-900">Ação:</span> {suggestion.action_type.replace(/_/g, ' ')}
                  </div>
                </div>

                <p className="text-xs text-slate-700 mt-2 bg-amber-50 p-2 rounded border border-amber-200">
                  <span className="font-semibold">Impacto:</span> {suggestion.expectedImpact}
                </p>
              </div>
            ))}
          </div>
        )}

        {!expanded && (
          <p className="text-sm text-slate-600 text-center py-4">Clique em "Gerar Sugestões" para receber recomendações baseadas em IA</p>
        )}
      </CardContent>
    </Card>
  );
}
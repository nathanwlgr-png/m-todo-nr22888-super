import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Sparkles, Loader2, Target, AlertTriangle, CheckCircle2, 
  MessageSquare, Mail, Phone, Calendar, Copy, Send,
  TrendingUp, Shield, Zap, ChevronDown, ChevronUp
} from 'lucide-react';
import { toast } from 'sonner';

export default function PipelineActionRecommender({ client }) {
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    actions: true,
    objections: false,
    scripts: false,
    strategy: false
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const generateRecommendations = async () => {
    if (!client?.id) return;

    setLoading(true);
    try {
      const result = await base44.functions.invoke('generatePipelineActions', {
        client_id: client.id
      });

      setRecommendations(result.recommendations);
      toast.success('Recomendações geradas!');
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao gerar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado!');
  };

  const urgencyConfig = {
    critical: { color: 'bg-red-600', label: '🚨 CRÍTICO', icon: AlertTriangle },
    high: { color: 'bg-orange-600', label: '⚡ ALTA', icon: Zap },
    medium: { color: 'bg-yellow-600', label: '⏰ MÉDIA', icon: Target },
    low: { color: 'bg-blue-600', label: '📋 BAIXA', icon: CheckCircle2 }
  };

  const channelIcons = {
    email: Mail,
    whatsapp: MessageSquare,
    telefone: Phone,
    presencial: Calendar
  };

  if (!recommendations) {
    return (
      <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-indigo-900">
            <Target className="w-5 h-5" />
            Ações Pipeline IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-700 mb-4">
            Gere recomendações estratégicas personalizadas para avançar este cliente no pipeline.
          </p>
          <Button
            onClick={generateRecommendations}
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            Gerar Recomendações IA
          </Button>
        </CardContent>
      </Card>
    );
  }

  const urgency = urgencyConfig[recommendations.urgency_level] || urgencyConfig.medium;
  const UrgencyIcon = urgency.icon;

  return (
    <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-300">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-indigo-900">
            <Target className="w-5 h-5" />
            Ações Pipeline IA
          </CardTitle>
          <Button
            onClick={generateRecommendations}
            disabled={loading}
            size="sm"
            variant="outline"
          >
            <Sparkles className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Urgência e Confiança */}
        <div className="grid grid-cols-2 gap-3">
          <div className={`p-3 ${urgency.color} rounded-lg text-white`}>
            <div className="flex items-center gap-2 mb-1">
              <UrgencyIcon className="w-4 h-4" />
              <p className="text-xs font-semibold">URGÊNCIA</p>
            </div>
            <p className="font-bold">{urgency.label}</p>
          </div>
          <div className="p-3 bg-purple-600 rounded-lg text-white">
            <p className="text-xs font-semibold mb-1">CONFIANÇA IA</p>
            <p className="text-2xl font-bold">{recommendations.ai_confidence}%</p>
            <Progress value={recommendations.ai_confidence} className="mt-1 h-1 bg-purple-400" />
          </div>
        </div>

        {/* Diagnóstico */}
        <div className="p-3 bg-white rounded-lg border-2 border-indigo-200">
          <p className="text-xs font-semibold text-indigo-700 mb-1">📊 DIAGNÓSTICO DO ESTÁGIO</p>
          <p className="text-sm text-gray-700">{recommendations.stage_diagnosis}</p>
        </div>

        {/* Ações Imediatas */}
        <div>
          <button
            onClick={() => toggleSection('actions')}
            className="w-full flex items-center justify-between p-3 bg-green-50 rounded-lg border-2 border-green-300 mb-2"
          >
            <h4 className="font-bold text-green-900 flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Ações Imediatas ({recommendations.immediate_actions?.length || 0})
            </h4>
            {expandedSections.actions ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          
          {expandedSections.actions && (
            <div className="space-y-2">
              {recommendations.immediate_actions?.map((action, idx) => {
                const ChannelIcon = channelIcons[action.channel] || Target;
                return (
                  <div key={idx} className="p-3 bg-white rounded-lg border-l-4 border-green-500">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={
                            action.priority === 'alta' ? 'bg-red-600' :
                            action.priority === 'media' ? 'bg-yellow-600' : 'bg-blue-600'
                          }>
                            {action.priority}
                          </Badge>
                          <Badge variant="outline">
                            <ChannelIcon className="w-3 h-3 mr-1" />
                            {action.channel}
                          </Badge>
                        </div>
                        <p className="font-semibold text-gray-800 text-sm">{action.action}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">{action.timing}</p>
                        <p className="text-sm font-bold text-green-600">{action.success_probability}%</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      <strong>Resultado:</strong> {action.expected_outcome}
                    </p>
                    <Progress value={action.success_probability} className="mt-2 h-1" />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Controle de Objeções */}
        <div>
          <button
            onClick={() => toggleSection('objections')}
            className="w-full flex items-center justify-between p-3 bg-red-50 rounded-lg border-2 border-red-300 mb-2"
          >
            <h4 className="font-bold text-red-900 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Controle de Objeções ({recommendations.objection_handlers?.length || 0})
            </h4>
            {expandedSections.objections ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          
          {expandedSections.objections && (
            <div className="space-y-3">
              {recommendations.objection_handlers?.map((handler, idx) => (
                <div key={idx} className="p-3 bg-white rounded-lg border-l-4 border-red-500">
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-sm font-semibold text-gray-800">
                      ⚠️ "{handler.objection}"
                    </p>
                    <Badge variant="outline" className="text-xs">
                      {handler.response_framework}
                    </Badge>
                  </div>
                  
                  <div className="p-3 bg-blue-50 rounded-lg mb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-blue-700 mb-1">RESPOSTA PRONTA:</p>
                        <p className="text-sm text-gray-800 italic">"{handler.exact_phrase}"</p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(handler.exact_phrase)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  <div className="p-2 bg-purple-50 rounded-lg">
                    <p className="text-xs font-semibold text-purple-700 mb-1">Pergunta de Aprofundamento:</p>
                    <p className="text-xs text-gray-700 italic">"{handler.follow_up_question}"</p>
                  </div>

                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      Tom: {handler.tone}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Scripts Personalizados */}
        <div>
          <button
            onClick={() => toggleSection('scripts')}
            className="w-full flex items-center justify-between p-3 bg-purple-50 rounded-lg border-2 border-purple-300 mb-2"
          >
            <h4 className="font-bold text-purple-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Scripts Personalizados
            </h4>
            {expandedSections.scripts ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          
          {expandedSections.scripts && recommendations.personalized_scripts && (
            <div className="space-y-2">
              <div className="p-3 bg-white rounded-lg border">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold text-purple-700">🎬 ABERTURA</p>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(recommendations.personalized_scripts.opening)}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
                <p className="text-sm text-gray-700 italic">"{recommendations.personalized_scripts.opening}"</p>
              </div>

              <div className="p-3 bg-white rounded-lg border">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold text-blue-700">💎 PROPOSTA DE VALOR</p>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(recommendations.personalized_scripts.value_proposition)}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
                <p className="text-sm text-gray-700">{recommendations.personalized_scripts.value_proposition}</p>
              </div>

              <div className="p-3 bg-white rounded-lg border">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold text-green-700">🎯 FECHAMENTO</p>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(recommendations.personalized_scripts.closing_attempt)}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
                <p className="text-sm text-gray-700 italic">"{recommendations.personalized_scripts.closing_attempt}"</p>
              </div>
            </div>
          )}
        </div>

        {/* Estratégia de Avanço */}
        <div>
          <button
            onClick={() => toggleSection('strategy')}
            className="w-full flex items-center justify-between p-3 bg-blue-50 rounded-lg border-2 border-blue-300 mb-2"
          >
            <h4 className="font-bold text-blue-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Estratégia de Avanço
            </h4>
            {expandedSections.strategy ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          
          {expandedSections.strategy && recommendations.pipeline_advancement_strategy && (
            <div className="space-y-3">
              <div className="p-3 bg-white rounded-lg border-2 border-blue-200">
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <p className="text-xs text-gray-500">Próximo Estágio</p>
                    <p className="font-bold text-blue-900">{recommendations.pipeline_advancement_strategy.next_stage}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Tempo Estimado</p>
                    <p className="font-bold text-blue-900">{recommendations.pipeline_advancement_strategy.estimated_days} dias</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-blue-700">Marcos Necessários:</p>
                  {recommendations.pipeline_advancement_strategy.milestones_needed?.map((milestone, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{milestone}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-3 space-y-1">
                  <p className="text-xs font-semibold text-blue-700">Ações Críticas:</p>
                  {recommendations.pipeline_advancement_strategy.key_actions?.map((action, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm">
                      <span className="text-blue-600 font-bold">{idx + 1}.</span>
                      <span className="text-gray-700">{action}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Wins */}
        {recommendations.quick_wins?.length > 0 && (
          <div className="p-3 bg-green-50 rounded-lg border-2 border-green-300">
            <p className="text-xs font-semibold text-green-800 mb-2 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              GANHOS RÁPIDOS
            </p>
            <div className="space-y-1">
              {recommendations.quick_wins.map((win, idx) => (
                <div key={idx} className="flex items-start gap-2 text-sm">
                  <span className="text-green-600">✓</span>
                  <span className="text-gray-700">{win}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fatores de Risco */}
        {recommendations.risk_factors?.length > 0 && (
          <div className="p-3 bg-orange-50 rounded-lg border-2 border-orange-300">
            <p className="text-xs font-semibold text-orange-800 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              FATORES DE RISCO
            </p>
            <div className="space-y-2">
              {recommendations.risk_factors.map((factor, idx) => (
                <div key={idx} className="p-2 bg-white rounded border border-orange-200">
                  <p className="text-sm font-semibold text-gray-800">⚠️ {factor.risk}</p>
                  <p className="text-xs text-gray-600 mt-1">
                    <strong>Mitigação:</strong> {factor.mitigation}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <Button
          onClick={generateRecommendations}
          variant="outline"
          className="w-full"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Atualizar Recomendações
        </Button>
      </CardContent>
    </Card>
  );
}
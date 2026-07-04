import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useMutation } from '@tanstack/react-query';
import { MessageSquare, Sparkles, Send, Zap, Brain, Users, Target, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

export default function MasterWhatsAppAssistant({ client }) {
  const [messageContext, setMessageContext] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMessage, setGeneratedMessage] = useState('');
  const [clinicIntelligence, setClinicIntelligence] = useState(null);
  const [masterAnalysis, setMasterAnalysis] = useState(null);

  if (!client) {
    return (
      <div className="text-center py-8 text-slate-500">
        <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Selecione um cliente</p>
      </div>
    );
  }

  // Análise master (numerologia + classificação de leads)
  const fetchMasterAnalysis = async () => {
    try {
      const response = await base44.functions.invoke('masterConsultantAnalysis', {
        client_id: client.id,
        message_context: messageContext
      });
      setMasterAnalysis(response.data);
      return response.data;
    } catch (error) {
      toast.error('Erro ao analisar cliente');
      console.error(error);
    }
  };

  // Buscar inteligência da clínica (web search)
  const fetchClinicIntelligence = async () => {
    try {
      const response = await base44.functions.invoke('realTimeClinicIntelligence', {
        clinic_name: client.clinic_name,
        city: client.city
      });
      setClinicIntelligence(response.data);
      return response.data;
    } catch (error) {
      console.warn('Inteligência da clínica não disponível');
    }
  };

  // Gerar mensagem com orquestração dual IA
  const generateMessage = async () => {
    if (!messageContext.trim()) {
      toast.error('Descreva o contexto da mensagem');
      return;
    }

    setIsGenerating(true);
    try {
      // Buscar análise e inteligência em paralelo
      const [analysis, intelligence] = await Promise.all([
        fetchMasterAnalysis(),
        fetchClinicIntelligence()
      ]);

      // Gerar mensagem com dual IA
      const response = await base44.functions.invoke('dualAIMessageOrchestration', {
        client_id: client.id,
        clinic_intelligence: intelligence?.clinic_intelligence,
        numerology_profile: analysis?.numerology,
        current_message_context: messageContext
      });

      setGeneratedMessage(response.data.final_message);
      toast.success('✅ Mensagem gerada com sucesso!');
    } catch (error) {
      toast.error('❌ Erro ao gerar mensagem');
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Card de análise master */}
      {masterAnalysis && (
        <Card className="border-2 border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-purple-900">
              <Brain className="w-5 h-5" />
              Análise Master
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-3 rounded-lg border border-purple-200">
                <p className="text-xs text-slate-600 font-semibold">Numerologia</p>
                <p className="text-lg font-bold text-purple-600">{masterAnalysis.numerology.number}</p>
                <p className="text-xs text-slate-700">{masterAnalysis.numerology.profile}</p>
                {masterAnalysis.numerology.is_master && (
                  <p className="text-xs text-purple-600 mt-1">✨ MESTRE (11/22)</p>
                )}
              </div>
              
              <div className="bg-white p-3 rounded-lg border border-blue-200">
                <p className="text-xs text-slate-600 font-semibold">Lead Score</p>
                <p className="text-lg font-bold text-blue-600">{masterAnalysis.lead_classification.score}</p>
                <p className="text-xs text-slate-700">{masterAnalysis.lead_classification.level}</p>
              </div>
            </div>

            <div className="bg-white p-3 rounded-lg border border-slate-200">
              <p className="text-xs text-slate-600 font-semibold mb-2">Próxima Abordagem</p>
              <div className="space-y-1 text-xs">
                <p><strong>Metodologia:</strong> {masterAnalysis.next_steps.methodology}</p>
                <p><strong>Gatilho:</strong> {masterAnalysis.next_steps.trigger_to_use}</p>
                <p><strong>Melhor horário:</strong> {masterAnalysis.next_steps.best_time}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Card de inteligência da clínica */}
      {clinicIntelligence && (
        <Card className="border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <TrendingUp className="w-5 h-5" />
              Inteligência da Clínica
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p><strong>Especialidades:</strong> {clinicIntelligence.clinic_intelligence?.specialties?.join(', ') || 'Não identificadas'}</p>
            <p><strong>Volume estimado:</strong> {clinicIntelligence.clinic_intelligence?.estimated_exams_per_month || '?'} exames/mês</p>
            <p><strong>Equipamentos:</strong> {clinicIntelligence.clinic_intelligence?.current_equipment?.join(', ') || 'Não identificados'}</p>
            <p><strong>Estilo:</strong> {clinicIntelligence.clinic_intelligence?.communication_style}</p>
          </CardContent>
        </Card>
      )}

      {/* Card de geração de mensagem */}
      <Card className="border-2 border-green-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-900">
            <Sparkles className="w-5 h-5" />
            Maestro de Mensagens - Nathan SEAMATY Brasil
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-slate-900 block mb-2">
              Contexto da Mensagem
            </label>
            <Textarea
              placeholder="Ex: Cliente respondeu pedindo mais informações sobre o SMT-120VP. Mencionou preocupação com preço..."
              value={messageContext}
              onChange={(e) => setMessageContext(e.target.value)}
              className="min-h-24"
            />
          </div>

          <Button
            onClick={generateMessage}
            disabled={isGenerating || !messageContext.trim()}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
          >
            {isGenerating ? (
              <>
                <Zap className="w-4 h-4 mr-2 animate-spin" />
                Orquestrando IAs...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Gerar Mensagem Master
              </>
            )}
          </Button>

          {generatedMessage && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 p-4 rounded-lg">
              <p className="text-xs font-semibold text-slate-600 mb-2">MENSAGEM GERADA:</p>
              <p className="text-sm text-slate-900 whitespace-pre-wrap font-mono">{generatedMessage}</p>
              
              <div className="flex gap-2 mt-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedMessage);
                    toast.success('Copiado!');
                  }}
                >
                  Copiar
                </Button>
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    const whatsappUrl = `https://wa.me/${client.phone}?text=${encodeURIComponent(generatedMessage)}`;
                    window.open(whatsappUrl, '_blank');
                  }}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Enviar WhatsApp
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
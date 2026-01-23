import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Mic, MicOff, Loader2, Sparkles, UserPlus, UserCheck, Search, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function VoiceClientScanner() {
  const navigate = useNavigate();
  const [mode, setMode] = useState(null); // 'new', 'existing', 'analysis'
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const recognitionRef = React.useRef(null);

  React.useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = 'pt-BR';
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
        setRecording(false);
        processVoiceInput(text);
      };

      recognitionRef.current.onerror = () => {
        toast.error('Erro ao gravar. Tente novamente.');
        setRecording(false);
      };

      recognitionRef.current.onend = () => {
        setRecording(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [mode]);

  const toggleRecording = () => {
    if (!mode) {
      toast.error('Selecione um modo primeiro');
      return;
    }

    if (recording) {
      recognitionRef.current?.stop();
      setRecording(false);
    } else {
      recognitionRef.current?.start();
      setRecording(true);
      toast.success('Gravando... Fale o nome da clínica');
    }
  };

  const processVoiceInput = async (clinicName) => {
    setProcessing(true);
    try {
      const prompt = `Você é um assistente especializado em pesquisa empresarial e análise de mercado veterinário.

TAREFA: Pesquise na internet dados completos sobre a clínica mencionada.

CLÍNICA MENCIONADA: "${clinicName}"

INSTRUÇÕES:
1. Pesquise no Google, Google Maps, redes sociais
2. Encontre CNPJ, razão social, endereço completo, telefone, email
3. Identifique responsáveis/veterinários principais
4. Analise tipo de clínica, porte, especialidades
5. Verifique equipamentos mencionados em posts/site
6. Avalie volume estimado de atendimento
7. Sugira melhor equipamento baseado no perfil

MODO SELECIONADO: ${mode === 'new' ? 'NOVO CLIENTE (cadastrar)' : mode === 'existing' ? 'CLIENTE EXISTENTE (atualizar)' : 'ANÁLISE DE MERCADO (preparação visita)'}

Retorne JSON estruturado:
{
  "clinic_found": true,
  "clinic_data": {
    "clinic_name": "Nome oficial da clínica",
    "cnpj": "00.000.000/0001-00",
    "razao_social": "Razão Social LTDA",
    "address": "Endereço completo",
    "cep": "00000-000",
    "city": "Cidade",
    "state": "SP",
    "phone": "5511999999999",
    "email": "contato@clinica.com",
    "responsible_name": "Dr. Nome do Responsável",
    "responsible_role": "Proprietário/Veterinário",
    "specialties": ["Especialidade 1", "Especialidade 2"],
    "clinic_type": "clinica_pequena/clinica_media/hospital_veterinario",
    "estimated_monthly_volume": "40-120 exames",
    "current_equipment_detected": "Equipamento mencionado ou null",
    "online_presence": "forte/media/fraca",
    "google_rating": 4.5,
    "total_reviews": 120
  },
  "market_analysis": {
    "market_position": "Posição no mercado local",
    "growth_potential": "alto/medio/baixo",
    "competition_level": "alta/media/baixa",
    "technology_gap": "Gap tecnológico identificado",
    "main_pains_detected": ["Dor 1", "Dor 2", "Dor 3"],
    "budget_estimate": 80000,
    "decision_urgency": "alta/media/baixa"
  },
  "equipment_recommendation": {
    "recommended_equipment": "Nome do equipamento ideal",
    "reason": "Por que este equipamento é ideal",
    "alternative": "Equipamento alternativo",
    "estimated_roi_months": 24,
    "key_benefits": ["Benefício 1", "Benefício 2", "Benefício 3"]
  },
  "visit_preparation": {
    "best_approach": "Consultiva/Técnica/ROI/Emocional",
    "key_talking_points": ["Ponto 1", "Ponto 2", "Ponto 3"],
    "questions_to_ask": ["Pergunta 1", "Pergunta 2"],
    "expected_objections": ["Objeção 1", "Objeção 2"],
    "closing_strategy": "Estratégia de fechamento"
  },
  "contact_strategy": {
    "best_channel": "whatsapp/email/telefone/presencial",
    "best_timing": "Melhor horário e dia da semana",
    "first_message_template": "Template de primeira mensagem"
  }
}

IMPORTANTE:
- Se não encontrar dados, indique claramente com clinic_found: false
- Use dados REAIS da pesquisa
- Seja específico e acionável`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            clinic_found: { type: "boolean" },
            clinic_data: {
              type: "object",
              properties: {
                clinic_name: { type: "string" },
                cnpj: { type: "string" },
                razao_social: { type: "string" },
                address: { type: "string" },
                cep: { type: "string" },
                city: { type: "string" },
                state: { type: "string" },
                phone: { type: "string" },
                email: { type: "string" },
                responsible_name: { type: "string" },
                responsible_role: { type: "string" },
                specialties: { type: "array", items: { type: "string" } },
                clinic_type: { type: "string" },
                estimated_monthly_volume: { type: "string" },
                current_equipment_detected: { type: "string" },
                online_presence: { type: "string" },
                google_rating: { type: "number" },
                total_reviews: { type: "number" }
              }
            },
            market_analysis: {
              type: "object",
              properties: {
                market_position: { type: "string" },
                growth_potential: { type: "string" },
                competition_level: { type: "string" },
                technology_gap: { type: "string" },
                main_pains_detected: { type: "array", items: { type: "string" } },
                budget_estimate: { type: "number" },
                decision_urgency: { type: "string" }
              }
            },
            equipment_recommendation: {
              type: "object",
              properties: {
                recommended_equipment: { type: "string" },
                reason: { type: "string" },
                alternative: { type: "string" },
                estimated_roi_months: { type: "number" },
                key_benefits: { type: "array", items: { type: "string" } }
              }
            },
            visit_preparation: {
              type: "object",
              properties: {
                best_approach: { type: "string" },
                key_talking_points: { type: "array", items: { type: "string" } },
                questions_to_ask: { type: "array", items: { type: "string" } },
                expected_objections: { type: "array", items: { type: "string" } },
                closing_strategy: { type: "string" }
              }
            },
            contact_strategy: {
              type: "object",
              properties: {
                best_channel: { type: "string" },
                best_timing: { type: "string" },
                first_message_template: { type: "string" }
              }
            }
          }
        }
      });

      setAnalysis(result);

      // Se modo for "new", criar cliente automaticamente
      if (mode === 'new' && result.clinic_found) {
        const responsibleFirstName = result.clinic_data.responsible_name?.split(' ')[0] || result.clinic_data.clinic_name?.split(' ')[0];
        
        const clientData = {
          first_name: responsibleFirstName,
          full_name: result.clinic_data.responsible_name,
          cnpj: result.clinic_data.cnpj,
          razao_social: result.clinic_data.razao_social,
          email: result.clinic_data.email,
          phone: result.clinic_data.phone,
          address: result.clinic_data.address,
          cep: result.clinic_data.cep,
          city: result.clinic_data.city,
          clinic_name: result.clinic_data.clinic_name,
          current_equipment: result.clinic_data.current_equipment_detected,
          client_type: result.clinic_data.clinic_type,
          decision_role: result.clinic_data.responsible_role === 'Proprietário' ? 'proprietario' : 'veterinario_responsavel',
          available_budget: result.market_analysis.budget_estimate,
          main_pains: result.market_analysis.main_pains_detected,
          equipment_suggestion: result.equipment_recommendation.recommended_equipment,
          equipment_suggestion_reason: result.equipment_recommendation.reason,
          equipment_suggestion_alternative: result.equipment_recommendation.alternative,
          status: result.market_analysis.decision_urgency === 'alta' ? 'quente' : 'morno',
          purchase_score: result.market_analysis.decision_urgency === 'alta' ? 75 : 55,
          notes: `[PESQUISA IA - ${new Date().toLocaleDateString('pt-BR')}]\n${result.market_analysis.market_position}\n\nGap: ${result.market_analysis.technology_gap}`
        };

        const newClient = await base44.entities.Client.create(clientData);
        toast.success('Cliente criado com sucesso!');
        
        // Navegar para perfil do cliente
        setTimeout(() => {
          navigate(createPageUrl(`ClientProfile?id=${newClient.id}`));
        }, 1500);
      }

    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao processar. Tente novamente.');
    } finally {
      setProcessing(false);
    }
  };

  const modeOptions = [
    {
      id: 'new',
      icon: UserPlus,
      label: 'Novo Cliente',
      description: 'Pesquisar e cadastrar automaticamente',
      color: 'from-green-500 to-emerald-600',
      borderColor: 'border-green-300'
    },
    {
      id: 'existing',
      icon: UserCheck,
      label: 'Cliente Existente',
      description: 'Atualizar dados do cliente',
      color: 'from-blue-500 to-indigo-600',
      borderColor: 'border-blue-300'
    },
    {
      id: 'analysis',
      icon: Search,
      label: 'Análise de Mercado',
      description: 'Preparação para primeira visita',
      color: 'from-purple-500 to-pink-600',
      borderColor: 'border-purple-300'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-4 pt-4 pb-16 rounded-b-[2rem] tech-grid">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full glass hover:bg-white/10">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-white">Scanner IA por Voz</h1>
            <p className="text-sm text-slate-300">Fale o nome da clínica</p>
          </div>
        </div>
      </div>

      <div className="px-6 -mt-8 space-y-4">
        {/* Mode Selection */}
        {!mode && (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-slate-700 mb-3">Selecione o modo:</p>
            {modeOptions.map((option) => (
              <Card
                key={option.id}
                onClick={() => setMode(option.id)}
                className="p-4 cursor-pointer hover:shadow-lg transition-all border-2"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${option.color} flex items-center justify-center shadow-lg`}>
                    <option.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800">{option.label}</p>
                    <p className="text-xs text-slate-600">{option.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Recording Interface */}
        {mode && !analysis && (
          <>
            <Card className="p-5 bg-white shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <Badge className={modeOptions.find(m => m.id === mode)?.borderColor}>
                  {modeOptions.find(m => m.id === mode)?.label}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setMode(null);
                    setTranscript('');
                  }}
                >
                  Trocar
                </Button>
              </div>

              {/* Voice Button */}
              <div className="flex flex-col items-center py-8">
                <button
                  onClick={toggleRecording}
                  disabled={processing}
                  className={`w-32 h-32 rounded-full flex items-center justify-center transition-all ${
                    recording 
                      ? 'bg-gradient-to-br from-red-500 to-pink-600 shadow-2xl shadow-red-500/50 animate-pulse' 
                      : 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg hover:shadow-xl'
                  }`}
                >
                  {processing ? (
                    <Loader2 className="w-12 h-12 text-white animate-spin" />
                  ) : recording ? (
                    <MicOff className="w-12 h-12 text-white" />
                  ) : (
                    <Mic className="w-12 h-12 text-white" />
                  )}
                </button>
                <p className="text-sm font-medium text-slate-700 mt-4">
                  {processing ? 'Pesquisando...' : recording ? 'Gravando...' : 'Toque para falar'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {recording ? 'Diga o nome da clínica' : 'Ex: "Clínica Petz Paulista"'}
                </p>
              </div>

              {transcript && (
                <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-200">
                  <p className="text-xs text-indigo-600 font-medium mb-1">Você disse:</p>
                  <p className="text-sm text-slate-800">{transcript}</p>
                </div>
              )}
            </Card>

            <Card className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-amber-700 mb-1">Como funciona</p>
                  <ul className="text-xs text-slate-600 space-y-1">
                    <li>1. Fale o nome da clínica</li>
                    <li>2. IA pesquisa CNPJ e dados na internet</li>
                    <li>3. {mode === 'new' ? 'Cliente cadastrado automaticamente' : mode === 'existing' ? 'Dados atualizados' : 'Perfil de visita gerado'}</li>
                  </ul>
                </div>
              </div>
            </Card>
          </>
        )}

        {/* Analysis Results */}
        {analysis && (
          <div className="space-y-4">
            {analysis.clinic_found ? (
              <>
                {/* Clinic Data */}
                <Card className="p-5 bg-white shadow-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                      <UserCheck className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-green-600 font-medium">CLÍNICA ENCONTRADA</p>
                      <p className="font-bold text-slate-800">{analysis.clinic_data.clinic_name}</p>
                    </div>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-slate-500">CNPJ</p>
                        <p className="font-semibold text-slate-800">{analysis.clinic_data.cnpj}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Cidade</p>
                        <p className="font-semibold text-slate-800">{analysis.clinic_data.city}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">Responsável</p>
                      <p className="font-semibold text-slate-800">{analysis.clinic_data.responsible_name}</p>
                      <p className="text-xs text-slate-600">{analysis.clinic_data.responsible_role}</p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">Contato</p>
                      <p className="text-xs text-slate-700">{analysis.clinic_data.phone}</p>
                      <p className="text-xs text-slate-700">{analysis.clinic_data.email}</p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">Endereço</p>
                      <p className="text-xs text-slate-700">{analysis.clinic_data.address}</p>
                    </div>

                    {analysis.clinic_data.specialties?.length > 0 && (
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Especialidades</p>
                        <div className="flex flex-wrap gap-1">
                          {analysis.clinic_data.specialties.map((spec, i) => (
                            <Badge key={i} variant="outline" className="text-xs">{spec}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-blue-50 rounded p-2">
                        <p className="text-xs text-blue-600">Volume Estimado</p>
                        <p className="text-xs font-semibold text-slate-800">{analysis.clinic_data.estimated_monthly_volume}</p>
                      </div>
                      {analysis.clinic_data.google_rating && (
                        <div className="bg-yellow-50 rounded p-2">
                          <p className="text-xs text-yellow-600">Avaliação</p>
                          <p className="text-xs font-semibold text-slate-800">
                            ⭐ {analysis.clinic_data.google_rating} ({analysis.clinic_data.total_reviews})
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>

                {/* Equipment Recommendation */}
                <Card className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-300">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-purple-700 mb-1">EQUIPAMENTO RECOMENDADO</p>
                      <p className="font-bold text-slate-800">{analysis.equipment_recommendation.recommended_equipment}</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-700 mb-3">{analysis.equipment_recommendation.reason}</p>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                    <div className="bg-white rounded p-2">
                      <p className="text-slate-500">ROI</p>
                      <p className="font-semibold text-slate-800">{analysis.equipment_recommendation.estimated_roi_months} meses</p>
                    </div>
                    <div className="bg-white rounded p-2">
                      <p className="text-slate-500">Alternativa</p>
                      <p className="font-semibold text-slate-800">{analysis.equipment_recommendation.alternative}</p>
                    </div>
                  </div>

                  <div className="bg-purple-100 rounded p-2">
                    <p className="text-xs text-purple-700 font-medium mb-1">Benefícios-chave:</p>
                    <ul className="text-xs text-purple-600 space-y-0.5">
                      {analysis.equipment_recommendation.key_benefits.map((b, i) => (
                        <li key={i}>• {b}</li>
                      ))}
                    </ul>
                  </div>
                </Card>

                {/* Market Analysis */}
                <Card className="p-4 bg-white shadow-lg">
                  <p className="text-sm font-semibold text-slate-800 mb-3">📊 Análise de Mercado</p>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Posição no Mercado</span>
                      <span className="font-semibold text-slate-800">{analysis.market_analysis.market_position}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Potencial Crescimento</span>
                      <Badge className={
                        analysis.market_analysis.growth_potential === 'alto' ? 'bg-green-100 text-green-700' :
                        analysis.market_analysis.growth_potential === 'medio' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }>
                        {analysis.market_analysis.growth_potential}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Orçamento Estimado</span>
                      <span className="font-semibold text-slate-800">
                        R$ {analysis.market_analysis.budget_estimate?.toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </div>

                  <div className="bg-amber-50 rounded p-3 mt-3 border border-amber-200">
                    <p className="text-xs text-amber-700 font-medium mb-1">🎯 Gap Tecnológico</p>
                    <p className="text-xs text-slate-700">{analysis.market_analysis.technology_gap}</p>
                  </div>

                  {analysis.market_analysis.main_pains_detected?.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-slate-500 mb-2">Dores Detectadas:</p>
                      <div className="flex flex-wrap gap-1">
                        {analysis.market_analysis.main_pains_detected.map((pain, i) => (
                          <Badge key={i} className="bg-red-100 text-red-700 text-xs">{pain}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>

                {/* Visit Preparation */}
                <Card className="p-4 bg-gradient-to-br from-indigo-50 to-blue-50 border-2 border-indigo-300">
                  <p className="text-sm font-semibold text-indigo-800 mb-3">🎯 Preparação para Visita</p>
                  
                  <div className="space-y-3">
                    <div className="bg-white rounded p-3">
                      <p className="text-xs text-indigo-600 font-medium mb-1">Melhor Abordagem</p>
                      <p className="text-sm text-slate-800">{analysis.visit_preparation.best_approach}</p>
                    </div>

                    <div className="bg-white rounded p-3">
                      <p className="text-xs text-indigo-600 font-medium mb-2">Pontos de Conversa</p>
                      <ul className="text-xs text-slate-700 space-y-1">
                        {analysis.visit_preparation.key_talking_points.map((point, i) => (
                          <li key={i}>• {point}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-white rounded p-3">
                      <p className="text-xs text-indigo-600 font-medium mb-2">Perguntas para Fazer</p>
                      <ul className="text-xs text-slate-700 space-y-1">
                        {analysis.visit_preparation.questions_to_ask.map((q, i) => (
                          <li key={i}>❓ {q}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-red-50 rounded p-3 border border-red-200">
                      <p className="text-xs text-red-700 font-medium mb-2">⚠️ Objeções Esperadas</p>
                      <ul className="text-xs text-red-600 space-y-1">
                        {analysis.visit_preparation.expected_objections.map((obj, i) => (
                          <li key={i}>• {obj}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-green-50 rounded p-3 border border-green-200">
                      <p className="text-xs text-green-700 font-medium mb-1">✅ Estratégia de Fechamento</p>
                      <p className="text-xs text-slate-700">{analysis.visit_preparation.closing_strategy}</p>
                    </div>
                  </div>
                </Card>

                {/* Contact Strategy */}
                <Card className="p-4 bg-white shadow-lg">
                  <p className="text-sm font-semibold text-slate-800 mb-3">📱 Estratégia de Contato</p>
                  
                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="text-xs text-slate-500">Melhor Canal</p>
                      <p className="font-semibold text-slate-800 capitalize">{analysis.contact_strategy.best_channel}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Melhor Timing</p>
                      <p className="font-semibold text-slate-800">{analysis.contact_strategy.best_timing}</p>
                    </div>
                    <div className="bg-blue-50 rounded p-3 border border-blue-200">
                      <p className="text-xs text-blue-700 font-medium mb-1">📝 Primeira Mensagem</p>
                      <p className="text-xs text-slate-700 leading-relaxed">{analysis.contact_strategy.first_message_template}</p>
                    </div>
                  </div>
                </Card>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => {
                      setMode(null);
                      setAnalysis(null);
                      setTranscript('');
                    }}
                    variant="outline"
                    className="h-12"
                  >
                    Nova Pesquisa
                  </Button>
                  {mode === 'new' && (
                    <Button
                      onClick={() => navigate(createPageUrl('Home'))}
                      className="h-12 bg-green-600 hover:bg-green-700"
                    >
                      Ir para Cliente
                    </Button>
                  )}
                  {mode === 'analysis' && analysis.clinic_data.phone && (
                    <Button
                      onClick={() => window.open(`https://wa.me/${analysis.clinic_data.phone}?text=${encodeURIComponent(analysis.contact_strategy.first_message_template)}`, '_blank')}
                      className="h-12 bg-green-600 hover:bg-green-700"
                    >
                      Enviar WhatsApp
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <Card className="p-6 text-center">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                <p className="font-semibold text-slate-800 mb-2">Clínica não encontrada</p>
                <p className="text-sm text-slate-600 mb-4">Tente novamente com outro nome ou adicione manualmente</p>
                <Button
                  onClick={() => {
                    setAnalysis(null);
                    setTranscript('');
                  }}
                  variant="outline"
                >
                  Tentar Novamente
                </Button>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
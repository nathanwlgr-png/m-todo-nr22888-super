import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ArrowLeft, 
  MessageSquare, 
  Target,
  User,
  Brain,
  HelpCircle,
  Shield,
  Lightbulb,
  Flag,
  RotateCcw,
  Loader2,
  Check,
  Sparkles,
  Edit2,
  Building2
} from 'lucide-react';
import ChecklistItem from '@/components/ChecklistItem';
import PersuasionPhrases from '@/components/PersuasionPhrases';
import NumerologyCard from '@/components/NumerologyCard';
import InvestigationQuestions from '@/components/InvestigationQuestions';
import CommitmentStrategy from '@/components/CommitmentStrategy';
import StrategicFrameworks from '@/components/StrategicFrameworks';
import ClientSelector from '@/components/ClientSelector';
import PreVisitSalesMasterLibrary from '@/components/PreVisitSalesMasterLibrary';
import { Input } from "@/components/ui/input";
import { toast } from 'sonner';

const visitObjectives = [
  { value: 'diagnosticar', label: 'Diagnosticar necessidades' },
  { value: 'apresentar_solucao', label: 'Apresentar solução' },
  { value: 'comparar_equipamentos', label: 'Comparar equipamentos' },
  { value: 'avancar_fechamento', label: 'Avançar para fechamento' },
];

export default function PreVisitChecklist() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const clientIdFromUrl = urlParams.get('id');
  
  const [selectedClientId, setSelectedClientId] = React.useState(clientIdFromUrl || null);
  
  const [checklist, setChecklist] = useState({
    clarity: false,
    profile: false,
    objective: false,
    questions: false,
    pains: false,
    triggers: false,
    closing: false,
    planB: false
  });
  
  const [generatedContent, setGeneratedContent] = useState({
    questions: null,
    pains: null,
    objections: null,
    triggers: null,
    closing: null,
    planB: null
  });
  
  const [loadingContent, setLoadingContent] = useState({});
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState('');
  const [editingClinic, setEditingClinic] = useState(false);
  const [tempClinic, setTempClinic] = useState('');
  const [analyzingName, setAnalyzingName] = useState(false);

  const { data: allClients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-updated_date', 500)
  });

  const { data: plannedVisits = [] } = useQuery({
    queryKey: ['pre-visit-planned-stops'],
    queryFn: () => base44.entities.Visit.list('-scheduled_date', 500),
  });

  const { data: client, isLoading } = useQuery({
    queryKey: ['client', selectedClientId],
    queryFn: async () => {
      if (!selectedClientId) return null;
      return base44.entities.Client.get(selectedClientId);
    },
    enabled: !!selectedClientId
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Client.update(selectedClientId, data),
    onSuccess: () => queryClient.invalidateQueries(['client', selectedClientId])
  });

  const analyzeNumerology = async (firstName) => {
    setAnalyzingName(true);
    try {
      const aiMode = localStorage.getItem('nr22_ai_mode') || 'economy';
      
      if (aiMode === 'off') {
        toast.info('Modo AI desligado - numerologia não disponível');
        setAnalyzingName(false);
        return;
      }

      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `Analise numerologia Pitagórica COMPLETA do nome: ${firstName}

Calcule:
1. Número do Nome (soma de todas as letras convertidas)
2. Perfil Comportamental completo
3. Estilo de Decisão detalhado
4. Dicas de Abordagem personalizadas
5. Tom de Comunicação ideal

Forneça análise profunda e estratégica para vendas.`,
        response_json_schema: {
          type: "object",
          properties: {
            numerology_number: { type: "number" },
            behavioral_profile: { type: "string" },
            decision_style: { type: "string" },
            approach_tips: { type: "string" },
            recommended_communication: { type: "string" }
          }
        }
      });

      await updateMutation.mutateAsync(analysis);
      toast.success('Análise numerológica completa!');
    } catch (error) {
      if (error.message?.includes('limit')) {
        toast.error('Limite de IA atingido');
      } else {
        toast.error('Erro ao analisar');
      }
    } finally {
      setAnalyzingName(false);
    }
  };

  const handleSaveName = async () => {
    if (!tempName.trim()) return;
    await updateMutation.mutateAsync({ first_name: tempName });
    await analyzeNumerology(tempName);
    setEditingName(false);
  };

  const handleSaveClinic = async () => {
    if (!tempClinic.trim()) return;
    await updateMutation.mutateAsync({ clinic_name: tempClinic });
    setEditingClinic(false);
  };

  const generateAIContent = async (type, prompt) => {
    setLoadingContent(prev => ({ ...prev, [type]: true }));
    
    try {
      // Verificar modo AI
      const aiMode = localStorage.getItem('nr22_ai_mode') || 'economy';
      
      if (aiMode === 'off') {
        toast.info('Modo AI desligado - usando templates padrão');
        setLoadingContent(prev => ({ ...prev, [type]: false }));
        return;
      }

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            items: { type: "array", items: { type: "string" } }
          }
        }
      });
      
      setGeneratedContent(prev => ({ ...prev, [type]: response.items }));
      setChecklist(prev => ({ ...prev, [type]: true }));
    } catch (error) {
      if (error.message?.includes('limit')) {
        toast.error('Limite de IA atingido. Ative o modo econômico na Home.');
      } else {
        toast.error('Erro ao gerar conteúdo');
      }
      console.error('Erro:', error);
    } finally {
      setLoadingContent(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleGenerateQuestions = () => {
    generateAIContent('questions', `
      Gere 2 perguntas SPIN Selling (Situation, Problem, Implication, Need-Payoff) para uma visita de vendas.
      
      Cliente: ${client?.first_name || 'Cliente'}
      Tipo: ${client?.client_type || 'não especificado'}
      Decisor: ${client?.decision_role || 'não especificado'}
      Perfil Numerológico: ${client?.numerology_number} - ${client?.behavioral_profile || 'não especificado'}
      Objetivo: ${client?.visit_objective || 'diagnosticar'}
      
      Use SPIN Selling de Neil Rackham + Numerologia Pitagórica + princípios de A Arte da Guerra (conhecer o cliente).
      Retorne perguntas consultivas e estratégicas, em português brasileiro.
    `);
  };

  const handleGeneratePains = () => {
    generateAIContent('pains', `
      Liste 4 dores prováveis de um cliente veterinário que precisa de equipamentos laboratoriais.
      Tipo: ${client?.client_type || 'não especificado'}
      Decisor: ${client?.decision_role || 'não especificado'}
      
      Considere dores operacionais, financeiras e de gestão. Português brasileiro, frases curtas.
    `);
  };

  const handleGenerateObjections = () => {
    generateAIContent('objections', `
      Liste 3 objeções comuns e suas respostas baseadas em:
      - Persuasão (Cialdini): autoridade, prova social, compromisso
      - Inteligência Emocional: empatia e autorregulação
      - SPIN Selling: transformar objeção em necessidade
      
      Tipo cliente: ${client?.client_type || 'não especificado'}
      Perfil: ${client?.behavioral_profile || 'não especificado'}
      
      Formato: "Objeção: [objeção] → Técnica: [técnica] → Resposta: [resposta empática]"
      Português brasileiro, prático e emocionalmente inteligente.
    `);
  };

  const handleGenerateTriggers = () => {
    generateAIContent('triggers', `
      Liste 3 gatilhos de persuasão éticos para usar na venda de equipamentos veterinários.
      Perfil do cliente: ${client?.behavioral_profile || 'não especificado'}
      
      Use apenas: prova social, reciprocidade, segurança. Evite urgência artificial.
      Português brasileiro, frases práticas.
    `);
  };

  const handleGenerateClosing = () => {
    generateAIContent('closing', `
      Sugira 2 estratégias de fechamento para venda de equipamentos veterinários.
      Perfil: ${client?.behavioral_profile || 'não especificado'}
      Objetivo: ${client?.visit_objective || 'apresentar_solucao'}
      
      Inclua tipo de fechamento e próximo passo lógico. Português brasileiro.
    `);
  };

  const handleGeneratePlanB = () => {
    generateAIContent('planB', `
      Crie um plano B caso a venda não feche nesta visita.
      Tipo cliente: ${client?.client_type || 'não especificado'}
      
      Inclua: tipo de follow-up, material a enviar, prazo sugerido.
      Português brasileiro, 3 itens práticos.
    `);
  };

  const handleObjectiveChange = (value) => {
    updateMutation.mutate({ visit_objective: value });
    setChecklist(prev => ({ ...prev, objective: true }));
  };

  const completedCount = Object.values(checklist).filter(Boolean).length;
  const totalItems = Object.keys(checklist).length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* Header */}
      <div className="bg-white border-b px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-4 mb-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-slate-100">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-slate-800">Checklist Pré-Visita</h1>
          </div>
          {client && (
            <div className="bg-indigo-100 px-3 py-1 rounded-full">
              <span className="text-sm font-medium text-indigo-700">{completedCount}/{totalItems}</span>
            </div>
          )}
        </div>
        
        <ClientSelector
          clients={allClients}
          visits={plannedVisits.filter(visit => visit.status !== 'cancelada')}
          selectedClientId={selectedClientId}
          onClientChange={setSelectedClientId}
          onVisitChange={(visit) => {
            const linkedClient = allClients.find(item => item.id === visit.client_id);
            if (linkedClient) setSelectedClientId(linkedClient.id);
            else navigate(`/DayFieldView?visit_id=${visit.id}`);
          }}
        />
      </div>

      <div className="p-4 space-y-4">
        {/* Progress */}
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
            style={{ width: `${(completedCount / totalItems) * 100}%` }}
          />
        </div>

        {/* 1. Clarity */}
        <Card className="p-4 border-emerald-500 border-2 bg-emerald-50">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-slate-800">Clareza do Cliente</h3>
                <Check className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-sm">Nome Decisor:</span>
                  {editingName ? (
                    <div className="flex gap-1 flex-1">
                      <input
                        type="text"
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        className="flex-1 px-2 py-1 text-sm border rounded"
                        placeholder="Primeiro nome"
                        autoFocus
                      />
                      <Button size="sm" onClick={handleSaveName} disabled={analyzingName}>
                        {analyzingName ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                      </Button>
                    </div>
                  ) : (
                    <>
                      <span className="font-bold text-slate-800">{client?.first_name || '-'}</span>
                      <button
                        onClick={() => {
                          setTempName(client?.first_name || '');
                          setEditingName(true);
                        }}
                        className="ml-auto p-1 hover:bg-white rounded"
                      >
                        <Edit2 className="w-3 h-3 text-emerald-600" />
                      </button>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-sm">Clínica:</span>
                  {editingClinic ? (
                    <div className="flex gap-1 flex-1">
                      <input
                        type="text"
                        value={tempClinic}
                        onChange={(e) => setTempClinic(e.target.value)}
                        className="flex-1 px-2 py-1 text-sm border rounded"
                        placeholder="Nome da clínica"
                        autoFocus
                      />
                      <Button size="sm" onClick={handleSaveClinic}>
                        <Check className="w-3 h-3" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <span className="font-medium text-slate-800">{client?.clinic_name || '-'}</span>
                      <button
                        onClick={() => {
                          setTempClinic(client?.clinic_name || '');
                          setEditingClinic(true);
                        }}
                        className="ml-auto p-1 hover:bg-white rounded"
                      >
                        <Edit2 className="w-3 h-3 text-emerald-600" />
                      </button>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-500">Tipo:</span>
                  <span className="font-medium text-slate-800 capitalize">
                    {client?.client_type?.replace(/_/g, ' ') || '-'}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-500 text-sm">Decisor:</span>
                  <Select
                    value={client?.decision_role || ''}
                    onValueChange={(value) => updateMutation.mutate({ decision_role: value })}
                  >
                    <SelectTrigger className="h-9 text-sm bg-white">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="proprietario">Proprietário</SelectItem>
                      <SelectItem value="veterinario_responsavel">Veterinário Responsável</SelectItem>
                      <SelectItem value="gestor_laboratorio">Gestor de Laboratório</SelectItem>
                      <SelectItem value="coordenador_tecnico">Coordenador Técnico</SelectItem>
                      <SelectItem value="socio">Sócio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {client?.city && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-500">Cidade:</span>
                    <span className="font-medium text-slate-800">{client.city}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* 2. Profile */}
        <Card className={`p-4 ${checklist.profile ? 'border-emerald-500 border-2' : ''}`}>
          <ChecklistItem
            title="Perfil Psicológico"
            description="Numerologia e estilo de decisão"
            completed={checklist.profile}
            icon={Brain}
            onClick={() => setChecklist(prev => ({ ...prev, profile: !prev.profile }))}
          />
          <div className="mt-4">
            <NumerologyCard number={client?.numerology_number || 1} showFull={checklist.profile} />
          </div>
        </Card>

        {/* 3. Objective */}
        <Card className={`p-4 ${checklist.objective ? 'border-emerald-500 border-2' : ''}`}>
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-5 h-5 text-slate-600" />
            <h3 className="font-semibold text-slate-700">Objetivo da Visita</h3>
            {checklist.objective && <Check className="w-4 h-4 text-emerald-500 ml-auto" />}
          </div>
          <Select
            value={client?.visit_objective || ''}
            onValueChange={handleObjectiveChange}
          >
            <SelectTrigger className="h-12 rounded-xl">
              <SelectValue placeholder="Selecione o objetivo" />
            </SelectTrigger>
            <SelectContent>
              {visitObjectives.map((obj) => (
                <SelectItem key={obj.value} value={obj.value}>
                  {obj.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Card>

        {/* 4. Questions */}
        <Card className={`p-4 ${checklist.questions ? 'border-emerald-500 border-2' : ''}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-slate-600" />
              <h3 className="font-semibold text-slate-700">Perguntas de Abertura</h3>
            </div>
            {checklist.questions && <Check className="w-4 h-4 text-emerald-500" />}
          </div>
          {generatedContent.questions ? (
            <div className="space-y-2">
              {generatedContent.questions.map((q, i) => (
                <div key={i} className="p-3 bg-indigo-50 rounded-xl text-sm text-slate-700">
                  {q}
                </div>
              ))}
            </div>
          ) : (
            <Button
              onClick={handleGenerateQuestions}
              disabled={loadingContent.questions}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              {loadingContent.questions ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Gerar Perguntas
                </>
              )}
            </Button>
          )}
        </Card>

        {/* 5. Pains */}
        <Card className={`p-4 ${checklist.pains ? 'border-emerald-500 border-2' : ''}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-slate-600" />
              <h3 className="font-semibold text-slate-700">Dores Prováveis</h3>
            </div>
            {checklist.pains && <Check className="w-4 h-4 text-emerald-500" />}
          </div>
          {generatedContent.pains ? (
            <ul className="space-y-2">
              {generatedContent.pains.map((p, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                  <span className="text-amber-500 mt-0.5">•</span>
                  {p}
                </li>
              ))}
            </ul>
          ) : (
            <Button
              onClick={handleGeneratePains}
              disabled={loadingContent.pains}
              variant="outline"
              className="w-full"
            >
              {loadingContent.pains ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Identificar Dores'}
            </Button>
          )}
        </Card>

        {/* Investigation Questions */}
        <Card className="p-4 border-purple-200 border-2">
          <div className="flex items-center gap-2 mb-3">
            <HelpCircle className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-slate-700">Perguntas de Investigação</h3>
          </div>
          <InvestigationQuestions 
            clientType={client?.client_type}
            numerologyNumber={client?.numerology_number}
          />
        </Card>

        {/* Commitment Strategy */}
        <Card className="p-4 border-indigo-200 border-2">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-5 h-5 text-indigo-600" />
            <h3 className="font-semibold text-slate-700">Como Obter Compromisso</h3>
          </div>
          <CommitmentStrategy 
            clientType={client?.client_type}
            numerologyNumber={client?.numerology_number}
          />
        </Card>

        {/* BÍBLIA DA VENDA INTEGRADA - PRÉ-VISITA */}
        {client && <PreVisitSalesMasterLibrary client={client} />}

        {/* Strategic Frameworks */}
        <Card className="p-4 bg-gradient-to-br from-slate-900 to-indigo-900 border-none">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-5 h-5 text-orange-400" />
            <h3 className="font-semibold text-white">Frameworks Estratégicos</h3>
          </div>
          <p className="text-xs text-slate-300 mb-3">Baseado em numerologia + livros clássicos de vendas e estratégia</p>
          <StrategicFrameworks numerologyNumber={client?.numerology_number || 1} />
        </Card>



        {/* 7. Triggers */}
        <Card className={`p-4 ${checklist.triggers ? 'border-emerald-500 border-2' : ''}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-slate-600" />
              <h3 className="font-semibold text-slate-700">Gatilhos Éticos</h3>
            </div>
            {checklist.triggers && <Check className="w-4 h-4 text-emerald-500" />}
          </div>
          {generatedContent.triggers ? (
            <ul className="space-y-2">
              {generatedContent.triggers.map((t, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                  <span className="text-emerald-500 mt-0.5">✓</span>
                  {t}
                </li>
              ))}
            </ul>
          ) : (
            <Button
              onClick={handleGenerateTriggers}
              disabled={loadingContent.triggers}
              variant="outline"
              className="w-full"
            >
              {loadingContent.triggers ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sugerir Gatilhos'}
            </Button>
          )}
        </Card>

        {/* 8. Closing */}
        <Card className={`p-4 ${checklist.closing ? 'border-emerald-500 border-2' : ''}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Flag className="w-5 h-5 text-slate-600" />
              <h3 className="font-semibold text-slate-700">Estratégia de Fechamento</h3>
            </div>
            {checklist.closing && <Check className="w-4 h-4 text-emerald-500" />}
          </div>
          {generatedContent.closing ? (
            <div className="space-y-2">
              {generatedContent.closing.map((c, i) => (
                <div key={i} className="p-3 bg-emerald-50 rounded-xl text-sm text-slate-700">
                  {c}
                </div>
              ))}
            </div>
          ) : (
            <Button
              onClick={handleGenerateClosing}
              disabled={loadingContent.closing}
              variant="outline"
              className="w-full"
            >
              {loadingContent.closing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Planejar Fechamento'}
            </Button>
          )}
        </Card>

        {/* 9. Plan B */}
        <Card className={`p-4 ${checklist.planB ? 'border-emerald-500 border-2' : ''}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-slate-600" />
              <h3 className="font-semibold text-slate-700">Plano B</h3>
            </div>
            {checklist.planB && <Check className="w-4 h-4 text-emerald-500" />}
          </div>
          {generatedContent.planB ? (
            <ul className="space-y-2">
              {generatedContent.planB.map((p, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                  <span className="text-blue-500 mt-0.5">{i + 1}.</span>
                  {p}
                </li>
              ))}
            </ul>
          ) : (
            <Button
              onClick={handleGeneratePlanB}
              disabled={loadingContent.planB}
              variant="outline"
              className="w-full"
            >
              {loadingContent.planB ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Criar Plano B'}
            </Button>
          )}
        </Card>
      </div>

      {/* Fixed Bottom */}
      {client && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t">
          <Button
            onClick={() => navigate(createPageUrl(`AIAssistant?id=${client.id}`))}
            className="w-full h-14 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-xl text-base font-semibold"
          >
            <MessageSquare className="w-5 h-5 mr-2" />
            Abrir Assistente IA
          </Button>
        </div>
      )}
    </div>
  );
}
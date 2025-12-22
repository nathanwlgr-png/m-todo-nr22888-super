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
  Sparkles
} from 'lucide-react';
import ChecklistItem from '@/components/ChecklistItem';
import PersuasionPhrases from '@/components/PersuasionPhrases';
import NumerologyCard from '@/components/NumerologyCard';

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
  const clientId = urlParams.get('id');
  
  const [checklist, setChecklist] = useState({
    clarity: false,
    profile: false,
    objective: false,
    questions: false,
    pains: false,
    objections: false,
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

  const { data: client, isLoading } = useQuery({
    queryKey: ['client', clientId],
    queryFn: async () => {
      const clients = await base44.entities.Client.filter({ id: clientId });
      return clients[0];
    },
    enabled: !!clientId
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Client.update(clientId, data),
    onSuccess: () => queryClient.invalidateQueries(['client', clientId])
  });

  const generateAIContent = async (type, prompt) => {
    setLoadingContent(prev => ({ ...prev, [type]: true }));
    
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
    setLoadingContent(prev => ({ ...prev, [type]: false }));
    setChecklist(prev => ({ ...prev, [type]: true }));
  };

  const handleGenerateQuestions = () => {
    generateAIContent('questions', `
      Gere 2 perguntas de abertura para uma visita de vendas de equipamentos laboratoriais veterinários.
      Cliente: ${client.first_name}
      Tipo: ${client.client_type}
      Decisor: ${client.decision_role}
      Perfil: ${client.behavioral_profile}
      Objetivo: ${client.visit_objective || 'diagnosticar'}
      
      Retorne perguntas consultivas e profissionais, em português brasileiro.
    `);
  };

  const handleGeneratePains = () => {
    generateAIContent('pains', `
      Liste 4 dores prováveis de um cliente veterinário que precisa de equipamentos laboratoriais.
      Tipo: ${client.client_type}
      Decisor: ${client.decision_role}
      
      Considere dores operacionais, financeiras e de gestão. Português brasileiro, frases curtas.
    `);
  };

  const handleGenerateObjections = () => {
    generateAIContent('objections', `
      Liste 4 objeções comuns e suas respostas para venda de equipamentos laboratoriais veterinários.
      Tipo cliente: ${client.client_type}
      
      Formato: "Objeção: [objeção] → Resposta: [resposta curta]"
      Português brasileiro, prático e direto.
    `);
  };

  const handleGenerateTriggers = () => {
    generateAIContent('triggers', `
      Liste 3 gatilhos de persuasão éticos para usar na venda de equipamentos veterinários.
      Perfil do cliente: ${client.behavioral_profile}
      
      Use apenas: prova social, reciprocidade, segurança. Evite urgência artificial.
      Português brasileiro, frases práticas.
    `);
  };

  const handleGenerateClosing = () => {
    generateAIContent('closing', `
      Sugira 2 estratégias de fechamento para venda de equipamentos veterinários.
      Perfil: ${client.behavioral_profile}
      Objetivo: ${client.visit_objective || 'apresentar_solucao'}
      
      Inclua tipo de fechamento e próximo passo lógico. Português brasileiro.
    `);
  };

  const handleGeneratePlanB = () => {
    generateAIContent('planB', `
      Crie um plano B caso a venda não feche nesta visita.
      Tipo cliente: ${client.client_type}
      
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
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-slate-100">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-slate-800">Checklist Pré-Visita</h1>
            <p className="text-sm text-slate-500">{client?.first_name}</p>
          </div>
          <div className="bg-indigo-100 px-3 py-1 rounded-full">
            <span className="text-sm font-medium text-indigo-700">{completedCount}/{totalItems}</span>
          </div>
        </div>
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
        <ChecklistItem
          title="Clareza do Cliente"
          description={`${client?.client_type?.replace('_', ' ')} • ${client?.decision_role?.replace('_', ' ')}`}
          completed={true}
          icon={User}
          onClick={() => {}}
        />

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

        {/* 6. Objections */}
        <Card className={`p-4 ${checklist.objections ? 'border-emerald-500 border-2' : ''}`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-slate-600" />
              <h3 className="font-semibold text-slate-700">Objeções Prováveis</h3>
            </div>
            {checklist.objections && <Check className="w-4 h-4 text-emerald-500" />}
          </div>
          {generatedContent.objections ? (
            <div className="space-y-2">
              {generatedContent.objections.map((o, i) => (
                <div key={i} className="p-3 bg-red-50 rounded-xl text-sm text-slate-700">
                  {o}
                </div>
              ))}
            </div>
          ) : (
            <Button
              onClick={handleGenerateObjections}
              disabled={loadingContent.objections}
              variant="outline"
              className="w-full"
            >
              {loadingContent.objections ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Antecipar Objeções'}
            </Button>
          )}
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
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t">
        <Button
          onClick={() => navigate(createPageUrl(`AIAssistant?id=${client.id}`))}
          className="w-full h-14 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-xl text-base font-semibold"
        >
          <MessageSquare className="w-5 h-5 mr-2" />
          Abrir Assistente IA
        </Button>
      </div>
    </div>
  );
}
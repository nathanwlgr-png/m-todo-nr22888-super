import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  ClipboardList, Calendar, FileText, TrendingUp, 
  CheckCircle, Clock, Target, MessageSquare,
  Brain, Send, Download, Plus, Search, Filter
} from 'lucide-react';
import { toast } from 'sonner';
import { useSafeClients } from '../components/SafeDataFetcher';

export default function VisitWorkflow() {
  const [selectedClient, setSelectedClient] = useState(null);
  const [activePhase, setActivePhase] = useState('pre');
  const [searchTerm, setSearchTerm] = useState('');
  const [preVisitData, setPreVisitData] = useState({
    objective: '',
    questions: '',
    triggers: '',
    materials: ''
  });
  const [duringVisitData, setDuringVisitData] = useState({
    observations: '',
    objections: '',
    interest_level: '',
    next_steps: ''
  });
  const [postVisitData, setPostVisitData] = useState({
    result: '',
    follow_up_date: '',
    notes: ''
  });

  const queryClient = useQueryClient();

  // Buscar clientes com validação
  const { data: clients = [], isLoading } = useSafeClients();

  // Buscar visitas
  const { data: visits = [] } = useQuery({
    queryKey: ['visits'],
    queryFn: () => base44.entities.Visit.list(),
    initialData: []
  });

  // Criar/atualizar visita
  const createVisitMutation = useMutation({
    mutationFn: (data) => base44.entities.Visit.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['visits']);
      toast.success('Visita registrada');
    }
  });

  const updateClientMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Client.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['safe-clients']);
      toast.success('Cliente atualizado');
    }
  });

  // Filtrar clientes
  const filteredClients = clients.filter(c => 
    c.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.clinic_name?.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 50);

  // Gerar preparação com IA
  const generatePreVisitAI = async () => {
    if (!selectedClient) return;
    
    toast.loading('Gerando preparação...');
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Cliente: ${selectedClient.first_name}
Status: ${selectedClient.status}
Score: ${selectedClient.purchase_score}
Equipamento interesse: ${selectedClient.equipment_interest}
Dores: ${selectedClient.main_pains?.join(', ')}

Gere uma preparação de visita:
1. Objetivo claro
2. 5 perguntas SPIN
3. Gatilhos mentais a usar
4. Materiais necessários

Seja prático e direto.`
      });

      const lines = result.split('\n');
      setPreVisitData({
        objective: lines.slice(0, 2).join('\n'),
        questions: lines.slice(2, 7).join('\n'),
        triggers: lines.slice(7, 10).join('\n'),
        materials: lines.slice(10).join('\n')
      });
      toast.dismiss();
      toast.success('Preparação gerada!');
    } catch (error) {
      toast.dismiss();
      toast.error('Erro ao gerar');
    }
  };

  // Gerar análise pós-visita
  const generatePostAnalysisAI = async () => {
    if (!selectedClient) return;
    
    toast.loading('Analisando visita...');
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `ANÁLISE PÓS-VISITA

Cliente: ${selectedClient.first_name}
Observações: ${duringVisitData.observations}
Objeções: ${duringVisitData.objections}
Nível Interesse: ${duringVisitData.interest_level}

Analise e retorne:
1. Resultado da visita (sucesso/parcial/fracasso)
2. Próximos passos recomendados
3. Data ideal próximo contato
4. Ações urgentes

Formato curto e prático.`
      });

      setPostVisitData(prev => ({
        ...prev,
        notes: result
      }));
      toast.dismiss();
      toast.success('Análise completa!');
    } catch (error) {
      toast.dismiss();
      toast.error('Erro');
    }
  };

  // Salvar visita completa
  const saveCompleteVisit = async () => {
    if (!selectedClient) return;

    try {
      // Criar registro de visita
      await createVisitMutation.mutateAsync({
        client_id: selectedClient.id,
        client_name: selectedClient.first_name,
        scheduled_date: new Date().toISOString(),
        visit_type: 'followup',
        notes: `PRÉ: ${JSON.stringify(preVisitData)}\n\nDURANTE: ${JSON.stringify(duringVisitData)}\n\nPÓS: ${JSON.stringify(postVisitData)}`,
        status: 'realizada'
      });

      // Atualizar cliente
      await updateClientMutation.mutateAsync({
        id: selectedClient.id,
        data: {
          last_visit_date: new Date().toISOString().split('T')[0],
          total_visits_count: (selectedClient.total_visits_count || 0) + 1,
          notes: selectedClient.notes + `\n\n[VISITA ${new Date().toLocaleDateString()}]\n${postVisitData.notes}`
        }
      });

      toast.success('Visita salva com sucesso!');
      
      // Reset
      setPreVisitData({ objective: '', questions: '', triggers: '', materials: '' });
      setDuringVisitData({ observations: '', objections: '', interest_level: '', next_steps: '' });
      setPostVisitData({ result: '', follow_up_date: '', notes: '' });
      setActivePhase('pre');
    } catch (error) {
      toast.error('Erro ao salvar');
    }
  };

  const phases = [
    { id: 'pre', label: 'Pré-Visita', icon: ClipboardList, color: 'blue' },
    { id: 'during', label: 'Durante', icon: MessageSquare, color: 'green' },
    { id: 'post', label: 'Pós-Visita', icon: FileText, color: 'purple' }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            Fluxo de Visita Completo
          </h1>
          <p className="text-slate-600">
            Organize sua visita do início ao fim com IA
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Seleção de Cliente */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Selecionar Cliente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="Buscar cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mb-4"
              />

              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {filteredClients.map(client => (
                  <div
                    key={client.id}
                    onClick={() => setSelectedClient(client)}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      selectedClient?.id === client.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-slate-800">
                          {client.first_name}
                        </p>
                        <p className="text-xs text-slate-600">
                          {client.clinic_name || client.city}
                        </p>
                      </div>
                      <Badge className={
                        client.status === 'quente' ? 'bg-red-500' :
                        client.status === 'morno' ? 'bg-yellow-500' :
                        'bg-blue-500'
                      }>
                        {client.purchase_score}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Workflow Principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Navegação de Fases */}
            <div className="flex gap-2">
              {phases.map(phase => {
                const Icon = phase.icon;
                return (
                  <Button
                    key={phase.id}
                    onClick={() => setActivePhase(phase.id)}
                    variant={activePhase === phase.id ? 'default' : 'outline'}
                    className={`flex-1 ${
                      activePhase === phase.id
                        ? `bg-${phase.color}-600 hover:bg-${phase.color}-700`
                        : ''
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {phase.label}
                  </Button>
                );
              })}
            </div>

            {!selectedClient ? (
              <Card className="border-2 border-dashed">
                <CardContent className="flex items-center justify-center h-96">
                  <div className="text-center text-slate-500">
                    <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Selecione um cliente para começar</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Fase 1: PRÉ-VISITA */}
                {activePhase === 'pre' && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <ClipboardList className="w-5 h-5 text-blue-600" />
                          Preparação Pré-Visita
                        </CardTitle>
                        <Button
                          onClick={generatePreVisitAI}
                          size="sm"
                          className="bg-blue-600"
                        >
                          <Brain className="w-4 h-4 mr-2" />
                          IA Gerar
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-sm font-semibold text-slate-700 mb-2 block">
                          Objetivo da Visita
                        </label>
                        <Textarea
                          placeholder="Ex: Apresentar VG2, fechar proposta..."
                          value={preVisitData.objective}
                          onChange={(e) => setPreVisitData(prev => ({...prev, objective: e.target.value}))}
                          rows={2}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-semibold text-slate-700 mb-2 block">
                          Perguntas SPIN
                        </label>
                        <Textarea
                          placeholder="5 perguntas estratégicas..."
                          value={preVisitData.questions}
                          onChange={(e) => setPreVisitData(prev => ({...prev, questions: e.target.value}))}
                          rows={4}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-semibold text-slate-700 mb-2 block">
                          Gatilhos Mentais
                        </label>
                        <Textarea
                          placeholder="Urgência, escassez, prova social..."
                          value={preVisitData.triggers}
                          onChange={(e) => setPreVisitData(prev => ({...prev, triggers: e.target.value}))}
                          rows={3}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-semibold text-slate-700 mb-2 block">
                          Materiais Necessários
                        </label>
                        <Textarea
                          placeholder="Catálogos, amostras, propostas..."
                          value={preVisitData.materials}
                          onChange={(e) => setPreVisitData(prev => ({...prev, materials: e.target.value}))}
                          rows={2}
                        />
                      </div>

                      <Button
                        onClick={() => setActivePhase('during')}
                        className="w-full bg-green-600"
                      >
                        Iniciar Visita →
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Fase 2: DURANTE VISITA */}
                {activePhase === 'during' && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-green-600" />
                        Durante a Visita
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-sm font-semibold text-slate-700 mb-2 block">
                          Observações Gerais
                        </label>
                        <Textarea
                          placeholder="O que aconteceu, clima, reações..."
                          value={duringVisitData.observations}
                          onChange={(e) => setDuringVisitData(prev => ({...prev, observations: e.target.value}))}
                          rows={4}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-semibold text-slate-700 mb-2 block">
                          Objeções Levantadas
                        </label>
                        <Textarea
                          placeholder="Quais objeções surgiram..."
                          value={duringVisitData.objections}
                          onChange={(e) => setDuringVisitData(prev => ({...prev, objections: e.target.value}))}
                          rows={3}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-semibold text-slate-700 mb-2 block">
                          Nível de Interesse
                        </label>
                        <Select
                          value={duringVisitData.interest_level}
                          onValueChange={(value) => setDuringVisitData(prev => ({...prev, interest_level: value}))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="muito_alto">🔥 Muito Alto</SelectItem>
                            <SelectItem value="alto">✅ Alto</SelectItem>
                            <SelectItem value="medio">⚠️ Médio</SelectItem>
                            <SelectItem value="baixo">❄️ Baixo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-semibold text-slate-700 mb-2 block">
                          Próximos Passos Combinados
                        </label>
                        <Textarea
                          placeholder="O que foi acordado..."
                          value={duringVisitData.next_steps}
                          onChange={(e) => setDuringVisitData(prev => ({...prev, next_steps: e.target.value}))}
                          rows={2}
                        />
                      </div>

                      <Button
                        onClick={() => setActivePhase('post')}
                        className="w-full bg-purple-600"
                      >
                        Finalizar Visita →
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Fase 3: PÓS-VISITA */}
                {activePhase === 'post' && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="w-5 h-5 text-purple-600" />
                          Análise Pós-Visita
                        </CardTitle>
                        <Button
                          onClick={generatePostAnalysisAI}
                          size="sm"
                          className="bg-purple-600"
                        >
                          <Brain className="w-4 h-4 mr-2" />
                          IA Analisar
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-sm font-semibold text-slate-700 mb-2 block">
                          Resultado
                        </label>
                        <Select
                          value={postVisitData.result}
                          onValueChange={(value) => setPostVisitData(prev => ({...prev, result: value}))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Avalie o resultado..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="sucesso">✅ Sucesso Total</SelectItem>
                            <SelectItem value="parcial">⚠️ Sucesso Parcial</SelectItem>
                            <SelectItem value="neutro">➖ Neutro</SelectItem>
                            <SelectItem value="fracasso">❌ Não Avançou</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-semibold text-slate-700 mb-2 block">
                          Próximo Follow-up
                        </label>
                        <Input
                          type="date"
                          value={postVisitData.follow_up_date}
                          onChange={(e) => setPostVisitData(prev => ({...prev, follow_up_date: e.target.value}))}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-semibold text-slate-700 mb-2 block">
                          Análise Completa (IA)
                        </label>
                        <Textarea
                          placeholder="Análise da visita, insights, recomendações..."
                          value={postVisitData.notes}
                          onChange={(e) => setPostVisitData(prev => ({...prev, notes: e.target.value}))}
                          rows={6}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <Button
                          onClick={saveCompleteVisit}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Salvar Visita
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setActivePhase('pre')}
                        >
                          Nova Visita
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Histórico de Visitas */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      Histórico - {selectedClient.first_name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {visits
                        .filter(v => v.client_id === selectedClient.id)
                        .slice(0, 5)
                        .map(visit => (
                          <div
                            key={visit.id}
                            className="p-3 bg-slate-50 rounded-lg border"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-semibold text-sm">
                                {new Date(visit.scheduled_date).toLocaleDateString('pt-BR')}
                              </span>
                              <Badge variant="outline">
                                {visit.status}
                              </Badge>
                            </div>
                            <p className="text-xs text-slate-600 line-clamp-2">
                              {visit.notes?.substring(0, 100)}...
                            </p>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
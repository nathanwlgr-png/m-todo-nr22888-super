import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  MessageSquare, 
  ClipboardCheck,
  Building2,
  UserCog,
  Loader2,
  ThermometerSun,
  Phone,
  Sparkles,
  Trash2,
  Edit2,
  Save,
  FileText,
  Upload,
  Download,
  Calendar,
  CheckSquare,
  Plus,
  CheckCircle2
} from 'lucide-react';
import NumerologyCard from '@/components/NumerologyCard';
import ScoreBar from '@/components/ScoreBar';
import ScheduleVisitButton from '@/components/ScheduleVisitButton';
import ClientEquipmentManager from '@/components/ClientEquipmentManager';
import FunnelPersuasionTriggers from '@/components/FunnelPersuasionTriggers';
import ClientTimeline from '@/components/ClientTimeline';
import QuickActionDialog from '@/components/QuickActionDialog';
import QuickWhatsAppSend from '@/components/QuickWhatsAppSend';
import { getClientLabelSync } from '@/components/ClientStatusLabel';
import InteractionTimeline from '@/components/InteractionTimeline';
import AddInteractionDialog from '@/components/AddInteractionDialog';
import PipelineVisual from '@/components/PipelineVisual';
import PipelineAIAssistant from '@/components/PipelineAIAssistant';
import ProposalGenerator from '@/components/ProposalGenerator';
import ClientConsumableAnalytics from '@/components/ClientConsumableAnalytics';
import FunnelStageCard from '@/components/FunnelStageCard';

const clientTypeLabels = {
  clinica_pequena: 'Clínica Pequena',
  clinica_media: 'Clínica Média',
  hospital_veterinario: 'Hospital Veterinário',
  laboratorio_terceirizado: 'Lab. Terceirizado',
  clinica_especializada: 'Clínica Especializada'
};

const roleLabels = {
  proprietario: 'Proprietário',
  veterinario_responsavel: 'Veterinário Responsável',
  gestor_laboratorio: 'Gestor de Laboratório',
  coordenador_tecnico: 'Coordenador Técnico',
  socio: 'Sócio'
};

const statusColors = {
  quente: 'bg-red-500',
  morno: 'bg-yellow-500',
  frio: 'bg-blue-400'
};

export default function ClientProfile() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const clientId = urlParams.get('id');

  const queryClient = useQueryClient();
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [editData, setEditData] = React.useState({});
  const [aiSummary, setAiSummary] = React.useState(null);
  const [loadingSummary, setLoadingSummary] = React.useState(false);
  const [quickActionOpen, setQuickActionOpen] = React.useState(false);
  const [quickActionType, setQuickActionType] = React.useState('task');
  const [uploadDialogOpen, setUploadDialogOpen] = React.useState(false);
  const [uploadData, setUploadData] = React.useState({ title: '', type: 'proposta', notes: '' });
  const [uploading, setUploading] = React.useState(false);
  const fileInputRef = React.useRef(null);

  const { data: client, isLoading } = useQuery({
    queryKey: ['client', clientId],
    queryFn: async () => {
      if (!clientId) return null;
      const clients = await base44.entities.Client.list();
      return clients.find(c => c.id === clientId);
    },
    enabled: !!clientId
  });

  const { data: visits = [] } = useQuery({
    queryKey: ['client-visits', clientId],
    queryFn: () => base44.entities.Visit.filter({ client_id: clientId }),
    enabled: !!clientId
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['client-sales', clientId],
    queryFn: () => base44.entities.Sale.filter({ client_id: clientId }),
    enabled: !!clientId
  });

  const { data: followupLogs = [] } = useQuery({
    queryKey: ['client-followup-logs', clientId],
    queryFn: () => base44.entities.FollowUpLog.filter({ client_id: clientId }),
    enabled: !!clientId
  });

  const { data: clientTasks = [] } = useQuery({
    queryKey: ['client-tasks', clientId],
    queryFn: () => base44.entities.Task.filter({ client_id: clientId }),
    enabled: !!clientId
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['client-documents', clientId],
    queryFn: () => base44.entities.ClientDocument.filter({ client_id: clientId }),
    enabled: !!clientId
  });

  const { data: interactions = [] } = useQuery({
    queryKey: ['interactions', clientId],
    queryFn: () => base44.entities.Interaction.filter({ client_id: clientId }),
    enabled: !!clientId
  });

  const clientLabel = getClientLabelSync(sales);
  const isClient = clientLabel === 'Cliente';

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Client.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['clients']);
      navigate(createPageUrl('Home'));
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Client.update(clientId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['client', clientId]);
      setEditDialogOpen(false);
    }
  });

  const handleDelete = () => {
    if (window.confirm(`Tem certeza que deseja remover ${client.first_name}?`)) {
      deleteMutation.mutate(client.id);
    }
  };

  const handleEdit = () => {
    setEditData({
      first_name: client.first_name || '',
      full_name: client.full_name || '',
      birthdate: client.birthdate || '',
      email: client.email || '',
      phone: client.phone || '',
      address: client.address || '',
      city: client.city || '',
      clinic_name: client.clinic_name || '',
      current_equipment: client.current_equipment || '',
      client_type: client.client_type || '',
      decision_role: client.decision_role || '',
      client_tone: client.client_tone || '',
      available_budget: client.available_budget || '',
      decision_deadline: client.decision_deadline || '',
      notes: client.notes || ''
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    updateMutation.mutate(editData);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.ClientDocument.create({
        client_id: clientId,
        client_name: client.first_name,
        title: uploadData.title || file.name,
        type: uploadData.type,
        file_url,
        notes: uploadData.notes
      });
      queryClient.invalidateQueries(['client-documents']);
      setUploadDialogOpen(false);
      setUploadData({ title: '', type: 'proposta', notes: '' });
    } catch (error) {
      alert('Erro ao fazer upload');
    } finally {
      setUploading(false);
    }
  };

  const openQuickAction = (type) => {
    setQuickActionType(type);
    setQuickActionOpen(true);
  };

  // Montar timeline de eventos
  const timelineEvents = React.useMemo(() => {
    if (!client) return [];
    
    const events = [];

    // Visitas
    visits.forEach(visit => {
      events.push({
        type: 'visit',
        title: `Visita: ${visit.visit_type}`,
        date: visit.scheduled_date,
        description: visit.result_notes || visit.notes,
        badge: visit.status,
        metadata: { duração: `${visit.duration_minutes}min` }
      });
    });

    // Follow-ups
    followupLogs.forEach(log => {
      events.push({
        type: log.channel === 'email' ? 'email' : 'followup',
        title: log.sequence_name,
        date: log.sent_date,
        description: log.message_content?.substring(0, 100),
        badge: log.status
      });
    });

    // Vendas
    sales.forEach(sale => {
      events.push({
        type: 'sale',
        title: `Venda: ${sale.equipment_name}`,
        date: sale.sale_date,
        description: `R$ ${sale.sale_value.toLocaleString('pt-BR')}`,
        badge: sale.status
      });
    });

    // Tarefas concluídas
    clientTasks.filter(t => t.status === 'concluida').forEach(task => {
      events.push({
        type: 'task',
        title: task.title,
        date: task.updated_date || task.created_date,
        description: task.description,
        badge: 'concluída'
      });
    });

    // Documentos
    documents.forEach(doc => {
      events.push({
        type: 'document',
        title: `Documento: ${doc.title}`,
        date: doc.created_date,
        description: doc.notes,
        badge: doc.type
      });
    });

    // Ordenar por data decrescente
    return events.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [client, visits, followupLogs, sales, clientTasks, documents]);

  const generateAISummary = async () => {
    setLoadingSummary(true);
    try {
      const summary = await base44.integrations.Core.InvokeLLM({
        prompt: `Você é um assistente de vendas especializado. Crie um resumo CONCISO e ACIONÁVEL do cliente.

DADOS DO CLIENTE:
- Nome: ${client.first_name}
- Numerologia: ${client.numerology_number} - ${client.behavioral_profile}
- Caminho de Vida: ${client.life_path_number || 'N/A'}
- Estilo de Decisão: ${client.decision_style}
- Status: ${client.status} | Score: ${client.purchase_score}%
- Tipo: ${client.client_type}
- Decisor: ${client.decision_role}
- Última visita: ${client.last_visit_date || 'Nenhuma'}
- Dores: ${client.main_pains?.join(', ') || 'Não identificadas'}
- Equipamento atual: ${client.current_equipment || 'Nenhum'}
- Notas: ${client.notes || 'Sem notas'}

Crie um resumo em 3-4 FRASES CURTAS que responda:
1. Quem é esse cliente? (perfil psicológico)
2. Momento atual da venda (quente/frio/próximo passo)
3. Melhor abordagem estratégica (1 frase acionável)

Seja DIRETO, PRÁTICO e use linguagem de vendedor. Sem floreios.`
      });
      setAiSummary(summary);
    } catch (error) {
      console.error('Erro ao gerar resumo:', error);
    } finally {
      setLoadingSummary(false);
    }
  };

  React.useEffect(() => {
    if (client && !aiSummary) {
      generateAISummary();
    }
  }, [client]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">Cliente não encontrado</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-4 pt-4 pb-24 rounded-b-[2rem] overflow-hidden tech-grid">
        <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl"></div>

        <div className="relative flex items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full glass hover:bg-white/10">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-lg font-semibold text-white">{clientLabel}</h1>
          <button onClick={handleEdit} className="ml-auto p-2 rounded-full glass hover:bg-white/10">
            <Edit2 className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="relative flex items-center gap-4">
          <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${isClient ? 'from-green-500 to-emerald-600' : 'from-orange-500 to-orange-600'} flex items-center justify-center shadow-lg ${isClient ? 'glow-green' : 'glow-orange'}`}>
            {isClient ? (
              <CheckCircle2 className="w-10 h-10 text-white" />
            ) : (
              <span className="text-3xl font-bold text-white">
                {client.first_name?.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">{client.first_name}</h2>
            <div className="flex items-center gap-2 mt-1">
              {isClient && (
                <Badge className="bg-green-100 text-green-700 text-xs">
                  ✓ Cliente
                </Badge>
              )}
              <Badge className={`${statusColors[client.status]} text-white text-xs`}>
                {client.status === 'quente' ? '🔥 Quente' : client.status === 'morno' ? '🌡️ Morno' : '❄️ Frio'}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 -mt-16 space-y-4">
        {/* AI Summary */}
        {aiSummary && (
          <Card className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 shadow-md">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-indigo-600 mb-1">Resumo IA</p>
                <p className="text-sm text-slate-700 leading-relaxed">{aiSummary}</p>
              </div>
            </div>
          </Card>
        )}
        {loadingSummary && (
          <Card className="p-4 bg-indigo-50 border-indigo-200">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
              <p className="text-sm text-indigo-600">Gerando resumo inteligente...</p>
            </div>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => openQuickAction('task')}
            variant="outline"
            className="h-12 border-2 border-indigo-200 hover:bg-indigo-50"
          >
            <CheckSquare className="w-4 h-4 mr-2" />
            Nova Tarefa
          </Button>
          <Button
            onClick={() => openQuickAction('visit')}
            variant="outline"
            className="h-12 border-2 border-purple-200 hover:bg-purple-50"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Agendar Visita
          </Button>
        </div>

        {/* Gerador de Propostas */}
        <ProposalGenerator 
          client={client}
          onProposalGenerated={() => {
            queryClient.invalidateQueries(['client-documents']);
          }}
        />

        {/* Info Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 bg-white shadow-lg border-none">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-500">Tipo</span>
            </div>
            <p className="font-semibold text-slate-800 text-sm">
              {clientTypeLabels[client.client_type]}
            </p>
          </Card>

          <Card className="p-4 bg-white shadow-lg border-none">
            <div className="flex items-center gap-2 mb-1">
              <UserCog className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-500">Decisor</span>
            </div>
            <p className="font-semibold text-slate-800 text-sm">
              {roleLabels[client.decision_role]}
            </p>
          </Card>

          {client.available_budget && client.available_budget !== 'nao_informado' && (
            <Card className="p-4 bg-white shadow-lg border-none">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4 text-slate-400" />
                <span className="text-xs text-slate-500">Orçamento</span>
              </div>
              <p className="font-semibold text-slate-800 text-sm">
                {client.available_budget === 'ate_50k' ? 'Até R$ 50k' :
                 client.available_budget === '50k_100k' ? 'R$ 50-100k' :
                 client.available_budget === '100k_200k' ? 'R$ 100-200k' :
                 client.available_budget === '200k_500k' ? 'R$ 200-500k' :
                 'Acima R$ 500k'}
              </p>
            </Card>
          )}

          {client.decision_deadline && (
            <Card className="p-4 bg-white shadow-lg border-none">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="text-xs text-slate-500">Prazo Decisão</span>
              </div>
              <p className="font-semibold text-slate-800 text-sm">
                {format(new Date(client.decision_deadline), 'dd/MM/yyyy')}
              </p>
            </Card>
          )}
        </div>

        {/* Motivadores e Objeções */}
        {(client.purchase_motivators?.length > 0 || client.real_objections?.length > 0) && (
          <div className="space-y-3">
            {client.purchase_motivators?.length > 0 && (
              <Card className="p-4 bg-green-50 border-green-200">
                <p className="text-xs font-semibold text-green-700 mb-2">✓ Motivadores de Compra</p>
                <div className="flex flex-wrap gap-2">
                  {client.purchase_motivators.map((m, idx) => (
                    <Badge key={idx} className="bg-green-100 text-green-700">
                      {m}
                    </Badge>
                  ))}
                </div>
              </Card>
            )}

            {client.real_objections?.length > 0 && (
              <Card className="p-4 bg-red-50 border-red-200">
                <p className="text-xs font-semibold text-red-700 mb-2">⚠️ Objeções Reais</p>
                <div className="flex flex-wrap gap-2">
                  {client.real_objections.map((o, idx) => (
                    <Badge key={idx} className="bg-red-100 text-red-700">
                      {o}
                    </Badge>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* WhatsApp Card */}
        {client.phone && (
          <Card className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 shadow-md">
            <QuickWhatsAppSend
              contactId={client.id}
              contactName={client.first_name}
              contactPhone={client.phone}
            />
          </Card>
        )}

        {/* Score */}
        <Card className="p-5 bg-white shadow-md border-none">
          <ScoreBar score={client.purchase_score || 50} />
        </Card>

        {/* Funnel Stage with AI Analysis */}
        <FunnelStageCard client={client} />

        {/* Numerology Profile */}
        <div onClick={() => navigate(createPageUrl(`NumerologyAnalysis?id=${client.id}`))}>
          <NumerologyCard number={client.numerology_number || 1} />
        </div>
        {client.life_path_number && (
          <Card className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-indigo-600 font-medium mb-1">Caminho de Vida</p>
                <p className="text-2xl font-bold text-indigo-700">{client.life_path_number}</p>
              </div>
              <Button
                onClick={() => navigate(createPageUrl(`NumerologyAnalysis?id=${client.id}`))}
                variant="outline"
                size="sm"
                className="border-indigo-300 text-indigo-600"
              >
                Ver Análise Completa
              </Button>
            </div>
          </Card>
        )}

        {/* Equipment Manager */}
        <ClientEquipmentManager clientId={client.id} clientName={client.first_name} />

        {/* Consumable Analytics */}
        <ClientConsumableAnalytics clientId={client.id} clientName={client.first_name} />

        {/* Pipeline AI Assistant */}
        <PipelineAIAssistant 
          client={client}
          interactions={interactions}
          visits={visits}
          sales={sales}
        />

        {/* Pipeline Visual */}
        <PipelineVisual 
          client={client} 
          onStageClick={(stage) => {
            updateMutation.mutate({ 
              visit_objective: stage,
              last_visit_date: new Date().toISOString().split('T')[0]
            });
          }}
        />

        {/* Botão Registrar Interação */}
        <AddInteractionDialog client={client} />

        {/* Tabs: Interações, Tarefas, Documentos, Timeline */}
        <Tabs defaultValue="interactions" className="w-full">
          <TabsList className="grid w-full grid-cols-4" data-tutorial="interactions">
            <TabsTrigger value="interactions">
              Interações ({interactions.length})
            </TabsTrigger>
            <TabsTrigger value="tasks">
              Tarefas ({clientTasks.filter(t => t.status === 'pendente').length})
            </TabsTrigger>
            <TabsTrigger value="documents">
              Docs ({documents.length})
            </TabsTrigger>
            <TabsTrigger value="timeline">
              Timeline
            </TabsTrigger>
          </TabsList>

          {/* Interações */}
          <TabsContent value="interactions" className="space-y-2 mt-4">
            <InteractionTimeline interactions={interactions} />
          </TabsContent>

          {/* Tarefas Ativas */}
          <TabsContent value="tasks" className="space-y-2 mt-4">
            {clientTasks.filter(t => t.status === 'pendente').length === 0 ? (
              <Card className="p-6 text-center">
                <CheckSquare className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">Nenhuma tarefa ativa</p>
              </Card>
            ) : (
              clientTasks.filter(t => t.status === 'pendente').map(task => (
                <Card key={task.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-slate-800">{task.title}</p>
                      {task.description && (
                        <p className="text-sm text-slate-600 mt-1">{task.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={
                          task.priority === 'alta' ? 'bg-red-100 text-red-700' :
                          task.priority === 'media' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-blue-100 text-blue-700'
                        }>
                          {task.priority}
                        </Badge>
                        <span className="text-xs text-slate-500">
                          Vence: {format(new Date(task.due_date), 'dd/MM/yyyy')}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Documentos */}
          <TabsContent value="documents" className="space-y-2 mt-4">
            <Button
              onClick={() => setUploadDialogOpen(true)}
              variant="outline"
              className="w-full h-12 border-2 border-dashed border-indigo-300 hover:bg-indigo-50"
            >
              <Upload className="w-4 h-4 mr-2" />
              Fazer Upload
            </Button>

            {documents.length === 0 ? (
              <Card className="p-6 text-center">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">Nenhum documento</p>
              </Card>
            ) : (
              documents.map(doc => (
                <Card key={doc.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-slate-800">{doc.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">{doc.type}</Badge>
                        <span className="text-xs text-slate-500">
                          {format(new Date(doc.created_date), 'dd/MM/yyyy')}
                        </span>
                      </div>
                      {doc.notes && (
                        <p className="text-xs text-slate-600 mt-2">{doc.notes}</p>
                      )}
                    </div>
                    {doc.file_url && (
                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-slate-100 rounded-lg"
                      >
                        <Download className="w-4 h-4 text-indigo-600" />
                      </a>
                    )}
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Timeline */}
          <TabsContent value="timeline" className="mt-4">
            <ClientTimeline events={timelineEvents} />
          </TabsContent>
        </Tabs>

        {/* Funnel Persuasion Triggers */}
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3 px-1">🎯 Gatilhos por Etapa do Funil</h3>
          <FunnelPersuasionTriggers client={client} />
        </div>

        {/* Next Action */}
        {client.next_action && (
          <Card className="p-4 bg-amber-50 border-amber-200">
            <p className="text-xs text-amber-600 font-medium mb-1">Próxima Ação</p>
            <p className="text-slate-700">{client.next_action}</p>
          </Card>
        )}

        {/* Delete Button */}
        <Button
          onClick={handleDelete}
          variant="outline"
          className="w-full h-12 rounded-xl border-2 border-red-200 text-red-600 hover:bg-red-50"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Remover
        </Button>
        </div>

      {/* Fixed Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => navigate(createPageUrl(`ProspectingScripts?id=${client.id}`))}
            variant="outline"
            className="h-12 rounded-xl border-2 text-sm font-semibold border-emerald-200 text-emerald-700"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Roteiros
          </Button>

          <Button
            onClick={() => navigate(createPageUrl(`ObjectionAnalyzer?id=${client.id}`))}
            variant="outline"
            className="h-12 rounded-xl border-2 text-sm font-semibold border-red-200 text-red-700"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Objeções
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => navigate(createPageUrl(`FollowUpAssistant?id=${client.id}`))}
            variant="outline"
            className="h-12 rounded-xl border-2 text-sm font-semibold"
          >
            <Sparkles className="w-4 h-4 mr-1" />
            Follow-Up IA
          </Button>

          <Button
            onClick={() => navigate(createPageUrl(`PreVisitChecklist?id=${client.id}`))}
            variant="outline"
            className="h-12 rounded-xl border-2 text-sm font-semibold"
          >
            <ClipboardCheck className="w-4 h-4 mr-1" />
            Checklist
          </Button>
        </div>

        <ScheduleVisitButton client={client} />

        <Button
          onClick={() => navigate(createPageUrl(`AIAssistant?id=${client.id}`))}
          className="w-full h-14 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 rounded-xl text-base font-semibold shadow-lg shadow-orange-500/30 glow-orange"
        >
          <MessageSquare className="w-5 h-5 mr-2" />
          Abrir Assistente IA
        </Button>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Primeiro Nome *</Label>
              <Input
                value={editData.first_name}
                onChange={(e) => setEditData({...editData, first_name: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label>Nome Completo</Label>
              <Input
                value={editData.full_name}
                onChange={(e) => setEditData({...editData, full_name: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label>Data de Nascimento</Label>
              <Input
                type="date"
                value={editData.birthdate}
                onChange={(e) => setEditData({...editData, birthdate: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={editData.email}
                onChange={(e) => setEditData({...editData, email: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label>WhatsApp</Label>
              <Input
                value={editData.phone}
                onChange={(e) => setEditData({...editData, phone: e.target.value})}
                placeholder="5511999999999"
              />
            </div>

            <div className="space-y-2">
              <Label>Endereço</Label>
              <Input
                value={editData.address}
                onChange={(e) => setEditData({...editData, address: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label>Cidade</Label>
              <Input
                value={editData.city}
                onChange={(e) => setEditData({...editData, city: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label>Nome da Clínica/Hospital</Label>
              <Input
                value={editData.clinic_name}
                onChange={(e) => setEditData({...editData, clinic_name: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label>Equipamento Atual</Label>
              <Input
                value={editData.current_equipment}
                onChange={(e) => setEditData({...editData, current_equipment: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label>Tipo de Cliente</Label>
              <Select
                value={editData.client_type}
                onValueChange={(value) => setEditData({...editData, client_type: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="clinica_pequena">Clínica Pequena</SelectItem>
                  <SelectItem value="clinica_media">Clínica Média</SelectItem>
                  <SelectItem value="hospital_veterinario">Hospital Veterinário</SelectItem>
                  <SelectItem value="laboratorio_terceirizado">Lab. Terceirizado</SelectItem>
                  <SelectItem value="clinica_especializada">Clínica Especializada</SelectItem>
                  <SelectItem value="sem_equipamento">Sem Equipamento</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Papel do Decisor *</Label>
              <Select
                value={editData.decision_role}
                onValueChange={(value) => setEditData({...editData, decision_role: value})}
              >
                <SelectTrigger>
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

            <div className="space-y-2">
              <Label>Tom de Voz Observado</Label>
              <Select
                value={editData.client_tone}
                onValueChange={(value) => setEditData({...editData, client_tone: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="assertivo">Assertivo</SelectItem>
                  <SelectItem value="analitico">Analítico</SelectItem>
                  <SelectItem value="receptivo">Receptivo</SelectItem>
                  <SelectItem value="entusiasmado">Entusiasmado</SelectItem>
                  <SelectItem value="cauteloso">Cauteloso</SelectItem>
                  <SelectItem value="direto">Direto</SelectItem>
                  <SelectItem value="emocional">Emocional</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Orçamento Disponível</Label>
              <Select
                value={editData.available_budget}
                onValueChange={(value) => setEditData({...editData, available_budget: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ate_50k">Até R$ 50.000</SelectItem>
                  <SelectItem value="50k_100k">R$ 50.000 - R$ 100.000</SelectItem>
                  <SelectItem value="100k_200k">R$ 100.000 - R$ 200.000</SelectItem>
                  <SelectItem value="200k_500k">R$ 200.000 - R$ 500.000</SelectItem>
                  <SelectItem value="acima_500k">Acima de R$ 500.000</SelectItem>
                  <SelectItem value="nao_informado">Não informado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Prazo para Decisão</Label>
              <Input
                type="date"
                value={editData.decision_deadline}
                onChange={(e) => setEditData({...editData, decision_deadline: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea
                value={editData.notes}
                onChange={(e) => setEditData({...editData, notes: e.target.value})}
                rows={4}
              />
            </div>

            <Button
              onClick={handleSaveEdit}
              disabled={updateMutation.isPending}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              {updateMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
            </div>
          </DialogContent>
          </Dialog>

          {/* Upload Document Dialog */}
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload de Documento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Título *</Label>
              <Input
                value={uploadData.title}
                onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                placeholder="Ex: Proposta Comercial"
              />
            </div>

            <div>
              <Label>Tipo *</Label>
              <Select value={uploadData.type} onValueChange={(v) => setUploadData({ ...uploadData, type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="proposta">Proposta</SelectItem>
                  <SelectItem value="contrato">Contrato</SelectItem>
                  <SelectItem value="relatorio">Relatório</SelectItem>
                  <SelectItem value="apresentacao">Apresentação</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Notas</Label>
              <Textarea
                value={uploadData.notes}
                onChange={(e) => setUploadData({ ...uploadData, notes: e.target.value })}
                placeholder="Observações sobre o documento..."
                rows={3}
              />
            </div>

            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileUpload}
            />

            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full bg-indigo-600 hover:bg-indigo-700"
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Selecionar Arquivo
                </>
              )}
            </Button>
          </div>
          </DialogContent>
          </Dialog>

          {/* Quick Action Dialog */}
          <QuickActionDialog
          client={client}
          open={quickActionOpen}
          onOpenChange={setQuickActionOpen}
          actionType={quickActionType}
          />
          </div>
          );
          }
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
  CheckCircle2,
  DollarSign,
  Search,
  Shield,
  Target,
  RotateCcw,
  TrendingUp,
  Copy,
  Send
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
import ConsumableSalesAnalytics from '@/components/ConsumableSalesAnalytics';
import LabNeedsEditor from '@/components/LabNeedsEditor';
import AIProposalSelector from '@/components/AIProposalSelector';
import PostVisitDialog from '@/components/PostVisitDialog';
import CommunicationPreferencesEditor from '@/components/CommunicationPreferencesEditor';
import ClientDataEditor from '@/components/ClientDataEditor';
import VisitReportPDF from '@/components/VisitReportPDF';
      import VoiceRecorderButton from '@/components/VoiceRecorderButton';
      import ScoreExplanation from '@/components/ScoreExplanation';
      import InventoryStockDisplay from '@/components/InventoryStockDisplay';
      import ClientScoreCard from '@/components/ClientScoreCard';
import CapitalAnalysisAI from '@/components/CapitalAnalysisAI';
import ProbabilityAnalysisAI from '@/components/ProbabilityAnalysisAI';
import PrimoriAdvancedAnalytics from '@/components/PrimoriAdvancedAnalytics';
import NumerologyBestDayAI from '@/components/NumerologyBestDayAI';
import CompetitorAnalysisAI from '@/components/CompetitorAnalysisAI';
import ClientHealthScore from '@/components/ClientHealthScore';
import ObjectionHandlingByProfile from '@/components/ObjectionHandlingByProfile';
import TeamChat from '@/components/TeamChat';
import CollaborationIndicator from '@/components/CollaborationIndicator';
import ProposalContractGenerator from '@/components/ProposalContractGenerator';
import WhatsAppPackageSender from '@/components/WhatsAppPackageSender';
import InstagramProfileFinder from '@/components/InstagramProfileFinder';
import MultiProposalGeneratorAI from '@/components/MultiProposalGeneratorAI';
import WhatsAppProposalPackage from '@/components/WhatsAppProposalPackage';
import WhatsAppConversationView from '@/components/WhatsAppConversationView';
import AdvancedClientAnalytics from '@/components/AdvancedClientAnalytics';
import NextStepAI from '@/components/NextStepAI';
import AutoFollowUpGenerator from '@/components/AutoFollowUpGenerator';
import SmartScheduler from '@/components/SmartScheduler';
import NearbyClinicsFinder from '@/components/NearbyClinicsFinder';
import UltimateSalesStrategyAI from '@/components/UltimateSalesStrategyAI';
import SeamatyProductMatcher from '@/components/SeamatyProductMatcher';
import NumerologyDeepAnalysis from '@/components/NumerologyDeepAnalysis';
import ClientJourneyMapper from '@/components/ClientJourneyMapper';
import IntegratedAISalesAssistant from '@/components/IntegratedAISalesAssistant';
import InteractionInsightsAI from '@/components/InteractionInsightsAI';
import AutoDataEnrichment from '@/components/AutoDataEnrichment';
import AutoProductRecommender from '@/components/AutoProductRecommender';
import PredictiveAnalyticsEngine from '@/components/PredictiveAnalyticsEngine';
import AINextBestAction from '@/components/AINextBestAction';
import SmartClientSummary from '@/components/SmartClientSummary';
import AutoTaskCreator from '@/components/AutoTaskCreator';
import SalesFunnelPredictiveAnalysis from '@/components/SalesFunnelPredictiveAnalysis';
import PersonalizedUpsellEngine from '@/components/PersonalizedUpsellEngine';
import SalesKnowledgeBase from '@/components/SalesKnowledgeBase';
import ProposalGeneratorAI from '@/components/ProposalGeneratorAI';
import ChurnPredictionAnalyzer from '@/components/ChurnPredictionAnalyzer';
import DynamicFollowUpOrchestrator from '@/components/DynamicFollowUpOrchestrator';
import MarketNewsAnalyzer from '@/components/MarketNewsAnalyzer';
import CompetitorIntelligenceAI from '@/components/CompetitorIntelligenceAI';
import PersonalizedMarketApproach from '@/components/PersonalizedMarketApproach';
import UltraDeepMarketIntelligence from '@/components/UltraDeepMarketIntelligence';
import AutoFollowUpEmailGenerator from '@/components/AutoFollowUpEmailGenerator';
import DynamicPurchasePropensityScore from '@/components/DynamicPurchasePropensityScore';
import ProactiveAISalesAssistant from '@/components/ProactiveAISalesAssistant';
import ProactiveCommunicationEngine from '@/components/ProactiveCommunicationEngine';
import QuickCommunicationActions from '@/components/QuickCommunicationActions';
import AIMetricsBadges from '@/components/AIMetricsBadges';
import ClientSalesKPIDashboard from '@/components/ClientSalesKPIDashboard';
import ClientSalesReport from '@/components/ClientSalesReport';
import ClientEmailMarketingSegment from '@/components/ClientEmailMarketingSegment';
import ClientAIFieldsPanel from '@/components/ClientAIFieldsPanel';
import ClientAIInsightsDashboard from '@/components/ClientAIInsightsDashboard';
import AIFollowUpGenerator from '@/components/AIFollowUpGenerator';
import PipelineActionRecommender from '@/components/PipelineActionRecommender';
import SalesCoachingAnalyzer from '@/components/SalesCoachingAnalyzer';
import GoogleSlidesCompetitorAnalysis from '@/components/GoogleSlidesCompetitorAnalysis';
import NotionStrategyDocumentation from '@/components/NotionStrategyDocumentation';
import SalesforceOpportunitySync from '@/components/SalesforceOpportunitySync';
import MarketIntelligenceAnalyzer from '@/components/MarketIntelligenceAnalyzer';
import CompetitorAnalysisModule from '@/components/CompetitorAnalysisModule';
import MarketReportGenerator from '@/components/MarketReportGenerator';
import HolisticClientScore from '@/components/HolisticClientScore';
import AINextBestActionsCard from '@/components/AINextBestActionsCard';
import MarketContextualIntelligence from '@/components/MarketContextualIntelligence';
import MarketTrendsAlerts from '@/components/MarketTrendsAlerts';
import EditableClientFields from '@/components/EditableClientFields';
import AIContentGenerator from '@/components/AIContentGenerator';
import AIContentPersonalizer from '@/components/AIContentPersonalizer';
import PredictiveAnalyticsDashboard from '@/components/PredictiveAnalyticsDashboard';
import AIAutomationEngine from '@/components/AIAutomationEngine';
import SmartInteractionProcessor from '@/components/SmartInteractionProcessor';
import EngagementTracker from '@/components/EngagementTracker';
import { toast } from 'sonner';
import { useOfflineClientEdit } from '@/components/OfflineDataSync';
import OfflineIndicator from '@/components/OfflineIndicator';
import OfflineSyncStatus from '@/components/OfflineSyncStatus';

const getSegmentBadge = (segment) => {
  const config = {
    'VIP': { color: 'bg-purple-500 text-white', icon: '👑' },
    'Champions': { color: 'bg-green-500 text-white', icon: '🏆' },
    'Potential': { color: 'bg-blue-500 text-white', icon: '⭐' },
    'Nurture': { color: 'bg-yellow-500 text-white', icon: '🌱' },
    'At Risk': { color: 'bg-red-500 text-white', icon: '⚠️' },
    'Cold': { color: 'bg-gray-500 text-white', icon: '❄️' },
    'Dormant': { color: 'bg-orange-500 text-white', icon: '💤' }
  };
  return config[segment] || { color: 'bg-gray-400 text-white', icon: '📊' };
};

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
  const [editData, setEditData] = React.useState({});
  const [aiSummary, setAiSummary] = React.useState(null);
  const [loadingSummary, setLoadingSummary] = React.useState(false);
  const [quickActionOpen, setQuickActionOpen] = React.useState(false);
  const [quickActionType, setQuickActionType] = React.useState('task');
  const [uploadDialogOpen, setUploadDialogOpen] = React.useState(false);
  const [uploadData, setUploadData] = React.useState({ title: '', type: 'proposta', notes: '' });
  const [uploading, setUploading] = React.useState(false);
  const fileInputRef = React.useRef(null);
  const [aiMessageDialogOpen, setAiMessageDialogOpen] = React.useState(false);
  const [selectedMessageType, setSelectedMessageType] = React.useState('');
  const [generatedMessage, setGeneratedMessage] = React.useState(null);
  const [generatingMessage, setGeneratingMessage] = React.useState(false);
  const [closingProbability, setClosingProbability] = React.useState(null);
  const [postVisitOpen, setPostVisitOpen] = React.useState(false);
  const [selectedVisitId, setSelectedVisitId] = React.useState(null);
  
  const { isOffline: clientIsOffline, updateClient: updateClientOffline } = useOfflineClientEdit();

  const { data: client, isLoading, isError } = useQuery({
    queryKey: ['client', clientId],
    queryFn: async () => {
      if (!clientId || typeof clientId !== 'string' || clientId.length < 20) {
        navigate(createPageUrl('Clients'));
        return null;
      }
      try {
        const allClients = await base44.entities.Client.list();
        const foundClient = allClients.find(c => c?.id === clientId);
        
        if (!foundClient) {
          toast.error('Cliente não encontrado ou foi deletado');
          navigate(createPageUrl('Clients'));
          return null;
        }
        return foundClient;
      } catch (error) {
        if (error.message?.includes('not found')) {
          toast.error('Cliente não encontrado ou foi deletado');
        }
        navigate(createPageUrl('Clients'));
        return null;
      }
    },
    enabled: !!clientId && typeof clientId === 'string' && clientId.length >= 20,
    retry: 0,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000
  });

  const { data: visits = [] } = useQuery({
    queryKey: ['client-visits', clientId],
    queryFn: async () => {
      try {
        return await base44.entities.Visit.filter({ client_id: clientId });
      } catch (error) {
        console.error('Erro ao carregar visitas:', error);
        return [];
      }
    },
    enabled: !!clientId,
    staleTime: 30 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 0
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['client-sales', clientId],
    queryFn: async () => {
      try {
        return await base44.entities.Sale.filter({ client_id: clientId });
      } catch (error) {
        console.error('Erro ao carregar vendas:', error);
        return [];
      }
    },
    enabled: !!clientId,
    staleTime: 30 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 0
  });

  const { data: followupLogs = [] } = useQuery({
    queryKey: ['client-followup-logs', clientId],
    queryFn: async () => {
      try {
        return await base44.entities.FollowUpLog.filter({ client_id: clientId });
      } catch (error) {
        console.error('Erro ao carregar follow-ups:', error);
        return [];
      }
    },
    enabled: !!clientId,
    staleTime: 30 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 0
  });

  const { data: clientTasks = [] } = useQuery({
    queryKey: ['client-tasks', clientId],
    queryFn: async () => {
      try {
        return await base44.entities.Task.filter({ client_id: clientId });
      } catch (error) {
        console.error('Erro ao carregar tarefas:', error);
        return [];
      }
    },
    enabled: !!clientId,
    staleTime: 30 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 0
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['client-documents', clientId],
    queryFn: async () => {
      try {
        return await base44.entities.ClientDocument.filter({ client_id: clientId });
      } catch (error) {
        console.error('Erro ao carregar documentos:', error);
        return [];
      }
    },
    enabled: !!clientId,
    staleTime: 30 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 0
  });

  const { data: interactions = [] } = useQuery({
    queryKey: ['interactions', clientId],
    queryFn: async () => {
      try {
        return await base44.entities.Interaction.filter({ client_id: clientId });
      } catch (error) {
        console.error('Erro ao carregar interações:', error);
        return [];
      }
    },
    enabled: !!clientId,
    staleTime: 30 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 0
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
    mutationFn: async (data) => {
      return await updateClientOffline(clientId, data, client.first_name);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['client', clientId]);
      queryClient.invalidateQueries(['clients']);
      if (!clientIsOffline) {
        toast.success('Salvo!', { duration: 1000 });
      }
    }
  });

  const handleDelete = () => {
    if (window.confirm(`Tem certeza que deseja remover ${client.first_name}?`)) {
      deleteMutation.mutate(client.id);
    }
  };

  // Auto-save imediato com suporte offline
  const handleQuickUpdate = async (field, value) => {
    try {
      await updateClientOffline(clientId, { [field]: value }, client.first_name);
      queryClient.invalidateQueries(['client', clientId]);
      
      if (!clientIsOffline) {
        toast.success('✓ Salvo', { duration: 800 });
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar');
    }
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

  const generateContextualMessage = async (messageType) => {
    setGeneratingMessage(true);
    setSelectedMessageType(messageType);
    
    try {
      const aiMode = localStorage.getItem('nr22_ai_mode') || 'economy';
      
      if (aiMode === 'off') {
        toast.error('IA desligada - Ative na Home');
        setGeneratingMessage(false);
        return;
      }

      const prompt = `Você é um especialista em vendas consultivas de equipamentos veterinários.

CONTEXTO COMPLETO DO CLIENTE:
- Nome: ${client.first_name}
- Perfil Numerológico: ${client.numerology_number} - ${client.behavioral_profile}
- Caminho de Vida: ${client.life_path_number || 'N/A'}
- Estilo de Decisão: ${client.decision_style}
- Tom: ${client.client_tone || 'Não observado'}
- Status: ${client.status} | Score: ${client.purchase_score}%
- Tipo: ${client.client_type}
- Decisor: ${client.decision_role}
- Equipamento Atual: ${client.current_equipment || 'Nenhum'}
- Dores: ${client.main_pains?.join(', ') || 'Não identificadas'}
- Motivadores: ${client.purchase_motivators?.join(', ') || 'Não identificados'}
- Objeções: ${client.real_objections?.join(', ') || 'Nenhuma'}
- Orçamento: ${client.available_budget || 'Não informado'}
- Prazo Decisão: ${client.decision_deadline || 'Não definido'}
- Última Visita: ${client.last_visit_date || 'Nenhuma'}
- Objetivo Visita: ${client.visit_objective || 'Não definido'}
- Gatilhos Usados: ${client.triggers_used?.join(', ') || 'Nenhum'}
- Notas: ${client.notes || 'Sem notas'}

HISTÓRICO:
- Visitas Realizadas: ${visits.filter(v => v.status === 'realizada').length}
- Vendas Fechadas: ${sales.filter(s => s.status === 'fechada').length}
- Interações: ${interactions.length}

TIPO DE MENSAGEM: ${messageType}

TAREFA:
Gere uma mensagem PERFEITA para este momento específico da venda. Retorne JSON:

{
  "message": "Mensagem completa pronta para enviar (2-4 parágrafos)",
  "closing_probability": 75,
  "probability_factors": {
    "positivos": ["Fator 1", "Fator 2"],
    "negativos": ["Fator 1", "Fator 2"]
  },
  "recommended_next_step": "Próxima ação concreta",
  "best_timing": "Melhor momento para enviar",
  "framework_used": "Framework principal usado (SPIN/Cialdini/etc)"
}

INSTRUÇÕES POR TIPO:
- ${messageType === 'prospeccao' ? 'PROSPECÇÃO: Primeira abordagem, despertando interesse' : ''}
- ${messageType === 'followup' ? 'FOLLOW-UP: Retomar contato sem pressão, valor agregado' : ''}
- ${messageType === 'objecao' ? 'CONTROLE DE OBJEÇÃO: Validar + Reframing usando SPIN' : ''}
- ${messageType === 'fechamento' ? 'FECHAMENTO: Momento decisivo, urgência ética' : ''}
- ${messageType === 'reativacao' ? 'REATIVAÇÃO: Cliente frio, nova abordagem criativa' : ''}
- ${messageType === 'upsell' ? 'UPSELL: Cliente já comprou, oferecer complemento' : ''}

Use: Numerologia + SPIN + Cialdini + Inteligência Emocional + Arte da Guerra
Tom: Adaptar ao perfil numerológico e tom observado
Objetivo: Maximizar probabilidade de avanço na venda`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            message: { type: "string" },
            closing_probability: { type: "number" },
            probability_factors: {
              type: "object",
              properties: {
                positivos: { type: "array", items: { type: "string" } },
                negativos: { type: "array", items: { type: "string" } }
              }
            },
            recommended_next_step: { type: "string" },
            best_timing: { type: "string" },
            framework_used: { type: "string" }
          }
        }
      });

      setGeneratedMessage(result);
      setClosingProbability(result.closing_probability);
    } catch (error) {
      if (error.message?.includes('limit')) {
        toast.error('Limite de IA atingido');
      } else {
        toast.error('Erro ao gerar mensagem');
      }
    } finally {
      setGeneratingMessage(false);
    }
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
      const aiMode = localStorage.getItem('nr22_ai_mode') || 'economy';
      
      if (aiMode === 'off') {
        toast.error('IA desligada - Ative na Home');
        setLoadingSummary(false);
        return;
      }

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
      if (error.message?.includes('limit')) {
        toast.error('Limite de IA atingido');
      } else {
        toast.error('Erro ao gerar resumo');
      }
      console.error('Erro ao gerar resumo:', error);
    } finally {
      setLoadingSummary(false);
    }
  };

  // Removido: geração automática de resumo IA para evitar rate limit
  // Agora é acionado apenas manualmente pelo botão

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
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-white">{client.first_name}</h2>
              <ScoreExplanation client={client} score={client.purchase_score || 50} />
            </div>
            <div className="flex items-center gap-2 mt-1">
              {isClient && (
                <Badge className="bg-green-100 text-green-700 text-xs">
                  ✓ Cliente
                </Badge>
              )}
              <Badge className={`${statusColors[client.status]} text-white text-xs`}>
                {client.status === 'quente' ? '🔥 Quente' : client.status === 'morno' ? '🌡️ Morno' : '❄️ Frio'}
              </Badge>
              {client.total_visits_count > 0 && (
                <Badge className="bg-purple-100 text-purple-700 text-xs">
                  {client.total_visits_count}x visitado
                </Badge>
              )}
              {client.ai_segment && (
                <Badge className={`${getSegmentBadge(client.ai_segment).color} text-xs`}>
                  {getSegmentBadge(client.ai_segment).icon} {client.ai_segment}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 -mt-16 space-y-4">
        {/* Status de Sincronização */}
        <OfflineSyncStatus />
        
        {/* Collaboration Indicator */}
        <CollaborationIndicator contextType="client" contextId={clientId} />

        {/* IA INTEGRADA — Análise automática de campos + Scripts + Chat */}
        <ClientAIFieldsPanel
          client={client}
          interactions={interactions}
          visits={visits}
          sales={sales}
        />

        {/* AI Metrics Badges - Destaque */}
        <AIMetricsBadges client={client} variant="full" />

        {/* KPIs de Vendas por Cliente */}
        <ClientSalesKPIDashboard
          client={client}
          sales={sales}
          visits={visits}
        />

        {/* Relatório de Vendas por Período */}
        <ClientSalesReport
          client={client}
          sales={sales}
          visits={visits}
          tasks={clientTasks}
          interactions={interactions}
        />

        {/* Email Marketing — Segmentação IA */}
        <ClientEmailMarketingSegment
          client={client}
          sales={sales}
          interactions={interactions}
        />

        {/* AI Insights Dashboard — Sentimento, Churn, Padrão de Compra */}
        <ClientAIInsightsDashboard
          client={client}
          interactions={interactions}
          visits={visits}
          sales={sales}
        />

        {/* Score Holístico 360° - NOVO */}
        <HolisticClientScore 
          client={client}
          interactions={interactions}
          sales={sales}
          visits={visits}
        />

        {/* Next Best Actions IA - NOVO */}
        <AINextBestActionsCard
          client={client}
          interactions={interactions}
          sales={sales}
          visits={visits}
        />

        {/* Quick Communication Actions */}
        <QuickCommunicationActions client={client} />

        {/* Proactive Communication Engine */}
        <ProactiveCommunicationEngine clientId={clientId} />

        {/* Score do Cliente */}
        <ClientScoreCard clientId={clientId} />

        {/* 1. NÚMERO, ESTILO DE DECISÃO E DICAS DE ABORDAGEM */}
        <Card className="p-5 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
              <span className="text-3xl font-bold text-white">{client.numerology_number || '?'}</span>
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Perfil Numerológico</h3>
              <p className="text-sm text-purple-700">{client.behavioral_profile || 'Não analisado'}</p>
            </div>
          </div>

          <div className="space-y-3">
            {client.life_path_number && (
              <div className="p-3 bg-white rounded-lg">
                <p className="text-xs text-purple-600 font-semibold mb-1">Caminho de Vida</p>
                <p className="text-2xl font-bold text-purple-800">{client.life_path_number}</p>
              </div>
            )}

            {client.decision_style && (
              <div className="p-3 bg-white rounded-lg">
                <p className="text-xs text-purple-600 font-semibold mb-1">Estilo de Decisão</p>
                <p className="text-sm text-slate-800">{client.decision_style}</p>
              </div>
            )}

            {client.approach_tips && (
              <div className="p-3 bg-purple-100 border border-purple-300 rounded-lg">
                <p className="text-xs text-purple-700 font-semibold mb-1">💡 Dicas de Abordagem</p>
                <p className="text-sm text-purple-900">{client.approach_tips}</p>
              </div>
            )}

            <Button
              onClick={() => navigate(createPageUrl(`NumerologyAnalysis?id=${client.id}`))}
              variant="outline"
              className="w-full border-purple-300 text-purple-700"
            >
              Ver Análise Completa
            </Button>
          </div>
        </Card>

        {/* 2. CAMPOS EDITÁVEIS DO CLIENTE - NOVO */}
        <EditableClientFields 
          client={client}
          onUpdate={(updates) => {
            queryClient.invalidateQueries(['client', clientId]);
          }}
        />

        {/* 3. BUSCAR INSTAGRAM E CNPJ AUTOMATICAMENTE */}
        <InstagramProfileFinder 
          client={client} 
          onDataFound={(updates) => {
            queryClient.invalidateQueries(['client', clientId]);
          }} 
        />

        {/* 4. NECESSIDADES DO LABORATÓRIO E INFORMAÇÕES RELACIONADAS */}
        <LabNeedsEditor 
          clientId={client.id} 
          currentNeeds={client.lab_needs || []} 
        />

        <CommunicationPreferencesEditor 
          clientId={client.id} 
          currentPreferences={client.communication_preferences || {}} 
        />

        {/* Estoque mobVendedor */}
        <InventoryStockDisplay clientId={clientId} />

        {/* AI Summary */}
        {!aiSummary && !loadingSummary && (
          <Card className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 shadow-md">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-indigo-600 mb-1">Resumo IA</p>
                <p className="text-xs text-slate-600 mb-2">Gere um resumo inteligente deste cliente</p>
                <Button 
                  onClick={generateAISummary} 
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  <Sparkles className="w-3 h-3 mr-1" />
                  Gerar Resumo
                </Button>
              </div>
            </div>
          </Card>
        )}
        {aiSummary && (
          <Card className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 shadow-md">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-indigo-600 mb-1">Resumo IA</p>
                <p className="text-sm text-slate-700 leading-relaxed">{aiSummary}</p>
                <Button 
                  onClick={generateAISummary} 
                  size="sm"
                  variant="outline"
                  className="mt-2"
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Atualizar
                </Button>
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

        {/* 5. EQUIPAMENTO DE INTERESSE - SELETOR */}
        <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300">
          <h3 className="font-semibold text-slate-800 mb-3">🎯 Equipamento de Interesse</h3>
          <Select
            value={client.equipment_interest || ''}
            onValueChange={async (value) => {
              await updateClientOffline(clientId, { equipment_interest: value }, client.first_name);
              queryClient.invalidateQueries(['client', clientId]);
              if (!clientIsOffline) {
                toast.success('Interesse salvo!', { duration: 1000 });
              }
            }}
          >
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Selecione o equipamento..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="VG2">VG2 - Hemogasometria + Imunofluorescência</SelectItem>
              <SelectItem value="VG1">VG1 - Hemogasometria Básica</SelectItem>
              <SelectItem value="VQ1">VQ1 - PCR Veterinário (Nucleic Acid)</SelectItem>
              <SelectItem value="QT3">QT3 - Bioquímico + Coagulação + Gases</SelectItem>
              <SelectItem value="3DX">Lab 3DX - Bioquímico + Imuno + Gases (5 amostras)</SelectItem>
              <SelectItem value="SMT-120VP">SMT-120VP - Bioquímico Veterinário</SelectItem>
              <SelectItem value="VI1">VI1 - Imunofluorescência</SelectItem>
              <SelectItem value="Hematologia">Hematologia Veterinária</SelectItem>
              <SelectItem value="Hemogasometria">Hemogasometria Geral</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Artigos Científicos e Casos por Equipamento */}
          {client.equipment_interest && (
            <div className="mt-4 p-3 bg-white rounded-lg border border-blue-200">
              <p className="text-xs font-semibold text-blue-700 mb-2">📚 Material Científico</p>
              
              {(client.equipment_interest === 'VG2' || client.equipment_interest === 'VG1' || client.equipment_interest === 'Hemogasometria') && (
                <div className="space-y-2 text-xs">
                  <div className="p-2 bg-blue-50 rounded">
                    <p className="font-medium text-slate-800">🏥 Casos Reais:</p>
                    <ul className="text-slate-600 mt-1 space-y-1">
                      <li>• SPCA Singapore - Salvamento de animais</li>
                      <li>• Hospital Veterinário Vietnã - Eficiência 40%</li>
                      <li>• Aquapredict (Noruega) - Piscicultura</li>
                    </ul>
                  </div>
                  <div className="p-2 bg-purple-50 rounded">
                    <p className="font-medium text-slate-800">📄 Artigos:</p>
                    <ul className="text-slate-600 mt-1 space-y-1">
                      <li>• "Blood Gas Results in 10 Minutes" - Seamaty</li>
                      <li>• "VG1 vs VG2 Comparison Study"</li>
                      <li>• Distúrbio Ácido-Básico em Equinos</li>
                    </ul>
                  </div>
                </div>
              )}
              
              {client.equipment_interest === 'VQ1' && (
                <div className="space-y-2 text-xs">
                  <div className="p-2 bg-blue-50 rounded">
                    <p className="font-medium text-slate-800">🏥 Casos Reais:</p>
                    <ul className="text-slate-600 mt-1 space-y-1">
                      <li>• Laboratórios Clínicos - Vigilância de Doenças</li>
                      <li>• Indústria de Criação Animal</li>
                    </ul>
                  </div>
                  <div className="p-2 bg-purple-50 rounded">
                    <p className="font-medium text-slate-800">📄 Artigos:</p>
                    <ul className="text-slate-600 mt-1 space-y-1">
                      <li>• "Fully Automated Nucleic Acid Detection"</li>
                      <li>• "Real-time PCR Technology - VQ1"</li>
                      <li>• "Molecular Diagnostic in Veterinary"</li>
                    </ul>
                  </div>
                </div>
              )}
              
              {(client.equipment_interest === 'QT3' || client.equipment_interest === '3DX') && (
                <div className="space-y-2 text-xs">
                  <div className="p-2 bg-blue-50 rounded">
                    <p className="font-medium text-slate-800">🏥 Casos Reais:</p>
                    <ul className="text-slate-600 mt-1 space-y-1">
                      <li>• Zoocenter (Colômbia) - Dr. Diana Rojas</li>
                      <li>• Clínicas Especializadas - Pet Healthcare</li>
                    </ul>
                  </div>
                  <div className="p-2 bg-purple-50 rounded">
                    <p className="font-medium text-slate-800">📄 Artigos:</p>
                    <ul className="text-slate-600 mt-1 space-y-1">
                      <li>• "Dual-Rotor System Innovation - Qt3"</li>
                      <li>• "All-in-One Diagnostic Solution"</li>
                      <li>• "Lab 3Dx: 5 Samples Simultaneously"</li>
                    </ul>
                  </div>
                </div>
              )}
              
              {client.equipment_interest === 'SMT-120VP' && (
                <div className="space-y-2 text-xs">
                  <div className="p-2 bg-blue-50 rounded">
                    <p className="font-medium text-slate-800">🏥 Casos Reais:</p>
                    <ul className="text-slate-600 mt-1 space-y-1">
                      <li>• 6 Customer Success Stories</li>
                      <li>• Hospital Vietnã - Melhoria Eficiência</li>
                      <li>• Laboratórios América Latina</li>
                    </ul>
                  </div>
                  <div className="p-2 bg-purple-50 rounded">
                    <p className="font-medium text-slate-800">📄 Artigos:</p>
                    <ul className="text-slate-600 mt-1 space-y-1">
                      <li>• "24 Comprehensive Test Plus"</li>
                      <li>• "Biochemistry Clinical Significance"</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>

        {/* 6. EQUIPAMENTO VENDIDO (se houver) */}
        {client.equipment_sold && (
          <Card className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-green-600 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-xs text-green-700 font-semibold">✅ Equipamento Vendido</p>
                <p className="font-bold text-green-900">{client.equipment_sold}</p>
                {client.contract_signature_date && (
                  <p className="text-xs text-green-600">
                    Assinatura: {new Date(client.contract_signature_date).toLocaleDateString('pt-BR')}
                  </p>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* AI Message Generator */}
        <Card className="p-5 bg-gradient-to-br from-purple-50 via-fuchsia-50 to-pink-50 border-2 border-purple-300 shadow-lg">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-slate-800 mb-1">🎯 Mensagem IA Contextual</h3>
              <p className="text-xs text-slate-600">Gere a mensagem perfeita para este momento</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4">
            <Button
              onClick={() => generateContextualMessage('prospeccao')}
              size="sm"
              variant="outline"
              className="h-auto py-2 text-xs"
              disabled={generatingMessage}
            >
              <Search className="w-3 h-3 mr-1" />
              Prospecção
            </Button>
            <Button
              onClick={() => generateContextualMessage('followup')}
              size="sm"
              variant="outline"
              className="h-auto py-2 text-xs"
              disabled={generatingMessage}
            >
              <MessageSquare className="w-3 h-3 mr-1" />
              Follow-up
            </Button>
            <Button
              onClick={() => generateContextualMessage('objecao')}
              size="sm"
              variant="outline"
              className="h-auto py-2 text-xs"
              disabled={generatingMessage}
            >
              <Shield className="w-3 h-3 mr-1" />
              Objeção
            </Button>
            <Button
              onClick={() => generateContextualMessage('fechamento')}
              size="sm"
              variant="outline"
              className="h-auto py-2 text-xs"
              disabled={generatingMessage}
            >
              <Target className="w-3 h-3 mr-1" />
              Fechamento
            </Button>
            <Button
              onClick={() => generateContextualMessage('reativacao')}
              size="sm"
              variant="outline"
              className="h-auto py-2 text-xs"
              disabled={generatingMessage}
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Reativação
            </Button>
            <Button
              onClick={() => generateContextualMessage('upsell')}
              size="sm"
              variant="outline"
              className="h-auto py-2 text-xs"
              disabled={generatingMessage}
            >
              <TrendingUp className="w-3 h-3 mr-1" />
              Upsell
            </Button>
          </div>

          {generatingMessage && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-purple-600 mr-2" />
              <span className="text-sm text-purple-600">Gerando mensagem perfeita...</span>
            </div>
          )}

          {generatedMessage && (
            <div className="space-y-3">
              {/* Probability */}
              <div className="bg-white/80 backdrop-blur rounded-xl p-4 border-2 border-purple-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-purple-700">PROBABILIDADE DE FECHAMENTO</span>
                  <span className="text-2xl font-bold text-purple-600">{closingProbability}%</span>
                </div>
                <div className="h-2 bg-purple-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                    style={{ width: `${closingProbability}%` }}
                  />
                </div>
              </div>

              {/* Factors */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                  <p className="text-xs font-semibold text-green-700 mb-1">✓ Positivos</p>
                  <ul className="text-xs text-green-600 space-y-0.5">
                    {(generatedMessage.probability_factors?.positivos || []).map((f, i) => (
                      <li key={i}>• {f}</li>
                    ))}
                  </ul>
                </div>
                <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                  <p className="text-xs font-semibold text-red-700 mb-1">⚠ Negativos</p>
                  <ul className="text-xs text-red-600 space-y-0.5">
                    {(generatedMessage.probability_factors?.negativos || []).map((f, i) => (
                      <li key={i}>• {f}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Message */}
              <div className="bg-white/80 backdrop-blur rounded-xl p-4 border-2 border-purple-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-purple-700 uppercase">{selectedMessageType}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedMessage.message);
                      alert('Mensagem copiada!');
                    }}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{generatedMessage.message}</p>
              </div>

              {/* Meta Info */}
              <div className="bg-indigo-50 rounded-lg p-3 border border-indigo-200">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-indigo-600 font-medium">Framework</p>
                    <p className="text-slate-700">{generatedMessage.framework_used}</p>
                  </div>
                  <div>
                    <p className="text-indigo-600 font-medium">Melhor Horário</p>
                    <p className="text-slate-700">{generatedMessage.best_timing}</p>
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-indigo-600 font-medium">Próximo Passo</p>
                  <p className="text-slate-700">{generatedMessage.recommended_next_step}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-2">
                {client.phone && (
                  <Button
                    size="sm"
                    onClick={() => window.open(`https://wa.me/${client.phone}?text=${encodeURIComponent(generatedMessage.message)}`, '_blank')}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <MessageSquare className="w-3 h-3 mr-1" />
                    WhatsApp
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setGeneratedMessage(null)}
                >
                  Nova Mensagem
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* 7. SUGESTÃO DE EQUIPAMENTO IA - Logo após mensagem contextual */}
        {client.equipment_suggestion && (
          <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-purple-700 mb-1">Sugestão de Equipamento IA</p>
                <p className="font-semibold text-slate-800 mb-1">{client.equipment_suggestion}</p>
                <p className="text-sm text-slate-600 mb-2">{client.equipment_suggestion_reason}</p>
                {client.equipment_suggestion_alternative && (
                  <p className="text-xs text-slate-500">
                    Alternativa: {client.equipment_suggestion_alternative}
                  </p>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* 8. GERADOR DE PROPOSTAS PERSONALIZADAS COM IA */}
        <ProposalGeneratorAI client={client} sales={sales} />

        {/* 9. ANÁLISE PREDITIVA DE CHURN */}
        <ChurnPredictionAnalyzer client={client} interactions={interactions} visits={visits} />

        {/* 10. ORQUESTRADOR DE FOLLOW-UPS DINÂMICOS */}
        <DynamicFollowUpOrchestrator client={client} interactions={interactions} sales={sales} />

        {/* 11. ANÁLISE DE MERCADO E NOTÍCIAS DO SETOR */}
        <MarketNewsAnalyzer client={client} />

        {/* 12. INTELIGÊNCIA COMPETITIVA - VERSÃO NOVA */}
        <MarketIntelligenceAnalyzer client={client} />

        {/* 12.5 ANÁLISE DE CONCORRENTES - MÓDULO NOVO */}
        <CompetitorAnalysisModule client={client} />

        {/* 12.7 GERADOR DE RELATÓRIOS - MÓDULO NOVO */}
        <MarketReportGenerator client={client} marketData={null} competitorData={null} />

        {/* PROCESSADOR INTELIGENTE - Email/WhatsApp/Ligação Auto - NOVO */}
        <SmartInteractionProcessor 
          client={client}
          onTasksCreated={() => queryClient.invalidateQueries(['client-tasks', clientId])}
        />

        {/* MOTOR DE AUTOMAÇÃO IA - Follow-ups + Material + Churn - NOVO */}
        <AIAutomationEngine 
          client={client} 
          onTaskCreated={() => queryClient.invalidateQueries(['client-tasks', clientId])}
        />

        {/* RASTREAMENTO DE ENGAJAMENTO - NOVO */}
        <EngagementTracker clientId={clientId} />

        {/* ANÁLISE PREDITIVA COMPLETA - LTV, CHURN, OPORTUNIDADES - NOVO */}
        <PredictiveAnalyticsDashboard client={client} />

        {/* INTELIGÊNCIA DE MERCADO CONTEXTUAL - NOVO */}
        <MarketContextualIntelligence client={client} />

        {/* ALERTAS DE TENDÊNCIAS DE MERCADO - NOVO */}
        <MarketTrendsAlerts 
          clientSegment={client.ai_segment}
          equipmentInterest={client.equipment_interest}
        />

        {/* GERADOR DE CONTEÚDO PERSONALIZADO - NOVO */}
        <AIContentPersonalizer contact={client} />

        {/* 13. ANÁLISE REGIONAL ULTRA-PROFUNDA */}
        <UltraDeepMarketIntelligence 
          client={client}
          onUpdate={(updates) => {
            queryClient.invalidateQueries(['client', clientId]);
          }}
        />

        {/* 14. ESTRATÉGIA DE VENDA PERSONALIZADA */}
        <PersonalizedMarketApproach client={client} interactions={interactions} />

        {/* 15. GERADOR DE 3 PROPOSTAS COM IA */}
        <MultiProposalGeneratorAI client={client} />

        {/* 16. PACOTE WHATSAPP COM PROPOSTA + VÍDEOS + IMAGENS */}
        <WhatsAppProposalPackage client={client} />

        {/* 17. PIPELINE ASSISTANT - movido para cima */}
        <PipelineAIAssistant 
          client={client}
          interactions={interactions}
          visits={visits}
          sales={sales}
        />

        {/* Análise de Capitalização IA */}
        <CapitalAnalysisAI 
          client={client}
          onAnalysisComplete={(updates) => {
            updateMutation.mutate(updates);
          }}
        />

        {/* Primori - Análise Preditiva Avançada */}
        <PrimoriAdvancedAnalytics 
          client={client}
          visits={visits}
          interactions={interactions}
          sales={sales}
        />

        {/* Análise Probabilística com Dados */}
        <ProbabilityAnalysisAI client={client} />

        {/* Numerologia - Melhor Dia */}
        <NumerologyBestDayAI client={client} />

        {/* Análise de Concorrentes */}
        <CompetitorAnalysisAI client={client} />

        {/* Client Health Score */}
        <ClientHealthScore client={client} />

        {/* AI Follow-Up Sequence Generator */}
        <AIFollowUpGenerator client={client} />

        {/* Pipeline Action Recommender - IA que sugere ações específicas */}
        <PipelineActionRecommender client={client} />

        {/* Sales Coaching Analyzer - Análise de conversas */}
        <SalesCoachingAnalyzer client={client} />

        {/* Google Slides - Análise de Concorrentes */}
        <GoogleSlidesCompetitorAnalysis client={client} />

        {/* Notion - Documentação de Estratégias */}
        <NotionStrategyDocumentation client={client} />

        {/* Salesforce - Criar Oportunidade */}
        <SalesforceOpportunitySync client={client} />

        {/* Análise Avançada IA - Resumo, Sentimento, Churn, Retenção */}
        <AdvancedClientAnalytics 
          client={client}
          interactions={interactions}
          visits={visits}
          sales={sales}
        />

        {/* Automação IA - Próximo Passo, Follow-up, Agendamento */}
        <NextStepAI 
          client={client}
          interactions={interactions}
          visits={visits}
          sales={sales}
        />

        <AutoFollowUpGenerator 
          client={client}
          lastInteraction={interactions[0]}
        />

        <SmartScheduler 
          client={client}
          visits={visits}
        />

        {/* Clínicas Próximas - Google Maps + Redes Sociais + Eventos */}
        <NearbyClinicsFinder client={client} />

        {/* AI Interaction Insights - Análise de Sentimento + Auto-Categorização */}
        <InteractionInsightsAI clientId={clientId} interactions={interactions} />

        {/* Auto Data Enrichment - Redes Sociais, CNPJ, Website */}
        <AutoDataEnrichment client={client} />

        {/* Auto Product Recommender - Recomendação Inteligente */}
        <AutoProductRecommender client={client} />

        {/* Predictive Analytics - LTV + Churn Risk */}
        <PredictiveAnalyticsEngine 
          client={client}
          interactions={interactions}
          sales={sales}
          visits={visits}
        />

        {/* AI Next Best Action */}
        <AINextBestAction 
          client={client}
          interactions={interactions}
          sales={sales}
          visits={visits}
        />

        {/* Smart Client Summary */}
        <SmartClientSummary 
          client={client}
          interactions={interactions}
          sales={sales}
          visits={visits}
        />

        {/* Auto Task Creator */}
        <AutoTaskCreator clientId={clientId} />

        {/* Sales Funnel Predictive Analysis */}
        <SalesFunnelPredictiveAnalysis 
          client={client}
          interactions={interactions}
          sales={sales}
          visits={visits}
        />

        {/* Personalized Upsell Engine */}
        <PersonalizedUpsellEngine 
          client={client}
          sales={sales}
        />

        {/* Sales Knowledge Base */}
        <SalesKnowledgeBase client={client} />

        {/* Email de Acompanhamento Automático */}
        <AutoFollowUpEmailGenerator 
          client={client}
          interactions={interactions}
          sales={sales}
        />

        {/* Assistente de Vendas Proativo */}
        <ProactiveAISalesAssistant 
          client={client}
          interactions={interactions}
          visits={visits}
          sales={sales}
        />

        {/* 🔮 ANÁLISE NUMEROLÓGICA PROFUNDA + GATILHOS */}
        <NumerologyDeepAnalysis client={client} />

        {/* 🗺️ MAPEAMENTO DA JORNADA DO CLIENTE */}
        <ClientJourneyMapper client={client} />

        {/* 🤖 ASSISTENTE IA INTEGRADO */}
        <IntegratedAISalesAssistant client={client} />

        {/* 🎯 MATCH PERFEITO DE PRODUTO SEAMATY */}
        <SeamatyProductMatcher client={client} />

        {/* 🧠 ESTRATÉGIA DEFINITIVA - 30+ LIVROS + ESTUDOS CIENTÍFICOS */}
        <UltimateSalesStrategyAI client={client} />

        {/* 11. GATILHOS E QUALIFICAÇÃO - Logo após numerologia */}
        <FunnelPersuasionTriggers client={client} />

        {/* Controle de Objeções por Perfil */}
        <ObjectionHandlingByProfile client={client} />

        {/* Kit de Vendas de Equipamento */}
        <Card className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              Material de Vendas Seamaty
            </h3>
          </div>
          <p className="text-sm text-slate-700 mb-3">
            Acesse frases de efeito, gatilhos de persuasão, casos clínicos e templates prontos para cada equipamento.
          </p>
          <Button
            onClick={() => navigate(createPageUrl('EquipmentSalesCenter'))}
            className="w-full bg-orange-600 hover:bg-orange-700"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Abrir Central de Equipamentos
          </Button>
        </Card>

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
              {client.available_budget ? `R$ ${Number(client.available_budget).toLocaleString('pt-BR')}` : 'Não informado'}
            </p>
            {client.valor_real_poder_compra && (
              <p className="text-xs text-emerald-600 mt-1">
                ✓ Poder real: R$ {Number(client.valor_real_poder_compra).toLocaleString('pt-BR')}
              </p>
            )}
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

        {/* WhatsApp Conversation View */}
        {client.phone && (
          <WhatsAppConversationView 
            clientId={client.id}
            clientName={client.first_name}
            clientPhone={client.phone}
          />
        )}

        {/* Score Dinâmico */}
        <DynamicPurchasePropensityScore 
          client={client}
          interactions={interactions}
          visits={visits}
          sales={sales}
        />

        {/* Score Original */}
        <Card className="p-5 bg-white shadow-md border-none">
          <ScoreBar score={client.purchase_score || 50} />
        </Card>

        {/* Equipment Manager */}
        <ClientEquipmentManager clientId={client.id} clientName={client.first_name} />

        {/* Consumable Analytics */}
        <ClientConsumableAnalytics clientId={client.id} clientName={client.first_name} />

        {/* Análise de Vendas de Insumos */}
        <ConsumableSalesAnalytics clientId={client.id} />

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



        {/* Tabs: Interações, Tarefas, Documentos, Timeline, Possível Venda */}
        <Tabs defaultValue="possible-sale" className="w-full">
          <TabsList className="grid w-full grid-cols-5" data-tutorial="interactions">
            <TabsTrigger value="possible-sale">
              Possível Venda
            </TabsTrigger>
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

          {/* Possível Venda */}
          <TabsContent value="possible-sale" className="space-y-4 mt-4">
            <Card className="p-3 bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200">
              <div className="space-y-2 text-sm">
                <div className="p-2 bg-white rounded-lg">
                  <p className="text-xs text-slate-500">Status</p>
                  <p className="text-sm font-semibold text-slate-800">
                    {isClient ? '✓ Cliente' : '🎯 Potencial'}
                  </p>
                </div>

                {!isClient && (
                  <div className="p-2 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs text-blue-600">
                      Status muda após primeira venda fechada
                    </p>
                  </div>
                )}

                {isClient && sales.filter(s => s.status === 'fechada').length > 0 && (
                  <div className="p-2 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-xs text-green-700 font-medium">✓ Vendas</p>
                    {sales.filter(s => s.status === 'fechada').map((sale, idx) => (
                      <p key={idx} className="text-xs text-green-600">
                        {sale.equipment_name} - R$ {sale.sale_value?.toLocaleString('pt-BR')}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            {/* Dados do Cliente Editáveis */}
            <ClientDataEditor clientId={client.id} client={client} />

            {/* Relatório PDF de Visitas */}
            <VisitReportPDF client={client} visitHistory={client.visit_history || []} />
          </TabsContent>

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

          {/* Team Chat */}
          <TeamChat 
          contextType="client" 
          contextId={clientId} 
          contextName={client.first_name}
          compact={true}
          />



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

          {/* Post Visit Dialog */}
          <PostVisitDialog
            client={client}
            visitId={selectedVisitId}
            open={postVisitOpen}
            onOpenChange={setPostVisitOpen}
          />
          </div>
          );
          }
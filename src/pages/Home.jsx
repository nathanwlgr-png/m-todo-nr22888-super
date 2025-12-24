import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from 'sonner';
import { 
  UserPlus, 
  Users, 
  Sparkles,
  TrendingUp,
  ThermometerSun,
  MapPin,
  DollarSign,
  Target,
  Calendar,
  Search,
  FileText,
  Mic,
  Settings,
  Play,
  Database,
  Send,
  WifiOff,
  Package,
  AlertCircle,
  RotateCcw,
  Download
} from 'lucide-react';
import ClientCard from '@/components/ClientCard';
import StatusPieChart from '@/components/dashboard/StatusPieChart.jsx';
import RevenueChart from '@/components/dashboard/RevenueChart.jsx';
import ClientsMap from '@/components/dashboard/ClientsMap.jsx';
import InteractiveSalesMap from '@/components/InteractiveSalesMap';
import GamificationWidget from '@/components/GamificationWidget';
import AutoTaskGenerator from '@/components/AutoTaskGenerator';
import PersonalGoalsWidget from '@/components/PersonalGoalsWidget';
import QuickTips from '@/components/onboarding/QuickTips';
import LabBrandCompetitorAnalysis from '@/components/LabBrandCompetitorAnalysis';
import FeatureTooltip from '@/components/onboarding/FeatureTooltip';
import SalesOverview from '@/components/SalesOverview';
import MonthlyInsightsReport from '@/components/MonthlyInsightsReport';
import VendedorPerformanceFeedback from '@/components/VendedorPerformanceFeedback';
import HotClientsDialog from '@/components/HotClientsDialog';
import ScheduledMessagesWidget from '@/components/ScheduledMessagesWidget';
import AutoReportGenerator from '@/components/AutoReportGenerator';
import AITaskManager from '@/components/AITaskManager';
import CRMExternalSync from '@/components/CRMExternalSync';
import VoiceCommandSystem from '@/components/VoiceCommandSystem';
import UniversalFileUploader from '@/components/UniversalFileUploader';
import AIConfigCenter from '@/components/AIConfigCenter';
import AdvancedAIHub from '@/components/AdvancedAIHub';
import AIRateLimitManager from '@/components/AIRateLimitManager';
import FloatingPerformanceMonitor from '@/components/FloatingPerformanceMonitor';
import WorkflowAutomationAI from '@/components/WorkflowAutomationAI';
import FloatingWhatsAppButton from '@/components/FloatingWhatsAppButton';
import LevelScoreSystem from '@/components/LevelScoreSystem';
import PowerBooster from '@/components/PowerBooster';
import HemogasReportGenerator from '@/components/HemogasReportGenerator';
import PredictiveAnalyticsAI from '@/components/PredictiveAnalyticsAI';
import ProcessingSpeedMonitor from '@/components/ProcessingSpeedMonitor';
import DataExportButton from '@/components/DataExportButton';
import ThreeDXSalesMaterial from '@/components/3DXSalesMaterial';
import PersonalizedContentGenerator from '@/components/PersonalizedContentGenerator';
import AdvancedSalesIntelligence from '@/components/AdvancedSalesIntelligence';
import OfflinePackGenerator from '@/components/OfflinePackGenerator';
import CompanionAnimalLabGuide from '@/components/CompanionAnimalLabGuide';
import AIErrorCorrectionSystem from '@/components/AIErrorCorrectionSystem';
import FloatingTechnicalMaterial from '@/components/FloatingTechnicalMaterial';
import PipelineOptimizationAI from '@/components/PipelineOptimizationAI';
import DashboardPerformanceAI from '@/components/DashboardPerformanceAI';
import CompletePDFManual from '@/components/CompletePDFManual';
import ExportAllReports from '@/components/ExportAllReports';
import QuickToolsPanel from '@/components/QuickToolsPanel';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, X } from 'lucide-react';
import DocumentMonitorAI from '@/components/DocumentMonitorAI';
import SystemManualPDF from '@/components/SystemManualPDF';
import MarketAnalysisAI from '@/components/MarketAnalysisAI';
import ClientDataImporter from '@/components/ClientDataImporter';
import ProfessionalContractGenerator from '@/components/ProfessionalContractGenerator';
import SystemDocumentation from '@/components/SystemDocumentation';
import ClientProfileGenerator from '@/components/ClientProfileGenerator';
import AITokenCounter from '@/components/AITokenCounter';
import MariliaMarketAnalysis from '@/components/MariliaMarketAnalysis';
import FloatingButtonsGroup from '@/components/FloatingButtonsGroup';
import CompleteCaseStudyReport from '@/components/CompleteCaseStudyReport';
import SmartSalesFlowOptimizer from '@/components/SmartSalesFlowOptimizer';
import AIReportingHub from '@/components/AIReportingHub';
import ScientificResearchAI from '@/components/ScientificResearchAI';
import EquineBloodGasResearch from '@/components/EquineBloodGasResearch';
import FoalSynovialFluidResearch from '@/components/FoalSynovialFluidResearch';

import RegionalClinicDiscovery from '@/components/RegionalClinicDiscovery';
import BulkClientProfileGenerator from '@/components/BulkClientProfileGenerator';
import NatashaProfile from '@/components/NatashaProfile';
import ClientDataValidator from '@/components/ClientDataValidator';
import DeepClientAnalytics from '@/components/DeepClientAnalytics';
import ClientSegmentation from '@/components/ClientSegmentation';
import ClientJourneyMap from '@/components/ClientJourneyMap';
import RiskScoringSystem from '@/components/RiskScoringSystem';
import PlatoAI from '@/components/PlatoAI';
import NatashaDietPlan from '@/components/NatashaDietPlan';

export default function Home() {
  const [hotClientsOpen, setHotClientsOpen] = React.useState(false);
  const [selectedStatus, setSelectedStatus] = React.useState('quente');
  const [syncingOffline, setSyncingOffline] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [cityFilter, setCityFilter] = React.useState('all');
  const [scoreFilter, setScoreFilter] = React.useState('all');
  const [showFilters, setShowFilters] = React.useState(false);

  const { data: clients = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      try {
        const data = await base44.entities.Client.list('-updated_date', 100);
        return data.filter(c => c && c.id && c.first_name && !c.is_deleted);
      } catch (error) {
        console.error('Erro ao carregar clientes:', error);
        // Não mostrar toast para erros de clientes deletados
        if (!error.message?.includes('not found')) {
          toast.error('Erro de conexão ao carregar dados');
        }
        return []; // Retorna array vazio em vez de throw
      }
    },
    retry: 2,
    retryDelay: 1000,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: 60 * 60 * 1000,
    gcTime: 60 * 60 * 1000
  });

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const handleSyncOfflineData = async () => {
    setSyncingOffline(true);
    try {
      // Envia resumo dos dados atualizados para o WhatsApp configurado
      const summary = `📊 *Sync Manual - ${new Date().toLocaleString('pt-BR')}*\n\n` +
        `✅ Total de clientes: ${clients.length}\n` +
        `🔥 Quentes: ${clients.filter(c => c.status === 'quente').length}\n` +
        `🌡️ Mornos: ${clients.filter(c => c.status === 'morno').length}\n` +
        `❄️ Frios: ${clients.filter(c => c.status === 'frio').length}\n\n` +
        `✓ Dados sincronizados com sucesso!`;

      if (user?.whatsapp_number) {
        // Copia mensagem para área de transferência e abre WhatsApp
        await navigator.clipboard.writeText(summary);
        window.open(`https://wa.me/${user.whatsapp_number}?text=${encodeURIComponent(summary)}`, '_blank');
        toast.success('Mensagem copiada! Encaminhe para seu WhatsApp');
      } else {
        toast.error('Configure seu WhatsApp em Configurações primeiro');
      }
    } catch (error) {
      toast.error('Erro ao sincronizar dados');
    } finally {
      setSyncingOffline(false);
    }
  };

  const metrics = useMemo(() => {
    const hotClients = clients.filter(c => c.status === 'quente').length;
    const warmClients = clients.filter(c => c.status === 'morno').length;
    const coldClients = clients.filter(c => c.status === 'frio').length;
    
    const totalRevenue = clients.reduce((sum, c) => sum + (c.projected_revenue || 0), 0);
    const avgScore = clients.length > 0 
      ? Math.round(clients.reduce((sum, c) => sum + (c.purchase_score || 0), 0) / clients.length)
      : 0;

    return {
      total: clients.length,
      hot: hotClients,
      warm: warmClients,
      cold: coldClients,
      totalRevenue,
      avgScore
    };
    }, [clients]);

    // Lista única de cidades
    const cities = useMemo(() => {
      const unique = [...new Set(clients.map(c => c.city).filter(Boolean))];
      return unique.sort();
    }, [clients]);

    const filteredClients = useMemo(() => {
      return clients
        .filter(c => {
          const matchesSearch = !searchTerm || 
            c.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.clinic_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.city?.toLowerCase().includes(searchTerm.toLowerCase());

          const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
          
          const matchesCity = cityFilter === 'all' || c.city === cityFilter;
          
          let matchesScore = true;
          if (scoreFilter !== 'all') {
            const score = c.purchase_score || 0;
            if (scoreFilter === 'high') matchesScore = score >= 70;
            else if (scoreFilter === 'medium') matchesScore = score >= 40 && score < 70;
            else if (scoreFilter === 'low') matchesScore = score < 40;
          }

          return matchesSearch && matchesStatus && matchesCity && matchesScore;
        })
        .sort((a, b) => {
          // Ordenar por cidade primeiro, depois por nome
          const cityCompare = (a.city || '').localeCompare(b.city || '', 'pt-BR');
          if (cityCompare !== 0) return cityCompare;
          return (a.first_name || '').localeCompare(b.first_name || '', 'pt-BR');
        });
    }, [clients, searchTerm, statusFilter, cityFilter, scoreFilter]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Auto Task Generator - Background Process */}
      <AutoTaskGenerator />

      {/* Voice Command System */}
      <div className="px-6 mt-4">
        <VoiceCommandSystem />
      </div>

      {/* Rate Limit Warning */}
      <div className="px-6 mt-4">
        <AIRateLimitManager />
      </div>
      
      {/* Header Fixo */}
      <div className="sticky top-0 z-40 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-3 py-1.5 shadow-lg border-b border-orange-500">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 flex items-center justify-center shadow-xl relative">
            <span className="text-white font-black text-xs z-10">NR</span>
            <span className="absolute -bottom-0.5 -right-0.5 bg-orange-500 text-white text-[7px] font-bold px-0.5 rounded">22</span>
          </div>
          <div className="flex-1">
            <h1 className="text-xs font-black text-white tracking-tight">Método NR22</h1>
            <div className="flex items-center gap-1.5">
              <span className="text-[7px] text-orange-400 font-semibold">CRM Automático</span>
              <span className="text-[7px] text-slate-400">•</span>
              <span className="text-[7px] text-blue-400 font-semibold">IA Adversary</span>
              <span className="text-[7px] text-slate-400">•</span>
              <span className="text-[7px] text-purple-400 font-semibold">Magnétic Tools</span>
            </div>
          </div>
          
          {/* Botões em formato de 8 */}
          <FloatingButtonsGroup />

          <Link to={createPageUrl('ContactSettings')}>
            <button className="w-7 h-7 rounded-lg glass hover:bg-white/10 transition-all">
              <Settings className="w-3.5 h-3.5 text-orange-400 mx-auto" />
            </button>
          </Link>
          <Link to={createPageUrl('MyProfile')}>
            <button className="w-7 h-7 rounded-lg glass hover:bg-white/10 transition-all">
              <svg className="w-3.5 h-3.5 text-orange-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>
          </Link>
          <Link to={createPageUrl('RegionalSearch')}>
            <button className="w-7 h-7 rounded-lg glass hover:bg-white/10 transition-all">
              <Search className="w-3.5 h-3.5 text-orange-400 mx-auto" />
            </button>
          </Link>
        </div>
      </div>

      {/* Network Error Alert */}
      {isError && (
        <div className="px-6 mt-4">
          <Card className="p-4 bg-red-50 border-red-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="font-semibold text-red-800">Erro de Conexão</p>
                  <p className="text-sm text-red-600">Não foi possível carregar os dados</p>
                </div>
              </div>
              <Button
                onClick={() => refetch()}
                size="sm"
                className="bg-red-600 hover:bg-red-700"
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                Tentar Novamente
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Busca e Filtros */}
      <div className="px-6 mt-4">
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar clientes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 rounded-xl border-2"
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2">
            <Button
              size="sm"
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('all')}
              className="rounded-full whitespace-nowrap"
            >
              Todos ({clients.length})
            </Button>
            <Button
              size="sm"
              variant={statusFilter === 'quente' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('quente')}
              className="rounded-full whitespace-nowrap bg-red-500 hover:bg-red-600 text-white"
            >
              🔥 Quentes ({metrics.hot})
            </Button>
            <Button
              size="sm"
              variant={statusFilter === 'morno' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('morno')}
              className="rounded-full whitespace-nowrap bg-orange-500 hover:bg-orange-600 text-white"
            >
              🌡️ Mornos ({metrics.warm})
            </Button>
            <Button
              size="sm"
              variant={statusFilter === 'frio' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('frio')}
              className="rounded-full whitespace-nowrap bg-blue-500 hover:bg-blue-600 text-white"
            >
              ❄️ Frios ({metrics.cold})
            </Button>
          </div>

          {/* Advanced Filters Toggle */}
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="w-full border-2 border-slate-200 hover:bg-slate-50 h-11 rounded-xl"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtros Avançados
            {(cityFilter !== 'all' || scoreFilter !== 'all') && (
              <span className="ml-2 bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full">
                {[cityFilter !== 'all', scoreFilter !== 'all'].filter(Boolean).length}
              </span>
            )}
          </Button>

          {showFilters && (
            <div className="space-y-3 p-4 bg-gradient-to-br from-slate-50 to-indigo-50 rounded-xl border-2 border-indigo-200 shadow-sm">
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-2 block">Cidade</label>
                <Select value={cityFilter} onValueChange={setCityFilter}>
                  <SelectTrigger className="h-11 border-2 rounded-lg">
                    <SelectValue placeholder="Todas as cidades" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as cidades</SelectItem>
                    {cities.map((city) => (
                      <SelectItem key={city} value={city}>
                        📍 {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 mb-2 block">Score de Compra</label>
                <Select value={scoreFilter} onValueChange={setScoreFilter}>
                  <SelectTrigger className="h-11 border-2 rounded-lg">
                    <SelectValue placeholder="Todos os scores" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os scores</SelectItem>
                    <SelectItem value="high">⭐ Alto (70-100)</SelectItem>
                    <SelectItem value="medium">📊 Médio (40-69)</SelectItem>
                    <SelectItem value="low">📉 Baixo (0-39)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                variant="ghost"
                onClick={() => {
                  setCityFilter('all');
                  setScoreFilter('all');
                }}
                className="w-full text-sm hover:bg-white/50"
              >
                <X className="w-4 h-4 mr-2" />
                Limpar Filtros
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Contador de Tokens IA */}
      <div className="px-6 mt-4">
        <AITokenCounter />
      </div>

      {/* Quick Stats */}
      <div className="px-6 mt-4">
        {/* Sales Overview */}
        <div className="mb-6">
          <SalesOverview />
        </div>

        {/* Smart Sales Flow Optimizer */}
        <div className="mb-6">
          <SmartSalesFlowOptimizer />
        </div>

        <div className="grid grid-cols-2 gap-3 dashboard-metrics">
          <Card className="p-4 bg-white shadow-lg border-none">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                <Users className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{metrics.total}</p>
                <p className="text-xs text-slate-500">Clientes Cadastrados</p>
              </div>
            </div>
          </Card>
          
          <Card 
            className="p-4 bg-white shadow-lg border-none cursor-pointer hover:bg-red-50 transition-all"
            onClick={() => {
              setSelectedStatus('quente');
              setHotClientsOpen(true);
            }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <ThermometerSun className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{metrics.hot}</p>
                <p className="text-xs text-slate-500">Quentes</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 bg-white shadow-lg border-none">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-800">
                  R$ {(metrics.totalRevenue / 1000).toFixed(0)}k
                </p>
                <p className="text-xs text-slate-500">Pipeline</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 bg-white shadow-lg border-none">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <Target className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{metrics.avgScore}%</p>
                <p className="text-xs text-slate-500">Score Médio</p>
              </div>
            </div>
          </Card>
        </div>
      </div>



      {/* Dashboard Charts */}
      <div className="px-6 mt-6 space-y-4">
        {/* Status Distribution */}
        <Card className="p-4 bg-white shadow-md border-none">
          <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <ThermometerSun className="w-4 h-4" />
            Distribuição por Status
          </h3>
          <StatusPieChart 
            hot={metrics.hot} 
            warm={metrics.warm} 
            cold={metrics.cold} 
          />
        </Card>

        {/* Revenue by Status */}
        <Card className="p-4 bg-white shadow-md border-none">
          <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Receita por Status
          </h3>
          <RevenueChart clients={clients} />
        </Card>

        {/* Map */}
        <Card className="p-4 bg-white shadow-md border-none">
          <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Distribuição Geográfica
          </h3>
          <ClientsMap clients={clients} />
        </Card>
      </div>



      {/* Personal Goals Widget */}
      <div className="px-6 mt-6">
        <PersonalGoalsWidget />
      </div>

      {/* Performance Feedback */}
      <div className="px-6 mt-6">
        <VendedorPerformanceFeedback />
      </div>

      {/* Mensagens Estruturadas */}
      <div className="px-6 mt-6">
        <ScheduledMessagesWidget />
      </div>

      {/* Modo Offline N */}
      <div className="px-6 mt-6">
        <OfflinePackGenerator />
      </div>

      {/* Validação de Dados dos Clientes */}
      <div className="px-6 mt-6">
        <ClientDataValidator />
      </div>

      {/* Sistema de Análise Profunda de Clientes */}
      <div className="px-6 mt-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-3 px-1">🎯 Análise Avançada de Clientes</h3>
        <div className="grid grid-cols-1 gap-3">
          <DeepClientAnalytics />
          <ClientSegmentation />
          <ClientJourneyMap />
          <RiskScoringSystem />
        </div>
      </div>

      {/* Perfil Específico: Natasha Rosa */}
      <div className="px-6 mt-6">
        <NatashaProfile />
      </div>

      {/* Plano de Dieta e Treino - Natasha */}
      <div className="px-6 mt-6">
        <NatashaDietPlan />
      </div>

      {/* Pesquisa Científica Veterinária */}
      <div className="px-6 mt-6">
        <ScientificResearchAI />
      </div>

      {/* Pesquisa Hemogasometria Equina */}
      <div className="px-6 mt-6">
        <EquineBloodGasResearch />
      </div>

      {/* Pesquisa 8 Artigos Potros */}
      <div className="px-6 mt-6">
        <FoalSynovialFluidResearch />
      </div>

      {/* Descobrir Clínicas Novas na Região */}
      <div className="px-6 mt-6">
        <RegionalClinicDiscovery />
      </div>

      {/* Geração em Massa de Perfis Completos */}
      <div className="px-6 mt-6">
        <BulkClientProfileGenerator />
      </div>

      {/* AI Reporting Hub */}
      <div className="px-6 mt-6">
        <AIReportingHub />
      </div>

      {/* CRM + Gestão IA Unificado */}
      <div className="px-6 mt-6">
        <div className="grid grid-cols-1 gap-3">
          <ExportAllReports />
          <CompletePDFManual />
          <CRMExternalSync />
          <AITaskManager />
          <AutoReportGenerator />
          <PersonalizedContentGenerator />
          <AdvancedSalesIntelligence />
        </div>
      </div>

      {/* Hub de IAs Unificado */}
      <div className="px-6 mt-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-3 px-1">🤖 Central de IAs</h3>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <HemogasReportGenerator />
          <ProcessingSpeedMonitor />
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <PredictiveAnalyticsAI />
          <DataExportButton />
        </div>
        <div className="grid grid-cols-1 gap-3">
          <CompanionAnimalLabGuide />
        </div>
      </div>

      {/* IAs de Otimização */}
      <div className="px-6 mt-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-3 px-1">⚡ Otimização Avançada</h3>
        <div className="grid grid-cols-2 gap-3">
          <PipelineOptimizationAI />
          <DashboardPerformanceAI />
        </div>
      </div>

      {/* Botão Flutuante Material Técnico */}
      <FloatingTechnicalMaterial />

      {/* Material de Vendas 3DX */}
      <div className="px-6 mt-6">
        <ThreeDXSalesMaterial />
      </div>

      {/* Workflow Automation AI */}
      <div className="px-6 mt-6">
        <WorkflowAutomationAI />
      </div>

      {/* Level Score System */}
      <div className="px-6 mt-6">
        <div className="grid grid-cols-2 gap-3">
          <LevelScoreSystem />
          <PowerBooster />
        </div>
      </div>

      {/* Floating Buttons */}
      <FloatingPerformanceMonitor />
      <FloatingWhatsAppButton />
      <PlatoAI />





      {/* Main Actions */}
      <div className="px-6 mt-6 space-y-4">
        {/* Export Data Button */}
        <Button
          onClick={async () => {
            const citiesCount = clients.reduce((acc, c) => {
              const city = c.city || 'Sem cidade';
              acc[city] = (acc[city] || 0) + 1;
              return acc;
            }, {});
            
            const citiesList = Object.entries(citiesCount)
              .map(([city, count]) => `• ${city}: ${count}`)
              .join('\n');
            
            const summary = `📊 Exportação CRM - ${new Date().toLocaleString('pt-BR')}\n\n` +
              `✅ Total de clientes: ${clients.length}\n` +
              `🔥 Quentes: ${metrics.hot}\n` +
              `🌡️ Mornos: ${metrics.warm}\n` +
              `❄️ Frios: ${metrics.cold}\n\n` +
              `💰 Pipeline Total: R$ ${(metrics.totalRevenue / 1000).toFixed(0)}k\n` +
              `📈 Score Médio: ${metrics.avgScore}%\n\n` +
              `Clientes por Cidade:\n${citiesList}`;
            
            await navigator.clipboard.writeText(summary);
            toast.success('Dados copiados! Cole no WhatsApp Web');
          }}
          className="w-full h-14 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-xl text-base font-semibold shadow-lg"
        >
          <Download className="w-5 h-5 mr-2" />
          Exportar Dados (Copiar)
        </Button>

        {/* Sync Offline Button */}
        <Button
          onClick={handleSyncOfflineData}
          disabled={syncingOffline}
          className="w-full h-14 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl text-base font-semibold shadow-lg"
        >
          {syncingOffline ? (
            <>Enviando...</>
          ) : (
            <>
              <Send className="w-5 h-5 mr-2" />
              Enviar Dados Atualizados (WhatsApp)
            </>
          )}
        </Button>

        <div className="grid grid-cols-2 gap-3">
          <Link to={createPageUrl('VoiceClientScanner')}>
            <Button className="w-full h-16 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-2xl text-base font-semibold shadow-lg shadow-purple-500/30">
              <Mic className="w-5 h-5 mr-2" />
              Scanner IA Voz
            </Button>
          </Link>
          <Link to={createPageUrl('NewClient')}>
            <Button className="w-full h-16 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 rounded-2xl text-base font-semibold shadow-lg shadow-orange-500/30">
              <UserPlus className="w-5 h-5 mr-2" />
              Novo Cliente
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Link to={createPageUrl('ImportClientsTable')}>
            <Button variant="outline" className="w-full h-14 rounded-xl border-2 hover:bg-slate-50 border-purple-200 text-purple-700">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Importar Tabela
            </Button>
          </Link>

          <Link to={createPageUrl('Clients')}>
            <Button variant="outline" className="w-full h-14 rounded-xl border-2 hover:bg-slate-50">
              <Users className="w-4 h-4 mr-2" />
              Todos os Clientes
            </Button>
          </Link>
          
          <Link to={createPageUrl('ClientsByCity')}>
            <Button variant="outline" className="w-full h-14 rounded-xl border-2 hover:bg-slate-50">
              <MapPin className="w-4 h-4 mr-2" />
              Por Cidade
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Link to={createPageUrl('ClientsMap')}>
            <Button variant="outline" className="w-full h-14 rounded-xl border-2 hover:bg-slate-50 border-indigo-200 text-indigo-700">
              <MapPin className="w-4 h-4 mr-2" />
              Mapa de Clientes
            </Button>
          </Link>

          <Link to={createPageUrl('ScheduledAgenda')}>
            <Button variant="outline" className="w-full h-14 rounded-xl border-2 hover:bg-slate-50 border-purple-200 text-purple-700">
              <Calendar className="w-4 h-4 mr-2" />
              Agenda Programada
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Link to={createPageUrl('TaskCalendar')}>
            <Button variant="outline" className="w-full h-14 rounded-xl border-2 hover:bg-slate-50">
              <Calendar className="w-4 h-4 mr-2" />
              Calendário
            </Button>
          </Link>

          <Link to={createPageUrl('Tasks')}>
            <Button variant="outline" className="w-full h-14 rounded-xl border-2 hover:bg-slate-50">
              <Target className="w-4 h-4 mr-2" />
              Tarefas
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Link to={createPageUrl('VisitPlanner')}>
            <Button variant="outline" className="w-full h-14 rounded-xl border-2 hover:bg-slate-50 border-purple-200 text-purple-700">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              Rotas
            </Button>
          </Link>
          <Link to={createPageUrl('MonthlyVisitPlanner')}>
            <Button variant="outline" className="w-full h-14 rounded-xl border-2 hover:bg-slate-50 border-indigo-200 text-indigo-700">
              <Calendar className="w-4 h-4 mr-2" />
              Janeiro 2026
            </Button>
          </Link>
        </div>

        <Link to={createPageUrl('SalesAnalytics')}>
          <Button variant="outline" className="w-full h-14 rounded-xl border-2 hover:bg-slate-50 border-indigo-200 text-indigo-700">
            <TrendingUp className="w-4 h-4 mr-2" />
            Dashboard de Vendas
          </Button>
        </Link>

        <Link to={createPageUrl('TaskAutomation')}>
          <Button variant="outline" className="w-full h-14 rounded-xl border-2 hover:bg-slate-50 border-purple-200 text-purple-700">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Automação de Tarefas
          </Button>
        </Link>

        <Link to={createPageUrl('CampaignDemo')}>
          <Button variant="outline" className="w-full h-14 rounded-xl border-2 hover:bg-slate-50 border-green-200 text-green-700">
            <Play className="w-4 h-4 mr-2" />
            Ver Demo Campanha
          </Button>
        </Link>

        <div className="grid grid-cols-2 gap-4">
          <Link to={createPageUrl('PerformanceDashboard')}>
            <Button variant="outline" className="w-full h-14 rounded-xl border-2 hover:bg-slate-50 border-purple-200 text-purple-700">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Performance
            </Button>
          </Link>
          <Link to={createPageUrl('MarketIntelligence')}>
            <Button variant="outline" className="w-full h-14 rounded-xl border-2 hover:bg-slate-50 border-blue-200 text-blue-700">
              <Search className="w-4 h-4 mr-2" />
              Análise Mercado
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Link to={createPageUrl('SalesFunnel')}>
            <Button variant="outline" className="w-full h-14 rounded-xl border-2 hover:bg-slate-50 border-indigo-200 text-indigo-700">
              <Target className="w-4 h-4 mr-2" />
              Funil
            </Button>
          </Link>

          <Link to={createPageUrl('AdvancedReports')}>
            <Button variant="outline" className="w-full h-14 rounded-xl border-2 hover:bg-slate-50 border-blue-200 text-blue-700">
              <TrendingUp className="w-4 h-4 mr-2" />
              Relatórios IA
            </Button>
          </Link>

          <Link to={createPageUrl('SystemAudit')}>
            <Button variant="outline" className="w-full h-14 rounded-xl border-2 hover:bg-slate-50 border-red-200 text-red-700">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              Auditoria Sistema
            </Button>
          </Link>

          <div className="grid grid-cols-2 gap-4">
            <Link to={createPageUrl('AdvancedSalesReports')}>
              <Button variant="outline" className="w-full h-14 rounded-xl border-2 hover:bg-slate-50 border-purple-200 text-purple-700">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Análise Avançada
              </Button>
            </Link>

            <Link to={createPageUrl('Campaigns')}>
              <Button variant="outline" className="w-full h-14 rounded-xl border-2 hover:bg-slate-50 border-purple-200 text-purple-700">
                <Target className="w-4 h-4 mr-2" />
                Campanhas
              </Button>
            </Link>

            <Link to={createPageUrl('OfflineMode')}>
              <Button variant="outline" className="w-full h-14 rounded-xl border-2 hover:bg-slate-50 border-blue-200 text-blue-700">
                <Database className="w-4 h-4 mr-2" />
                Modo Offline
              </Button>
            </Link>
              </div>

            {/* Ferramentas Rápidas */}
            <QuickToolsPanel />

            {/* IA Monitor de Documentos */}
            <DocumentMonitorAI />

            {/* Manual do Sistema PDF */}
            <SystemManualPDF />

            {/* Documentação Técnica Completa */}
            <div className="mt-6">
              <SystemDocumentation />
            </div>

            {/* Importador de Planilha com IA */}
            <div className="mt-6">
              <ClientDataImporter />
            </div>

            {/* Gerador de Perfil Completo (Rodrigo Sávio Mavetto) */}
            <div className="mt-6">
              <ClientProfileGenerator />
            </div>

            {/* Gerador de Contrato Oficial COMPET */}
            <div className="mt-6">
              <ProfessionalContractGenerator />
            </div>

            {/* Relatórios Completos de Caso com Jornada */}
            <div className="mt-6">
              <CompleteCaseStudyReport />
            </div>

            {/* Análise de Mercado - Marília */}
            <div className="mt-6">
              <MariliaMarketAnalysis />
            </div>

            {/* Análise de Mercado com GPS + IBGE */}
            <div className="mt-6">
              <MarketAnalysisAI />
            </div>

          <div className="grid grid-cols-2 gap-4">
            <Link to={createPageUrl('RevenueForecastPage')}>
              <Button variant="outline" className="w-full h-14 rounded-xl border-2 hover:bg-slate-50 border-green-200 text-green-700">
                <DollarSign className="w-4 h-4 mr-2" />
                Previsão de Receita
              </Button>
            </Link>

            <Link to={createPageUrl('ClosingForecast')}>
              <Button variant="outline" className="w-full h-14 rounded-xl border-2 hover:bg-slate-50 border-purple-200 text-purple-700">
                <Sparkles className="w-4 h-4 mr-2" />
                Previsão IA
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Link to={createPageUrl('Leaderboard')}>
            <Button variant="outline" className="w-full h-14 rounded-xl border-2 hover:bg-slate-50 border-yellow-200 text-yellow-700">
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
              </svg>
              Ranking
            </Button>
          </Link>

          <Link to={createPageUrl('Goals')}>
            <Button variant="outline" className="w-full h-14 rounded-xl border-2 hover:bg-slate-50 border-indigo-200 text-indigo-700">
              <Target className="w-4 h-4 mr-2" />
              Metas
            </Button>
          </Link>
        </div>

        {/* Botão Documentos Gerados - ÚLTIMO BOTÃO */}
        <Link to={createPageUrl('DocumentRepository')}>
          <Button className="w-full h-16 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-2xl shadow-lg">
            <FileText className="w-5 h-5 mr-2" />
            📄 Documentos Gerados pela IA
          </Button>
        </Link>

        <Link to={createPageUrl('FollowUpSequences')}>
          <Button variant="outline" className="w-full h-14 rounded-xl border-2 hover:bg-slate-50 border-purple-200 text-purple-700">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Follow-Up Automático
          </Button>
        </Link>

        <Link to={createPageUrl('Leads')}>
          <Button variant="outline" className="w-full h-14 rounded-xl border-2 hover:bg-slate-50 border-indigo-200 text-indigo-700">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Gestão de Leads
          </Button>
        </Link>

        <Link to={createPageUrl('AutomationRules')}>
          <Button variant="outline" className="w-full h-14 rounded-xl border-2 hover:bg-slate-50 border-yellow-200 text-yellow-700">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Automações
          </Button>
        </Link>

        <Link to={createPageUrl('WhatsAppInbox')}>
          <Button variant="outline" className="w-full h-14 rounded-xl border-2 hover:bg-slate-50 border-green-200 text-green-700">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
            WhatsApp Inbox
          </Button>
        </Link>

        <div className="grid grid-cols-2 gap-4">
          <Link to={createPageUrl('ProposalGenerator')}>
            <Button variant="outline" className="w-full h-14 rounded-xl border-2 hover:bg-slate-50 border-orange-200 text-orange-700">
              <FileText className="w-4 h-4 mr-2" />
              Gerar Proposta
            </Button>
          </Link>

          <Link to={createPageUrl('SignedContracts')}>
            <Button variant="outline" className="w-full h-14 rounded-xl border-2 hover:bg-slate-50 border-green-200 text-green-700">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Contratos
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Link to={createPageUrl('ImportPriceList')}>
            <Button variant="outline" className="w-full h-14 rounded-xl border-2 hover:bg-slate-50 border-emerald-200 text-emerald-700">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Importar Preços
            </Button>
          </Link>

          <Link to={createPageUrl('EquipmentPriceList')}>
            <Button variant="outline" className="w-full h-14 rounded-xl border-2 hover:bg-slate-50 border-blue-200 text-blue-700">
              <DollarSign className="w-4 h-4 mr-2" />
              Tabela de Preços
            </Button>
          </Link>

          <Link to={createPageUrl('Equipment')}>
            <Button variant="outline" className="w-full h-14 rounded-xl border-2 hover:bg-slate-50 border-purple-200 text-purple-700">
              <Package className="w-4 h-4 mr-2" />
              Equipamentos
            </Button>
          </Link>

          <Link to={createPageUrl('EquipmentConsumables')}>
            <Button variant="outline" className="w-full h-14 rounded-xl border-2 hover:bg-slate-50 border-indigo-200 text-indigo-700">
              <Package className="w-4 h-4 mr-2" />
              Insumos
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Link to={createPageUrl('LoadPremiumDifferentials')}>
            <Button variant="outline" className="w-full h-14 rounded-xl border-2 hover:bg-slate-50 border-purple-200 text-purple-700">
              <Sparkles className="w-4 h-4 mr-2" />
              Diferenciais
            </Button>
          </Link>

          <Link to={createPageUrl('EquipmentSalesCenter')}>
            <Button variant="outline" className="w-full h-14 rounded-xl border-2 hover:bg-slate-50 border-orange-200 text-orange-700">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              Kit Vendas
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Link to={createPageUrl('ConsumableOrderHistory')}>
            <Button variant="outline" className="w-full h-14 rounded-xl border-2 hover:bg-slate-50 border-purple-200 text-purple-700">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Análise de Insumos
            </Button>
          </Link>

          <Link to={createPageUrl('AutomationManager')}>
            <Button variant="outline" className="w-full h-14 rounded-xl border-2 hover:bg-slate-50 border-purple-200 text-purple-700">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Automações
            </Button>
          </Link>
          </div>

          {/* Relatório Mensal de Insights */}
          <div className="mt-6">
            <MonthlyInsightsReport />
          </div>
        </div>

      {/* Filtered Clients */}
      {(searchTerm || statusFilter !== 'all' || cityFilter !== 'all' || scoreFilter !== 'all') && (
        <div className="px-6 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800">
              Resultados ({filteredClients.length})
            </h2>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setCityFilter('all');
                setScoreFilter('all');
              }}
            >
              Limpar Todos
            </Button>
          </div>

          {/* Active Filters Summary */}
          {(cityFilter !== 'all' || scoreFilter !== 'all') && (
            <div className="flex flex-wrap gap-2 mb-4">
              {cityFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
                  📍 {cityFilter}
                  <button onClick={() => setCityFilter('all')} className="hover:bg-indigo-200 rounded-full p-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {scoreFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                  {scoreFilter === 'high' ? '⭐ Alto' : scoreFilter === 'medium' ? '📊 Médio' : '📉 Baixo'}
                  <button onClick={() => setScoreFilter('all')} className="hover:bg-purple-200 rounded-full p-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          )}

          <div className="space-y-3">
            {filteredClients.slice(0, 10).map((client) => (
              <ClientCard key={client.id} client={client} />
            ))}
          </div>
        </div>
      )}

      {/* Recent Clients */}
      {!searchTerm && statusFilter === 'all' && clients.length > 0 && (
        <div className="px-6 mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800">Clientes Recentes</h2>
            <Link to={createPageUrl('Clients')} className="text-sm text-indigo-600 font-medium">
              Ver todos
            </Link>
          </div>

          <div className="space-y-3">
            {clients.slice(0, 3).map((client) => (
              <ClientCard key={client.id} client={client} />
            ))}
          </div>
        </div>
      )}
      
      <div className="h-24" />

      <HotClientsDialog 
        open={hotClientsOpen}
        onOpenChange={setHotClientsOpen}
        status={selectedStatus}
      />
      </div>
      );
      }
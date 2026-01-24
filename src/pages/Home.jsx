import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  UserPlus, 
  Users, 
  MapPin,
  Search,
  Calendar,
  Target,
  TrendingUp,
  Loader2,
  CheckCircle2,
  Sparkles,
  MessageSquare,
  FileText,
  Settings,
  Play,
  Zap,
  Cog,
  BookOpen,
  Award
} from 'lucide-react';
import CompleteProfileSearch from '@/components/CompleteProfileSearch';
import RegionalClinicAnalyzer from '@/components/RegionalClinicAnalyzer';
import UniversalClientSearch from '@/components/UniversalClientSearch';
import BulkClientImporter from '@/components/BulkClientImporter';
import StockManagement from '@/components/StockManagement';
import AdvancedSalesForecast from '@/components/AdvancedSalesForecast';
import EnhancedPerformanceDashboard from '@/components/EnhancedPerformanceDashboard';
import SalesForecastDashboard from '@/components/SalesForecastDashboard';
import GamificationSystem from '@/components/GamificationSystem';
import SmartSegmentationEngine from '@/components/SmartSegmentationEngine';
import ProactiveAlertsSystem from '@/components/ProactiveAlertsSystem';
import AutoCampaignGenerator from '@/components/AutoCampaignGenerator';
import CoachingDashboard from '@/components/CoachingDashboard';
import WhatsAppMasterAssistant from '@/components/WhatsAppMasterAssistant';
import ResetSystemData from '@/components/ResetSystemData';

export default function Home() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchingClinics, setSearchingClinics] = useState(false);
  const [autoSaveProgress, setAutoSaveProgress] = useState(null);

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      try {
        const data = await base44.entities.Client.list('-updated_date', 100);
        return data.filter(c => 
          c && 
          c.id && 
          typeof c.id === 'string' && 
          c.id.length >= 20 && 
          c.first_name
        );
      } catch (error) {
        console.warn('Erro ao carregar clientes:', error);
        return [];
      }
    },
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const createClientMutation = useMutation({
    mutationFn: (clientData) => base44.entities.Client.create(clientData),
    onSuccess: () => {
      queryClient.invalidateQueries(['clients']);
    }
  });

  const metrics = useMemo(() => {
    const hotClients = clients.filter(c => c.status === 'quente').length;
    const warmClients = clients.filter(c => c.status === 'morno').length;
    const coldClients = clients.filter(c => c.status === 'frio').length;
    return {
      total: clients.length,
      hot: hotClients,
      warm: warmClients,
      cold: coldClients,
    };
  }, [clients]);

  const filteredClients = useMemo(() => {
    if (!searchTerm) return clients.slice(0, 10);
    return clients.filter(c =>
      c.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.clinic_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.city?.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 10);
  }, [clients, searchTerm]);

  const handleAutoSearchAndSave = async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocalização não disponível');
      return;
    }

    setSearchingClinics(true);
    setAutoSaveProgress({ total: 0, saved: 0, skipped: 0 });

    try {
      // Pegar localização
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const { latitude, longitude } = position.coords;
      toast.info('Buscando clínicas próximas...');

      // Buscar clínicas via API do Google
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Busque clínicas veterinárias próximas a esta localização: ${latitude}, ${longitude} (raio de 50km).
        
        Use Google Maps/Places para encontrar:
        - Nome da clínica
        - Endereço completo
        - Cidade
        - Telefone (se disponível)
        - Classificação (rating)
        
        Retorne uma lista de clínicas encontradas.`,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            clinics: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  address: { type: "string" },
                  city: { type: "string" },
                  phone: { type: "string" },
                  rating: { type: "number" }
                }
              }
            }
          }
        }
      });

      const clinicsFound = result.clinics || [];
      setAutoSaveProgress({ total: clinicsFound.length, saved: 0, skipped: 0 });

      if (clinicsFound.length === 0) {
        toast.warning('Nenhuma clínica encontrada');
        return;
      }

      toast.success(`${clinicsFound.length} clínicas encontradas! Salvando automaticamente...`);

      let saved = 0;
      let skipped = 0;

      // Salvar automaticamente cada clínica
      for (const clinic of clinicsFound) {
        try {
          // Verificar se já existe
          const exists = clients.some(c => 
            c.clinic_name?.toLowerCase() === clinic.name?.toLowerCase() ||
            c.address?.toLowerCase() === clinic.address?.toLowerCase()
          );

          if (exists) {
            skipped++;
            setAutoSaveProgress({ total: clinicsFound.length, saved, skipped });
            continue;
          }

          // Criar novo cliente
          await createClientMutation.mutateAsync({
            first_name: clinic.name.split(' ')[0] || clinic.name,
            clinic_name: clinic.name,
            address: clinic.address,
            city: clinic.city,
            phone: clinic.phone,
            status: 'morno',
            purchase_score: 50,
            lead_source: 'analise_mercado_ia'
          });

          saved++;
          setAutoSaveProgress({ total: clinicsFound.length, saved, skipped });
          
          // Pequeno delay para não sobrecarregar
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error('Erro ao salvar clínica:', error);
          skipped++;
          setAutoSaveProgress({ total: clinicsFound.length, saved, skipped });
        }
      }

      toast.success(`✅ Processo concluído! ${saved} clínicas salvas, ${skipped} ignoradas (duplicadas/erros)`);
      
    } catch (error) {
      console.error('Erro na busca:', error);
      toast.error('Erro ao buscar clínicas: ' + error.message);
    } finally {
      setSearchingClinics(false);
      setAutoSaveProgress(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white pb-20">
      {/* Header Fixo */}
      <div className="sticky top-0 z-40 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-4 py-3 shadow-lg border-b border-orange-500">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
              <span className="text-white font-black text-sm">NR22</span>
            </div>
            <div>
              <h1 className="text-sm font-black text-white">Método NR22</h1>
              <p className="text-xs text-orange-400">CRM Inteligente</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to={createPageUrl('ContactSettings')}>
              <Button size="sm" variant="ghost" className="text-white">
                <Settings className="w-4 h-4" />
              </Button>
            </Link>
            <Link to={createPageUrl('MyProfile')}>
              <Button size="sm" variant="ghost" className="text-white">
                <Users className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-4">
        {/* LIMPAR DADOS DE TESTE - PRODUÇÃO */}
        {user?.role === 'admin' && <ResetSystemData />}

        {/* ASSISTENTE IA WHATSAPP MASTER */}
        <WhatsAppMasterAssistant />

        {/* GAMIFICAÇÃO */}
        <GamificationSystem compact={true} />

        {/* ALERTAS PROATIVOS */}
        <ProactiveAlertsSystem />

        {/* GERADOR DE CAMPANHAS AUTOMÁTICAS */}
        <AutoCampaignGenerator />

        {/* 🎯 FLUXO CRONOLÓGICO COMPLETO */}
        <div className="space-y-3">
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold text-slate-900">📋 Fluxo de Trabalho</h2>
            <p className="text-xs text-slate-600">Siga na ordem para máximo resultado</p>
          </div>

          {/* ETAPA 1A: ANÁLISE REGIONAL POR CIDADE */}
          <RegionalClinicAnalyzer />

          {/* ETAPA 1B: BUSCA GPS */}
          <CompleteProfileSearch />

          {/* PESQUISA PARA CLIENTE */}
          <UniversalClientSearch />

          {/* ETAPA 2A: IMPORTAÇÃO EM MASSA */}
          <Card className="p-4 border-2 border-green-300 bg-gradient-to-r from-green-50 to-emerald-50">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-green-600 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <div className="flex-1">
                <p className="font-bold text-slate-900">📊 Importação em Massa</p>
                <p className="text-xs text-slate-600">Excel, Google Sheets, PDF, Word</p>
              </div>
            </div>
            <BulkClientImporter />
          </Card>

          {/* ETAPA 2B: CADASTRO MANUAL */}
          <Link to={createPageUrl('NewClient')}>
            <Card className="p-4 hover:shadow-lg transition-shadow border-2 border-orange-300 bg-gradient-to-r from-orange-50 to-amber-50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-orange-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl font-bold text-white">2B</span>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-900">➕ Novo Cliente Manual</p>
                  <p className="text-xs text-slate-600">Cadastrar cliente manualmente</p>
                </div>
                <UserPlus className="w-6 h-6 text-orange-600" />
              </div>
            </Card>
          </Link>

          {/* ETAPA 3: VER TODOS */}
          <Link to={createPageUrl('Clients')}>
            <Card className="p-4 hover:shadow-lg transition-shadow border-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-700 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl font-bold text-white">3</span>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-slate-900">👥 Ver Todos os Clientes</p>
                  <p className="text-xs text-slate-600">{metrics.total} clientes cadastrados</p>
                </div>
                <Users className="w-6 h-6 text-slate-700" />
              </div>
            </Card>
          </Link>

          {/* ETAPA 4: PRÉ-VISITA */}
          <Link to={createPageUrl('PreVisitChecklist')}>
            <Card className="p-4 hover:shadow-lg transition-shadow border-2 border-blue-300 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl font-bold text-white">4</span>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-blue-900">✅ Checklist Pré-Visita</p>
                  <p className="text-xs text-blue-700">Preparação antes de visitar</p>
                </div>
                <CheckCircle2 className="w-6 h-6 text-blue-600" />
              </div>
            </Card>
          </Link>

          {/* ETAPA 5: AGENDAR */}
          <Link to={createPageUrl('ScheduledAgenda')}>
            <Card className="p-4 hover:shadow-lg transition-shadow border-2 border-purple-300 bg-gradient-to-r from-purple-50 to-pink-50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl font-bold text-white">5</span>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-purple-900">📅 Agendar Visita</p>
                  <p className="text-xs text-purple-700">Programar visitas</p>
                </div>
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
            </Card>
          </Link>

          {/* ETAPA 6: PÓS-VISITA */}
          <Link to={createPageUrl('PostVisitAnalysis')}>
            <Card className="p-4 hover:shadow-lg transition-shadow border-2 border-green-300 bg-gradient-to-r from-green-50 to-emerald-50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-green-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl font-bold text-white">6</span>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-green-900">📝 Pós-Visita</p>
                  <p className="text-xs text-green-700">Registrar resultado da visita</p>
                </div>
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
            </Card>
          </Link>

          {/* ETAPA 7: ANÁLISES */}
          <Link to={createPageUrl('SalesAnalytics')}>
            <Card className="p-4 hover:shadow-lg transition-shadow border-2 border-indigo-300 bg-gradient-to-r from-indigo-50 to-blue-50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl font-bold text-white">7</span>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-indigo-900">📊 Dashboard & Relatórios</p>
                  <p className="text-xs text-indigo-700">Análises e métricas</p>
                </div>
                <TrendingUp className="w-6 h-6 text-indigo-600" />
              </div>
            </Card>
          </Link>
        </div>

        {/* BUSCA RÁPIDA */}
        <div className="pt-4 border-t">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">🔍 Busca Rápida</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar clientes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {searchTerm && filteredClients.length > 0 && (
            <div className="mt-3 space-y-2">
              {filteredClients.map((client) => {
                if (!client?.id || !client?.first_name) return null;
                return (
                  <Card
                    key={client.id}
                    className="p-3 cursor-pointer hover:bg-slate-50"
                    onClick={() => navigate(createPageUrl(`ClientProfile?id=${client.id}`))}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm text-slate-800">{client.first_name}</p>
                        <p className="text-xs text-slate-600">{client.clinic_name} • {client.city}</p>
                      </div>
                      <Badge className={
                        client.status === 'quente' ? 'bg-red-500' :
                        client.status === 'morno' ? 'bg-orange-500' : 'bg-blue-500'
                      }>
                        {client.status === 'quente' ? '🔥' : client.status === 'morno' ? '🌡️' : '❄️'}
                      </Badge>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* FUNIL DE VENDAS */}
        <div className="pt-4 border-t">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">📊 Funil & Análises</h3>
          <div className="grid grid-cols-2 gap-3">
            <Link to={createPageUrl('AdvancedFunnelManager')}>
              <Card className="p-3 hover:shadow-lg transition-shadow bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-blue-900">Funil Avançado</p>
                    <p className="text-xs text-blue-600">Drag-drop + análise</p>
                  </div>
                </div>
              </Card>
            </Link>

            <Link to={createPageUrl('SalesFunnel')}>
              <Card className="p-3 hover:shadow-lg transition-shadow bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-300">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-indigo-900">Funil Clássico</p>
                    <p className="text-xs text-indigo-600">Gráficos estáticos</p>
                  </div>
                </div>
              </Card>
            </Link>

            <Link to={createPageUrl('SalesAnalytics')}>
              <Card className="p-3 hover:shadow-lg transition-shadow bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-300">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-purple-900">Analytics</p>
                    <p className="text-xs text-purple-600">Métricas</p>
                  </div>
                </div>
              </Card>
            </Link>

            <Link to={createPageUrl('ClientsByCity')}>
              <Card className="p-3 hover:shadow-lg transition-shadow bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-green-600 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-green-900">Por Região</p>
                    <p className="text-xs text-green-600">Cidades</p>
                  </div>
                </div>
              </Card>
            </Link>

            <Link to={createPageUrl('RouteOptimizer')}>
              <Card className="p-3 hover:shadow-lg transition-shadow bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-300">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-blue-900">Rotas IA</p>
                    <p className="text-xs text-blue-600">Otimização</p>
                  </div>
                </div>
              </Card>
            </Link>

            <Link to={createPageUrl('AdvancedReports')}>
              <Card className="p-3 hover:shadow-lg transition-shadow bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-300">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-lg bg-orange-600 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-orange-900">Relatórios</p>
                    <p className="text-xs text-orange-600">Completos</p>
                  </div>
                </div>
              </Card>
            </Link>
          </div>
        </div>

        {/* GESTÃO DE LEADS IA */}
        <div className="pt-4 border-t">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">🎯 Gestão de Leads IA</h3>
          <div className="space-y-2">
            <Link to={createPageUrl('Leads')}>
              <Card className="p-3 hover:shadow-lg transition-shadow bg-gradient-to-r from-indigo-50 to-blue-50 border-2 border-indigo-300">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-indigo-900">Leads Qualificados</p>
                    <p className="text-xs text-indigo-600">Scoring automático IA</p>
                  </div>
                  <Badge className="bg-indigo-600 text-white">IA</Badge>
                </div>
              </Card>
            </Link>

            <Link to={createPageUrl('CaptureLeads')}>
              <Card className="p-3 hover:shadow-lg transition-shadow border-2 border-slate-300">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-900">Capturar Leads</p>
                    <p className="text-xs text-slate-600">Formulário rápido</p>
                  </div>
                </div>
              </Card>
            </Link>
          </div>
        </div>

        {/* AUTOMAÇÕES IA */}
        <div className="pt-4 border-t">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">🤖 Automações IA</h3>
          <div className="space-y-2">
            <Link to={createPageUrl('AutomationManager')}>
              <Card className="p-3 hover:shadow-lg transition-shadow bg-gradient-to-r from-purple-50 to-fuchsia-50 border-2 border-purple-300">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-purple-900">Central de Automação</p>
                    <p className="text-xs text-purple-600">Follow-ups, tarefas, alertas</p>
                  </div>
                  <Badge className="bg-purple-600 text-white">AUTO</Badge>
                </div>
              </Card>
            </Link>

            <Link to={createPageUrl('FollowUpSequences')}>
              <Card className="p-3 hover:shadow-lg transition-shadow border-2 border-slate-300">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-900">Sequências Follow-Up</p>
                    <p className="text-xs text-slate-600">Automáticas</p>
                  </div>
                </div>
              </Card>
            </Link>
          </div>
        </div>

        {/* PAINEL DE DESEMPENHO APRIMORADO */}
        <div className="pt-4 border-t">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">📈 Desempenho</h3>
          <EnhancedPerformanceDashboard />
        </div>

        {/* COACHING IA */}
        <div className="pt-4 border-t">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">🏆 Coaching IA</h3>
          <CoachingDashboard compact={true} />
        </div>

        {/* FERRAMENTAS EXTRAS */}
        <div className="pt-4 border-t">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">⚡ Ferramentas</h3>
        <div className="grid grid-cols-3 gap-2 mb-3">
          <Link to={createPageUrl('WhatsAppDataAccess')}>
            <Button size="sm" className="w-full h-12 bg-green-600 hover:bg-green-700 flex-col">
              <MessageSquare className="w-4 h-4 mb-1" />
              <span className="text-xs">WhatsApp</span>
            </Button>
          </Link>
          <Link to={createPageUrl('Tasks')}>
            <Button size="sm" variant="outline" className="w-full h-12 flex-col">
              <CheckCircle2 className="w-4 h-4 mb-1" />
              <span className="text-xs">Tarefas</span>
            </Button>
          </Link>
          <Link to={createPageUrl('AIAssistant')}>
            <Button size="sm" className="w-full h-12 bg-purple-600 hover:bg-purple-700 flex-col">
              <Sparkles className="w-4 h-4 mb-1" />
              <span className="text-xs">IA</span>
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-3">
          <Link to={createPageUrl('RouteOptimizer')}>
            <Button size="sm" variant="outline" className="w-full h-12 flex-col border-blue-300">
              <svg className="w-4 h-4 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <span className="text-xs">Rotas IA</span>
            </Button>
          </Link>
          <Link to={createPageUrl('SalesCoaching')}>
            <Button size="sm" variant="outline" className="w-full h-12 flex-col border-purple-300">
              <Award className="w-4 h-4 mb-1" />
              <span className="text-xs">Coaching</span>
            </Button>
          </Link>
        </div>

          {/* Stock & Forecast */}
          <div className="space-y-3">
            <StockManagement />
            <SalesForecastDashboard compact={true} />
            <AdvancedSalesForecast />
          </div>

          {/* mobVendedor Analytics */}
          <Link to={createPageUrl('MobVendedorAnalytics')}>
            <Card className="p-3 hover:shadow-lg transition-shadow bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-300">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-purple-900">Analytics mobVendedor</p>
                  <p className="text-xs text-purple-600">Previsões e análise</p>
                </div>
              </div>
            </Card>
          </Link>

          {/* Client Dashboard */}
          <Link to={createPageUrl('ClientDashboard')}>
            <Card className="p-3 hover:shadow-lg transition-shadow bg-gradient-to-br from-cyan-50 to-blue-50 border-2 border-cyan-300">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-cyan-600 flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-cyan-900">Dashboard Clientes</p>
                  <p className="text-xs text-cyan-600">Score + Busca Avançada</p>
                </div>
              </div>
            </Card>
          </Link>

          {/* mobVendedor Backup */}
          <Link to={createPageUrl('MobVendedorBackup')}>
            <Card className="p-3 hover:shadow-lg transition-shadow bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-blue-900">📦 Backup mobVendedor</p>
                  <p className="text-xs text-blue-600">Clientes, vendas, produtos</p>
                </div>
              </div>
            </Card>
          </Link>

          {/* MOBI Migration */}
          <Link to={createPageUrl('MobiMigration')}>
            <Card className="p-3 hover:shadow-lg transition-shadow bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-300">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-purple-900">🚀 Migração MOBI</p>
                  <p className="text-xs text-purple-600">Importar todos dados + estrutura</p>
                </div>
              </div>
            </Card>
          </Link>

          {/* Automation Manager */}
          <Link to={createPageUrl('AutomationManager')}>
            <Card className="p-3 hover:shadow-lg transition-shadow bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-600 flex items-center justify-center">
                  <Cog className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-amber-900">⚙️ Automações</p>
                  <p className="text-xs text-amber-600">Tarefas e alertas inteligentes</p>
                </div>
              </div>
            </Card>
          </Link>

          {/* Technical Materials Hub */}
          <Link to={createPageUrl('TechnicalMaterialsHub')}>
            <Card className="p-3 hover:shadow-lg transition-shadow bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-300">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-indigo-900">📚 Materiais Técnicos</p>
                  <p className="text-xs text-indigo-600">PDFs hemogasometria + hematologia</p>
                </div>
              </div>
            </Card>
          </Link>

          {/* Document Center */}
          <Link to={createPageUrl('DocumentCenter')}>
            <Card className="p-3 hover:shadow-lg transition-shadow bg-gradient-to-br from-purple-50 to-fuchsia-50 border-2 border-purple-300">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-600 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-purple-900">📋 Central de Docs</p>
                  <p className="text-xs text-purple-600">Propostas + análises prontas</p>
                </div>
              </div>
            </Card>
          </Link>

          {/* Client Document Center */}
          <Link to={createPageUrl('ClientDocumentCenter')}>
            <Card className="p-3 hover:shadow-lg transition-shadow bg-gradient-to-br from-indigo-50 to-blue-50 border-2 border-indigo-300">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-indigo-900">📚 Documentos Clientes</p>
                  <p className="text-xs text-indigo-600">Upload + Busca IA + Envio</p>
                </div>
              </div>
            </Card>
          </Link>

          {/* Data Hub - Central de Dados */}
          <Link to={createPageUrl('DataHub')}>
            <Card className="p-3 hover:shadow-lg transition-shadow bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-600 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-green-900">🗄️ Central de Dados</p>
                  <p className="text-xs text-green-600">Importar + Documentos + Exportar</p>
                </div>
              </div>
            </Card>
          </Link>

          {/* AI Content Generator */}
          <Link to={createPageUrl('AIContentGenerator')}>
            <Card className="p-3 hover:shadow-lg transition-shadow bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-400">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-purple-900">✨ Gerador Conteúdo IA</p>
                  <p className="text-xs text-purple-600">Emails, posts, descrições, follow-ups</p>
                </div>
              </div>
            </Card>
          </Link>
          </div>

        {/* SEGMENTAÇÃO INTELIGENTE */}
        <div className="pt-4 border-t">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">🎯 Segmentação Inteligente</h3>
          <SmartSegmentationEngine />
        </div>

        {/* MÉTRICAS RÁPIDAS - CLICÁVEIS */}
        <div className="pt-4 border-t">
          <div className="grid grid-cols-2 gap-3">
            <Link to={createPageUrl('Clients')}>
              <Card className="p-3 bg-gradient-to-br from-indigo-50 to-blue-50 cursor-pointer hover:shadow-lg transition-all">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  <div>
                    <p className="text-2xl font-bold text-indigo-900">{metrics.total}</p>
                    <p className="text-xs text-indigo-600">Total Clientes</p>
                  </div>
                </div>
              </Card>
            </Link>
            
            <Link to={createPageUrl('Clients?filter=quente')}>
              <Card className="p-3 bg-gradient-to-br from-red-50 to-orange-50 cursor-pointer hover:shadow-lg transition-all">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-red-600" />
                  <div>
                    <p className="text-2xl font-bold text-red-900">{metrics.hot}</p>
                    <p className="text-xs text-red-600">Quentes 🔥</p>
                  </div>
                </div>
              </Card>
            </Link>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mt-3">
            <Link to={createPageUrl('Clients?filter=morno')}>
              <Card className="p-3 bg-gradient-to-br from-yellow-50 to-amber-50 cursor-pointer hover:shadow-lg transition-all">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-yellow-600" />
                  <div>
                    <p className="text-2xl font-bold text-yellow-900">{metrics.warm}</p>
                    <p className="text-xs text-yellow-600">Mornos 🌡️</p>
                  </div>
                </div>
              </Card>
            </Link>
            
            <Link to={createPageUrl('Clients?filter=frio')}>
              <Card className="p-3 bg-gradient-to-br from-blue-50 to-cyan-50 cursor-pointer hover:shadow-lg transition-all">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold text-blue-900">{metrics.cold}</p>
                    <p className="text-xs text-blue-600">Frios ❄️</p>
                  </div>
                </div>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
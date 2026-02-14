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
  MessageSquare,
  FileText,
  Settings,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Award,
  ChevronDown,
  ChevronUp,
  Play,
  BarChart3,
  Zap,
  Download
} from 'lucide-react';
import { useOfflineClients } from '@/components/OfflineClientCache';
import AIControlCenter from '@/components/AIControlCenter';
import MonthlyScheduleGenerator from '@/components/MonthlyScheduleGenerator';

export default function Home() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [newMasterPhone, setNewMasterPhone] = useState('');
  const [customCnpj, setCustomCnpj] = useState('');
  const [customDistributorId, setCustomDistributorId] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const { clients, isOffline, isLoading } = useOfflineClients();

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
    if (!searchTerm) return [];
    return clients.filter(c =>
      c.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.clinic_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.city?.toLowerCase().includes(searchTerm.toLowerCase())
    ).slice(0, 15);
  }, [clients, searchTerm]);

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
        {/* CONTROLE DE IA - ECONOMIA DE CRÉDITOS */}
        <AIControlCenter />

        {/* ========================================
            FLUXO CRONOLÓGICO COMPLETO - OTIMIZADO
            ======================================== */}
        
        <div className="text-center mb-2">
          <h2 className="text-lg font-bold text-slate-900">🎯 Fluxo de Vendas</h2>
          <p className="text-xs text-slate-600">Siga a ordem: Lead → Cliente → Venda</p>
        </div>

        {/* FASE 1: CAPTAÇÃO DE LEADS */}
        <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-400">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">1</span>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-blue-900">Captação de Leads</h3>
              <p className="text-xs text-blue-700">Encontre e qualifique novos prospects</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Link to={createPageUrl('CaptureLeads')}>
              <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700">
                <UserPlus className="w-4 h-4 mr-1" />
                Capturar Lead
              </Button>
            </Link>
            <Link to={createPageUrl('LeadsKanban')}>
              <Button size="sm" variant="outline" className="w-full border-blue-300">
                <Target className="w-4 h-4 mr-1" />
                Pipeline
              </Button>
            </Link>
          </div>
        </Card>

        {/* FASE 2: CADASTRO DE CLIENTES */}
        <Card className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-400">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-green-600 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">2</span>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-green-900">Cadastro de Clientes</h3>
              <p className="text-xs text-green-700">Adicione clientes ao sistema</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Link to={createPageUrl('ImportClientsTable')}>
              <Button size="sm" className="w-full bg-green-600 hover:bg-green-700">
                <FileText className="w-4 h-4 mr-1" />
                Importar Tabela
              </Button>
            </Link>
            <Link to={createPageUrl('NewClient')}>
              <Button size="sm" variant="outline" className="w-full border-green-300">
                <UserPlus className="w-4 h-4 mr-1" />
                Novo Manual
              </Button>
            </Link>
          </div>
        </Card>

        {/* FASE 3: VER E GERENCIAR CLIENTES */}
        <Link to={createPageUrl('Clients')}>
          <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-400 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-purple-900">👥 Todos os Clientes</h3>
                <p className="text-xs text-purple-700">{metrics.total} cadastrados</p>
              </div>
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </Card>
        </Link>

        {/* FASE 4: PRÉ-VISITA */}
        <Link to={createPageUrl('PreVisitChecklist')}>
          <Card className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-400 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-orange-600 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">4</span>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-orange-900">✅ Checklist Pré-Visita</h3>
                <p className="text-xs text-orange-700">Prepare-se antes de visitar</p>
              </div>
              <CheckCircle2 className="w-6 h-6 text-orange-600" />
            </div>
          </Card>
        </Link>

        {/* FASE 5: AGENDAR VISITA */}
        <Link to={createPageUrl('ScheduledAgenda')}>
          <Card className="p-4 bg-gradient-to-r from-indigo-50 to-blue-50 border-2 border-indigo-400 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">5</span>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-indigo-900">📅 Agendar Visita</h3>
                <p className="text-xs text-indigo-700">Programar visitas</p>
              </div>
              <Calendar className="w-6 h-6 text-indigo-600" />
            </div>
          </Card>
        </Link>

        {/* FASE 6: PÓS-VISITA */}
        <Link to={createPageUrl('PostVisitAnalysis')}>
          <Card className="p-4 bg-gradient-to-r from-teal-50 to-cyan-50 border-2 border-teal-400 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-teal-600 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">6</span>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-teal-900">📝 Pós-Visita</h3>
                <p className="text-xs text-teal-700">Registre resultado</p>
              </div>
              <CheckCircle2 className="w-6 h-6 text-teal-600" />
            </div>
          </Card>
        </Link>

        {/* FASE 7: RELATÓRIOS E ANÁLISES */}
        <Card className="p-4 bg-gradient-to-r from-purple-50 to-fuchsia-50 border-2 border-purple-400">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">7</span>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-purple-900">📊 Análises & Relatórios</h3>
              <p className="text-xs text-purple-700">Métricas e insights</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Link to={createPageUrl('SalesAnalytics')}>
              <Button size="sm" variant="outline" className="w-full text-xs">
                <BarChart3 className="w-3 h-3 mr-1" />
                Analytics
              </Button>
            </Link>
            <Link to={createPageUrl('CRMAnalyticsDashboard')}>
              <Button size="sm" variant="outline" className="w-full text-xs">
                <TrendingUp className="w-3 h-3 mr-1" />
                Dashboard
              </Button>
            </Link>
            <Link to={createPageUrl('MonthlyReport')}>
              <Button size="sm" variant="outline" className="w-full text-xs">
                <FileText className="w-3 h-3 mr-1" />
                Mensal
              </Button>
            </Link>
          </div>
        </Card>

        {/* =======================================
            FERRAMENTAS PRINCIPAIS - COMPACTADO
            ======================================= */}

        {/* WHATSAPP MASTER NR22888 */}
        <Card className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-400">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-green-600 flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-green-900">🚀 WhatsApp Master</h3>
              <p className="text-xs text-green-700">Assistente total de vendas</p>
            </div>
          </div>
          <Button 
            onClick={() => {
              const url = base44.agents.getWhatsAppConnectURL('whatsapp_master_assistant');
              navigator.clipboard.writeText(url);
              toast.success('Link copiado!', { duration: 3000 });
              window.open(url, '_blank');
            }}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Conectar WhatsApp Master
          </Button>
          
          {/* Cadastro de WhatsApp Master */}
          <div className="mt-3 pt-3 border-t border-green-300">
            <p className="text-xs font-semibold text-green-800 mb-2">Números autorizados:</p>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="5511999999999"
                value={newMasterPhone}
                onChange={(e) => setNewMasterPhone(e.target.value)}
                className="flex-1 text-sm"
              />
              <Button
                onClick={async () => {
                  if (!newMasterPhone || newMasterPhone.length < 12) {
                    toast.error('Número inválido');
                    return;
                  }
                  
                  const cleanPhone = newMasterPhone.replace(/\s/g, '');
                  
                  try {
                    const currentNumbers = user?.master_whatsapp_numbers || [];
                    if (currentNumbers.includes(cleanPhone)) {
                      toast.error('Já cadastrado');
                      return;
                    }
                    
                    await base44.auth.updateMe({
                      master_whatsapp_numbers: [...currentNumbers, cleanPhone]
                    });
                    
                    toast.success('✅ Cadastrado!');
                    setNewMasterPhone('');
                    queryClient.invalidateQueries(['current-user']);
                  } catch (error) {
                    toast.error('Erro: ' + error.message);
                  }
                }}
                size="sm"
                className="bg-green-600 hover:bg-green-700"
                disabled={!newMasterPhone || newMasterPhone.length < 12}
              >
                <UserPlus className="w-4 h-4" />
              </Button>
            </div>
            {user?.master_whatsapp_numbers?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {user.master_whatsapp_numbers.map((phone, idx) => (
                  <Badge key={idx} variant="outline" className="bg-white text-xs">
                    {phone}
                    <button
                      onClick={async () => {
                        await base44.auth.updateMe({
                          master_whatsapp_numbers: user.master_whatsapp_numbers.filter(p => p !== phone)
                        });
                        toast.success('Removido');
                        queryClient.invalidateQueries(['current-user']);
                      }}
                      className="text-red-500 ml-1 font-bold"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* GERADOR DE AGENDA MENSAL AUTOMÁTICA */}
        <MonthlyScheduleGenerator />

        {/* BUSCA RÁPIDA DE CLIENTES */}
        <Card className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="🔍 Buscar clientes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {searchTerm && filteredClients.length > 0 && (
            <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
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
        </Card>

        {/* MÉTRICAS CLICÁVEIS */}
        <div className="grid grid-cols-2 gap-3">
          <Link to={createPageUrl('Clients')}>
            <Card className="p-3 bg-gradient-to-br from-slate-50 to-slate-100 hover:shadow-lg transition-all">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-slate-600" />
                <div>
                  <p className="text-2xl font-bold text-slate-900">{metrics.total}</p>
                  <p className="text-xs text-slate-600">Total</p>
                </div>
              </div>
            </Card>
          </Link>
          
          <Link to={createPageUrl('Clients?filter=quente')}>
            <Card className="p-3 bg-gradient-to-br from-red-50 to-orange-50 hover:shadow-lg transition-all">
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

        {/* FERRAMENTAS ESSENCIAIS - GRID COMPACTO */}
        <div className="grid grid-cols-3 gap-2">
          <Link to={createPageUrl('AIAssistant')}>
            <Button className="w-full h-16 bg-purple-600 hover:bg-purple-700 flex-col">
              <Sparkles className="w-5 h-5 mb-1" />
              <span className="text-xs">IA</span>
            </Button>
          </Link>
          <Link to={createPageUrl('Tasks')}>
            <Button variant="outline" className="w-full h-16 flex-col">
              <CheckCircle2 className="w-5 h-5 mb-1" />
              <span className="text-xs">Tarefas</span>
            </Button>
          </Link>
          <Link to={createPageUrl('DocumentCenter')}>
            <Button variant="outline" className="w-full h-16 flex-col">
              <FileText className="w-5 h-5 mb-1" />
              <span className="text-xs">Docs</span>
            </Button>
          </Link>
        </div>

        {/* IMPORTAÇÃO MOBVENDEDOR - COMPACTO */}
        <Card className="p-3 bg-orange-50 border border-orange-300">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-orange-600" />
              <h3 className="font-bold text-orange-900 text-sm">MobVendedor</h3>
            </div>
            <Badge className="bg-orange-600 text-white text-xs">200km</Badge>
          </div>
          <Button
            onClick={async () => {
              const loading = toast.loading('Importando...');
              try {
                const response = await base44.functions.invoke('importMobVendedorMarilia200km', {
                  cnpj: '13693877000157',
                  mobvendedor_id: '53'
                });
                toast.dismiss(loading);
                if (response.data.success) {
                  toast.success(`✅ ${response.data.synced} clientes importados!`);
                  queryClient.invalidateQueries(['clients']);
                } else {
                  toast.error('Erro: ' + response.data.error);
                }
              } catch (error) {
                toast.dismiss(loading);
                toast.error('Erro: ' + error.message);
              }
            }}
            className="w-full bg-orange-600 hover:bg-orange-700"
            size="sm"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Importar 200km Marília
          </Button>
        </Card>

        {/* FERRAMENTAS AVANÇADAS - EXPANSÍVEL */}
        <Card className="p-3">
          <button 
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-indigo-600" />
              <h3 className="font-semibold text-slate-800 text-sm">Ferramentas Avançadas</h3>
            </div>
            {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          
          {showAdvanced && (
            <div className="mt-3 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Link to={createPageUrl('FunnelOptimization')}>
                  <Button size="sm" variant="outline" className="w-full">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Funil IA
                  </Button>
                </Link>
                <Link to={createPageUrl('RouteOptimizer')}>
                  <Button size="sm" variant="outline" className="w-full">
                    <MapPin className="w-3 h-3 mr-1" />
                    Rotas
                  </Button>
                </Link>
                <Link to={createPageUrl('RolePlayTraining')}>
                  <Button size="sm" variant="outline" className="w-full">
                    <Play className="w-3 h-3 mr-1" />
                    Role-Play
                  </Button>
                </Link>
                <Link to={createPageUrl('SalesCoaching')}>
                  <Button size="sm" variant="outline" className="w-full">
                    <Award className="w-3 h-3 mr-1" />
                    Coaching
                  </Button>
                </Link>
                <Link to={createPageUrl('AutomationManager')}>
                  <Button size="sm" variant="outline" className="w-full">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Automações
                  </Button>
                </Link>
                <Link to={createPageUrl('ChurnAnalysis')}>
                  <Button size="sm" variant="outline" className="w-full">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Churn
                  </Button>
                </Link>
              </div>

              {/* Importação customizada */}
              <div className="mt-3 pt-3 border-t">
                <p className="text-xs font-semibold text-slate-700 mb-2">Outro Tablet:</p>
                <div className="space-y-2">
                  <Input
                    placeholder="CNPJ"
                    value={customCnpj}
                    onChange={(e) => setCustomCnpj(e.target.value)}
                    className="text-sm h-9"
                  />
                  <Input
                    placeholder="ID Distribuidor"
                    value={customDistributorId}
                    onChange={(e) => setCustomDistributorId(e.target.value)}
                    className="text-sm h-9"
                  />
                  <Button
                    onClick={async () => {
                      const cnpj = customCnpj.replace(/\D/g, '');
                      if (!cnpj || cnpj.length !== 14 || !customDistributorId) {
                        toast.error('Preencha CNPJ e ID');
                        return;
                      }
                      const loading = toast.loading('Importando...');
                      try {
                        const response = await base44.functions.invoke('mobVendedorIntegration', {
                          action: 'sync_clients',
                          credentials: { cnpj, mobvendedor_id: customDistributorId.trim() }
                        });
                        toast.dismiss(loading);
                        if (response.data.success) {
                          toast.success(`✅ ${response.data.synced} importados!`);
                          queryClient.invalidateQueries(['clients']);
                          setCustomCnpj('');
                          setCustomDistributorId('');
                        } else {
                          toast.error(response.data.error);
                        }
                      } catch (error) {
                        toast.dismiss(loading);
                        toast.error('Erro: ' + error.message);
                      }
                    }}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    size="sm"
                    disabled={!customCnpj || !customDistributorId}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Importar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* LINKS RÁPIDOS - MAIS COMPACTO */}
        <div className="grid grid-cols-2 gap-2">
          <Link to={createPageUrl('ClientsByCity')}>
            <Button variant="outline" className="w-full h-12 text-xs">
              <MapPin className="w-4 h-4 mr-1" />
              Por Região
            </Button>
          </Link>
          <Link to={createPageUrl('TechnicalMaterialsHub')}>
            <Button variant="outline" className="w-full h-12 text-xs">
              <FileText className="w-4 h-4 mr-1" />
              Materiais
            </Button>
          </Link>
        </div>

        {/* INFO RÁPIDA */}
        <div className="text-center pt-4 border-t">
          <p className="text-xs text-slate-500">
            💡 <strong>Dica:</strong> Use o WhatsApp Master para criar clientes, agendar visitas e gerar propostas via voz!
          </p>
        </div>
      </div>
    </div>
  );
}
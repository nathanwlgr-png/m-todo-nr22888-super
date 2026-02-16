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
import DocumentsCenter from '@/components/DocumentsCenter';
import OfflineDataPack from '@/components/OfflineDataPack';
import CompetitorPriceAnalysis from '@/components/CompetitorPriceAnalysis';
import CityLeadCapture from '@/components/CityLeadCapture';
import AutomaticClientFollowUp from '@/components/AutomaticClientFollowUp';
import PerformanceAnalyticsDashboard from '@/components/PerformanceAnalyticsDashboard';
import AdvancedLeadQualification from '@/components/AdvancedLeadQualification';
import BirthdayReminders from '@/components/BirthdayReminders';
import NotificationCenter from '@/components/notifications/NotificationCenter';
import AIPriorityLeads from '@/components/AIPriorityLeads';
import ProactiveAIDashboard from '@/components/ProactiveAIDashboard';
import SmartClinicFinder from '@/components/SmartClinicFinder';
import QuickNavigation from '@/components/QuickNavigation';

export default function Home() {
  const [docsDialogOpen, setDocsDialogOpen] = useState(false);
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
            <NotificationCenter 
              onSettingsClick={() => navigate(createPageUrl('NotificationSettings'))}
            />
            <Button 
              size="sm" 
              variant="ghost" 
              className="text-white"
              onClick={() => setDocsDialogOpen(true)}
            >
              <FileText className="w-4 h-4" />
            </Button>
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
        {/* CONTROLE DE IA */}
        <AIControlCenter />

        {/* NAVEGAÇÃO RÁPIDA COMPACTADA */}
        <QuickNavigation />

        {/* =======================================
            FERRAMENTAS PRINCIPAIS - COMPACTADO
            ======================================= */}

        {/* WHATSAPP MASTER - COMPACTO */}
        <Card className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-400">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-5 h-5 text-green-600" />
            <h3 className="font-bold text-green-900 text-sm">🚀 WhatsApp Master</h3>
          </div>
          <Button 
            onClick={() => {
              const url = base44.agents.getWhatsAppConnectURL('whatsapp_master_assistant');
              navigator.clipboard.writeText(url);
              toast.success('Link copiado!', { duration: 2000 });
              window.open(url, '_blank');
            }}
            size="sm"
            className="w-full bg-green-600 hover:bg-green-700 mb-2"
          >
            <MessageSquare className="w-3 h-3 mr-1" />
            Conectar
          </Button>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Número"
              value={newMasterPhone}
              onChange={(e) => setNewMasterPhone(e.target.value)}
              className="text-xs h-8"
            />
            <Button
              onClick={async () => {
                if (!newMasterPhone || newMasterPhone.length < 12) {
                  toast.error('Inválido');
                  return;
                }
                const cleanPhone = newMasterPhone.replace(/\s/g, '');
                try {
                  const currentNumbers = user?.master_whatsapp_numbers || [];
                  if (currentNumbers.includes(cleanPhone)) {
                    toast.error('Existe');
                    return;
                  }
                  await base44.auth.updateMe({
                    master_whatsapp_numbers: [...currentNumbers, cleanPhone]
                  });
                  toast.success('✅ OK');
                  setNewMasterPhone('');
                  queryClient.invalidateQueries(['current-user']);
                } catch (error) {
                  toast.error('Erro');
                }
              }}
              size="sm"
              className="bg-green-600 hover:bg-green-700 h-8"
              disabled={!newMasterPhone || newMasterPhone.length < 12}
            >
              +
            </Button>
          </div>
          {user?.master_whatsapp_numbers?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {user.master_whatsapp_numbers.map((phone, idx) => (
                <Badge key={idx} variant="outline" className="bg-white text-xs py-0.5">
                  {phone.slice(-8)}
                  <button
                    onClick={async () => {
                      await base44.auth.updateMe({
                        master_whatsapp_numbers: user.master_whatsapp_numbers.filter(p => p !== phone)
                      });
                      toast.success('✓');
                      queryClient.invalidateQueries(['current-user']);
                    }}
                    className="text-red-500 ml-1 font-bold text-xs leading-none"
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </Card>

        {/* GERADOR DE AGENDA MENSAL AUTOMÁTICA */}
        <MonthlyScheduleGenerator />

        {/* PACOTE OFFLINE COMPLETO */}
        <OfflineDataPack />

        {/* ANÁLISE DE CONCORRENTES */}
        <CompetitorPriceAnalysis />

        {/* BUSCA INTELIGENTE DE CLÍNICAS */}
        <SmartClinicFinder />

        {/* CAPTURA DE LEADS POR CIDADE */}
        <CityLeadCapture />

        {/* ANIVERSÁRIOS E COMEMORAÇÕES */}
        <BirthdayReminders />

        {/* DASHBOARD PROATIVO DE IA */}
        <ProactiveAIDashboard />

        {/* SISTEMA DE AUTOMAÇÃO INTELIGENTE */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Zap className="w-5 h-5 text-indigo-600" />
            🤖 Automação Inteligente
          </h3>
          <AIPriorityLeads />
          <AutomaticClientFollowUp />
          <PerformanceAnalyticsDashboard />
          <AdvancedLeadQualification />
        </div>

        {/* BUSCA RÁPIDA - MINI */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
          <Input
            placeholder="🔍 Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10"
          />
          {searchTerm && filteredClients.length > 0 && (
            <div className="absolute top-12 left-0 right-0 bg-white border rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
              {filteredClients.map((client) => {
                if (!client?.id || !client?.first_name) return null;
                return (
                  <div
                    key={client.id}
                    className="p-2 border-b cursor-pointer hover:bg-slate-50 text-xs"
                    onClick={() => {
                      navigate(createPageUrl(`ClientProfile?id=${client.id}`));
                      setSearchTerm('');
                    }}
                  >
                    <p className="font-semibold">{client.first_name}</p>
                    <p className="text-slate-500">{client.city}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

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

      {/* Central de Documentos */}
      <DocumentsCenter open={docsDialogOpen} onOpenChange={setDocsDialogOpen} />
    </div>
  );
}
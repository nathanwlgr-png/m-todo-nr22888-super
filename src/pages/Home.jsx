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
  UserPlus, Users, MapPin, Search, Calendar, Target, TrendingUp,
  MessageSquare, FileText, Settings, Sparkles, CheckCircle2, RefreshCw,
  Award, Zap, Download, Phone, Bell, ChevronRight, BarChart3,
  Flame, Thermometer, Snowflake, Bot, Route, Star
} from 'lucide-react';
import { useOfflineClients } from '@/components/OfflineClientCache';
import NotificationCenter from '@/components/notifications/NotificationCenter';
import DocumentsCenter from '@/components/DocumentsCenter';

const QuickLink = ({ to, icon: Icon, label, color = "slate", badge }) => (
  <Link to={createPageUrl(to)}>
    <div className={`flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white border border-slate-100 hover:border-indigo-300 hover:shadow-md transition-all group relative`}>
      {badge && <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{badge}</span>}
      <div className={`w-9 h-9 rounded-lg bg-${color}-100 flex items-center justify-center group-hover:scale-110 transition-transform`}>
        <Icon className={`w-5 h-5 text-${color}-600`} />
      </div>
      <span className="text-[11px] font-semibold text-slate-700 text-center leading-tight">{label}</span>
    </div>
  </Link>
);

export default function Home() {
  const [docsDialogOpen, setDocsDialogOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [newMasterPhone, setNewMasterPhone] = useState('');
  const [showPhoneInput, setShowPhoneInput] = useState(false);

  const { clients, isOffline, isLoading } = useOfflineClients();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: pendingTasks = [] } = useQuery({
    queryKey: ['home-pending-tasks'],
    queryFn: () => base44.entities.Task.filter({ status: 'pendente' }).catch(() => []),
    staleTime: 60000,
  });

  const { data: hotClients = [] } = useQuery({
    queryKey: ['home-hot-clients'],
    queryFn: () => base44.entities.Client.filter({ status: 'quente' }).catch(() => []),
    staleTime: 60000,
  });

  const metrics = useMemo(() => ({
    total: clients.length,
    hot: clients.filter(c => c.status === 'quente').length,
    warm: clients.filter(c => c.status === 'morno').length,
    cold: clients.filter(c => c.status === 'frio').length,
    withPhone: clients.filter(c => c.phone).length,
    pendingTasks: pendingTasks.length,
  }), [clients, pendingTasks]);

  const filteredClients = useMemo(() => {
    if (!searchTerm || searchTerm.length < 2) return [];
    const lower = searchTerm.toLowerCase();
    return clients.filter(c =>
      c.first_name?.toLowerCase().includes(lower) ||
      c.clinic_name?.toLowerCase().includes(lower) ||
      c.city?.toLowerCase().includes(lower) ||
      c.phone?.includes(searchTerm)
    ).slice(0, 8);
  }, [clients, searchTerm]);

  const whatsappUrl = base44.agents.getWhatsAppConnectURL('whatsapp_master_assistant');

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* HEADER PREMIUM */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-4 pt-4 pb-6 shadow-xl border-b-2 border-orange-500">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg">
              <span className="text-white font-black text-xs">NR22</span>
            </div>
            <div>
              <h1 className="text-base font-black text-white tracking-tight">CRM NR22</h1>
              <p className="text-xs text-orange-400 font-medium">
                {isOffline ? '📴 Offline' : '🟢 Online'} · {new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <NotificationCenter onSettingsClick={() => navigate(createPageUrl('NotificationSettings'))} />
            <Button size="sm" variant="ghost" className="text-white hover:bg-white/10" onClick={() => setDocsDialogOpen(true)}>
              <FileText className="w-4 h-4" />
            </Button>
            <Link to={createPageUrl('ContactSettings')}>
              <Button size="sm" variant="ghost" className="text-white hover:bg-white/10">
                <Settings className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* MÉTRICAS NO HEADER */}
        <div className="grid grid-cols-4 gap-2">
          <Link to={createPageUrl('Clients')}>
            <div className="bg-white/10 hover:bg-white/20 rounded-xl p-2.5 text-center transition-all border border-white/10">
              <p className="text-xl font-black text-white">{metrics.total}</p>
              <p className="text-[10px] text-slate-300 font-medium">Total</p>
            </div>
          </Link>
          <Link to={createPageUrl('Clients?filter=quente')}>
            <div className="bg-red-500/30 hover:bg-red-500/40 rounded-xl p-2.5 text-center transition-all border border-red-400/30">
              <p className="text-xl font-black text-orange-300">{metrics.hot}</p>
              <p className="text-[10px] text-red-300 font-medium">🔥 Quentes</p>
            </div>
          </Link>
          <Link to={createPageUrl('TasksUnified')}>
            <div className="bg-yellow-500/20 hover:bg-yellow-500/30 rounded-xl p-2.5 text-center transition-all border border-yellow-400/30">
              <p className="text-xl font-black text-yellow-300">{metrics.pendingTasks}</p>
              <p className="text-[10px] text-yellow-300 font-medium">Tarefas</p>
            </div>
          </Link>
          <Link to={createPageUrl('WhatsAppHub')}>
            <div className="bg-green-500/20 hover:bg-green-500/30 rounded-xl p-2.5 text-center transition-all border border-green-400/30">
              <p className="text-xl font-black text-green-300">{metrics.withPhone}</p>
              <p className="text-[10px] text-green-300 font-medium">WhatsApp</p>
            </div>
          </Link>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">

        {/* BUSCA UNIFICADA E RÁPIDA */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
          <Input
            placeholder="Buscar cliente, clínica, cidade..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-11 bg-white shadow-sm border-slate-200 text-sm"
            autoComplete="off"
          />
          {searchTerm && filteredClients.length > 0 && (
            <div className="absolute top-13 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl z-30 overflow-hidden mt-1">
              {filteredClients.map((client) => (
                <div
                  key={client.id}
                  className="flex items-center gap-3 px-4 py-3 border-b last:border-0 cursor-pointer hover:bg-indigo-50 transition-colors"
                  onClick={() => { navigate(createPageUrl(`ClientProfile?id=${client.id}`)); setSearchTerm(''); }}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${
                    client.status === 'quente' ? 'bg-red-500' : client.status === 'morno' ? 'bg-orange-400' : 'bg-blue-400'
                  }`}>
                    {client.first_name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-slate-900 truncate">{client.first_name} {client.clinic_name ? `· ${client.clinic_name}` : ''}</p>
                    <p className="text-xs text-slate-500">{client.city}{client.phone ? ` · ${client.phone.slice(-8)}` : ''}</p>
                  </div>
                  <Badge className={`text-[10px] flex-shrink-0 ${
                    client.status === 'quente' ? 'bg-red-100 text-red-700' : 
                    client.status === 'morno' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {client.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
          {searchTerm && filteredClients.length === 0 && searchTerm.length >= 2 && (
            <div className="absolute top-13 left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-xl z-30 p-4 mt-1 text-center text-sm text-slate-500">
              Nenhum cliente encontrado para "{searchTerm}"
            </div>
          )}
        </div>

        {/* WHATSAPP MASTER - DESTAQUE PREMIUM */}
        <Card className="overflow-hidden border-0 shadow-lg">
          <div className="bg-gradient-to-r from-green-600 to-emerald-700 p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-black text-white text-sm">WhatsApp Master IA</h3>
                <p className="text-xs text-green-100">Assistente com acesso total ao CRM</p>
              </div>
              <Badge className="ml-auto bg-white/20 text-white border-0 text-xs">ONLINE</Badge>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => { navigator.clipboard.writeText(whatsappUrl); window.open(whatsappUrl, '_blank'); toast.success('Abrindo WhatsApp...'); }}
                className="bg-white text-green-700 hover:bg-green-50 font-bold text-xs h-9"
              >
                <MessageSquare className="w-4 h-4 mr-1" />
                Conectar Agora
              </Button>
              <Button
                onClick={() => { navigator.clipboard.writeText(whatsappUrl); toast.success('Link copiado!'); }}
                variant="outline"
                className="border-white/40 text-white hover:bg-white/10 text-xs h-9"
              >
                Copiar Link
              </Button>
            </div>
          </div>

          {/* Números registrados */}
          <div className="p-3 bg-green-50">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-green-800">Números autorizados</p>
              <button onClick={() => setShowPhoneInput(!showPhoneInput)} className="text-xs text-green-600 font-bold hover:underline">
                + Adicionar
              </button>
            </div>
            {showPhoneInput && (
              <div className="flex gap-2 mb-2">
                <Input
                  type="tel"
                  placeholder="5511999999999"
                  value={newMasterPhone}
                  onChange={(e) => setNewMasterPhone(e.target.value)}
                  className="text-xs h-8 bg-white"
                />
                <Button
                  onClick={async () => {
                    const clean = newMasterPhone.replace(/\D/g, '');
                    if (clean.length < 12) { toast.error('Número inválido'); return; }
                    const current = user?.master_whatsapp_numbers || [];
                    if (current.includes(clean)) { toast.error('Já cadastrado'); return; }
                    await base44.auth.updateMe({ master_whatsapp_numbers: [...current, clean] });
                    toast.success('✅ Adicionado');
                    setNewMasterPhone('');
                    setShowPhoneInput(false);
                    queryClient.invalidateQueries(['current-user']);
                  }}
                  size="sm" className="bg-green-600 hover:bg-green-700 h-8 px-3"
                >
                  OK
                </Button>
              </div>
            )}
            <div className="flex flex-wrap gap-1.5">
              {user?.master_whatsapp_numbers?.length > 0 ? user.master_whatsapp_numbers.map((phone, idx) => (
                <span key={idx} className="inline-flex items-center gap-1 bg-white border border-green-200 rounded-full px-2 py-0.5 text-xs text-green-800 font-medium">
                  <Phone className="w-3 h-3" />
                  ···{phone.slice(-6)}
                  <button onClick={async () => {
                    await base44.auth.updateMe({ master_whatsapp_numbers: user.master_whatsapp_numbers.filter(p => p !== phone) });
                    queryClient.invalidateQueries(['current-user']);
                  }} className="text-red-400 hover:text-red-600 ml-0.5 font-bold leading-none">×</button>
                </span>
              )) : (
                <p className="text-xs text-green-700 opacity-70">Nenhum número cadastrado</p>
              )}
            </div>
          </div>
        </Card>

        {/* AÇÕES RÁPIDAS - GRID */}
        <div>
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">Acesso Rápido</h2>
          <div className="grid grid-cols-4 gap-2">
            <QuickLink to="Clients" icon={Users} label="Clientes" color="indigo" />
            <QuickLink to="Leads" icon={Target} label="Leads" color="purple" />
            <QuickLink to="TasksUnified" icon={CheckCircle2} label="Tarefas" color="yellow" badge={metrics.pendingTasks > 0 ? metrics.pendingTasks : null} />
            <QuickLink to="WhatsAppHub" icon={MessageSquare} label="WhatsApp" color="green" />
            <QuickLink to="ScheduledAgenda" icon={Calendar} label="Agenda" color="blue" />
            <QuickLink to="CustomDashboard" icon={BarChart3} label="Analytics" color="pink" />
            <QuickLink to="ProposalGenerator" icon={FileText} label="Proposta" color="orange" />
            <QuickLink to="RouteOptimizer" icon={Route} label="Rotas" color="teal" />
          </div>
        </div>

        {/* PIPELINE VISUAL RÁPIDO */}
        <Card className="p-4 bg-white shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              Pipeline de Clientes
            </h2>
            <Link to={createPageUrl('Clients')}>
              <span className="text-xs text-indigo-600 font-semibold hover:underline">Ver todos →</span>
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Link to={createPageUrl('Clients?filter=quente')}>
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center hover:shadow-md transition-all">
                <Flame className="w-5 h-5 text-red-500 mx-auto mb-1" />
                <p className="text-2xl font-black text-red-600">{metrics.hot}</p>
                <p className="text-xs text-red-500 font-semibold">Quentes</p>
                <div className="h-1.5 bg-red-100 rounded-full mt-2">
                  <div className="h-full bg-red-500 rounded-full" style={{ width: `${metrics.total > 0 ? (metrics.hot/metrics.total)*100 : 0}%` }} />
                </div>
              </div>
            </Link>
            <Link to={createPageUrl('Clients?filter=morno')}>
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-center hover:shadow-md transition-all">
                <Thermometer className="w-5 h-5 text-orange-500 mx-auto mb-1" />
                <p className="text-2xl font-black text-orange-600">{metrics.warm}</p>
                <p className="text-xs text-orange-500 font-semibold">Mornos</p>
                <div className="h-1.5 bg-orange-100 rounded-full mt-2">
                  <div className="h-full bg-orange-500 rounded-full" style={{ width: `${metrics.total > 0 ? (metrics.warm/metrics.total)*100 : 0}%` }} />
                </div>
              </div>
            </Link>
            <Link to={createPageUrl('Clients?filter=frio')}>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center hover:shadow-md transition-all">
                <Snowflake className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                <p className="text-2xl font-black text-blue-600">{metrics.cold}</p>
                <p className="text-xs text-blue-500 font-semibold">Frios</p>
                <div className="h-1.5 bg-blue-100 rounded-full mt-2">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${metrics.total > 0 ? (metrics.cold/metrics.total)*100 : 0}%` }} />
                </div>
              </div>
            </Link>
          </div>
        </Card>

        {/* CLIENTES QUENTES - LISTA RÁPIDA */}
        {hotClients.length > 0 && (
          <Card className="p-4 bg-white shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Flame className="w-4 h-4 text-red-500" />
                Clientes Quentes
              </h2>
              <Link to={createPageUrl('Clients?filter=quente')}>
                <span className="text-xs text-indigo-600 font-semibold hover:underline">Ver todos →</span>
              </Link>
            </div>
            <div className="space-y-2">
              {hotClients.slice(0, 5).map(client => (
                <div
                  key={client.id}
                  className="flex items-center gap-3 p-2.5 bg-red-50 rounded-lg cursor-pointer hover:bg-red-100 transition-colors"
                  onClick={() => navigate(createPageUrl(`ClientProfile?id=${client.id}`))}
                >
                  <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {client.first_name?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-slate-900 truncate">{client.first_name}</p>
                    <p className="text-xs text-slate-500 truncate">{client.clinic_name || client.city}</p>
                  </div>
                  {client.phone && (
                    <a
                      href={`https://wa.me/${client.phone}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 hover:bg-green-600 transition-colors"
                    >
                      <MessageSquare className="w-4 h-4 text-white" />
                    </a>
                  )}
                  <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* MOBVENDEDOR - COMPACTO */}
        <Card className="p-3 bg-orange-50 border border-orange-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-orange-600" />
              <span className="font-bold text-orange-900 text-sm">MobVendedor 200km</span>
              <Badge className="bg-orange-600 text-white text-[10px]">Marília</Badge>
            </div>
            <Button
              onClick={async () => {
                const loading = toast.loading('Importando...');
                try {
                  const response = await base44.functions.invoke('importMobVendedorMarilia200km', {
                    cnpj: '13693877000157', mobvendedor_id: '53'
                  });
                  toast.dismiss(loading);
                  if (response.data.success) {
                    toast.success(`✅ ${response.data.synced} importados!`);
                    queryClient.invalidateQueries(['clients']);
                  } else {
                    toast.error('Erro: ' + response.data.error);
                  }
                } catch (error) {
                  toast.dismiss(loading);
                  toast.error('Erro: ' + error.message);
                }
              }}
              size="sm"
              className="bg-orange-600 hover:bg-orange-700 text-xs h-8"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Importar
            </Button>
          </div>
        </Card>

        {/* DICA RÁPIDA */}
        <div className="text-center py-2 border-t border-slate-100">
          <p className="text-xs text-slate-400">
            💡 Use o <strong className="text-green-600">WhatsApp Master</strong> para criar clientes e propostas por voz
          </p>
        </div>
      </div>

      <DocumentsCenter open={docsDialogOpen} onOpenChange={setDocsDialogOpen} />
    </div>
  );
}
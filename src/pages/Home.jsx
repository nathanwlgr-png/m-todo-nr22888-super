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
  Zap
} from 'lucide-react';
import CompleteProfileSearch from '@/components/CompleteProfileSearch';

export default function Home() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchingClinics, setSearchingClinics] = useState(false);
  const [autoSaveProgress, setAutoSaveProgress] = useState(null);

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const data = await base44.entities.Client.list('-updated_date', 100);
      return data.filter(c => c && c.id && c.first_name && !c.is_deleted);
    },
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

      <div className="px-4 py-6 space-y-6">
        {/* 0. BUSCA COMPLETA IA - MÁXIMA PRIORIDADE */}
        <CompleteProfileSearch />

        {/* 1. BUSCA AUTOMÁTICA DE CLÍNICAS - DESTAQUE */}
        <Card className="p-6 bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-300">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                🎯 Buscar Clínicas Próximas
              </h2>
              <p className="text-sm text-slate-700 mb-4">
                Encontra e salva automaticamente clínicas veterinárias próximas a você
              </p>
            </div>
            
            {autoSaveProgress && (
              <div className="p-4 bg-white rounded-lg border border-orange-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-slate-700">Progresso:</span>
                  <span className="text-sm text-slate-600">
                    {autoSaveProgress.saved + autoSaveProgress.skipped} / {autoSaveProgress.total}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div 
                    className="bg-orange-600 h-2 rounded-full transition-all"
                    style={{ 
                      width: `${((autoSaveProgress.saved + autoSaveProgress.skipped) / autoSaveProgress.total) * 100}%` 
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>✅ Salvos: {autoSaveProgress.saved}</span>
                  <span>⏭️ Ignorados: {autoSaveProgress.skipped}</span>
                </div>
              </div>
            )}

            <Button
              onClick={handleAutoSearchAndSave}
              disabled={searchingClinics}
              className="w-full h-14 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-lg font-bold"
            >
              {searchingClinics ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Buscando e Salvando...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5 mr-2" />
                  Buscar e Salvar Automaticamente
                </>
              )}
            </Button>
            <p className="text-xs text-slate-600">
              Usa sua localização GPS para encontrar clínicas próximas e adiciona automaticamente ao CRM
            </p>
          </div>
        </Card>

        {/* 2. MÉTRICAS RÁPIDAS */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4 bg-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                <Users className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{metrics.total}</p>
                <p className="text-xs text-slate-500">Clientes</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 bg-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <Target className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{metrics.hot}</p>
                <p className="text-xs text-slate-500">Quentes</p>
              </div>
            </div>
          </Card>
        </div>

        {/* 3. BUSCA DE CLIENTES */}
        <Card className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar clientes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </Card>

        {/* 4. LISTA DE CLIENTES */}
        {searchTerm && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700">
                Resultados ({filteredClients.length})
              </h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSearchTerm('')}
              >
                Limpar
              </Button>
            </div>
            {filteredClients.map((client) => (
              <Card
                key={client.id}
                className="p-4 cursor-pointer hover:bg-slate-50"
                onClick={() => navigate(createPageUrl(`ClientProfile?id=${client.id}`))}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-800">{client.first_name}</p>
                    <p className="text-xs text-slate-600">
                      {client.clinic_name} • {client.city}
                    </p>
                  </div>
                  <Badge className={
                    client.status === 'quente' ? 'bg-red-500' :
                    client.status === 'morno' ? 'bg-orange-500' :
                    'bg-blue-500'
                  }>
                    {client.status === 'quente' ? '🔥' : client.status === 'morno' ? '🌡️' : '❄️'}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* 5. AÇÕES PRINCIPAIS - ORDEM CRONOLÓGICA */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-700 px-1">📋 Fluxo de Trabalho</h3>
          
          {/* Passo 1: Adicionar Cliente */}
          <Link to={createPageUrl('NewClient')}>
            <Button className="w-full h-14 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 justify-start">
              <div className="flex items-center gap-3 w-full">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-white font-bold">1</span>
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold">Novo Cliente</p>
                  <p className="text-xs opacity-90">Cadastrar manualmente</p>
                </div>
                <UserPlus className="w-5 h-5" />
              </div>
            </Button>
          </Link>

          {/* Passo 2: Ver Todos os Clientes */}
          <Link to={createPageUrl('Clients')}>
            <Button variant="outline" className="w-full h-14 border-2 justify-start">
              <div className="flex items-center gap-3 w-full">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                  <span className="font-bold text-slate-700">2</span>
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold">Ver Todos os Clientes</p>
                  <p className="text-xs text-slate-600">Lista completa</p>
                </div>
                <Users className="w-5 h-5" />
              </div>
            </Button>
          </Link>

          {/* Passo 3: Agendar Visita */}
          <Link to={createPageUrl('ScheduledAgenda')}>
            <Button variant="outline" className="w-full h-14 border-2 justify-start">
              <div className="flex items-center gap-3 w-full">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                  <span className="font-bold text-slate-700">3</span>
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold">Agendar Visitas</p>
                  <p className="text-xs text-slate-600">Programar agenda</p>
                </div>
                <Calendar className="w-5 h-5" />
              </div>
            </Button>
          </Link>

          {/* Passo 4: Checklist Pré-Visita */}
          <Link to={createPageUrl('PreVisitChecklist')}>
            <Button variant="outline" className="w-full h-14 border-2 border-blue-200 justify-start">
              <div className="flex items-center gap-3 w-full">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="font-bold text-blue-700">4</span>
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-blue-700">Checklist Pré-Visita</p>
                  <p className="text-xs text-blue-600">Preparação</p>
                </div>
                <CheckCircle2 className="w-5 h-5 text-blue-600" />
              </div>
            </Button>
          </Link>

          {/* Passo 5: Registrar Pós-Visita */}
          <Link to={createPageUrl('PostVisitAnalysis')}>
            <Button variant="outline" className="w-full h-14 border-2 border-green-200 justify-start">
              <div className="flex items-center gap-3 w-full">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="font-bold text-green-700">5</span>
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-green-700">Registrar Pós-Visita</p>
                  <p className="text-xs text-green-600">Resultado da visita</p>
                </div>
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
            </Button>
          </Link>

          {/* Passo 6: Análise e Relatórios */}
          <Link to={createPageUrl('SalesAnalytics')}>
            <Button variant="outline" className="w-full h-14 border-2 justify-start">
              <div className="flex items-center gap-3 w-full">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                  <span className="font-bold text-slate-700">6</span>
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold">Dashboard de Vendas</p>
                  <p className="text-xs text-slate-600">Análise e métricas</p>
                </div>
                <TrendingUp className="w-5 h-5" />
              </div>
            </Button>
          </Link>
        </div>

        {/* 6. FERRAMENTAS EXTRAS */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-700 px-1">🛠️ Ferramentas</h3>
          
          <div className="grid grid-cols-2 gap-3">
            <Link to={createPageUrl('WhatsAppDataAccess')}>
              <Button className="w-full h-16 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
                <div className="text-left w-full">
                  <MessageSquare className="w-5 h-5 mb-1" />
                  <p className="text-xs font-semibold">WhatsApp</p>
                </div>
              </Button>
            </Link>

            <Link to={createPageUrl('Tasks')}>
              <Button variant="outline" className="w-full h-16 border-2">
                <div className="text-left w-full">
                  <Target className="w-5 h-5 mb-1" />
                  <p className="text-xs font-semibold">Tarefas</p>
                </div>
              </Button>
            </Link>

            <Link to={createPageUrl('ClientsByCity')}>
              <Button variant="outline" className="w-full h-16 border-2">
                <div className="text-left w-full">
                  <MapPin className="w-5 h-5 mb-1" />
                  <p className="text-xs font-semibold">Por Cidade</p>
                </div>
              </Button>
            </Link>

            <Link to={createPageUrl('AdvancedReports')}>
              <Button variant="outline" className="w-full h-16 border-2">
                <div className="text-left w-full">
                  <FileText className="w-5 h-5 mb-1" />
                  <p className="text-xs font-semibold">Relatórios</p>
                </div>
              </Button>
            </Link>
          </div>
        </div>

        {/* 7. DEMO E CONFIGURAÇÕES */}
        <div className="grid grid-cols-2 gap-3">
          <Link to={createPageUrl('CampaignDemo')}>
            <Button variant="outline" className="w-full h-12 border-2">
              <Play className="w-4 h-4 mr-2" />
              Ver Demo
            </Button>
          </Link>

          <Link to={createPageUrl('AIAssistant')}>
            <Button className="w-full h-12 bg-purple-600 hover:bg-purple-700">
              <Sparkles className="w-4 h-4 mr-2" />
              Assistente IA
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, MapPin, Phone, Calendar, Loader2, Navigation,
  Users, Target, Zap, TrendingUp, Clock, Star, Building2,
  MessageCircle, Edit, ChevronRight, CheckCircle, Map
} from 'lucide-react';
import AIRouteOptimizer from '@/components/AIRouteOptimizer';
import AgendaComandoPanel from '@/components/AgendaComandoPanel';
import GPSClinicaRadar from '@/components/GPSClinicaRadar';
import VincularTelefones from '@/components/VincularTelefones';
import FloatingInfoCard from '@/components/FloatingInfoCard';
import ContextualChatIA from '@/components/ContextualChatIA';
import GoogleCalendarSync from '@/components/GoogleCalendarSync';

const STATUS_COLOR = {
  quente: 'bg-red-100 text-red-700 border-red-300',
  morno: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  frio: 'bg-blue-100 text-blue-700 border-blue-300',
};

const PIPELINE_LABEL = {
  lead: '🌱 Lead', qualificado: '⭐ Qualificado', proposta: '📄 Proposta',
  negociacao: '🤝 Negociação', fechado: '✅ Fechado', perdido: '❌ Perdido',
};

const VISIT_OBJ = {
  diagnosticar_necessidades: '🔍 Diagnóstico',
  apresentar_equipamento: '📊 Apresentação',
  demonstracao_tecnica: '🔬 Demo',
  negociar_proposta: '💼 Negociação',
  fechar_venda: '✅ Fechamento',
};

export default function ScheduledAgenda() {
  const navigate = useNavigate();
  const [optimizedData, setOptimizedData] = useState(null);
  const [abaAtiva, setAbaAtiva] = useState('agenda'); // agenda | gps | contatos | ia
  const [floatingInfo, setFloatingInfo] = useState(null); // { titulo, content, clienteId }
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [visitaEmAndamento, setVisitaEmAndamento] = useState(null);

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients-agenda'],
    queryFn: () => base44.entities.Client.list('-priority_level'),
  });

  const { data: visits = [] } = useQuery({
    queryKey: ['visits-agenda'],
    queryFn: () => base44.entities.Visit.filter({ status: 'agendada' }),
  });

  const cityOrder = ['Marília', 'Bauru', 'Jaú', 'Lins', 'Botucatu', 'Ourinhos', 'Assis', 'Tupã'];

  const clientsByCity = useMemo(() => {
    let filtered = clients.filter(c => filtroStatus === 'todos' || c.status === filtroStatus);

    if (optimizedData?.daily_routes) {
      return optimizedData.daily_routes.map(dr => ({
        city: dr.day_label,
        clients: dr.clients.map(c => clients.find(cl => cl.id === c.id)).filter(Boolean),
        aiOptimized: true,
        dayInfo: dr,
      }));
    }

    const grouped = {};
    filtered.forEach(c => {
      const city = c.city || 'Sem cidade';
      if (!grouped[city]) grouped[city] = [];
      grouped[city].push(c);
    });

    Object.keys(grouped).forEach(city => {
      grouped[city].sort((a, b) => (a.priority_level || 999) - (b.priority_level || 999));
    });

    const ordered = cityOrder.filter(c => grouped[c]);
    const others = Object.keys(grouped).filter(c => !cityOrder.includes(c)).sort();
    return [...ordered, ...others].map(city => ({ city, clients: grouped[city] }));
  }, [clients, optimizedData, filtroStatus]);

  const stats = useMemo(() => ({
    total: clients.length,
    quentes: clients.filter(c => c.status === 'quente').length,
    cidades: [...new Set(clients.map(c => c.city).filter(Boolean))].length,
    visitas_agendadas: visits.length,
    potencial: clients.filter(c => ['negociacao', 'proposta'].includes(c.pipeline_stage)).length,
  }), [clients, visits]);

  const abrirFloating = (titulo, content, clienteId) => {
    setFloatingInfo({ titulo, content, clienteId });
  };

  const abasConfig = [
    { id: 'agenda', icon: Calendar, label: 'Agenda' },
    { id: 'gcal', icon: Calendar, label: 'GCal' },
    { id: 'chat', icon: MessageCircle, label: 'Chat IA' },
    { id: 'gps', icon: Navigation, label: 'GPS' },
    { id: 'ia', icon: Zap, label: 'Rota IA' },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">

      {/* ═══ FLOATING INFO CARD ═══ */}
      {floatingInfo && (
        <FloatingInfoCard
          titulo={floatingInfo.titulo}
          onFechar={() => setFloatingInfo(null)}
          onEditar={floatingInfo.clienteId ? () => { navigate(createPageUrl(`ClientProfile?id=${floatingInfo.clienteId}`)); setFloatingInfo(null); } : null}
          autoClose={10000}
        >
          {floatingInfo.content}
        </FloatingInfoCard>
      )}

      {/* ═══ HEADER ═══ */}
      <div className="bg-gradient-to-br from-indigo-700 to-purple-700 px-4 pt-4 pb-20 rounded-b-3xl">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-white/20">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <Navigation className="w-5 h-5 text-yellow-300" />
              Agenda & GPS
            </h1>
            <p className="text-indigo-200 text-xs">Roteiro inteligente · GPS automático · Vinculação de contatos</p>
          </div>
        </div>

        {/* Stats rápidos */}
        <div className="grid grid-cols-5 gap-2">
          {[
            { label: 'Clientes', value: stats.total, icon: Users, color: 'text-white' },
            { label: 'Quentes', value: stats.quentes, icon: Target, color: 'text-red-300' },
            { label: 'Cidades', value: stats.cidades, icon: MapPin, color: 'text-blue-300' },
            { label: 'Agendadas', value: stats.visitas_agendadas, icon: Calendar, color: 'text-green-300' },
            { label: 'Potencial', value: stats.potencial, icon: TrendingUp, color: 'text-yellow-300' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="text-center">
              <Icon className={`w-4 h-4 mx-auto mb-0.5 ${color}`} />
              <p className="text-white font-bold text-base leading-none">{value}</p>
              <p className="text-indigo-300 text-xs">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ TABS ═══ */}
      <div className="sticky top-0 z-30 bg-white border-b shadow-sm">
        <div className="flex">
          {abasConfig.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setAbaAtiva(id)}
              className={`flex-1 py-2.5 flex flex-col items-center gap-0.5 text-xs font-medium transition-colors ${
                abaAtiva === id
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 -mt-8 space-y-3 pt-2">

        {/* ══ ABA AGENDA ══ */}
        {abaAtiva === 'agenda' && (
          <>
            {/* Agenda Inteligente por comando */}
            <Card className="mt-8 shadow-lg">
              <CardContent className="pt-3 pb-3">
                <AgendaComandoPanel />
              </CardContent>
            </Card>

            {/* Filtro rápido */}
            <div className="flex gap-2 mt-1">
              {['todos', 'quente', 'morno', 'frio'].map(s => (
                <button
                  key={s}
                  onClick={() => setFiltroStatus(s)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    filtroStatus === s
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white border border-slate-200 text-slate-600'
                  }`}
                >
                  {s === 'todos' ? 'Todos' : s === 'quente' ? '🔥 Quentes' : s === 'morno' ? '🌤️ Mornos' : '❄️ Frios'}
                </button>
              ))}
            </div>

            {/* Visitas agendadas hoje */}
            {visits.length > 0 && (() => {
              const hoje = new Date().toISOString().split('T')[0];
              const hoje_visits = visits.filter(v => v.scheduled_date?.startsWith(hoje));
              if (hoje_visits.length === 0) return null;
              return (
                <Card className="border-green-300 bg-green-50">
                  <CardHeader className="pb-1 pt-3">
                    <CardTitle className="text-xs text-green-800 flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5" /> Visitas de Hoje ({hoje_visits.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 pb-3 space-y-1.5">
                    {hoje_visits.map(v => (
                      <div key={v.id} className="flex items-center gap-2 bg-white rounded-lg p-2 border border-green-200">
                        <Clock className="w-3 h-3 text-green-600 shrink-0" />
                        <span className="text-xs font-medium text-green-800">{v.scheduled_date?.split('T')[1]?.slice(0,5)}</span>
                        <span className="text-xs text-slate-700 flex-1">{v.client_name}</span>
                        <button
                          onClick={() => abrirFloating(`Visita: ${v.client_name}`,
                            <div className="space-y-1 text-sm">
                              <p><span className="font-medium">Tipo:</span> {v.visit_type}</p>
                              <p><span className="font-medium">Local:</span> {v.location || 'N/A'}</p>
                              <p><span className="font-medium">Notas:</span> {v.notes || 'Sem notas'}</p>
                            </div>,
                            v.client_id
                          )}
                          className="text-indigo-500 hover:text-indigo-700"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              );
            })()}

            {/* Cidades e clientes */}
            {clientsByCity.map(({ city, clients: cityClients, aiOptimized, dayInfo }, cityIndex) => (
              <div key={city}>
                {/* Cabeçalho cidade */}
                <button
                  className="w-full flex items-center gap-2 py-2 px-1"
                  onClick={() => abrirFloating(
                    `📍 ${city}`,
                    <div className="text-sm space-y-1">
                      <p>👥 {cityClients.length} clientes cadastrados</p>
                      <p>🔥 {cityClients.filter(c => c.status === 'quente').length} quentes</p>
                      <p>💼 {cityClients.filter(c => ['negociacao','proposta'].includes(c.pipeline_stage)).length} em negociação/proposta</p>
                      {dayInfo?.total_distance_day && <p>🛣️ {dayInfo.total_distance_day} km estimados</p>}
                    </div>
                  )}
                >
                  <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-white">{cityIndex + 1}</span>
                  </div>
                  <MapPin className="w-4 h-4 text-indigo-500" />
                  <span className="font-semibold text-slate-800 flex-1 text-left">{city}</span>
                  {aiOptimized && <Badge className="bg-purple-100 text-purple-700 text-xs">✨ IA</Badge>}
                  <Badge variant="outline" className="text-xs">{cityClients.length}</Badge>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>

                {/* Clientes da cidade */}
                <div className="space-y-2 pl-9">
                  {cityClients.map((client, ci) => (
                    <Card
                      key={client.id}
                      className="shadow-sm hover:shadow-md transition-shadow"
                    >
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          {/* Número de ordem */}
                          <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                            <span className="text-xs font-bold text-slate-500">{cityIndex+1}.{ci+1}</span>
                          </div>

                          <div className="flex-1 min-w-0">
                            {/* Nome + status */}
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="font-semibold text-slate-800 text-sm">{client.first_name}</span>
                              {client.status && (
                                <Badge className={`text-xs px-1.5 py-0 ${STATUS_COLOR[client.status]}`}>{client.status}</Badge>
                              )}
                              {client.purchase_score > 0 && (
                                <span className="text-xs text-slate-500">{client.purchase_score}%</span>
                              )}
                            </div>

                            {/* Clínica */}
                            {client.clinic_name && (
                              <p className="text-xs text-slate-500 flex items-center gap-1 mb-1">
                                <Building2 className="w-3 h-3" />{client.clinic_name}
                              </p>
                            )}

                            {/* Pipeline + Objetivo */}
                            <div className="flex gap-1.5 flex-wrap mb-1">
                              {client.pipeline_stage && (
                                <Badge variant="outline" className="text-xs py-0">
                                  {PIPELINE_LABEL[client.pipeline_stage] || client.pipeline_stage}
                                </Badge>
                              )}
                              {client.visit_objective && (
                                <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200 text-xs py-0">
                                  {VISIT_OBJ[client.visit_objective] || client.visit_objective}
                                </Badge>
                              )}
                            </div>

                            {/* Barra de score */}
                            {client.purchase_score > 0 && (
                              <div className="h-1 bg-slate-100 rounded-full overflow-hidden w-full mt-1">
                                <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                                  style={{ width: `${client.purchase_score}%` }} />
                              </div>
                            )}

                            {/* Melhor dia numerológico */}
                            {client.melhores_dias_venda?.some(d => {
                              const diff = Math.abs(new Date(d) - new Date()) / 86400000;
                              return diff < 2;
                            }) && (
                              <Badge className="mt-1 text-xs bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0">
                                ⭐ Melhor dia numerológico!
                              </Badge>
                            )}
                          </div>

                          {/* Ações rápidas */}
                          <div className="flex flex-col gap-1 shrink-0">
                            {/* Ver detalhes (floating) */}
                            <button
                              onClick={() => abrirFloating(
                                `${client.first_name} ${client.clinic_name ? '· ' + client.clinic_name : ''}`,
                                <div className="space-y-2 text-sm">
                                  <div className="grid grid-cols-2 gap-1">
                                    {[
                                      ['Status', client.status],
                                      ['Score', `${client.purchase_score || 0}%`],
                                      ['Cidade', client.city],
                                      ['Tipo', client.client_type],
                                      ['Pipeline', client.pipeline_stage],
                                      ['Último contato', client.last_contact_date || 'N/A'],
                                    ].filter(([,v]) => v).map(([k,v]) => (
                                      <div key={k}><span className="text-slate-400 text-xs">{k}:</span><br/><span className="font-medium text-xs">{v}</span></div>
                                    ))}
                                  </div>
                                  {client.main_pains?.length > 0 && (
                                    <p className="text-xs text-slate-600">🎯 Dores: {client.main_pains.join(', ')}</p>
                                  )}
                                  {client.next_action && (
                                    <p className="text-xs text-indigo-600">→ {client.next_action}</p>
                                  )}
                                  {client.phone && (
                                    <a href={`https://wa.me/${client.phone}`} target="_blank" rel="noreferrer"
                                      className="flex items-center gap-1 text-xs text-green-600 font-medium">
                                      <MessageCircle className="w-3 h-3" /> Abrir WhatsApp
                                    </a>
                                  )}
                                </div>,
                                client.id
                              )}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-indigo-100 text-slate-600 hover:text-indigo-700"
                              title="Ver detalhes"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>

                            {/* WhatsApp direto */}
                            {client.phone && (
                              <a href={`https://wa.me/${client.phone}`} target="_blank" rel="noreferrer"
                                className="p-1.5 rounded-lg bg-green-50 hover:bg-green-100 text-green-600"
                                title="WhatsApp"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </a>
                            )}

                            {/* Editar perfil */}
                            <button
                              onClick={() => navigate(createPageUrl(`ClientProfile?id=${client.id}`))}
                              className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600"
                              title="Editar perfil"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}

            {clientsByCity.length === 0 && (
              <div className="text-center py-12 text-slate-400 mt-8">
                <MapPin className="w-12 h-12 mx-auto mb-3 text-slate-200" />
                <p>Nenhum cliente encontrado para este filtro</p>
              </div>
            )}
          </>
        )}

        {/* ══ ABA GOOGLE CALENDAR ══ */}
        {abaAtiva === 'gcal' && (
          <div className="mt-8">
            <GoogleCalendarSync />
          </div>
        )}

        {/* ══ ABA CHAT IA ══ */}
        {abaAtiva === 'chat' && (
          <div className="mt-8" style={{ height: 'calc(100vh - 220px)' }}>
            <ContextualChatIA clients={clients} />
          </div>
        )}

        {/* ══ ABA GPS ══ */}
        {abaAtiva === 'gps' && (
          <div className="mt-8 space-y-3">
            <Card className="bg-indigo-50 border-indigo-200">
              <CardContent className="pt-3 pb-3">
                <p className="text-xs font-semibold text-indigo-800 mb-1">🛰️ Como funciona o GPS Automático:</p>
                <ul className="text-xs text-indigo-700 space-y-0.5">
                  <li>• Ative o GPS e ele monitora sua localização</li>
                  <li>• Ao parar por 2+ minutos, detecta automaticamente</li>
                  <li>• Mostra as clínicas do CRM mais próximas</li>
                  <li>• Registra a visita com perguntas contextuais</li>
                  <li>• Você pode registrar novas clínicas descobertas</li>
                </ul>
              </CardContent>
            </Card>
            <GPSClinicaRadar clients={clients} />
          </div>
        )}

        {/* ══ ABA CONTATOS ══ */}
        {abaAtiva === 'contatos' && (
          <div className="mt-8 space-y-3">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-3 pb-3">
                <p className="text-xs font-semibold text-blue-800 mb-1">📱 Vinculação de Contatos:</p>
                <ul className="text-xs text-blue-700 space-y-0.5">
                  <li>• Cole números salvos no celular com apelidos/nomes</li>
                  <li>• O sistema vincula com clientes do CRM por número OU nome</li>
                  <li>• Cole mensagens recebidas para análise instantânea</li>
                  <li>• Receba a resposta ideal para cada mensagem</li>
                </ul>
              </CardContent>
            </Card>
            <VincularTelefones />
          </div>
        )}

        {/* ══ ABA ROTA IA ══ */}
        {abaAtiva === 'ia' && (
          <div className="mt-8">
            <AIRouteOptimizer clients={clients} onRouteOptimized={(data) => { setOptimizedData(data); setAbaAtiva('agenda'); }} />
          </div>
        )}

      </div>
    </div>
  );
}
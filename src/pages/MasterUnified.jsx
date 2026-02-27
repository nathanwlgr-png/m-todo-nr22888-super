import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Send, Loader2, Sparkles, Brain, Target, RotateCcw, TrendingUp,
  MessageCircle, CheckSquare, FileText, Search, Handshake, HelpCircle,
  Navigation, MapPin, X, Copy, Check, ChevronDown, ChevronUp,
  BarChart3, Award, Zap, RefreshCw, Bell, Calendar, Package, Users,
  Phone, Globe, Upload, ArrowRight, Plus, Settings
} from 'lucide-react';
import { toast } from 'sonner';
import ChatMessage from '@/components/ChatMessage';
import Papa from 'papaparse';

const QUICK_ACTIONS = [
  { type: 'presentation', icon: Handshake, label: 'Apresentar', color: 'bg-green-50' },
  { type: 'insights', icon: Brain, label: 'Insights', color: 'bg-pink-50' },
  { type: 'prospecting', icon: Search, label: 'Prospecção', color: 'bg-purple-50' },
  { type: 'question', icon: HelpCircle, label: 'SPIN', color: 'bg-indigo-50' },
  { type: 'objection', icon: MessageCircle, label: 'Objeções', color: 'bg-red-50' },
  { type: 'proposal', icon: FileText, label: 'Proposta', color: 'bg-orange-50' },
  { type: 'closing', icon: Target, label: 'Fechamento', color: 'bg-emerald-50' },
];

const TABS = [
  { id: 'dashboard', icon: BarChart3, label: 'Dashboard' },
  { id: 'clientes', icon: Users, label: 'Clientes' },
  { id: 'importacao', icon: Upload, label: 'Importação' },
  { id: 'chat', icon: MessageCircle, label: 'Chat IA' },
  { id: 'score', icon: Sparkles, label: 'Análises' },
  { id: 'agenda', icon: Calendar, label: 'Agenda' },
  { id: 'rotas', icon: MapPin, label: 'Rotas' },
];

export default function MasterUnified() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('dashboard');
  const [clientId, setClientId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [script, setScript] = useState(null);
  const [csvData, setCsvData] = useState([]);
  const [importResult, setImportResult] = useState(null);

  // ─────── DADOS ───────
  const { data: allClients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-updated_date'),
    staleTime: 60000,
  });

  const { data: leads = [] } = useQuery({
    queryKey: ['leads'],
    queryFn: () => base44.entities.Lead?.list?.() || [],
  });

  const client = allClients.find(c => c.id === clientId);

  const { data: visits = [] } = useQuery({
    queryKey: ['visits', clientId],
    queryFn: () => base44.entities.Visit.filter({ client_id: clientId }),
    enabled: !!clientId,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', clientId],
    queryFn: () => base44.entities.Task.filter({ client_id: clientId }),
    enabled: !!clientId,
  });

  const importMutation = useMutation({
    mutationFn: async () => {
      const res = await base44.functions.invoke('bulkClientImportAI', {
        clients_data: csvData,
        convert_leads: true
      });
      return res.data;
    },
    onSuccess: (data) => {
      setImportResult(data);
      queryClient.invalidateQueries(['clients']);
      toast.success(`${data.total_created} clientes importados!`);
    }
  });

  // ─────── CHAT IA ───────
  const sendMsg = async (msg) => {
    if (!msg.trim()) return;
    setMessages(p => [...p, { role: 'user', content: msg }]);
    setInput('');
    setLoading(true);
    
    try {
      const ctx = client ? `Cliente: ${client.first_name} | Clínica: ${client.clinic_name} | Score: ${client.purchase_score}%` : 'Análise geral';
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `${ctx}\n\nPergunta: ${msg}\n\nResponda em português, estruturado com markdown.`
      });
      setMessages(p => [...p, { role: 'assistant', content: res }]);
    } catch (e) {
      toast.error('Erro ao processar');
    } finally {
      setLoading(false);
    }
  };

  // ─────── AÇÃO RÁPIDA ───────
  const quickAction = async (type) => {
    if (!client) {
      toast.error('Selecione um cliente');
      return;
    }

    setLoading(true);
    try {
      const prompts = {
        presentation: `Script completo para apresentar produto para ${client.first_name}`,
        insights: `Análise psicológica profunda do cliente ${client.first_name}`,
        prospecting: `Estratégia de prospecção para ${client.first_name}`,
        question: `Perguntas SPIN Selling personalizadas`,
        objection: `Como responder às objeções comuns`,
        proposal: `Proposta comercial estruturada com ROI`,
        closing: `Técnicas de fechamento personalizadas`,
      };

      const res = await base44.integrations.Core.InvokeLLM({
        prompt: prompts[type] + '\n\nRESPOSTA COMPLETA E ESTRUTURADA.'
      });
      
      setScript({ type, content: res });
      toast.success('✅ Conteúdo gerado!');
    } catch (e) {
      toast.error('Erro ao gerar');
    } finally {
      setLoading(false);
    }
  };

  // ─────── IMPORTAÇÃO ───────
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setCsvData(results.data);
        toast.success(`${results.data.length} registros carregados`);
      },
      error: (error) => {
        toast.error(`Erro ao ler: ${error.message}`);
      }
    });
  };

  // ─────── STATS ───────
  const stats = [
    { label: 'Clientes', value: allClients.length, icon: Users, color: 'from-blue-500 to-cyan-600' },
    { label: 'Leads', value: leads.length, icon: Sparkles, color: 'from-purple-500 to-pink-600' },
    { label: 'Score Médio', value: Math.round(allClients.reduce((a, c) => a + (c.purchase_score || 0), 0) / allClients.length || 0) + '%', icon: BarChart3, color: 'from-orange-500 to-red-600' },
    { label: 'Hot', value: allClients.filter(c => c.status === 'quente').length, icon: TrendingUp, color: 'from-red-500 to-orange-600' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* ═══ HEADER ═══ */}
      <div className="bg-gradient-to-r from-indigo-700 via-purple-600 to-pink-600 px-6 py-4 sticky top-0 z-20 shadow-xl">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-white font-bold text-2xl flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-yellow-300" />
                Master Unified CRM
              </h1>
              <p className="text-indigo-100 text-sm mt-1">Chat IA + Clientes + Importação + Análises unificadas</p>
            </div>
            {client && (
              <div className="text-right text-white">
                <p className="font-semibold">{client.first_name}</p>
                <Badge className={`mt-1 ${client.status === 'quente' ? 'bg-red-500' : 'bg-yellow-500'}`}>
                  {client.purchase_score || 0}% · {client.status}
                </Badge>
              </div>
            )}
          </div>

          {/* Seletor de Cliente */}
          <Select value={clientId || ''} onValueChange={(v) => setClientId(v || null)}>
            <SelectTrigger className="bg-white/20 border-white/30 text-white">
              <SelectValue placeholder="🔍 Selecione um cliente..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>— Sem cliente —</SelectItem>
              {allClients.map(c => (
                <SelectItem key={c.id} value={c.id}>
                  {c.first_name} {c.clinic_name ? `· ${c.clinic_name}` : ''} {c.purchase_score ? `· ${c.purchase_score}%` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ═══ TABS ═══ */}
      <div className="bg-white border-b sticky top-[120px] z-10 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-1 overflow-x-auto">
            {TABS.map(t => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${
                    tab === t.id
                      ? 'border-indigo-600 text-indigo-700 bg-indigo-50'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══ CONTENT ═══ */}
      <div className="max-w-7xl mx-auto p-6 space-y-6">

        {/* ─ DASHBOARD ─ */}
        {tab === 'dashboard' && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {stats.map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <Card key={i} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm text-slate-500 mb-1">{stat.label}</p>
                          <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
                        </div>
                        <div className={`bg-gradient-to-br ${stat.color} p-3 rounded-lg`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Quick Stats */}
            {client && (
              <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-indigo-600" />
                    Análise do Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-white/70 rounded p-3">
                      <p className="text-xs text-slate-600">Score Compra</p>
                      <p className="text-lg font-bold text-indigo-600">{client.purchase_score || 0}%</p>
                    </div>
                    <div className="bg-white/70 rounded p-3">
                      <p className="text-xs text-slate-600">Health Score</p>
                      <p className="text-lg font-bold text-green-600">{client.health_score || 0}%</p>
                    </div>
                    <div className="bg-white/70 rounded p-3">
                      <p className="text-xs text-slate-600">Visitas</p>
                      <p className="text-lg font-bold text-blue-600">{visits.length}</p>
                    </div>
                    <div className="bg-white/70 rounded p-3">
                      <p className="text-xs text-slate-600">Tarefas</p>
                      <p className="text-lg font-bold text-orange-600">{tasks.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* ─ CLIENTES ─ */}
        {tab === 'clientes' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Carteira de Clientes</h2>
              <Button size="sm" variant="outline" onClick={() => setTab('importacao')}>
                <Plus className="w-4 h-4 mr-1" /> Importar
              </Button>
            </div>
            <div className="grid gap-3">
              {allClients.slice(0, 10).map(c => (
                <div
                  key={c.id}
                  onClick={() => setClientId(c.id)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    clientId === c.id ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-slate-900">{c.first_name}</p>
                      <p className="text-sm text-slate-600">{c.clinic_name || 'Sem clínica'} · {c.city}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">{c.status}</Badge>
                        <Badge className="text-xs bg-indigo-100 text-indigo-700">{c.purchase_score || 0}%</Badge>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-indigo-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─ IMPORTAÇÃO ─ */}
        {tab === 'importacao' && (
          <div className="space-y-4">
            {!importResult ? (
              <Tabs defaultValue="csv" className="space-y-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="csv">Upload CSV</TabsTrigger>
                  <TabsTrigger value="manual">Cadastro Manual</TabsTrigger>
                </TabsList>

                <TabsContent value="csv">
                  <Card>
                    <CardContent className="p-6 space-y-4">
                      <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
                        <input
                          type="file"
                          accept=".csv"
                          onChange={handleFileUpload}
                          className="hidden"
                          id="csv-upload"
                        />
                        <label htmlFor="csv-upload" className="cursor-pointer block">
                          <Upload className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                          <p className="font-semibold text-slate-900">Clique para selecionar ou arraste</p>
                          <p className="text-xs text-slate-500 mt-1">.csv até 10MB</p>
                        </label>
                      </div>

                      {csvData.length > 0 && (
                        <>
                          <p className="text-sm text-slate-600">
                            ✅ {csvData.length} registros carregados
                          </p>
                          <Button
                            onClick={() => importMutation.mutate()}
                            disabled={importMutation.isPending}
                            className="w-full bg-indigo-600 hover:bg-indigo-700"
                          >
                            {importMutation.isPending ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Importando...
                              </>
                            ) : (
                              <>
                                <Zap className="w-4 h-4 mr-2" />
                                Importar {csvData.length} Clientes
                              </>
                            )}
                          </Button>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="manual">
                  <Card>
                    <CardContent className="p-6">
                      <Button onClick={() => setCsvData([...csvData, {}])} className="w-full mb-4">
                        + Adicionar Cliente
                      </Button>
                      {csvData.length > 0 && (
                        <p className="text-sm text-slate-600">{csvData.length} clientes preparados</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            ) : (
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50">
                <CardHeader>
                  <CardTitle className="text-green-700">✅ Importação Concluída!</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white rounded p-3 text-center">
                      <p className="text-2xl font-bold text-green-600">{importResult.total_created}</p>
                      <p className="text-xs text-slate-600">Criados</p>
                    </div>
                    <div className="bg-white rounded p-3 text-center">
                      <p className="text-2xl font-bold text-amber-600">{importResult.total_duplicates}</p>
                      <p className="text-xs text-slate-600">Duplicatas</p>
                    </div>
                    <div className="bg-white rounded p-3 text-center">
                      <p className="text-2xl font-bold text-blue-600">{importResult.leads_converted}</p>
                      <p className="text-xs text-slate-600">Convertidos</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      setCsvData([]);
                      setImportResult(null);
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    Nova Importação
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* ─ CHAT IA ─ */}
        {tab === 'chat' && (
          <div className="space-y-4">
            {/* Ações Rápidas */}
            <div className="grid grid-cols-2 md:grid-cols-7 gap-2">
              {QUICK_ACTIONS.map(({ type, icon: Icon, label, color }) => (
                <Button
                  key={type}
                  onClick={() => quickAction(type)}
                  disabled={!client || loading}
                  variant="outline"
                  className={`flex flex-col h-auto py-3 ${color}`}
                >
                  <Icon className="w-4 h-4 mb-1" />
                  <span className="text-xs">{label}</span>
                </Button>
              ))}
            </div>

            {/* Script gerado */}
            {script && (
              <Card className="bg-indigo-50 border-indigo-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{script.type.toUpperCase()}</CardTitle>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        navigator.clipboard.writeText(script.content);
                        toast.success('Copiado!');
                      }}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="text-xs whitespace-pre-wrap max-h-48 overflow-y-auto bg-white/70 rounded p-3">
                  {script.content}
                </CardContent>
              </Card>
            )}

            {/* Chat */}
            <Card className="h-96 flex flex-col">
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>Chat vazio. Comece a conversar!</p>
                  </div>
                ) : (
                  messages.map((m, i) => (
                    <ChatMessage key={i} message={m.content || m} isUser={m.role === 'user'} />
                  ))
                )}
                {loading && (
                  <div className="flex justify-start">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                  </div>
                )}
              </CardContent>

              {/* Input */}
              <div className="border-t p-3 space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !loading && sendMsg(input)}
                    placeholder="Digite sua pergunta..."
                    disabled={loading}
                    className="flex-1"
                  />
                  <Button
                    onClick={() => sendMsg(input)}
                    disabled={loading || !input.trim()}
                    className="bg-indigo-600"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* ─ ANÁLISES ─ */}
        {tab === 'score' && (
          <Card>
            <CardHeader>
              <CardTitle>📊 Análises e Métricas</CardTitle>
            </CardHeader>
            <CardContent>
              {client ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-indigo-50 rounded-lg">
                    <p className="text-xs text-slate-600 mb-1">Score Compra</p>
                    <p className="text-2xl font-bold text-indigo-600">{client.purchase_score || 0}%</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-xs text-slate-600 mb-1">Health</p>
                    <p className="text-2xl font-bold text-green-600">{client.health_score || 0}%</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-xs text-slate-600 mb-1">Engagement</p>
                    <p className="text-2xl font-bold text-blue-600">{client.engagement_score || 0}%</p>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <p className="text-xs text-slate-600 mb-1">Pipeline</p>
                    <p className="text-2xl font-bold text-orange-600 capitalize">{client.pipeline_stage || '-'}</p>
                  </div>
                </div>
              ) : (
                <p className="text-slate-500 text-center py-8">Selecione um cliente para ver análises</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* ─ AGENDA ─ */}
        {tab === 'agenda' && (
          <Card>
            <CardHeader>
              <CardTitle>📅 Agenda</CardTitle>
            </CardHeader>
            <CardContent>
              {client ? (
                <div className="space-y-3">
                  <p className="text-sm text-slate-600">Próximas visitas e tarefas:</p>
                  <div className="space-y-2">
                    {visits.slice(0, 5).map((v, i) => (
                      <div key={i} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <p className="text-sm font-medium">{new Date(v.scheduled_date).toLocaleDateString()}</p>
                        <p className="text-xs text-slate-600">{v.visit_type}</p>
                      </div>
                    ))}
                    {visits.length === 0 && <p className="text-xs text-slate-400">Sem visitas agendadas</p>}
                  </div>
                </div>
              ) : (
                <p className="text-slate-500 text-center py-8">Selecione um cliente</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* ─ ROTAS ─ */}
        {tab === 'rotas' && (
          <Card>
            <CardHeader>
              <CardTitle>🗺️ Rotas Otimizadas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 text-center py-8">Módulo de rotas</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
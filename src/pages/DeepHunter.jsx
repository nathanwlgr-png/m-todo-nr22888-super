import React, { useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search, MapPin, Globe, MessageCircle, TrendingUp, AlertTriangle,
  Zap, Eye, Clock, DollarSign, Users, Loader2, Download, RefreshCw,
  Smartphone, MapPinned, Copy, ExternalLink, Target, Sparkles, Plus, X
} from 'lucide-react';
import { toast } from 'sonner';

const SIGNAL_LABELS = {
  novo: '🆕 Nova Empresa',
  contratando: '👥 Contratando',
  expansao: '📈 Expansão',
  reinauguracao: '🎉 Reinauguração',
  pressao_financeira: '⚠️ Pressão Financeira',
  crescimento: '🚀 Crescimento',
  novo_lab: '🔬 Novo Laboratório',
  novo_equipamento: '⚙️ Novo Equipamento'
};

const PRIORITY_COLORS = {
  normal: 'bg-slate-200 text-slate-800',
  potencial: 'bg-blue-200 text-blue-800',
  quente: 'bg-orange-200 text-orange-800',
  urgente: 'bg-red-200 text-red-800',
  raro: 'bg-purple-200 text-purple-800'
};

export default function DeepHunter() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterPriority, setFilterPriority] = useState('quente');
  const [selectedLead, setSelectedLead] = useState(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualCompanyName, setManualCompanyName] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualCity, setManualCity] = useState('');

  const queryClient = useQueryClient();

  // Fetch leads com filtros
  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['leadhunter', filterCity, filterPriority],
    queryFn: async () => {
      const filters = {};
      if (filterCity) filters.city = filterCity;
      if (filterPriority) filters.priority = filterPriority;
      return base44.entities.LeadHunter.filter(filters, '-created_date', 50);
    },
    staleTime: 5 * 60 * 1000, // 5 min
  });

  const filteredLeads = searchQuery
    ? leads.filter(l => l.company_name?.toLowerCase().includes(searchQuery.toLowerCase()))
    : leads;

  // IA Analysis (sob demanda, com cache)
  const analyzeLeadMutation = useMutation({
    mutationFn: async (lead_id) => {
      const lead = leads.find(l => l.id === lead_id);
      
      if (!lead) throw new Error('Lead não encontrado');

      // Se tem cache válido, retorna
      if (lead?.ia_analysis_cache && lead?.ia_analysis_expires_at) {
        const expiry = new Date(lead.ia_analysis_expires_at);
        if (expiry > new Date()) {
          return { cached: true, analysis: lead.ia_analysis_cache };
        }
      }

      // Senão, chama IA
      toast.info('🧠 Analisando com IA...');
      const result = await base44.functions.invoke('deepHunterAnalysis', { lead_id });
      
      // Salva cache
      await base44.entities.LeadHunter.update(lead_id, {
        ia_analysis_cache: result.data.analysis,
        ia_analysis_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });

      return { cached: false, analysis: result.data.analysis };
    },
    onSuccess: (data) => {
      setSelectedLead(prev => ({ ...prev, analysis: data.analysis }));
      setShowAnalysis(true);
      if (!data.cached) toast.success('✅ Análise concluída!');
    },
    onError: (err) => toast.error('Erro: ' + err.message),
  });

  // Manual input enrichment
  const manualInputMutation = useMutation({
    mutationFn: async () => {
      if (!manualCompanyName.trim()) { throw new Error('Nome da empresa é obrigatório'); }
      
      toast.info('📊 Enriquecendo com IA...');
      const result = await base44.functions.invoke('investigateLeadPublicData', {
        manual_data: [{
          company_name: manualCompanyName,
          phone: manualPhone,
          city: manualCity,
          extra_info: 'Entrada manual do usuário'
        }]
      });

      return result.data;
    },
    onSuccess: (data) => {
      if (data.leads?.[0]) {
        queryClient.invalidateQueries({ queryKey: ['leadhunter'] });
        toast.success('✅ Empresa adicionada e analisada!');
        setShowManualInput(false);
        setManualCompanyName('');
        setManualPhone('');
        setManualCity('');
      }
    },
    onError: (err) => toast.error('Erro: ' + err.message),
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 pb-20">
      <div className="max-w-7xl mx-auto">

        {/* ─── HEADER ─── */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-white mb-2 flex items-center gap-3">
            <Sparkles className="w-10 h-10 text-amber-400" />
            Deep Hunter 🔍
          </h1>
          <p className="text-slate-400 text-sm">Investigação comercial + financeira inteligente • Dados públicos apenas</p>
        </div>

        {/* ─── BOTÃO ADICIONAR MANUAL ─── */}
        <div className="mb-4">
          <Button
            onClick={() => setShowManualInput(true)}
            className="bg-amber-600 hover:bg-amber-700 gap-2"
          >
            <Plus className="w-4 h-4" />
            Adicionar Empresa Manualmente
          </Button>
        </div>

        {/* ─── FILTROS ─── */}
        <div className="bg-slate-800 rounded-2xl p-6 mb-6 border border-slate-700">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-300 uppercase mb-2 block">🔎 Buscar</label>
              <Input
                placeholder="Nome da empresa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white placeholder-slate-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-300 uppercase mb-2 block">📍 Cidade</label>
              <Input
                placeholder="São Paulo, RJ..."
                value={filterCity}
                onChange={(e) => setFilterCity(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white placeholder-slate-500"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-300 uppercase mb-2 block">⚡ Prioridade</label>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="w-full px-3 h-9 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm"
              >
                <option value="">Todas</option>
                <option value="quente">🔥 Quentes</option>
                <option value="urgente">🚨 Urgentes</option>
                <option value="raro">💎 Raras</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-300 uppercase mb-2 block">📊 Total</label>
              <div className="h-9 bg-slate-700 rounded-lg flex items-center justify-center">
                <span className="text-xl font-black text-amber-400">{filteredLeads.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── LEADS GRID ─── */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-10 h-10 text-amber-400 animate-spin" />
          </div>
        ) : filteredLeads.length === 0 ? (
          <Card className="bg-slate-800 border-slate-700 text-center py-12">
            <p className="text-slate-400">Nenhum lead encontrado</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLeads.map(lead => (
              <Card
                key={lead.id}
                className="bg-slate-800 border-slate-700 hover:border-amber-500 cursor-pointer transition-all hover:shadow-xl hover:shadow-amber-500/20"
                onClick={() => setSelectedLead(lead)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <CardTitle className="text-white text-lg truncate">{lead.company_name}</CardTitle>
                      <p className="text-xs text-slate-400 mt-1">{lead.city}/{lead.state}</p>
                    </div>
                    <Badge className={PRIORITY_COLORS[lead.priority] || PRIORITY_COLORS.normal}>
                      {lead.priority?.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Scores */}
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Expansão', value: lead.score_expansion },
                      { label: 'Oportunidade', value: lead.score_opportunity }
                    ].map((s, i) => (
                      <div key={i} className="bg-slate-700 rounded-lg p-2">
                        <p className="text-xs text-slate-400">{s.label}</p>
                        <p className="text-xl font-black text-amber-400">{s.value}%</p>
                      </div>
                    ))}
                  </div>

                  {/* Sinais */}
                  {lead.signals?.length > 0 && (
                    <div className="space-y-1">
                      {lead.signals.slice(0, 2).map((sig, i) => (
                        <div key={i} className="text-xs bg-amber-500/20 text-amber-200 px-2 py-1 rounded flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          {SIGNAL_LABELS[sig.type] || sig.type}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Contato rápido */}
                  {lead.phone && (
                    <a
                      href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-center py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg transition-colors"
                    >
                      💬 WhatsApp
                    </a>
                  )}

                  {/* IA Analyse Button */}
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs gap-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      analyzeLeadMutation.mutate(lead.id);
                    }}
                    disabled={analyzeLeadMutation.isPending}
                  >
                    {analyzeLeadMutation.isPending ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Zap className="w-3 h-3" />
                    )}
                    Analisar
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* ─── MODAL INPUT MANUAL ─── */}
        {showManualInput && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <Card className="bg-slate-800 border-amber-500 max-w-md w-full">
              <CardHeader className="flex justify-between items-center">
                <CardTitle className="text-white">Adicionar Empresa</CardTitle>
                <button onClick={() => setShowManualInput(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-2">Nome da Empresa *</label>
                  <Input
                    placeholder="Ex: Clínica Veterinária PetCare"
                    value={manualCompanyName}
                    onChange={(e) => setManualCompanyName(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-2">Telefone (opcional)</label>
                  <Input
                    placeholder="(11) 99999-9999"
                    value={manualPhone}
                    onChange={(e) => setManualPhone(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-2">Cidade (opcional)</label>
                  <Input
                    placeholder="São Paulo"
                    value={manualCity}
                    onChange={(e) => setManualCity(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <Button
                  className="w-full bg-amber-600 hover:bg-amber-700 gap-2"
                  disabled={manualInputMutation.isPending}
                  onClick={() => manualInputMutation.mutate()}
                >
                  {manualInputMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  Analisar com IA
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ─── ANÁLISE MODAL ─── */}
        {showAnalysis && selectedLead && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <Card className="bg-slate-800 border-amber-500 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <CardHeader className="sticky top-0 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
                <CardTitle className="text-white">{selectedLead.company_name}</CardTitle>
                <button
                  onClick={() => setShowAnalysis(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </CardHeader>

              <CardContent className="space-y-6 pt-6">
                {selectedLead.analysis && (
                  <>
                    <div className="space-y-2">
                      <h3 className="font-bold text-amber-400">📊 Resumo Estratégico</h3>
                      <p className="text-sm text-slate-300">{selectedLead.analysis.summary}</p>
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-bold text-green-400">💰 Potencial de Compra</h3>
                      <p className="text-sm text-slate-300">{selectedLead.analysis.buying_potential}</p>
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-bold text-red-400">⚠️ Pressões Identificadas</h3>
                      <p className="text-sm text-slate-300">{selectedLead.analysis.pressures}</p>
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-bold text-purple-400">🎯 Abordagem Recomendada</h3>
                      <p className="text-sm text-slate-300">{selectedLead.analysis.approach}</p>
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-bold text-blue-400">📞 Roteiro Ligação</h3>
                      <p className="text-sm text-slate-300">{selectedLead.analysis.call_script}</p>
                    </div>

                    <Button
                      className="w-full bg-amber-600 hover:bg-amber-700"
                      onClick={() => {
                        navigator.clipboard.writeText(selectedLead.analysis.call_script);
                        toast.success('✅ Roteiro copiado!');
                      }}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copiar Roteiro
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
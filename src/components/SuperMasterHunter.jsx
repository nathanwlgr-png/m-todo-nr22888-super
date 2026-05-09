import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, MapPin, Search, Loader2, X, Check, AlertCircle, TrendingUp, Map as MapIcon, MessageCircle, Eye } from 'lucide-react';
import { toast } from 'sonner';

export default function SuperMasterHunter() {
  const [showModal, setShowModal] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState(null);
  const queryClient = useQueryClient();

  // Configurações
  const [config, setConfig] = useState({
    city: 'São Paulo',
    radius_km: 5,
    segment: 'veterinario',
    max_leads: 15,
    depth: 'media' // leve, media, profunda, suprema
  });

  // Modo econômico
  const [economicMode, setEconomicMode] = useState(false);

  // Mutation
  const investigateMutation = useMutation({
    mutationFn: async () => {
      toast.info('🔍 Iniciando investigação...');
      const result = await base44.functions.invoke('superMasterHunter', {
        city: config.city,
        radius_km: config.radius_km,
        segment: config.segment,
        max_leads: config.max_leads,
        depth: config.depth,
        economic_mode: economicMode
      });
      return result.data;
    },
    onSuccess: (data) => {
      setResults(data);
      setShowResults(true);
      setShowConfirm(false);
      toast.success(`✅ ${data.leads_found} leads encontrados!`);
      queryClient.invalidateQueries({ queryKey: ['leadhunter'] });
    },
    onError: (err) => {
      toast.error('❌ Erro: ' + err.message);
      setShowConfirm(false);
    }
  });

  return (
    <>
      {/* BOTÃO FLUTUANTE */}
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-20 right-6 z-40 flex items-center gap-2 px-4 py-3 rounded-full shadow-2xl animate-pulse hover:animate-none transition-all"
        style={{ background: 'linear-gradient(135deg, #ff6b00, #ff9500)', color: 'white', fontWeight: 'bold' }}
      >
        <AlertTriangle className="w-5 h-5" />
        <span className="hidden md:inline">SUPER MASTER HUNTER</span>
        <span className="md:hidden">HUNTER</span>
      </button>

      {/* MODAL CONFIGURAÇÃO */}
      {showModal && !showResults && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <Card className="bg-slate-800 border-orange-500 max-w-md w-full">
            <CardHeader className="flex flex-row justify-between items-start">
              <div>
                <CardTitle className="text-white flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                  SUPER MASTER HUNTER
                </CardTitle>
                <CardDescription className="text-orange-300">Modo investigativo supremo</CardDescription>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  setShowResults(false);
                  setResults(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Aviso de créditos */}
              <div className="rounded-lg p-3 bg-orange-900/30 border border-orange-500/50">
                <p className="text-xs text-orange-200 font-bold flex items-center gap-2 mb-1">
                  <AlertCircle className="w-4 h-4" />
                  ⚠️ CONSUMO DE CRÉDITOS
                </p>
                <p className="text-xs text-orange-300">
                  {config.depth === 'suprema' ? 'Supremo: até 50 créditos' : 
                   config.depth === 'profunda' ? 'Profundo: até 30 créditos' :
                   config.depth === 'media' ? 'Médio: até 15 créditos' : 'Leve: até 5 créditos'}
                </p>
              </div>

              {/* Cidade */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-2">Cidade</label>
                <Input
                  value={config.city}
                  onChange={(e) => setConfig({ ...config, city: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="São Paulo"
                />
              </div>

              {/* Raio GPS */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-2">
                  Raio GPS: {config.radius_km}km
                </label>
                <input
                  type="range"
                  min="1"
                  max="25"
                  value={config.radius_km}
                  onChange={(e) => setConfig({ ...config, radius_km: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>

              {/* Segmento */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-2">Segmento</label>
                <select
                  value={config.segment}
                  onChange={(e) => setConfig({ ...config, segment: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm"
                >
                  <option value="veterinario">Veterinário</option>
                  <option value="laboratorio">Laboratório</option>
                  <option value="farmacia">Farmácia</option>
                  <option value="hospital">Hospital</option>
                  <option value="clinica">Clínica</option>
                  <option value="outro">Outro</option>
                </select>
              </div>

              {/* Quantidade máxima */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-2">
                  Máx de Leads: {config.max_leads}
                </label>
                <input
                  type="range"
                  min="5"
                  max="25"
                  value={config.max_leads}
                  onChange={(e) => setConfig({ ...config, max_leads: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>

              {/* Profundidade */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-2">Profundidade</label>
                <div className="grid grid-cols-4 gap-2">
                  {['leve', 'media', 'profunda', 'suprema'].map(d => (
                    <button
                      key={d}
                      onClick={() => setConfig({ ...config, depth: d })}
                      className={`py-2 rounded text-xs font-bold transition-all ${
                        config.depth === d
                          ? 'bg-orange-600 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      {d === 'leve' ? '📊' : d === 'media' ? '📈' : d === 'profunda' ? '📉' : '🔥'}
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Modo Econômico */}
              <div className="flex items-center gap-2 p-2 rounded bg-slate-700/50">
                <input
                  type="checkbox"
                  checked={economicMode}
                  onChange={(e) => setEconomicMode(e.target.checked)}
                  className="w-4 h-4"
                />
                <label className="text-xs font-bold text-slate-300">Modo Econômico (menos créditos)</label>
              </div>

              {/* Botões */}
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1 bg-orange-600 hover:bg-orange-700 gap-2"
                  onClick={() => setShowConfirm(true)}
                >
                  <Search className="w-4 h-4" />
                  Iniciar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* MODAL CONFIRMAÇÃO */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <Card className="bg-slate-800 border-orange-500 max-w-sm w-full">
            <CardHeader>
              <CardTitle className="text-orange-400 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Confirmar Investigação?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300 mb-4">
                Modo investigativo supremo. Esse modo realiza investigação aprofundada em múltiplas fontes e pode consumir mais créditos.
              </p>
              <p className="text-xs text-orange-300 mb-6">
                ⏱️ Tempo: até 2 minutos | 📊 Leads: até {config.max_leads} | 🔍 Profundidade: {config.depth}
              </p>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowConfirm(false)}
                  disabled={investigateMutation.isPending}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1 bg-orange-600 hover:bg-orange-700 gap-2"
                  onClick={() => investigateMutation.mutate()}
                  disabled={investigateMutation.isPending}
                >
                  {investigateMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  {investigateMutation.isPending ? 'Investigando...' : 'Continuar'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* MODAL RESULTADOS */}
      {showResults && results && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <Card className="bg-slate-800 border-orange-500 max-w-3xl w-full my-4">
            <CardHeader className="flex flex-row justify-between items-start sticky top-0 bg-slate-800 border-b border-slate-700">
              <div>
                <CardTitle className="text-orange-400">✅ Investigação Concluída</CardTitle>
                <CardDescription className="text-orange-300">{results.leads_found} leads encontrados em {results.city}</CardDescription>
              </div>
              <button
                onClick={() => {
                  setShowResults(false);
                  setResults(null);
                  setShowModal(false);
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Resumo Executivo */}
              <div className="grid grid-cols-4 gap-2 p-3 rounded-lg bg-slate-700/50 border border-slate-600">
                <div className="text-center">
                  <p className="text-2xl font-black text-orange-400">{results.leads_found}</p>
                  <p className="text-xs text-slate-400">Total</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-black text-red-400">{results.hot_leads || 0}</p>
                  <p className="text-xs text-slate-400">Quentes 🔥</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-black text-yellow-400">{results.urgent_leads || 0}</p>
                  <p className="text-xs text-slate-400">Urgentes ⚠️</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-black text-green-400">{results.potential_revenue || 'N/A'}</p>
                  <p className="text-xs text-slate-400">Potencial</p>
                </div>
              </div>

              {/* Leads */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {results.leads?.map((lead, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-slate-700/50 border border-slate-600 hover:border-orange-500 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold text-white">{lead.name}</p>
                        <p className="text-xs text-slate-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {lead.city} • {lead.distance_km}km
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-black text-orange-400">{lead.score || 75}</p>
                        <p className="text-xs text-slate-400">Score</p>
                      </div>
                    </div>

                    {/* Sinais detectados */}
                    {lead.signals && lead.signals.length > 0 && (
                      <div className="mb-2 flex flex-wrap gap-1">
                        {lead.signals.slice(0, 3).map((signal, i) => (
                          <span key={i} className="text-[10px] px-2 py-1 rounded bg-orange-900/40 text-orange-300 border border-orange-500/30">
                            {signal}
                          </span>
                        ))}
                        {lead.signals.length > 3 && (
                          <span className="text-[10px] px-2 py-1 rounded bg-slate-600 text-slate-300">
                            +{lead.signals.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Ações */}
                    <div className="flex gap-2 pt-2">
                      {lead.whatsapp && (
                        <a
                          href={`https://wa.me/${lead.whatsapp.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 py-1 px-2 rounded text-xs font-bold bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-1"
                        >
                          <MessageCircle className="w-3 h-3" />
                          WhatsApp
                        </a>
                      )}
                      {lead.maps_url && (
                        <a
                          href={lead.maps_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 py-1 px-2 rounded text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-1"
                        >
                          <MapIcon className="w-3 h-3" />
                          Mapa
                        </a>
                      )}
                      {lead.instagram && (
                        <a
                          href={`https://instagram.com/${lead.instagram.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 py-1 px-2 rounded text-xs font-bold bg-pink-600 hover:bg-pink-700 text-white flex items-center justify-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          Insta
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Botão fechar */}
              <Button
                className="w-full bg-orange-600 hover:bg-orange-700"
                onClick={() => {
                  setShowResults(false);
                  setResults(null);
                  setShowModal(false);
                }}
              >
                Finalizar
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
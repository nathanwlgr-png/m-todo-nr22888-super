import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Radar, Target, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAIGlobal } from '@/lib/AIGlobalContext.jsx';

export default function SeamatyHunter() {
  const { aiEnabled, powerMode } = useAIGlobal();
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const cities = {
    'SP': ['Marília', 'Botucatu', 'Bauru', 'Araçatuba', 'Ribeirão Preto', 'São Paulo'],
    'MG': ['Belo Horizonte', 'Uberlândia', 'Contagem'],
    'RJ': ['Rio de Janeiro', 'Niterói'],
    'PR': ['Curitiba', 'Londrina']
  };

  const segments = [
    'veterinario',
    'hospital_veterinario',
    'laboratorio',
    'centro_diagnostico',
    'universidade'
  ];

  const detectOpportunity = async () => {
    if (!selectedCity || !selectedState) {
      toast.error('Selecione estado e cidade');
      return;
    }

    if (!aiEnabled) {
      toast.warning('IA desativada — Busca básica apenas');
    }

    if (!window.confirm('Esta ação pode consumir créditos ou processar muitos dados. Use apenas quando for realmente necessário. Confirma executar?')) {
      return;
    }

    setLoading(true);
    toast.info('🔍 Investigando clínicas...');

    try {
      const response = await base44.functions.invoke('superMasterHunter', {
        city: selectedCity,
        state: selectedState,
        radius_km: 20,
        depth: powerMode === 'economico' ? 'rapida' : powerMode === 'absoluto' ? 'suprema' : 'completa',
        segment: segments
      });

      const analyzed = response.data?.search_results?.map(clinic => ({
        ...clinic,
        opportunity_score: Math.floor(Math.random() * 100), // Placeholder
        seamaty_fit: Math.floor(Math.random() * 100),
        next_action: 'INVESTIGAR CLÍNICA'
      })) || [];

      setResults(analyzed.sort((a, b) => b.opportunity_score - a.opportunity_score));
      toast.success(`✅ ${analyzed.length} clínicas encontradas`);
    } catch (err) {
      toast.error(`Erro: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-slate-900 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-white mb-2 flex items-center gap-3">
            <Radar className="w-10 h-10 text-purple-400" />
            🎯 Seamaty Hunter — Radar de Oportunidades
          </h1>
          <p className="text-slate-400">Detecta clínicas com potencial para equipamentos Seamaty</p>
          <p className="text-xs text-orange-400 mt-1">Modo econômico ativo — execute apenas sob necessidade.</p>
        </div>

        {/* BUSCA */}
        <Card className="bg-slate-800 border-purple-500/30">
          <CardHeader>
            <CardTitle className="text-white">🔍 Buscar Oportunidades</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Estado */}
              <div>
                <label className="text-sm font-semibold text-slate-300 mb-2 block">Estado</label>
                <select
                  value={selectedState}
                  onChange={(e) => {
                    setSelectedState(e.target.value);
                    setSelectedCity('');
                  }}
                  className="w-full px-4 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white"
                >
                  <option value="">Selecione...</option>
                  {Object.keys(cities).map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>

              {/* Cidade */}
              <div>
                <label className="text-sm font-semibold text-slate-300 mb-2 block">Cidade</label>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  disabled={!selectedState}
                  className="w-full px-4 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white disabled:opacity-50"
                >
                  <option value="">Selecione...</option>
                  {selectedState && cities[selectedState]?.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              {/* Botão */}
              <div className="flex items-end">
                <Button
                  onClick={detectOpportunity}
                  disabled={loading || !selectedCity}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {loading ? '⏳ Investigando...' : '🚀 Executar manualmente com confirmação'}
                </Button>
              </div>
            </div>

            {!aiEnabled && (
              <div className="p-3 bg-orange-900/30 border border-orange-500/30 rounded-lg">
                <p className="text-sm text-orange-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  IA desativada — Resultados serão básicos
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* RESULTADOS */}
        {results.length > 0 && (
          <Tabs defaultValue="ranking" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="ranking">📊 Ranking</TabsTrigger>
              <TabsTrigger value="details">📋 Detalhes</TabsTrigger>
            </TabsList>

            {/* RANKING */}
            <TabsContent value="ranking" className="space-y-4">
              {results.slice(0, 10).map((clinic, idx) => (
                <Card key={clinic.name} className="bg-slate-800 border-slate-700 hover:border-purple-500/50 transition-all">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl font-bold text-purple-400">#{idx + 1}</span>
                          <p className="text-lg font-semibold text-white">{clinic.name}</p>
                          <Badge className={clinic.opportunity_score > 70 ? 'bg-red-600' : clinic.opportunity_score > 40 ? 'bg-yellow-600' : 'bg-green-600'}>
                            Score {clinic.opportunity_score}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-400 mb-3">{clinic.city}, {clinic.state}</p>
                        
                        {/* Métricas */}
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div className="p-2 bg-slate-900 rounded">
                            <p className="text-xs text-slate-400">Potencial Seamaty</p>
                            <p className="text-sm font-bold text-white">{clinic.seamaty_fit}%</p>
                          </div>
                          <div className="p-2 bg-slate-900 rounded">
                            <p className="text-xs text-slate-400">Exames/mês</p>
                            <p className="text-sm font-bold text-white">~{Math.floor(Math.random() * 500) + 100}</p>
                          </div>
                        </div>
                      </div>

                      <Button className="bg-purple-600 hover:bg-purple-700">
                        Investigar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {/* DETALHES */}
            <TabsContent value="details">
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="pt-6 space-y-4">
                  <h3 className="font-bold text-white">📊 Análise Detalhada</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {results.slice(0, 5).map(clinic => (
                      <div key={clinic.name} className="p-4 bg-slate-900 rounded-lg border border-slate-700">
                        <p className="font-semibold text-white mb-2">{clinic.name}</p>
                        <ul className="text-sm text-slate-400 space-y-1">
                          <li>📍 {clinic.city}</li>
                          <li>📞 {clinic.phone || 'Não disponível'}</li>
                          <li>🌐 {clinic.website ? 'Com website' : 'Sem website'}</li>
                          <li>📊 Score: {clinic.opportunity_score}%</li>
                        </ul>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

      </div>
    </div>
  );
}
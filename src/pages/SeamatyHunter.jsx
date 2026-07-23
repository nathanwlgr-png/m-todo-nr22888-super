import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Radar, Target, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAIGlobal } from '@/lib/AIGlobalContext.jsx';
import HunterClinicCard from '@/components/hunter/HunterClinicCard';

const CITY_OPTIONS = {
  SP: ['Marília', 'Botucatu', 'Bauru', 'Araçatuba', 'Ribeirão Preto', 'São Paulo'],
  MG: ['Belo Horizonte', 'Uberlândia', 'Contagem'],
  RJ: ['Rio de Janeiro', 'Niterói'],
  PR: ['Curitiba', 'Londrina'],
};

export default function SeamatyHunter() {
  const { aiEnabled, powerMode } = useAIGlobal();
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedState, setSelectedState] = useState('SP');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [importingName, setImportingName] = useState('');

  const availableCities = CITY_OPTIONS[selectedState] || [];

  const segments = [
    'clinica',
    'hospital',
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
    setHasSearched(true);
    setResults([]);
    toast.info('🔍 Investigando clínicas...');

    try {
      const response = await base44.functions.invoke('superMasterHunter', {
        city: selectedCity,
        state: selectedState,
        radius_km: 20,
        depth: powerMode === 'economico' ? 'rapida' : powerMode === 'absoluto' ? 'suprema' : 'completa',
        segments
      });

      const rawResults = response.data?.leads || [];
      const analyzed = rawResults.filter((clinic) =>
        ['VALIDADO_OFICIAL', 'VALIDADO_MULTIFONTE'].includes(clinic.validation_status) && clinic.source_urls?.length
      );

      setResults(analyzed.sort((a, b) => b.source_urls.length - a.source_urls.length));
      if (analyzed.length === 0) toast.info('Nenhuma clínica encontrada nesta busca.');
      else toast.success(`✅ ${analyzed.length} clínicas encontradas`);
    } catch (err) {
      setHasSearched(false);
      toast.error(`Erro: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const importProspect = async (clinic) => {
    if (!['VALIDADO_OFICIAL', 'VALIDADO_MULTIFONTE'].includes(clinic.validation_status)) {
      toast.error('Resultado sem validação suficiente.');
      return;
    }
    setImportingName(clinic.name);
    try {
      await base44.entities.CRMUpdateQueue.create({
        origem: 'manual',
        texto_original: JSON.stringify({ name: clinic.name, city: clinic.city, state: clinic.state, sources: clinic.source_urls }),
        comando_interpretado: 'Revisar prospect antes de incluir no CRM',
        tipo_atualizacao: 'prospect_revisao',
        campo_alvo: 'novo_lead',
        valor_novo: clinic.name,
        status: 'pendente',
        risco: 'medio',
        exige_aprovacao: true,
        data_criacao: new Date().toISOString(),
        observacao: `${clinic.validation_status} · ${clinic.validation_method}`
      });
      setResults(current => current.map(item => item.name === clinic.name ? { ...item, queued_for_review: true } : item));
      toast.success('Prospect enviado para revisão. Nenhum cliente foi criado.');
    } catch (err) {
      toast.error(`Erro ao enviar para revisão: ${err.message}`);
    } finally {
      setImportingName('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-slate-900 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-white mb-2 flex items-center gap-3">
            <Radar className="w-10 h-10 text-purple-400" />
            🎯 SEAMATY Hunter — Radar de Oportunidades
          </h1>
          <p className="text-slate-400">Pesquisa organizações com fontes públicas verificáveis para revisão comercial</p>
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
                <label htmlFor="hunter-state" className="text-sm font-semibold text-slate-300 mb-2 block">Estado</label>
                <select
                  id="hunter-state"
                  name="state"
                  aria-label="Estado"
                  value={selectedState}
                  onChange={(e) => {
                    setSelectedState(e.target.value.trim().toUpperCase());
                    setSelectedCity('');
                  }}
                  className="min-h-11 w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-white"
                >
                  <option className="bg-slate-900 text-white" value="">Selecione...</option>
                  {Object.keys(CITY_OPTIONS).map(state => (
                    <option className="bg-slate-900 text-white" key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>

              {/* Cidade */}
              <div>
                <label htmlFor="hunter-city" className="text-sm font-semibold text-slate-300 mb-2 block">Cidade</label>
                <select
                  key={`hunter-city-${selectedState || 'none'}`}
                  id="hunter-city"
                  name="city"
                  aria-label="Cidade"
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  disabled={availableCities.length === 0}
                  className="min-h-11 w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-white disabled:opacity-50"
                >
                  <option value="">Selecione...</option>
                  {availableCities.map(city => (
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
                <HunterClinicCard
                  key={`${clinic.name}-${idx}`}
                  clinic={clinic}
                  position={idx + 1}
                  importing={importingName === clinic.name}
                  onImport={importProspect}
                />
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
                          <li>✅ {clinic.validation_status}</li>
                          <li>🔗 {clinic.source_urls?.length || 0} fonte(s) verificável(is)</li>
                        </ul>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {hasSearched && !loading && results.length === 0 && (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="py-10 text-center">
              <CheckCircle2 className="w-8 h-8 text-slate-500 mx-auto mb-3" />
              <p className="font-bold text-white">Nenhum resultado validado encontrado</p>
              <p className="text-sm text-slate-400 mt-1">Nenhum dado sem fonte foi exibido. Tente outra cidade ou execute novamente mais tarde.</p>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}
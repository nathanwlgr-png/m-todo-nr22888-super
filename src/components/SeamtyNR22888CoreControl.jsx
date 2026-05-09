import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Power, Zap, Target, AlertCircle, Check, X } from 'lucide-react';

/**
 * SEAMATY NR22888 — Central de Controle
 * Gerencia ON/OFF de todos os módulos
 * Modo Verdade Absoluta: confirmado/provável/não confirmado
 */

const MODULES = [
  { id: 'aiInvestigative', name: '🔍 IA Investigativa', icon: '🧠', color: 'bg-purple-50' },
  { id: 'gpsHunter', name: '🗺️ GPS Hunter', icon: '📍', color: 'bg-blue-50' },
  { id: 'superMasterHunter', name: '⚠️ Super Master Hunter', icon: '🎯', color: 'bg-red-50' },
  { id: 'followUp', name: '📞 Follow-up', icon: '☎️', color: 'bg-green-50' },
  { id: 'rankingDoDia', name: '🏆 Ranking do Dia', icon: '⭐', color: 'bg-yellow-50' },
  { id: 'marketingCommander', name: '📢 Marketing Commander', icon: '📣', color: 'bg-pink-50' },
  { id: 'instagramStudio', name: '📸 Instagram Studio', icon: '📷', color: 'bg-orange-50' },
  { id: 'auditoria', name: '📋 Auditoria', icon: '✓', color: 'bg-slate-50' },
  { id: 'modoEconomico', name: '💰 Modo Econômico', icon: '💵', color: 'bg-teal-50' },
  { id: 'modoOffline', name: '📱 Modo Offline', icon: '⚡', color: 'bg-cyan-50' },
  { id: 'modoSupremo', name: '👑 Modo Supremo', icon: '💎', color: 'bg-indigo-50' },
];

const TRUTH_MODES = [
  { status: 'confirmed', label: '🟢 Confirmado', color: 'bg-green-100 border-green-300', textColor: 'text-green-900' },
  { status: 'probable', label: '🟡 Provável', color: 'bg-yellow-100 border-yellow-300', textColor: 'text-yellow-900' },
  { status: 'not_confirmed', label: '🔴 Não Confirmado', color: 'bg-red-100 border-red-300', textColor: 'text-red-900' },
];

export default function SeamtyNR22888CoreControl() {
  const [moduleStates, setModuleStates] = useState(
    MODULES.reduce((acc, m) => ({ ...acc, [m.id]: false }), {})
  );
  const [supremeMode, setSupremeMode] = useState(false);
  const [economicMode, setEconomicMode] = useState(false);
  const [truthMode, setTruthMode] = useState('confirmed');

  // Salvar estado em localStorage
  useEffect(() => {
    localStorage.setItem('seamtyModuleStates', JSON.stringify(moduleStates));
    localStorage.setItem('seamtySupremeMode', JSON.stringify(supremeMode));
    localStorage.setItem('seamtyEconomicMode', JSON.stringify(economicMode));
    localStorage.setItem('seamtyTruthMode', truthMode);
  }, [moduleStates, supremeMode, economicMode, truthMode]);

  // Carregar estado ao montar
  useEffect(() => {
    const saved = localStorage.getItem('seamtyModuleStates');
    if (saved) setModuleStates(JSON.parse(saved));
    
    const savedSupreme = localStorage.getItem('seamtySupremeMode');
    if (savedSupreme) setSupremeMode(JSON.parse(savedSupreme));

    const savedEconomic = localStorage.getItem('seamtyEconomicMode');
    if (savedEconomic) setEconomicMode(JSON.parse(savedEconomic));

    const savedTruth = localStorage.getItem('seamtyTruthMode');
    if (savedTruth) setTruthMode(savedTruth);
  }, []);

  const toggleModule = (moduleId) => {
    setModuleStates(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };

  const toggleAll = () => {
    const allActive = Object.values(moduleStates).every(v => v);
    setModuleStates(
      MODULES.reduce((acc, m) => ({ ...acc, [m.id]: !allActive }), {})
    );
  };

  const toggleSupreme = () => {
    if (!supremeMode) {
      // Ativar Modo Supremo — liga tudo
      setModuleStates(MODULES.reduce((acc, m) => ({ ...acc, [m.id]: true }), {}));
      setEconomicMode(false);
    }
    setSupremeMode(!supremeMode);
  };

  const turnOffHeavy = () => {
    setModuleStates(prev => ({
      ...prev,
      aiInvestigative: false,
      superMasterHunter: false,
      marketingCommander: false,
      modoSupremo: false,
    }));
    setSupremeMode(false);
  };

  const activeCount = Object.values(moduleStates).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-xl p-6 text-white shadow-2xl">
          <h1 className="text-4xl font-black mb-2 flex items-center gap-3">
            🔴 SEAMATY NR22888
          </h1>
          <p className="text-orange-100 text-lg font-bold">Central de Controle Suprema — Investigação + Vendas + Marketing</p>
          <p className="text-orange-200 text-sm mt-2">Status: <span className="font-black">{activeCount}/{MODULES.length} módulos ativos</span></p>
        </div>

        {/* BOTÕES AÇÃO RÁPIDA */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            onClick={toggleSupreme}
            className={`p-6 h-auto text-left gap-3 font-bold text-lg ${
              supremeMode 
                ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white' 
                : 'bg-slate-700 hover:bg-slate-600 text-white'
            }`}
          >
            <span className="text-2xl">🚀</span>
            <div>
              <p>Ativar Modo Supremo</p>
              <p className="text-xs opacity-90">{supremeMode ? 'ATIVADO' : 'Clique para ligar tudo'}</p>
            </div>
          </Button>

          <Button
            onClick={turnOffHeavy}
            className="p-6 h-auto text-left gap-3 font-bold text-lg bg-gradient-to-r from-red-700 to-red-800 hover:from-red-800 hover:to-red-900 text-white"
          >
            <span className="text-2xl">🔴</span>
            <div>
              <p>Desligar Tudo Pesado</p>
              <p className="text-xs opacity-90">IA, Hunter, Marketing</p>
            </div>
          </Button>

          <Button
            onClick={toggleAll}
            className={`p-6 h-auto text-left gap-3 font-bold text-lg ${
              activeCount === MODULES.length
                ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white'
                : 'bg-slate-700 hover:bg-slate-600 text-white'
            }`}
          >
            <span className="text-2xl">⚙️</span>
            <div>
              <p>{activeCount === MODULES.length ? 'Tudo Ligado' : 'Ligar Tudo'}</p>
              <p className="text-xs opacity-90">{activeCount}/{MODULES.length} módulos</p>
            </div>
          </Button>
        </div>

        {/* TABS */}
        <Tabs defaultValue="modules" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-slate-800">
            <TabsTrigger value="modules" className="text-white data-[state=active]:bg-purple-600">📦 Módulos</TabsTrigger>
            <TabsTrigger value="modos" className="text-white data-[state=active]:bg-purple-600">🎭 Modos</TabsTrigger>
            <TabsTrigger value="truth" className="text-white data-[state=active]:bg-purple-600">🎯 Verdade</TabsTrigger>
          </TabsList>

          {/* MÓDULOS */}
          <TabsContent value="modules" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {MODULES.map(module => (
                <Button
                  key={module.id}
                  onClick={() => toggleModule(module.id)}
                  className={`p-4 h-auto text-left font-bold text-sm transition-all border-2 ${
                    moduleStates[module.id]
                      ? 'bg-green-600 border-green-400 text-white hover:bg-green-700'
                      : 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between w-full">
                    <div className="flex gap-2 items-start flex-1">
                      <span className="text-xl">{module.icon}</span>
                      <div>
                        <p>{module.name}</p>
                        {moduleStates[module.id] && <p className="text-xs opacity-75">✅ ATIVO</p>}
                      </div>
                    </div>
                    {moduleStates[module.id] && <Check className="w-5 h-5" />}
                  </div>
                </Button>
              ))}
            </div>
          </TabsContent>

          {/* MODOS */}
          <TabsContent value="modos" className="space-y-4 mt-4">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  👑 Modo Supremo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className={`p-4 rounded-lg border-2 ${supremeMode ? 'bg-yellow-950 border-yellow-600' : 'bg-slate-700 border-slate-600'}`}>
                  <p className={supremeMode ? 'text-yellow-200 font-bold' : 'text-slate-300'}>
                    {supremeMode ? '✅ ATIVADO' : '❌ Desativado'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Ativa todos os módulos + máxima performance</p>
                </div>
                <Button
                  onClick={toggleSupreme}
                  className={`w-full font-bold ${
                    supremeMode
                      ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                      : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                  }`}
                >
                  {supremeMode ? 'Desativar Modo Supremo' : 'Ativar Modo Supremo'}
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  💰 Modo Econômico
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className={`p-4 rounded-lg border-2 ${economicMode ? 'bg-teal-950 border-teal-600' : 'bg-slate-700 border-slate-600'}`}>
                  <p className={economicMode ? 'text-teal-200 font-bold' : 'text-slate-300'}>
                    {economicMode ? '✅ ATIVADO' : '❌ Desativado'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">IA sob demanda · Cache 30 dias · Sem automação pesada</p>
                </div>
                <Button
                  onClick={() => setEconomicMode(!economicMode)}
                  className={`w-full font-bold ${
                    economicMode
                      ? 'bg-teal-600 hover:bg-teal-700 text-white'
                      : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                  }`}
                >
                  {economicMode ? 'Desativar Modo Econômico' : 'Ativar Modo Econômico'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* MODO VERDADE ABSOLUTA */}
          <TabsContent value="truth" className="space-y-4 mt-4">
            <Card className="bg-orange-950 border-orange-600">
              <CardHeader>
                <CardTitle className="text-orange-100 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  🎯 Modo Verdade Absoluta
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-orange-200 text-sm">
                  Nunca misturar hipótese com fato. Sempre separar:
                </p>
                <div className="space-y-2">
                  {TRUTH_MODES.map(mode => (
                    <Button
                      key={mode.status}
                      onClick={() => setTruthMode(mode.status)}
                      className={`w-full text-left font-bold p-4 h-auto border-2 transition-all ${
                        truthMode === mode.status
                          ? `${mode.color} ${mode.textColor} border-opacity-100`
                          : `${mode.color} ${mode.textColor} opacity-50 hover:opacity-75`
                      }`}
                    >
                      <p className="text-base">{mode.label}</p>
                      <p className="text-xs mt-1 opacity-75">
                        {mode.status === 'confirmed' && 'Fato comprovado, verificado no CRM'}
                        {mode.status === 'probable' && 'Sinal forte, mas não 100% confirmado'}
                        {mode.status === 'not_confirmed' && 'Hipótese, nunca afirmar como fato'}
                      </p>
                    </Button>
                  ))}
                </div>

                {/* STATUS ATUAL */}
                <Card className="bg-slate-900 border-slate-700 mt-4">
                  <CardContent className="pt-4">
                    <p className="text-slate-300 text-sm">
                      <strong className="text-white">Modo Ativo:</strong> {
                        truthMode === 'confirmed' ? '🟢 Confirmado' :
                        truthMode === 'probable' ? '🟡 Provável' :
                        '🔴 Não Confirmado'
                      }
                    </p>
                    <p className="text-slate-400 text-xs mt-2">
                      Todos os dados mostrados respeitarão este nível de confiabilidade.
                    </p>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* STATUS GERAL */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">📊 Status Geral</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-slate-700 rounded-lg">
              <p className="text-slate-400 text-sm">Módulos Ativos</p>
              <p className="text-2xl font-black text-white mt-1">{activeCount}/{MODULES.length}</p>
            </div>
            <div className="text-center p-3 bg-slate-700 rounded-lg">
              <p className="text-slate-400 text-sm">Modo Supremo</p>
              <p className={`text-2xl font-black mt-1 ${supremeMode ? 'text-yellow-400' : 'text-slate-400'}`}>
                {supremeMode ? '🚀' : '❌'}
              </p>
            </div>
            <div className="text-center p-3 bg-slate-700 rounded-lg">
              <p className="text-slate-400 text-sm">Modo Econômico</p>
              <p className={`text-2xl font-black mt-1 ${economicMode ? 'text-teal-400' : 'text-slate-400'}`}>
                {economicMode ? '💰' : '❌'}
              </p>
            </div>
            <div className="text-center p-3 bg-slate-700 rounded-lg">
              <p className="text-slate-400 text-sm">Verdade Absoluta</p>
              <p className="text-xl font-bold mt-1">
                {truthMode === 'confirmed' ? '🟢' : truthMode === 'probable' ? '🟡' : '🔴'}
              </p>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Zap, Brain, Database, Wifi, WifiOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAIGlobal } from '@/lib/AIGlobalContext.jsx';
import { isOnline } from '@/lib/OfflineManager';
import DailyReminderDryRunCard from '@/components/control/DailyReminderDryRunCard';

export default function NRControlCenter() {
  const { aiEnabled, toggleAI, powerMode, setPowerMode, creditsEstimate } = useAIGlobal();
  const [online, setOnline] = useState(isOnline());

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const modes = [
    { key: 'economico', label: '⚡ Econômico', desc: 'Sem IA automática, cache agressivo' },
    { key: 'profissional', label: '🔥 Profissional', desc: 'IA sob demanda, cache normal' },
    { key: 'supremo', label: '🧠 Supremo', desc: 'IA completa, cache mínimo' },
    { key: 'absoluto', label: '🚀 Absoluto', desc: 'IA máxima, tudo real-time' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-white mb-2 flex items-center gap-3">
            <Brain className="w-10 h-10 text-blue-400" />
            🎛️ NR Control Center
          </h1>
          <p className="text-slate-400">Controle central de IA, automações, offline e performance</p>
        </div>

        {/* STATUS RÁPIDO */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400">Conectividade</p>
                  <p className="text-2xl font-bold text-white">{online ? 'Online' : 'Offline'}</p>
                </div>
                {online ? <Wifi className="w-8 h-8 text-green-500" /> : <WifiOff className="w-8 h-8 text-red-500" />}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400">IA Global</p>
                  <p className="text-2xl font-bold text-white">{aiEnabled ? 'Ativa' : 'Parada'}</p>
                </div>
                <Brain className={`w-8 h-8 ${aiEnabled ? 'text-blue-500' : 'text-slate-600'}`} />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400">Modo</p>
                  <p className="text-lg font-bold text-white capitalize">{powerMode}</p>
                </div>
                <Zap className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <div>
                <p className="text-xs text-slate-400">Créditos/Mês</p>
                <p className="text-2xl font-bold text-white">{creditsEstimate.monthly || '—'}</p>
                {creditsEstimate.remaining && (
                  <p className="text-xs text-slate-400 mt-1">Restam {creditsEstimate.remaining} dias</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* IA TOGGLE */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Brain className="w-5 h-5 text-blue-400" />
              🧠 IA Global
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-900 rounded-lg">
              <div>
                <p className="font-semibold text-white">Ligar/Desligar IA</p>
                <p className="text-sm text-slate-400">Quando desativada, nenhuma IA executa automaticamente</p>
              </div>
              <Switch checked={aiEnabled} onCheckedChange={toggleAI} />
            </div>

            {aiEnabled ? (
              <div className="p-3 bg-blue-900/30 border border-blue-500/30 rounded-lg">
                <p className="text-sm text-blue-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  IA ativa — Use modo Econômico para reduzir consumo
                </p>
              </div>
            ) : (
              <div className="p-3 bg-orange-900/30 border border-orange-500/30 rounded-lg">
                <p className="text-sm text-orange-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  IA desativada — Sistema funcionará apenas com lógica, sem análises
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* MODOS */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">⚡ Modos de Potência</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {modes.map((mode) => (
              <button
                key={mode.key}
                onClick={() => setPowerMode(mode.key)}
                className={`w-full p-4 rounded-lg border-2 transition-all ${
                  powerMode === mode.key
                    ? 'border-blue-500 bg-blue-900/30'
                    : 'border-slate-700 bg-slate-900 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <p className="font-semibold text-white">{mode.label}</p>
                    <p className="text-xs text-slate-400">{mode.desc}</p>
                  </div>
                  {powerMode === mode.key && <CheckCircle2 className="w-6 h-6 text-blue-500" />}
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* AUTOMAÇÕES */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">⚙️ Automações Controláveis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { name: 'Verificador de Aniversários', key: 'birthday' },
              { name: 'Qualificador Automático', key: 'qualifier' },
              { name: 'Analista de Carteira', key: 'portfolio' },
              { name: 'Generator de Follow-up', key: 'followup' }
            ].map((auto) => (
              <div key={auto.key} className="flex items-center justify-between p-3 bg-slate-900 rounded-lg">
                <p className="text-sm text-slate-300">{auto.name}</p>
                <Badge className="bg-green-600/50 text-green-100">Ativa</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <DailyReminderDryRunCard />

        {/* APIS */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">🔌 APIs Conectadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { name: 'Google Calendar', status: 'online' },
                { name: 'WhatsApp', status: 'online' },
                { name: 'Google Maps', status: 'online' },
                { name: 'Serasa/CNPJ', status: 'online' },
                { name: 'Notion', status: 'online' },
                { name: 'Google Slides', status: 'online' }
              ].map((api) => (
                <div key={api.name} className="p-3 bg-slate-900 rounded-lg flex items-center justify-between">
                  <p className="text-sm text-slate-300">{api.name}</p>
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Power, Zap, AlertTriangle, Search, TrendingUp, Smartphone,
  BookOpen, BarChart3, Settings, Eye, Clock, Wifi
} from 'lucide-react';

const MODULES = [
  { id: 'ia_investigativa', label: '🧠 IA Investigativa', icon: Search, color: 'bg-purple-100 text-purple-700' },
  { id: 'gps_hunter', label: '📍 GPS Hunter', icon: Smartphone, color: 'bg-blue-100 text-blue-700' },
  { id: 'super_master', label: '🎯 Super Master Hunter', icon: AlertTriangle, color: 'bg-red-100 text-red-700' },
  { id: 'follow_up', label: '📞 Follow-up', icon: Clock, color: 'bg-orange-100 text-orange-700' },
  { id: 'ranking', label: '🏆 Ranking do Dia', icon: TrendingUp, color: 'bg-green-100 text-green-700' },
  { id: 'marketing', label: '🎨 Marketing Commander', icon: Zap, color: 'bg-pink-100 text-pink-700' },
  { id: 'instagram', label: '📸 Instagram Studio', icon: BookOpen, color: 'bg-amber-100 text-amber-700' },
  { id: 'auditoria', label: '📊 Auditoria', icon: BarChart3, color: 'bg-slate-100 text-slate-700' },
];

const MODES = [
  { id: 'modo_economico', label: '💰 Modo Econômico', desc: 'Menos IA, mais eficiência' },
  { id: 'modo_verdade', label: '🔒 Modo Verdade Absoluta', desc: 'Zero hipótese, só fatos' },
  { id: 'modo_offline', label: '📱 Modo Offline', desc: 'Sem internet, dados locais' },
  { id: 'modo_supremo', label: '👑 Modo Supremo', desc: 'Todas as IAs ativas' },
];

export default function CentralControl() {
  const [modules, setModules] = useState({});
  const [modes, setModes] = useState({});
  const [confirmSuper, setConfirmSuper] = useState(false);

  // Carregar estado salvo
  useEffect(() => {
    const saved = localStorage.getItem('seamaty_modules');
    if (saved) setModules(JSON.parse(saved));
    const savedModes = localStorage.getItem('seamaty_modes');
    if (savedModes) setModes(JSON.parse(savedModes));
  }, []);

  // Salvar estado
  useEffect(() => {
    localStorage.setItem('seamaty_modules', JSON.stringify(modules));
  }, [modules]);

  useEffect(() => {
    localStorage.setItem('seamaty_modes', JSON.stringify(modes));
  }, [modes]);

  const handleToggle = (id) => {
    setModules(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleModeToggle = (id) => {
    setModes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAllOff = () => {
    const allOff = MODULES.reduce((acc, m) => ({ ...acc, [m.id]: false }), {});
    setModules(allOff);
  };

  const handleSupremo = () => {
    const allOn = MODULES.reduce((acc, m) => ({ ...acc, [m.id]: true }), {});
    setModules(allOn);
    setModes({ modo_supremo: true });
    setConfirmSuper(false);
  };

  const activeCount = Object.values(modules).filter(Boolean).length;
  const activeModes = Object.entries(modes)
    .filter(([_, v]) => v)
    .map(([k]) => MODES.find(m => m.id === k)?.label);

  return (
    <div className="space-y-6">
      
      {/* STATUS GERAL */}
      <Card className="bg-gradient-to-r from-slate-900 to-slate-800 border-slate-700">
        <CardContent className="pt-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-slate-400 font-bold uppercase mb-2">⚡ Status do Sistema</p>
              <p className="text-3xl font-black text-white">{activeCount}/8 Módulos</p>
              {activeModes.length > 0 && (
                <div className="flex gap-2 mt-3">
                  {activeModes.map(mode => (
                    <Badge key={mode} className="bg-orange-600">{mode}</Badge>
                  ))}
                </div>
              )}
            </div>
            <div className="text-right">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                activeCount === 0 ? 'bg-slate-700' : 'bg-gradient-to-br from-green-400 to-emerald-600'
              }`}>
                <Wifi className={`w-8 h-8 ${activeCount === 0 ? 'text-slate-500' : 'text-white'}`} />
              </div>
              <p className="text-xs text-slate-400 mt-2">
                {activeCount === 0 ? 'Desligado' : 'Ativo'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* MÓDULOS */}
      <div>
        <p className="text-xs font-bold text-slate-600 uppercase mb-3">🎛️ Módulos</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {MODULES.map(mod => (
            <button
              key={mod.id}
              onClick={() => handleToggle(mod.id)}
              className={`p-3 rounded-lg border-2 transition-all text-left ${
                modules[mod.id]
                  ? `border-green-500 ${mod.color} bg-opacity-20`
                  : 'border-slate-300 bg-slate-50 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Power className="w-4 h-4" />
                <span className="text-xs font-bold">{modules[mod.id] ? '✓' : '○'}</span>
              </div>
              <p className="text-xs leading-tight">{mod.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* MODOS */}
      <div>
        <p className="text-xs font-bold text-slate-600 uppercase mb-3">🎯 Modos de Operação</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {MODES.map(mode => (
            <button
              key={mode.id}
              onClick={() => handleModeToggle(mode.id)}
              className={`p-3 rounded-lg border-2 transition-all text-left ${
                modes[mode.id]
                  ? 'border-amber-500 bg-amber-50 text-amber-900'
                  : 'border-slate-300 bg-slate-50 text-slate-700'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-sm">{mode.label}</p>
                  <p className="text-xs text-slate-600 mt-1">{mode.desc}</p>
                </div>
                <span className="text-xs font-bold">
                  {modes[mode.id] ? '✓' : '○'}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* BOTÕES AÇÃO */}
      <div className="space-y-2">
        {/* Desligar Tudo */}
        <Button
          onClick={handleAllOff}
          variant="destructive"
          className="w-full gap-2 h-12 text-base"
        >
          <Power className="w-5 h-5" />
          🔴 Desligar Tudo Pesado
        </Button>

        {/* Super Master Hunter */}
        {!confirmSuper ? (
          <Button
            onClick={() => setConfirmSuper(true)}
            className="w-full gap-2 h-12 text-base bg-red-600 hover:bg-red-700"
          >
            <AlertTriangle className="w-5 h-5" />
            ⚠️ Super Master Hunter
          </Button>
        ) : (
          <div className="space-y-2 p-3 bg-red-50 border-2 border-red-300 rounded-lg">
            <p className="text-sm font-bold text-red-900">Confirmar execução?</p>
            <p className="text-xs text-red-800">Uso alto de créditos. Máx 25 leads, 2 min timeout.</p>
            <div className="flex gap-2">
              <Button
                onClick={handleSupremo}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                ✓ Executar
              </Button>
              <Button
                onClick={() => setConfirmSuper(false)}
                variant="outline"
                className="flex-1"
              >
                ✕ Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* Modo Supremo */}
        <Button
          onClick={handleSupremo}
          className="w-full gap-2 h-12 text-base bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          <Zap className="w-5 h-5" />
          🚀 Ativar Modo Supremo
        </Button>
      </div>

      {/* DICA */}
      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-xs text-blue-900">
        <p className="font-bold mb-1">💡 Dica</p>
        <p>Modo Econômico: menos IA, mais rápido (2-3 créditos)</p>
        <p>Modo Supremo: todas as IAs ativas (10-15 créditos)</p>
        <p>Verdade Absoluta: nunca ativa automático, só sob demanda</p>
      </div>

    </div>
  );
}
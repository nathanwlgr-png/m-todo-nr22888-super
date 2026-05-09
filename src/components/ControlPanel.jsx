import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Settings, Zap, MapPin, AlertTriangle, TrendingUp, MessageSquare,
  Calendar, Package, BarChart3, DollarSign, Wifi, Rocket, Lightbulb,
  ChevronDown, ChevronUp, X, Save
} from 'lucide-react';
import { toast } from 'sonner';

const MODULES = [
  { id: 'ia_investigativa', label: '🧠 IA Investigativa', icon: Lightbulb, desc: 'Análises DeepHunter & Super Master Hunter' },
  { id: 'gps_hunter', label: '📍 GPS Hunter', icon: MapPin, desc: 'Busca por localização (raio até 100km)' },
  { id: 'super_master', label: '⚠️ Super Master Hunter', icon: AlertTriangle, desc: 'Investigação profunda (máx 25 leads)' },
  { id: 'ranking_dia', label: '🏆 Ranking do Dia', icon: TrendingUp, desc: 'Top leads, insumos, comodato' },
  { id: 'briefing', label: '📋 Briefing Inteligente', icon: Lightbulb, desc: 'Resumo pre-visita automático' },
  { id: 'followup', label: '📞 Follow-up Automático', icon: MessageSquare, desc: 'Lembretes e sugestões' },
  { id: 'aniversarios', label: '🎂 Aniversários', icon: Calendar, desc: 'Alertas e mensagens personalizadas' },
  { id: 'catalogo', label: '📤 Catálogo/Rastreamento', icon: Package, desc: 'Envio e tracking de produtos' },
  { id: 'auditoria', label: '📊 Auditoria de Créditos', icon: BarChart3, desc: 'Log de ações e custos' },
];

const MODES = [
  { id: 'economico', label: '💰 Modo Econômico', desc: 'IA básica, sem web search, offline-first', icon: DollarSign },
  { id: 'supremo', label: '🚀 Modo Supremo', desc: 'IA full, web search, análise completa', icon: Rocket },
  { id: 'offline', label: '📡 Modo Offline/Leve', desc: 'Sem internet, dados em cache local', icon: Wifi },
];

export default function ControlPanel() {
  const [expanded, setExpanded] = useState(false);
  const [modules, setModules] = useState({});
  const [modes, setModes] = useState({});
  const [loading, setLoading] = useState(true);

  // Carregar settings do usuário
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const user = await base44.auth.me();
        const saved = user?.control_panel_settings || {};
        
        // Inicializar módulos (todos habilitados por padrão)
        const moduleSettings = {};
        MODULES.forEach(m => {
          moduleSettings[m.id] = saved[m.id] !== false; // true se não foi desabilitado
        });
        setModules(moduleSettings);

        // Inicializar modos (econômico por padrão)
        const modeSettings = { economico: true, supremo: false, offline: false };
        if (saved.activeMode) modeSettings[saved.activeMode] = true;
        setModes(modeSettings);
      } catch (e) {
        console.error('Erro ao carregar settings:', e);
        // Defaults
        const defaults = {};
        MODULES.forEach(m => defaults[m.id] = true);
        setModules(defaults);
        setModes({ economico: true, supremo: false, offline: false });
      }
      setLoading(false);
    };

    loadSettings();
  }, []);

  // Salvar settings
  const handleSave = async () => {
    try {
      setLoading(true);
      const activeMode = Object.keys(modes).find(k => modes[k]);
      
      await base44.auth.updateMe({
        control_panel_settings: {
          ...modules,
          activeMode
        }
      });

      toast.success('✅ Configurações salvas!');
    } catch (e) {
      toast.error('Erro ao salvar: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleModule = (id) => {
    setModules(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleMode = (id) => {
    const newModes = {};
    MODES.forEach(m => {
      newModes[m.id] = m.id === id;
    });
    setModes(newModes);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-6 h-6 border-3 border-orange-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {/* Botão flutuante */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="relative inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg hover:shadow-xl transition-all hover:scale-110 text-white"
      >
        <Settings className="w-6 h-6" />
        {!expanded && (
          <div className="absolute inset-0 rounded-full border-2 border-orange-400 animate-pulse" />
        )}
      </button>

      {/* Painel expandido */}
      {expanded && (
        <div className="absolute bottom-20 right-0 w-96 max-h-[80vh] bg-white rounded-2xl shadow-2xl overflow-y-auto z-50 border border-slate-200">
          
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              <h2 className="font-bold text-lg">Central de Controle</h2>
            </div>
            <button onClick={() => setExpanded(false)} className="hover:bg-orange-700 p-1 rounded">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 space-y-6">
            {/* MODOS */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Rocket className="w-4 h-4 text-orange-600" />
                MODO DE OPERAÇÃO
              </h3>
              <div className="space-y-2">
                {MODES.map(mode => (
                  <button
                    key={mode.id}
                    onClick={() => toggleMode(mode.id)}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                      modes[mode.id]
                        ? 'border-orange-500 bg-orange-50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold text-sm text-slate-900">{mode.label}</p>
                        <p className="text-xs text-slate-600 mt-1">{mode.desc}</p>
                      </div>
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        modes[mode.id]
                          ? 'border-orange-500 bg-orange-500'
                          : 'border-slate-300'
                      }`}>
                        {modes[mode.id] && <div className="w-2 h-2 bg-white rounded-full" />}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* MÓDULOS */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-orange-600" />
                MÓDULOS ({Object.values(modules).filter(Boolean).length}/{MODULES.length} ativados)
              </h3>
              <div className="space-y-2">
                {MODULES.map(mod => (
                  <div key={mod.id} className="flex items-start justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition">
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-slate-900">{mod.label}</p>
                      <p className="text-xs text-slate-600 mt-0.5">{mod.desc}</p>
                    </div>
                    <button
                      onClick={() => toggleModule(mod.id)}
                      className={`ml-2 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        modules[mod.id] ? 'bg-orange-500' : 'bg-slate-300'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        modules[mod.id] ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* INFO */}
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-900 font-semibold mb-1">ℹ️ Dica</p>
              <p className="text-xs text-blue-800">Desabilite módulos para economizar créditos. Todos os módulos respeitam cache de 30 dias.</p>
            </div>

            {/* SAVE */}
            <Button
              onClick={handleSave}
              disabled={loading}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white gap-2"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
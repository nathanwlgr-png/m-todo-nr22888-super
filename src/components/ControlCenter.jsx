import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Settings, Zap, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { toast } from 'sonner';

export default function ControlCenter() {
  const [open, setOpen] = useState(false);
  const [controls, setControls] = useState({
    ia_investigative: true,
    gps_hunter: true,
    super_master_hunter: true,
    ranking_daily: true,
    briefing_intelligent: true,
    follow_up: true,
    birthdays: true,
    catalog_tracking: true,
    audit_logging: true,
  });
  const [mode, setMode] = useState('economico'); // economico, supremo, offline

  useEffect(() => {
    const saved = localStorage.getItem('seamaty_controls');
    if (saved) {
      const parsed = JSON.parse(saved);
      setControls(parsed.controls);
      setMode(parsed.mode);
    }
  }, []);

  const handleToggle = (key) => {
    const updated = { ...controls, [key]: !controls[key] };
    setControls(updated);
    localStorage.setItem('seamaty_controls', JSON.stringify({ controls: updated, mode }));
    
    // Auditoria
    base44.functions.invoke('analyticsTrack', {
      eventName: `control_${key}_${!controls[key] ? 'on' : 'off'}`,
      properties: { module: 'ControlCenter' }
    }).catch(() => {});
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    localStorage.setItem('seamaty_controls', JSON.stringify({ controls, mode: newMode }));
    
    const modeLabels = { economico: 'Econômico', supremo: 'Supremo', offline: 'Offline' };
    toast.info(`🎛️ Modo: ${modeLabels[newMode]}`);
  };

  const controlsList = [
    { key: 'ia_investigative', label: 'IA Investigativa', icon: '🧠' },
    { key: 'gps_hunter', label: 'GPS Hunter', icon: '📍' },
    { key: 'super_master_hunter', label: 'Super Master Hunter', icon: '⚠️' },
    { key: 'ranking_daily', label: 'Ranking do Dia', icon: '🏆' },
    { key: 'briefing_intelligent', label: 'Briefing Inteligente', icon: '📋' },
    { key: 'follow_up', label: 'Follow-up', icon: '📞' },
    { key: 'birthdays', label: 'Aniversários', icon: '🎂' },
    { key: 'catalog_tracking', label: 'Catálogo/Rastreamento', icon: '📤' },
    { key: 'audit_logging', label: 'Auditoria', icon: '📊' },
  ];

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-orange-600 hover:bg-orange-700 text-white shadow-lg flex items-center justify-center z-40 transition-all hover:scale-110"
        title="Central de Controle"
      >
        <Settings className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end z-50 p-4">
      <Card className="w-full max-w-2xl bg-slate-900 border-orange-500">
        <CardHeader className="flex justify-between items-center">
          <CardTitle className="text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-orange-400" />
            🎛️ Central de Controle
          </CardTitle>
          <button
            onClick={() => setOpen(false)}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </CardHeader>

        <CardContent className="space-y-6 pb-6">
          {/* Modo */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase mb-3 block">⚡ Modo de Operação</label>
            <ToggleGroup
              type="single"
              value={mode}
              onValueChange={handleModeChange}
              className="gap-2"
            >
              <ToggleGroupItem
                value="economico"
                className="data-[state=on]:bg-green-600 data-[state=on]:text-white border border-green-600 text-green-600 hover:bg-green-600/10"
              >
                💰 Econômico
              </ToggleGroupItem>
              <ToggleGroupItem
                value="supremo"
                className="data-[state=on]:bg-red-600 data-[state=on]:text-white border border-red-600 text-red-600 hover:bg-red-600/10"
              >
                🔥 Supremo
              </ToggleGroupItem>
              <ToggleGroupItem
                value="offline"
                className="data-[state=on]:bg-blue-600 data-[state=on]:text-white border border-blue-600 text-blue-600 hover:bg-blue-600/10"
              >
                📱 Offline/Leve
              </ToggleGroupItem>
            </ToggleGroup>
            <p className="text-xs text-slate-400 mt-2">
              {mode === 'economico' && 'Carregamento leve, menos créditos'}
              {mode === 'supremo' && 'Todas as IA ativas, análise profunda'}
              {mode === 'offline' && 'Sem IA, dados cached apenas'}
            </p>
          </div>

          {/* Controles ON/OFF */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase mb-3 block">🎯 Módulos</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {controlsList.map(({ key, label, icon }) => (
                <div
                  key={key}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-800 border border-slate-700 hover:border-orange-500 transition-colors"
                >
                  <span className="text-sm text-slate-200">
                    {icon} {label}
                  </span>
                  <Switch
                    checked={controls[key]}
                    onCheckedChange={() => handleToggle(key)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Status */}
          <div className="p-3 rounded-lg bg-slate-800 border border-slate-700">
            <p className="text-xs text-slate-300 mb-2">
              <CheckCircle2 className="w-4 h-4 inline mr-1 text-green-400" />
              {Object.values(controls).filter(Boolean).length}/{Object.values(controls).length} módulos ativos
            </p>
            <p className="text-xs text-slate-400">
              {mode === 'economico' && '💰 Modo econômico: IA desativada, buscas reduzidas'}
              {mode === 'supremo' && '🔥 Modo supremo: Todas as IAs ativas, análise profunda'}
              {mode === 'offline' && '📱 Modo offline: Apenas dados em cache'}
            </p>
          </div>

          <Button
            onClick={() => setOpen(false)}
            className="w-full bg-orange-600 hover:bg-orange-700"
          >
            Fechar
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
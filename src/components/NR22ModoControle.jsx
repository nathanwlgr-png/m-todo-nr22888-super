import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Zap, WifiOff, Wifi, Battery, BatteryLow, BatteryMedium } from 'lucide-react';
import { toast } from 'sonner';

// Chaves localStorage
const KEY_TURBO = 'nr22_turbo_mode';
const KEY_OFFLINE = 'nr22_offline_mode';
const KEY_CREDITS = 'nr22_credits_saved';
const KEY_CALLS = 'nr22_daily_calls';
const KEY_DATE = 'nr22_daily_date';

// Limite diário de chamadas IA em modo economia
const LIMIT_ECONOMIA = 20;
const LIMIT_TURBO = 80;

export function useNR22Modo() {
  const [turboMode, setTurboModeState] = useState(() => localStorage.getItem(KEY_TURBO) === 'true');
  const [offlineMode, setOfflineModeState] = useState(() => localStorage.getItem(KEY_OFFLINE) === 'true');
  const [dailyCalls, setDailyCalls] = useState(() => {
    const date = localStorage.getItem(KEY_DATE);
    const today = new Date().toDateString();
    if (date !== today) {
      localStorage.setItem(KEY_DATE, today);
      localStorage.setItem(KEY_CALLS, '0');
      return 0;
    }
    return parseInt(localStorage.getItem(KEY_CALLS) || '0', 10);
  });

  const limit = turboMode ? LIMIT_TURBO : LIMIT_ECONOMIA;
  const creditsSaved = parseInt(localStorage.getItem(KEY_CREDITS) || '0', 10);

  const setTurboMode = (val) => {
    setTurboModeState(val);
    localStorage.setItem(KEY_TURBO, val);
    toast.success(val ? '⚡ MODO TURBO ativado!' : '🔋 Modo Economia ativado');
  };

  const setOfflineMode = (val) => {
    setOfflineModeState(val);
    localStorage.setItem(KEY_OFFLINE, val);
    toast.info(val ? '📴 MODO OFFLINE — usando dados locais' : '🌐 Modo Online restaurado');
  };

  const canCallAI = () => {
    if (offlineMode) return false;
    return dailyCalls < limit;
  };

  const trackCall = () => {
    const next = dailyCalls + 1;
    setDailyCalls(next);
    localStorage.setItem(KEY_CALLS, String(next));
  };

  const trackSaved = () => {
    const next = creditsSaved + 1;
    localStorage.setItem(KEY_CREDITS, String(next));
  };

  // Detectar conexão real
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => { setIsOnline(false); if (!offlineMode) { setOfflineMode(true); } };
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, [offlineMode]);

  return { turboMode, offlineMode, setTurboMode, setOfflineMode, canCallAI, trackCall, trackSaved, dailyCalls, limit, creditsSaved, isOnline };
}

export default function NR22ModoControle({ compact = false }) {
  const { turboMode, offlineMode, setTurboMode, setOfflineMode, dailyCalls, limit, creditsSaved, isOnline } = useNR22Modo();
  const pct = Math.min((dailyCalls / limit) * 100, 100);
  const BatteryIcon = pct > 66 ? Battery : pct > 33 ? BatteryMedium : BatteryLow;
  const battColor = pct > 66 ? 'text-green-400' : pct > 33 ? 'text-yellow-400' : 'text-red-400';

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {!isOnline && <Badge className="bg-red-500 text-[9px] h-4 px-1">OFFLINE</Badge>}
        {turboMode && <Badge className="bg-yellow-400 text-black text-[9px] h-4 px-1">⚡TURBO</Badge>}
        <span className={`text-[9px] font-mono ${battColor}`}>{dailyCalls}/{limit}</span>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-xl p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-white">⚙️ Modo NR22</span>
        <div className="flex items-center gap-1">
          {isOnline ? <Wifi className="w-3 h-3 text-green-400" /> : <WifiOff className="w-3 h-3 text-red-400" />}
          <span className={`text-[10px] ${isOnline ? 'text-green-400' : 'text-red-400'}`}>{isOnline ? 'Online' : 'Offline'}</span>
        </div>
      </div>

      {/* Barra de créditos */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1">
            <BatteryIcon className={`w-3 h-3 ${battColor}`} />
            <span className="text-[10px] text-slate-300">Créditos IA: {dailyCalls}/{limit}</span>
          </div>
          <span className="text-[10px] text-slate-400">{creditsSaved} economizados</span>
        </div>
        <div className="h-1.5 bg-slate-600 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${pct > 66 ? 'bg-green-400' : pct > 33 ? 'bg-yellow-400' : 'bg-red-400'}`}
            style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Botões modo */}
      <div className="grid grid-cols-2 gap-1.5">
        <button
          onClick={() => setTurboMode(!turboMode)}
          className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
            turboMode ? 'bg-yellow-400 text-black' : 'bg-slate-600 text-slate-200 hover:bg-slate-500'
          }`}
        >
          <Zap className="w-3 h-3" />
          {turboMode ? '⚡ TURBO ON' : 'Modo Turbo'}
        </button>
        <button
          onClick={() => setOfflineMode(!offlineMode)}
          className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
            offlineMode ? 'bg-blue-500 text-white' : 'bg-slate-600 text-slate-200 hover:bg-slate-500'
          }`}
        >
          {offlineMode ? <WifiOff className="w-3 h-3" /> : <Wifi className="w-3 h-3" />}
          {offlineMode ? '📴 Offline' : 'Offline'}
        </button>
      </div>

      {offlineMode && (
        <div className="text-[9px] text-blue-300 bg-blue-900/30 rounded p-1.5 text-center">
          📴 Usando dados locais (sem consumir créditos)
        </div>
      )}
      {turboMode && (
        <div className="text-[9px] text-yellow-300 bg-yellow-900/30 rounded p-1.5 text-center">
          ⚡ Turbo: limite expandido para {LIMIT_TURBO} chamadas/dia
        </div>
      )}
    </div>
  );
}
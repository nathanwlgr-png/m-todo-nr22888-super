import React, { useState, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import ClinicAlertCard from '@/components/ClinicAlertCard';
import {
  Search, RefreshCw, Bell, MapPin, Zap, TrendingUp,
  Filter, Phone, AlertCircle, CheckCircle, Clock, X
} from 'lucide-react';

const STATES_BR = ['SP', 'MG', 'RJ', 'RS', 'PR', 'SC', 'BA', 'GO', 'MT', 'MS', 'ES', 'PE', 'CE'];
const STATUS_FILTERS = ['todos', 'novo', 'em_analise', 'contatado', 'descartado'];

export default function CompetitiveIntelligenceDashboard() {
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [city, setCity] = useState('');
  const [state, setState] = useState('SP');
  const [notifyPhone, setNotifyPhone] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [scoreFilter, setScoreFilter] = useState(0);
  const queryClient = useQueryClient();

  const { data: alerts = [], refetch } = useQuery({
    queryKey: ['clinic-alerts'],
    queryFn: () => base44.entities.ClinicAlert.list('-detected_at', 100),
    staleTime: 30000,
  });

  const filtered = alerts.filter(a => {
    const matchStatus = statusFilter === 'todos' || a.status === statusFilter;
    const matchScore = (a.seamaty_fit_score || 0) >= scoreFilter;
    return matchStatus && matchScore;
  });

  const kpis = {
    total: alerts.length,
    novos: alerts.filter(a => a.status === 'novo').length,
    alta_fit: alerts.filter(a => (a.seamaty_fit_score || 0) >= 80).length,
    wa_enviados: alerts.filter(a => a.whatsapp_alert_sent).length,
  };

  const handleScan = async () => {
    if (!city.trim()) return;
    if (!window.confirm('Esta ação pode consumir créditos ou processar muitos dados. Use apenas quando for realmente necessário. Confirma executar?')) {
      return;
    }
    setScanning(true);
    setScanResult(null);
    try {
      const res = await base44.functions.invoke('clinicCompetitiveMonitor', {
        city: city.trim(),
        state,
        radius_km: 100,
        notify_phone: notifyPhone.trim() || null,
      });
      setScanResult(res.data);
      refetch();
    } catch (e) {
      setScanResult({ error: e.message });
    }
    setScanning(false);
  };

  const handleStatusChange = useCallback((id, newStatus) => {
    queryClient.setQueryData(['clinic-alerts'], (old = []) =>
      old.map(a => a.id === id ? { ...a, status: newStatus } : a)
    );
  }, [queryClient]);

  return (
    <div className="min-h-screen pb-20" style={{ background: '#0a0a0a' }}>
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255,107,0,0.2)', border: '1px solid rgba(255,107,0,0.4)' }}>
            <TrendingUp className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">Inteligência Competitiva</h1>
            <p className="text-xs text-orange-600">Radar de novas clínicas • Alertas automáticos</p>
            <p className="text-[10px] text-orange-500 mt-1">Modo econômico ativo — execute apenas sob necessidade.</p>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-2 px-4 mb-4">
        {[
          { label: 'Total', val: kpis.total, color: '#ff9500' },
          { label: 'Novos', val: kpis.novos, color: '#00ff88' },
          { label: 'Alta Fit', val: kpis.alta_fit, color: '#ff6b00' },
          { label: 'WA Enviados', val: kpis.wa_enviados, color: '#00bfff' },
        ].map(({ label, val, color }) => (
          <div key={label} className="rounded-xl p-2.5 text-center"
            style={{ background: '#141414', border: `1px solid ${color}33` }}>
            <p className="text-lg font-black" style={{ color }}>{val}</p>
            <p className="text-[9px] text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Scan Form */}
      <div className="mx-4 rounded-2xl p-4 mb-4" style={{ background: '#111', border: '1px solid rgba(255,107,0,0.3)' }}>
        <p className="text-xs font-black text-orange-400 uppercase tracking-widest mb-3">🔍 Novo Scan de Região</p>

        <div className="flex gap-2 mb-2">
          <input
            value={city}
            onChange={e => setCity(e.target.value)}
            placeholder="Cidade (ex: Marília, Bauru)"
            className="flex-1 px-3 h-10 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none"
            style={{ background: '#1a1a1a', border: '1px solid rgba(255,107,0,0.3)' }}
          />
          <select value={state} onChange={e => setState(e.target.value)}
            className="w-20 px-2 h-10 rounded-xl text-sm text-white focus:outline-none"
            style={{ background: '#1a1a1a', border: '1px solid rgba(255,107,0,0.3)' }}>
            {STATES_BR.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <input
          value={notifyPhone}
          onChange={e => setNotifyPhone(e.target.value)}
          placeholder="WhatsApp p/ alerta (5511999999999) — opcional"
          className="w-full px-3 h-10 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none mb-3"
          style={{ background: '#1a1a1a', border: '1px solid rgba(0,255,136,0.2)' }}
        />

        <Button onClick={handleScan} disabled={scanning || !city.trim()}
          className="w-full font-black gap-2 h-11"
          style={{ background: scanning ? '#333' : 'linear-gradient(135deg, #ff6b00, #ff9500)', color: 'white' }}>
          {scanning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          {scanning ? 'Escaneando com IA...' : 'Executar manualmente com confirmação'}
        </Button>

        {/* Scan Result */}
        {scanResult && !scanResult.error && (
          <div className="mt-3 rounded-xl p-3" style={{ background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.2)' }}>
            <p className="text-xs font-black text-green-400 mb-1">✅ Scan Concluído!</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-lg font-black text-white">{scanResult.total_found || 0}</p>
                <p className="text-[9px] text-slate-500">Detectadas</p>
              </div>
              <div>
                <p className="text-lg font-black text-green-400">{scanResult.high_fit_new || 0}</p>
                <p className="text-[9px] text-slate-500">Alto Fit</p>
              </div>
              <div>
                <p className="text-lg font-black text-blue-400">{scanResult.saved_alerts || 0}</p>
                <p className="text-[9px] text-slate-500">Salvas</p>
              </div>
            </div>
            {scanResult.whatsapp_sent && (
              <p className="text-xs text-green-400 mt-2 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Alerta WhatsApp enviado!
              </p>
            )}
            {scanResult.market_summary && (
              <p className="text-xs text-slate-400 mt-2">{scanResult.market_summary}</p>
            )}
          </div>
        )}
        {scanResult?.error && (
          <div className="mt-3 rounded-xl p-3" style={{ background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.3)' }}>
            <p className="text-xs text-red-400">❌ {scanResult.error}</p>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="px-4 mb-3">
        <div className="flex gap-2 overflow-x-auto pb-1 mb-2">
          {STATUS_FILTERS.map(f => (
            <button key={f} onClick={() => setStatusFilter(f)}
              className="shrink-0 px-3 py-1.5 rounded-full text-xs font-bold capitalize transition-all"
              style={statusFilter === f
                ? { background: '#ff6b00', color: 'white' }
                : { background: '#1a1a1a', color: '#ff9500', border: '1px solid rgba(255,107,0,0.2)' }}>
              {f}
            </button>
          ))}
        </div>

        {/* Score slider */}
        <div className="flex items-center gap-3">
          <p className="text-xs text-slate-500 whitespace-nowrap">Fit mín:</p>
          <input type="range" min={0} max={90} step={10} value={scoreFilter}
            onChange={e => setScoreFilter(Number(e.target.value))}
            className="flex-1 accent-orange-500" />
          <span className="text-xs font-bold text-orange-400 w-8">{scoreFilter}+</span>
        </div>
      </div>

      {/* Alerts List */}
      <div className="px-4">
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="w-10 h-10 mx-auto mb-2 text-orange-800" />
            <p className="text-sm text-orange-700">
              {alerts.length === 0
                ? 'Faça um scan para detectar novas clínicas'
                : 'Nenhuma clínica com os filtros aplicados'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-slate-600">{filtered.length} alertas</p>
            {filtered.map(alert => (
              <ClinicAlertCard key={alert.id} alert={alert} onStatusChange={handleStatusChange} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
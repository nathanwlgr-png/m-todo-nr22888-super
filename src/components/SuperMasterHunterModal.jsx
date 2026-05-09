import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Loader2, MapPin, Users, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

/**
 * Super Master Hunter Modal — Busca investigativa suprema
 * Score Seamaty (0-100) + GPS + Potencial Insumo
 */

const CITIES = [
  'Botucatu', 'Marília', 'Garça', 'Bauru', 'Ourinhos', 'Jaú', 
  'Assis', 'Lins', 'Tupã', 'Avaré', 'Tietê', 'Agudos', 'Pederneiras',
  'Iacanga', 'Igaraçu do Tietê', 'Novo Horizonte', 'São Manuel',
];

const SEGMENTS = [
  { id: 'clinic', label: '🏥 Clínica Veterinária', emoji: '🏥' },
  { id: 'hospital', label: '🏨 Hospital Veterinário', emoji: '🏨' },
  { id: 'lab', label: '🧪 Laboratório', emoji: '🧪' },
  { id: 'diagnostic', label: '🔬 Centro Diagnóstico', emoji: '🔬' },
  { id: 'university', label: '🎓 Universidade', emoji: '🎓' },
];

const DEPTHS = [
  { id: 'rapid', label: '⚡ Rápida (30s)', cost: 25, params: 'Google + CRM' },
  { id: 'complete', label: '🔍 Completa (90s)', cost: 50, params: 'Google + Maps + Instagram' },
  { id: 'supreme', label: '👑 Suprema (2min)', cost: 100, params: 'Tudo + análise profunda' },
];

const RADIUSES = [5, 10, 20, 30, 50];

export default function SuperMasterHunterModal({ onClose, onSearch }) {
  const [city, setCity] = useState('Marília');
  const [radius, setRadius] = useState(10);
  const [depth, setDepth] = useState('complete');
  const [segments, setSegments] = useState(['clinic']);
  const [leadCount, setLeadCount] = useState(25);
  const [isSearching, setIsSearching] = useState(false);

  const currentDepth = DEPTHS.find(d => d.id === depth);
  const totalCost = currentDepth.cost;

  const toggleSegment = (segmentId) => {
    setSegments(prev => 
      prev.includes(segmentId)
        ? prev.filter(s => s !== segmentId)
        : [...prev, segmentId]
    );
  };

  const handleSearch = async () => {
    if (!city) {
      toast.error('Selecione uma cidade');
      return;
    }

    if (segments.length === 0) {
      toast.error('Selecione pelo menos um segmento');
      return;
    }

    setIsSearching(true);

    try {
      toast.info(`🔍 Buscando ${segments.length} segmento(s) em ${city}...`);

      const result = await base44.functions.invoke('superMasterHunter', {
        city,
        radius_km: radius,
        depth,
        segments,
        quantity: Math.min(leadCount, 25),
      });

      if (onSearch) {
        onSearch(result.data);
      }

      toast.success(`✅ Encontrados ${result.data.results_count || 0} leads!`);
      
      // Registrar busca na auditoria
      await base44.functions.invoke('auditTracker', {
        action: 'super_master_hunter_search',
        city,
        radius,
        depth,
        segments_count: segments.length,
        results_count: result.data.results_count || 0,
        credits_spent: totalCost,
      }).catch(() => {});

    } catch (error) {
      toast.error(`Erro: ${error.message}`);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700">
        <CardHeader className="sticky top-0 bg-slate-800 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              ⚠️ Super Master Hunter
            </CardTitle>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200"
            >
              ✕
            </button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">

          {/* ALERTA */}
          <div className="bg-orange-950 border-2 border-orange-600 rounded-lg p-4 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-bold text-orange-200">⚠️ Confirmação Necessária</p>
              <p className="text-orange-300 text-xs mt-1">Esta operação custará <strong>{totalCost} créditos</strong> e processará dados públicos de <strong>{city}</strong>.</p>
              <p className="text-orange-400 text-xs mt-1">✅ Dados são públicos (Google, Maps, Instagram)</p>
              <p className="text-orange-400 text-xs">✅ Cruzamento com CRM (sem dados privados de terceiros)</p>
            </div>
          </div>

          {/* CIDADE */}
          <div>
            <label className="block text-sm font-bold text-white mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              Cidade
            </label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white font-bold"
            >
              {CITIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* RAIO */}
          <div>
            <label className="block text-sm font-bold text-white mb-2">
              📍 Raio de Busca
            </label>
            <div className="grid grid-cols-5 gap-2">
              {RADIUSES.map(r => (
                <button
                  key={r}
                  onClick={() => setRadius(r)}
                  className={`py-2 rounded-lg font-bold text-sm transition-all ${
                    radius === r
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {r}km
                </button>
              ))}
            </div>
          </div>

          {/* PROFUNDIDADE */}
          <div>
            <label className="block text-sm font-bold text-white mb-2">
              🔍 Profundidade de Busca
            </label>
            <div className="space-y-2">
              {DEPTHS.map(d => (
                <button
                  key={d.id}
                  onClick={() => setDepth(d.id)}
                  className={`w-full p-3 rounded-lg text-left transition-all border-2 ${
                    depth === d.id
                      ? 'bg-slate-700 border-yellow-500'
                      : 'bg-slate-800 border-slate-600 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`font-bold ${depth === d.id ? 'text-yellow-400' : 'text-white'}`}>
                        {d.label}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">{d.params}</p>
                    </div>
                    <Badge className={depth === d.id ? 'bg-yellow-600' : 'bg-slate-600'}>
                      {d.cost} 💰
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* SEGMENTOS */}
          <div>
            <label className="block text-sm font-bold text-white mb-2">
              <Users className="w-4 h-4 inline mr-1" />
              Segmentos (mín. 1)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {SEGMENTS.map(seg => (
                <button
                  key={seg.id}
                  onClick={() => toggleSegment(seg.id)}
                  className={`p-3 rounded-lg font-bold text-sm transition-all border-2 ${
                    segments.includes(seg.id)
                      ? 'bg-green-600 border-green-400 text-white'
                      : 'bg-slate-800 border-slate-600 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {seg.emoji} {seg.label}
                </button>
              ))}
            </div>
          </div>

          {/* QUANTIDADE DE LEADS */}
          <div>
            <label className="block text-sm font-bold text-white mb-2">
              Máximo de Leads (1-25)
            </label>
            <input
              type="range"
              min="1"
              max="25"
              value={leadCount}
              onChange={(e) => setLeadCount(parseInt(e.target.value))}
              className="w-full"
            />
            <p className="text-center text-yellow-400 font-bold mt-2">
              {leadCount} leads
            </p>
          </div>

          {/* RESUMO DE CUSTOS */}
          <Card className="bg-slate-800 border-slate-600">
            <CardContent className="pt-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-300">Profundidade:</span>
                  <span className="font-bold text-white">{currentDepth.label}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-300">Custo Estimado:</span>
                  <span className="font-bold text-yellow-400">{totalCost} créditos</span>
                </div>
                <div className="h-px bg-slate-600 my-2"></div>
                <div className="flex justify-between">
                  <span className="text-white font-bold">TOTAL:</span>
                  <span className="font-black text-yellow-300">{totalCost} 💰</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* BOTÕES AÇÃO */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 text-slate-300 border-slate-600 hover:bg-slate-800"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSearch}
              disabled={isSearching || segments.length === 0}
              className="flex-1 gap-2 font-bold bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white"
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Buscando...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Buscar {leadCount} Leads
                </>
              )}
            </Button>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useMutation } from '@tanstack/react-query';
import { Loader2, Search, AlertTriangle, MapPin, Phone, Globe } from 'lucide-react';
import { toast } from 'sonner';

const CITIES = [
  'Botucatu', 'Marília', 'Garça', 'Bauru', 'Ourinhos',
  'Jaú', 'Assis', 'Lins', 'Tupã', 'Avaré'
];

const SEGMENTS = [
  { id: 'clinica', label: '🏥 Clínica Veterinária' },
  { id: 'hospital', label: '🚑 Hospital Veterinário' },
  { id: 'laboratorio', label: '🔬 Laboratório' },
  { id: 'centro_diagnostico', label: '📊 Centro Diagnóstico' },
  { id: 'universidade', label: '🎓 Universidade' },
];

const DEPTHS = [
  { id: 'rapida', label: 'Rápida', desc: '5-10 leads, 30s', credits: 3 },
  { id: 'completa', label: 'Completa', desc: '15-25 leads, 90s', credits: 8 },
  { id: 'suprema', label: 'Suprema', desc: '25 leads máx, 120s', credits: 15 },
];

const PRIORITY_COLORS = {
  frio: 'bg-slate-100 text-slate-800 border-slate-300',
  potencial: 'bg-blue-100 text-blue-800 border-blue-300',
  quente: 'bg-orange-100 text-orange-800 border-orange-300',
  urgente: 'bg-red-100 text-red-800 border-red-300',
  raro: 'bg-purple-100 text-purple-800 border-purple-300',
};

export default function SuperMasterHunter() {
  const [city, setCity] = useState('');
  const [radius, setRadius] = useState(15);
  const [depth, setDepth] = useState('rapida');
  const [selectedSegments, setSelectedSegments] = useState(['clinica']);
  const [quantity, setQuantity] = useState(10);
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);

  const selectedDepth = DEPTHS.find(d => d.id === depth);

  const searchMutation = useMutation({
    mutationFn: async () => {
      if (!city) throw new Error('Selecione uma cidade');
      if (selectedSegments.length === 0) throw new Error('Selecione pelo menos um segmento');

      setSearching(true);
      toast.info(`🔍 Buscando ${quantity} leads em ${city}... (${selectedDepth.credits} créditos)`);

      const result = await base44.functions.invoke('superMasterHunter', {
        city,
        radius_km: radius,
        depth,
        segments: selectedSegments,
        quantity: Math.min(quantity, 25),
        timeout_seconds: parseInt(selectedDepth.desc.match(/\d+/)[0]),
      });

      return result.data;
    },
    onSuccess: (data) => {
      setResults(data);
      toast.success(`✅ ${data.results_count} leads encontrados!`);
      setSearching(false);
    },
    onError: (err) => {
      toast.error('Erro: ' + err.message);
      setSearching(false);
    }
  });

  const toggleSegment = (segmentId) => {
    setSelectedSegments(prev =>
      prev.includes(segmentId)
        ? prev.filter(s => s !== segmentId)
        : [...prev, segmentId]
    );
  };

  return (
    <div className="space-y-6">
      
      {/* CONFIGURAÇÃO */}
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-900">
            <AlertTriangle className="w-5 h-5" />
            Super Master Hunter
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          
          {/* Cidade */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">📍 Cidade</label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
            >
              <option value="">Selecione uma cidade</option>
              {CITIES.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Raio */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">📏 Raio: {radius}km</label>
            <input
              type="range"
              min="5"
              max="50"
              value={radius}
              onChange={(e) => setRadius(parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Profundidade */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">⚡ Profundidade</label>
            <div className="grid grid-cols-3 gap-2">
              {DEPTHS.map(d => (
                <button
                  key={d.id}
                  onClick={() => setDepth(d.id)}
                  className={`p-2 rounded border-2 transition-all text-sm ${
                    depth === d.id
                      ? 'border-amber-500 bg-amber-100'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  <p className="font-bold">{d.label}</p>
                  <p className="text-xs text-slate-600">{d.credits}cr</p>
                </button>
              ))}
            </div>
          </div>

          {/* Segmentos */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">🏢 Segmentos</label>
            <div className="space-y-2">
              {SEGMENTS.map(seg => (
                <label key={seg.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedSegments.includes(seg.id)}
                    onChange={() => toggleSegment(seg.id)}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-sm">{seg.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Quantidade */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">📊 Quantidade Máx: {quantity}</label>
            <input
              type="range"
              min="1"
              max="25"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Aviso */}
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-900">
            <p className="font-bold mb-1">⏱️ Limites Rígidos</p>
            <p>• Máximo 25 leads por busca</p>
            <p>• Timeout: {selectedDepth.desc.match(/\d+ ?min|seconds/)[0]}</p>
            <p>• Sem dados duplicados</p>
            <p>• Cache 30 dias</p>
          </div>

          {/* Botão Buscar */}
          <Button
            onClick={() => searchMutation.mutate()}
            disabled={searching || !city || selectedSegments.length === 0}
            className="w-full bg-red-600 hover:bg-red-700 gap-2 h-12"
            size="lg"
          >
            {searching ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Search className="w-5 h-5" />
            )}
            {searching ? 'Buscando...' : 'Iniciar Busca'}
          </Button>

        </CardContent>
      </Card>

      {/* RESULTADOS */}
      {results && (
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>✅ {results.results_count} Resultados</span>
              <Badge variant="outline">{results.execution_time_ms}ms</Badge>
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-3 max-h-96 overflow-y-auto">
            {results.leads.map((lead, idx) => (
              <div key={idx} className={`p-3 rounded-lg border-2 ${PRIORITY_COLORS[lead.seamaty_priority]}`}>
                
                {/* Header */}
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-bold">{lead.name}</p>
                    <p className="text-xs">{lead.segment} • {lead.distance_km}km</p>
                  </div>
                  <Badge className="bg-orange-600 text-white">
                    {lead.seamaty_score}%
                  </Badge>
                </div>

                {/* Contato */}
                <div className="space-y-1 text-sm mb-2">
                  {lead.phone && (
                    <a href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-600 hover:underline">
                      <Phone className="w-3 h-3" />
                      {lead.phone}
                    </a>
                  )}
                  {lead.website && (
                    <a href={lead.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-600 hover:underline">
                      <Globe className="w-3 h-3" />
                      Website
                    </a>
                  )}
                  {lead.maps_url && (
                    <a href={lead.maps_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-600 hover:underline">
                      <MapPin className="w-3 h-3" />
                      Maps
                    </a>
                  )}
                </div>

                {/* Potencial */}
                <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                  <div>
                    <p className="font-bold text-slate-700">Produto Ideal</p>
                    <p>{lead.potential_product}</p>
                  </div>
                  <div>
                    <p className="font-bold text-slate-700">Próxima Ação</p>
                    <p>{lead.next_action}</p>
                  </div>
                </div>

                {/* Fonte */}
                <div className="text-xs text-slate-600">
                  <span className="font-bold">Fontes:</span> {lead.data_source.join(', ')}
                </div>

              </div>
            ))}
          </CardContent>
        </Card>
      )}

    </div>
  );
}
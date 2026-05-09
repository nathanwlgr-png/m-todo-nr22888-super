import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export default function SuperMasterHunterModal({ isOpen, onClose }) {
  const [step, setStep] = useState(1); // 1 = aviso, 2 = configuração, 3 = resultados
  const [city, setCity] = useState('');
  const [radius, setRadius] = useState(5);
  const [segment, setSegment] = useState('veterinario');
  const [maxLeads, setMaxLeads] = useState(10);
  const [depth, setDepth] = useState('profunda');
  const [results, setResults] = useState(null);

  const queryClient = useQueryClient();

  const scanMutation = useMutation({
    mutationFn: async () => {
      if (!city.trim()) {
        toast.error('Cidade é obrigatória');
        throw new Error('City required');
      }

      toast.info('🔍 Iniciando Super Master Hunter...');
      const res = await base44.functions.invoke('superMasterHunterScan', {
        city: city.trim(),
        radius: parseInt(radius),
        segment,
        max_leads: parseInt(maxLeads),
        depth
      });

      return res.data;
    },
    onSuccess: (data) => {
      setResults(data);
      setStep(3);
      toast.success(`✅ ${data.summary.message}`);
      queryClient.invalidateQueries({ queryKey: ['leadhunter'] });
    },
    onError: (err) => {
      toast.error('Erro: ' + err.message);
    }
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <Card className="bg-slate-800 border-red-500/50 max-w-lg w-full shadow-2xl">
        {/* STEP 1: Aviso */}
        {step === 1 && (
          <>
            <CardHeader className="flex justify-between items-center">
              <CardTitle className="text-white flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-red-500" />
                Modo Investigativo Supremo
              </CardTitle>
              <button onClick={onClose} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-xl p-4" style={{ background: '#1a0000', border: '1px solid rgba(239,68,68,0.3)' }}>
                <p className="text-sm text-red-300 leading-relaxed">
                  ⚠️ Esse modo realiza investigação aprofundada de prospects e <strong>pode consumir mais créditos</strong>.
                </p>
                <p className="text-xs text-red-600 mt-2">
                  Estimado: 1-3 créditos dependendo da profundidade.
                </p>
              </div>

              <div className="space-y-2 text-sm text-slate-300">
                <p>✅ Procura clínicas, hospitais, labs, universidades</p>
                <p>✅ Detecta sinais de crescimento e oportunidade</p>
                <p>✅ Gera scores de urgência e potencial</p>
                <p>✅ Salva automaticamente como leads no CRM</p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={onClose}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1 bg-red-600 hover:bg-red-700 gap-2"
                  onClick={() => setStep(2)}
                >
                  <AlertTriangle className="w-4 h-4" />
                  Continuar
                </Button>
              </div>
            </CardContent>
          </>
        )}

        {/* STEP 2: Configuração */}
        {step === 2 && (
          <>
            <CardHeader>
              <CardTitle className="text-white">Configurar Busca</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-2">Cidade *</label>
                <Input
                  placeholder="São Paulo"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-2">Raio (km)</label>
                  <Input
                    type="number"
                    min="1"
                    max="50"
                    value={radius}
                    onChange={(e) => setRadius(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-2">Máx Leads</label>
                  <Input
                    type="number"
                    min="1"
                    max="25"
                    value={maxLeads}
                    onChange={(e) => setMaxLeads(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-2">Segmento</label>
                <select
                  value={segment}
                  onChange={(e) => setSegment(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white text-sm"
                >
                  <option value="veterinario">Veterinário</option>
                  <option value="laboratorio">Laboratório</option>
                  <option value="hospital">Hospital</option>
                  <option value="clinica">Clínica</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-2">Profundidade</label>
                <div className="grid grid-cols-2 gap-2">
                  {['leve', 'media', 'profunda', 'suprema'].map(opt => (
                    <button
                      key={opt}
                      onClick={() => setDepth(opt)}
                      className={`px-3 py-2 rounded-lg text-xs font-bold transition-all capitalize ${
                        depth === opt
                          ? 'bg-red-600 text-white border border-red-500'
                          : 'bg-slate-700 text-slate-300 border border-slate-600 hover:bg-slate-600'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep(1)}
                >
                  Voltar
                </Button>
                <Button
                  className="flex-1 bg-red-600 hover:bg-red-700 gap-2"
                  disabled={scanMutation.isPending || !city.trim()}
                  onClick={() => scanMutation.mutate()}
                >
                  {scanMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <AlertTriangle className="w-4 h-4" />
                  )}
                  Iniciar Busca
                </Button>
              </div>
            </CardContent>
          </>
        )}

        {/* STEP 3: Resultados */}
        {step === 3 && results && (
          <>
            <CardHeader className="flex justify-between items-center">
              <CardTitle className="text-white">✅ Busca Concluída</CardTitle>
              <button onClick={onClose} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl p-4" style={{ background: '#001a00', border: '1px solid rgba(34,197,94,0.3)' }}>
                <p className="text-sm font-bold text-green-400 mb-2">{results.summary.message}</p>
                <p className="text-xs text-green-600">ROI Estimado: {results.summary.estimated_roi}</p>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg p-3" style={{ background: '#1a0a00' }}>
                  <p className="text-2xl font-black text-orange-400">{results.total_found}</p>
                  <p className="text-xs text-orange-600">Encontrados</p>
                </div>
                <div className="rounded-lg p-3" style={{ background: '#1a0000' }}>
                  <p className="text-2xl font-black text-red-400">{results.urgentes_count}</p>
                  <p className="text-xs text-red-600">Urgentes</p>
                </div>
                <div className="rounded-lg p-3" style={{ background: '#0a1a00' }}>
                  <p className="text-2xl font-black text-green-400">{results.quentes_count}</p>
                  <p className="text-xs text-green-600">Quentes</p>
                </div>
              </div>

              <div className="rounded-lg p-3 text-xs text-slate-400 space-y-1" style={{ background: '#0a0a0a' }}>
                <p>📊 Profundidade: <span className="text-slate-300 font-bold capitalize">{results.scan_depth}</span></p>
                <p>⏱️ Duração: {(results.duration_ms / 1000).toFixed(1)}s</p>
                <p>📍 Cidade: <span className="text-slate-300 font-bold">{results.city}</span></p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={onClose}
                >
                  Fechar
                </Button>
                <Button
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                  onClick={() => {
                    window.location.href = '/DeepHunter';
                  }}
                >
                  Ver Leads
                </Button>
              </div>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
}
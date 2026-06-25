import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Radar, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function BotaoRadarQuente() {
  const [city, setCity] = useState('Marília');
  const [rodando, setRodando] = useState(false);
  const [resultado, setResultado] = useState(null);

  const rodar = async () => {
    if (rodando || city.trim().length < 3) return;
    setRodando(true);
    setResultado(null);
    try {
      const res = await base44.functions.invoke('radarProspeccaoQuente', { city: city.trim(), state: 'SP' });
      setResultado(res?.data?.quentes_capturadas ?? 0);
    } catch (_e) {
      setResultado(0);
    } finally {
      setRodando(false);
    }
  };

  return (
    <Card className="bg-slate-950 border-red-500/40">
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-center gap-2">
          <Radar className="w-4 h-4 text-red-400" />
          <p className="text-sm font-black text-red-300">Radar de Prospecção Quente</p>
        </div>
        <p className="text-[11px] text-slate-400">
          A IA varre a região e captura quem usa concorrente ou terceirizado, com argumento de ataque pronto.
        </p>
        <div className="flex gap-2">
          <Input
            value={city}
            onChange={e => setCity(e.target.value)}
            placeholder="Cidade base (ex: Marília)"
            className="bg-slate-900 border-slate-700 text-white"
            onKeyDown={e => e.key === 'Enter' && rodar()}
          />
          <Button onClick={rodar} disabled={rodando || city.trim().length < 3} className="bg-red-600 hover:bg-red-700 shrink-0 font-bold">
            {rodando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Radar className="w-4 h-4" />}
          </Button>
        </div>
        {rodando && <p className="text-[11px] text-red-300 text-center">🔎 Varrendo {city} (pode levar ~1 min)…</p>}
        {resultado !== null && !rodando && (
          <div className="rounded-lg p-2 bg-red-500/10 border border-red-500/30 text-[11px] text-red-200 text-center font-bold">
            {resultado > 0
              ? `🎯 ${resultado} oportunidade(s) quente(s) capturada(s). Veja no Ranking de Oportunidades.`
              : '✅ Nenhuma oportunidade nova quente encontrada agora.'}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
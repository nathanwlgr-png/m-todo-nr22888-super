/**
 * /debug-caca — Painel de diagnóstico do Modo Caça Comercial
 * Acesso oculto: apenas via URL direta
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, MapPin, Wifi, Clock, Database, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cacaDebugStore } from '@/lib/cacaDebugStore';

export default function DebugCaca() {
  const [data, setData] = useState({});
  const [gps, setGps] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [refreshAt, setRefreshAt] = useState(new Date());

  const refresh = () => {
    setData({ ...cacaDebugStore });
    setRefreshAt(new Date());
  };

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleTestGPS = () => {
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy });
        setGpsLoading(false);
      },
      (err) => {
        setGps({ error: err.message });
        setGpsLoading(false);
      },
      { timeout: 10000 }
    );
  };

  const Row = ({ label, value, mono }) => (
    <div className="flex items-start gap-2 py-1.5 border-b border-slate-800">
      <span className="text-slate-500 text-xs w-36 shrink-0">{label}</span>
      <span className={`text-xs break-all ${mono ? 'font-mono text-green-400' : 'text-slate-200'}`}>
        {value === null || value === undefined ? <span className="text-slate-600 italic">—</span> : String(value)}
      </span>
    </div>
  );

  return (
    <div className="min-h-screen bg-black p-4 text-white">
      <div className="max-w-2xl mx-auto space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-black text-orange-400">🔧 Debug — Modo Caça</h1>
            <p className="text-slate-500 text-xs">Painel técnico oculto • Atualiza a cada 3s</p>
          </div>
          <Button size="sm" variant="outline" onClick={refresh} className="text-orange-400 border-orange-700 text-xs">
            <RefreshCw className="w-3 h-3 mr-1" /> Atualizar
          </Button>
        </div>

        <p className="text-slate-600 text-[10px]">Última atualização: {refreshAt.toLocaleTimeString('pt-BR')}</p>

        {/* Última Busca */}
        <Card className="bg-slate-950 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-orange-300 flex items-center gap-2">
              <Database className="w-4 h-4" /> Última Busca de Clínicas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Row label="Endpoint" value={data.lastEndpoint} mono />
            <Row label="Cidade" value={data.lastCity} />
            <Row label="Status resposta" value={data.lastStatus} />
            <Row label="Duração" value={data.lastDurationMs ? `${data.lastDurationMs}ms` : null} />
            <Row label="Clínicas retornadas" value={data.lastResultCount} />
            <div className="mt-2">
              <p className="text-slate-500 text-xs mb-1">Payload enviado:</p>
              <pre className="text-[10px] bg-slate-900 rounded p-2 text-green-400 overflow-auto max-h-32">
                {data.lastPayload ? JSON.stringify(data.lastPayload, null, 2) : '—'}
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* Último Erro */}
        <Card className="bg-slate-950 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              {data.lastError
                ? <><AlertCircle className="w-4 h-4 text-red-400" /> <span className="text-red-400">Último Erro</span></>
                : <><CheckCircle2 className="w-4 h-4 text-green-400" /> <span className="text-green-400">Sem Erros Recentes</span></>
              }
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.lastError
              ? <pre className="text-[10px] bg-red-950 rounded p-2 text-red-300 overflow-auto max-h-24">{data.lastError}</pre>
              : <p className="text-slate-600 text-xs italic">Nenhum erro registrado nesta sessão.</p>
            }
          </CardContent>
        </Card>

        {/* GPS */}
        <Card className="bg-slate-950 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-blue-300 flex items-center gap-2">
              <MapPin className="w-4 h-4" /> GPS do Dispositivo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Row label="GPS salvo (caça)" value={data.lastGPS ? `${data.lastGPS.lat?.toFixed(5)}, ${data.lastGPS.lng?.toFixed(5)}` : null} mono />
            {gps && (
              <>
                <Row label="GPS testado" value={gps.error || `${gps.lat?.toFixed(5)}, ${gps.lng?.toFixed(5)}`} mono />
                {gps.accuracy && <Row label="Precisão" value={`${gps.accuracy?.toFixed(0)}m`} />}
              </>
            )}
            <Button
              size="sm"
              className="bg-blue-700 hover:bg-blue-600 text-xs"
              onClick={handleTestGPS}
              disabled={gpsLoading}
            >
              {gpsLoading ? 'Obtendo GPS...' : '📍 Testar GPS agora'}
            </Button>
          </CardContent>
        </Card>

        {/* Cache local */}
        <Card className="bg-slate-950 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-purple-300 flex items-center gap-2">
              <Clock className="w-4 h-4" /> Cache Local (30 dias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const keys = Object.keys(localStorage).filter(k => k.startsWith('caca_v3_'));
              if (keys.length === 0) return <p className="text-slate-600 text-xs italic">Sem cache armazenado.</p>;
              return keys.map(k => {
                try {
                  const { ts, data: d } = JSON.parse(localStorage.getItem(k));
                  const city = k.replace('caca_v3_', '');
                  const age = Math.round((Date.now() - ts) / 3600000);
                  return (
                    <div key={k} className="flex items-center justify-between py-1 border-b border-slate-800">
                      <span className="text-xs text-slate-300">{city}</span>
                      <div className="flex gap-2 items-center">
                        <Badge className="bg-slate-800 text-slate-400 text-[9px]">{d?.length || 0} clínicas</Badge>
                        <span className="text-[10px] text-slate-500">{age}h atrás</span>
                        <button
                          className="text-red-500 text-[10px] hover:underline"
                          onClick={() => { localStorage.removeItem(k); refresh(); }}
                        >limpar</button>
                      </div>
                    </div>
                  );
                } catch { return null; }
              });
            })()}
          </CardContent>
        </Card>

        <p className="text-center text-slate-700 text-[10px] pb-8">
          🔒 Painel restrito — não compartilhar link
        </p>
      </div>
    </div>
  );
}
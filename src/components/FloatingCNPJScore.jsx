import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, X, Search, Shield } from 'lucide-react';

export default function FloatingCNPJScore() {
  const [open, setOpen] = useState(false);
  const [cnpj, setCnpj] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const formatCNPJ = (value) => {
    const nums = value.replace(/\D/g, '').slice(0, 14);
    return nums
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  };

  const handleConsulta = async () => {
    const cnpjLimpo = cnpj.replace(/\D/g, '');
    if (cnpjLimpo.length !== 14) {
      setError('CNPJ deve ter 14 dígitos');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const resp = await base44.functions.invoke('consultarCNPJScore', { cnpj: cnpjLimpo });
      setResult(resp.data);
    } catch (e) {
      setError(e.message || 'Erro na consulta');
    } finally {
      setLoading(false);
    }
  };

  const scoreColor = result
    ? result.score_estimado >= 700 ? 'text-green-600' : result.score_estimado >= 500 ? 'text-yellow-600' : 'text-red-600'
    : '';
  const scoreBg = result
    ? result.score_estimado >= 700 ? 'bg-green-50 border-green-300' : result.score_estimado >= 500 ? 'bg-yellow-50 border-yellow-300' : 'bg-red-50 border-red-300'
    : '';

  return (
    <>
      {/* Botão Flutuante */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed right-4 bottom-32 z-50 w-14 h-14 rounded-full bg-orange-500 hover:bg-orange-600 shadow-2xl flex items-center justify-center text-white transition-all active:scale-95"
          title="Consultar CNPJ + Score Serasa"
        >
          <Shield className="w-6 h-6" />
        </button>
      )}

      {/* Painel */}
      {open && (
        <div className="fixed right-4 bottom-32 z-50 w-80 bg-white rounded-2xl shadow-2xl border-2 border-orange-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-white" />
              <span className="text-white font-bold text-sm">Score Serasa / CNPJ</span>
            </div>
            <button onClick={() => { setOpen(false); setResult(null); setCnpj(''); setError(''); }}>
              <X className="w-5 h-5 text-white/80 hover:text-white" />
            </button>
          </div>

          <div className="p-4 space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="00.000.000/0001-00"
                value={cnpj}
                onChange={(e) => setCnpj(formatCNPJ(e.target.value))}
                onKeyDown={(e) => e.key === 'Enter' && handleConsulta()}
                className="flex-1 text-sm"
                maxLength={18}
              />
              <Button
                onClick={handleConsulta}
                disabled={loading}
                className="bg-orange-500 hover:bg-orange-600 px-3"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              </Button>
            </div>

            {error && (
              <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg">{error}</p>
            )}

            {result && (
              <div className={`rounded-xl border-2 p-3 space-y-2 ${scoreBg}`}>
                <div className="flex items-center justify-between">
                  <p className="font-bold text-slate-800 text-sm leading-tight">{result.razao_social}</p>
                  <span className={`text-2xl font-black ${scoreColor}`}>{result.score_estimado}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    result.score_estimado >= 700 ? 'bg-green-500 text-white' :
                    result.score_estimado >= 500 ? 'bg-yellow-500 text-white' : 'bg-red-500 text-white'
                  }`}>
                    {result.nivel_risco}
                  </span>
                  <span className="text-xs text-slate-600">{result.situacao}</span>
                </div>

                <div className="text-xs text-slate-600 space-y-1">
                  <p>📍 {result.municipio} / {result.uf}</p>
                  <p>🏭 {result.porte || 'Porte não inf.'} · {result.tempo_mercado}</p>
                  <p>💰 Capital: R$ {(result.capital_social || 0).toLocaleString('pt-BR')}</p>
                </div>

                {/* Recomendação de Boleto — decisão principal */}
                <div className={`text-xs font-bold p-2 rounded-lg text-center border-2 ${
                  result.score_estimado >= 700 ? 'bg-green-100 text-green-800 border-green-400' :
                  result.score_estimado >= 650 ? 'bg-yellow-100 text-yellow-800 border-yellow-400' :
                  'bg-red-100 text-red-800 border-red-400'
                }`}>
                  💳 {result.recomendacao_boleto || (result.score_estimado >= 700 ? '✅ LIBERAR BOLETO' : '🚫 NÃO OFERECER BOLETO')}
                </div>

                <div className="text-xs text-slate-600 p-2 bg-slate-50 rounded-lg leading-tight">
                  {result.recomendacao_credito}
                </div>

                {result.margem_erro && (
                  <p className="text-xs text-slate-400 text-center italic">⚡ Margem estimada: {result.margem_erro}</p>
                )}

                {result.detalhes_score && result.detalhes_score.length > 0 && (
                  <details className="text-xs text-slate-500 cursor-pointer">
                    <summary className="font-semibold text-slate-600 cursor-pointer">📊 Ver fatores do score</summary>
                    <ul className="mt-1 space-y-0.5 pl-1">
                      {result.detalhes_score.map((d, i) => <li key={i}>{d}</li>)}
                    </ul>
                  </details>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
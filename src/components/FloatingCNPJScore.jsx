import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, X, Search, Shield, Send, History, ChevronLeft, MessageSquare, Phone } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function FloatingCNPJScore() {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState('consulta'); // 'consulta' | 'historico'
  const [cnpj, setCnpj] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [sendingWpp, setSendingWpp] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  const qc = useQueryClient();

  const { data: historico = [] } = useQuery({
    queryKey: ['cnpj-consultas'],
    queryFn: () => base44.entities.CNPJConsulta.list('-created_date', 20),
    enabled: open,
  });

  const salvarConsulta = useMutation({
    mutationFn: (dados) => base44.entities.CNPJConsulta.create(dados),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cnpj-consultas'] }),
  });

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
    if (cnpjLimpo.length !== 14) { setError('CNPJ deve ter 14 dígitos'); return; }
    setLoading(true);
    setError('');
    setResult(null);
    setSendSuccess(false);
    try {
      const resp = await base44.functions.invoke('consultarCNPJScore', { cnpj: cnpjLimpo });
      const data = resp.data;
      setResult(data);
      // Salvar automaticamente no histórico
      salvarConsulta.mutate({
        cnpj: cnpjLimpo,
        razao_social: data.razao_social,
        situacao: data.situacao,
        score_estimado: data.score_estimado,
        nivel_risco: data.nivel_risco,
        passa_700: data.passa_700,
        recomendacao_boleto: data.recomendacao_boleto,
        municipio: data.municipio,
        uf: data.uf,
        capital_social: data.capital_social,
        tempo_mercado: data.tempo_mercado,
        whatsapp_enviado: false,
      });
    } catch (e) {
      setError(e.message || 'Erro na consulta');
    } finally {
      setLoading(false);
    }
  };

  const handleEnviarWhatsApp = async () => {
    const phone = phoneInput.replace(/\D/g, '');
    if (phone.length < 10) { setError('Informe um telefone válido (com DDD)'); return; }
    setSendingWpp(true);
    setError('');
    try {
      const texto = result.resumo_whatsapp || gerarResumoSimples(result);
      // Número no formato internacional Brasil
      const phoneIntl = phone.startsWith('55') ? phone : `55${phone}`;
      const url = `https://api.whatsapp.com/send?phone=${phoneIntl}&text=${encodeURIComponent(texto)}`;
      window.open(url, '_blank');
      // Atualizar registro mais recente com status de envio
      const consultas = await base44.entities.CNPJConsulta.filter({ cnpj: result.cnpj });
      if (consultas.length > 0) {
        const ultima = consultas.sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];
        await base44.entities.CNPJConsulta.update(ultima.id, { whatsapp_enviado: true, whatsapp_phone: phoneIntl });
        qc.invalidateQueries({ queryKey: ['cnpj-consultas'] });
      }
      setSendSuccess(true);
    } catch (e) {
      setError('Erro ao abrir WhatsApp: ' + e.message);
    } finally {
      setSendingWpp(false);
    }
  };

  const gerarResumoSimples = (r) => {
    return `🔍 *SCORE SERASA PJ*\n🏢 *${r.razao_social}*\n📊 Score: *${r.score_estimado}/1000*\n✅ Situação: ${r.situacao}\n💳 ${r.recomendacao_boleto}`;
  };

  const scoreColor = (s) => s >= 700 ? 'text-green-600' : s >= 500 ? 'text-yellow-600' : 'text-red-600';
  const scoreBg = (s) => s >= 700 ? 'bg-green-50 border-green-300' : s >= 500 ? 'bg-yellow-50 border-yellow-300' : 'bg-red-50 border-red-300';
  const scoreDot = (s) => s >= 700 ? '🟢' : s >= 500 ? '🟡' : '🔴';

  const handleClose = () => { setOpen(false); setResult(null); setCnpj(''); setError(''); setSendSuccess(false); setPhoneInput(''); setView('consulta'); };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed right-4 bottom-32 z-50 w-14 h-14 rounded-full bg-orange-500 hover:bg-orange-600 shadow-2xl flex items-center justify-center text-white transition-all active:scale-95"
          title="Consultar CNPJ + Score Serasa"
        >
          <Shield className="w-6 h-6" />
        </button>
      )}

      {open && (
        <div className="fixed right-4 bottom-32 z-50 w-84 bg-white rounded-2xl shadow-2xl border-2 border-orange-200 overflow-hidden" style={{ width: 340 }}>
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-white" />
              <span className="text-white font-bold text-sm">Score Serasa / CNPJ</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setView(view === 'consulta' ? 'historico' : 'consulta')}
                className="text-white/80 hover:text-white"
                title={view === 'consulta' ? 'Ver histórico' : 'Voltar à consulta'}
              >
                {view === 'consulta' ? <History className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
              <button onClick={handleClose}>
                <X className="w-5 h-5 text-white/80 hover:text-white" />
              </button>
            </div>
          </div>

          {/* ── CONSULTA ── */}
          {view === 'consulta' && (
            <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
              <div className="flex gap-2">
                <Input
                  placeholder="00.000.000/0001-00"
                  value={cnpj}
                  onChange={(e) => setCnpj(formatCNPJ(e.target.value))}
                  onKeyDown={(e) => e.key === 'Enter' && handleConsulta()}
                  className="flex-1 text-sm"
                  maxLength={18}
                />
                <Button onClick={handleConsulta} disabled={loading} className="bg-orange-500 hover:bg-orange-600 px-3">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </Button>
              </div>

              {error && <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg">{error}</p>}

              {result && (
                <div className={`rounded-xl border-2 p-3 space-y-2 ${scoreBg(result.score_estimado)}`}>
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-slate-800 text-sm leading-tight flex-1 mr-2">{result.razao_social}</p>
                    <span className={`text-2xl font-black ${scoreColor(result.score_estimado)}`}>{result.score_estimado}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${result.score_estimado >= 700 ? 'bg-green-500 text-white' : result.score_estimado >= 500 ? 'bg-yellow-500 text-white' : 'bg-red-500 text-white'}`}>
                      {result.nivel_risco}
                    </span>
                    <span className="text-xs text-slate-600">{result.situacao}</span>
                  </div>

                  <div className="text-xs text-slate-600 space-y-0.5">
                    <p>📍 {result.municipio} / {result.uf}</p>
                    <p>🏭 {result.porte || 'Porte N/I'} · {result.tempo_mercado}</p>
                    <p>💰 Capital: R$ {(result.capital_social || 0).toLocaleString('pt-BR')}</p>
                  </div>

                  <div className={`text-xs font-bold p-2 rounded-lg text-center border-2 ${result.score_estimado >= 700 ? 'bg-green-100 text-green-800 border-green-400' : result.score_estimado >= 650 ? 'bg-yellow-100 text-yellow-800 border-yellow-400' : 'bg-red-100 text-red-800 border-red-400'}`}>
                    💳 {result.recomendacao_boleto}
                  </div>

                  {result.margem_erro && (
                    <p className="text-xs text-slate-400 text-center italic">⚡ {result.margem_erro}</p>
                  )}

                  {result.detalhes_score?.length > 0 && (
                    <details className="text-xs text-slate-500">
                      <summary className="font-semibold text-slate-600 cursor-pointer">📊 Ver fatores do score</summary>
                      <ul className="mt-1 space-y-0.5 pl-1">
                        {result.detalhes_score.map((d, i) => <li key={i}>{d}</li>)}
                      </ul>
                    </details>
                  )}

                  {/* ── ENVIAR WHATSAPP ── */}
                  <div className="border-t border-slate-200 pt-2 space-y-2">
                    <p className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                      <MessageSquare className="w-3 h-3 text-green-600" /> Enviar Relatório via WhatsApp
                    </p>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Phone className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                        <Input
                          placeholder="11999999999"
                          value={phoneInput}
                          onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, ''))}
                          className="text-xs pl-7 h-8"
                          maxLength={15}
                        />
                      </div>
                      <Button
                        onClick={handleEnviarWhatsApp}
                        disabled={sendingWpp || !phoneInput}
                        className="bg-green-600 hover:bg-green-700 px-3 h-8 text-xs gap-1"
                      >
                        {sendingWpp ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                        Enviar
                      </Button>
                    </div>
                    {sendSuccess && (
                      <p className="text-xs text-green-600 bg-green-50 p-1.5 rounded text-center font-semibold">
                        ✅ WhatsApp aberto! Relatório pronto para envio.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── HISTÓRICO ── */}
          {view === 'historico' && (
            <div className="p-3 max-h-[70vh] overflow-y-auto space-y-2">
              <p className="text-xs text-slate-500 font-semibold mb-1">Últimas {historico.length} consultas</p>
              {historico.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-6">Nenhuma consulta realizada ainda.</p>
              )}
              {historico.map((c) => (
                <div
                  key={c.id}
                  className={`p-2.5 rounded-xl border cursor-pointer hover:shadow-sm transition-shadow ${scoreBg(c.score_estimado || 0)}`}
                  onClick={() => {
                    setResult({ ...c, detalhes_score: [], resumo_whatsapp: gerarResumoSimples(c) });
                    setCnpj(c.cnpj?.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5') || '');
                    setView('consulta');
                  }}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-800 leading-tight truncate flex-1 mr-2">{c.razao_social}</p>
                    <span className={`text-sm font-black ${scoreColor(c.score_estimado || 0)}`}>{c.score_estimado}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-slate-500">{c.cnpj?.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')}</span>
                    {c.whatsapp_enviado && <span className="text-xs text-green-600 font-semibold">✅ WPP</span>}
                    <span className="text-xs text-slate-400 ml-auto">{new Date(c.created_date).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
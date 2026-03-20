import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  MessageSquare, Send, Search, Shield, TrendingUp, 
  Phone, Building2, ChevronRight, Loader2, History,
  CheckCircle, AlertTriangle, XCircle, RefreshCw, Bot
} from 'lucide-react';

const scoreColor = (s) => s >= 700 ? 'text-green-600' : s >= 500 ? 'text-yellow-600' : 'text-red-600';
const scoreBg = (s) => s >= 700 ? 'bg-green-50 border-green-200' : s >= 500 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200';
const scoreIcon = (s) => s >= 700 ? <CheckCircle className="w-4 h-4 text-green-600" /> : s >= 500 ? <AlertTriangle className="w-4 h-4 text-yellow-600" /> : <XCircle className="w-4 h-4 text-red-600" />;
const formaBadge = (f) => {
  const map = {
    boleto: { label: '🏦 Boleto Livre', cls: 'bg-green-100 text-green-800' },
    boleto_entrada: { label: '⚠️ Boleto c/ Entrada', cls: 'bg-yellow-100 text-yellow-800' },
    cartao_pix: { label: '💳 Cartão/PIX', cls: 'bg-orange-100 text-orange-800' },
    pix_avista: { label: '⚡ PIX À Vista', cls: 'bg-red-100 text-red-800' },
  };
  const item = map[f] || { label: f, cls: 'bg-gray-100 text-gray-800' };
  return <span className={`text-xs font-bold px-2 py-1 rounded-full ${item.cls}`}>{item.label}</span>;
};

export default function NegociacoesWhatsApp() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [phone, setPhone] = useState('');
  const [produto, setProduto] = useState('');
  const [valor, setValor] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('clientes'); // clientes | historico

  const qc = useQueryClient();

  const { data: clients = [] } = useQuery({
    queryKey: ['clients-negociacao'],
    queryFn: () => base44.entities.Client.list('-updated_date', 50),
  });

  const { data: consultas = [] } = useQuery({
    queryKey: ['cnpj-negociacao'],
    queryFn: () => base44.entities.CNPJConsulta.list('-created_date', 30),
  });

  const { data: interacoes = [] } = useQuery({
    queryKey: ['interacoes-cobranca'],
    queryFn: () => base44.entities.Interaction.filter({ ai_category: 'cobranca_score' }),
  });

  const clientesFiltrados = clients.filter(c =>
    !search || (c.clinic_name || c.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.cnpj || '').includes(search)
  );

  const gerarCobranca = async () => {
    if (!selected) return;
    setLoading(true);
    setResult(null);
    try {
      const resp = await base44.functions.invoke('cobrancaAutomaticaScore', {
        client_id: selected.id,
        cnpj: selected.cnpj,
        phone: phone || selected.phone,
        razao_social: selected.clinic_name || selected.full_name,
        nome_contato: selected.first_name || selected.full_name,
        produto,
        valor
      });
      setResult(resp.data);
      qc.invalidateQueries({ queryKey: ['interacoes-cobranca'] });
    } catch (e) {
      setResult({ error: e.message });
    } finally {
      setLoading(false);
    }
  };

  const abrirWhatsApp = () => {
    if (result?.whatsapp_url) window.open(result.whatsapp_url, '_blank');
    else if (result?.mensagem && phone) {
      const p = phone.replace(/\D/g, '');
      const pf = p.startsWith('55') ? p : `55${p}`;
      window.open(`https://api.whatsapp.com/send?phone=${pf}&text=${encodeURIComponent(result.mensagem)}`, '_blank');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="w-7 h-7 text-green-600" />
            Negociações + WhatsApp
          </h1>
          <p className="text-slate-500 text-sm mt-1">Cobrança automática baseada no score de crédito</p>
        </div>
        <div className="flex gap-2">
          <a
            href={base44.agents.getWhatsAppConnectURL('whatsapp_crm_master')}
            target="_blank"
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            <Bot className="w-4 h-4" />
            Agente Master WhatsApp
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        {[
          { id: 'clientes', label: '👥 Clientes & Score' },
          { id: 'historico', label: '📋 Histórico de Cobranças' },
          { id: 'consultas', label: '🔍 CNPJs Consultados' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
              tab === t.id ? 'border-green-600 text-green-700' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: CLIENTES ── */}
      {tab === 'clientes' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Lista de clientes */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar cliente ou CNPJ..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {clientesFiltrados.slice(0, 30).map(c => {
                const consulta = consultas.find(q => q.cnpj === (c.cnpj || '').replace(/\D/g, ''));
                const score = consulta?.score_estimado;
                return (
                  <div
                    key={c.id}
                    onClick={() => { setSelected(c); setPhone(c.phone || ''); setResult(null); }}
                    className={`p-3 rounded-xl border cursor-pointer transition-all hover:shadow-md ${
                      selected?.id === c.id ? 'border-green-500 bg-green-50 shadow-md' : 'bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Building2 className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate">{c.clinic_name || c.full_name}</p>
                          <p className="text-xs text-slate-400 truncate">{c.city} {c.cnpj ? `· ${c.cnpj}` : ''}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {score ? (
                          <span className={`text-sm font-black ${scoreColor(score)}`}>{score}</span>
                        ) : (
                          <span className="text-xs text-slate-300">sem score</span>
                        )}
                        <ChevronRight className="w-4 h-4 text-slate-300" />
                      </div>
                    </div>
                  </div>
                );
              })}
              {clientesFiltrados.length === 0 && (
                <p className="text-center text-slate-400 py-8">Nenhum cliente encontrado</p>
              )}
            </div>
          </div>

          {/* Painel de cobrança */}
          <div className="space-y-4">
            {selected ? (
              <>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Shield className="w-5 h-5 text-orange-500" />
                      Gerar Cobrança — {selected.clinic_name || selected.full_name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Score atual */}
                    {(() => {
                      const consulta = consultas.find(q => q.cnpj === (selected.cnpj || '').replace(/\D/g, ''));
                      if (consulta) return (
                        <div className={`flex items-center justify-between p-3 rounded-xl border ${scoreBg(consulta.score_estimado)}`}>
                          <div className="flex items-center gap-2">
                            {scoreIcon(consulta.score_estimado)}
                            <span className="text-sm font-semibold">Score Serasa estimado</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`text-2xl font-black ${scoreColor(consulta.score_estimado)}`}>{consulta.score_estimado}</span>
                            {formaBadge(consulta.score_estimado >= 700 ? 'boleto' : consulta.score_estimado >= 650 ? 'boleto_entrada' : consulta.score_estimado >= 500 ? 'cartao_pix' : 'pix_avista')}
                          </div>
                        </div>
                      );
                      return (
                        <div className="text-xs text-slate-500 bg-slate-50 p-2 rounded-lg">
                          ⚠️ Score não consultado. Use o botão 🛡️ na tela principal para consultar o CNPJ primeiro.
                        </div>
                      );
                    })()}

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">Produto/Equipamento</label>
                        <Input placeholder="Ex: Seamaty VG2" value={produto} onChange={e => setProduto(e.target.value)} className="text-sm" />
                      </div>
                      <div>
                        <label className="text-xs text-slate-500 mb-1 block">Valor (R$)</label>
                        <Input placeholder="Ex: 15000" value={valor} onChange={e => setValor(e.target.value)} className="text-sm" type="number" />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-slate-500 mb-1 block flex items-center gap-1">
                        <Phone className="w-3 h-3" /> WhatsApp do cliente
                      </label>
                      <Input
                        placeholder="11999999999"
                        value={phone}
                        onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                        className="text-sm"
                      />
                    </div>

                    <Button
                      onClick={gerarCobranca}
                      disabled={loading}
                      className="w-full bg-orange-500 hover:bg-orange-600 gap-2"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />}
                      Gerar Mensagem de Cobrança
                    </Button>
                  </CardContent>
                </Card>

                {/* Resultado */}
                {result && !result.error && (
                  <Card className={`border-2 ${scoreBg(result.score)}`}>
                    <CardContent className="pt-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {scoreIcon(result.score)}
                          <span className="font-semibold text-sm">Score: {result.score} | {result.nivel_risco}</span>
                        </div>
                        {formaBadge(result.forma_pagamento_recomendada)}
                      </div>

                      <div className="bg-white border rounded-xl p-3">
                        <p className="text-xs text-slate-500 mb-2 font-semibold">📱 Mensagem gerada:</p>
                        <pre className="text-xs text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">{result.mensagem}</pre>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={abrirWhatsApp}
                          className="flex-1 bg-green-600 hover:bg-green-700 gap-2"
                          disabled={!phone && !result.whatsapp_url}
                        >
                          <MessageSquare className="w-4 h-4" />
                          Enviar via WhatsApp
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => { navigator.clipboard.writeText(result.mensagem); }}
                          className="gap-1 text-xs"
                        >
                          Copiar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {result?.error && (
                  <div className="text-xs text-red-600 bg-red-50 p-3 rounded-xl border border-red-200">
                    ❌ {result.error}
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400 space-y-2">
                <MessageSquare className="w-12 h-12 text-slate-200" />
                <p className="text-sm">Selecione um cliente para gerar a cobrança</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: HISTÓRICO ── */}
      {tab === 'historico' && (
        <div className="space-y-3">
          <p className="text-sm text-slate-500">{interacoes.length} cobranças enviadas no total</p>
          {interacoes.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <History className="w-12 h-12 mx-auto text-slate-200 mb-2" />
              <p>Nenhuma cobrança enviada ainda</p>
            </div>
          )}
          {interacoes.map(i => (
            <Card key={i.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{i.client_name}</span>
                      <Badge variant="outline" className="text-xs">{i.subject}</Badge>
                      {i.ai_priority === 'alta' && <Badge className="bg-red-100 text-red-700 text-xs">Risco Alto</Badge>}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(i.created_date).toLocaleString('pt-BR')}
                    </p>
                    {i.notes && (
                      <details className="mt-2">
                        <summary className="text-xs text-slate-500 cursor-pointer">Ver mensagem</summary>
                        <pre className="text-xs text-slate-600 whitespace-pre-wrap mt-1 bg-slate-50 p-2 rounded">{i.notes}</pre>
                      </details>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── TAB: CNPJs ── */}
      {tab === 'consultas' && (
        <div className="space-y-3">
          <p className="text-sm text-slate-500">{consultas.length} CNPJs consultados</p>
          {consultas.map(c => (
            <Card key={c.id} className={`border-2 ${scoreBg(c.score_estimado || 0)}`}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm">{c.razao_social}</p>
                    <p className="text-xs text-slate-500">{c.cnpj} · {c.municipio}/{c.uf}</p>
                    <p className="text-xs text-slate-400">{new Date(c.created_date).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <div className={`text-2xl font-black ${scoreColor(c.score_estimado || 0)}`}>{c.score_estimado}</div>
                    {formaBadge(
                      c.score_estimado >= 700 ? 'boleto' :
                      c.score_estimado >= 650 ? 'boleto_entrada' :
                      c.score_estimado >= 500 ? 'cartao_pix' : 'pix_avista'
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
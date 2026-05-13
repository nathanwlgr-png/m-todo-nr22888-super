import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import {
  Search, MapPin, Phone, Globe, Star, ExternalLink,
  UserPlus, CheckCircle, Zap, RefreshCw, Building2,
  TrendingUp, Package, AlertTriangle, ChevronDown, ChevronUp
} from 'lucide-react';
import { toast } from 'sonner';

const PRIORITY_COLORS = {
  urgente: { bg: 'rgba(255,50,50,0.15)', border: 'rgba(255,50,50,0.4)', text: '#ff4444' },
  alta: { bg: 'rgba(255,107,0,0.15)', border: 'rgba(255,107,0,0.4)', text: '#ff6b00' },
  media: { bg: 'rgba(255,200,0,0.15)', border: 'rgba(255,200,0,0.4)', text: '#ffc800' },
  baixa: { bg: 'rgba(100,100,100,0.15)', border: 'rgba(100,100,100,0.3)', text: '#888' },
};

function ScoreBadge({ score }) {
  const color = score >= 75 ? '#00ff88' : score >= 50 ? '#ff9500' : '#888';
  return (
    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black"
      style={{ background: `${color}22`, border: `1px solid ${color}44`, color }}>
      <TrendingUp className="w-2.5 h-2.5" />
      {score}%
    </div>
  );
}

function ClinicCard({ clinic, onRegisterLead }) {
  const [expanded, setExpanded] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [registered, setRegistered] = useState(clinic.ja_no_crm || false);

  const priority = clinic.prioridade?.toLowerCase() || 'media';
  const colors = PRIORITY_COLORS[priority] || PRIORITY_COLORS.media;

  const mapsUrl = `https://www.google.com/maps/search/${encodeURIComponent(
    `${clinic.nome} ${clinic.endereco || ''}`
  )}`;

  const handleRegister = async () => {
    if (registered || registering) return;
    setRegistering(true);
    try {
      await onRegisterLead(clinic);
      setRegistered(true);
      toast.success(`✅ ${clinic.nome} cadastrado como lead!`);
    } catch (e) {
      toast.error('Erro ao cadastrar: ' + e.message);
    }
    setRegistering(false);
  };

  return (
    <div className="rounded-2xl overflow-hidden mb-3"
      style={{ background: '#141414', border: `1px solid ${colors.border}` }}>

      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="text-sm font-black text-white truncate">{clinic.nome}</h3>
              {clinic.prioridade && (
                <span className="text-[9px] font-black px-2 py-0.5 rounded-full uppercase"
                  style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}>
                  {clinic.prioridade}
                </span>
              )}
              {registered && (
                <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-green-900 text-green-400 border border-green-800">
                  ✓ no CRM
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">{clinic.endereco || 'Endereço não disponível'}</span>
            </div>
          </div>
          <ScoreBadge score={clinic.score_oportunidade || 0} />
        </div>

        {/* Quick info row */}
        <div className="flex items-center gap-3 flex-wrap text-xs mb-3">
          {clinic.telefone && (
            <a href={`tel:${clinic.telefone}`} className="flex items-center gap-1 text-blue-400 hover:text-blue-300">
              <Phone className="w-3 h-3" />
              {clinic.telefone}
            </a>
          )}
          {clinic.avaliacao_google > 0 && (
            <div className="flex items-center gap-1 text-yellow-400">
              <Star className="w-3 h-3" />
              {clinic.avaliacao_google}
              {clinic.num_avaliacoes > 0 && (
                <span className="text-slate-600">({clinic.num_avaliacoes})</span>
              )}
            </div>
          )}
          {clinic.porte && (
            <div className="flex items-center gap-1 text-slate-500">
              <Building2 className="w-3 h-3" />
              {clinic.porte}
            </div>
          )}
        </div>

        {/* Equipamento recomendado */}
        {clinic.equipamento_recomendado && (
          <div className="flex items-center gap-1.5 mb-3 px-2.5 py-1.5 rounded-lg text-xs"
            style={{ background: 'rgba(255,107,0,0.08)', border: '1px solid rgba(255,107,0,0.2)' }}>
            <Package className="w-3 h-3 text-orange-500 shrink-0" />
            <span className="text-orange-400 font-bold">Rec:</span>
            <span className="text-orange-300">{clinic.equipamento_recomendado}</span>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
            <Button variant="outline" size="sm" className="w-full text-xs gap-1.5 h-9 border-slate-700 text-slate-300 hover:text-white hover:border-slate-500">
              <ExternalLink className="w-3.5 h-3.5" />
              Google Maps
            </Button>
          </a>

          <Button
            size="sm"
            onClick={handleRegister}
            disabled={registered || registering}
            className="flex-1 text-xs gap-1.5 h-9 font-bold"
            style={registered
              ? { background: 'rgba(0,255,136,0.1)', color: '#00ff88', border: '1px solid rgba(0,255,136,0.3)' }
              : { background: 'rgba(255,107,0,0.9)', color: 'white' }
            }>
            {registering
              ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Salvando...</>
              : registered
                ? <><CheckCircle className="w-3.5 h-3.5" /> No CRM</>
                : <><UserPlus className="w-3.5 h-3.5" /> Cadastrar Lead</>
            }
          </Button>

          <button
            onClick={() => setExpanded(!expanded)}
            className="w-9 h-9 flex items-center justify-center rounded-lg shrink-0"
            style={{ background: '#1a1a1a', border: '1px solid #333' }}>
            {expanded
              ? <ChevronUp className="w-4 h-4 text-slate-400" />
              : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </button>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-800 pt-3 space-y-2">
          {clinic.responsavel && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 w-24 shrink-0">Responsável:</span>
              <span className="text-white font-bold">{clinic.responsavel}</span>
            </div>
          )}
          {clinic.volume_mensal_estimado && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 w-24 shrink-0">Volume/mês:</span>
              <span className="text-orange-400 font-bold">{clinic.volume_mensal_estimado}</span>
            </div>
          )}
          {clinic.especialidades?.length > 0 && (
            <div className="flex items-start gap-2 text-xs">
              <span className="text-slate-500 w-24 shrink-0 mt-0.5">Especialidades:</span>
              <div className="flex flex-wrap gap-1">
                {clinic.especialidades.map((e, i) => (
                  <span key={i} className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px]">{e}</span>
                ))}
              </div>
            </div>
          )}
          {clinic.site && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 w-24 shrink-0">Site:</span>
              <a href={clinic.site.startsWith('http') ? clinic.site : `https://${clinic.site}`}
                target="_blank" rel="noopener noreferrer"
                className="text-blue-400 flex items-center gap-1 hover:underline">
                <Globe className="w-3 h-3" />
                {clinic.site}
              </a>
            </div>
          )}
          {clinic.instagram && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 w-24 shrink-0">Instagram:</span>
              <a href={`https://instagram.com/${clinic.instagram.replace('@', '')}`}
                target="_blank" rel="noopener noreferrer"
                className="text-pink-400 hover:underline">
                {clinic.instagram}
              </a>
            </div>
          )}
          {clinic.abordagem_sugerida && (
            <div className="mt-2 p-2.5 rounded-lg text-xs"
              style={{ background: 'rgba(0,191,255,0.05)', border: '1px solid rgba(0,191,255,0.15)' }}>
              <p className="text-blue-400 font-bold mb-1">💡 Abordagem sugerida:</p>
              <p className="text-slate-300 leading-relaxed">{clinic.abordagem_sugerida}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function CityProspectingSearch() {
  const [city, setCity] = useState('');
  const [state, setState] = useState('SP');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [filterPriority, setFilterPriority] = useState('todas');
  const [sortBy, setSortBy] = useState('score');

  const handleSearch = async () => {
    if (!city.trim()) {
      toast.error('Digite uma cidade para pesquisar');
      return;
    }
    setLoading(true);
    setResults(null);
    try {
      const res = await base44.functions.invoke('buscaClinicasCidade', {
        city: city.trim(),
        state,
        auto_create_leads: false,
        limit: 30,
      });
      if (res.data?.success) {
        setResults(res.data);
        toast.success(`🎯 ${res.data.search_results?.clinicas?.length || 0} clínicas encontradas em ${city}!`);
      } else {
        toast.error(res.data?.error || 'Erro na busca');
      }
    } catch (e) {
      toast.error('Erro ao buscar: ' + e.message);
    }
    setLoading(false);
  };

  const handleRegisterLead = async (clinic) => {
    await base44.entities.Lead.create({
      full_name: clinic.responsavel || 'Responsável a identificar',
      company: clinic.nome,
      phone: clinic.whatsapp || clinic.telefone || '',
      city: city,
      source: 'google',
      interest: clinic.equipamento_recomendado || 'Analisador Seamaty',
      stage: 'novo',
      status: 'novo',
      estimated_deal_value: 30000,
      notes: [
        `📍 ${clinic.endereco || ''}`,
        clinic.especialidades?.length ? `🏥 ${clinic.especialidades.join(', ')}` : '',
        clinic.volume_mensal_estimado ? `📊 Volume: ${clinic.volume_mensal_estimado}` : '',
        clinic.avaliacao_google ? `⭐ Google: ${clinic.avaliacao_google} (${clinic.num_avaliacoes} avaliações)` : '',
        clinic.abordagem_sugerida ? `💡 ${clinic.abordagem_sugerida}` : '',
      ].filter(Boolean).join('\n'),
    });
  };

  const clinics = results?.search_results?.clinicas || [];
  const filtered = clinics
    .filter(c => filterPriority === 'todas' || c.prioridade?.toLowerCase() === filterPriority)
    .sort((a, b) => sortBy === 'score'
      ? (b.score_oportunidade || 0) - (a.score_oportunidade || 0)
      : (b.avaliacao_google || 0) - (a.avaliacao_google || 0)
    );

  const summary = results?.search_results?.city_summary;

  return (
    <div>
      {/* Busca */}
      <div className="rounded-2xl p-4 mb-4" style={{ background: '#111', border: '1px solid rgba(0,191,255,0.2)' }}>
        <p className="text-xs font-black text-blue-400 uppercase tracking-widest mb-3">
          🔍 Buscar Clínicas por Cidade
        </p>

        <div className="flex gap-2 mb-3">
          <input
            value={city}
            onChange={e => setCity(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Ex: Marília, Bauru, Assis..."
            className="flex-1 px-3 py-2.5 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none"
            style={{ background: '#1a1a1a', border: '1px solid rgba(0,191,255,0.3)' }}
          />
          <select
            value={state}
            onChange={e => setState(e.target.value)}
            className="px-2 py-2.5 rounded-xl text-sm text-white focus:outline-none"
            style={{ background: '#1a1a1a', border: '1px solid rgba(0,191,255,0.3)' }}>
            {['SP','MG','RJ','RS','PR','SC','BA','GO','PE','CE','MT','MS','ES','PA','AM'].map(uf => (
              <option key={uf} value={uf}>{uf}</option>
            ))}
          </select>
        </div>

        <Button
          onClick={handleSearch}
          disabled={loading || !city.trim()}
          className="w-full font-black gap-2 h-11"
          style={{ background: loading ? '#1a1a1a' : 'rgba(0,191,255,0.9)', color: loading ? '#666' : 'white' }}>
          {loading
            ? <><RefreshCw className="w-4 h-4 animate-spin" /> Buscando com IA... (~30s)</>
            : <><Search className="w-4 h-4" /> Buscar Clínicas em {city || 'cidade'}</>}
        </Button>

        {loading && (
          <p className="text-xs text-blue-600 text-center mt-2">
            Consultando Google Maps, sites e redes sociais...
          </p>
        )}
      </div>

      {/* Sumário da cidade */}
      {summary && (
        <div className="rounded-2xl p-4 mb-4" style={{ background: 'rgba(0,191,255,0.05)', border: '1px solid rgba(0,191,255,0.2)' }}>
          <p className="text-xs font-black text-blue-400 mb-2">📊 Análise de {summary.cidade}</p>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div className="rounded-xl p-2 text-center" style={{ background: '#111' }}>
              <p className="text-xl font-black text-blue-400">{summary.total_clinicas_encontradas || clinics.length}</p>
              <p className="text-[9px] text-slate-600">Clínicas encontradas</p>
            </div>
            <div className="rounded-xl p-2 text-center" style={{ background: '#111' }}>
              <p className="text-xl font-black text-orange-400">{clinics.filter(c => !c.ja_no_crm).length}</p>
              <p className="text-[9px] text-slate-600">Novos prospects</p>
            </div>
          </div>
          {summary.oportunidade_geral && (
            <p className="text-xs text-slate-400 leading-relaxed">{summary.oportunidade_geral}</p>
          )}
          {results?.search_results?.estrategia_cidade && (
            <div className="mt-2 p-2 rounded-lg text-xs"
              style={{ background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.15)' }}>
              <p className="text-green-400 font-bold mb-1">🎯 Estratégia:</p>
              <p className="text-slate-300">{results.search_results.estrategia_cidade}</p>
            </div>
          )}
        </div>
      )}

      {/* Filtros */}
      {clinics.length > 0 && (
        <div className="flex gap-2 mb-3 flex-wrap">
          <div className="flex gap-1">
            {['todas', 'urgente', 'alta', 'media', 'baixa'].map(p => (
              <button key={p} onClick={() => setFilterPriority(p)}
                className="px-2.5 py-1 rounded-lg text-[10px] font-bold capitalize transition-all"
                style={filterPriority === p
                  ? { background: 'rgba(0,191,255,0.2)', color: '#00bfff', border: '1px solid rgba(0,191,255,0.4)' }
                  : { background: '#141414', color: '#555', border: '1px solid #222' }}>
                {p}
              </button>
            ))}
          </div>
          <div className="ml-auto flex gap-1">
            {[['score', '📈 Score'], ['rating', '⭐ Avaliação']].map(([val, label]) => (
              <button key={val} onClick={() => setSortBy(val)}
                className="px-2 py-1 rounded-lg text-[10px] font-bold"
                style={sortBy === val
                  ? { background: 'rgba(255,107,0,0.2)', color: '#ff9500', border: '1px solid rgba(255,107,0,0.3)' }
                  : { background: '#141414', color: '#555', border: '1px solid #222' }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Top oportunidades */}
      {results?.search_results?.top_oportunidades?.length > 0 && (
        <div className="rounded-xl p-3 mb-4" style={{ background: '#111', border: '1px solid rgba(255,107,0,0.2)' }}>
          <p className="text-xs font-black text-orange-400 mb-2">🔥 Top Oportunidades da Cidade</p>
          <div className="space-y-1">
            {results.search_results.top_oportunidades.map((op, i) => (
              <div key={i} className="flex items-start gap-2 text-xs">
                <span className="text-orange-500 font-black shrink-0">{i + 1}.</span>
                <span className="text-slate-300">{op}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cards de clínicas */}
      {filtered.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-slate-500">
              {filtered.length} clínicas{filterPriority !== 'todas' ? ` (${filterPriority})` : ''}
            </p>
            <p className="text-xs text-orange-500">
              {clinics.filter(c => c.ja_no_crm).length} já no CRM
            </p>
          </div>
          {filtered.map((clinic, i) => (
            <ClinicCard key={i} clinic={clinic} onRegisterLead={handleRegisterLead} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {results && clinics.length === 0 && (
        <div className="text-center py-12">
          <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-slate-700" />
          <p className="text-sm text-slate-600">Nenhuma clínica encontrada em {city}.</p>
          <p className="text-xs text-slate-700 mt-1">Tente outra cidade ou verifique o estado.</p>
        </div>
      )}
    </div>
  );
}
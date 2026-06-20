import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Radar, Plus, Loader2, Instagram, Globe, MapPin, Search, Flame,
  ShieldAlert, ExternalLink, Building2, Trash2, X
} from 'lucide-react';

const MARCAS = ['Idexx', 'Heska', 'Zoetis', 'Mindray', 'Biocom', 'Biobrasil', 'Wiener', 'Bioclin', 'Labtest', 'Kovalent', 'outro'];

const AMEACA_COR = {
  baixo: 'text-slate-300 bg-white/5',
  medio: 'text-amber-300 bg-amber-500/10',
  alto: 'text-orange-300 bg-orange-500/10',
  critico: 'text-red-300 bg-red-500/15',
};

export default function PainelConcorrencia() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ nome: '', marca_concorrente: '', instagram_handle: '', website: '', cidade: '', cnpj: '' });
  const [showForm, setShowForm] = useState(false);
  const [investigando, setInvestigando] = useState(null);

  const { data: comps = [], isLoading } = useQuery({
    queryKey: ['competitor-tracker'],
    queryFn: () => base44.entities.CompetitorTracker.filter({ ativo: true }, '-ultima_investigacao', 100).catch(() => []),
  });

  const criar = useMutation({
    mutationFn: (data) => base44.entities.CompetitorTracker.create({ ...data, status_monitoramento: 'novo', ativo: true }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['competitor-tracker'] });
      qc.invalidateQueries({ queryKey: ['competitor-tracker-widget'] });
      setForm({ nome: '', marca_concorrente: '', instagram_handle: '', website: '', cidade: '', cnpj: '' });
      setShowForm(false);
    },
  });

  const arquivar = useMutation({
    mutationFn: (id) => base44.entities.CompetitorTracker.update(id, { ativo: false }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['competitor-tracker'] });
      qc.invalidateQueries({ queryKey: ['competitor-tracker-widget'] });
    },
  });

  const investigar = async (comp) => {
    setInvestigando(comp.id);
    try {
      await base44.functions.invoke('investigarConcorrenteSupremo', { competitor_id: comp.id });
      await qc.invalidateQueries({ queryKey: ['competitor-tracker'] });
    } catch (_e) { /* erro silencioso, nada é alterado em clientes */ }
    finally { setInvestigando(null); }
  };

  const igUrl = (h) => h ? `https://instagram.com/${h.replace('@', '')}` : null;

  return (
    <div className="min-h-screen bg-black text-white pb-24 flex flex-col items-center p-4">
      <div className="w-full max-w-2xl space-y-4">
        <div className="px-4 py-4 rounded-2xl bg-[#0f0f11] border border-red-500/25 text-center">
          <h1 className="text-xl font-black text-red-300 flex items-center gap-2 justify-center">
            <Radar className="w-5 h-5" /> Painel de Concorrência
          </h1>
          <p className="text-[11px] text-red-200/70 mt-1">
            Monitore Idexx, Heska, Zoetis, Biocom, Biobrasil e clínicas com equipamento concorrente — Instagram, site, Google e CNPJ.
          </p>
        </div>

        <Button
          onClick={() => setShowForm(s => !s)}
          className="w-full h-12 bg-gradient-to-r from-red-600 to-rose-500 text-white font-black border-none"
        >
          <Plus className="w-4 h-4 mr-1" /> Adicionar concorrente / clínica
        </Button>

        {showForm && (
          <div className="rounded-2xl p-4 bg-[#0f0f11] border border-red-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-red-300 uppercase tracking-widest">Novo monitoramento</span>
              <button onClick={() => setShowForm(false)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <Input placeholder="Nome (ex: Clínica X ou marca)" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} className="bg-white/5 border-white/10 text-white" />
            <div className="flex flex-wrap gap-1.5">
              {MARCAS.map(m => (
                <button key={m} onClick={() => setForm({ ...form, marca_concorrente: m })}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold ${form.marca_concorrente === m ? 'bg-red-500/30 text-red-200 border border-red-500/40' : 'bg-white/5 text-slate-400'}`}>
                  {m}
                </button>
              ))}
            </div>
            <Input placeholder="@instagram" value={form.instagram_handle} onChange={e => setForm({ ...form, instagram_handle: e.target.value })} className="bg-white/5 border-white/10 text-white" />
            <Input placeholder="site (opcional)" value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} className="bg-white/5 border-white/10 text-white" />
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="cidade" value={form.cidade} onChange={e => setForm({ ...form, cidade: e.target.value })} className="bg-white/5 border-white/10 text-white" />
              <Input placeholder="CNPJ (opcional)" value={form.cnpj} onChange={e => setForm({ ...form, cnpj: e.target.value })} className="bg-white/5 border-white/10 text-white" />
            </div>
            <Button onClick={() => criar.mutate(form)} disabled={!form.nome.trim() || criar.isPending}
              className="w-full bg-red-600 text-white font-black">
              {criar.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar e monitorar'}
            </Button>
          </div>
        )}

        {isLoading ? (
          <div className="h-20 rounded-xl animate-pulse bg-[#111]" />
        ) : comps.length === 0 ? (
          <div className="rounded-xl p-6 bg-[#0f0f11] border border-white/10 text-center text-sm text-slate-400">
            Nenhum concorrente cadastrado ainda. Adicione o primeiro acima.
          </div>
        ) : (
          comps.map(c => (
            <div key={c.id} className="rounded-2xl p-4 bg-[#0f0f11] border border-white/10 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-white text-sm">{c.nome}</span>
                    {c.marca_concorrente && <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-slate-300">{c.marca_concorrente}</span>}
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${AMEACA_COR[c.nivel_ameaca] || AMEACA_COR.medio}`}>
                      ameaça {c.nivel_ameaca || 'medio'}
                    </span>
                    {c.status_monitoramento === 'oportunidade_quente' && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-orange-500/20 text-orange-300 font-bold flex items-center gap-1"><Flame className="w-3 h-3" />oportunidade</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-400">
                    {c.cidade && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{c.cidade}</span>}
                    {c.instagram_handle && <a href={igUrl(c.instagram_handle)} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-pink-300"><Instagram className="w-3 h-3" />{c.instagram_handle}</a>}
                    {c.website && <a href={c.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-cyan-300"><Globe className="w-3 h-3" />site</a>}
                  </div>
                </div>
                <button onClick={() => arquivar.mutate(c.id)} className="text-slate-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
              </div>

              {c.inteligencia_ia && (
                <div className="rounded-xl p-3 bg-white/5 text-xs text-slate-200 space-y-2">
                  <p>{c.inteligencia_ia}</p>
                  {c.argumento_contra && <p className="text-emerald-300"><b>Argumento Seamaty:</b> {c.argumento_contra}</p>}
                  {c.oportunidade_detectada && <p className="text-orange-300"><b>Oportunidade:</b> {c.oportunidade_detectada}</p>}
                  {Array.isArray(c.ultimas_publicacoes) && c.ultimas_publicacoes.length > 0 && (
                    <div className="pt-1 border-t border-white/10 space-y-1">
                      {c.ultimas_publicacoes.slice(0, 4).map((p, i) => (
                        <div key={i} className="text-[11px] text-slate-400 flex items-start gap-1">
                          <span className="text-slate-500">[{p.fonte}]</span>
                          <span>{p.resumo}{p.url && <a href={p.url} target="_blank" rel="noreferrer" className="ml-1 text-cyan-400 inline-flex"><ExternalLink className="w-3 h-3" /></a>}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <Button onClick={() => investigar(c)} disabled={investigando === c.id}
                size="sm" className="w-full bg-gradient-to-r from-cyan-600 to-sky-500 text-white font-bold">
                {investigando === c.id
                  ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Investigando todas as fontes…</>
                  : <><Search className="w-4 h-4 mr-1" /> Investigação Suprema (IA)</>}
              </Button>
            </div>
          ))
        )}

        <div className="rounded-xl p-3 bg-white/5 border border-white/10 text-[11px] text-slate-400 flex items-start gap-2">
          <Building2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-slate-500" />
          A investigação usa apenas fontes públicas (Instagram, site, Google, CNPJ, LinkedIn, vagas). Nada é enviado e nenhum cliente é alterado.
        </div>
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Crown, Search, Zap, Globe, MapPin, Plus, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const SERASA_COLOR = (score) => {
  if (score >= 700) return 'text-green-400';
  if (score >= 500) return 'text-yellow-400';
  if (score >= 300) return 'text-orange-400';
  return 'text-red-400';
};

const SERASA_LABEL = (score) => {
  if (score >= 700) return 'Excelente';
  if (score >= 500) return 'Bom';
  if (score >= 300) return 'Regular';
  return 'Baixo';
};

export default function EliteVetClientSearch() {
  const [serviceDescription, setServiceDescription] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [savingId, setSavingId] = useState(null);

  const handleSearch = async () => {
    if (!serviceDescription.trim()) { toast.error('Descreva o equipamento ou serviço'); return; }
    setLoading(true);
    setResults(null);
    try {
      const res = await base44.functions.invoke('eliteVetClientSearch', { service_description: serviceDescription, city });
      if (res.data?.success) {
        setResults(res.data);
        toast.success(`${res.data.clinics?.length || 0} clínicas encontradas!`);
      } else {
        toast.error(res.data?.error || 'Erro na busca');
      }
    } catch (e) {
      toast.error('Erro: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const saveAsLead = async (clinic) => {
    setSavingId(clinic.name);
    try {
      await base44.entities.Lead.create({
        full_name: clinic.name,
        company: clinic.name,
        city: clinic.city,
        phone: clinic.phone || '',
        source: 'analise_mercado_ia',
        interest: serviceDescription,
        notes: `Score Serasa: ${clinic.serasa_score} | ${clinic.ideal_reasons || ''}`,
        status: 'novo',
        predictive_score: clinic.interest_probability,
      });
      toast.success(`${clinic.name} adicionada como Lead!`);
      setResults(prev => ({
        ...prev,
        clinics: prev.clinics.map(c => c.name === clinic.name ? { ...c, crm_status: 'lead' } : c)
      }));
    } catch (e) {
      toast.error('Erro ao salvar lead');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white p-4">
      <div className="max-w-2xl mx-auto space-y-5">
        {/* Header */}
        <div className="text-center pt-4 pb-1">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Crown className="w-7 h-7 text-yellow-400" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-200 bg-clip-text text-transparent">
              Busca de Clientes Elite
            </h1>
          </div>
          <h2 className="text-lg font-semibold text-white mb-1">para Clínicas e Hospitais Veterinários</h2>
          <p className="text-slate-400 text-sm">IA conectada à web · Serasa Score · CRM interno · Redes sociais</p>
        </div>

        {/* Search Form */}
        <div className="bg-slate-800 rounded-2xl p-5 border border-slate-700 space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-200 mb-1.5 block">
              📋 Descreva o equipamento ou serviço veterinário que você busca vender:
            </label>
            <p className="text-xs text-slate-500 mb-2">
              Ex: "Analisador hematológico automatizado para hemograma", "Gasômetro portátil para UTI veterinária"
            </p>
            <Textarea
              value={serviceDescription}
              onChange={e => setServiceDescription(e.target.value)}
              placeholder="Digite aqui o tipo exato de equipamento ou serviço que você oferece..."
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 min-h-[90px] resize-none"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-200 mb-1.5 block">📍 Região (opcional):</label>
            <Input
              value={city}
              onChange={e => setCity(e.target.value)}
              placeholder="Ex: Marília, SP ou São Paulo"
              className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
            />
          </div>
          <Button
            onClick={handleSearch}
            disabled={loading || !serviceDescription.trim()}
            className="w-full h-12 bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 font-bold text-base rounded-xl"
          >
            {loading ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Buscando clínicas elite...</>
            ) : (
              <><Zap className="w-5 h-5 mr-2" /><Search className="w-4 h-4 mr-1" />Iniciar Busca Avançada</>
            )}
          </Button>
        </div>

        {/* Empty State */}
        {!results && !loading && (
          <div className="text-center py-10">
            <Crown className="w-14 h-14 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 font-medium">Digite e busque clientes elite</p>
            <p className="text-slate-500 text-sm mt-1">Pesquisa em Google, CNPJ, Facebook, OLX e CRM interno</p>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {['Score Serasa', 'CNPJ', 'Google', 'CRM Interno', 'Facebook', 'Instagram'].map(tag => (
                <Badge key={tag} className="bg-slate-700 text-slate-300 text-xs">{tag}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="text-center py-10">
            <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <Search className="w-8 h-8 text-white" />
            </div>
            <p className="text-slate-300 font-medium">Buscando clínicas veterinárias elite...</p>
            <p className="text-slate-500 text-xs mt-1">Consultando web + Serasa + CRM (pode levar ~20s)</p>
          </div>
        )}

        {/* Results */}
        {results && (
          <div className="space-y-4">
            {results.market_insights && (
              <div className="bg-indigo-900/50 border border-indigo-700 rounded-xl p-3">
                <p className="text-xs font-semibold text-indigo-300 mb-1">📊 Insights do Mercado</p>
                <p className="text-sm text-slate-300">{results.market_insights}</p>
              </div>
            )}

            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-400">{results.clinics?.length} clínicas encontradas</p>
              <Badge className="bg-yellow-500/20 text-yellow-300 border-yellow-600 text-xs">
                <Crown className="w-3 h-3 mr-1" />Elite Match
              </Badge>
            </div>

            {results.clinics?.map((clinic, i) => (
              <div key={i} className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-3 hover:border-indigo-500 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-white text-sm">{clinic.name}</h3>
                      {clinic.crm_status === 'client' && <Badge className="bg-green-500/20 text-green-300 text-[10px]">✓ Cliente CRM</Badge>}
                      {clinic.crm_status === 'lead' && <Badge className="bg-blue-500/20 text-blue-300 text-[10px]">↗ Lead CRM</Badge>}
                      {clinic.crm_status === 'new' && <Badge className="bg-yellow-500/20 text-yellow-300 text-[10px]">★ Novo</Badge>}
                    </div>
                    <div className="flex items-center gap-1 text-slate-400 text-xs mt-0.5">
                      <MapPin className="w-3 h-3" />
                      {clinic.city}{clinic.state ? `, ${clinic.state}` : ''}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-2xl font-bold ${SERASA_COLOR(clinic.serasa_score)}`}>{clinic.serasa_score}</p>
                    <p className="text-[10px] text-slate-500">Serasa Score</p>
                    <p className={`text-[10px] font-medium ${SERASA_COLOR(clinic.serasa_score)}`}>{SERASA_LABEL(clinic.serasa_score)}</p>
                  </div>
                </div>

                {clinic.specialties?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {clinic.specialties.map((s, idx) => (
                      <Badge key={idx} className="bg-slate-700 text-slate-300 text-[10px]">{s}</Badge>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-slate-700/50 rounded-lg p-2 text-center">
                    <p className="text-lg font-bold text-indigo-300">{clinic.interest_probability}%</p>
                    <p className="text-[10px] text-slate-500">Interesse</p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-2 text-center">
                    <p className="text-sm font-bold text-emerald-300">{clinic.size}</p>
                    <p className="text-[10px] text-slate-500">Porte</p>
                  </div>
                  <div className="bg-slate-700/50 rounded-lg p-2 text-center">
                    <p className="text-sm font-bold text-amber-300">{clinic.market_time_years || '?'}y</p>
                    <p className="text-[10px] text-slate-500">No Mercado</p>
                  </div>
                </div>

                {clinic.ideal_reasons && (
                  <div className="bg-slate-700/30 rounded-lg p-2">
                    <p className="text-[10px] font-semibold text-slate-400 mb-0.5">💡 Por que é cliente ideal:</p>
                    <p className="text-xs text-slate-300">{clinic.ideal_reasons}</p>
                  </div>
                )}

                <div className="flex items-center gap-2 flex-wrap">
                  {clinic.phone && (
                    <a href={`https://wa.me/${clinic.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer">
                      <Button size="sm" className="bg-green-600 hover:bg-green-700 h-7 text-xs">📱 WhatsApp</Button>
                    </a>
                  )}
                  {clinic.website && (
                    <a href={clinic.website} target="_blank" rel="noreferrer">
                      <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 h-7 text-xs">
                        <Globe className="w-3 h-3 mr-1" />Site
                      </Button>
                    </a>
                  )}
                  {clinic.instagram && (
                    <a href={`https://instagram.com/${clinic.instagram.replace('@', '')}`} target="_blank" rel="noreferrer">
                      <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 h-7 text-xs">📸 IG</Button>
                    </a>
                  )}
                  {clinic.crm_status === 'new' ? (
                    <Button
                      size="sm"
                      onClick={() => saveAsLead(clinic)}
                      disabled={savingId === clinic.name}
                      className="ml-auto bg-indigo-600 hover:bg-indigo-700 h-7 text-xs"
                    >
                      {savingId === clinic.name ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Plus className="w-3 h-3 mr-1" />Add Lead</>}
                    </Button>
                  ) : (
                    <Link to={createPageUrl('Leads')} className="ml-auto">
                      <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 h-7 text-xs">Ver no CRM →</Button>
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
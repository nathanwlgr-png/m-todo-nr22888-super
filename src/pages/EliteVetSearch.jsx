import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader2, Search, MapPin, Phone, Globe, Plus, Crown, Shield, TrendingUp, Star } from 'lucide-react';
import { toast } from 'sonner';

const TYPE_LABELS = {
  clinica_pequena: '🏥 Clínica Pequena',
  clinica_media: '🏥 Clínica Média',
  hospital_veterinario: '🏨 Hospital Veterinário',
  laboratorio: '🔬 Laboratório',
  clinica_especializada: '⭐ Clínica Especializada'
};

const serasaColor = (score) => {
  if (score >= 750) return { text: 'text-green-400', bg: 'bg-green-400', label: 'Excelente' };
  if (score >= 600) return { text: 'text-yellow-400', bg: 'bg-yellow-400', label: 'Bom' };
  if (score >= 450) return { text: 'text-orange-400', bg: 'bg-orange-400', label: 'Regular' };
  return { text: 'text-red-400', bg: 'bg-red-400', label: 'Atenção' };
};

export default function EliteVetSearch() {
  const [serviceDescription, setServiceDescription] = useState('');
  const [city, setCity] = useState('Marília');
  const [state, setState] = useState('SP');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [addingId, setAddingId] = useState(null);

  const handleSearch = async () => {
    if (!serviceDescription.trim()) {
      toast.error('Descreva o equipamento ou serviço');
      return;
    }
    setLoading(true);
    setResults(null);
    try {
      const res = await base44.functions.invoke('searchEliteVetClinics', {
        service_description: serviceDescription,
        city,
        state
      });
      if (res.data?.success) {
        setResults(res.data);
        toast.success(`${res.data.total} clínicas encontradas!`);
      } else {
        toast.error(res.data?.error || 'Erro na busca');
      }
    } catch (e) {
      toast.error('Erro: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const addAsLead = async (clinic) => {
    setAddingId(clinic.name);
    try {
      await base44.entities.Lead.create({
        full_name: clinic.name,
        company: clinic.clinic_name || clinic.name,
        phone: clinic.phone || '',
        city: clinic.city,
        source: 'analise_mercado_ia',
        interest: serviceDescription,
        stage: 'novo',
        predictive_score: clinic.purchase_score,
        notes: `Score Serasa estimado: ${clinic.serasa_score} | ${clinic.why_ideal} | Dor principal: ${clinic.main_pain}`,
        status: 'novo'
      });
      toast.success(`${clinic.name} adicionado como Lead!`);
      setResults(prev => ({
        ...prev,
        clinics: prev.clinics.map(c =>
          c.name === clinic.name ? { ...c, crm_status: 'lead' } : c
        )
      }));
    } catch (e) {
      toast.error('Erro ao adicionar lead: ' + e.message);
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 pb-20">
      <div className="max-w-4xl mx-auto space-y-5">

        {/* Header */}
        <div className="pt-2">
          <div className="flex items-center gap-2 mb-1">
            <Crown className="w-7 h-7 text-yellow-400" />
            <h1 className="text-2xl font-bold leading-tight">
              Busca de Clínicas Elite Veterinárias
            </h1>
          </div>
          <p className="text-gray-400 text-sm">
            Pesquisa minuciosa em múltiplas plataformas, web, redes sociais, Serasa e CRM interno
          </p>
        </div>

        {/* Search Card */}
        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800 space-y-4">
          <div>
            <p className="font-semibold text-sm mb-1">
              📋 Descreva o equipamento ou serviço veterinário que você busca vender:
            </p>
            <p className="text-gray-500 text-xs mb-3">
              Exemplos: "Analisador hematológico automático para hemograma completo", "Gasômetro veterinário portátil para UTI", "Sistema de bioquímica para laboratório de referência"
            </p>
            <Textarea
              value={serviceDescription}
              onChange={(e) => setServiceDescription(e.target.value)}
              placeholder="Digite aqui o tipo exato de equipamento ou serviço que você oferece..."
              className="bg-gray-800 border-gray-700 text-white placeholder-gray-600 min-h-[110px] resize-none rounded-xl focus:border-indigo-500"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-1">Cidade</p>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ex: Marília"
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
            <div className="w-24">
              <p className="text-xs text-gray-500 mb-1">Estado</p>
              <Input
                value={state}
                onChange={(e) => setState(e.target.value.toUpperCase())}
                placeholder="SP"
                maxLength={2}
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
          </div>

          <Button
            onClick={handleSearch}
            disabled={loading || !serviceDescription.trim()}
            className="w-full bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:opacity-90 text-white font-bold py-3 text-base h-12 rounded-xl disabled:opacity-40"
          >
            {loading ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Pesquisando com IA...</>
            ) : (
              <><Search className="w-5 h-5 mr-2" /> ⚡ Iniciar Busca Avançada</>
            )}
          </Button>
          <p className="text-center text-xs text-gray-600">
            Pesquisa em LinkedIn, Serasa, Google, Facebook e CRM interno
          </p>
        </div>

        {/* Empty State */}
        {!results && !loading && (
          <div className="bg-gray-900 rounded-2xl p-14 border border-gray-800 text-center">
            <Crown className="w-14 h-14 text-gray-800 mx-auto mb-4" />
            <p className="text-gray-500 font-semibold text-lg">Digite e busque clínicas elite</p>
            <p className="text-gray-700 text-sm mt-1">
              Pesquisa em LinkedIn, Serasa, Facebook, Google e CRM interno
            </p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="bg-gray-900 rounded-2xl p-14 border border-gray-800 text-center">
            <Loader2 className="w-14 h-14 text-indigo-500 mx-auto mb-4 animate-spin" />
            <p className="text-gray-300 font-semibold text-lg">IA pesquisando clínicas elite...</p>
            <p className="text-gray-500 text-sm mt-1">Consultando múltiplas fontes de dados</p>
          </div>
        )}

        {/* Results */}
        {results && (
          <div className="space-y-4">
            {/* Summary Bar */}
            <div className="bg-indigo-950 rounded-xl p-4 border border-indigo-800 flex flex-wrap gap-3 items-start justify-between">
              <div>
                <p className="text-indigo-300 font-bold">✅ {results.total} clínicas encontradas</p>
                {results.search_summary && (
                  <p className="text-gray-400 text-xs mt-1">{results.search_summary}</p>
                )}
              </div>
              <div className="flex gap-2 text-xs">
                <span className="text-green-400">● Cliente</span>
                <span className="text-blue-400">● Lead</span>
                <span className="text-gray-400">● Novo</span>
              </div>
            </div>

            {results.market_insight && (
              <div className="bg-gray-900 border border-yellow-700/50 rounded-xl p-3">
                <p className="text-yellow-400 text-xs">💡 <strong>Insight de Mercado:</strong> {results.market_insight}</p>
              </div>
            )}

            {/* Clinic Cards */}
            {results.clinics.map((clinic, i) => {
              const serasa = serasaColor(clinic.serasa_score);
              return (
                <div key={i} className="bg-gray-900 rounded-2xl p-5 border border-gray-800 space-y-4 hover:border-gray-700 transition-colors">
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-bold text-base">{clinic.name}</h3>
                        {clinic.crm_status === 'cliente' && (
                          <Badge className="bg-green-700 text-green-100 text-xs">✅ Cliente CRM</Badge>
                        )}
                        {clinic.crm_status === 'lead' && (
                          <Badge className="bg-blue-700 text-blue-100 text-xs">📋 Lead CRM</Badge>
                        )}
                        {clinic.crm_status === 'novo' && (
                          <Badge className="bg-gray-700 text-gray-300 text-xs">🆕 Novo</Badge>
                        )}
                      </div>
                      <p className="text-gray-500 text-sm">{TYPE_LABELS[clinic.type] || clinic.type}</p>
                    </div>
                    {/* Serasa Score */}
                    <div className="text-center shrink-0 bg-gray-800 rounded-xl p-2.5 min-w-[70px]">
                      <div className="flex items-center gap-1 justify-center mb-0.5">
                        <Shield className="w-3 h-3 text-gray-400" />
                        <p className="text-xs text-gray-400">Serasa</p>
                      </div>
                      <p className={`text-2xl font-bold ${serasa.text}`}>{clinic.serasa_score}</p>
                      <p className={`text-xs font-medium ${serasa.text}`}>{serasa.label}</p>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                    {clinic.city && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {clinic.city}, {clinic.state}
                      </span>
                    )}
                    {clinic.phone && (
                      <a href={`tel:${clinic.phone}`} className="flex items-center gap-1 hover:text-green-400 transition-colors">
                        <Phone className="w-3 h-3" /> {clinic.phone}
                      </a>
                    )}
                    {clinic.website && (
                      <a href={clinic.website} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-blue-400 transition-colors">
                        <Globe className="w-3 h-3" /> Site
                      </a>
                    )}
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-2">
                    {clinic.specialty && <Badge className="bg-purple-900 text-purple-200 text-xs">{clinic.specialty}</Badge>}
                    {clinic.size && <Badge className="bg-gray-800 text-gray-300 text-xs capitalize">{clinic.size}</Badge>}
                    {clinic.market_time_years > 0 && (
                      <Badge className="bg-gray-800 text-gray-300 text-xs">{clinic.market_time_years}+ anos mercado</Badge>
                    )}
                    {clinic.monthly_exams_estimate > 0 && (
                      <Badge className="bg-gray-800 text-gray-300 text-xs">~{clinic.monthly_exams_estimate} exam/mês</Badge>
                    )}
                  </div>

                  {/* Purchase Score */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" /> Score de Potencial de Compra
                      </span>
                      <span className="font-bold text-indigo-400">{clinic.purchase_score}%</span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all"
                        style={{ width: `${clinic.purchase_score}%` }}
                      />
                    </div>
                  </div>

                  {/* Why ideal */}
                  {(clinic.why_ideal || clinic.main_pain) && (
                    <div className="bg-gray-800 rounded-xl p-3 space-y-2">
                      {clinic.why_ideal && (
                        <p className="text-xs text-gray-300">
                          <span className="text-green-400 font-semibold">✨ Por que é cliente ideal: </span>
                          {clinic.why_ideal}
                        </p>
                      )}
                      {clinic.main_pain && (
                        <p className="text-xs text-gray-400">
                          <span className="text-red-400 font-semibold">🎯 Dor principal: </span>
                          {clinic.main_pain}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Action */}
                  {clinic.crm_status === 'novo' ? (
                    <Button
                      size="sm"
                      onClick={() => addAsLead(clinic)}
                      disabled={addingId === clinic.name}
                      className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 text-xs h-9"
                    >
                      {addingId === clinic.name ? (
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      ) : (
                        <Plus className="w-3 h-3 mr-1" />
                      )}
                      Adicionar como Lead no CRM
                    </Button>
                  ) : (
                    <p className="text-center text-xs text-gray-600">
                      Já registrado como {clinic.crm_status} no CRM
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
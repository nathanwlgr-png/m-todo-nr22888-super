import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { Search, Filter, Building2, MapPin, Star, Zap, Phone, Instagram, Globe, ChevronDown, ChevronUp, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

const ESPECIALIDADES = ['Pequenos Animais', 'Grandes Animais', 'Exóticos', 'Oncologia', 'Ortopedia', 'Cardiologia', 'Neurologia', 'Dermatologia'];
const EQUIPAMENTOS = ['SMT-120VP', 'VG1', 'VG2', 'Vi1', 'VBC50A', 'VQ1', 'Hematologia', 'Bioquímica', 'Gasometria'];

export default function ClinicSearchWidget() {
  const [filters, setFilters] = useState({ nome: '', cidade: '', especialidade: '', equipamento: '' });
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [creatingLead, setCreatingLead] = useState({});
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = async () => {
    if (!filters.cidade && !filters.nome) {
      toast.error('Informe ao menos a cidade ou nome da clínica');
      return;
    }
    setLoading(true);
    setResults(null);
    try {
      const res = await base44.functions.invoke('buscaClinicasCidade', {
        city: filters.cidade || 'São Paulo',
        state: 'SP',
        auto_create_leads: false,
        limit: 20,
        nome_filtro: filters.nome,
        especialidade_filtro: filters.especialidade,
        equipamento_filtro: filters.equipamento,
      });
      let clinicas = res.data?.search_results?.clinicas || [];

      // Filtros locais
      if (filters.nome) {
        clinicas = clinicas.filter(c => c.nome?.toLowerCase().includes(filters.nome.toLowerCase()));
      }
      if (filters.especialidade) {
        clinicas = clinicas.filter(c =>
          c.especialidades?.some(e => e.toLowerCase().includes(filters.especialidade.toLowerCase()))
        );
      }
      if (filters.equipamento) {
        clinicas = clinicas.filter(c =>
          c.equipamento_atual?.toLowerCase().includes(filters.equipamento.toLowerCase()) ||
          c.equipamento_recomendado?.toLowerCase().includes(filters.equipamento.toLowerCase())
        );
      }

      setResults({ ...res.data, clinicas_filtradas: clinicas });
    } catch (e) {
      toast.error('Erro na busca: ' + e.message);
    }
    setLoading(false);
  };

  const handleCreateLead = async (clinica) => {
    setCreatingLead(prev => ({ ...prev, [clinica.nome]: true }));
    try {
      await base44.entities.Client.create({
        first_name: clinica.responsavel || 'Responsável',
        clinic_name: clinica.nome,
        city: filters.cidade,
        phone: clinica.whatsapp || clinica.telefone,
        address: clinica.endereco,
        website: clinica.site,
        instagram_handle: clinica.instagram,
        status: 'frio',
        pipeline_stage: 'lead',
        lead_source: 'analise_mercado_ia',
        equipment_interest: clinica.equipamento_recomendado,
        purchase_score: clinica.score_oportunidade || 30,
        notes: `[IA] Clínica encontrada via busca. Especialidades: ${clinica.especialidades?.join(', ')}. Porte: ${clinica.porte}.`,
      });
      toast.success(`${clinica.nome} adicionada ao CRM!`);
    } catch (e) {
      toast.error('Erro ao criar lead');
    }
    setCreatingLead(prev => ({ ...prev, [clinica.nome]: false }));
  };

  const scoreColor = (score) => {
    if (score >= 75) return 'bg-green-500';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-slate-400';
  };

  return (
    <Card className="border-indigo-100">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-indigo-600" />
            Busca Avançada de Clínicas
          </div>
          <Button variant="ghost" size="sm" onClick={() => setShowFilters(f => !f)}>
            <Filter className="w-4 h-4 mr-1" />
            Filtros
            {showFilters ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Filtros principais */}
        <div className="grid grid-cols-2 gap-2">
          <Input
            placeholder="Nome da clínica..."
            value={filters.nome}
            onChange={e => setFilters(f => ({ ...f, nome: e.target.value }))}
          />
          <Input
            placeholder="Cidade *"
            value={filters.cidade}
            onChange={e => setFilters(f => ({ ...f, cidade: e.target.value }))}
          />
        </div>

        {/* Filtros avançados */}
        {showFilters && (
          <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-lg">
            <div>
              <p className="text-xs text-slate-500 mb-1">Especialidade</p>
              <div className="flex flex-wrap gap-1">
                {ESPECIALIDADES.map(esp => (
                  <button
                    key={esp}
                    onClick={() => setFilters(f => ({ ...f, especialidade: f.especialidade === esp ? '' : esp }))}
                    className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                      filters.especialidade === esp
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
                    }`}
                  >
                    {esp}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Equipamento detectado</p>
              <div className="flex flex-wrap gap-1">
                {EQUIPAMENTOS.map(eq => (
                  <button
                    key={eq}
                    onClick={() => setFilters(f => ({ ...f, equipamento: f.equipamento === eq ? '' : eq }))}
                    className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                      filters.equipamento === eq
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-purple-300'
                    }`}
                  >
                    {eq}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <Button onClick={handleSearch} disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700">
          {loading ? (
            <><span className="animate-spin mr-2">⚡</span> Buscando com IA...</>
          ) : (
            <><Search className="w-4 h-4 mr-2" /> Buscar Clínicas</>
          )}
        </Button>

        {/* Resultados */}
        {results && (
          <div className="space-y-2 mt-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-slate-700">
                {results.clinicas_filtradas?.length || 0} clínicas encontradas
              </span>
              <span className="text-slate-500">{results.existing_in_crm} já no CRM</span>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {(results.clinicas_filtradas || []).map((clinica, i) => (
                <div key={i} className={`border rounded-lg p-3 ${clinica.ja_no_crm ? 'bg-green-50 border-green-200' : 'bg-white hover:bg-slate-50'}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm truncate">{clinica.nome}</span>
                        {clinica.ja_no_crm && <Badge className="bg-green-500 text-xs">No CRM</Badge>}
                        {clinica.score_oportunidade > 0 && (
                          <Badge className={`${scoreColor(clinica.score_oportunidade)} text-xs`}>
                            {clinica.score_oportunidade}pts
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                        {clinica.endereco && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{clinica.endereco.substring(0, 40)}...</span>}
                        {clinica.avaliacao_google > 0 && <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-500" />{clinica.avaliacao_google}</span>}
                      </div>
                      {clinica.especialidades?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {clinica.especialidades.slice(0, 3).map((esp, j) => (
                            <span key={j} className="text-xs bg-blue-50 text-blue-700 px-1.5 rounded">{esp}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-xs"
                        onClick={() => setExpanded(p => ({ ...p, [i]: !p[i] }))}
                      >
                        {expanded[i] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </Button>
                      {!clinica.ja_no_crm && (
                        <Button
                          size="sm"
                          className="h-6 text-xs bg-indigo-600"
                          disabled={creatingLead[clinica.nome]}
                          onClick={() => handleCreateLead(clinica)}
                        >
                          <UserPlus className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {expanded[i] && (
                    <div className="mt-2 pt-2 border-t space-y-1.5 text-xs">
                      {clinica.equipamento_recomendado && (
                        <div className="flex items-center gap-2">
                          <Zap className="w-3 h-3 text-purple-500" />
                          <span><strong>Equipamento:</strong> {clinica.equipamento_recomendado}</span>
                        </div>
                      )}
                      {clinica.abordagem_sugerida && (
                        <p className="text-slate-600 bg-yellow-50 p-2 rounded">{clinica.abordagem_sugerida}</p>
                      )}
                      <div className="flex gap-3">
                        {clinica.telefone && <a href={`tel:${clinica.telefone}`} className="flex items-center gap-1 text-green-600 hover:underline"><Phone className="w-3 h-3" />{clinica.telefone}</a>}
                        {clinica.instagram && <a href={`https://instagram.com/${clinica.instagram.replace('@','')}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-pink-600 hover:underline"><Instagram className="w-3 h-3" />{clinica.instagram}</a>}
                        {clinica.site && <a href={clinica.site} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline"><Globe className="w-3 h-3" />Site</a>}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { Search, Building2, Phone, MapPin, User, Loader2, ExternalLink, Plus, Star } from 'lucide-react';
import { toast } from 'sonner';

export default function BuscaClinicaCNPJ() {
  const [loading, setLoading] = useState(false);
  const [searchType, setSearchType] = useState('internet'); // 'cnpj' | 'internet' | 'crmv'
  const [cnpj, setCnpj] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [city, setCity] = useState('');
  const [results, setResults] = useState(null);
  const [addingLead, setAddingLead] = useState({});

  const buscar = async () => {
    setLoading(true);
    setResults(null);
    try {
      const res = await base44.functions.invoke('buscaCNPJClinica', {
        search_type: searchType,
        cnpj: searchType === 'cnpj' ? cnpj : undefined,
        clinic_name: clinicName || undefined,
        city: city || undefined,
      });

      if (res.data?.success) {
        setResults(res.data.result);
        toast.success('Pesquisa concluída!');
      } else {
        toast.error('Nenhum resultado encontrado');
      }
    } catch (e) {
      toast.error('Erro na busca: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const adicionarComoLead = async (clinica) => {
    const key = clinica.nome || clinica.razao_social;
    setAddingLead(prev => ({ ...prev, [key]: true }));
    try {
      await base44.entities.Lead.create({
        full_name: clinica.proprietario || clinica.nome || clinica.razao_social,
        company: clinica.nome || clinica.nome_fantasia || clinica.razao_social,
        city: clinica.cidade || clinica.municipio || city,
        phone: clinica.telefone,
        email: clinica.email,
        source: 'analise_mercado_ia',
        interest: clinica.equipamentos_possiveis || 'Equipamentos veterinários',
        notes: `CNPJ: ${clinica.cnpj || 'N/A'} | Especialidade: ${clinica.especialidades || clinica.atividade_principal || 'N/A'} | Porte: ${clinica.porte || 'N/A'}`,
        stage: 'novo',
      });
      toast.success(`${key} adicionado como Lead!`);
    } catch (e) {
      toast.error('Erro: ' + e.message);
    } finally {
      setAddingLead(prev => ({ ...prev, [key]: false }));
    }
  };

  const adicionarComoCliente = async (clinica) => {
    const key = clinica.nome || clinica.razao_social;
    setAddingLead(prev => ({ ...prev, [`c_${key}`]: true }));
    try {
      const nome = clinica.proprietario || clinica.nome || clinica.razao_social;
      const firstName = nome.split(' ')[0];
      await base44.entities.Client.create({
        first_name: firstName,
        full_name: nome,
        clinic_name: clinica.nome || clinica.nome_fantasia || clinica.razao_social,
        city: clinica.cidade || clinica.municipio || city,
        phone: clinica.telefone,
        email: clinica.email,
        cnpj: clinica.cnpj,
        address: clinica.logradouro ? `${clinica.logradouro}, ${clinica.numero || ''}` : undefined,
        cep: clinica.cep,
        lead_source: 'analise_mercado_ia',
        equipment_interest: clinica.equipamentos_possiveis,
        status: 'frio',
        pipeline_stage: 'lead',
      });
      toast.success(`${firstName} adicionado ao CRM!`);
    } catch (e) {
      toast.error('Erro: ' + e.message);
    } finally {
      setAddingLead(prev => ({ ...prev, [`c_${key}`]: false }));
    }
  };

  const renderResultCNPJ = (r) => r && !r.error ? (
    <div className="space-y-2">
      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
        <p className="font-bold text-slate-800">{r.nome_fantasia || r.razao_social}</p>
        <p className="text-xs text-slate-500">{r.razao_social}</p>
        <div className="grid grid-cols-2 gap-1 mt-2 text-xs">
          {[
            ['CNPJ', r.cnpj],
            ['Situação', r.situacao],
            ['Porte', r.porte],
            ['Abertura', r.data_abertura],
            ['Telefone', r.telefone],
            ['Email', r.email],
            ['CEP', r.cep],
            ['Capital Social', r.capital_social ? `R$ ${Number(r.capital_social).toLocaleString('pt-BR')}` : null],
          ].filter(([, v]) => v).map(([k, v]) => (
            <div key={k}><span className="text-slate-400">{k}: </span><span className="text-slate-700">{v}</span></div>
          ))}
        </div>
        {r.logradouro && <p className="text-xs text-slate-600 mt-1">📍 {r.logradouro}, {r.numero} - {r.bairro}, {r.municipio}/{r.uf}</p>}
        {r.atividade_principal && <p className="text-xs text-indigo-600 mt-1">🏥 {r.atividade_principal}</p>}
        {r.socios?.length > 0 && (
          <div className="mt-2">
            <p className="text-xs font-medium text-slate-600">Sócios:</p>
            {r.socios.map((s, i) => <p key={i} className="text-xs text-slate-700">👤 {s.nome} ({s.qualificacao})</p>)}
          </div>
        )}
        <Button size="sm" onClick={() => adicionarComoCliente(r)} disabled={addingLead[`c_${r.razao_social}`]} className="mt-2 text-xs h-7 bg-indigo-600">
          <Plus className="w-3 h-3 mr-1" /> Adicionar ao CRM
        </Button>
      </div>
    </div>
  ) : <p className="text-red-500 text-sm">{r?.error || 'Erro na busca'}</p>;

  const renderClinicas = (clinicas) => (
    <div className="space-y-2">
      {clinicas?.map((c, i) => (
        <div key={i} className="border rounded-lg p-3 bg-white">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-sm">{c.nome}</p>
                {c.score_potencial > 0 && (
                  <Badge className="bg-yellow-100 text-yellow-700 text-xs">
                    <Star className="w-3 h-3 mr-0.5" />{c.score_potencial}%
                  </Badge>
                )}
                {c.porte && <Badge variant="outline" className="text-xs">{c.porte}</Badge>}
              </div>
              {c.proprietario && <p className="text-xs text-indigo-600">👤 {c.proprietario}</p>}
              {c.endereco && <p className="text-xs text-slate-500 flex items-center gap-1"><MapPin className="w-3 h-3" />{c.endereco}</p>}
              {c.telefone && <p className="text-xs text-slate-500 flex items-center gap-1"><Phone className="w-3 h-3" />{c.telefone}</p>}
              {c.especialidades && <p className="text-xs text-slate-600 mt-0.5">🏥 {c.especialidades}</p>}
              {c.equipamentos_possiveis && <p className="text-xs text-green-700 mt-0.5">⚙️ {c.equipamentos_possiveis}</p>}
              {c.potencial_venda && <p className="text-xs text-purple-600 mt-0.5">💡 {c.potencial_venda}</p>}
            </div>
          </div>
          <div className="flex gap-1.5 mt-2">
            <Button size="sm" onClick={() => adicionarComoLead(c)} disabled={addingLead[c.nome]} className="text-xs h-6 bg-orange-500 hover:bg-orange-600 px-2">
              {addingLead[c.nome] ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Plus className="w-3 h-3 mr-0.5" />Lead</>}
            </Button>
            <Button size="sm" onClick={() => adicionarComoCliente(c)} disabled={addingLead[`c_${c.nome}`]} className="text-xs h-6 bg-indigo-600 px-2">
              {addingLead[`c_${c.nome}`] ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Plus className="w-3 h-3 mr-0.5" />CRM</>}
            </Button>
            {c.telefone && (
              <a href={`https://wa.me/55${c.telefone.replace(/\D/g,'')}`} target="_blank" rel="noreferrer">
                <Button size="sm" variant="outline" className="text-xs h-6 border-green-300 text-green-700 px-2">WhatsApp</Button>
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  const renderVeterinarios = (vets) => (
    <div className="space-y-2">
      {vets?.map((v, i) => (
        <div key={i} className="border rounded-lg p-3 bg-white">
          <p className="font-semibold text-sm"><User className="w-3 h-3 inline mr-1 text-indigo-500" />{v.nome}</p>
          {v.crmv && <p className="text-xs text-slate-500">CRMV: {v.crmv}</p>}
          {v.clinica && <p className="text-xs text-indigo-600"><Building2 className="w-3 h-3 inline mr-0.5" />{v.clinica}</p>}
          {v.especialidade && <p className="text-xs text-slate-600">🏥 {v.especialidade}</p>}
          {v.cidade && <p className="text-xs text-slate-500"><MapPin className="w-3 h-3 inline mr-0.5" />{v.cidade}</p>}
        </div>
      ))}
    </div>
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Search className="w-4 h-4 text-indigo-600" />
          Pesquisa de Clínicas & CNPJ
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Tipo de busca */}
        <div className="flex gap-1">
          {[
            { id: 'internet', label: '🌐 Internet' },
            { id: 'cnpj', label: '📋 CNPJ' },
            { id: 'crmv', label: '🏛️ CRMV' },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setSearchType(id)}
              className={`flex-1 py-1.5 rounded text-xs font-medium transition-colors ${searchType === id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >{label}</button>
          ))}
        </div>

        {/* Campos de busca */}
        <div className="space-y-2">
          {searchType === 'cnpj' ? (
            <Input placeholder="CNPJ (ex: 00.000.000/0001-00)" value={cnpj} onChange={e => setCnpj(e.target.value)} className="text-sm" />
          ) : (
            <>
              <Input placeholder="Nome da clínica (opcional)" value={clinicName} onChange={e => setClinicName(e.target.value)} className="text-sm" />
              <Input placeholder="Cidade*" value={city} onChange={e => setCity(e.target.value)} className="text-sm" />
            </>
          )}
        </div>

        <Button onClick={buscar} disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 h-8 text-sm">
          {loading ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />Pesquisando...</> : <><Search className="w-4 h-4 mr-1" />Pesquisar</>}
        </Button>

        {/* Resultados */}
        {results && (
          <div className="mt-3">
            {searchType === 'cnpj' && renderResultCNPJ(results)}
            {searchType === 'internet' && results.clinicas && renderClinicas(results.clinicas)}
            {searchType === 'crmv' && results.veterinarios && renderVeterinarios(results.veterinarios)}
            {results.observacoes && <p className="text-xs text-slate-500 italic mt-2">{results.observacoes}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
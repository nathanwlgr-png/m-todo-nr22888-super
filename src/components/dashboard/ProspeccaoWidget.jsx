import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { Sparkles, Building2, MapPin, Zap, UserPlus, RefreshCw, TrendingUp, Target, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

export default function ProspeccaoWidget() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [creatingLead, setCreatingLead] = useState({});

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('prospeccaoInteligente', { limit: 8 });
      setData(res.data);
    } catch (e) {
      toast.error('Erro ao gerar sugestões: ' + e.message);
    }
    setLoading(false);
  };

  const handleCreateLead = async (sug) => {
    setCreatingLead(prev => ({ ...prev, [sug.nome_clinica]: true }));
    try {
      await base44.entities.Client.create({
        first_name: sug.responsavel || 'Responsável',
        clinic_name: sug.nome_clinica,
        city: sug.cidade,
        phone: sug.telefone,
        instagram_handle: sug.instagram,
        website: sug.site,
        status: 'frio',
        pipeline_stage: 'lead',
        lead_source: 'analise_mercado_ia',
        equipment_interest: sug.equipamento_recomendado,
        purchase_score: sug.fit_score || 50,
        notes: `[IA Prospecção] ${sug.razao_indicacao}. Abordagem: ${sug.abordagem_personalizada}`,
      });
      toast.success(`${sug.nome_clinica} adicionada ao CRM!`);
    } catch (e) {
      toast.error('Erro ao adicionar lead');
    }
    setCreatingLead(prev => ({ ...prev, [sug.nome_clinica]: false }));
  };

  const fitColor = (score) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-400';
    return 'bg-slate-400';
  };

  const urgenciaColor = (urgencia) => {
    const u = (urgencia || '').toLowerCase();
    if (u.includes('alta') || u.includes('imediata')) return 'bg-red-100 text-red-700 border-red-200';
    if (u.includes('média') || u.includes('media')) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    return 'bg-slate-100 text-slate-600 border-slate-200';
  };

  return (
    <Card className="border-purple-100">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            Sugestão de Prospecção IA
          </div>
          <Button
            size="sm"
            onClick={handleGenerate}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700 h-7 text-xs"
          >
            {loading ? (
              <><RefreshCw className="w-3 h-3 mr-1 animate-spin" /> Analisando...</>
            ) : (
              <><Zap className="w-3 h-3 mr-1" /> {data ? 'Atualizar' : 'Gerar Sugestões'}</>
            )}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!data && !loading && (
          <div className="text-center py-8 text-slate-500">
            <Sparkles className="w-10 h-10 mx-auto mb-3 text-purple-200" />
            <p className="text-sm font-medium">Prospecção Inteligente</p>
            <p className="text-xs mt-1 text-slate-400">
              A IA analisa seu histórico de vendas e perfil de clientes para sugerir as melhores clínicas para prospectar agora.
            </p>
            <Button onClick={handleGenerate} className="mt-4 bg-purple-600 hover:bg-purple-700" size="sm">
              <Sparkles className="w-4 h-4 mr-2" /> Gerar Sugestões
            </Button>
          </div>
        )}

        {loading && (
          <div className="text-center py-8">
            <div className="animate-pulse space-y-3">
              <div className="h-3 bg-purple-100 rounded w-3/4 mx-auto" />
              <div className="h-3 bg-purple-100 rounded w-1/2 mx-auto" />
              <div className="h-3 bg-purple-100 rounded w-2/3 mx-auto" />
            </div>
            <p className="text-xs text-slate-500 mt-4">Analisando ICP e buscando clínicas alvo...</p>
          </div>
        )}

        {data && !loading && (
          <div className="space-y-3">
            {/* ICP resumo */}
            {data.suggestions?.icp_resumo && (
              <div className="bg-purple-50 rounded-lg p-3 text-xs">
                <div className="flex items-center gap-2 font-semibold text-purple-800 mb-1">
                  <Target className="w-3 h-3" /> Perfil do Cliente Ideal
                </div>
                <p className="text-purple-700">{data.suggestions.icp_resumo.perfil_ideal}</p>
                {data.suggestions.icp_resumo.caracteristicas_chave?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {data.suggestions.icp_resumo.caracteristicas_chave.slice(0, 4).map((c, i) => (
                      <span key={i} className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full text-xs">{c}</span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Stats rápidos */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-50 rounded p-2">
                <p className="text-lg font-bold text-slate-800">{data.icp_data?.total_vendas_fechadas || 0}</p>
                <p className="text-xs text-slate-500">Vendas base</p>
              </div>
              <div className="bg-slate-50 rounded p-2">
                <p className="text-lg font-bold text-indigo-600">
                  {data.suggestions?.sugestoes?.length || 0}
                </p>
                <p className="text-xs text-slate-500">Sugestões</p>
              </div>
              <div className="bg-slate-50 rounded p-2">
                <p className="text-sm font-bold text-green-600">
                  R${((data.icp_data?.ticket_medio || 0) / 1000).toFixed(0)}k
                </p>
                <p className="text-xs text-slate-500">Ticket médio</p>
              </div>
            </div>

            {/* Lista de sugestões */}
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {(data.suggestions?.sugestoes || []).map((sug, i) => (
                <div key={i} className="border rounded-lg p-3 bg-white hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="font-semibold text-sm">{sug.nome_clinica}</span>
                        <Badge className={`${fitColor(sug.fit_score)} text-xs`}>
                          Fit {sug.fit_score}%
                        </Badge>
                        {sug.urgencia && (
                          <span className={`text-xs px-1.5 py-0.5 rounded border ${urgenciaColor(sug.urgencia)}`}>
                            {sug.urgencia}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                        <MapPin className="w-3 h-3" />
                        {sug.cidade}{sug.estado ? `, ${sug.estado}` : ''}
                        {sug.porte && <span>· {sug.porte}</span>}
                        {sug.volume_estimado && <span>· {sug.volume_estimado}</span>}
                      </div>
                      {sug.especialidades?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {sug.especialidades.slice(0, 3).map((e, j) => (
                            <span key={j} className="text-xs bg-blue-50 text-blue-700 px-1.5 rounded">{e}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      <Button size="sm" variant="ghost" className="h-6" onClick={() => setExpanded(p => ({ ...p, [i]: !p[i] }))}>
                        {expanded[i] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </Button>
                      <Button
                        size="sm"
                        className="h-6 text-xs bg-purple-600 hover:bg-purple-700"
                        disabled={creatingLead[sug.nome_clinica]}
                        onClick={() => handleCreateLead(sug)}
                      >
                        <UserPlus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  {expanded[i] && (
                    <div className="mt-2 pt-2 border-t space-y-2 text-xs">
                      <div className="bg-purple-50 p-2 rounded">
                        <p className="font-semibold text-purple-800 mb-0.5">Por que prospectar?</p>
                        <p className="text-purple-700">{sug.razao_indicacao}</p>
                      </div>
                      {sug.equipamento_recomendado && (
                        <div className="flex items-center gap-2">
                          <Zap className="w-3 h-3 text-yellow-500" />
                          <strong>Equipamento ideal:</strong> {sug.equipamento_recomendado}
                        </div>
                      )}
                      {sug.abordagem_personalizada && (
                        <div className="bg-green-50 p-2 rounded">
                          <p className="font-semibold text-green-800 mb-0.5">Abordagem sugerida:</p>
                          <p className="text-green-700">{sug.abordagem_personalizada}</p>
                        </div>
                      )}
                      {sug.sinais_compra?.length > 0 && (
                        <div>
                          <p className="font-semibold mb-1">Sinais de compra:</p>
                          <div className="flex flex-wrap gap-1">
                            {sug.sinais_compra.map((s, j) => (
                              <span key={j} className="bg-orange-50 text-orange-700 px-1.5 py-0.5 rounded border border-orange-200">{s}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Próximas cidades alvo */}
            {data.suggestions?.proximas_cidades_alvo?.length > 0 && (
              <div className="bg-indigo-50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-indigo-800 mb-2">
                  <TrendingUp className="w-3 h-3" /> Próximas cidades alvo
                </div>
                <div className="flex flex-wrap gap-1">
                  {data.suggestions.proximas_cidades_alvo.map((c, i) => (
                    <span key={i} className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">{c}</span>
                  ))}
                </div>
              </div>
            )}

            {data.suggestions?.insights_mercado && (
              <p className="text-xs text-slate-500 italic">{data.suggestions.insights_mercado}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
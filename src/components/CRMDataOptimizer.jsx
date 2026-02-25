import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Sparkles, CheckCircle2, AlertCircle, RefreshCw, Wand2, Database, Shield, FileText, Users } from 'lucide-react';
import { toast } from 'sonner';

const MODES = [
  { id: 'suggest', icon: '💡', label: 'Sugerir Campos', desc: 'IA indica quais campos preencher para maximizar o score' },
  { id: 'clean', icon: '🧹', label: 'Limpar Dados', desc: 'Padroniza nomes de equipamentos, cidades e categorias' },
  { id: 'products', icon: '📦', label: 'Gerar Descrições', desc: 'Descrições e diferenciais dos produtos com base em dados técnicos' },
  { id: 'enrich', icon: '🔍', label: 'Enriquecer Cliente', desc: 'Enriquece dados do cliente com fontes externas confiáveis' },
];

export default function CRMDataOptimizer({ client }) {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState('suggest');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [applying, setApplying] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState(client?.id || null);

  const { data: allClients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-updated_date'),
    staleTime: 60000,
  });

  const { data: equipments = [] } = useQuery({
    queryKey: ['equipments'],
    queryFn: () => base44.entities.Equipment.list(),
    staleTime: 120000,
  });

  const activeClient = client || allClients.find(c => c.id === selectedClientId);

  const run = async () => {
    setLoading(true);
    setResult(null);
    try {
      if (mode === 'suggest') await runSuggest();
      else if (mode === 'clean') await runClean();
      else if (mode === 'products') await runProducts();
      else if (mode === 'enrich') await runEnrich();
    } catch (e) {
      toast.error('Erro: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  // ── 1. SUGERIR CAMPOS ──────────────────────────────────────────────────────
  const runSuggest = async () => {
    if (!activeClient) { toast.error('Selecione um cliente'); return; }
    const fields = {
      first_name: activeClient.first_name,
      clinic_name: activeClient.clinic_name,
      city: activeClient.city,
      phone: activeClient.phone,
      email: activeClient.email,
      client_type: activeClient.client_type,
      current_equipment: activeClient.current_equipment,
      equipment_interest: activeClient.equipment_interest,
      current_volume: activeClient.current_volume,
      available_budget: activeClient.available_budget,
      purchase_score: activeClient.purchase_score,
      status: activeClient.status,
      pipeline_stage: activeClient.pipeline_stage,
      main_pains: activeClient.main_pains,
      real_objections: activeClient.real_objections,
      lab_needs: activeClient.lab_needs,
      behavioral_profile: activeClient.behavioral_profile,
      numerology_number: activeClient.numerology_number,
      decision_deadline: activeClient.decision_deadline,
      cnpj: activeClient.cnpj,
      website: activeClient.website,
      instagram_handle: activeClient.instagram_handle,
    };
    const empty = Object.entries(fields).filter(([, v]) => !v || (Array.isArray(v) && v.length === 0)).map(([k]) => k);
    const filled = Object.entries(fields).filter(([, v]) => v && !(Array.isArray(v) && v.length === 0)).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join('\n');

    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Você é um especialista em CRM de vendas B2B para equipamentos veterinários (Seamaty).

CLIENTE ATUAL — campos preenchidos:
${filled}

CAMPOS VAZIOS: ${empty.join(', ')}

Analise o perfil e sugira os 5-7 campos mais CRÍTICOS para preencher e como obter cada informação.
Para cada campo, dê:
1. Impacto no score de vendas (alto/médio/baixo)
2. Como perguntar/obter a informação
3. Exemplo de valor esperado

Responda em JSON.`,
      response_json_schema: {
        type: 'object',
        properties: {
          priority_fields: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: { type: 'string' },
                label: { type: 'string' },
                impact: { type: 'string' },
                how_to_get: { type: 'string' },
                example: { type: 'string' },
              }
            }
          },
          profile_completeness: { type: 'number' },
          top_insight: { type: 'string' },
        }
      }
    });
    setResult({ mode: 'suggest', data: res });
  };

  // ── 2. LIMPAR E PADRONIZAR DADOS ──────────────────────────────────────────
  const runClean = async () => {
    const sample = allClients.slice(0, 30).map(c => ({
      id: c.id,
      city: c.city,
      current_equipment: c.current_equipment,
      equipment_interest: c.equipment_interest,
      client_type: c.client_type,
      status: c.status,
    }));

    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Você é um especialista em qualidade de dados CRM.

Analise estes registros de clientes e identifique problemas de padronização:
${JSON.stringify(sample, null, 2)}

Categorias válidas:
- status: quente, morno, frio
- client_type: clinica_pequena, clinica_media, hospital_veterinario, laboratorio_terceirizado, clinica_especializada, sem_equipamento
- equipment_interest/current_equipment: VBC-50A, SMT-120VP, QT3, VG1, VG2, Vi1, VQ1, IDEXX, Mindray, outro
- city: nome correto da cidade (sem abreviações)

Retorne os IDs que precisam de correção e os valores corretos sugeridos.`,
      response_json_schema: {
        type: 'object',
        properties: {
          issues_found: { type: 'number' },
          corrections: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                field: { type: 'string' },
                current_value: { type: 'string' },
                suggested_value: { type: 'string' },
                reason: { type: 'string' },
              }
            }
          },
          summary: { type: 'string' },
        }
      }
    });
    setResult({ mode: 'clean', data: res });
  };

  // ── 3. GERAR DESCRIÇÕES DE PRODUTOS ───────────────────────────────────────
  const runProducts = async () => {
    const equips = equipments.length > 0 ? equipments : [
      { name: 'VBC-50A', category: 'analisador_hematologico', price: 45000, parameters_measured: '26 parâmetros hematológicos', sample_volume: '20μL', processing_time: '3-5 min', roi_months: 8 },
      { name: 'SMT-120VP', category: 'analisador_bioquimico', price: 65000, processing_time: '120 testes/hora', roi_months: 10 },
      { name: 'VG2', category: 'gasometro', price: 95000, parameters_measured: 'gasometria + imunofluorescência', roi_months: 14 },
    ];

    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Você é o copywriter especialista em equipamentos veterinários da Seamaty (empresa líder em diagnóstico veterinário). 

Para cada equipamento abaixo, gere:
1. Descrição técnica-comercial poderosa (3-4 linhas)
2. 5 diferenciais únicos vs concorrentes (IDEXX, Mindray, Heska)
3. Argumento de ROI convincente
4. Frase de impacto para vendas (1 linha)
5. Objeção mais comum + resposta

Equipamentos: ${JSON.stringify(equips.map(e => ({ name: e.name, category: e.category, price: e.price, specs: e.parameters_measured, time: e.processing_time, roi: e.roi_months })), null, 2)}

Contexto: diferenciais globais Seamaty = 25 meses de garantia, manutenção vitalícia, bonificação em insumos, ISO 13485:2016, suporte técnico especializado.`,
      response_json_schema: {
        type: 'object',
        properties: {
          products: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                description: { type: 'string' },
                differentials: { type: 'array', items: { type: 'string' } },
                roi_argument: { type: 'string' },
                sales_phrase: { type: 'string' },
                main_objection: { type: 'string' },
                objection_response: { type: 'string' },
              }
            }
          }
        }
      }
    });
    setResult({ mode: 'products', data: res });
  };

  // ── 4. ENRIQUECER DADOS DO CLIENTE ────────────────────────────────────────
  const runEnrich = async () => {
    if (!activeClient) { toast.error('Selecione um cliente'); return; }
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Você é um especialista em inteligência de mercado veterinário brasileiro.

Cliente CRM:
- Nome: ${activeClient.first_name} ${activeClient.full_name || ''}
- Clínica: ${activeClient.clinic_name || 'N/A'}
- Cidade: ${activeClient.city || 'N/A'}
- CNPJ: ${activeClient.cnpj || 'não informado'}
- Website: ${activeClient.website || 'não informado'}
- Instagram: ${activeClient.instagram_handle || 'não informado'}
- Tipo: ${activeClient.client_type || 'não informado'}
- Equipamento atual: ${activeClient.current_equipment || 'não informado'}
- Volume: ${activeClient.current_volume || 'não informado'}

Com base nestas informações e no mercado veterinário brasileiro:
1. Estime o porte real da clínica (faturamento mensal provável em R$)
2. Calcule poder de compra estimado para equipamentos (R$)
3. Identifique especialidades veterinárias prováveis da clínica
4. Sugira equipamentos mais adequados ao perfil
5. Identifique possíveis concorrentes na região
6. Estime volume mensal de exames esperado para o porte
7. Sugira a melhor estratégia de abordagem baseada no perfil
8. Identifique campos do CRM que podem ser preenchidos com estas inferências`,
      add_context_from_internet: !!(activeClient.cnpj || activeClient.website || activeClient.instagram_handle),
      response_json_schema: {
        type: 'object',
        properties: {
          estimated_revenue: { type: 'string' },
          buying_power: { type: 'number' },
          specialties: { type: 'array', items: { type: 'string' } },
          recommended_equipment: { type: 'string' },
          recommended_equipment_reason: { type: 'string' },
          competitors_nearby: { type: 'array', items: { type: 'string' } },
          estimated_volume: { type: 'string' },
          approach_strategy: { type: 'string' },
          fields_to_fill: { type: 'object' },
          confidence_score: { type: 'number' },
          data_sources: { type: 'array', items: { type: 'string' } },
        }
      }
    });
    setResult({ mode: 'enrich', data: res, clientId: activeClient.id });
  };

  // ── APLICAR ENRIQUECIMENTO ─────────────────────────────────────────────────
  const applyEnrichment = async () => {
    if (!result?.data || result.mode !== 'enrich') return;
    setApplying(true);
    try {
      const d = result.data;
      const updates = {};
      if (d.buying_power && !activeClient.valor_real_poder_compra) updates.valor_real_poder_compra = d.buying_power;
      if (d.recommended_equipment && !activeClient.equipment_suggestion) updates.equipment_suggestion = d.recommended_equipment;
      if (d.recommended_equipment_reason && !activeClient.equipment_suggestion_reason) updates.equipment_suggestion_reason = d.recommended_equipment_reason;
      if (d.approach_strategy && !activeClient.next_action) updates.next_action = d.approach_strategy;
      if (d.fields_to_fill) Object.assign(updates, d.fields_to_fill);

      if (Object.keys(updates).length === 0) { toast.info('Nenhum campo novo para atualizar'); return; }
      await base44.entities.Client.update(activeClient.id, updates);
      queryClient.invalidateQueries(['clients']);
      queryClient.invalidateQueries(['client', activeClient.id]);
      toast.success(`${Object.keys(updates).length} campos enriquecidos!`);
    } catch (e) {
      toast.error('Erro ao aplicar: ' + e.message);
    } finally {
      setApplying(false);
    }
  };

  // ── APLICAR LIMPEZA ─────────────────────────────────────────────────────────
  const applyClean = async () => {
    if (!result?.data?.corrections?.length) return;
    setApplying(true);
    try {
      const grouped = {};
      result.data.corrections.forEach(c => {
        if (!grouped[c.id]) grouped[c.id] = {};
        grouped[c.id][c.field] = c.suggested_value;
      });
      await Promise.all(Object.entries(grouped).map(([id, data]) => base44.entities.Client.update(id, data)));
      queryClient.invalidateQueries(['clients']);
      toast.success(`${result.data.corrections.length} correções aplicadas!`);
      setResult(null);
    } catch (e) {
      toast.error('Erro ao aplicar: ' + e.message);
    } finally {
      setApplying(false);
    }
  };

  const impactColor = (impact) => impact === 'alto' ? 'bg-red-100 text-red-700' : impact === 'médio' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700';

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Database className="w-4 h-4 text-indigo-600" />
        <h3 className="font-bold text-slate-800 text-sm">Otimização de Dados CRM com IA</h3>
        <Badge className="bg-indigo-100 text-indigo-700 text-[10px]">NR22</Badge>
      </div>

      {/* Seletor de modo */}
      <div className="grid grid-cols-2 gap-2">
        {MODES.map(m => (
          <button key={m.id} onClick={() => { setMode(m.id); setResult(null); }}
            className={`text-left p-2.5 rounded-lg border transition-all ${mode === m.id ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
            <div className="text-sm">{m.icon} <span className="font-medium text-slate-800">{m.label}</span></div>
            <div className="text-[10px] text-slate-500 mt-0.5">{m.desc}</div>
          </button>
        ))}
      </div>

      {/* Seletor de cliente (para modos que precisam) */}
      {(mode === 'suggest' || mode === 'enrich') && !client && (
        <Select value={selectedClientId || ''} onValueChange={setSelectedClientId}>
          <SelectTrigger className="h-9"><SelectValue placeholder="Selecione um cliente..." /></SelectTrigger>
          <SelectContent>
            {allClients.map(c => (
              <SelectItem key={c.id} value={c.id}>
                {c.status === 'quente' ? '🔥' : c.status === 'morno' ? '🌡️' : '❄️'} {c.first_name} {c.clinic_name ? `· ${c.clinic_name}` : ''} {c.city ? `· ${c.city}` : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <Button onClick={run} disabled={loading || ((mode === 'suggest' || mode === 'enrich') && !activeClient)}
        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 h-9">
        {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Analisando com IA...</> : <><Wand2 className="w-4 h-4 mr-2" /> Executar IA</>}
      </Button>

      {/* ── RESULTADOS ── */}
      {result && (
        <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2">

          {/* SUGERIR CAMPOS */}
          {result.mode === 'suggest' && result.data && (
            <>
              <div className="flex items-center gap-2 bg-indigo-50 rounded-lg px-3 py-2">
                <div className="text-xs font-medium text-indigo-700">
                  📊 Completude do perfil: <strong>{Math.round(result.data.profile_completeness || 0)}%</strong>
                </div>
              </div>
              {result.data.top_insight && (
                <Card className="border-amber-200 bg-amber-50"><CardContent className="p-3">
                  <p className="text-[10px] font-bold text-amber-700 mb-1">💡 INSIGHT PRINCIPAL</p>
                  <p className="text-xs text-amber-800">{result.data.top_insight}</p>
                </CardContent></Card>
              )}
              <div className="space-y-2">
                {(result.data.priority_fields || []).map((f, i) => (
                  <Card key={i} className="border-slate-200"><CardContent className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-slate-800">{f.label || f.field}</span>
                          <Badge className={`text-[10px] h-4 ${impactColor(f.impact)}`}>{f.impact}</Badge>
                        </div>
                        <p className="text-[10px] text-slate-600"><strong>Como obter:</strong> {f.how_to_get}</p>
                        {f.example && <p className="text-[10px] text-slate-500 mt-0.5"><strong>Ex:</strong> {f.example}</p>}
                      </div>
                    </div>
                  </CardContent></Card>
                ))}
              </div>
            </>
          )}

          {/* LIMPAR DADOS */}
          {result.mode === 'clean' && result.data && (
            <>
              <div className="flex items-center justify-between bg-orange-50 rounded-lg px-3 py-2">
                <span className="text-xs font-medium text-orange-700">
                  🧹 {result.data.issues_found || result.data.corrections?.length || 0} problemas encontrados
                </span>
                {result.data.corrections?.length > 0 && (
                  <Button size="sm" onClick={applyClean} disabled={applying} className="h-7 text-xs bg-orange-500 hover:bg-orange-600">
                    {applying ? <Loader2 className="w-3 h-3 animate-spin" /> : '✅ Aplicar Tudo'}
                  </Button>
                )}
              </div>
              {result.data.summary && <p className="text-xs text-slate-600 px-1">{result.data.summary}</p>}
              <div className="space-y-2">
                {(result.data.corrections || []).map((c, i) => (
                  <Card key={i} className="border-orange-100"><CardContent className="p-2.5">
                    <div className="flex items-center gap-2 text-xs">
                      <AlertCircle className="w-3 h-3 text-orange-500 shrink-0" />
                      <div className="flex-1">
                        <span className="font-medium text-slate-700">{c.field}:</span>
                        <span className="text-red-500 line-through mx-1">{c.current_value || '—'}</span>
                        <span className="text-green-600">→ {c.suggested_value}</span>
                        {c.reason && <p className="text-[10px] text-slate-400 mt-0.5">{c.reason}</p>}
                      </div>
                    </div>
                  </CardContent></Card>
                ))}
                {(!result.data.corrections || result.data.corrections.length === 0) && (
                  <Card className="border-green-200 bg-green-50"><CardContent className="p-3 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="text-xs text-green-700 font-medium">Dados padronizados! Nenhuma correção necessária.</span>
                  </CardContent></Card>
                )}
              </div>
            </>
          )}

          {/* DESCRIÇÕES DE PRODUTOS */}
          {result.mode === 'products' && result.data && (
            <div className="space-y-3">
              {(result.data.products || []).map((p, i) => (
                <Card key={i} className="border-indigo-100"><CardContent className="p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-700">{p.name}</span>
                    <Badge className="bg-indigo-100 text-indigo-600 text-[10px]">Seamaty</Badge>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">{p.description}</p>
                  {p.sales_phrase && (
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded p-2 border-l-2 border-indigo-400">
                      <p className="text-[10px] font-bold text-indigo-600 mb-0.5">💬 FRASE DE IMPACTO</p>
                      <p className="text-xs text-indigo-800 italic">"{p.sales_phrase}"</p>
                    </div>
                  )}
                  {p.differentials?.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold text-slate-500 mb-1">⚡ DIFERENCIAIS</p>
                      <ul className="space-y-0.5">
                        {p.differentials.map((d, j) => <li key={j} className="text-[10px] text-slate-700 flex gap-1"><span className="text-green-500">✓</span>{d}</li>)}
                      </ul>
                    </div>
                  )}
                  {p.roi_argument && <p className="text-[10px] bg-green-50 text-green-700 rounded p-1.5"><strong>ROI:</strong> {p.roi_argument}</p>}
                  {p.main_objection && (
                    <div className="bg-red-50 rounded p-1.5">
                      <p className="text-[10px] text-red-600"><strong>Objeção:</strong> {p.main_objection}</p>
                      <p className="text-[10px] text-green-700 mt-0.5"><strong>Resposta:</strong> {p.objection_response}</p>
                    </div>
                  )}
                </CardContent></Card>
              ))}
            </div>
          )}

          {/* ENRIQUECER CLIENTE */}
          {result.mode === 'enrich' && result.data && (
            <>
              <div className="flex items-center justify-between bg-blue-50 rounded-lg px-3 py-2">
                <span className="text-xs font-medium text-blue-700">
                  🔍 Confiança: {Math.round(result.data.confidence_score || 70)}%
                  {result.data.data_sources?.length > 0 && <span className="text-blue-500 ml-1">· {result.data.data_sources.join(', ')}</span>}
                </span>
                <Button size="sm" onClick={applyEnrichment} disabled={applying} className="h-7 text-xs bg-blue-600 hover:bg-blue-700">
                  {applying ? <Loader2 className="w-3 h-3 animate-spin" /> : '💾 Salvar no CRM'}
                </Button>
              </div>
              <div className="space-y-2">
                {[
                  { label: '💰 Faturamento Estimado', value: result.data.estimated_revenue },
                  { label: '💳 Poder de Compra', value: result.data.buying_power ? `R$ ${Number(result.data.buying_power).toLocaleString('pt-BR')}` : null },
                  { label: '📦 Equipamento Recomendado', value: result.data.recommended_equipment },
                  { label: '📊 Volume de Exames Estimado', value: result.data.estimated_volume },
                ].filter(item => item.value).map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-xs bg-white border rounded-lg px-3 py-2">
                    <span className="text-slate-500">{item.label}</span>
                    <span className="font-semibold text-slate-800">{item.value}</span>
                  </div>
                ))}
                {result.data.specialties?.length > 0 && (
                  <div className="bg-white border rounded-lg px-3 py-2">
                    <p className="text-[10px] text-slate-500 mb-1">🐾 ESPECIALIDADES PROVÁVEIS</p>
                    <div className="flex flex-wrap gap-1">
                      {result.data.specialties.map((s, i) => <Badge key={i} className="text-[10px] bg-purple-100 text-purple-700">{s}</Badge>)}
                    </div>
                  </div>
                )}
                {result.data.recommended_equipment_reason && (
                  <Card className="border-indigo-200 bg-indigo-50"><CardContent className="p-2.5">
                    <p className="text-[10px] font-bold text-indigo-600 mb-0.5">💡 POR QUÊ ESTE EQUIPAMENTO</p>
                    <p className="text-xs text-indigo-800">{result.data.recommended_equipment_reason}</p>
                  </CardContent></Card>
                )}
                {result.data.approach_strategy && (
                  <Card className="border-green-200 bg-green-50"><CardContent className="p-2.5">
                    <p className="text-[10px] font-bold text-green-600 mb-0.5">🎯 ESTRATÉGIA DE ABORDAGEM</p>
                    <p className="text-xs text-green-800">{result.data.approach_strategy}</p>
                  </CardContent></Card>
                )}
                {result.data.competitors_nearby?.length > 0 && (
                  <div className="bg-white border rounded-lg px-3 py-2">
                    <p className="text-[10px] text-slate-500 mb-1">⚔️ CONCORRENTES NA REGIÃO</p>
                    <div className="flex flex-wrap gap-1">
                      {result.data.competitors_nearby.map((c, i) => <Badge key={i} className="text-[10px] bg-red-100 text-red-700">{c}</Badge>)}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
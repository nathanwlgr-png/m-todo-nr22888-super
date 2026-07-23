import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import {
  Search, Brain, Target, DollarSign, Users, Zap,
  ChevronRight, RefreshCw, Copy, Check, Star,
  MapPin, Phone, Globe, TrendingUp, Shield, Award
} from 'lucide-react';
import { toast } from 'sonner';
import Score4x4Display from '@/components/Score4x4Display';
import BattlecardAtaque from '@/components/elite/BattlecardAtaque';
import DropboxEvidenceCard from '@/components/investigation/DropboxEvidenceCard';
import SalesPersonalityCard from '@/components/clients/SalesPersonalityCard';
import CollapsibleInsightSection from '@/components/investigation/CollapsibleInsightSection';

const SCORE_COLORS = {
  alto: '#00ff88',
  medio: '#ff9500',
  baixo: '#ff4444',
};

export default function ModoInvestigativoSupremo() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

  const { data: clients = [] } = useQuery({
    queryKey: ['inv-clients'],
    queryFn: () => base44.entities.Client.list('-updated_date', 200),
    staleTime: 5 * 60 * 1000,
  });

  const [score4x4, setScore4x4] = useState(null);
  const [loadingScore, setLoadingScore] = useState(false);

  // Carregar score 4x4 quando seleciona cliente
  const loadScore4x4 = async (clientId) => {
    setLoadingScore(true);
    try {
      const res = await base44.functions.invoke('calculate4x4Score', { clientId });
      setScore4x4(res.data);
    } catch (e) {
      console.error('Erro ao calcular score 4x4:', e);
      setScore4x4(null);
    } finally {
      setLoadingScore(false);
    }
  };

  const filteredClients = query.length >= 2
    ? clients.filter(c =>
        c.first_name?.toLowerCase().includes(query.toLowerCase()) ||
        c.clinic_name?.toLowerCase().includes(query.toLowerCase()) ||
        c.city?.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 6)
    : [];

  const handleInvestigate = async (client) => {
    setSelectedClient(client);
    setQuery('');
    setLoading(true);
    setResult(null);
    setScore4x4(null);
    loadScore4x4(client.id);

    try {
      const [res, dropbox] = await Promise.all([
        base44.functions.invoke('investigacaoCampoReal', {
          clinic_name: client.clinic_name || `Clínica ${client.first_name}`,
          city: client.city,
          client_name: client.first_name,
          phone: client.phone,
          website: client.website,
          instagram: client.instagram_handle,
          cnpj: client.cnpj,
          current_equipment: client.current_equipment,
          client_type: client.client_type,
          market_time: client.market_time,
          behavioral_profile: client.behavioral_profile,
          decision_style: client.decision_style,
          approach_tips: client.approach_tips,
        }),
        base44.functions.invoke('dropboxInventarioReadOnly', {
          action: 'search_support',
          query: client.equipment_interest || client.current_equipment || client.clinic_name || 'manual Seamaty',
          client_context: `${client.clinic_name || client.first_name}; equipamento atual: ${client.current_equipment || 'não informado'}; interesse: ${client.equipment_interest || 'não informado'}; necessidades: ${(client.lab_needs || []).join(', ') || 'não informadas'}`,
        }),
      ]);

      if (res?.data) {
        setResult({ ...res.data, dropbox_support: dropbox?.data });
      } else {
        // Gerar análise via IA se função não retornou
        const aiRes = await base44.integrations.Core.InvokeLLM({
          prompt: `Analise este cliente veterinário e gere um perfil comercial completo:
            Nome: ${client.first_name}
            Clínica: ${client.clinic_name || 'não informado'}
            Cidade: ${client.city || 'não informado'}
            Tipo: ${client.client_type || 'não informado'}
            Equipamento atual: ${client.current_equipment || 'não informado'}
            Volume mensal: ${client.current_volume || 'não informado'}
            Status: ${client.status || 'morno'}
            Score: ${client.purchase_score || 0}
            Perfil comportamental: ${client.behavioral_profile || 'não informado'}
            Estilo de decisão: ${client.decision_style || 'não informado'}
            Direção de abordagem: ${client.approach_tips || 'não informada'}
            Use esses dados apenas para dosar a abordagem comercial, sem citar cálculo, número ou numerologia.
            
            Gere:
            1. Score comercial (0-100) com justificativa
            2. Perfil do decisor (estilo, motivações, objeções)
            3. Potencial de compra de equipamento (VG2 ou SMT-120VP)
            4. Potencial de comodato estratégico
            5. Abordagem recomendada SPIN Selling
            6. Melhor momento para contato
            7. Produto ideal para oferecer`,
          response_json_schema: {
            type: 'object',
            properties: {
              commercial_score: { type: 'number' },
              score_level: { type: 'string', enum: ['alto', 'medio', 'baixo'] },
              score_justification: { type: 'string' },
              decision_maker_profile: { type: 'string' },
              decision_style: { type: 'string' },
              main_motivations: { type: 'array', items: { type: 'string' } },
              predicted_objections: { type: 'array', items: { type: 'string' } },
              equipment_purchase_potential: { type: 'string' },
              recommended_product: { type: 'string' },
              comodato_potential: { type: 'string' },
              comodato_score: { type: 'number' },
              recommended_approach: { type: 'string' },
              spin_questions: { type: 'array', items: { type: 'string' } },
              best_contact_time: { type: 'string' },
              next_action: { type: 'string' },
            }
          }
        });
        setResult(aiRes);
      }
    } catch (e) {
      toast.error('Erro na investigação: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleManualInvestigate = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResult(null);
    setSelectedClient(null);
    try {
      const aiRes = await base44.integrations.Core.InvokeLLM({
        prompt: `Analise esta clínica veterinária e gere um perfil comercial completo para venda de equipamentos Seamaty (SMT-120VP hematologia, VG2 bioquímica):
          Busca: "${query}"
          
          Gere um score comercial, perfil do decisor, potencial de compra e abordagem SPIN Selling recomendada.`,
        response_json_schema: {
          type: 'object',
          properties: {
            commercial_score: { type: 'number' },
            score_level: { type: 'string', enum: ['alto', 'medio', 'baixo'] },
            score_justification: { type: 'string' },
            decision_maker_profile: { type: 'string' },
            decision_style: { type: 'string' },
            main_motivations: { type: 'array', items: { type: 'string' } },
            predicted_objections: { type: 'array', items: { type: 'string' } },
            equipment_purchase_potential: { type: 'string' },
            recommended_product: { type: 'string' },
            comodato_potential: { type: 'string' },
            comodato_score: { type: 'number' },
            recommended_approach: { type: 'string' },
            spin_questions: { type: 'array', items: { type: 'string' } },
            best_contact_time: { type: 'string' },
            next_action: { type: 'string' },
          }
        }
      });
      setResult(aiRes);
    } catch (e) {
      toast.error('Erro: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    const text = result ? JSON.stringify(result, null, 2) : '';
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Análise copiada!');
  };

  const scoreColor = result?.score_level ? SCORE_COLORS[result.score_level] : '#ff9500';

  return (
    <div className="min-h-screen pb-24" style={{ background: '#0a0a0a' }}>
      <div className="px-4 pt-5 pb-3">
        <h1 className="text-xl font-black text-white mb-0.5">🔍 Modo Investigação Suprema</h1>
        <p className="text-[10px] text-purple-500 font-bold uppercase tracking-widest mb-4">
          Score Comercial • Perfil Decisor • Abordagem SPIN
        </p>

        {/* Busca */}
        <div className="relative mb-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-500" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleManualInvestigate()}
            placeholder="Nome do cliente, clínica ou cidade..."
            className="w-full pl-9 pr-4 h-11 rounded-xl text-sm font-bold focus:outline-none"
            style={{
              background: '#1a1a1a',
              border: '1px solid rgba(168,85,247,0.4)',
              color: '#e2e8f0',
            }}
          />
        </div>

        {/* Sugestões de clientes */}
        {filteredClients.length > 0 && !loading && !result && (
          <div className="rounded-xl overflow-hidden mb-3" style={{ border: '1px solid rgba(168,85,247,0.2)', background: '#111' }}>
            {filteredClients.map(c => (
              <button
                key={c.id}
                onClick={() => handleInvestigate(c)}
                className="w-full flex items-center justify-between px-3 py-2.5 hover:opacity-80 transition-opacity border-b last:border-0"
                style={{ borderColor: 'rgba(168,85,247,0.1)' }}
              >
                <div className="text-left">
                  <p className="text-sm font-bold text-white">{c.first_name}</p>
                  <p className="text-[10px] text-slate-500">{c.clinic_name} {c.city && `• ${c.city}`}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                    style={{ background: 'rgba(168,85,247,0.15)', color: '#a855f7' }}>
                    Score {c.purchase_score || 0}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-purple-600" />
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Botão busca manual */}
        {query.length > 0 && filteredClients.length === 0 && !loading && !result && (
          <button
            onClick={handleManualInvestigate}
            className="w-full py-2.5 rounded-xl text-sm font-black mb-3"
            style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.4)', color: '#a855f7' }}
          >
            🔍 Investigar "{query}" com IA
          </button>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="px-4">
          <div className="rounded-2xl p-6 flex flex-col items-center gap-3"
            style={{ background: '#111', border: '1px solid rgba(168,85,247,0.3)' }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.4)' }}>
              <Brain className="w-6 h-6 text-purple-400 animate-pulse" />
            </div>
            <p className="text-sm font-black text-purple-400">Investigando...</p>
            <p className="text-xs text-slate-500 text-center">Analisando CRM, dados públicos e documentos de suporte do Dropbox</p>
            <div className="flex gap-1">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-2 h-2 rounded-full bg-purple-500 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Resultado */}
      {result && !loading && (
        <div className="px-4 space-y-3">
          {/* Motor 4x4 */}
          {selectedClient && <Score4x4Display score={score4x4} isLoading={loadingScore} />}
          {selectedClient && <SalesPersonalityCard client={selectedClient} />}
          <DropboxEvidenceCard evidence={result.dropbox_support} />

          {/* Header do resultado */}
          <div className="rounded-2xl p-4" style={{ background: '#111', border: `1px solid ${scoreColor}44` }}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Perfil Analisado</p>
                <p className="text-base font-black text-white">
                  {selectedClient ? (selectedClient.clinic_name || selectedClient.first_name) : query}
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black" style={{ color: scoreColor }}>
                  {result.commercial_score || 0}
                </p>
                <p className="text-[10px] font-bold uppercase" style={{ color: scoreColor }}>
                  {result.score_level || 'médio'}
                </p>
              </div>
            </div>

            {/* Score bar */}
            <div className="w-full h-2 rounded-full mb-2" style={{ background: '#1a1a1a' }}>
              <div className="h-2 rounded-full transition-all"
                style={{ width: `${result.commercial_score || 0}%`, background: scoreColor }} />
            </div>

            <p className="text-xs text-slate-400">{result.score_justification}</p>

            <div className="flex gap-2 mt-3">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
                style={{ background: 'rgba(168,85,247,0.15)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.3)' }}>
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copiado!' : 'Copiar Análise'}
              </button>
              {selectedClient && (
                <a href={`/ClientProfile?id=${selectedClient.id}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold no-underline"
                  style={{ background: 'rgba(255,107,0,0.15)', color: '#ff9500', border: '1px solid rgba(255,107,0,0.3)' }}
                  onClick={(e) => { e.preventDefault(); window.location.href = `/ClientProfile?id=${selectedClient.id}`; }}>
                  <Users className="w-3 h-3" />
                  Ver Perfil
                </a>
              )}
            </div>
          </div>

          {/* Battlecard de Ataque — cruza equipamento concorrente com a Matriz V10 */}
          {selectedClient && (
            <BattlecardAtaque
              currentEquipment={selectedClient.current_equipment}
              cnpj={selectedClient.cnpj}
              clinicName={selectedClient.clinic_name}
            />
          )}

          {/* Perfil do Decisor */}
          <CollapsibleInsightSection title="Perfil do Decisor" icon="👤" tone="blue">
            <p className="mb-2 text-xs text-slate-300">{result.decision_maker_profile}</p>
            {result.decision_style && (
              <p className="text-[11px] text-blue-300">Estilo: <strong>{result.decision_style}</strong></p>
            )}
            {result.main_motivations?.length > 0 && (
              <div className="mt-2">
                <p className="mb-1 text-[10px] text-slate-500">Motivações principais:</p>
                <div className="flex flex-wrap gap-1">
                  {result.main_motivations.map((motivation, index) => (
                    <span key={index} className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] text-blue-400">{motivation}</span>
                  ))}
                </div>
              </div>
            )}
          </CollapsibleInsightSection>

          {/* Potencial de Compra */}
          <CollapsibleInsightSection title="Potencial de Compra" icon="💰" tone="orange">
            <p className="mb-2 text-xs text-slate-300">{result.equipment_purchase_potential}</p>
            {result.recommended_product && (
              <div className="inline-flex items-center gap-1.5 rounded-xl border border-orange-500/30 bg-orange-500/15 px-3 py-1.5">
                <Star className="h-3.5 w-3.5 text-orange-400" />
                <span className="text-xs font-black text-orange-400">Produto Ideal: {result.recommended_product}</span>
              </div>
            )}
          </CollapsibleInsightSection>

          {/* Potencial de Comodato */}
          {result.comodato_potential && (
            <div className="rounded-2xl p-4" style={{ background: '#111', border: '1px solid rgba(0,255,136,0.2)' }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-black text-green-400 uppercase tracking-widest">🤝 Comodato Estratégico</p>
                {result.comodato_score && (
                  <span className="text-sm font-black text-green-400">{result.comodato_score}%</span>
                )}
              </div>
              <p className="text-xs text-slate-300">{result.comodato_potential}</p>
            </div>
          )}

          {/* Abordagem SPIN */}
          {result.recommended_approach && (
            <div className="rounded-2xl p-4" style={{ background: '#111', border: '1px solid rgba(168,85,247,0.2)' }}>
              <p className="text-xs font-black text-purple-400 uppercase tracking-widest mb-2">🎯 Abordagem Recomendada</p>
              <p className="text-xs text-slate-300 mb-3">{result.recommended_approach}</p>
              {result.spin_questions?.length > 0 && (
                <div>
                  <p className="text-[10px] text-slate-500 mb-1.5">Perguntas SPIN para usar:</p>
                  <div className="space-y-1.5">
                    {result.spin_questions.map((q, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-[10px] text-purple-500 font-black shrink-0">{i + 1}.</span>
                        <p className="text-xs text-slate-400">{q}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Objeções previstas */}
          {result.predicted_objections?.length > 0 && (
            <div className="rounded-2xl p-4" style={{ background: '#111', border: '1px solid rgba(255,68,68,0.2)' }}>
              <p className="text-xs font-black text-red-400 uppercase tracking-widest mb-2">⚠️ Objeções Previstas</p>
              <div className="space-y-1">
                {result.predicted_objections.map((o, i) => (
                  <p key={i} className="text-xs text-slate-400 flex items-start gap-2">
                    <span className="text-red-600 shrink-0">•</span>{o}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Próxima ação */}
          {result.next_action && (
            <div className="rounded-2xl p-4" style={{ background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.3)' }}>
              <p className="text-xs font-black text-green-400 uppercase tracking-widest mb-1">✅ Próxima Ação</p>
              <p className="text-sm font-bold text-white">{result.next_action}</p>
              {result.best_contact_time && (
                <p className="text-xs text-slate-500 mt-1">⏰ Melhor horário: {result.best_contact_time}</p>
              )}
            </div>
          )}

          {/* Botão nova investigação */}
          <button
            onClick={() => { setResult(null); setSelectedClient(null); setQuery(''); }}
            className="w-full py-3 rounded-2xl text-sm font-black"
            style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)', color: '#a855f7' }}>
            🔍 Nova Investigação
          </button>
        </div>
      )}

      {/* Estado inicial */}
      {!result && !loading && !query && (
        <div className="px-4">
          <div className="rounded-2xl p-6 text-center" style={{ background: '#111', border: '1px solid rgba(168,85,247,0.15)' }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.3)' }}>
              <Brain className="w-8 h-8 text-purple-400" />
            </div>
            <p className="text-sm font-black text-purple-400 mb-2">Investigação com IA</p>
            <p className="text-xs text-slate-500 mb-4">
              Busque um cliente ou clínica e gere automaticamente o score comercial, perfil do decisor, potencial de compra e abordagem SPIN.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {['Score Comercial', 'Perfil Decisor', 'Pot. Comodato', 'SPIN Questions'].map(item => (
                <div key={item} className="rounded-xl py-2 px-3 flex items-center gap-2"
                  style={{ background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.15)' }}>
                  <Zap className="w-3 h-3 text-purple-500 shrink-0" />
                  <span className="text-[11px] text-purple-300 font-bold">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
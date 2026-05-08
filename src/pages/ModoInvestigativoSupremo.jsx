import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Target, Zap, AlertTriangle, CheckCircle, HelpCircle, XCircle, Copy, MessageSquare, Mail, Instagram } from 'lucide-react';

const STATUS_CONFIG = {
  CONFIRMADO: { color: '#00ff88', icon: CheckCircle, bg: 'rgba(0,255,136,0.1)', border: 'rgba(0,255,136,0.3)' },
  PROVÁVEL: { color: '#ffb347', icon: HelpCircle, bg: 'rgba(255,179,71,0.1)', border: 'rgba(255,179,71,0.3)' },
  SUSPEITA: { color: '#ff9500', icon: AlertTriangle, bg: 'rgba(255,149,0,0.1)', border: 'rgba(255,149,0,0.3)' },
  'NÃO ENCONTRADO': { color: '#888', icon: XCircle, bg: 'rgba(136,136,136,0.1)', border: 'rgba(136,136,136,0.3)' },
};

const EQUIPMENT_MAP = {
  hematologia: 'VBC-50A',
  bioquimica: 'SMT-120VP / QT3',
  hemogasometria: 'VG1 / VG2',
  imunofluorescencia: 'Vi1 / VG2',
  pcr: 'VQ1',
  multiplo: '3DX (3 em 1)',
};

function ScoreBar({ value, max = 100, color = '#ff6b00', label }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs mb-1" style={{ color: '#ccc' }}>
        <span>{label}</span>
        <span style={{ color, fontWeight: 'bold' }}>{value}{max === 10 ? '/10' : '/100'}</span>
      </div>
      <div className="w-full h-2 rounded-full" style={{ background: '#1a1a1a' }}>
        <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}88, ${color})` }} />
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG['NÃO ENCONTRADO'];
  const Icon = cfg.icon;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}>
      <Icon className="w-3 h-3" />
      {status}
    </span>
  );
}

export default function ModoInvestigativoSupremo() {
  const [input, setInput] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [copied, setCopied] = useState('');
  const [leadTemp, setLeadTemp] = useState('quente');

  const handleInvestigate = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setReport(null);

    const depth = leadTemp === 'frio' ? 'rápida' : leadTemp === 'morno' ? 'intermediária' : 'completa';

    const prompt = `Você é o MODO INVESTIGATIVO SUPREMO NR228888 da Seamaty Brasil.

ALVO: "${input}"${city ? ` — Cidade: ${city}` : ''}
PROFUNDIDADE DE ANÁLISE: ${depth} (lead ${leadTemp})
DATA ATUAL: ${new Date().toLocaleDateString('pt-BR')}

REGRAS OBRIGATÓRIAS:
1. Investigue clínicas veterinárias, hospitais, laboratórios e universidades para venda de equipamentos Seamaty.
2. NUNCA afirme que a clínica possui equipamento, volume ou marca concorrente sem evidência. Use "hipótese investigativa" quando necessário.
3. Classifique CADA informação como: CONFIRMADO / PROVÁVEL / SUSPEITA / NÃO ENCONTRADO.
4. Calcule SCORE DE OPORTUNIDADE (0-100) considerando: potencial de compra, recorrência em insumos, volume provável de exames, urgência clínica, estrutura, presença digital, temperatura comercial, comodato (40-60 exames bioquímica/mês).
5. Calcule SCORE DE VISITA (0-10).
6. Modo econômico: lead frio = análise rápida, morno = intermediária, quente = investigação completa.

RESPONDA EXATAMENTE neste JSON (sem markdown, sem texto fora do JSON):
{
  "nome_clinica": "",
  "cidade": "",
  "tipo_negocio": "",
  "status_informacao": "CONFIRMADO|PROVÁVEL|SUSPEITA|NÃO ENCONTRADO",
  "confirmados": ["item1","item2"],
  "hipoteses_comerciais": ["hipotese1","hipotese2"],
  "equipamento_indicado": "",
  "razao_equipamento": "",
  "equipamento_alternativo": "",
  "potencial_compra": "",
  "potencial_comodato": "",
  "score_oportunidade": 0,
  "score_visita": 0,
  "nivel_confianca": "",
  "melhor_abordagem": "",
  "perguntas_spin": {
    "situacao": ["",""],
    "problema": ["",""],
    "implicacao": ["",""],
    "necessidade": ["",""]
  },
  "objecoes_provaveis": ["",""],
  "frase_abertura": "",
  "estrategia_fechamento": "",
  "proximo_passo": "",
  "texto_whatsapp": "",
  "texto_instagram": "",
  "texto_email": {
    "assunto": "",
    "corpo": ""
  },
  "calendario_sniper": {
    "melhor_dia": "",
    "melhor_horario": "",
    "tipo_contato": ""
  }
}`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: leadTemp !== 'frio',
      response_json_schema: {
        type: 'object',
        properties: {
          nome_clinica: { type: 'string' },
          cidade: { type: 'string' },
          tipo_negocio: { type: 'string' },
          status_informacao: { type: 'string' },
          confirmados: { type: 'array', items: { type: 'string' } },
          hipoteses_comerciais: { type: 'array', items: { type: 'string' } },
          equipamento_indicado: { type: 'string' },
          razao_equipamento: { type: 'string' },
          equipamento_alternativo: { type: 'string' },
          potencial_compra: { type: 'string' },
          potencial_comodato: { type: 'string' },
          score_oportunidade: { type: 'number' },
          score_visita: { type: 'number' },
          nivel_confianca: { type: 'string' },
          melhor_abordagem: { type: 'string' },
          perguntas_spin: { type: 'object' },
          objecoes_provaveis: { type: 'array', items: { type: 'string' } },
          frase_abertura: { type: 'string' },
          estrategia_fechamento: { type: 'string' },
          proximo_passo: { type: 'string' },
          texto_whatsapp: { type: 'string' },
          texto_instagram: { type: 'string' },
          texto_email: { type: 'object' },
          calendario_sniper: { type: 'object' },
        }
      }
    });

    setReport(result);
    setLoading(false);
  };

  const copyText = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  };

  const formatFullReport = (r) => {
    if (!r) return '';
    return `RELATÓRIO INVESTIGATIVO NR228888
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Nome da clínica: ${r.nome_clinica}
2. Cidade: ${r.cidade}
3. Tipo de negócio: ${r.tipo_negocio}
4. Status da informação: ${r.status_informacao}
5. O que foi confirmado: ${(r.confirmados || []).join(' | ')}
6. Hipóteses comerciais: ${(r.hipoteses_comerciais || []).join(' | ')}
7. Equipamento Seamaty mais indicado: ${r.equipamento_indicado}
8. Potencial de compra: ${r.potencial_compra}
9. Potencial de comodato: ${r.potencial_comodato}
10. Score de oportunidade: ${r.score_oportunidade}/100
11. Score de visita: ${r.score_visita}/10
12. Melhor abordagem: ${r.melhor_abordagem}
13. Perguntas SPIN: ${JSON.stringify(r.perguntas_spin, null, 2)}
14. Objeções prováveis: ${(r.objecoes_provaveis || []).join(' | ')}
15. Texto sugerido para contato: ${r.texto_whatsapp}
16. Próxima ação recomendada: ${r.proximo_passo}
17. Nível de confiança da análise: ${r.nivel_confianca}`;
  };

  return (
    <div className="min-h-screen pb-24" style={{ background: '#080808' }}>
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #ff6b00, #ff2200)' }}>
            <Target className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black text-white">MODO INVESTIGATIVO SUPREMO</h1>
            <p className="text-xs font-bold" style={{ color: '#ff6b00' }}>NR228888 — Seamaty Brasil</p>
          </div>
        </div>
        <p className="text-xs mt-1" style={{ color: '#888' }}>Análise investigativa de clínicas, hospitais e labs. Relatório 17 pontos com SPIN, Score e Briefing.</p>
      </div>

      {/* Input */}
      <div className="px-4 mb-3">
        <div className="rounded-2xl p-4" style={{ background: '#111', border: '1px solid rgba(255,107,0,0.25)' }}>
          <div className="flex gap-2 mb-3">
            <Input
              placeholder="Nome da clínica, Dr. Frank, Pet Care Bauru..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleInvestigate()}
              className="flex-1 text-sm text-white border-0 h-10"
              style={{ background: '#1a1a1a', borderRadius: 10 }}
            />
            <Input
              placeholder="Cidade"
              value={city}
              onChange={e => setCity(e.target.value)}
              className="w-28 text-sm text-white border-0 h-10"
              style={{ background: '#1a1a1a', borderRadius: 10 }}
            />
          </div>

          {/* Temperatura do Lead */}
          <div className="flex gap-2 mb-3">
            <p className="text-xs text-orange-400 font-bold self-center mr-1">Temperatura:</p>
            {['frio', 'morno', 'quente'].map(t => (
              <button
                key={t}
                onClick={() => setLeadTemp(t)}
                className="px-3 py-1 rounded-full text-xs font-bold transition-all"
                style={leadTemp === t
                  ? { background: t === 'frio' ? '#3b82f6' : t === 'morno' ? '#f59e0b' : '#ef4444', color: 'white' }
                  : { background: '#1a1a1a', color: '#888', border: '1px solid #333' }
                }
              >
                {t === 'frio' ? '❄️' : t === 'morno' ? '🌡️' : '🔥'} {t}
              </button>
            ))}
            <span className="text-xs self-center ml-auto" style={{ color: '#555' }}>
              {leadTemp === 'frio' ? 'Análise rápida' : leadTemp === 'morno' ? 'Análise intermediária' : 'Investigação completa'}
            </span>
          </div>

          <Button
            onClick={handleInvestigate}
            disabled={loading || !input.trim()}
            className="w-full h-10 font-black text-sm"
            style={{ background: loading ? '#333' : 'linear-gradient(90deg, #ff6b00, #ff2200)', color: 'white', border: 'none' }}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Investigando {leadTemp === 'quente' ? '(investigação completa)' : ''}...
              </span>
            ) : (
              <span className="flex items-center gap-2"><Search className="w-4 h-4" /> INVESTIGAR AGORA</span>
            )}
          </Button>
        </div>
      </div>

      {/* Report */}
      {report && (
        <div className="px-4 space-y-3">
          {/* Header do relatório */}
          <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(135deg, #1a0800, #0a0000)', border: '1px solid rgba(255,107,0,0.4)' }}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-lg font-black text-white">{report.nome_clinica}</p>
                <p className="text-sm font-bold" style={{ color: '#ff6b00' }}>{report.cidade} · {report.tipo_negocio}</p>
              </div>
              <StatusBadge status={report.status_informacao} />
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <ScoreBar value={report.score_oportunidade} max={100} color="#ff6b00" label="Score Oportunidade" />
              <ScoreBar value={report.score_visita} max={10} color="#00ff88" label="Score Visita" />
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs" style={{ color: '#888' }}>Confiança: <strong style={{ color: '#ffb347' }}>{report.nivel_confianca}</strong></span>
              <Button size="sm" variant="outline" onClick={() => copyText(formatFullReport(report), 'full')} className="text-xs h-7 gap-1" style={{ borderColor: 'rgba(255,107,0,0.3)', color: '#ff9500' }}>
                <Copy className="w-3 h-3" /> {copied === 'full' ? '✅ Copiado!' : 'Copiar Relatório'}
              </Button>
            </div>
          </div>

          {/* Confirmados e Hipóteses */}
          <div className="grid grid-cols-1 gap-3">
            {report.confirmados?.length > 0 && (
              <div className="rounded-xl p-3" style={{ background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.2)' }}>
                <p className="text-xs font-black mb-2" style={{ color: '#00ff88' }}>✅ CONFIRMADO</p>
                <ul className="space-y-1">
                  {report.confirmados.map((c, i) => <li key={i} className="text-xs text-white">• {c}</li>)}
                </ul>
              </div>
            )}
            {report.hipoteses_comerciais?.length > 0 && (
              <div className="rounded-xl p-3" style={{ background: 'rgba(255,149,0,0.05)', border: '1px solid rgba(255,149,0,0.2)' }}>
                <p className="text-xs font-black mb-2" style={{ color: '#ff9500' }}>💡 HIPÓTESES COMERCIAIS</p>
                <ul className="space-y-1">
                  {report.hipoteses_comerciais.map((h, i) => <li key={i} className="text-xs text-white">• {h}</li>)}
                </ul>
              </div>
            )}
          </div>

          {/* Equipamento + Potencial */}
          <div className="rounded-xl p-4" style={{ background: '#111', border: '1px solid rgba(255,107,0,0.2)' }}>
            <p className="text-xs font-black text-orange-400 mb-2">🔬 EQUIPAMENTO & POTENCIAL</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500">Indicado</p>
                <p className="text-sm font-black text-white">{report.equipamento_indicado}</p>
                {report.equipamento_alternativo && <p className="text-xs text-orange-600">Alt: {report.equipamento_alternativo}</p>}
                <p className="text-xs text-gray-400 mt-1">{report.razao_equipamento}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Potencial Compra</p>
                <p className="text-xs text-white mb-1">{report.potencial_compra}</p>
                <p className="text-xs text-gray-500">Comodato</p>
                <p className="text-xs text-white">{report.potencial_comodato}</p>
              </div>
            </div>
          </div>

          {/* SPIN Selling */}
          {report.perguntas_spin && (
            <div className="rounded-xl p-4" style={{ background: '#111', border: '1px solid rgba(255,107,0,0.2)' }}>
              <p className="text-xs font-black text-orange-400 mb-3">🎯 PERGUNTAS SPIN</p>
              {['situacao', 'problema', 'implicacao', 'necessidade'].map(tipo => (
                report.perguntas_spin[tipo]?.length > 0 && (
                  <div key={tipo} className="mb-2">
                    <p className="text-xs font-bold uppercase mb-1" style={{ color: '#ff9500' }}>{tipo === 'situacao' ? 'S — Situação' : tipo === 'problema' ? 'P — Problema' : tipo === 'implicacao' ? 'I — Implicação' : 'N — Necessidade'}</p>
                    {report.perguntas_spin[tipo].map((q, i) => <p key={i} className="text-xs text-gray-300 mb-0.5">• {q}</p>)}
                  </div>
                )
              ))}
            </div>
          )}

          {/* Objeções + Abordagem */}
          <div className="rounded-xl p-4" style={{ background: '#111', border: '1px solid rgba(255,107,0,0.2)' }}>
            <p className="text-xs font-black text-orange-400 mb-2">⚠️ OBJEÇÕES + ESTRATÉGIA</p>
            {report.objecoes_provaveis?.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-gray-500 mb-1">Objeções prováveis:</p>
                {report.objecoes_provaveis.map((o, i) => <p key={i} className="text-xs text-red-300 mb-0.5">• {o}</p>)}
              </div>
            )}
            <div className="mb-2">
              <p className="text-xs text-gray-500">Frase de abertura:</p>
              <p className="text-xs text-white italic">"{report.frase_abertura}"</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Estratégia de fechamento:</p>
              <p className="text-xs text-white">{report.estrategia_fechamento}</p>
            </div>
          </div>

          {/* Textos de contato */}
          <div className="rounded-xl p-4" style={{ background: '#111', border: '1px solid rgba(255,107,0,0.2)' }}>
            <p className="text-xs font-black text-orange-400 mb-3">📤 TEXTOS PARA CONTATO — AGUARDA APROVAÇÃO DO NATHAN</p>
            {[
              { key: 'whatsapp', label: '💬 WhatsApp', text: report.texto_whatsapp, icon: MessageSquare },
              { key: 'instagram', label: '📸 Instagram DM', text: report.texto_instagram, icon: Instagram },
            ].map(({ key, label, text, icon: Icon }) => text && (
              <div key={key} className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-bold text-gray-400">{label}</p>
                  <Button size="sm" variant="ghost" onClick={() => copyText(text, key)} className="text-xs h-6 px-2" style={{ color: '#ff9500' }}>
                    <Copy className="w-3 h-3 mr-1" /> {copied === key ? '✅' : 'Copiar'}
                  </Button>
                </div>
                <div className="rounded-lg p-2 text-xs text-gray-300" style={{ background: '#0a0a0a', border: '1px solid #222' }}>{text}</div>
              </div>
            ))}
            {report.texto_email?.corpo && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-bold text-gray-400">📧 E-mail: {report.texto_email.assunto}</p>
                  <Button size="sm" variant="ghost" onClick={() => copyText(report.texto_email.corpo, 'email')} className="text-xs h-6 px-2" style={{ color: '#ff9500' }}>
                    <Copy className="w-3 h-3 mr-1" /> {copied === 'email' ? '✅' : 'Copiar'}
                  </Button>
                </div>
                <div className="rounded-lg p-2 text-xs text-gray-300" style={{ background: '#0a0a0a', border: '1px solid #222' }}>{report.texto_email.corpo}</div>
              </div>
            )}
          </div>

          {/* Calendário Sniper + Próximo Passo */}
          <div className="rounded-xl p-4" style={{ background: 'linear-gradient(135deg, #1a0800, #0a0500)', border: '1px solid rgba(255,107,0,0.35)' }}>
            <p className="text-xs font-black text-orange-400 mb-2">🎯 SNIPER — PRÓXIMA AÇÃO</p>
            {report.calendario_sniper && (
              <div className="grid grid-cols-3 gap-2 mb-2">
                <div className="text-center rounded-lg p-2" style={{ background: 'rgba(255,107,0,0.1)' }}>
                  <p className="text-xs text-gray-500">Dia</p>
                  <p className="text-xs font-bold text-orange-400">{report.calendario_sniper.melhor_dia}</p>
                </div>
                <div className="text-center rounded-lg p-2" style={{ background: 'rgba(255,107,0,0.1)' }}>
                  <p className="text-xs text-gray-500">Horário</p>
                  <p className="text-xs font-bold text-orange-400">{report.calendario_sniper.melhor_horario}</p>
                </div>
                <div className="text-center rounded-lg p-2" style={{ background: 'rgba(255,107,0,0.1)' }}>
                  <p className="text-xs text-gray-500">Tipo</p>
                  <p className="text-xs font-bold text-orange-400">{report.calendario_sniper.tipo_contato}</p>
                </div>
              </div>
            )}
            <p className="text-sm font-bold text-white">→ {report.proximo_passo}</p>
            <p className="text-xs mt-1" style={{ color: '#888' }}>🔒 Seg-Qui: visitas e contatos | Sex: organização, follow-up e limpeza do CRM</p>
          </div>

          {/* Botão copiar relatório completo novamente */}
          <Button
            className="w-full h-10 font-black text-sm mb-2"
            style={{ background: 'linear-gradient(90deg, #1a1a1a, #2a1500)', color: '#ff9500', border: '1px solid rgba(255,107,0,0.3)' }}
            onClick={() => copyText(formatFullReport(report), 'full')}
          >
            <Copy className="w-4 h-4 mr-2" />
            {copied === 'full' ? '✅ RELATÓRIO COPIADO!' : '📋 COPIAR RELATÓRIO COMPLETO NR228888'}
          </Button>
        </div>
      )}

      {/* Empty state */}
      {!report && !loading && (
        <div className="px-4 mt-6 text-center">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ background: 'rgba(255,107,0,0.1)', border: '1px solid rgba(255,107,0,0.2)' }}>
            <Target className="w-8 h-8" style={{ color: '#ff6b00' }} />
          </div>
          <p className="font-black text-white mb-1">Modo Investigativo Supremo</p>
          <p className="text-xs mb-4" style={{ color: '#666' }}>Digite o nome de uma clínica, médico ou empresa para gerar o relatório completo de 17 pontos com Score, SPIN, objeções e textos prontos.</p>
          <div className="grid grid-cols-3 gap-2">
            {['Dr. Frank Bauru', 'Pet Care Marília', 'UNESP Araçatuba'].map(ex => (
              <button key={ex} onClick={() => { setInput(ex.split(' ').slice(0, -1).join(' ') || ex); setCity(ex.split(' ').slice(-1)[0]); }}
                className="rounded-xl p-2 text-xs text-orange-400 font-bold" style={{ background: '#111', border: '1px solid rgba(255,107,0,0.15)' }}>
                {ex}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
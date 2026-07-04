import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Package, Users, TrendingUp, Heart, Calendar, MapPin,
  BookOpen, Eye, DollarSign, GraduationCap, Sparkles,
  RefreshCw, Copy, CheckCheck, Film, Camera, Image, Zap, ChevronDown, ChevronUp
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const NATHAN_SYSTEM_PROMPT = `Você é Nathan Rosa, consultor comercial veterinário sênior da SEAMATY Brasil com 8 anos de experiência.

Seu estilo de comunicação é ÚNICO:
- Fala como humano, não como robô corporativo
- Usa storytelling real: começa com uma situação vivida, não com produto
- Conecta tecnologia com RESULTADO financeiro da clínica
- Menciona prevenção, diagnóstico rápido, redução de perdas, aumento de ticket
- Tem autoridade técnica: cita parâmetros, tempo de exame, volume de amostra
- É direto e comercialmente agressivo, mas com empatia de quem entende o dia a dia do veterinário
- NUNCA inventa números. Se não tem dados concretos, usa linguagem relativa ("pode reduzir", "tende a aumentar")
- NUNCA expõe nome de cliente sem permissão. Usa "uma clínica em [cidade]" ou "um veterinário do interior de SP"
- Fala para dois públicos: o veterinário (técnico/decisor) e o tutor (emocional/resultado do pet)

Princípios do Modo Nathan:
1. Problema antes do produto
2. Resultado financeiro tangível
3. Diagnóstico = autonomia do veterinário
4. Prevenção = fidelização do tutor
5. Velocidade = mais atendimentos = mais faturamento
6. Autoridade técnica como diferencial competitivo`;

const CONTENT_SOURCES = [
  {
    id: 'instalacoes',
    label: 'Instalações Realizadas',
    icon: Package,
    color: 'bg-green-500',
    badge: 'bg-green-100 text-green-700',
    description: 'Vendas fechadas e equipamentos instalados',
  },
  {
    id: 'baixo_insumo',
    label: 'Baixo Uso de Insumos',
    icon: TrendingUp,
    color: 'bg-orange-500',
    badge: 'bg-orange-100 text-orange-700',
    description: 'Clientes usando abaixo do potencial',
  },
  {
    id: 'upsell',
    label: 'Oportunidades de Upsell',
    icon: DollarSign,
    color: 'bg-blue-500',
    badge: 'bg-blue-100 text-blue-700',
    description: 'Clientes prontos para expandir',
  },
  {
    id: 'preventivo',
    label: 'Check-up Preventivo',
    icon: Heart,
    color: 'bg-pink-500',
    badge: 'bg-pink-100 text-pink-700',
    description: 'Campanhas de saúde preventiva',
  },
  {
    id: 'datas',
    label: 'Datas Comemorativas',
    icon: Calendar,
    color: 'bg-yellow-500',
    badge: 'bg-yellow-100 text-yellow-700',
    description: 'Datas veterinárias e do calendário',
  },
  {
    id: 'cidades',
    label: 'Cidades Visitadas',
    icon: MapPin,
    color: 'bg-teal-500',
    badge: 'bg-teal-100 text-teal-700',
    description: 'Conteúdo regional e presença local',
  },
  {
    id: 'casos',
    label: 'Casos Reais',
    icon: BookOpen,
    color: 'bg-indigo-500',
    badge: 'bg-indigo-100 text-indigo-700',
    description: 'Histórias da biblioteca de casos',
  },
  {
    id: 'equipamentos',
    label: 'Equipamentos com Baixa Divulgação',
    icon: Eye,
    color: 'bg-violet-500',
    badge: 'bg-violet-100 text-violet-700',
    description: 'Produtos pouco explorados nas redes',
  },
  {
    id: 'ticket',
    label: 'Aumento de Ticket Médio',
    icon: Users,
    color: 'bg-rose-500',
    badge: 'bg-rose-100 text-rose-700',
    description: 'Clientes com potencial de expansão',
  },
  {
    id: 'educativo',
    label: 'Educativo para Tutores',
    icon: GraduationCap,
    color: 'bg-cyan-500',
    badge: 'bg-cyan-100 text-cyan-700',
    description: 'Conteúdo educacional para donos de pet',
  },
];

const VET_DATES = [
  { date: '20/01', label: 'Dia do Médico Veterinário', emoji: '🩺' },
  { date: '04/02', label: 'Dia Mundial do Câncer (pet)', emoji: '🎗️' },
  { date: '20/02', label: 'Dia do Gato', emoji: '🐱' },
  { date: '01/03', label: 'Mês da Saúde do Rim', emoji: '🫁' },
  { date: '23/04', label: 'Dia do Planeta Terra — Saúde Pet', emoji: '🌍' },
  { date: 'Ago', label: 'Mês da Vacinação', emoji: '💉' },
  { date: 'Out', label: 'Outubro Rosa Pet', emoji: '🎀' },
  { date: 'Nov', label: 'Novembro Azul Pet', emoji: '💙' },
];

function buildPrompt(sourceId, contextData, cases, postFormat, isCampaign) {
  const caseContext = cases.length > 0
    ? `\n\nCASOS REAIS DISPONÍVEIS COMO INSPIRAÇÃO (use como referência, nunca invente dados, nunca exponha nomes):\n${cases.slice(0, 3).map(c => `- Problema: ${c.problem || c.title} | Equipamento: ${c.equipment_used || ''} | Resultado: ${c.result || ''} | Cidade/Região: ${c.city || ''} | Objeção Vencida: ${c.objection_won || ''}`).join('\n')}`
    : '';

  const formatLabel = postFormat === 'reels' ? 'Reels (30-60s, dinâmico, com narração)' : postFormat === 'stories' ? 'Stories (direto, CTA claro, visual simples)' : 'Post Feed (carrossel ou foto, legenda completa)';

  const sourceMap = {
    instalacoes: `Contexto: Instalação recém-realizada de ${contextData.equipment_name || 'equipamento Seamaty'} em clínica veterinária${contextData.city ? ' em ' + contextData.city : ''}.`,
    baixo_insumo: `Contexto: Post sobre como clínicas que subutilizam insumos perdem receita e diagnósticos. Abordar a importância de usar a capacidade total do equipamento.`,
    upsell: `Contexto: Post sobre expansão de capacidade laboratorial da clínica. Clínica já tem equipamento básico e pode escalar para análises mais completas.`,
    preventivo: `Contexto: Campanha de check-up preventivo veterinário. Foco em tutores e como o diagnóstico precoce salva vidas e reduz custos.`,
    datas: `Contexto: Data comemorativa veterinária — ${contextData.date || 'data especial'}. Post temático que conecta a data com a importância do diagnóstico laboratorial.`,
    cidades: `Contexto: Presença em ${contextData.city || 'cidade visitada'}. Post regional mostrando atendimento e suporte local às clínicas da região.`,
    casos: `Contexto: Baseado em caso real (sem expor nome do cliente): ${contextData.case_summary || 'clínica que transformou diagnóstico com equipamento Seamaty'}.`,
    equipamentos: `Contexto: Equipamento ${contextData.equipment_name || 'Seamaty'} com baixa presença nas redes sociais. Educar o mercado sobre suas capacidades.`,
    ticket: `Contexto: Como clínicas veterinárias podem aumentar ticket médio com diagnóstico laboratorial in-house. Foco financeiro e estratégico.`,
    educativo: `Contexto: Post educativo para tutores de pets sobre a importância de exames regulares, diagnóstico precoce e como escolher uma clínica com estrutura laboratorial completa.`,
  };

  if (isCampaign) {
    return `${NATHAN_SYSTEM_PROMPT}

${sourceMap[sourceId] || sourceMap.instalacoes}
${caseContext}

TAREFA: Gere uma CAMPANHA COMPLETA no estilo Nathan Rosa para Instagram/WhatsApp.

Retorne um JSON com EXATAMENTE esta estrutura:
{
  "post_feed": {
    "hook": "primeira linha impactante do carrossel",
    "caption": "legenda completa para feed (com storytelling, quebras de linha, emojis estratégicos)",
    "cta": "call to action específico e comercial"
  },
  "stories": [
    { "slide": 1, "text": "texto do slide 1 — hook ou pergunta", "tip": "dica de design" },
    { "slide": 2, "text": "texto do slide 2 — desenvolvimento", "tip": "dica de design" },
    { "slide": 3, "text": "texto do slide 3 — CTA direto", "tip": "dica de design" }
  ],
  "reels": {
    "hook": "frase de abertura de 0-3 segundos",
    "script": "roteiro de 5 cenas com narração e ação visual",
    "caption": "legenda do reels"
  },
  "whatsapp": "mensagem personalizada para enviar para cliente veterinário (máx 3 parágrafos, tom consultivo)",
  "legenda_curta": "legenda compacta de até 2 linhas para story ou reels",
  "cta_comercial": "CTA de alta conversão para agendar visita ou solicitar proposta",
  "ideia_arte": "descrição detalhada de como deve ser a arte visual (cores, elementos, fotografia, texto sobreposto)",
  "hashtags": "25 hashtags estratégicas para veterinária e diagnóstico"
}`;
  }

  return `${NATHAN_SYSTEM_PROMPT}

${sourceMap[sourceId] || sourceMap.instalacoes}
${caseContext}

FORMATO: ${formatLabel}

Gere conteúdo para ${formatLabel} no estilo Nathan Rosa. Retorne JSON:
{
  "hook": "abertura impactante (1 frase, máx 10 palavras)",
  "caption": "legenda completa com storytelling, emojis e quebras estratégicas de linha",
  "cta": "call to action comercial específico",
  "hashtags": "25 hashtags veterinárias e de diagnóstico",
  "script": "roteiro de 5 cenas para reels (apenas se formato = reels)",
  "angle": "ângulo editorial usado (ex: autoridade técnica / resultado financeiro / prevenção)"
}`;
}

function GeneratedBlock({ content, isCampaign, onCopy }) {
  const [copied, setCopied] = useState(null);
  const [expanded, setExpanded] = useState({});

  const copy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
    onCopy?.();
  };

  const toggle = (key) => setExpanded(p => ({ ...p, [key]: !p[key] }));

  if (!content) return null;

  if (!isCampaign) {
    return (
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-3 mt-3 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-purple-500" />
            <span className="text-xs font-bold text-purple-700 uppercase tracking-wide">Modo Nathan — Gerado</span>
          </div>
          {content.angle && <Badge className="text-[10px] bg-purple-100 text-purple-700 border-0">{content.angle}</Badge>}
        </div>
        {content.hook && <Section label="🪝 Hook" text={content.hook} onCopy={() => copy(content.hook, 'hook')} copied={copied === 'hook'} />}
        <Section label="✍️ Legenda" text={content.caption} onCopy={() => copy(content.caption, 'caption')} copied={copied === 'caption'} />
        {content.cta && <Section label="📣 CTA" text={content.cta} onCopy={() => copy(content.cta, 'cta')} copied={copied === 'cta'} highlight />}
        {content.script && <Section label="🎬 Script Reels" text={content.script} onCopy={() => copy(content.script, 'script')} copied={copied === 'script'} />}
        <p className="text-xs text-blue-600">{content.hashtags}</p>
      </div>
    );
  }

  // Campaign mode
  const sections = [
    { key: 'feed', label: '🖼️ Post Feed', content: `${content.post_feed?.hook}\n\n${content.post_feed?.caption}\n\n${content.post_feed?.cta}` },
    { key: 'stories', label: '📸 3 Stories', content: (content.stories || []).map(s => `[Slide ${s.slide}] ${s.text}\n💡 ${s.tip}`).join('\n\n') },
    { key: 'reels', label: '🎬 Reels', content: `Hook: ${content.reels?.hook}\n\n${content.reels?.script}\n\nLegenda: ${content.reels?.caption}` },
    { key: 'whatsapp', label: '💬 WhatsApp', content: content.whatsapp },
    { key: 'curta', label: '⚡ Legenda Curta', content: content.legenda_curta },
    { key: 'cta', label: '🎯 CTA Comercial', content: content.cta_comercial },
    { key: 'arte', label: '🎨 Ideia de Arte', content: content.ideia_arte },
  ];

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="w-4 h-4 text-purple-500" />
        <span className="text-xs font-bold text-purple-700 uppercase">Campanha Completa — Modo Nathan</span>
      </div>
      {sections.map(({ key, label, content: text }) => text && (
        <div key={key} className="bg-white border border-purple-100 rounded-xl overflow-hidden">
          <button
            onClick={() => toggle(key)}
            className="w-full flex items-center justify-between p-3 text-left"
          >
            <span className="text-sm font-bold text-slate-700">{label}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => { e.stopPropagation(); copy(text, key); }}
                className="text-xs text-purple-600 flex items-center gap-1"
              >
                {copied === key ? <CheckCheck className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              </button>
              {expanded[key] ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
            </div>
          </button>
          {expanded[key] && (
            <div className="px-3 pb-3">
              <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed bg-purple-50 rounded-lg p-2">{text}</p>
            </div>
          )}
        </div>
      ))}
      {content.hashtags && <p className="text-xs text-blue-600 px-1">{content.hashtags}</p>}
    </div>
  );
}

function Section({ label, text, onCopy, copied, highlight }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <p className="text-[10px] font-bold text-slate-500 uppercase">{label}</p>
        <button onClick={onCopy} className="text-xs text-purple-600 flex items-center gap-0.5">
          {copied ? <CheckCheck className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
        </button>
      </div>
      <p className={`text-sm whitespace-pre-line leading-relaxed ${highlight ? 'font-semibold text-purple-700' : 'text-slate-700'}`}>{text}</p>
    </div>
  );
}

function SourceCard({ source, contextItems, cases, campaignMode, onSchedule }) {
  const [selectedItem, setSelectedItem] = useState(null);
  const [postFormat, setPostFormat] = useState('feed');
  const [generatedContent, setGeneratedContent] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showItems, setShowItems] = useState(false);

  const { icon: Icon, label, color, badge, description } = source;

  const handleGenerate = async (item) => {
    const target = item || selectedItem || contextItems[0];
    setIsGenerating(true);
    setGeneratedContent(null);
    try {
      const prompt = buildPrompt(source.id, target || {}, cases, postFormat, campaignMode);
      const schema = campaignMode ? {
        type: 'object',
        properties: {
          post_feed: { type: 'object', properties: { hook: { type: 'string' }, caption: { type: 'string' }, cta: { type: 'string' } } },
          stories: { type: 'array', items: { type: 'object', properties: { slide: { type: 'number' }, text: { type: 'string' }, tip: { type: 'string' } } } },
          reels: { type: 'object', properties: { hook: { type: 'string' }, script: { type: 'string' }, caption: { type: 'string' } } },
          whatsapp: { type: 'string' },
          legenda_curta: { type: 'string' },
          cta_comercial: { type: 'string' },
          ideia_arte: { type: 'string' },
          hashtags: { type: 'string' }
        }
      } : {
        type: 'object',
        properties: {
          hook: { type: 'string' },
          caption: { type: 'string' },
          cta: { type: 'string' },
          hashtags: { type: 'string' },
          script: { type: 'string' },
          angle: { type: 'string' }
        }
      };
      const result = await base44.integrations.Core.InvokeLLM({ prompt, response_json_schema: schema });
      setGeneratedContent(result);
    } catch (e) {
      console.error(e);
    }
    setIsGenerating(false);
  };

  const formatBtns = [
    { type: 'feed', icon: Image, label: 'Feed' },
    { type: 'reels', icon: Film, label: 'Reels' },
    { type: 'stories', icon: Camera, label: 'Stories' },
  ];

  return (
    <Card className="border border-slate-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 ${color} rounded-lg flex items-center justify-center`}>
              <Icon className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">{label}</p>
              <p className="text-xs text-slate-400">{description}</p>
            </div>
          </div>
          {contextItems.length > 0 && (
            <Badge className={`${badge} border-0 text-xs`}>{contextItems.length}</Badge>
          )}
        </div>

        {/* Source = datas comemorativas especial */}
        {source.id === 'datas' && (
          <div className="flex flex-wrap gap-1 mb-3">
            {VET_DATES.map(d => (
              <button
                key={d.date}
                onClick={() => { setSelectedItem({ date: `${d.emoji} ${d.label} (${d.date})`, label: d.label }); }}
                className={`text-[10px] px-2 py-1 rounded-full border transition-all ${selectedItem?.label === d.label ? 'bg-yellow-400 text-white border-yellow-400' : 'border-slate-200 text-slate-600 hover:border-yellow-300'}`}
              >
                {d.emoji} {d.label}
              </button>
            ))}
          </div>
        )}

        {/* Items list (for sources with real data) */}
        {contextItems.length > 0 && source.id !== 'datas' && (
          <div className="mb-3">
            <button
              onClick={() => setShowItems(p => !p)}
              className="text-xs text-slate-500 flex items-center gap-1 mb-1"
            >
              {showItems ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {showItems ? 'Ocultar' : 'Ver'} itens disponíveis
            </button>
            {showItems && (
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {contextItems.slice(0, 8).map((item, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedItem(item)}
                    className={`w-full text-left text-xs px-2 py-1.5 rounded-lg transition-all ${selectedItem === item ? 'bg-purple-100 text-purple-700 font-medium' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                  >
                    {item.label || item.client_name || item.equipment_name || item.title || item.city || JSON.stringify(item).slice(0, 60)}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {!campaignMode && (
          <div className="flex gap-1.5 mb-3">
            {formatBtns.map(({ type, icon: FIcon, label: flabel }) => (
              <button
                key={type}
                onClick={() => setPostFormat(type)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${postFormat === type ? 'bg-purple-600 text-white border-purple-600' : 'border-slate-200 text-slate-600 hover:border-purple-300'}`}
              >
                <FIcon className="w-3 h-3" /> {flabel}
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={() => handleGenerate(selectedItem)}
            disabled={isGenerating}
            className={`flex-1 h-8 text-xs ${campaignMode ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90' : 'bg-purple-600 hover:bg-purple-700'}`}
          >
            {isGenerating ? (
              <><RefreshCw className="w-3 h-3 animate-spin mr-1" /> Gerando...</>
            ) : campaignMode ? (
              <><Zap className="w-3 h-3 mr-1" /> Gerar Campanha Completa</>
            ) : (
              <><Sparkles className="w-3 h-3 mr-1" /> Gerar — Modo Nathan</>
            )}
          </Button>
        </div>

        {isGenerating && (
          <div className="mt-2 text-xs text-purple-600 flex items-center gap-1.5">
            <RefreshCw className="w-3 h-3 animate-spin" />
            IA escrevendo como Nathan Rosa...
          </div>
        )}

        <GeneratedBlock content={generatedContent} isCampaign={campaignMode} />
      </CardContent>
    </Card>
  );
}

export default function ContentSources({ sales, clients, cases, onSchedule, campaignMode = false }) {
  const buildContextItems = (sourceId) => {
    switch (sourceId) {
      case 'instalacoes':
        return sales.map(s => ({ ...s, label: `${s.equipment_name} — ${s.client_name}` }));
      case 'baixo_insumo':
        return clients.filter(c => c.purchase_score && c.purchase_score < 40)
          .map(c => ({ label: `${c.first_name || c.full_name} — ${c.clinic_name || c.city}`, city: c.city, equipment_name: c.equipment_sold }));
      case 'upsell':
        return clients.filter(c => c.ai_segment && ['Champions', 'VIP', 'Potential'].includes(c.ai_segment))
          .map(c => ({ label: `${c.first_name || c.full_name} — ${c.ai_segment}`, city: c.city, equipment_name: c.equipment_sold }));
      case 'preventivo':
        return [
          { label: 'Campanha Julho — Check-up de Inverno', date: 'Julho' },
          { label: 'Campanha Outubro — Saúde do Rim', date: 'Outubro' },
          { label: 'Campanha Fevereiro — Rotina Anual', date: 'Fevereiro' },
        ];
      case 'datas':
        return VET_DATES.map(d => ({ label: `${d.emoji} ${d.label}`, date: d.label }));
      case 'cidades':
        return [...new Set(clients.map(c => c.city).filter(Boolean))]
          .map(city => ({ label: city, city }));
      case 'casos':
        return cases.map(c => ({ label: c.title || c.problem, case_summary: `${c.problem} → ${c.result}` }));
      case 'equipamentos':
        return [...new Set(sales.map(s => s.equipment_name).filter(Boolean))]
          .map(eq => ({ label: eq, equipment_name: eq }));
      case 'ticket':
        return clients.filter(c => c.average_purchase_value && c.average_purchase_value < 5000)
          .map(c => ({ label: `${c.first_name || c.full_name} — Ticket atual: R$ ${c.average_purchase_value?.toLocaleString('pt-BR')}`, city: c.city }));
      case 'educativo':
        return [
          { label: 'Por que exames de sangue salvam vidas de pets' },
          { label: 'Sinais que seu pet pode estar doendo mas você não percebe' },
          { label: 'Frequência ideal de check-up por idade do pet' },
          { label: 'Diferença entre laboratório terceirizado e in-house' },
        ];
      default:
        return [];
    }
  };

  const sources = campaignMode
    ? CONTENT_SOURCES.filter(s => ['instalacoes', 'preventivo', 'educativo', 'casos', 'datas'].includes(s.id))
    : CONTENT_SOURCES;

  return (
    <div className="space-y-3">
      {campaignMode && (
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-3 text-white mb-4">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-5 h-5 text-yellow-300" />
            <p className="font-bold text-sm">Gerar Campanha Completa</p>
          </div>
          <p className="text-xs text-purple-100">1 Feed + 3 Stories + 1 Reels + 1 WhatsApp + Legenda Curta + CTA Comercial + Ideia de Arte — tudo de uma vez</p>
        </div>
      )}
      {sources.map(source => (
        <SourceCard
          key={source.id}
          source={source}
          contextItems={buildContextItems(source.id)}
          cases={cases}
          campaignMode={campaignMode}
          onSchedule={onSchedule}
        />
      ))}
    </div>
  );
}
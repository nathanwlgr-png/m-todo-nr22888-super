import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Brain, Zap, Shield, Target, TrendingUp, Star, BookOpen,
  ChevronDown, ChevronUp, Heart, Award, BarChart3, Globe,
  MessageCircle, Users, Lightbulb, Lock, RefreshCw, CheckCircle
} from 'lucide-react';

const SECTIONS = [
  {
    id: 'objetivo',
    icon: Brain,
    color: 'from-purple-500 to-indigo-600',
    title: '🧠 Fortalecimento Mental',
    subtitle: 'Neurociência aplicada a vendas',
    content: [
      { label: 'Tomada de Decisões', desc: 'Sistema treina você a decidir com dados, não com emoção' },
      { label: 'Lidar com Perda', desc: 'Quando cliente não fecha, a IA mostra O QUE APRENDER' },
      { label: 'Recuperação Rápida', desc: 'Não perca tempo lamentando — próximo cliente aguarda' },
      { label: 'Aprendizado Contínuo', desc: 'Cada "não" é uma lição que melhora seu score geral' },
      { label: 'Controle Emocional', desc: 'Você se torna focado, disciplinado, imparável' },
      { label: 'Foco no Objetivo', desc: 'Uma coisa de cada vez — o sistema lembra e guia' },
    ],
    quote: '"O método te ensina a ser resiliente não apenas no trabalho, mas em TUDO. Perda faz parte, foco vence dispersão, dados vencem achismo."',
  },
  {
    id: 'tecnico',
    icon: Zap,
    color: 'from-yellow-500 to-orange-500',
    title: '⚡ Especificações Técnicas',
    subtitle: 'Poder computacional do sistema',
    stats: [
      { value: '15.000', label: 'cruzamentos/min' },
      { value: '47', label: 'variáveis por cliente' },
      { value: '0.3s', label: 'tempo de resposta' },
      { value: '22', label: 'IAs especializadas' },
    ],
    content: [
      { label: 'Processamento', desc: 'Até 1.104.500 combinações em 1 minuto (500 clientes × 47 variáveis)' },
      { label: 'Dados externos', desc: 'IBGE, GPS, redes sociais, eventos locais, economia regional' },
      { label: 'Tempo real', desc: 'Score atualiza instantaneamente a cada interação do cliente' },
      { label: 'Paralelo', desc: 'Infinitos clientes processados simultaneamente' },
    ],
  },
  {
    id: 'seguranca',
    icon: Shield,
    color: 'from-green-600 to-teal-600',
    title: '🔒 Segurança Militar',
    subtitle: 'AES-256 + LGPD Compliance',
    content: [
      { label: 'Criptografia', desc: 'AES-256-GCM (padrão militar) em repouso + TLS 1.3 em trânsito' },
      { label: 'Autenticação', desc: 'JWT com expiração + 2FA disponível' },
      { label: 'Backup', desc: 'Criptografado end-to-end com rotação de chaves a cada 90 dias' },
      { label: 'Compliance', desc: 'LGPD completo + WAF + Proteção DDoS + Logs auditáveis' },
      { label: 'Controle', desc: 'Acesso baseado em roles (admin/vendedor)' },
    ],
  },
  {
    id: 'ias',
    icon: Brain,
    color: 'from-pink-500 to-rose-600',
    title: '🤖 9 IAs Especializadas',
    subtitle: 'Cada IA com função única',
    list: [
      { num: '1️⃣', name: 'IA de Importação', desc: 'OCR — lê planilhas via foto' },
      { num: '2️⃣', name: 'IA de Scoring', desc: 'Calcula probabilidade de compra 0-100' },
      { num: '3️⃣', name: 'IA de Numerologia', desc: 'Perfis 1-22 (inc. mestres 11/22)' },
      { num: '4️⃣', name: 'IA de Documentos', desc: 'Rastreia views de proposta em tempo real' },
      { num: '5️⃣', name: 'IA de Tarefas', desc: 'Cria follow-ups automáticos por comportamento' },
      { num: '6️⃣', name: 'IA de Visitas', desc: 'Machine Learning — aprende com histórico' },
      { num: '7️⃣', name: 'IA de Mercado', desc: 'GPS + IBGE + Google + Redes Sociais' },
      { num: '8️⃣', name: 'IA de Geração', desc: 'Contratos e propostas em 30 segundos' },
      { num: '9️⃣', name: 'IA de Dicção', desc: 'Treina comunicação e persuasão do vendedor' },
    ],
  },
  {
    id: 'numerologia',
    icon: Star,
    color: 'from-violet-500 to-purple-600',
    title: '🔢 Numerologia Pitagórica',
    subtitle: 'Perfis de 1 a 22',
    content: [
      { label: '1 — Líder', desc: 'Direto, objetivo, valoriza eficiência. Use ROI rápido.' },
      { label: '2 — Diplomata', desc: 'Detalhista, precisa de consenso. Dados concretos.' },
      { label: '3 — Comunicador', desc: 'Entusiasta, valoriza relacionamento. Seja caloroso.' },
      { label: '4 — Organizador', desc: 'Analítico, dados técnicos. Planilhas e comparativos.' },
      { label: '5 — Aventureiro', desc: 'Inovador, adora novidades. Mostre o que é único.' },
      { label: '6 — Conselheiro', desc: 'Cauteloso, busca segurança. Garantias em destaque.' },
      { label: '7 — Analista', desc: 'Pesquisador, quer info técnica. Especificações completas.' },
      { label: '8 — Executivo', desc: 'ROI claro e rápido. Casos de sucesso e números.' },
      { label: '9 — Humanitário', desc: 'Valores e impacto social. Fale de bem-estar animal.' },
      { label: '11 — Mestre Visionário', desc: 'Intuitivo, idealista. Visão de futuro.' },
      { label: '22 — Mestre Construtor', desc: 'Grandes projetos. Fale em escala e legado.' },
    ],
  },
  {
    id: 'tecnicas',
    icon: Target,
    color: 'from-blue-500 to-cyan-600',
    title: '🎯 Técnicas de Vendas',
    subtitle: 'Múltiplas frameworks combinadas',
    list: [
      { num: '📌', name: 'SPIN Selling', desc: 'Situação → Problema → Implicação → Necessidade-Solução' },
      { num: '📌', name: 'Challenger Sale', desc: 'Ensinar → Adaptar → Controlar' },
      { num: '📌', name: 'Value Selling', desc: 'ROI e valor tangível em primeiro lugar' },
      { num: '📌', name: 'Solution Selling', desc: 'Foco em solução, nunca no produto' },
      { num: '📌', name: 'NEAT Selling', desc: 'Necessidades, Impacto Econômico, Acesso, Tempo' },
      { num: '📌', name: 'Cialdini — 6 Gatilhos', desc: 'Autoridade, Prova Social, Escassez, Reciprocidade, Compromisso, Afeição' },
      { num: '📌', name: 'Social Selling', desc: 'Relacionamento e confiança a longo prazo' },
      { num: '📌', name: 'Neurovendas', desc: 'Emoção + lógica + timing numerológico' },
    ],
  },
  {
    id: 'resultados',
    icon: TrendingUp,
    color: 'from-emerald-500 to-green-600',
    title: '📈 Resultados Esperados',
    subtitle: 'Métricas comprovadas',
    stats: [
      { value: '+40%', label: 'Produtividade' },
      { value: '+35%', label: 'Conversão' },
      { value: '+28%', label: 'Confiança percebida' },
      { value: '-60%', label: 'Tempo administrativo' },
    ],
    list: [
      { num: '✅', name: 'Aprendizado contínuo', desc: 'Taxa de sucesso ajustada por perfil — 3,2% → 12,7% em 15 visitas' },
      { num: '✅', name: 'Rastreabilidade total', desc: '100% das interações registradas e auditáveis' },
      { num: '✅', name: '+30% novos leads', desc: 'Via análise de mercado GPS + IBGE' },
      { num: '✅', name: 'Offline completo', desc: 'Funciona 100% sem internet com sync automático' },
    ],
  },
  {
    id: 'referencias',
    icon: BookOpen,
    color: 'from-amber-500 to-yellow-600',
    title: '📚 Referências Teóricas',
    subtitle: 'Bases filosóficas e científicas',
    list: [
      { num: '📖', name: 'Napoleão Hill', desc: '"Pense e Enriqueça" + "Lei do Sucesso" — base motivacional' },
      { num: '📖', name: 'Robert Cialdini', desc: '"As Armas da Persuasão" — 6 gatilhos mentais aplicados' },
      { num: '📖', name: 'Dale Carnegie', desc: '"Como Fazer Amigos e Influenciar Pessoas" — relacionamento' },
      { num: '📖', name: 'Brian Tracy', desc: '"A Psicologia da Venda" — mentalidade de campeão' },
      { num: '📖', name: 'Joseph Murphy', desc: '"O Poder do Subconsciente" — programação mental' },
      { num: '📖', name: 'Edna Prado', desc: '"Numerologia Aplicada" — perfis comportamentais' },
      { num: '📖', name: 'Sócrates', desc: '"Conhece-te a ti mesmo" — autoconhecimento do vendedor' },
      { num: '📖', name: 'Platão', desc: '"A excelência não é um ato, mas um hábito" — base filosófica' },
    ],
  },
  {
    id: 'historia',
    icon: Award,
    color: 'from-rose-500 to-pink-600',
    title: '🏆 História de Impacto',
    subtitle: 'A trajetória do Método NR22',
    content: [
      { label: 'Repercussão imediata', desc: 'Empresas e investidores demonstraram interesse em adquirir a tecnologia' },
      { label: 'Proposta de compra', desc: 'Plataforma de grande porte ofereceu comprar parte do negócio' },
      { label: 'Decisão estratégica', desc: 'Nathan Rosa adquiriu o restante para manter controle total' },
      { label: 'Resultado', desc: 'NR22 permanece independente — evolução constante sem limitações corporativas' },
    ],
    quote: '"Quando você combina IA de última geração com conhecimento profundo de vendas e comportamento humano, cria-se algo que o próprio mercado deseja possuir."',
  },
];

function Section({ section }) {
  const [open, setOpen] = useState(false);
  const Icon = section.icon;

  return (
    <Card className="overflow-hidden border-0 shadow-md">
      <button
        onClick={() => setOpen(!open)}
        className={`w-full text-left bg-gradient-to-r ${section.color} p-3 flex items-center gap-3`}
      >
        <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-white text-sm leading-tight">{section.title}</div>
          <div className="text-white/70 text-[10px]">{section.subtitle}</div>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-white/80 shrink-0" /> : <ChevronDown className="w-4 h-4 text-white/80 shrink-0" />}
      </button>

      {open && (
        <CardContent className="p-3 space-y-2 bg-white">
          {/* Stats */}
          {section.stats && (
            <div className="grid grid-cols-4 gap-1.5 mb-2">
              {section.stats.map((s, i) => (
                <div key={i} className="text-center bg-slate-50 rounded-lg p-2">
                  <div className="font-black text-sm text-indigo-700">{s.value}</div>
                  <div className="text-[9px] text-slate-500 leading-tight">{s.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Content list */}
          {section.content && section.content.map((item, i) => (
            <div key={i} className="flex gap-2 items-start">
              <CheckCircle className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-semibold text-slate-700">{item.label}: </span>
                <span className="text-xs text-slate-600">{item.desc}</span>
              </div>
            </div>
          ))}

          {/* Numbered/bulleted list */}
          {section.list && section.list.map((item, i) => (
            <div key={i} className="flex gap-2 items-start">
              <span className="text-base leading-none shrink-0">{item.num}</span>
              <div>
                <span className="text-xs font-semibold text-slate-700">{item.name} — </span>
                <span className="text-xs text-slate-600">{item.desc}</span>
              </div>
            </div>
          ))}

          {/* Quote */}
          {section.quote && (
            <blockquote className="mt-2 border-l-3 border-indigo-400 pl-3 text-xs italic text-indigo-700 bg-indigo-50 py-2 pr-2 rounded-r">
              {section.quote}
            </blockquote>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export default function NR22MetodoHub() {
  const [expandAll, setExpandAll] = useState(false);

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-700 to-purple-800 rounded-xl p-4 text-white">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Brain className="w-6 h-6 text-yellow-300" />
          </div>
          <div>
            <h2 className="font-black text-lg leading-tight">Método NR22</h2>
            <p className="text-indigo-200 text-[10px]">Fusão: Vendas · Neurociência · IA de Última Geração</p>
          </div>
        </div>
        <p className="text-xs text-indigo-100 leading-relaxed">
          Sistema revolucionário que não apenas gerencia, mas <strong>COMPREENDE e ANTECIPA</strong> o comportamento de compra. 
          Vai além de vendas — seu propósito é fortalecer a mente do vendedor.
        </p>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {['47 variáveis', '15K cruzamentos/min', '22 IAs ativas', 'AES-256', 'LGPD Compliant'].map(tag => (
            <Badge key={tag} className="bg-white/20 text-white text-[9px] border-0">{tag}</Badge>
          ))}
        </div>
      </div>

      {/* O sistema lembra */}
      <Card className="bg-gradient-to-r from-slate-800 to-slate-900 border-0">
        <CardContent className="p-3">
          <p className="text-xs font-bold text-yellow-400 mb-2">💡 O sistema lembra o que você já sabe (mas esquece):</p>
          <div className="grid grid-cols-2 gap-1.5">
            {[
              { word: 'FOCO', desc: 'Uma coisa de cada vez' },
              { word: 'DADOS', desc: 'Não invente, analise' },
              { word: 'APRENDA', desc: 'Perda é professor' },
              { word: 'AVANCE', desc: 'Passado não muda, futuro sim' },
            ].map(({ word, desc }) => (
              <div key={word} className="bg-white/5 rounded-lg p-2 text-center">
                <div className="font-black text-white text-sm">{word}</div>
                <div className="text-[10px] text-slate-400">{desc}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Seções expansíveis */}
      {SECTIONS.map(section => (
        <Section key={section.id} section={section} />
      ))}

      {/* Fluxo de trabalho */}
      <Card className="border-0 shadow-md">
        <CardHeader className="bg-gradient-to-r from-indigo-500 to-blue-600 p-3">
          <CardTitle className="text-white text-sm">📅 Fluxo de Trabalho NR22</CardTitle>
        </CardHeader>
        <CardContent className="p-3 space-y-2">
          {[
            { day: 'Dia 1', label: 'Importação & Setup', desc: 'Importar planilha → Processar → Definir metas → Configurar automações' },
            { day: 'Dias 2-7', label: 'Qualificação', desc: 'Score automático → Tarefas IA → Ligar para quentes → Atualizar dados' },
            { day: 'Dias 8-15', label: 'Engajamento', desc: 'Propostas personalizadas → DocumentMonitorAI rastreia → Follow-ups → Agendar visitas' },
            { day: 'Dias 16-30', label: 'Fechamento', desc: 'Visitas técnicas → Demonstração → Negociação → Contrato → Fechar venda' },
            { day: 'Contínuo', label: 'Nurturing', desc: 'Mornos em follow-up → Frios em reengajamento → Novos leads → Upsell' },
          ].map(({ day, label, desc }) => (
            <div key={day} className="flex gap-2 items-start">
              <Badge className="bg-indigo-100 text-indigo-700 text-[9px] shrink-0 mt-0.5">{day}</Badge>
              <div>
                <span className="text-xs font-semibold text-slate-700">{label}: </span>
                <span className="text-xs text-slate-600">{desc}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center py-2">
        <p className="text-[10px] text-slate-400">
          Desenvolvido por <strong className="text-indigo-600">Nathan Rosa</strong> · CMAT Brasil · Método NR22 v4 TURBO
        </p>
        <p className="text-[9px] text-slate-300 mt-0.5">Sistema criado para servir o vendedor, não o contrário.</p>
      </div>
    </div>
  );
}
import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Instagram, Sparkles, Calendar, BarChart3, Copy, CheckCheck,
  Camera, Film, Image, TrendingUp, Heart, Eye, MessageCircle,
  Zap, RefreshCw, ChevronRight, Clock, Star, Package
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// --- POST SUGGESTION CARD ---
function PostSuggestionCard({ sale, onGenerate, generatedContent, isGenerating }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTypes = [
    { type: 'reels', icon: Film, label: 'Reels', color: 'bg-purple-500' },
    { type: 'stories', icon: Camera, label: 'Stories', color: 'bg-pink-500' },
    { type: 'feed', icon: Image, label: 'Feed', color: 'bg-orange-500' },
  ];

  return (
    <Card className="border border-slate-200 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="font-bold text-slate-800">{sale.client_name}</p>
            <p className="text-sm text-slate-500">{sale.equipment_name}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              R$ {(sale.sale_value || 0).toLocaleString('pt-BR')} •{' '}
              {sale.sale_date ? format(new Date(sale.sale_date), "dd/MM/yyyy", { locale: ptBR }) : '—'}
            </p>
          </div>
          <Badge className="bg-green-100 text-green-700 border-0 text-xs">✅ Instalado</Badge>
        </div>

        <div className="flex gap-2 mb-3">
          {formatTypes.map(({ type, icon: Icon, label, color }) => (
            <button
              key={type}
              onClick={() => onGenerate(sale, type)}
              disabled={isGenerating}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-white text-xs font-medium ${color} hover:opacity-90 transition-opacity disabled:opacity-50`}
            >
              <Icon className="w-3 h-3" />
              {label}
            </button>
          ))}
        </div>

        {generatedContent && (
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-3 mt-2">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-500" />
                <span className="text-xs font-bold text-purple-700 uppercase tracking-wide">
                  {generatedContent.format === 'reels' ? '🎬 Reels' : generatedContent.format === 'stories' ? '📸 Stories' : '🖼️ Feed'}
                </span>
              </div>
              <button
                onClick={() => handleCopy(generatedContent.caption + '\n\n' + generatedContent.hashtags)}
                className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-800"
              >
                {copied ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copiado!' : 'Copiar'}
              </button>
            </div>

            {generatedContent.hook && (
              <div className="mb-2">
                <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">🪝 Hook</p>
                <p className="text-sm font-bold text-slate-800">{generatedContent.hook}</p>
              </div>
            )}

            <div className="mb-2">
              <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">✍️ Legenda</p>
              <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">{generatedContent.caption}</p>
            </div>

            {generatedContent.cta && (
              <div className="mb-2">
                <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">📣 CTA</p>
                <p className="text-sm font-semibold text-purple-700">{generatedContent.cta}</p>
              </div>
            )}

            <p className="text-xs text-blue-600 mt-1">{generatedContent.hashtags}</p>

            {generatedContent.script && (
              <div className="mt-2 bg-white rounded-lg p-2 border border-purple-100">
                <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">🎬 Script rápido</p>
                <p className="text-xs text-slate-600 whitespace-pre-line">{generatedContent.script}</p>
              </div>
            )}
          </div>
        )}

        {isGenerating && (
          <div className="flex items-center gap-2 mt-2 text-purple-600 text-sm">
            <RefreshCw className="w-4 h-4 animate-spin" />
            Gerando conteúdo com IA...
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// --- MINI CALENDAR ---
function PostCalendar({ scheduledPosts, onSchedule }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);

  const days = useMemo(() => {
    return eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });
  }, [currentMonth]);

  const firstDayOfWeek = startOfMonth(currentMonth).getDay();
  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const getPostsForDay = (day) => scheduledPosts.filter(p => p.date && isSameDay(new Date(p.date), day));

  return (
    <div className="bg-white rounded-2xl border p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-800">
          {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
        </h3>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0"
            onClick={() => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() - 1))}>‹</Button>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0"
            onClick={() => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() + 1))}>›</Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {weekDays.map(d => (
          <div key={d} className="text-center text-[10px] font-bold text-slate-400 py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`empty-${i}`} />)}
        {days.map(day => {
          const posts = getPostsForDay(day);
          const isSelected = selectedDay && isSameDay(day, selectedDay);
          return (
            <button
              key={day.toISOString()}
              onClick={() => { setSelectedDay(day); onSchedule(day); }}
              className={`relative aspect-square flex flex-col items-center justify-center rounded-lg text-xs font-medium transition-all
                ${isToday(day) ? 'bg-purple-600 text-white' : isSelected ? 'bg-purple-100 text-purple-700' : 'hover:bg-slate-100 text-slate-700'}
              `}
            >
              {format(day, 'd')}
              {posts.length > 0 && (
                <span className={`absolute bottom-0.5 w-1.5 h-1.5 rounded-full ${isToday(day) ? 'bg-white' : 'bg-pink-500'}`} />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 space-y-2">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Posts agendados</p>
        {scheduledPosts.length === 0 ? (
          <p className="text-xs text-slate-400 py-2">Nenhum post agendado. Gere conteúdo e agende!</p>
        ) : (
          scheduledPosts.slice(0, 5).map((post, i) => (
            <div key={i} className="flex items-center gap-2 bg-purple-50 rounded-lg p-2">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-700 truncate">{post.client_name}</p>
                <p className="text-[10px] text-slate-400">{post.date ? format(new Date(post.date), "dd/MM 'às' HH:mm", { locale: ptBR }) : '—'} • {post.format}</p>
              </div>
              <Badge className="text-[10px] bg-purple-100 text-purple-600 border-0 shrink-0">{post.format}</Badge>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// --- METRICS ---
function MetricsPanel({ sales }) {
  const thisMonth = new Date().getMonth();
  const thisYear = new Date().getFullYear();

  const monthlySales = sales.filter(s => {
    const d = new Date(s.sale_date || s.created_date);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  });

  const metrics = [
    {
      label: 'Instalações este mês',
      value: monthlySales.length,
      icon: Package,
      color: 'text-green-600',
      bg: 'bg-green-50',
      sub: 'Potenciais posts'
    },
    {
      label: 'Posts possíveis',
      value: monthlySales.length * 3,
      icon: Image,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      sub: 'Reels + Stories + Feed'
    },
    {
      label: 'Alcance estimado',
      value: `${(monthlySales.length * 800).toLocaleString('pt-BR')}`,
      icon: Eye,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      sub: 'Visualizações/mês'
    },
    {
      label: 'Leads potenciais',
      value: Math.round(monthlySales.length * 800 * 0.03),
      icon: Heart,
      color: 'text-pink-600',
      bg: 'bg-pink-50',
      sub: '3% taxa de conversão'
    },
  ];

  const contentTips = [
    { icon: '🎬', tip: 'Reels de instalação geram 3x mais alcance que fotos', type: 'Reels' },
    { icon: '⏱️', tip: 'Melhor horário: 18h-21h (veterinários terminam expediente)', type: 'Timing' },
    { icon: '🏷️', tip: 'Use #VeterináriaModerna #LaboratórioVet #Seamaty', type: 'Hashtags' },
    { icon: '🤝', tip: 'Marque a clínica no post para aumentar engajamento', type: 'Engajamento' },
    { icon: '📊', tip: 'Antes/Depois de resultados de exames = alto engajamento', type: 'Conteúdo' },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {metrics.map(({ label, value, icon: Icon, color, bg, sub }) => (
          <div key={label} className={`${bg} rounded-xl p-3`}>
            <Icon className={`w-5 h-5 ${color} mb-1.5`} />
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs font-medium text-slate-700">{label}</p>
            <p className="text-[10px] text-slate-400">{sub}</p>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-br from-slate-800 to-indigo-900 rounded-2xl p-4 text-white">
        <div className="flex items-center gap-2 mb-3">
          <Star className="w-4 h-4 text-yellow-400" />
          <p className="font-bold text-sm">Dicas de Conteúdo</p>
        </div>
        <div className="space-y-2">
          {contentTips.map(({ icon, tip, type }, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-base shrink-0">{icon}</span>
              <div>
                <span className="text-[10px] font-bold text-indigo-300 uppercase">{type} — </span>
                <span className="text-xs text-slate-300">{tip}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl p-4 text-white">
        <p className="font-bold text-sm mb-1">🚀 Meta: 12 equipamentos/mês</p>
        <p className="text-xs text-pink-100 mb-2">Cada instalação = 3 posts = ~2.400 visualizações</p>
        <div className="w-full bg-white/20 rounded-full h-2">
          <div
            className="bg-white h-2 rounded-full transition-all"
            style={{ width: `${Math.min(100, (monthlySales.length / 12) * 100)}%` }}
          />
        </div>
        <p className="text-xs text-pink-100 mt-1">{monthlySales.length}/12 instalações este mês</p>
      </div>
    </div>
  );
}

// --- MAIN PAGE ---
export default function InstagramStudio() {
  const [generatedContents, setGeneratedContents] = useState({});
  const [generatingId, setGeneratingId] = useState(null);
  const [scheduledPosts, setScheduledPosts] = useState([]);
  const [pendingSchedule, setPendingSchedule] = useState(null);

  const { data: sales = [] } = useQuery({
    queryKey: ['sales-instagram'],
    queryFn: () => base44.entities.Sale.filter({ status: 'fechada' }, '-sale_date', 20),
    staleTime: 60000,
  });

  const handleGenerate = async (sale, postFormat) => {
    const key = `${sale.id}-${postFormat}`;
    setGeneratingId(key);
    try {
      const saleDate = sale.sale_date ? format(new Date(sale.sale_date), "dd/MM/yyyy", { locale: ptBR }) : 'recente';
      const formatLabel = postFormat === 'reels' ? 'Reels (vídeo curto 30-60s)' : postFormat === 'stories' ? 'Stories (conteúdo rápido e direto)' : 'Post de Feed (foto/carrossel)';
      const prompt = `Você é um especialista em marketing digital para clínicas veterinárias.
      
Gere conteúdo para Instagram baseado nesta instalação de equipamento:
- Cliente: ${sale.client_name}
- Equipamento: ${sale.equipment_name}
- Valor: R$ ${(sale.sale_value || 0).toLocaleString('pt-BR')}
- Data: ${saleDate}
- Formato: ${formatLabel}

Retorne um JSON com:
{
  "hook": "frase de abertura impactante (para reels/stories)",
  "caption": "legenda completa com emojis e quebras de linha",
  "cta": "call to action direto (ex: Quer na sua clínica? Link na bio!)",
  "hashtags": "20 hashtags relevantes",
  "script": "roteiro rápido de 5 cenas para reels (apenas para formato reels)"
}

Foque em: resultado para a clínica, modernização do atendimento, diferencial competitivo. Tom profissional mas acessível.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: 'object',
          properties: {
            hook: { type: 'string' },
            caption: { type: 'string' },
            cta: { type: 'string' },
            hashtags: { type: 'string' },
            script: { type: 'string' }
          }
        }
      });

      setGeneratedContents(prev => ({ ...prev, [key]: { ...result, format: postFormat, client_name: sale.client_name } }));
    } catch (e) {
      console.error(e);
    }
    setGeneratingId(null);
  };

  const handleScheduleDay = (day) => {
    if (pendingSchedule) {
      setScheduledPosts(prev => [...prev, { ...pendingSchedule, date: day }]);
      setPendingSchedule(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-pink-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white p-5 pb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Instagram className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Instagram Studio</h1>
            <p className="text-purple-100 text-xs">Transforme cada instalação em conteúdo viral</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-2">
        {/* Banner */}
        <div className="bg-white rounded-2xl border border-purple-100 p-3 mb-4 flex items-center gap-3 shadow-sm">
          <Zap className="w-8 h-8 text-yellow-500 shrink-0" />
          <div>
            <p className="text-sm font-bold text-slate-800">IA gera legenda + CTA + Script em segundos</p>
            <p className="text-xs text-slate-500">Selecione uma instalação e o formato → pronto para postar!</p>
          </div>
        </div>

        <Tabs defaultValue="sugestoes">
          <TabsList className="w-full bg-white border mb-4 p-1 rounded-xl">
            <TabsTrigger value="sugestoes" className="flex-1 text-xs data-[state=active]:bg-purple-600 data-[state=active]:text-white rounded-lg">
              <Sparkles className="w-3.5 h-3.5 mr-1" /> Sugestões IA
            </TabsTrigger>
            <TabsTrigger value="calendario" className="flex-1 text-xs data-[state=active]:bg-purple-600 data-[state=active]:text-white rounded-lg">
              <Calendar className="w-3.5 h-3.5 mr-1" /> Calendário
            </TabsTrigger>
            <TabsTrigger value="metricas" className="flex-1 text-xs data-[state=active]:bg-purple-600 data-[state=active]:text-white rounded-lg">
              <BarChart3 className="w-3.5 h-3.5 mr-1" /> Métricas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sugestoes">
            <div className="space-y-3">
              {sales.length === 0 ? (
                <div className="text-center py-12 text-slate-400 bg-white rounded-2xl border">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">Nenhuma venda fechada ainda</p>
                  <p className="text-sm mt-1">Feche vendas para gerar conteúdo automaticamente</p>
                </div>
              ) : (
                sales.map(sale => {
                  const activeKey = Object.keys(generatedContents).find(k => k.startsWith(sale.id));
                  return (
                    <PostSuggestionCard
                      key={sale.id}
                      sale={sale}
                      onGenerate={handleGenerate}
                      generatedContent={activeKey ? generatedContents[activeKey] : null}
                      isGenerating={generatingId?.startsWith(sale.id)}
                    />
                  );
                })
              )}
            </div>
          </TabsContent>

          <TabsContent value="calendario">
            <PostCalendar scheduledPosts={scheduledPosts} onSchedule={handleScheduleDay} />
          </TabsContent>

          <TabsContent value="metricas">
            <MetricsPanel sales={sales} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
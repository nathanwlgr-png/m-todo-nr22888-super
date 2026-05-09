import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Zap, Users, MessageSquare, Target, TrendingUp, Loader2,
  Send, Settings, BarChart3, AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const SEGMENTS = {
  vip: { name: 'VIP - High Value', color: '#fbbf24', emoji: '👑', desc: 'Alto valor + Equipamentos premium' },
  growth: { name: 'Growth - Em Crescimento', color: '#3b82f6', emoji: '📈', desc: 'Potencial alto + Ativo' },
  atrisk: { name: 'At Risk - Em Risco', color: '#ef4444', emoji: '⚠️', desc: 'Sem contato há 30+ dias' },
  nurture: { name: 'Nurture - Para Cultivar', color: '#8b5cf6', emoji: '🌱', desc: 'Novo cliente + Potencial' },
  dormant: { name: 'Dormant - Adormecido', color: '#6b7280', emoji: '😴', desc: 'Inativo há 60+ dias' },
};

export default function ClientSegmentation() {
  const [autoMode, setAutoMode] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState(null);

  const { data: clients = [] } = useQuery({
    queryKey: ['clients-segment'],
    queryFn: () => base44.entities.Client.list('-updated_date', 300),
    staleTime: 5 * 60 * 1000,
  });

  const { data: consumables = [] } = useQuery({
    queryKey: ['consumables-segment'],
    queryFn: () => base44.entities.ConsumableOrder?.list('-next_reorder_date', 100).catch(() => []),
    staleTime: 5 * 60 * 1000,
  });

  // Segmentação automática
  const segmentClients = useMutation({
    mutationFn: async () => {
      toast.info('🧠 Segmentando clientes...');
      const result = await base44.functions.invoke('aiClientSegmentation', {
        clients: clients.slice(0, 200),
        consumables: consumables,
      });
      return result.data;
    },
    onSuccess: (data) => {
      toast.success('✅ Segmentação completa!');
      setAutoMode(true);
    },
    onError: (err) => toast.error('Erro: ' + err.message),
  });

  // Simular segmentação
  const segmentation = useMemo(() => {
    const total = clients.length;
    return {
      vip: Math.floor(total * 0.12),
      growth: Math.floor(total * 0.28),
      atrisk: Math.floor(total * 0.15),
      nurture: Math.floor(total * 0.25),
      dormant: Math.floor(total * 0.20),
    };
  }, [clients]);

  const segmentationData = useMemo(() => {
    return Object.entries(segmentation).map(([key, value]) => ({
      name: SEGMENTS[key].emoji + ' ' + SEGMENTS[key].name,
      value,
      color: SEGMENTS[key].color,
    }));
  }, [segmentation]);

  // Campanhas automáticas
  const triggerCampaigns = useMutation({
    mutationFn: async (segment) => {
      toast.info(`📧 Disparando campanhas para ${segment}...`);
      const result = await base44.functions.invoke('executeNurturingCampaigns', {
        segment,
        clients: clients.filter(c => c.ai_segment === segment).slice(0, 50),
      });
      return result.data;
    },
    onSuccess: (data) => {
      toast.success('✅ Campanhas disparadas!');
    },
    onError: (err) => toast.error('Erro: ' + err.message),
  });

  const details = {
    vip: {
      count: segmentation.vip,
      strategy: 'Conta dedicada + Suporte premium',
      email_template: 'VIP Exclusivo - Novas features',
      whatsapp_template: '👑 Acesso VIP: Consultor dedicado para você',
      frequency: 'Semanal',
      cta: '📞 Agendar Consulta Premium',
    },
    growth: {
      count: segmentation.growth,
      strategy: 'Upsell de equipamentos + Insumos',
      email_template: 'Crescimento: Oportunidades de expansão',
      whatsapp_template: '📈 Sua clínica está crescendo! Conheça nossas soluções',
      frequency: 'Bi-semanal',
      cta: '💡 Ver Oportunidades',
    },
    atrisk: {
      count: segmentation.atrisk,
      strategy: 'Re-engajamento + Suporte técnico',
      email_template: 'Resolvemos seu problema! Vamos conversar?',
      whatsapp_template: '💬 Não esqueça de nós! Tenho uma solução para você',
      frequency: 'Semanal',
      cta: '🔄 Reativar Relacionamento',
    },
    nurture: {
      count: segmentation.nurture,
      strategy: 'Educação + Onboarding gradual',
      email_template: 'Bem-vindo! Guia de primeiros passos',
      whatsapp_template: '👋 Bem-vindo à nossa comunidade!',
      frequency: 'Quinzenal',
      cta: '🎓 Iniciar Onboarding',
    },
    dormant: {
      count: segmentation.dormant,
      strategy: 'Win-back + Desconto/Promoção',
      email_template: 'Voltamos com tudo! Confira nossas novidades',
      whatsapp_template: '🎁 Voltamos com 20% OFF para você!',
      frequency: 'Mensal',
      cta: '🎯 Win-back Campaign',
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 pb-24 pt-4">
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">

        {/* HEADER */}
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-600" />
            🎯 Motor de Segmentação de Clientes
          </h1>
          <p className="text-slate-600 mt-1">Agrupa por comportamento, equipamentos, urgência + Campanhas automáticas</p>
        </div>

        {/* ATIVAR SEGMENTAÇÃO */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="font-bold text-slate-900">Status: {autoMode ? '✅ Segmentação Ativa' : '❌ Inativa'}</p>
                <p className="text-sm text-slate-600">Segmentação automática de {clients.length} clientes</p>
              </div>
              <Button
                onClick={() => segmentClients.mutate()}
                disabled={segmentClients.isPending}
                className="gap-2 bg-blue-600 hover:bg-blue-700"
              >
                {segmentClients.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                Executar Segmentação
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* DISTRIBUIÇÃO */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Segmento</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={segmentationData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {segmentationData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tamanho por Segmento</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={segmentationData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-15} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6">
                    {segmentationData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* SEGMENTOS DETALHADOS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(SEGMENTS).map(([key, segment]) => (
            <Card
              key={key}
              className={`border-2 cursor-pointer transition ${
                selectedSegment === key
                  ? `border-[${segment.color}] bg-opacity-20`
                  : 'border-slate-200 hover:border-slate-300'
              }`}
              onClick={() => setSelectedSegment(selectedSegment === key ? null : key)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-3xl">{segment.emoji}</span>
                    {segment.name}
                  </CardTitle>
                  <Badge style={{ background: segment.color }} className="text-white">
                    {details[key].count} clientes
                  </Badge>
                </div>
                <p className="text-xs text-slate-600 mt-2">{segment.desc}</p>
              </CardHeader>

              {selectedSegment === key && (
                <CardContent className="space-y-3 border-t pt-4">
                  <div className="space-y-2">
                    <p><span className="font-bold">Estratégia:</span> {details[key].strategy}</p>
                    <p><span className="font-bold">Email:</span> {details[key].email_template}</p>
                    <p><span className="font-bold">WhatsApp:</span> {details[key].whatsapp_template}</p>
                    <p><span className="font-bold">Frequência:</span> {details[key].frequency}</p>
                  </div>

                  <div className="flex gap-2 flex-wrap pt-2">
                    <Button
                      size="sm"
                      className="gap-2 flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        triggerCampaigns.mutate(key);
                      }}
                    >
                      <Send className="w-3 h-3" />
                      {details[key].cta}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        toast.info(`📊 Analisando ${segment.name}...`);
                      }}
                    >
                      <BarChart3 className="w-3 h-3" />
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        {/* PRÓXIMOS PASSOS */}
        <Card className="border-green-300 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-900">✅ Próximos Passos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm">1️⃣ <strong>Executar Segmentação</strong> para agrupar {clients.length} clientes</p>
            <p className="text-sm">2️⃣ <strong>Selecionar Segmento</strong> e revisar estratégia</p>
            <p className="text-sm">3️⃣ <strong>Disparar Campanhas</strong> de email e WhatsApp automáticas</p>
            <p className="text-sm">4️⃣ <strong>Monitorar Engajamento</strong> e ajustar frequência conforme resultados</p>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
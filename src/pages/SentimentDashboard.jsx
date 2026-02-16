import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { AlertCircle, TrendingDown, Smile, Meh, Frown, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';

export default function SentimentDashboard() {
  const queryClient = useQueryClient();

  const { data: interactions = [] } = useQuery({
    queryKey: ['interactions'],
    queryFn: () => base44.entities.Interaction.list(),
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['sentiment-alerts'],
    queryFn: () => base44.entities.SentimentAlert?.filter({ status: 'open' }).catch(() => []),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
  });

  const { data: segments = [] } = useQuery({
    queryKey: ['segments'],
    queryFn: () => base44.entities.ClientSegment?.list().catch(() => []),
  });

  const analyzeMutation = useMutation({
    mutationFn: () => base44.functions.invoke('batchSentimentAnalysis', {}),
    onSuccess: () => {
      queryClient.invalidateQueries(['interactions']);
      toast.success('Análise concluída!');
    }
  });

  // Métricas gerais
  const withSentiment = interactions.filter(i => i.sentiment);
  const positive = withSentiment.filter(i => i.sentiment === 'positive').length;
  const neutral = withSentiment.filter(i => i.sentiment === 'neutral').length;
  const negative = withSentiment.filter(i => i.sentiment === 'negative').length;

  const sentimentData = [
    { name: 'Positivo', value: positive, color: '#10b981' },
    { name: 'Neutro', value: neutral, color: '#6b7280' },
    { name: 'Negativo', value: negative, color: '#ef4444' }
  ];

  // Clientes em risco (health score baixo)
  const atRiskClients = clients
    .filter(c => c.health_score && c.health_score < 50)
    .sort((a, b) => a.health_score - b.health_score)
    .slice(0, 10);

  // Tendência por segmento
  const sentimentBySegment = segments.map(seg => {
    const segmentClients = clients.filter(c => seg.client_ids?.includes(c.id));
    const avgHealth = segmentClients.length > 0
      ? segmentClients.reduce((sum, c) => sum + (c.health_score || 0), 0) / segmentClients.length
      : 0;
    
    return {
      name: seg.segment_name,
      health: avgHealth.toFixed(0)
    };
  });

  // Evolução temporal (últimos 7 dias)
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dayInteractions = interactions.filter(int => {
      const intDate = new Date(int.created_date);
      return intDate.toDateString() === date.toDateString();
    });
    
    const posCount = dayInteractions.filter(i => i.sentiment === 'positive').length;
    const negCount = dayInteractions.filter(i => i.sentiment === 'negative').length;
    
    last7Days.push({
      date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      positive: posCount,
      negative: negCount
    });
  }

  return (
    <div className="space-y-4 pb-20">
      <Card className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Análise de Sentimento em Tempo Real</CardTitle>
              <p className="text-blue-100">IA monitora emoções e saúde dos relacionamentos</p>
            </div>
            <Button
              onClick={() => analyzeMutation.mutate()}
              disabled={analyzeMutation.isPending}
              className="bg-white text-blue-600"
            >
              <Zap className="w-4 h-4 mr-2" />
              {analyzeMutation.isPending ? 'Analisando...' : 'Analisar Tudo'}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {alerts.length > 0 && (
        <Card className="border-l-4 border-l-red-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              Alertas Críticos ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {alerts.slice(0, 5).map(alert => (
              <Link key={alert.id} to={createPageUrl(`ClientProfile?id=${alert.client_id}`)}>
                <div className="flex items-center justify-between p-3 bg-red-50 rounded hover:bg-red-100">
                  <div>
                    <p className="font-semibold">{alert.client_name}</p>
                    <p className="text-xs text-red-800">{alert.trigger_reason}</p>
                  </div>
                  <Badge className="bg-red-500">{alert.severity}</Badge>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-600">Interações Positivas</p>
                <p className="text-3xl font-bold text-green-600">{positive}</p>
              </div>
              <Smile className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-600">Interações Neutras</p>
                <p className="text-3xl font-bold text-slate-600">{neutral}</p>
              </div>
              <Meh className="w-8 h-8 text-slate-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-600">Interações Negativas</p>
                <p className="text-3xl font-bold text-red-600">{negative}</p>
              </div>
              <Frown className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Sentimento</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={sentimentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  dataKey="value"
                >
                  {sentimentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Evolução - Últimos 7 Dias</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={last7Days}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="positive" stroke="#10b981" strokeWidth={2} />
                <Line type="monotone" dataKey="negative" stroke="#ef4444" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {sentimentBySegment.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Saúde por Segmento</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={sentimentBySegment}>
                <XAxis dataKey="name" angle={-15} textAnchor="end" height={80} />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="health" fill="#4f46e5" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-red-500" />
            Clientes em Risco (Health Score Baixo)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {atRiskClients.map(client => (
            <Link key={client.id} to={createPageUrl(`ClientProfile?id=${client.id}`)}>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded hover:bg-slate-100">
                <div>
                  <p className="font-semibold">{client.full_name}</p>
                  <p className="text-xs text-slate-600">{client.city}</p>
                </div>
                <Badge className={
                  client.health_score < 30 ? 'bg-red-500' :
                  client.health_score < 50 ? 'bg-orange-500' : 'bg-yellow-500'
                }>
                  Health: {client.health_score}
                </Badge>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
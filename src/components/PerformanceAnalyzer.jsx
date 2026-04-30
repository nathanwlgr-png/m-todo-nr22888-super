import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { BarChart3, TrendingUp, AlertCircle, CheckCircle2, Zap, Lightbulb } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function PerformanceAnalyzer() {
  const [metrics, setMetrics] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyzePerformance();
  }, []);

  const analyzePerformance = async () => {
    try {
      // Buscar dados de vendas, visitas, leads
      const sales = await base44.entities.Sale?.list().catch(() => []);
      const leads = await base44.entities.Lead?.list().catch(() => []);
      const visits = await base44.entities.Visit?.list().catch(() => []);
      const interactions = await base44.entities.Interaction?.list().catch(() => []);

      // Calcular métricas
      const thisMonth = new Date();
      thisMonth.setDate(1);
      
      const salesThisMonth = sales.filter(s => 
        new Date(s.sale_date) >= thisMonth && s.status === 'fechada'
      ).length;

      const conversionRate = leads.length > 0 
        ? ((sales.length / leads.length) * 100).toFixed(1) 
        : 0;

      const avgResponseTime = interactions.length > 0
        ? interactions.reduce((sum, i) => sum + (i.response_time || 0), 0) / interactions.length
        : 0;

      const whatsappEngagement = interactions.filter(i => i.type === 'whatsapp').length;

      setMetrics({
        salesThisMonth,
        conversionRate,
        avgResponseTime,
        whatsappEngagement,
        totalLeads: leads.length,
        totalSales: sales.length,
        totalVisits: visits.length,
        leadsToday: leads.filter(l => new Date(l.created_date).toDateString() === new Date().toDateString()).length
      });

      generateSuggestions({
        conversionRate,
        avgResponseTime,
        whatsappEngagement,
        totalLeads: leads.length
      });

      setLoading(false);
    } catch (error) {
      console.error('Erro ao analisar performance:', error);
      setLoading(false);
    }
  };

  const generateSuggestions = (data) => {
    const sug = [];

    if (data.conversionRate < 5) {
      sug.push({
        title: 'Aumentar Taxa de Conversão',
        description: 'Sua taxa está baixa. Use TURBO_VENDA para mensagens de impacto',
        priority: 'high',
        action: 'Use comando TURBO_VENDA'
      });
    }

    if (data.avgResponseTime > 120) {
      sug.push({
        title: 'Reduzir Tempo de Resposta',
        description: 'Está demorando muito para responder. Configure notificações do WhatsApp',
        priority: 'high',
        action: 'Ative alertas em tempo real'
      });
    }

    if (data.whatsappEngagement < 30) {
      sug.push({
        title: 'Aumentar Engajamento WhatsApp',
        description: 'Poucos contatos via WhatsApp. Use CONTATO_QUENTE para qualificar',
        priority: 'medium',
        action: 'Use CONTATO_QUENTE para cada lead'
      });
    }

    if (data.totalLeads > 50 && data.avgResponseTime > 60) {
      sug.push({
        title: 'Implementar Automação',
        description: 'Muitos leads e resposta lenta. Use SINCRONIZAR_LEADS para automação',
        priority: 'high',
        action: 'Configure SINCRONIZAR_LEADS agora'
      });
    }

    if (data.conversionRate > 15) {
      sug.push({
        title: 'Manter Excelente Performance! 🎉',
        description: 'Você está acima da média. Continue usando BUSCA_COMPLETA',
        priority: 'low',
        action: 'Parabéns! Mantenha o ritmo'
      });
    }

    setSuggestions(sug);
  };

  if (loading) return <p className="text-slate-500">Analisando...</p>;

  return (
    <div className="space-y-4">
      <Card className="p-5 bg-gradient-to-r from-indigo-50 to-blue-50 border-2 border-indigo-300">
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 className="w-6 h-6 text-indigo-600" />
          <div>
            <h3 className="font-bold text-slate-800">Análise de Desempenho</h3>
            <p className="text-xs text-slate-600">Com sugestões de melhoria</p>
          </div>
        </div>
      </Card>

      {/* Métricas Principais */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-4 bg-green-50 border-green-200">
            <p className="text-xs text-green-600 font-semibold">Vendas Este Mês</p>
            <p className="text-3xl font-bold text-green-700 mt-2">{metrics.salesThisMonth}</p>
          </Card>

          <Card className="p-4 bg-blue-50 border-blue-200">
            <p className="text-xs text-blue-600 font-semibold">Taxa Conversão</p>
            <p className="text-3xl font-bold text-blue-700 mt-2">{metrics.conversionRate}%</p>
          </Card>

          <Card className="p-4 bg-purple-50 border-purple-200">
            <p className="text-xs text-purple-600 font-semibold">Tempo Resposta</p>
            <p className="text-3xl font-bold text-purple-700 mt-2">{Math.round(metrics.avgResponseTime)}m</p>
          </Card>

          <Card className="p-4 bg-orange-50 border-orange-200">
            <p className="text-xs text-orange-600 font-semibold">WhatsApp</p>
            <p className="text-3xl font-bold text-orange-700 mt-2">{metrics.whatsappEngagement}</p>
          </Card>
        </div>
      )}

      {/* Sugestões */}
      <div className="space-y-2">
        <h4 className="font-semibold text-slate-800 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-amber-600" />
          Sugestões de Melhoria
        </h4>

        {suggestions.map((sug, idx) => (
          <Card 
            key={idx} 
            className={`p-4 border-l-4 ${
              sug.priority === 'high' 
                ? 'bg-red-50 border-red-300' 
                : sug.priority === 'medium'
                ? 'bg-yellow-50 border-yellow-300'
                : 'bg-green-50 border-green-300'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h5 className="font-semibold text-slate-800">{sug.title}</h5>
                  <Badge className={
                    sug.priority === 'high' ? 'bg-red-200 text-red-800' :
                    sug.priority === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                    'bg-green-200 text-green-800'
                  }>
                    {sug.priority}
                  </Badge>
                </div>
                <p className="text-sm text-slate-700 mb-2">{sug.description}</p>
                <Button size="sm" variant="outline">
                  {sug.action}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Dicas Rápidas */}
      <Card className="p-4 bg-cyan-50 border-cyan-200">
        <h4 className="font-semibold text-slate-800 mb-3">💡 Dicas de Máximo Desempenho</h4>
        <ul className="space-y-2 text-sm text-slate-700">
          <li>✓ Use <strong>BUSCA_COMPLETA</strong> antes de todo contato</li>
          <li>✓ Use <strong>TURBO_VENDA</strong> para fechamentos críticos</li>
          <li>✓ Use <strong>ROTA_OTIMIZADA</strong> todo dia pela manhã</li>
          <li>✓ Use <strong>ANALISE_PROFUNDA</strong> para leads quentes</li>
          <li>✓ Configure <strong>CONTATO_QUENTE</strong> como atalho preferido</li>
          <li>✓ Revise <strong>COACHING_INSTANTANEO</strong> após cada conversa</li>
        </ul>
      </Card>
    </div>
  );
}
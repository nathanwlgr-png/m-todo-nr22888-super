import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { 
  TrendingUp, TrendingDown, ArrowRight, Zap, Target,
  DollarSign, Clock, Users, Award, Download
} from 'lucide-react';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';

export default function RealtimeSalesFunnel() {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const queryClient = useQueryClient();

  const { data: leads = [] } = useQuery({
    queryKey: ['leads'],
    queryFn: () => base44.entities.Lead.list(),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list(),
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['sales'],
    queryFn: () => base44.entities.Sale.list(),
  });

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        queryClient.invalidateQueries(['leads', 'clients', 'sales']);
      }, 30000); // 30 segundos

      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const stages = [
    {
      id: 'novo',
      name: 'Novos Leads',
      leads: leads.filter(l => l.stage === 'novo'),
      color: 'blue',
      icon: Users,
      kpis: {
        avgScore: null,
        avgDays: null
      }
    },
    {
      id: 'em_contato',
      name: 'Em Contato',
      leads: leads.filter(l => l.stage === 'em_contato'),
      color: 'purple',
      icon: Target,
      kpis: {
        avgScore: null,
        avgDays: null
      }
    },
    {
      id: 'qualificado',
      name: 'Qualificados',
      leads: leads.filter(l => l.stage === 'qualificado'),
      color: 'cyan',
      icon: Award,
      kpis: {
        avgScore: null,
        conversionRate: null
      }
    },
    {
      id: 'negociacao',
      name: 'Negociação',
      leads: [...leads.filter(l => l.stage === 'negociacao'), ...clients.filter(c => c.pipeline_stage === 'negociacao')],
      color: 'orange',
      icon: TrendingUp,
      kpis: {
        totalValue: null,
        avgTicket: null
      }
    },
    {
      id: 'fechado',
      name: 'Fechados',
      leads: sales.filter(s => s.status === 'fechada'),
      color: 'green',
      icon: Award,
      kpis: {
        totalRevenue: sales.filter(s => s.status === 'fechada').reduce((sum, s) => sum + (s.sale_value || 0), 0),
        count: sales.filter(s => s.status === 'fechada').length
      }
    }
  ];

  // Calculate metrics
  stages.forEach(stage => {
    if (stage.leads.length > 0) {
      const scores = stage.leads.map(l => l.ai_score || l.lead_score || 0).filter(s => s > 0);
      stage.kpis.avgScore = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(0) : null;
      
      const days = stage.leads.map(l => {
        if (!l.created_date) return 0;
        return Math.floor((Date.now() - new Date(l.created_date)) / (1000 * 60 * 60 * 24));
      });
      stage.kpis.avgDays = days.length > 0 ? (days.reduce((a, b) => a + b, 0) / days.length).toFixed(0) : null;
    }
  });

  const totalLeads = leads.length;
  const conversionRate = totalLeads > 0 ? ((sales.filter(s => s.status === 'fechada').length / totalLeads) * 100).toFixed(1) : 0;

  const exportMutation = useMutation({
    mutationFn: async (format) => {
      const response = await base44.functions.invoke('exportDashboardData', {
        format,
        data_type: 'dashboard_summary',
        filters: {}
      });
      return { data: response.data, format };
    },
    onSuccess: ({ data, format }) => {
      const blob = new Blob([data], { 
        type: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `funil_vendas.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      a.click();
      toast.success('Exportado!');
    }
  });

  return (
    <div className="space-y-4 pb-20">
      <Card className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Funil de Vendas em Tempo Real</CardTitle>
              <p className="text-indigo-100">Atualização automática a cada 30s</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={autoRefresh ? 'bg-green-500 text-white' : 'bg-white/10 border-white/20 text-white'}
              >
                {autoRefresh ? '🔄 Auto' : 'Manual'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportMutation.mutate('excel')}
                className="bg-white/10 border-white/20 text-white"
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* KPIs Globais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-slate-600 mb-1">Total Pipeline</p>
            <p className="text-3xl font-bold text-indigo-600">{totalLeads}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-slate-600 mb-1">Taxa Conversão</p>
            <p className="text-3xl font-bold text-green-600">{conversionRate}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-slate-600 mb-1">Receita Total</p>
            <p className="text-2xl font-bold text-purple-600">
              R$ {(stages[4].kpis.totalRevenue / 1000).toFixed(0)}k
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-slate-600 mb-1">Ticket Médio</p>
            <p className="text-2xl font-bold text-blue-600">
              R$ {stages[4].kpis.count > 0 ? (stages[4].kpis.totalRevenue / stages[4].kpis.count / 1000).toFixed(0) : 0}k
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Funil Visual */}
      <div className="space-y-3">
        {stages.map((stage, index) => {
          const percentage = totalLeads > 0 ? (stage.leads.length / totalLeads * 100).toFixed(0) : 0;
          const ColorIcon = stage.icon;
          
          return (
            <Card key={stage.id} className={`bg-${stage.color}-50 border-${stage.color}-200`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 bg-${stage.color}-500 rounded-lg flex items-center justify-center`}>
                      <ColorIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">{stage.name}</h3>
                      <p className="text-xs text-slate-600">{stage.leads.length} registros</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-slate-800">{percentage}%</div>
                    <p className="text-xs text-slate-600">do pipeline</p>
                  </div>
                </div>

                <Progress value={percentage} className="h-2 mb-3" />

                <div className="grid grid-cols-3 gap-2 text-xs">
                  {stage.kpis.avgScore && (
                    <div className="bg-white/50 p-2 rounded">
                      <p className="text-slate-600">Score Médio</p>
                      <p className="font-bold">{stage.kpis.avgScore}</p>
                    </div>
                  )}
                  {stage.kpis.avgDays !== null && (
                    <div className="bg-white/50 p-2 rounded">
                      <p className="text-slate-600">Tempo Médio</p>
                      <p className="font-bold">{stage.kpis.avgDays} dias</p>
                    </div>
                  )}
                  {stage.kpis.totalRevenue && (
                    <div className="bg-white/50 p-2 rounded">
                      <p className="text-slate-600">Receita</p>
                      <p className="font-bold">R$ {(stage.kpis.totalRevenue / 1000).toFixed(0)}k</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle>Exportação de Dados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            onClick={() => exportMutation.mutate('excel')}
            className="w-full bg-green-600"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar Resumo Completo (Excel)
          </Button>
          <Button
            onClick={() => exportMutation.mutate('pdf')}
            variant="outline"
            className="w-full"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar Relatório Executivo (PDF)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import SalesKPIDashboard from '@/components/SalesKPIDashboard';
import SalesPerformanceCharts from '@/components/SalesPerformanceCharts';
import GoalComparison from '@/components/GoalComparison';
import { base44 } from '@/api/base44Client';
import { Mail, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SalesDashboard() {
  const [sending, setSending] = useState(false);
  const [email, setEmail] = useState('');

  const sendReport = async (type) => {
    if (!email.trim()) {
      toast.error('Digite um email');
      return;
    }

    setSending(true);
    try {
      const res = await base44.functions.invoke('generateDailyWeeklySalesReport', {
        report_type: type,
        recipients: [email]
      });

      if (res.data?.success) {
        toast.success(`Relatório ${type === 'daily' ? 'diário' : 'semanal'} enviado!`);
        setEmail('');
      }
    } catch (error) {
      toast.error('Erro ao enviar relatório');
      console.error(error);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">📊 Dashboard de Vendas</h1>
          <p className="text-slate-600">Acompanhamento de KPIs, metas e desempenho em tempo real</p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="kpis" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="kpis">📈 KPIs</TabsTrigger>
            <TabsTrigger value="charts">📊 Gráficos</TabsTrigger>
            <TabsTrigger value="goals">🎯 Metas</TabsTrigger>
          </TabsList>

          {/* KPIs Tab */}
          <TabsContent value="kpis" className="space-y-6">
            <SalesKPIDashboard />
          </TabsContent>

          {/* Charts Tab */}
          <TabsContent value="charts" className="space-y-6">
            <SalesPerformanceCharts />
          </TabsContent>

          {/* Goals Tab */}
          <TabsContent value="goals" className="space-y-6">
            <GoalComparison />
          </TabsContent>
        </Tabs>

        {/* Reports Section */}
        <Card className="mt-8 border-0 shadow-lg bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Relatórios Automáticos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600">Receba relatórios diários e semanais por email</p>
            
            <div className="flex gap-2">
              <Input
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-white"
              />
              <Button
                onClick={() => sendReport('daily')}
                disabled={sending}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : '📅'}
                Diário
              </Button>
              <Button
                onClick={() => sendReport('weekly')}
                disabled={sending}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : '📆'}
                Semanal
              </Button>
            </div>

            <p className="text-xs text-slate-600 bg-white/50 p-2 rounded">
              💡 Você pode configurar automação para enviar relatórios diariamente em Automações
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
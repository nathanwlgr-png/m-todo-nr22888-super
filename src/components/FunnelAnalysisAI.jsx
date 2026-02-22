import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle, Zap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';

export default function FunnelAnalysisAI() {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  const { data: leads = [] } = useQuery({
    queryKey: ['all-leads'],
    queryFn: () => base44.entities.Lead.list('-updated_date'),
  });

  const analyzeFunnel = async () => {
    setLoading(true);
    try {
      const stageCounts = {
        novo: leads.filter(l => l.stage === 'novo').length,
        em_contato: leads.filter(l => l.stage === 'em_contato').length,
        qualificado: leads.filter(l => l.stage === 'qualificado').length,
        negociacao: leads.filter(l => l.stage === 'negociacao').length,
        convertido: leads.filter(l => l.stage === 'convertido').length,
        perdido: leads.filter(l => l.stage === 'perdido').length,
      };

      const res = await base44.functions.invoke('analyzeSalesFunnel', {
        stage_counts: stageCounts,
        total_leads: leads.length
      });

      if (res.data) {
        setAnalysis(res.data);
        toast.success('Análise concluída!');
      }
    } catch (error) {
      toast.error('Erro ao analisar funil');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (leads.length > 0) {
      analyzeFunnel();
    }
  }, [leads.length]);

  if (!analysis) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          {loading ? (
            <>
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-2" />
              <p className="text-sm text-slate-500">Analisando funil...</p>
            </>
          ) : (
            <>
              <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">Nenhuma análise disponível</p>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  const { metrics, bottlenecks, opportunities, conversion_rate, avg_cycle_days, chart_data } = analysis;

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-slate-500 mb-1">Taxa de Conversão</p>
            <p className="text-2xl font-bold text-indigo-600">{conversion_rate || 0}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-slate-500 mb-1">Ciclo Médio</p>
            <p className="text-2xl font-bold text-purple-600">{avg_cycle_days || 0} dias</p>
          </CardContent>
        </Card>
      </div>

      {/* Funnel Chart */}
      {chart_data && chart_data.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">📊 Funil de Vendas</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart_data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="stage" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Bottlenecks */}
      {bottlenecks && bottlenecks.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-red-800">⚠️ Gargalos Identificados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {bottlenecks.map((bn, i) => (
              <div key={i} className="p-2 bg-white rounded border border-red-100">
                <p className="text-xs font-semibold text-red-800">{bn.stage}</p>
                <p className="text-xs text-red-700">{bn.issue}</p>
                <p className="text-[10px] text-red-600 mt-1">💡 Ação: {bn.action}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Opportunities */}
      {opportunities && opportunities.length > 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-green-800">✨ Oportunidades de Aceleração</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {opportunities.map((opp, i) => (
              <div key={i} className="p-2 bg-white rounded border border-green-100">
                <p className="text-xs font-semibold text-green-800">{opp.opportunity}</p>
                <p className="text-xs text-green-700">{opp.impact}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Button onClick={analyzeFunnel} disabled={loading} className="w-full bg-indigo-600">
        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
        Atualizar Análise
      </Button>
    </div>
  );
}
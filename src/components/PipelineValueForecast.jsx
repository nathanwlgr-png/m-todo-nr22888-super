import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, Calendar, AlertCircle } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { toast } from 'sonner';

export default function PipelineValueForecast() {
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);

  const { data: leads = [] } = useQuery({
    queryKey: ['leads-forecast'],
    queryFn: () => base44.entities.Lead.list('-updated_date'),
  });

  const generateForecast = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('predictPipelineValue', {
        leads: leads.filter(l => ['em_contato', 'qualificado', 'negociacao'].includes(l.stage))
      });
      if (res.data) {
        setForecast(res.data);
        toast.success('Previsão gerada com sucesso!');
      }
    } catch (error) {
      toast.error('Erro ao gerar previsão');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (leads.length > 0) {
      generateForecast();
    }
  }, [leads.length]);

  if (!forecast) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          {loading ? (
            <>
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-2" />
              <p className="text-sm text-slate-500">Analisando pipeline...</p>
            </>
          ) : (
            <>
              <TrendingUp className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">Nenhuma previsão disponível</p>
              <Button onClick={generateForecast} className="mt-3 bg-indigo-600">
                Gerar Previsão
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  const { periods, total_by_stage, risks, opportunities, confidence_score, chart_data } = forecast;

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        {periods && periods.map((period, i) => (
          <Card key={i} className={`overflow-hidden ${
            period.days === 30 ? 'border-indigo-200 border-2' : ''
          }`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  <span className="text-xs font-semibold text-slate-600">{period.days} dias</span>
                </div>
                <Badge className="bg-indigo-100 text-indigo-700 text-[10px]">
                  {period.probability}%
                </Badge>
              </div>
              <div className="text-2xl font-bold text-slate-900">
                R$ {(period.expected_value / 1000).toFixed(1)}k
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                {period.deals_count} negócios esperados
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-4">
        {/* Timeline Chart */}
        {chart_data && chart_data.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">📈 Evolução do Pipeline</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chart_data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip formatter={(value) => `R$ ${(value / 1000).toFixed(1)}k`} />
                  <Line type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Stage Distribution */}
        {total_by_stage && Object.keys(total_by_stage).length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">🎯 Valor por Estágio</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={Object.entries(total_by_stage).map(([stage, value]) => ({
                  stage: stage.replace('_', ' '),
                  value
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="stage" />
                  <YAxis />
                  <Tooltip formatter={(value) => `R$ ${(value / 1000).toFixed(1)}k`} />
                  <Bar dataKey="value" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Risks and Opportunities */}
      <div className="grid grid-cols-2 gap-4">
        {risks && risks.length > 0 && (
          <Card className="border-red-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-red-700">⚠️ Riscos Identificados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {risks.map((risk, i) => (
                <div key={i} className="p-2 bg-red-50 rounded text-xs text-red-700">
                  <p className="font-medium">{risk.risk}</p>
                  <p className="text-red-600 text-[10px] mt-0.5">{risk.impact}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {opportunities && opportunities.length > 0 && (
          <Card className="border-green-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-green-700">✨ Oportunidades</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {opportunities.map((opp, i) => (
                <div key={i} className="p-2 bg-green-50 rounded text-xs text-green-700">
                  <p className="font-medium">{opp.opportunity}</p>
                  <p className="text-green-600 text-[10px] mt-0.5">{opp.action}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Confidence Score */}
      {confidence_score !== undefined && (
        <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-indigo-900 mb-1">Confiança da Previsão</p>
                <p className="text-xs text-indigo-600">Baseado em histórico e dados atuais</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-indigo-600">{confidence_score}%</div>
                <Badge className={`mt-1 ${
                  confidence_score >= 80 ? 'bg-green-100 text-green-700' :
                  confidence_score >= 60 ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {confidence_score >= 80 ? 'Alto' : confidence_score >= 60 ? 'Médio' : 'Baixo'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Refresh Button */}
      <Button
        onClick={generateForecast}
        disabled={loading}
        className="w-full bg-indigo-600 hover:bg-indigo-700"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <TrendingUp className="w-4 h-4 mr-2" />}
        Atualizar Previsão
      </Button>
    </div>
  );
}
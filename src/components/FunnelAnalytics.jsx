import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from 'recharts';
import { TrendingDown, AlertTriangle, Zap } from 'lucide-react';

export default function FunnelAnalytics() {
  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-updated_date', 500).catch(() => [])
  });

  const { data: interactions = [] } = useQuery({
    queryKey: ['interactions'],
    queryFn: () => base44.entities.Interaction.list('-created_date', 1000).catch(() => [])
  });

  // Análise de conversão
  const conversionData = useMemo(() => {
    const stageConversions = {};
    
    clients.forEach(client => {
      const stage = client.pipeline_stage || 'Lead Qualificado';
      if (!stageConversions[stage]) {
        stageConversions[stage] = {
          stage,
          total: 0,
          converted: 0,
          contacted: 0
        };
      }
      stageConversions[stage].total++;
      
      if (client.status === 'quente') {
        stageConversions[stage].converted++;
      }
      
      const clientInteractions = interactions.filter(i => i.client_id === client.id);
      if (clientInteractions.length > 0) {
        stageConversions[stage].contacted++;
      }
    });

    return Object.values(stageConversions).map(s => ({
      ...s,
      conversionRate: s.total > 0 ? Math.round((s.converted / s.total) * 100) : 0,
      contactRate: s.total > 0 ? Math.round((s.contacted / s.total) * 100) : 0
    }));
  }, [clients, interactions]);

  // Tempo médio por etapa
  const timePerStage = useMemo(() => {
    const stageTimings = {};
    
    clients.forEach(client => {
      const stage = client.pipeline_stage || 'Lead Qualificado';
      if (!stageTimings[stage]) {
        stageTimings[stage] = { stage, times: [] };
      }
      
      const daysInStage = (Date.now() - new Date(client.stage_entered_date || client.created_date)) / (1000 * 60 * 60 * 24);
      stageTimings[stage].times.push(daysInStage);
    });

    return Object.values(stageTimings).map(s => ({
      stage: s.stage,
      avgDays: Math.round(s.times.reduce((a, b) => a + b, 0) / s.times.length || 0),
      minDays: Math.round(Math.min(...s.times) || 0),
      maxDays: Math.round(Math.max(...s.times) || 0)
    }));
  }, [clients]);

  // Identificar gargalos
  const bottlenecks = useMemo(() => {
    return conversionData
      .filter(d => d.contacted < 50 || d.conversionRate < 20)
      .sort((a, b) => a.conversionRate - b.conversionRate)
      .slice(0, 3);
  }, [conversionData]);

  return (
    <div className="space-y-6">
      {/* Taxa de Conversão por Etapa */}
      <Card className="p-4">
        <h4 className="font-bold text-slate-900 mb-4">📊 Taxa de Conversão por Etapa</h4>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={conversionData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="stage" angle={-45} textAnchor="end" height={80} />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Bar yAxisId="left" dataKey="conversionRate" fill="#10b981" name="Taxa Conversão %" />
            <Bar yAxisId="right" dataKey="total" fill="#6366f1" name="Total Clientes" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Tempo por Etapa */}
      <Card className="p-4">
        <h4 className="font-bold text-slate-900 mb-4">⏱️ Tempo Médio por Etapa (dias)</h4>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={timePerStage}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="stage" angle={-45} textAnchor="end" height={80} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="avgDays" stroke="#f59e0b" name="Média" strokeWidth={2} />
            <Line type="monotone" dataKey="maxDays" stroke="#ef4444" name="Máximo" strokeDasharray="5 5" />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Gargalos Críticos */}
      {bottlenecks.length > 0 && (
        <Card className="p-4 bg-gradient-to-r from-red-50 to-orange-50 border-red-200">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h4 className="font-bold text-red-900">Gargalos Detectados</h4>
          </div>
          <div className="space-y-2">
            {bottlenecks.map((stage, i) => (
              <div key={i} className="bg-white/60 rounded p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-slate-900">{stage.stage}</span>
                  <span className="text-sm font-bold text-red-600">{stage.conversionRate}% conversão</span>
                </div>
                <p className="text-xs text-slate-600">
                  {stage.contacted}% foram contatados • {stage.total} clientes nesta etapa
                </p>
                <div className="mt-2 flex gap-2">
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                    ⚠️ Baixa conversão
                  </span>
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                    → Requere ação
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recomendações */}
      <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-5 h-5 text-blue-600" />
          <h4 className="font-bold text-blue-900">💡 Recomendações</h4>
        </div>
        <ul className="space-y-2 text-sm">
          {timePerStage.some(t => t.avgDays > 30) && (
            <li className="flex items-start gap-2">
              <span>→</span>
              <span>Clientes ficando muito tempo em uma etapa: Considere automações mais agressivas</span>
            </li>
          )}
          {bottlenecks.length > 0 && (
            <li className="flex items-start gap-2">
              <span>→</span>
              <span>Etapas com baixa conversão: Revise a qualificação de leads ou propostas</span>
            </li>
          )}
          {conversionData.some(d => d.contactRate < 50) && (
            <li className="flex items-start gap-2">
              <span>→</span>
              <span>Clientes não contatados: Use automações para follow-ups regulares</span>
            </li>
          )}
        </ul>
      </Card>
    </div>
  );
}
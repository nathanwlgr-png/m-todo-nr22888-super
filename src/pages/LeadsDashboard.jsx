import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, TrendingUp, Users, Target, Zap, Award } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function LeadsDashboard() {
  const navigate = useNavigate();

  const { data: leads = [] } = useQuery({
    queryKey: ['leads'],
    queryFn: () => base44.entities.Lead.list('-created_date', 500)
  });

  const metrics = useMemo(() => {
    const byStatus = {
      novo: leads.filter(l => l.status === 'novo').length,
      contatado: leads.filter(l => l.status === 'contatado').length,
      qualificado: leads.filter(l => l.status === 'qualificado').length,
      desqualificado: leads.filter(l => l.status === 'desqualificado').length,
      convertido: leads.filter(l => l.status === 'convertido').length
    };

    const bySource = leads.reduce((acc, lead) => {
      acc[lead.source] = (acc[lead.source] || 0) + 1;
      return acc;
    }, {});

    const byScore = {
      quente: leads.filter(l => (l.lead_score || 0) >= 70).length,
      morno: leads.filter(l => (l.lead_score || 0) >= 40 && (l.lead_score || 0) < 70).length,
      frio: leads.filter(l => (l.lead_score || 0) < 40).length
    };

    const conversionRate = leads.length > 0 
      ? Math.round((byStatus.convertido / leads.length) * 100)
      : 0;

    const avgScore = leads.length > 0
      ? Math.round(leads.reduce((sum, l) => sum + (l.lead_score || 0), 0) / leads.length)
      : 0;

    return { byStatus, bySource, byScore, conversionRate, avgScore, total: leads.length };
  }, [leads]);

  const statusData = [
    { name: 'Novo', value: metrics.byStatus.novo, color: '#6366f1' },
    { name: 'Contatado', value: metrics.byStatus.contatado, color: '#8b5cf6' },
    { name: 'Qualificado', value: metrics.byStatus.qualificado, color: '#10b981' },
    { name: 'Convertido', value: metrics.byStatus.convertido, color: '#059669' }
  ];

  const sourceData = Object.entries(metrics.bySource).map(([source, count]) => ({
    name: source,
    leads: count
  }));

  const scoreData = [
    { name: 'Quente', value: metrics.byScore.quente, color: '#ef4444' },
    { name: 'Morno', value: metrics.byScore.morno, color: '#f59e0b' },
    { name: 'Frio', value: metrics.byScore.frio, color: '#60a5fa' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-600 to-indigo-600 px-4 pt-4 pb-16 rounded-b-[2rem]">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-white/10">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-white">Dashboard de Leads</h1>
            <p className="text-sm text-purple-100">Visão geral do pipeline</p>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4 bg-white/10 backdrop-blur-sm border-white/20">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-purple-100" />
              <p className="text-xs text-purple-100">Total Leads</p>
            </div>
            <p className="text-2xl font-bold text-white">{metrics.total}</p>
          </Card>

          <Card className="p-4 bg-white/10 backdrop-blur-sm border-white/20">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-purple-100" />
              <p className="text-xs text-purple-100">Taxa Conversão</p>
            </div>
            <p className="text-2xl font-bold text-white">{metrics.conversionRate}%</p>
          </Card>

          <Card className="p-4 bg-white/10 backdrop-blur-sm border-white/20">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-purple-100" />
              <p className="text-xs text-purple-100">Score Médio</p>
            </div>
            <p className="text-2xl font-bold text-white">{metrics.avgScore}</p>
          </Card>

          <Card className="p-4 bg-white/10 backdrop-blur-sm border-white/20">
            <div className="flex items-center gap-2 mb-1">
              <Award className="w-4 h-4 text-purple-100" />
              <p className="text-xs text-purple-100">Qualificados</p>
            </div>
            <p className="text-2xl font-bold text-white">{metrics.byStatus.qualificado}</p>
          </Card>
        </div>
      </div>

      <div className="px-4 -mt-8 space-y-4">
        {/* Status Distribution */}
        <Card className="p-4">
          <h3 className="font-semibold text-slate-800 mb-3">Distribuição por Status</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Source Distribution */}
        <Card className="p-4">
          <h3 className="font-semibold text-slate-800 mb-3">Leads por Fonte</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={sourceData}>
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="leads" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Score Distribution */}
        <Card className="p-4">
          <h3 className="font-semibold text-slate-800 mb-3">Qualidade dos Leads</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={scoreData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {scoreData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Actions */}
        <Button
          onClick={() => navigate(createPageUrl('Leads'))}
          className="w-full h-12 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
        >
          Ver Todos os Leads
        </Button>
      </div>
    </div>
  );
}
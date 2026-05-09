import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Calendar, DollarSign, Zap, CheckCircle2, AlertCircle } from 'lucide-react';

export default function AuditDashboard() {
  const [dateRange, setDateRange] = useState(7); // dias

  const { data: logs = [] } = useQuery({
    queryKey: ['audit-logs', dateRange],
    queryFn: async () => {
      const allLogs = await base44.entities.AuditLog?.list('-created_date', 200).catch(() => []);
      const cutoff = new Date(Date.now() - dateRange * 86400000);
      return allLogs.filter(l => new Date(l.created_date) > cutoff);
    },
    staleTime: 5 * 60 * 1000,
  });

  const stats = {
    totalActions: logs.length,
    totalCredits: logs.reduce((a, l) => a + (l.cost_credits || 0), 0),
    successRate: logs.length > 0 ? Math.round((logs.filter(l => l.success).length / logs.length) * 100) : 0,
    iaUsageCount: logs.filter(l => l.action?.includes('ia_')).length,
  };

  const byModule = {};
  logs.forEach(l => {
    byModule[l.module] = (byModule[l.module] || 0) + (l.cost_credits || 0);
  });

  const chartData = Object.entries(byModule).map(([module, credits]) => ({
    name: module,
    créditos: credits,
  }));

  const byDay = {};
  logs.forEach(l => {
    const date = new Date(l.created_date).toLocaleDateString('pt-BR');
    byDay[date] = (byDay[date] || 0) + (l.cost_credits || 0);
  });

  const dailyData = Object.entries(byDay).map(([date, credits]) => ({
    date,
    créditos: credits,
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 pb-20">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-black text-white mb-2">📊 Auditoria de Créditos</h1>
        <p className="text-slate-400 mb-6">Últimos {dateRange} dias</p>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <p className="text-xs text-slate-400 mb-2">Total de Ações</p>
              <p className="text-3xl font-black text-orange-400">{stats.totalActions}</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <p className="text-xs text-slate-400 mb-2">Créditos Consumidos</p>
              <p className="text-3xl font-black text-red-400">⚡ {Math.round(stats.totalCredits)}</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <p className="text-xs text-slate-400 mb-2">Taxa de Sucesso</p>
              <p className="text-3xl font-black text-green-400">{stats.successRate}%</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <p className="text-xs text-slate-400 mb-2">Ações com IA</p>
              <p className="text-3xl font-black text-purple-400">{stats.iaUsageCount}</p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Créditos por Módulo</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip
                    contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                    labelStyle={{ color: '#e2e8f0' }}
                  />
                  <Bar dataKey="créditos" fill="#ff6b00" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Créditos por Dia</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip
                    contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: '8px' }}
                    labelStyle={{ color: '#e2e8f0' }}
                  />
                  <Bar dataKey="créditos" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Últimas Ações */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Últimas Ações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {logs.slice(0, 20).map((log, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-700/50 border border-slate-600">
                  <div className="flex-1">
                    <p className="text-sm text-white font-semibold">{log.module}</p>
                    <p className="text-xs text-slate-400">{log.action}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(log.created_date).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      className={log.success ? 'bg-green-600' : 'bg-red-600'}
                    >
                      {log.success ? '✓' : '✗'}
                    </Badge>
                    <span className="text-sm font-bold text-orange-400">
                      ⚡ {Math.round(log.cost_credits || 0)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
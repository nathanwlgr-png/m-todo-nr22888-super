import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  Download, Filter, TrendingUp, AlertTriangle, CheckCircle2,
  Clock, DollarSign, Zap, Users
} from 'lucide-react';
import { toast } from 'sonner';

export default function ExecutiveAudit() {
  const [filterModule, setFilterModule] = useState('');
  const [filterDays, setFilterDays] = useState(7);

  const { data: auditLogs = [] } = useQuery({
    queryKey: ['audit-logs', filterModule, filterDays],
    queryFn: async () => {
      const logs = await base44.entities.AuditLog.list('-created_date', 500);
      const cutoff = new Date(Date.now() - filterDays * 24 * 60 * 60 * 1000);
      
      return logs
        .filter(l => new Date(l.created_date) > cutoff)
        .filter(l => !filterModule || l.module === filterModule);
    },
    staleTime: 10 * 60 * 1000, // 10 min
  });

  // Métricas
  const totalActions = auditLogs.length;
  const successRate = auditLogs.length > 0
    ? Math.round((auditLogs.filter(l => l.success).length / totalActions) * 100)
    : 0;
  const totalCredits = auditLogs.reduce((acc, l) => acc + (l.cost_credits || 0), 0);
  const avgDuration = auditLogs.length > 0
    ? Math.round(auditLogs.reduce((acc, l) => acc + (l.duration_ms || 0), 0) / totalActions)
    : 0;

  // Dados para gráficos
  const byAction = Object.entries(
    auditLogs.reduce((acc, l) => ({
      ...acc,
      [l.action]: (acc[l.action] || 0) + 1
    }), {})
  ).map(([action, count]) => ({ name: action, value: count }));

  const byModule = Object.entries(
    auditLogs.reduce((acc, l) => ({
      ...acc,
      [l.module]: (acc[l.module] || 0) + 1
    }), {})
  ).map(([module, count]) => ({ name: module, value: count }));

  const costByModule = Object.entries(
    auditLogs.reduce((acc, l) => ({
      ...acc,
      [l.module]: (acc[l.module] || 0) + (l.cost_credits || 0)
    }), {})
  ).map(([module, cost]) => ({ name: module, value: cost }));

  const timelineData = auditLogs
    .sort((a, b) => new Date(a.created_date) - new Date(b.created_date))
    .slice(-30)
    .map(l => ({
      time: new Date(l.created_date).toLocaleDateString('pt-BR'),
      credits: l.cost_credits || 0
    }))
    .reduce((acc, item) => {
      const existing = acc.find(a => a.time === item.time);
      if (existing) {
        existing.credits += item.credits;
      } else {
        acc.push(item);
      }
      return acc;
    }, []);

  // Export PDF
  const handleExportPDF = async () => {
    try {
      toast.info('📄 Gerando PDF...');
      
      const report = `
RELATÓRIO EXECUTIVO DE AUDITORIA
Data: ${new Date().toLocaleDateString('pt-BR')}
Período: ${filterDays} dias

RESUMO:
- Total de ações: ${totalActions}
- Taxa de sucesso: ${successRate}%
- Créditos consumidos: ${totalCredits}
- Duração média: ${avgDuration}ms

AÇÕES:
${byAction.map(a => `- ${a.name}: ${a.value}`).join('\n')}

MÓDULOS:
${byModule.map(m => `- ${m.name}: ${m.value}`).join('\n')}

CUSTO POR MÓDULO:
${costByModule.map(c => `- ${c.name}: ${c.value} créditos`).join('\n')}

${auditLogs.slice(0, 50).map(l => `
${l.action} | ${l.module} | ${l.user_email}
${new Date(l.created_date).toLocaleString('pt-BR')} | ${l.cost_credits} créditos | ${l.duration_ms}ms | ${l.success ? '✅' : '❌'}
`).join('')}
`;

      const blob = new Blob([report], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `auditoria-${new Date().toISOString().split('T')[0]}.txt`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success('✅ PDF exportado!');
    } catch (e) {
      toast.error('Erro ao exportar');
    }
  };

  const handleExportCSV = async () => {
    try {
      const csv = [
        ['Ação', 'Módulo', 'Email', 'Data', 'Duração (ms)', 'Créditos', 'Sucesso'],
        ...auditLogs.map(l => [
          l.action,
          l.module,
          l.user_email,
          new Date(l.created_date).toLocaleString('pt-BR'),
          l.duration_ms,
          l.cost_credits,
          l.success ? 'Sim' : 'Não'
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `auditoria-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success('✅ CSV exportado!');
    } catch (e) {
      toast.error('Erro ao exportar');
    }
  };

  const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 pb-20">
      <div className="max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-slate-900 mb-2">📊 Auditoria Executiva</h1>
          <p className="text-slate-600">Consumo de IA, performance e custo do sistema</p>
        </div>

        {/* FILTROS */}
        <div className="bg-white rounded-xl p-4 mb-6 border border-slate-200 flex gap-4 flex-wrap">
          <select
            value={filterModule}
            onChange={(e) => setFilterModule(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
          >
            <option value="">Todos os módulos</option>
            {byModule.map(m => (
              <option key={m.name} value={m.name}>{m.name}</option>
            ))}
          </select>

          <select
            value={filterDays}
            onChange={(e) => setFilterDays(Number(e.target.value))}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm"
          >
            <option value={1}>Últimas 24h</option>
            <option value={7}>Últimos 7 dias</option>
            <option value={30}>Últimos 30 dias</option>
            <option value={90}>Últimos 90 dias</option>
          </select>

          <Button onClick={handleExportPDF} size="sm" variant="outline" className="gap-2">
            <Download className="w-4 h-4" /> TXT
          </Button>
          <Button onClick={handleExportCSV} size="sm" variant="outline" className="gap-2">
            <Download className="w-4 h-4" /> CSV
          </Button>
        </div>

        {/* KPI CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Zap className="w-4 h-4" /> Total de Ações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-slate-900">{totalActions}</div>
              <p className="text-xs text-slate-500 mt-1">últimos {filterDays} dias</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Taxa Sucesso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-green-600">{successRate}%</div>
              <p className="text-xs text-slate-500 mt-1">ações bem-sucedidas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <DollarSign className="w-4 h-4" /> Créditos IA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-blue-600">{totalCredits}</div>
              <p className="text-xs text-slate-500 mt-1">consumidos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Velocidade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black text-purple-600">{avgDuration}ms</div>
              <p className="text-xs text-slate-500 mt-1">duração média</p>
            </CardContent>
          </Card>
        </div>

        {/* GRÁFICOS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Por Tipo de Ação</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={byAction} cx="50%" cy="50%" labelLine={false} label={{ fontSize: 12 }} outerRadius={100} fill="#8884d8" dataKey="value">
                    {byAction.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Por Módulo</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={byModule}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Timeline: Consumo de Créditos</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" fontSize={12} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="credits" stroke="#f59e0b" name="Créditos/dia" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Custo por Módulo</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={costByModule} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#ef4444" name="Créditos" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* LOG DETALHADO */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Log Detalhado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="text-left p-2">Ação</th>
                    <th className="text-left p-2">Módulo</th>
                    <th className="text-left p-2">Usuário</th>
                    <th className="text-left p-2">Data/Hora</th>
                    <th className="text-left p-2">Duração</th>
                    <th className="text-left p-2">Créditos</th>
                    <th className="text-left p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.slice(0, 50).map(log => (
                    <tr key={log.id} className="border-b hover:bg-slate-50">
                      <td className="p-2 font-mono text-xs">{log.action}</td>
                      <td className="p-2">{log.module}</td>
                      <td className="p-2 text-xs text-slate-600">{log.user_email}</td>
                      <td className="p-2 text-xs">{new Date(log.created_date).toLocaleString('pt-BR')}</td>
                      <td className="p-2 font-mono text-xs">{log.duration_ms}ms</td>
                      <td className="p-2 font-bold text-blue-600">{log.cost_credits}</td>
                      <td className="p-2">
                        <Badge className={log.success ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}>
                          {log.success ? '✅' : '❌'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
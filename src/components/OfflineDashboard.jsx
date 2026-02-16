import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

export default function OfflineDashboard() {
  const [user, setUser] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const allEntries = await base44.entities.OfflineDataEntry.filter({
        user_email: currentUser.email
      });

      // Filtrar por período
      const now = new Date();
      const filtered = allEntries.filter(e => {
        const entryDate = new Date(e.entry_date);
        if (period === 'week') {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return entryDate >= weekAgo;
        } else if (period === 'month') {
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return entryDate >= monthAgo;
        }
        return true;
      });

      setEntries(filtered);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calcular métricas
  const metrics = {
    totalVisits: entries.filter(e => e.entry_type === 'visita').length,
    totalSales: entries.filter(e => e.entry_type === 'venda').length,
    conversionRate: entries.filter(e => e.entry_type === 'visita').length > 0
      ? ((entries.filter(e => e.entry_type === 'venda').length / entries.filter(e => e.entry_type === 'visita').length) * 100).toFixed(1)
      : 0,
    totalRevenue: entries
      .filter(e => e.entry_type === 'venda' && e.sale_value)
      .reduce((sum, e) => sum + parseFloat(e.sale_value || 0), 0),
    unsynced: entries.filter(e => !e.synced).length
  };

  // Dados por cidade
  const visitsByCity = {};
  entries.forEach(e => {
    if (e.city) {
      visitsByCity[e.city] = (visitsByCity[e.city] || 0) + 1;
    }
  });

  const cityData = Object.entries(visitsByCity).map(([city, count]) => ({
    name: city,
    visitas: count
  }));

  // Dados por equipamento
  const salesByEquipment = {};
  entries.forEach(e => {
    if (e.entry_type === 'venda' && e.equipment_sold) {
      salesByEquipment[e.equipment_sold] = (salesByEquipment[e.equipment_sold] || 0) + 1;
    }
  });

  const equipmentData = Object.entries(salesByEquipment).map(([eq, count]) => ({
    name: eq,
    vendas: count
  }));

  // Desempenho diário
  const dailyData = {};
  entries.forEach(e => {
    const date = e.entry_date;
    if (!dailyData[date]) {
      dailyData[date] = { date, visitas: 0, vendas: 0 };
    }
    if (e.entry_type === 'visita') dailyData[date].visitas++;
    if (e.entry_type === 'venda') dailyData[date].vendas++;
  });

  const dailyPerformance = Object.values(dailyData)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(-7);

  const COLORS = ['#06B6D4', '#0EA5E9', '#3B82F6', '#8B5CF6', '#EC4899'];

  if (loading) return <p className="text-slate-500">Carregando dashboard...</p>;

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="p-5 bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-300">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-800">Dashboard Offline</h3>
            <p className="text-sm text-slate-600">Dados locais não sincronizados</p>
          </div>
          <Badge className={metrics.unsynced > 0 ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}>
            {metrics.unsynced} pendente(s)
          </Badge>
        </div>
      </Card>

      {/* Filtro de período */}
      <div className="flex gap-2 justify-center">
        {['week', 'month', 'all'].map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              period === p
                ? 'bg-indigo-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {p === 'week' ? 'Semana' : p === 'month' ? 'Mês' : 'Tudo'}
          </button>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="p-4 text-center bg-blue-50 border-blue-200">
          <p className="text-xs text-blue-600 font-semibold">Visitas</p>
          <p className="text-3xl font-bold text-blue-700 mt-2">{metrics.totalVisits}</p>
        </Card>
        <Card className="p-4 text-center bg-green-50 border-green-200">
          <p className="text-xs text-green-600 font-semibold">Vendas</p>
          <p className="text-3xl font-bold text-green-700 mt-2">{metrics.totalSales}</p>
        </Card>
        <Card className="p-4 text-center bg-purple-50 border-purple-200">
          <p className="text-xs text-purple-600 font-semibold">Conversão</p>
          <p className="text-3xl font-bold text-purple-700 mt-2">{metrics.conversionRate}%</p>
        </Card>
        <Card className="p-4 text-center bg-orange-50 border-orange-200">
          <p className="text-xs text-orange-600 font-semibold">Receita</p>
          <p className="text-2xl font-bold text-orange-700 mt-2">R$ {(metrics.totalRevenue / 1000).toFixed(1)}k</p>
        </Card>
        <Card className="p-4 text-center bg-red-50 border-red-200">
          <p className="text-xs text-red-600 font-semibold">Pendentes</p>
          <p className="text-3xl font-bold text-red-700 mt-2">{metrics.unsynced}</p>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Desempenho Diário */}
        {dailyPerformance.length > 0 && (
          <Card className="p-4 bg-white border-slate-200">
            <h4 className="font-semibold text-slate-800 mb-3">Desempenho Diário</h4>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={dailyPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="visitas" stroke="#0EA5E9" name="Visitas" />
                <Line type="monotone" dataKey="vendas" stroke="#10B981" name="Vendas" />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Visitas por Cidade */}
        {cityData.length > 0 && (
          <Card className="p-4 bg-white border-slate-200">
            <h4 className="font-semibold text-slate-800 mb-3">Visitas por Cidade</h4>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={cityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="visitas" fill="#06B6D4" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Vendas por Equipamento */}
        {equipmentData.length > 0 && (
          <Card className="p-4 bg-white border-slate-200">
            <h4 className="font-semibold text-slate-800 mb-3">Vendas por Equipamento</h4>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={equipmentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="vendas"
                >
                  {equipmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>

      {/* Aviso de sincronização */}
      {metrics.unsynced > 0 && (
        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <div>
              <p className="font-semibold text-slate-800">Dados não sincronizados</p>
              <p className="text-sm text-slate-600">Você tem {metrics.unsynced} registros aguardando sincronização com o servidor.</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
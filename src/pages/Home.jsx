import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  UserPlus, 
  Users, 
  Sparkles,
  TrendingUp,
  ThermometerSun,
  MapPin,
  DollarSign,
  Target,
  Calendar,
  Search
} from 'lucide-react';
import ClientCard from '@/components/ClientCard';
import StatusPieChart from '@/components/dashboard/StatusPieChart.jsx';
import RevenueChart from '@/components/dashboard/RevenueChart.jsx';
import ClientsMap from '@/components/dashboard/ClientsMap.jsx';

export default function Home() {
  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-updated_date', 100),
  });

  const metrics = useMemo(() => {
    const hotClients = clients.filter(c => c.status === 'quente').length;
    const warmClients = clients.filter(c => c.status === 'morno').length;
    const coldClients = clients.filter(c => c.status === 'frio').length;
    
    const totalRevenue = clients.reduce((sum, c) => sum + (c.projected_revenue || 0), 0);
    const avgScore = clients.length > 0 
      ? Math.round(clients.reduce((sum, c) => sum + (c.purchase_score || 0), 0) / clients.length)
      : 0;
    
    return {
      total: clients.length,
      hot: hotClients,
      warm: warmClients,
      cold: coldClients,
      totalRevenue,
      avgScore
    };
  }, [clients]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <div className="relative bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-6 pt-12 pb-20 rounded-b-[2.5rem] overflow-hidden tech-grid">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl"></div>
        
        <div className="relative flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center glow-orange">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">Método NR</h1>
            <p className="text-orange-300 text-sm font-medium">Sistema de Vendas Inteligente</p>
          </div>
          <Link to={createPageUrl('GlobalSearch')}>
            <button className="w-10 h-10 rounded-xl glass hover:bg-white/10 transition-all">
              <Search className="w-5 h-5 text-orange-400 mx-auto" />
            </button>
          </Link>
        </div>

        <p className="relative text-slate-200 text-lg font-light">
          Qual cliente você vai atender agora?
        </p>
      </div>

      {/* Quick Stats */}
      <div className="px-6 -mt-10">
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4 bg-white shadow-lg border-none">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                <Users className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{metrics.total}</p>
                <p className="text-xs text-slate-500">Total</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 bg-white shadow-lg border-none">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <ThermometerSun className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{metrics.hot}</p>
                <p className="text-xs text-slate-500">Quentes</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 bg-white shadow-lg border-none">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-800">
                  R$ {(metrics.totalRevenue / 1000).toFixed(0)}k
                </p>
                <p className="text-xs text-slate-500">Pipeline</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 bg-white shadow-lg border-none">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <Target className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800">{metrics.avgScore}%</p>
                <p className="text-xs text-slate-500">Score Médio</p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Dashboard Charts */}
      <div className="px-6 mt-6 space-y-4">
        {/* Status Distribution */}
        <Card className="p-4 bg-white shadow-md border-none">
          <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <ThermometerSun className="w-4 h-4" />
            Distribuição por Status
          </h3>
          <StatusPieChart 
            hot={metrics.hot} 
            warm={metrics.warm} 
            cold={metrics.cold} 
          />
        </Card>

        {/* Revenue by Status */}
        <Card className="p-4 bg-white shadow-md border-none">
          <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Receita por Status
          </h3>
          <RevenueChart clients={clients} />
        </Card>

        {/* Map */}
        <Card className="p-4 bg-white shadow-md border-none">
          <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Distribuição Geográfica
          </h3>
          <ClientsMap clients={clients} />
        </Card>
      </div>

      {/* Main Actions */}
      <div className="px-6 mt-6 space-y-4">
        <Link to={createPageUrl('NewClient')}>
          <Button className="w-full h-16 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 rounded-2xl text-lg font-semibold shadow-lg shadow-orange-500/30 transition-all active:scale-[0.98] glow-orange">
            <UserPlus className="w-5 h-5 mr-3" />
            Novo Cliente
          </Button>
        </Link>

        <div className="grid grid-cols-2 gap-4">
          <Link to={createPageUrl('Clients')}>
            <Button variant="outline" className="w-full h-14 rounded-xl border-2 hover:bg-slate-50">
              <Users className="w-4 h-4 mr-2" />
              Clientes Ativos
            </Button>
          </Link>
          
          <Link to={createPageUrl('ClientsByCity')}>
            <Button variant="outline" className="w-full h-14 rounded-xl border-2 hover:bg-slate-50">
              <MapPin className="w-4 h-4 mr-2" />
              Por Cidade
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Link to={createPageUrl('Calendar')}>
            <Button variant="outline" className="w-full h-14 rounded-xl border-2 hover:bg-slate-50">
              <Calendar className="w-4 h-4 mr-2" />
              Agenda
            </Button>
          </Link>

          <Link to={createPageUrl('Tasks')}>
            <Button variant="outline" className="w-full h-14 rounded-xl border-2 hover:bg-slate-50">
              <Target className="w-4 h-4 mr-2" />
              Tarefas
            </Button>
          </Link>
        </div>

        <Link to={createPageUrl('Reports')}>
          <Button variant="outline" className="w-full h-14 rounded-xl border-2 hover:bg-slate-50">
            <TrendingUp className="w-4 h-4 mr-2" />
            Relatórios
          </Button>
        </Link>
      </div>

      {/* Recent Clients */}
      {clients.length > 0 && (
        <div className="px-6 mt-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800">Últimos Clientes</h2>
            <Link to={createPageUrl('Clients')} className="text-sm text-indigo-600 font-medium">
              Ver todos
            </Link>
          </div>
          
          <div className="space-y-3">
            {clients.slice(0, 3).map((client) => (
              <ClientCard key={client.id} client={client} />
            ))}
          </div>
        </div>
      )}
      
      <div className="h-24" />
    </div>
  );
}
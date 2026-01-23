import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Target,
  Calendar,
  Zap,
  AlertCircle
} from 'lucide-react';

export default function SmartDashboardMetrics() {
  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => base44.entities.Client.list('-updated_date', 500),
    staleTime: 5 * 60 * 1000
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['sales'],
    queryFn: () => base44.entities.Sale.list('-sale_date', 200),
    staleTime: 5 * 60 * 1000
  });

  const { data: visits = [] } = useQuery({
    queryKey: ['visits'],
    queryFn: () => base44.entities.Visit.list('-scheduled_date', 100),
    staleTime: 5 * 60 * 1000
  });

  // Métricas
  const totalClients = clients.length;
  const hotClients = clients.filter(c => c.status === 'quente').length;
  const atRiskClients = clients.filter(c => {
    const lastContact = c.last_contact_date || c.created_date;
    const daysSince = lastContact ? Math.floor((new Date() - new Date(lastContact)) / (1000 * 60 * 60 * 24)) : 999;
    return daysSince > 30;
  }).length;

  const last30Days = sales.filter(s => {
    const saleDate = new Date(s.sale_date);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return saleDate >= thirtyDaysAgo;
  });

  const totalRevenue = last30Days.reduce((sum, s) => sum + (s.sale_value || 0), 0);
  const avgTicket = last30Days.length > 0 ? totalRevenue / last30Days.length : 0;

  const today = new Date().toISOString().split('T')[0];
  const todayVisits = visits.filter(v => v.scheduled_date?.startsWith(today)).length;

  const metrics = [
    {
      icon: Users,
      titulo: 'Clientes',
      valor: totalClients,
      subtitulo: `${hotClients} quentes`,
      cor: 'text-blue-600',
      bg: 'bg-blue-50',
      tendencia: hotClients > 0 ? 'up' : null
    },
    {
      icon: DollarSign,
      titulo: 'Receita 30d',
      valor: `R$ ${(totalRevenue / 1000).toFixed(0)}k`,
      subtitulo: `${last30Days.length} vendas`,
      cor: 'text-green-600',
      bg: 'bg-green-50',
      tendencia: last30Days.length > 0 ? 'up' : null
    },
    {
      icon: Target,
      titulo: 'Ticket Médio',
      valor: `R$ ${(avgTicket / 1000).toFixed(1)}k`,
      subtitulo: 'Últimos 30 dias',
      cor: 'text-purple-600',
      bg: 'bg-purple-50',
      tendencia: avgTicket > 50000 ? 'up' : null
    },
    {
      icon: Calendar,
      titulo: 'Visitas Hoje',
      valor: todayVisits,
      subtitulo: 'Agendadas',
      cor: 'text-indigo-600',
      bg: 'bg-indigo-50',
      tendencia: null
    }
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {metrics.map((metric, i) => {
          const Icon = metric.icon;
          return (
            <Card key={i} className={`p-3 ${metric.bg} border-none`}>
              <div className="flex items-start justify-between mb-2">
                <Icon className={`w-5 h-5 ${metric.cor}`} />
                {metric.tendencia === 'up' && (
                  <TrendingUp className="w-4 h-4 text-green-600" />
                )}
                {metric.tendencia === 'down' && (
                  <TrendingDown className="w-4 h-4 text-red-600" />
                )}
              </div>
              <p className="text-xs text-slate-600 mb-1">{metric.titulo}</p>
              <p className={`text-2xl font-bold ${metric.cor}`}>{metric.valor}</p>
              <p className="text-xs text-slate-500 mt-1">{metric.subtitulo}</p>
            </Card>
          );
        })}
      </div>

      {/* Alertas Inteligentes */}
      {atRiskClients > 0 && (
        <Card className="p-3 bg-yellow-50 border-yellow-200">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-yellow-800">
                {atRiskClients} clientes em risco
              </p>
              <p className="text-xs text-yellow-600 mt-1">
                Sem contato há mais de 30 dias. Ação recomendada: follow-up urgente.
              </p>
            </div>
            <Badge className="bg-yellow-600">
              <Zap className="w-3 h-3" />
            </Badge>
          </div>
        </Card>
      )}
    </div>
  );
}
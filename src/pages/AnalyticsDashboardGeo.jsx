import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, TrendingUp, Users, Target } from 'lucide-react';
import GeoMapClients from '@/components/GeoMapClients';
import CityAnalyticsCard from '@/components/CityAnalyticsCard';
import SmartMapRoute from '@/components/SmartMapRoute';

// Dashboard geográfico de vendas com mapa DataWrapper + Rota Otimizada
export default function AnalyticsDashboardGeo() {
  const [activeTab, setActiveTab] = useState('geografia');

  const { data: clients = [] } = useQuery({
    queryKey: ['geo-clients'],
    queryFn: () => base44.entities.Client.list()
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['geo-sales'],
    queryFn: () => base44.entities.Sale.list('-sale_date')
  });

  // Agregar por cidade
  const byCity = clients.reduce((acc, c) => {
    const city = c.city || 'Outro';
    acc[city] = (acc[city] || 0) + 1;
    return acc;
  }, {});

  const topCities = Object.entries(byCity)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="space-y-3">
      {/* KPIs Rápidos */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Clientes', value: clients.length, icon: Users, color: 'text-blue-600' },
          { label: 'Cidades', value: Object.keys(byCity).length, icon: MapPin, color: 'text-red-600' },
          { label: 'Vendas', value: sales.length, icon: TrendingUp, color: 'text-green-600' },
          { label: 'Receita', value: `R$${(sales.reduce((s, v) => s + (v.sale_value || 0), 0) / 1000).toFixed(0)}k`, icon: Target, color: 'text-purple-600' }
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <Card key={idx}>
              <CardContent className="p-2.5 text-center">
                <Icon className={`w-4 h-4 mx-auto mb-1 ${kpi.color}`} />
                <p className={`text-base font-bold ${kpi.color}`}>{kpi.value}</p>
                <p className="text-[10px] text-slate-500">{kpi.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tabs Principais */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="geografia" className="text-xs">🗺️ Geografia</TabsTrigger>
          <TabsTrigger value="rotas" className="text-xs">📍 Rotas</TabsTrigger>
          <TabsTrigger value="cidades" className="text-xs">🏘️ Cidades</TabsTrigger>
        </TabsList>

        {/* TAB 1: Mapa Geográfico */}
        <TabsContent value="geografia" className="space-y-2">
          <p className="text-xs text-slate-600 font-semibold">Clientes por localização • 🟢Quente 🟡Morno 🔵Frio</p>
          <GeoMapClients clients={clients} />
        </TabsContent>

        {/* TAB 2: Rotas Otimizadas */}
        <TabsContent value="rotas" className="space-y-2">
          <p className="text-xs text-slate-600 font-semibold">Selecione clientes e otimize sua rota de visita.</p>
          <SmartMapRoute clientsData={clients} center={[-22.2141, -49.9477]} />
        </TabsContent>

        {/* TAB 3: Análise por Cidade */}
        <TabsContent value="cidades" className="space-y-2">
          <CityAnalyticsCard clients={clients} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
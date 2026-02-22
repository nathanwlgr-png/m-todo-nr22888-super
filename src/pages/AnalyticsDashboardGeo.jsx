import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, TrendingUp, Users, Target } from 'lucide-react';
import DataWrapperDashboard from '@/components/DataWrapperDashboard';
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

        {/* TAB 1: Geografia DataWrapper */}
        <TabsContent value="geografia" className="space-y-2">
          <p className="text-xs text-slate-600 font-semibold">Mapa interativo de vendas por region. Click em região para detalhes.</p>
          <DataWrapperDashboard />
        </TabsContent>

        {/* TAB 2: Rotas Otimizadas */}
        <TabsContent value="rotas" className="space-y-2">
          <p className="text-xs text-slate-600 font-semibold">Selecione clientes e otimize sua rota de visita.</p>
          <SmartMapRoute clientsData={clients} center={[-22.2141, -49.9477]} />
        </TabsContent>

        {/* TAB 3: Top Cidades */}
        <TabsContent value="cidades" className="space-y-2">
          <Card>
            <CardContent className="p-2.5">
              <p className="text-xs font-bold text-slate-700 mb-2">🏘️ TOP 5 CIDADES</p>
              <div className="space-y-1">
                {topCities.map(([city, count], idx) => (
                  <div key={city} className="flex items-center justify-between text-xs p-1.5 bg-slate-50 rounded">
                    <div className="flex items-center gap-2">
                      <span className="bg-indigo-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold">{idx + 1}</span>
                      <span className="font-semibold">{city}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-1 bg-indigo-200 rounded" style={{ width: `${(count / Math.max(...Object.values(byCity))) * 60}px` }} />
                      <span className="w-6 text-right font-bold text-indigo-600">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Clientes por Cidade Selecionada */}
          <Card>
            <CardContent className="p-2.5">
              <p className="text-xs font-bold text-slate-700 mb-2">📋 Distribuição Completa</p>
              <div className="grid grid-cols-2 gap-1 max-h-40 overflow-y-auto">
                {Object.entries(byCity)
                  .sort((a, b) => b[1] - a[1])
                  .map(([city, count]) => (
                    <div key={city} className="text-[9px] bg-slate-50 p-1 rounded flex justify-between">
                      <span>{city}</span>
                      <span className="font-bold text-indigo-600">{count}</span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
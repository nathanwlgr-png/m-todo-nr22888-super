import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Loader2, BarChart3, TrendingUp, Users, Flame } from 'lucide-react';

import SalesPerformanceByUser from '@/components/reports/SalesPerformanceByUser';
import PipelineAnalysis from '@/components/reports/PipelineAnalysis';
import ProductTypePerformance from '@/components/reports/ProductTypePerformance';
import ClientsByStatus from '@/components/reports/ClientsByStatus';

export default function ReportsAdvanced() {
  const navigate = useNavigate();
  
  const [dateFilter, setDateFilter] = useState({
    start: '',
    end: ''
  });

  const { data: sales = [], isLoading: loadingSales } = useQuery({
    queryKey: ['sales-reports'],
    queryFn: () => base44.entities.Sale.list('-sale_date', 1000)
  });

  const { data: clients = [], isLoading: loadingClients } = useQuery({
    queryKey: ['clients-reports'],
    queryFn: () => base44.entities.Client.list('-updated_date', 1000)
  });

  const { data: interactions = [], isLoading: loadingInteractions } = useQuery({
    queryKey: ['interactions-reports'],
    queryFn: () => base44.entities.Interaction.list('-created_date', 1000)
  });

  const isLoading = loadingSales || loadingClients || loadingInteractions;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-slate-100">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-slate-800">Relatórios Avançados</h1>
            <p className="text-xs text-slate-500">Análise completa de performance</p>
          </div>
        </div>
      </div>

      {/* Date Filters */}
      <div className="p-4 bg-white border-b">
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <Label className="text-xs">Data Início</Label>
            <Input
              type="date"
              value={dateFilter.start}
              onChange={(e) => setDateFilter({ ...dateFilter, start: e.target.value })}
              className="h-10"
            />
          </div>
          <div className="flex-1">
            <Label className="text-xs">Data Fim</Label>
            <Input
              type="date"
              value={dateFilter.end}
              onChange={(e) => setDateFilter({ ...dateFilter, end: e.target.value })}
              className="h-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setDateFilter({ start: '', end: '' })}
            className="h-10"
          >
            Limpar
          </Button>
        </div>
        {dateFilter.start && dateFilter.end && (
          <p className="text-xs text-indigo-600 mt-2">
            📅 Período: {new Date(dateFilter.start).toLocaleDateString()} até {new Date(dateFilter.end).toLocaleDateString()}
          </p>
        )}
      </div>

      {/* Tabs */}
      <div className="p-4">
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="users" className="text-xs">
              <Users className="w-3 h-3 mr-1" />
              Vendedores
            </TabsTrigger>
            <TabsTrigger value="pipeline" className="text-xs">
              <TrendingUp className="w-3 h-3 mr-1" />
              Pipeline
            </TabsTrigger>
            <TabsTrigger value="products" className="text-xs">
              <BarChart3 className="w-3 h-3 mr-1" />
              Produtos
            </TabsTrigger>
            <TabsTrigger value="status" className="text-xs">
              <Flame className="w-3 h-3 mr-1" />
              Status
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <Card className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
              <h2 className="font-semibold text-indigo-900 mb-1">Performance por Vendedor</h2>
              <p className="text-xs text-indigo-600">
                Ranking de vendas por valor total, número de vendas e ticket médio
              </p>
            </Card>
            <SalesPerformanceByUser sales={sales} dateFilter={dateFilter} />
          </TabsContent>

          <TabsContent value="pipeline" className="space-y-4">
            <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
              <h2 className="font-semibold text-purple-900 mb-1">Análise de Pipeline</h2>
              <p className="text-xs text-purple-600">
                Clientes por etapa e tempo médio em cada fase
              </p>
            </Card>
            <PipelineAnalysis clients={clients} interactions={interactions} />
          </TabsContent>

          <TabsContent value="products" className="space-y-4">
            <Card className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
              <h2 className="font-semibold text-blue-900 mb-1">Desempenho por Tipo</h2>
              <p className="text-xs text-blue-600">
                Comparação entre máquinas e insumos
              </p>
            </Card>
            <ProductTypePerformance sales={sales} dateFilter={dateFilter} />
          </TabsContent>

          <TabsContent value="status" className="space-y-4">
            <Card className="p-4 bg-gradient-to-r from-red-50 to-orange-50 border-red-200">
              <h2 className="font-semibold text-red-900 mb-1">Clientes por Status</h2>
              <p className="text-xs text-red-600">
                Distribuição e análise de quente, morno e frio
              </p>
            </Card>
            <ClientsByStatus clients={clients} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
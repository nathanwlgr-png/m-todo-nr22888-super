import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import InteractiveFunnelVisual from '@/components/InteractiveFunnelVisual';
import FunnelAnalytics from '@/components/FunnelAnalytics';

export default function AdvancedFunnelManager() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b shadow-sm px-4 py-4 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-slate-100">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">🎯 Gerenciador Avançado de Funil</h1>
            <p className="text-sm text-slate-600">Arraste clientes entre etapas e veja otimizações em tempo real</p>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <Tabs defaultValue="funnel" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="funnel">🎯 Funil Interativo</TabsTrigger>
            <TabsTrigger value="analytics">📊 Análise</TabsTrigger>
          </TabsList>

          <TabsContent value="funnel" className="space-y-4">
            <InteractiveFunnelVisual />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <FunnelAnalytics />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
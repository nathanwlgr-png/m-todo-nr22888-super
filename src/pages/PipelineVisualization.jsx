import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LeadKanbanBoard from '@/components/LeadKanbanBoard';
import PipelineValueForecast from '@/components/PipelineValueForecast';
import { Card, CardContent } from '@/components/ui/card';

export default function PipelineVisualization() {
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">📊 Pipeline de Vendas</h1>
          <p className="text-slate-600">Visualize, organize e preveja seu pipeline com inteligência artificial</p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="kanban" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="kanban" className="flex items-center gap-2">
              📋 Quadro Kanban
            </TabsTrigger>
            <TabsTrigger value="forecast" className="flex items-center gap-2">
              📈 Previsão de Valor
            </TabsTrigger>
          </TabsList>

          {/* Kanban Tab */}
          <TabsContent value="kanban" className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-slate-800 mb-1">Arraste leads entre estágios</h2>
                  <p className="text-sm text-slate-600">A IA sugere o estágio ideal com base em score, histórico e sinais de compra</p>
                </div>
                <LeadKanbanBoard autoSuggestStage={true} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Forecast Tab */}
          <TabsContent value="forecast" className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-slate-800 mb-1">Previsão de Pipeline</h2>
                  <p className="text-sm text-slate-600">Valor esperado, probabilidades e previsão para os próximos 30, 60 e 90 dias</p>
                </div>
                <PipelineValueForecast />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
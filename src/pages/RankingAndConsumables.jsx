import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RankingDoDia from '@/components/RankingDoDia';
import GestaoInsumos from '@/components/GestaoInsumos';
import { Trophy, Package } from 'lucide-react';

export default function RankingAndConsumables() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pb-24 pt-4">
      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">

        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-slate-900 mb-2">
            🎯 Vendas & Insumos
          </h1>
          <p className="text-slate-600">Ranking do dia + Gestão de reposição de reagentes</p>
        </div>

        {/* TABS */}
        <Tabs defaultValue="ranking" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="ranking" className="gap-2">
              <Trophy className="w-4 h-4" />
              Ranking do Dia
            </TabsTrigger>
            <TabsTrigger value="consumables" className="gap-2">
              <Package className="w-4 h-4" />
              Gestão de Insumos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ranking" className="mt-0">
            <RankingDoDia />
          </TabsContent>

          <TabsContent value="consumables" className="mt-0">
            <GestaoInsumos />
          </TabsContent>
        </Tabs>

      </div>
    </div>
  );
}
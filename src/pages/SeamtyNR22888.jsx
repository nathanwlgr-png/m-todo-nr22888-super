import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CentralControl from '@/components/CentralControl';
import SuperMasterHunter from '@/components/SuperMasterHunter';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Settings, Search, Target } from 'lucide-react';

export default function SeamtyNR22888() {
  const [activeTab, setActiveTab] = useState('central');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 pb-24 pt-4">
      <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">

        {/* HEADER ÉPICO */}
        <div className="mb-8">
          <div className="text-center mb-6">
            <div className="text-5xl font-black text-white mb-2 drop-shadow-lg">
              🐼 SEAMATY NR22888
            </div>
            <div className="text-2xl font-bold text-orange-400 mb-2">
              DEEPTHUNTER SUPREMO
            </div>
            <p className="text-slate-300 max-w-2xl mx-auto">
              Central premium de vendas veterinárias. Venda 12+ máquinas/mês com máximo aproveitamento de recursos.
            </p>
          </div>

          {/* STATUS BOX */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <Card className="bg-slate-800 border-orange-500">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-slate-400">🎯 META MENSAL</p>
                <p className="text-2xl font-black text-orange-400">12+</p>
                <p className="text-xs text-slate-500">Máquinas Seamaty</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800 border-green-500">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-slate-400">🧠 MÓDULOS IA</p>
                <p className="text-2xl font-black text-green-400">8+</p>
                <p className="text-xs text-slate-500">Operacionais</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800 border-blue-500">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-slate-400">🌍 CIDADES</p>
                <p className="text-2xl font-black text-blue-400">10+</p>
                <p className="text-xs text-slate-500">Interior SP</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800 border-purple-500">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-slate-400">📱 DISPOSITIVOS</p>
                <p className="text-2xl font-black text-purple-400">∞</p>
                <p className="text-xs text-slate-500">Mobile-First</p>
              </CardContent>
            </Card>
          </div>

          {/* AVISO MODO VERDADE */}
          <Card className="bg-blue-900 border-blue-500 mb-6">
            <CardContent className="p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-100">
                <p className="font-bold">🔒 MODO VERDADE ABSOLUTA ATIVO</p>
                <p className="text-xs mt-1">Nunca inventar clientes, telefones, dados. Toda IA sob demanda. Cache 30 dias. Máx 25 leads.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* TABS */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 mb-8 bg-slate-800 border border-slate-700">
            <TabsTrigger value="central" className="gap-2">
              <Settings className="w-4 h-4" />
              Central ON/OFF
            </TabsTrigger>
            <TabsTrigger value="super_hunter" className="gap-2">
              <Search className="w-4 h-4" />
              Super Master
            </TabsTrigger>
            <TabsTrigger value="docs" className="gap-2">
              <AlertCircle className="w-4 h-4" />
              Docs
            </TabsTrigger>
          </TabsList>

          {/* CENTRAL */}
          <TabsContent value="central" className="mt-0">
            <div className="bg-slate-800 rounded-lg p-6 shadow-xl">
              <CentralControl />
            </div>
          </TabsContent>

          {/* SUPER MASTER HUNTER */}
          <TabsContent value="super_hunter" className="mt-0">
            <div className="bg-slate-800 rounded-lg p-6 shadow-xl">
              <SuperMasterHunter />
            </div>
          </TabsContent>

          {/* DOCS */}
          <TabsContent value="docs" className="mt-0">
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-6 text-slate-300 space-y-4">
                <div>
                  <p className="font-bold text-orange-400 mb-2">🎯 OBJETIVO PRINCIPAL</p>
                  <p className="text-sm">Vender 12+ máquinas Seamaty/mês com máximo aproveitamento de créditos IA.</p>
                </div>

                <div>
                  <p className="font-bold text-orange-400 mb-2">✅ PRINCÍPIOS</p>
                  <ul className="text-sm space-y-1">
                    <li>✓ Nunca inventar clientes, dados, telefones</li>
                    <li>✓ Toda IA sob demanda (zero automático)</li>
                    <li>✓ Cache inteligente 30 dias</li>
                    <li>✓ Máx 25 leads por busca</li>
                    <li>✓ Timeout 2 minutos</li>
                    <li>✓ Modo Verdade Absoluta obrigatório</li>
                    <li>✓ Mobile-first, tablet-friendly</li>
                  </ul>
                </div>

                <div>
                  <p className="font-bold text-orange-400 mb-2">📊 SCORING SEAMATY (0-100)</p>
                  <ul className="text-xs space-y-1 bg-slate-900 p-3 rounded">
                    <li>+20: Emergência / Pressa</li>
                    <li>+15: Envia exame para fora</li>
                    <li>+15: Cliente parado</li>
                    <li>+15: Cidade estratégica</li>
                    <li>+10: Crescimento visível</li>
                    <li>+10: Forte digital</li>
                    <li>+10: Comodato</li>
                    <li>+10: Gap equipamento</li>
                    <li>+5: Influência regional</li>
                    <li>+5: Potencial insumo</li>
                  </ul>
                </div>

                <div>
                  <p className="font-bold text-orange-400 mb-2">📍 CIDADES ATIVAS</p>
                  <p className="text-xs">Botucatu • Marília • Garça • Bauru • Ourinhos • Jaú • Assis • Lins • Tupã • Avaré</p>
                </div>

                <div>
                  <p className="font-bold text-orange-400 mb-2">🚫 BLOQUEADAS</p>
                  <p className="text-xs">Ribeirão Preto • Presidente Prudente</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

      </div>
    </div>
  );
}
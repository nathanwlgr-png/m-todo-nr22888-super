import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import CrossSellUpsellAnalyzer from '@/components/CrossSellUpsellAnalyzer';
import FunnelAnalysisAI from '@/components/FunnelAnalysisAI';
import ProspectingEmailSequenceGenerator from '@/components/ProspectingEmailSequenceGenerator';
import DemandForecastAI from '@/components/DemandForecastAI';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function SalesAIHub() {
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [selectedLeadId, setSelectedLeadId] = useState(null);

  const { data: clients = [] } = useQuery({
    queryKey: ['clients-hub'],
    queryFn: () => base44.entities.Client.list('-updated_date'),
  });

  const { data: leads = [] } = useQuery({
    queryKey: ['leads-hub'],
    queryFn: () => base44.entities.Lead.list('-updated_date'),
  });

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">🤖 Hub de IA para Vendas</h1>
          <p className="text-slate-600">Ferramentas inteligentes para cross-sell, funil e prospecção</p>
        </div>

        {/* Tabs */}
        {/* Demand Forecast — top of page */}
        <div className="mb-8">
          <DemandForecastAI />
        </div>

        <Tabs defaultValue="crosssell" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="crosssell">📈 Cross/Upsell</TabsTrigger>
            <TabsTrigger value="funnel">📊 Análise de Funil</TabsTrigger>
            <TabsTrigger value="email">✉️ Email Sequence</TabsTrigger>
          </TabsList>

          {/* Cross-sell/Upsell Tab */}
          <TabsContent value="crosssell" className="space-y-6">
            <Card>
              <CardContent className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-2 block">Selecione um cliente</label>
                  <Select value={selectedClientId || ''} onValueChange={setSelectedClientId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha um cliente..." />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map(c => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.first_name} {c.clinic_name ? `(${c.clinic_name})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedClientId && (
                  <CrossSellUpsellAnalyzer clientId={selectedClientId} />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Funnel Analysis Tab */}
          <TabsContent value="funnel" className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <div className="mb-4">
                  <p className="text-sm text-slate-600">Análise automática do funil de vendas em tempo real</p>
                </div>
                <FunnelAnalysisAI />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Email Sequence Tab */}
          <TabsContent value="email" className="space-y-6">
            <Card>
              <CardContent className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-2 block">Selecione um lead</label>
                  <Select value={selectedLeadId || ''} onValueChange={setSelectedLeadId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Escolha um lead..." />
                    </SelectTrigger>
                    <SelectContent>
                      {leads.map(l => (
                        <SelectItem key={l.id} value={l.id}>
                          {l.full_name} ({l.company})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedLeadId && (
                  <ProspectingEmailSequenceGenerator leadId={selectedLeadId} />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
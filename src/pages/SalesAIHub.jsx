import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

import DemandForecastAI from '@/components/DemandForecastAI';
import ProposalGoogleSlidesGenerator from '@/components/ProposalGoogleSlidesGenerator';
import CrossSellUpsellAnalyzer from '@/components/CrossSellUpsellAnalyzer';
import FunnelAnalysisAI from '@/components/FunnelAnalysisAI';
import ProspectingEmailSequenceGenerator from '@/components/ProspectingEmailSequenceGenerator';
import FollowUpSequenceAI from '@/components/FollowUpSequenceAI';
import WeeklyMonthlyReportAI from '@/components/WeeklyMonthlyReportAI';
import ProactiveReactivationAI from '@/components/ProactiveReactivationAI';
import MarketIntelligenceDeepScan from '@/components/MarketIntelligenceDeepScan';

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

  const selectedClient = clients.find(c => c.id === selectedClientId);

  const ClientSelector = ({ label = 'Selecione um cliente' }) => (
    <div>
      <label className="text-sm font-semibold text-slate-700 mb-2 block">{label}</label>
      <Select value={selectedClientId || ''} onValueChange={setSelectedClientId}>
        <SelectTrigger>
          <SelectValue placeholder="Escolha um cliente..." />
        </SelectTrigger>
        <SelectContent>
          {clients.map(c => (
            <SelectItem key={c.id} value={c.id}>
              {c.first_name} {c.clinic_name ? `(${c.clinic_name})` : ''} — Score: {c.purchase_score || 0}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">🤖 Hub de IA para Vendas NR22</h1>
          <p className="text-slate-600">IAs 21–25 + Proposta Slides + Inteligência de Mercado Profunda</p>
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-medium">IA 23 — Follow-Up Personalizado</span>
            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">IA 24 — Relatórios + Forecast</span>
            <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium">IA 25 — Reativação Proativa</span>
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">Proposta Google Slides</span>
            <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">IA 21/3 — Market Intelligence</span>
          </div>
        </div>

        {/* Demand Forecast — top */}
        <div className="mb-8">
          <DemandForecastAI />
        </div>

        <Tabs defaultValue="slides" className="w-full">
          <TabsList className="flex flex-wrap h-auto gap-1 mb-6 bg-slate-100 p-1">
            <TabsTrigger value="slides" className="text-xs">🎯 Proposta Slides</TabsTrigger>
            <TabsTrigger value="followup" className="text-xs">🔄 Follow-Up IA 23</TabsTrigger>
            <TabsTrigger value="reports" className="text-xs">📊 Relatórios IA 24</TabsTrigger>
            <TabsTrigger value="reativacao" className="text-xs">🔥 Reativação IA 25</TabsTrigger>
            <TabsTrigger value="mercado" className="text-xs">🌐 Mercado IA 21/3</TabsTrigger>
            <TabsTrigger value="crosssell" className="text-xs">📈 Cross/Upsell</TabsTrigger>
            <TabsTrigger value="funnel" className="text-xs">📊 Funil</TabsTrigger>
            <TabsTrigger value="email" className="text-xs">✉️ Email Seq.</TabsTrigger>
          </TabsList>

          {/* Google Slides Proposal Tab */}
          <TabsContent value="slides" className="space-y-6">
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ClientSelector label="Selecione um cliente para a proposta" />
                  <div className="text-sm text-slate-500 bg-indigo-50 rounded-lg p-3">
                    <p className="font-semibold text-indigo-700 mb-1">🎯 Como funciona:</p>
                    <p>• Selecione o cliente e o equipamento</p>
                    <p>• IA gera conteúdo personalizado (numerologia, dores, ROI)</p>
                    <p>• Cria 6 slides automáticos no Google Slides</p>
                    <p>• Compartilhe o link direto pelo WhatsApp</p>
                  </div>
                </div>
                {selectedClientId && <ProposalGoogleSlidesGenerator client={selectedClient} />}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Follow-Up IA 23 */}
          <TabsContent value="followup" className="space-y-6">
            <Card>
              <CardContent className="p-6 space-y-4">
                <ClientSelector label="Selecione o cliente para gerar a sequência" />
                {selectedClient && <FollowUpSequenceAI client={selectedClient} />}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Relatórios IA 24 */}
          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <WeeklyMonthlyReportAI />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reativação IA 25 */}
          <TabsContent value="reativacao" className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <ProactiveReactivationAI />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Market Intelligence IA 21/3 */}
          <TabsContent value="mercado" className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <MarketIntelligenceDeepScan />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cross-sell/Upsell Tab */}
          <TabsContent value="crosssell" className="space-y-6">
            <Card>
              <CardContent className="p-6 space-y-4">
                <ClientSelector />
                {selectedClientId && <CrossSellUpsellAnalyzer clientId={selectedClientId} />}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Funnel Analysis Tab */}
          <TabsContent value="funnel" className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-slate-600 mb-4">Análise automática do funil de vendas em tempo real</p>
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
                {selectedLeadId && <ProspectingEmailSequenceGenerator leadId={selectedLeadId} />}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
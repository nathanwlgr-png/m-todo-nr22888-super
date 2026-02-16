import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import OfflineDataEntryForm from '@/components/OfflineDataEntryForm';
import OfflineDashboard from '@/components/OfflineDashboard';
import SeamatyCatalogOffline from '@/components/SeamatyCatalogOffline';
import OfflineSyncService from '@/components/OfflineSyncService';
import SeamatyPriceTableViewer from '@/components/SeamatyPriceTableViewer';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, FileText, AlertCircle, Package } from 'lucide-react';
import { toast } from 'sonner';

export default function OfflineAnalytics() {
  const [generating, setGenerating] = useState(false);

  const generateReport = async () => {
    setGenerating(true);
    try {
      const result = await base44.functions.invoke('generateOfflineReport', {});
      toast.success(result.data.message);
    } catch (error) {
      toast.error('Erro ao gerar relatório');
    } finally {
      setGenerating(false);
    }
  };

  const loadCatalog = async () => {
    try {
      await base44.functions.invoke('processSeamatyCatalog', {});
      toast.success('Catálogo Seamaty carregado!');
    } catch (error) {
      toast.error('Erro ao carregar catálogo');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">Análise Offline</h1>
            <p className="text-slate-600 mt-1">Dados locais sem sincronização</p>
          </div>
          <Button
            onClick={generateReport}
            disabled={generating}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <FileText className="w-4 h-4 mr-2" />
            {generating ? 'Gerando...' : 'Gerar Relatório'}
          </Button>
        </div>

        {/* Abas Principais */}
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="entry">Registrar</TabsTrigger>
            <TabsTrigger value="catalog">Catálogo</TabsTrigger>
            <TabsTrigger value="prices">Preços SP</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="mt-4">
            <OfflineDashboard />
          </TabsContent>

          <TabsContent value="entry" className="mt-4">
            <div className="max-w-2xl mx-auto">
              <OfflineDataEntryForm />
            </div>
          </TabsContent>

          <TabsContent value="catalog" className="mt-4">
            <SeamatyCatalogOffline />
          </TabsContent>

          <TabsContent value="prices" className="mt-4">
            <SeamatyPriceTableViewer />
          </TabsContent>
        </Tabs>

        {/* Info Box */}
        <Card className="p-4 bg-blue-50 border-blue-200 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-slate-800">Como funciona?</p>
            <ul className="text-sm text-slate-700 mt-2 space-y-1">
              <li>✓ Registre visitas e vendas sem conexão</li>
              <li>✓ Dados são salvos localmente no seu dispositivo</li>
              <li>✓ Visualize gráficos e métricas em tempo real</li>
              <li>✓ Gere relatórios offline completos</li>
              <li>✓ Sincronize quando tiver internet</li>
            </ul>
          </div>
        </Card>
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Download, FileText, AlertCircle } from 'lucide-react';
import VisitBriefingCard from '@/components/VisitBriefingCard';

export default function VisitBriefing() {
  const [searchParams] = useSearchParams();
  const clientId = searchParams.get('clientId');
  const [downloading, setDownloading] = useState(false);

  const { data: client, isLoading: clientLoading } = useQuery({
    queryKey: ['client-briefing', clientId],
    queryFn: () => clientId ? base44.entities.Client.filter({ id: clientId }) : Promise.resolve([]),
    enabled: !!clientId,
  });

  const { data: inventory = [] } = useQuery({
    queryKey: ['seamaty-inventory-validated'],
    queryFn: () => base44.entities.SeamatyInventory?.filter({ validated: true }).catch(() => []),
    staleTime: 60000,
  });

  const clientData = client?.[0];

  const handleDownloadBriefing = async () => {
    if (!clientData) return;
    setDownloading(true);
    try {
      const doc = await base44.functions.invoke('generatePDFForWhatsApp', {
        type: 'visit_briefing',
        client_id: clientData.id,
        client_name: clientData.full_name,
        include_products: true
      });
      window.open(doc.file_url, '_blank');
    } catch (e) {
      console.error('Erro ao gerar PDF:', e);
    }
    setDownloading(false);
  };

  if (!clientId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-lg border-2 border-dashed border-slate-300 p-12 text-center">
            <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-lg text-slate-600 font-semibold">Selecione um cliente</p>
            <p className="text-sm text-slate-500 mt-2">Abra um perfil de cliente e clique em "Briefing de Visita"</p>
          </div>
        </div>
      </div>
    );
  }

  if (clientLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!clientData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-lg text-red-600 font-semibold">Cliente não encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 pb-20">
      <div className="max-w-6xl mx-auto p-4 md:p-6">

        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-black text-indigo-900 mb-2 flex items-center gap-3">
            📋 Briefing de Visita
          </h1>
          <p className="text-slate-600">
            Dados confirmados do cliente + Produtos recomendados (Modo Verdade Absoluta)
          </p>
        </div>

        {/* CARD PRINCIPAL */}
        <VisitBriefingCard client={clientData} inventory={inventory} />

        {/* AÇÕES */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <Button
            onClick={handleDownloadBriefing}
            disabled={downloading}
            className="gap-2 bg-indigo-600 hover:bg-indigo-700"
            size="lg"
          >
            {downloading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Download className="w-5 h-5" />
            )}
            {downloading ? 'Gerando...' : 'Download PDF'}
          </Button>
          
          <Button
            variant="outline"
            className="gap-2"
            size="lg"
            onClick={() => {
              const text = `BRIEFING: ${clientData.full_name}\n\n📍 ${clientData.city}/${clientData.state || ''}\n📊 Equipamento atual: ${clientData.current_equipment || 'Não informado'}\n\nPróxima ação: Validar necessidade em visita`;
              navigator.clipboard.writeText(text);
              alert('Briefing copiado!');
            }}
          >
            <FileText className="w-5 h-5" />
            Copiar Resumo
          </Button>
        </div>

        {/* INFORMAÇÕES MODO VERDADE */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              🔒 Modo Verdade Absoluta
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-blue-800 space-y-2">
            <p>✅ Todos os dados abaixo foram <strong>confirmados no CRM</strong></p>
            <p>✅ Produtos sugeridos baseados em <strong>histórico real</strong> do cliente</p>
            <p>✅ <strong>Nenhuma hipótese ou chute</strong> — apenas fatos</p>
            <p>⚠️ Validar qualquer informação incompleta <strong>DURANTE A VISITA</strong></p>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
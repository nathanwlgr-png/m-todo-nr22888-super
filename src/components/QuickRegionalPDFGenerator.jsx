import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { FileText, Loader2, MapPin } from 'lucide-react';
import { toast } from 'sonner';

export default function QuickRegionalPDFGenerator() {
  const [city, setCity] = useState('Presidente Prudente');
  const [radiusKm, setRadiusKm] = useState(100);
  const [recipientName, setRecipientName] = useState('Bruna');
  const [generating, setGenerating] = useState(false);

  const generatePDF = async () => {
    if (!city || !recipientName) {
      toast.error('Preencha cidade e nome do destinatário');
      return;
    }

    setGenerating(true);
    try {
      const result = await base44.functions.invoke('generateRegionalClientPDF', {
        city,
        radius_km: radiusKm,
        recipient_name: recipientName
      });

      toast.success(`✅ PDF gerado! ${result.total_clients} clientes incluídos`);
      toast.success('📦 Documento salvo no Exportador!', { duration: 4000 });

      // Reset form
      setCity('');
      setRadiusKm(100);
      setRecipientName('');

    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao gerar PDF: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-900">
          <MapPin className="w-5 h-5" />
          Gerador PDF Regional
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label className="text-xs font-semibold">Cidade Central</Label>
          <Input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Ex: Presidente Prudente"
            className="h-9"
          />
        </div>

        <div>
          <Label className="text-xs font-semibold">Raio (km)</Label>
          <Input
            type="number"
            value={radiusKm}
            onChange={(e) => setRadiusKm(parseInt(e.target.value) || 100)}
            className="h-9"
          />
        </div>

        <div>
          <Label className="text-xs font-semibold">Para quem?</Label>
          <Input
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            placeholder="Nome do vendedor"
            className="h-9"
          />
        </div>

        <Button
          onClick={generatePDF}
          disabled={generating}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Gerando PDF...
            </>
          ) : (
            <>
              <FileText className="w-4 h-4 mr-2" />
              Gerar PDF + Rota
            </>
          )}
        </Button>

        <p className="text-xs text-blue-700 bg-blue-100 p-2 rounded">
          📋 Gera PDF com todos os clientes da região, ordenados por importância, com rota otimizada e salva automaticamente no Exportador
        </p>
      </CardContent>
    </Card>
  );
}
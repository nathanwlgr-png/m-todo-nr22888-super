import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Presentation, ExternalLink, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

export default function GoogleSlidesProposalButton({ clientId, clientName, selectedProducts = [] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [notes, setNotes] = useState('');

  const handleGenerate = async () => {
    if (!clientId) {
      toast.error('Selecione um cliente primeiro');
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const response = await base44.functions.invoke('generateProposalSlides', {
        client_id: clientId,
        products: selectedProducts,
        custom_notes: notes,
      });

      setResult(response.data);
      toast.success(`✅ ${response.data.slides_count} slides criados no Google Slides!`);
    } catch (error) {
      toast.error('Erro ao gerar apresentação: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-blue-500 text-blue-700 hover:bg-blue-50">
          <Presentation className="w-4 h-4 mr-2" />
          Google Slides
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Presentation className="w-5 h-5 text-blue-600" />
            Gerar Apresentação no Google Slides
          </DialogTitle>
        </DialogHeader>

        {!result ? (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800 font-medium">
                🤖 IA vai gerar automaticamente:
              </p>
              <ul className="text-xs text-blue-700 mt-2 space-y-1">
                <li>✓ 8 slides profissionais personalizados</li>
                <li>✓ Diagnóstico baseado nos dados do cliente</li>
                <li>✓ ROI calculado pelo volume de exames</li>
                <li>✓ Notas do apresentador em cada slide</li>
                <li>✓ Design com cores Seamaty</li>
              </ul>
              {clientName && (
                <p className="text-xs text-blue-600 mt-2 font-medium">
                  👤 Cliente: {clientName}
                  {selectedProducts.length > 0 && ` | ${selectedProducts.length} produto(s)`}
                </p>
              )}
            </div>

            <div>
              <Label>Notas adicionais para a IA (opcional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Enfatizar desconto especial, mencionar concorrente X, incluir estudo de caso..."
                className="mt-1 h-24 text-sm"
              />
            </div>

            <Button
              onClick={handleGenerate}
              disabled={loading || !clientId}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Gerando apresentação com IA...
                </>
              ) : (
                <>
                  <Presentation className="w-4 h-4 mr-2" />
                  Gerar Apresentação
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-300 rounded-lg p-4 text-center">
              <CheckCircle className="w-10 h-10 text-green-600 mx-auto mb-2" />
              <p className="font-semibold text-green-800">Apresentação criada!</p>
              <p className="text-sm text-green-700">{result.slides_count} slides • {result.clinic_name || result.client_name}</p>
            </div>

            <a href={result.slides_url} target="_blank" rel="noopener noreferrer">
              <Button className="w-full bg-green-600 hover:bg-green-700">
                <ExternalLink className="w-4 h-4 mr-2" />
                Abrir no Google Slides
              </Button>
            </a>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => { setResult(null); setNotes(''); }}
            >
              Gerar Nova Apresentação
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
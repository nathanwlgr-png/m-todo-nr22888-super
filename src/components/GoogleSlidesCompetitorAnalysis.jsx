import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Presentation, ExternalLink, Plus, X } from 'lucide-react';
import { toast } from 'sonner';

export default function GoogleSlidesCompetitorAnalysis({ client }) {
  const [generating, setGenerating] = useState(false);
  const [presentationUrl, setPresentationUrl] = useState(null);
  const [competitors, setCompetitors] = useState(['']);

  const addCompetitor = () => {
    setCompetitors([...competitors, '']);
  };

  const removeCompetitor = (index) => {
    setCompetitors(competitors.filter((_, i) => i !== index));
  };

  const updateCompetitor = (index, value) => {
    const updated = [...competitors];
    updated[index] = value;
    setCompetitors(updated);
  };

  const generateSlides = async () => {
    setGenerating(true);
    try {
      const result = await base44.functions.invoke('createCompetitorSlides', {
        client_id: client.id,
        competitors: competitors.filter(c => c.trim())
      });

      setPresentationUrl(result.presentation_url);
      toast.success('Apresentação criada no Google Slides!');
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao criar slides: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card className="border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-cyan-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-900">
          <Presentation className="w-5 h-5" />
          Análise de Concorrentes - Google Slides
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!presentationUrl ? (
          <>
            <p className="text-sm text-gray-700">
              Gere apresentação automática de análise competitiva no Google Slides
            </p>

            <div className="space-y-2">
              <Label className="text-xs font-semibold">Concorrentes (opcional)</Label>
              {competitors.map((comp, idx) => (
                <div key={idx} className="flex gap-2">
                  <Input
                    value={comp}
                    onChange={(e) => updateCompetitor(idx, e.target.value)}
                    placeholder={`Concorrente ${idx + 1}`}
                    className="h-9"
                  />
                  {competitors.length > 1 && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => removeCompetitor(idx)}
                      className="h-9 w-9"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={addCompetitor}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Concorrente
              </Button>
            </div>

            <Button
              onClick={generateSlides}
              disabled={generating}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {generating ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Presentation className="w-4 h-4 mr-2" />
              )}
              Gerar Apresentação
            </Button>
          </>
        ) : (
          <div className="space-y-3">
            <div className="p-3 bg-green-50 rounded-lg border-2 border-green-300">
              <p className="text-sm font-semibold text-green-800 mb-2">
                ✅ Apresentação criada!
              </p>
              <p className="text-xs text-gray-700 mb-3">
                Análise competitiva completa com SWOT, matriz competitiva e estratégias de posicionamento.
              </p>
              <Button
                onClick={() => window.open(presentationUrl, '_blank')}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Abrir no Google Slides
              </Button>
            </div>

            <Button
              onClick={() => {
                setPresentationUrl(null);
                setCompetitors(['']);
              }}
              variant="outline"
              className="w-full"
            >
              Nova Apresentação
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
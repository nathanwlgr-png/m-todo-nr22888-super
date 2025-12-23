import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Loader2, Download } from 'lucide-react';
import { toast } from 'sonner';

export default function MariliaMarketAnalysis() {
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const analyzeMarilia = async () => {
    setAnalyzing(true);
    try {
      const analysisResult = await base44.integrations.Core.InvokeLLM({
        prompt: `Faça uma ANÁLISE COMPLETA DE MERCADO da cidade de MARÍLIA - SP para vendas de equipamentos veterinários.

DADOS DEMOGRÁFICOS (pesquise):
- População atual de Marília
- Taxa de crescimento
- Renda per capita
- Número de pets estimado

ANÁLISE DE MERCADO:
- Quantas clínicas veterinárias existem (pesquise no Google)
- Hospitais veterinários
- Pet shops com atendimento
- Laboratórios terceirizados

MÉTRICA BASE: 1 clínica veterinária para cada 5.000 habitantes

CÁLCULO:
- População de Marília / 5.000 = Demanda teórica
- Clínicas existentes (pesquisadas)
- GAP de mercado = Demanda - Oferta

CONCORRÊNCIA:
- Principais concorrentes de equipamentos
- Marcas mais vendidas
- Faixa de preço praticada

OPORTUNIDADES:
- Bairros sub-atendidos
- Especialidades carentes
- Potencial de crescimento

ESTIMATIVA FINANCEIRA:
- Mercado total em R$ (estimativa)
- Potencial de vendas para nossa empresa
- Clientes prioritários

Seja DETALHADO e use dados REAIS pesquisados.`,
        add_context_from_internet: true
      });

      setAnalysis(analysisResult);
      await navigator.clipboard.writeText(analysisResult);
      toast.success('✅ Análise completa copiada!');

    } catch (error) {
      toast.error('Erro ao analisar mercado');
      console.error(error);
    } finally {
      setAnalyzing(false);
    }
  };

  const downloadAnalysis = () => {
    const blob = new Blob([analysis], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ANALISE_MERCADO_MARILIA_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="p-4 bg-gradient-to-r from-teal-50 to-cyan-50 border-2 border-teal-300 shadow-lg">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-xl bg-teal-600 flex items-center justify-center">
          <MapPin className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-slate-800">Análise de Mercado - Marília</h3>
          <p className="text-xs text-slate-600">Pesquisa completa com dados reais</p>
        </div>
      </div>

      <Button
        onClick={analyzeMarilia}
        disabled={analyzing}
        className="w-full bg-teal-600 hover:bg-teal-700 mb-3"
      >
        {analyzing ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Pesquisando...
          </>
        ) : (
          <>
            <MapPin className="w-4 h-4 mr-2" />
            Analisar Marília Agora
          </>
        )}
      </Button>

      {analysis && (
        <div className="space-y-2">
          <div className="bg-white rounded-lg p-3 border border-teal-200 max-h-48 overflow-auto">
            <pre className="text-xs whitespace-pre-wrap">{analysis.substring(0, 500)}...</pre>
          </div>
          
          <Button size="sm" variant="outline" onClick={downloadAnalysis} className="w-full">
            <Download className="w-3 h-3 mr-1" />
            Baixar Análise Completa
          </Button>
        </div>
      )}
    </Card>
  );
}
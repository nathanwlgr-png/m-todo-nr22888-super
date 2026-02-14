import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Loader2, 
  FileText, 
  Download,
  CheckCircle2,
  TrendingUp,
  Building2,
  MapPin,
  Target,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

export default function CompetitorMarketAnalyzer() {
  const [brandName, setBrandName] = useState('');
  const [brandWebsite, setBrandWebsite] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  const analyzeMutation = useMutation({
    mutationFn: async (data) => {
      const response = await base44.functions.invoke('generateCompetitorMarketAnalysisNoAI', data);
      return response.data;
    },
    onSuccess: (data) => {
      setAnalysisResult(data);
      toast.success('Análise concluída!');
    },
    onError: (error) => {
      toast.error('Erro ao analisar: ' + error.message);
    }
  });

  const handleAnalyze = async () => {
    if (!brandName) {
      toast.error('Digite o nome da marca');
      return;
    }

    setAnalyzing(true);
    try {
      await analyzeMutation.mutateAsync({
        brand_name: brandName,
        brand_website: brandWebsite
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const copyToWhatsApp = () => {
    if (!analysisResult?.report_text) return;
    
    navigator.clipboard.writeText(analysisResult.report_text);
    toast.success('Relatório copiado! Cole no WhatsApp');
  };

  return (
    <Card className="p-6 bg-white shadow-lg">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
          <Search className="w-6 h-6 text-purple-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Análise de Mercado Competitiva</h2>
          <p className="text-sm text-slate-600">Pesquisa completa de prospects e produtos</p>
        </div>
      </div>

      {/* Formulário */}
      <div className="space-y-4 mb-6">
        <div>
          <Label className="text-sm font-medium text-slate-700 mb-2 block">
            Nome da Marca Concorrente
          </Label>
          <Input
            placeholder="Ex: Butzke Móveis"
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            className="text-base"
          />
        </div>

        <div>
          <Label className="text-sm font-medium text-slate-700 mb-2 block">
            Website (Opcional)
          </Label>
          <Input
            placeholder="Ex: https://www.butzke.com.br"
            value={brandWebsite}
            onChange={(e) => setBrandWebsite(e.target.value)}
            className="text-base"
          />
        </div>

        <Button
          onClick={handleAnalyze}
          disabled={analyzing || !brandName}
          className="w-full bg-purple-600 hover:bg-purple-700 h-12 text-base"
        >
          {analyzing ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Analisando... (pode levar 2-3 minutos)
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5 mr-2" />
              Iniciar Análise Completa
            </>
          )}
        </Button>
      </div>

      {/* Resultados */}
      {analysisResult && (
        <div className="space-y-4">
          {/* Resumo */}
          <Card className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50">
            <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Análise Concluída
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-700">
                  {analysisResult.products_analyzed}
                </p>
                <p className="text-xs text-slate-600">Categorias</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-indigo-700">
                  {analysisResult.prospects_found}
                </p>
                <p className="text-xs text-slate-600">Prospects</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-700">
                  {analysisResult.prospects_found}
                </p>
                <p className="text-xs text-slate-600">CNPJs</p>
              </div>
            </div>
          </Card>

          {/* Informações da Marca */}
          {analysisResult.brand_info && (
            <Card className="p-4">
              <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                {analysisResult.brand_info.name}
              </h3>
              <p className="text-sm text-slate-600 mb-2">
                {analysisResult.brand_info.description}
              </p>
              <div className="flex gap-2">
                <Badge variant="outline">
                  <MapPin className="w-3 h-3 mr-1" />
                  {analysisResult.brand_info.location}
                </Badge>
                <Badge variant="outline">
                  {analysisResult.brand_info.segment}
                </Badge>
              </div>
            </Card>
          )}

          {/* Prospects */}
          {analysisResult.detailed_analysis && (
            <Card className="p-4">
              <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <Target className="w-4 h-4" />
                Prospects Qualificados ({analysisResult.detailed_analysis.length})
              </h3>
              <ScrollArea className="h-[300px]">
                <div className="space-y-3">
                  {analysisResult.detailed_analysis.map((analysis, idx) => (
                    <Card key={idx} className="p-3 bg-slate-50">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-slate-800">
                            {analysis.store.store_name}
                          </h4>
                          <p className="text-xs text-slate-600">
                            {analysis.store.city}/{analysis.store.state}
                          </p>
                        </div>
                        {analysis.numerology?.number && (
                          <Badge className="bg-indigo-100 text-indigo-700">
                            Nº {analysis.numerology.number}
                          </Badge>
                        )}
                      </div>

                      {analysis.store.owner_name && analysis.store.owner_name !== 'null' && (
                        <p className="text-sm text-slate-700 mb-2">
                          👤 {analysis.store.owner_name}
                        </p>
                      )}

                      {analysis.store.cnpj && analysis.store.cnpj !== 'null' && (
                        <p className="text-xs text-slate-600 mb-2">
                          CNPJ: {analysis.store.cnpj}
                        </p>
                      )}

                      <div className="text-xs text-slate-600">
                        <p className="mb-1">
                          <strong>Porte:</strong> {analysis.store.size}
                        </p>
                        <p className="mb-2">
                          <strong>Por que é bom fit:</strong> {analysis.store.why_good_fit}
                        </p>
                      </div>

                      {analysis.product_analysis?.recommended_products && (
                        <div className="mt-2 pt-2 border-t border-slate-200">
                          <p className="text-xs font-semibold text-slate-700 mb-1">
                            Produtos Recomendados:
                          </p>
                          <div className="space-y-1">
                            {analysis.product_analysis.recommended_products.slice(0, 3).map((prod, i) => (
                              <div key={i} className="text-xs text-slate-600">
                                • {prod.product} - <span className="text-green-600">{prod.priority}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {analysis.numerology?.profile && (
                        <div className="mt-2 pt-2 border-t border-slate-200">
                          <p className="text-xs font-semibold text-indigo-700 mb-1">
                            💡 Abordagem Numerológica:
                          </p>
                          <p className="text-xs text-slate-600">
                            {analysis.numerology.profile.approach_tips}
                          </p>
                          {analysis.numerology.profile.example_scripts?.[0] && (
                            <p className="text-xs text-green-700 mt-1 italic">
                              "{analysis.numerology.profile.example_scripts[0]}"
                            </p>
                          )}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </Card>
          )}

          {/* Ações */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={copyToWhatsApp}
              className="bg-green-600 hover:bg-green-700"
            >
              <FileText className="w-4 h-4 mr-2" />
              Copiar para WhatsApp
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                toast.info('Função de PDF em desenvolvimento');
              }}
            >
              <Download className="w-4 h-4 mr-2" />
              Baixar PDF
            </Button>
          </div>

          {/* Preview do Relatório */}
          {analysisResult.report_text && (
            <Card className="p-4 bg-slate-50">
              <h3 className="font-semibold text-slate-800 mb-2">Preview do Relatório</h3>
              <ScrollArea className="h-[200px]">
                <pre className="text-xs text-slate-700 whitespace-pre-wrap">
                  {analysisResult.report_text}
                </pre>
              </ScrollArea>
            </Card>
          )}
        </div>
      )}
    </Card>
  );
}
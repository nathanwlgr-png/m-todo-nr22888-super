import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Newspaper, TrendingUp } from 'lucide-react';
import { executeWithRateLimit } from '@/components/rateLimitManager';
import { toast } from 'sonner';

export default function MarketNewsAnalyzer({ client }) {
  const [loading, setLoading] = useState(false);
  const [news, setNews] = useState(null);

  const analyzeMarketNews = async () => {
    setLoading(true);
    try {
      const prompt = `Pesquise e resuma NOTÍCIAS RECENTES sobre o mercado veterinário/laboratorial no Brasil:

CONTEXTO:
- Cidade: ${client.city}
- Tipo: ${client.client_type}
- Segmento: ${client.industry || 'Veterinária'}

PROCURE POR:
1. Tendências do mercado (últimas 3 meses)
2. Regulamentações/Leis recentes
3. Tecnologias emergentes
4. Crescimento do segmento
5. Oportunidades de negócios

Forneça um resumo ACIONÁVEL com:
- 3-5 notícias mais relevantes
- Impacto para clínicas/laboratórios
- Oportunidades de venda
- Timing ideal para abordar cliente`;

      const result = await executeWithRateLimit(async () => {
        return await base44.integrations.Core.InvokeLLM({
          prompt,
          add_context_from_internet: true,
          response_json_schema: {
            type: "object",
            properties: {
              market_summary: { type: "string" },
              news_items: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    date: { type: "string" },
                    impact: { type: "string" },
                    opportunity: { type: "string" }
                  }
                }
              },
              market_trends: { type: "array", items: { type: "string" } },
              sales_opportunity: { type: "string" }
            }
          }
        });
      }, 'normal');

      setNews(result);
      toast.success('Análise de mercado concluída!');
    } catch (error) {
      toast.error('Erro ao analisar notícias');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-300">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
          <Newspaper className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-slate-800">📰 Análise de Mercado</h3>
          <p className="text-xs text-slate-600">Notícias e tendências do setor</p>
        </div>
      </div>

      {!news ? (
        <Button
          onClick={analyzeMarketNews}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Analisando...
            </>
          ) : (
            'Buscar Notícias e Tendências'
          )}
        </Button>
      ) : (
        <div className="space-y-3">
          <div className="bg-white rounded-lg p-3 border border-blue-200">
            <p className="text-xs font-semibold text-blue-700 mb-1">Resumo do Mercado</p>
            <p className="text-sm text-slate-700">{news.market_summary}</p>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-700">📌 Notícias Relevantes</p>
            {news.news_items?.map((item, idx) => (
              <Card key={idx} className="p-2 bg-slate-50 border-l-4 border-l-blue-500">
                <div className="flex items-start justify-between mb-1">
                  <h4 className="text-xs font-bold text-slate-800">{item.title}</h4>
                  <Badge variant="outline" className="text-xs">{item.date}</Badge>
                </div>
                <p className="text-xs text-slate-600 mb-1"><strong>Impacto:</strong> {item.impact}</p>
                <p className="text-xs text-green-700"><strong>Oportunidade:</strong> {item.opportunity}</p>
              </Card>
            ))}
          </div>

          {news.market_trends && (
            <div className="bg-green-50 rounded-lg p-3 border border-green-200">
              <p className="text-xs font-semibold text-green-700 mb-2">📈 Tendências</p>
              <div className="space-y-1">
                {news.market_trends.map((trend, i) => (
                  <p key={i} className="text-xs text-slate-700">• {trend}</p>
                ))}
              </div>
            </div>
          )}

          {news.sales_opportunity && (
            <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
              <p className="text-xs font-semibold text-orange-700 mb-1">💡 Oportunidade de Venda</p>
              <p className="text-sm text-slate-700">{news.sales_opportunity}</p>
            </div>
          )}

          <Button
            size="sm"
            onClick={() => setNews(null)}
            variant="outline"
          >
            Atualizar
          </Button>
        </div>
      )}
    </Card>
  );
}
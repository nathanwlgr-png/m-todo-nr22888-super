import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Loader2, ShoppingCart, Package, TrendingUp, Zap, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function ProductRecommendationAI({ client }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [copied, setCopied] = useState(null);

  if (!client) return (
    <div className="text-center py-8 text-slate-400">
      <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
      <p className="text-sm">Selecione um cliente para recomendações</p>
    </div>
  );

  const generate = async () => {
    setLoading(true);
    setData(null);
    try {
      const res = await base44.functions.invoke('recommendProductsForClient', { client_id: client.id });
      if (res.data?.success) {
        setData(res.data);
        toast.success('Recomendações geradas pelo Método NR22!');
      } else {
        toast.error(res.data?.error || 'Erro ao gerar recomendações');
      }
    } catch (e) {
      toast.error('Erro: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const copyText = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
    toast.success('Copiado!');
  };

  const priorityColor = (p) => p === 1 ? 'bg-red-500' : p === 2 ? 'bg-orange-500' : 'bg-blue-500';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-sm text-slate-700 flex items-center gap-1.5">
            <ShoppingCart className="w-4 h-4 text-indigo-600" />
            Recomendação de Produtos IA
          </p>
          <p className="text-xs text-slate-500">Baseado em histórico, dores e perfil de {client.first_name}</p>
        </div>
        <Button
          size="sm"
          onClick={generate}
          disabled={loading}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 h-8 text-xs"
        >
          {loading
            ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Analisando...</>
            : <><Sparkles className="w-3 h-3 mr-1" />{data ? 'Reanalisar' : 'Gerar Recomendações'}</>
          }
        </Button>
      </div>

      {loading && (
        <div className="text-center py-6">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-2 animate-pulse">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <p className="text-xs text-slate-500">IA cruzando perfil + catálogo + histórico...</p>
        </div>
      )}

      {data && (
        <div className="space-y-3">
          {/* Summary insight */}
          {data.recommendations?.summary_insight && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-2.5">
              <p className="text-[10px] font-semibold text-indigo-700 mb-0.5">💡 Insight NR22:</p>
              <p className="text-xs text-indigo-800">{data.recommendations.summary_insight}</p>
            </div>
          )}

          {/* Main trigger */}
          {data.recommendations?.main_trigger && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <p className="text-xs text-amber-800"><strong>Gatilho principal:</strong> {data.recommendations.main_trigger}</p>
            </div>
          )}

          {/* Equipment Recommendations */}
          {data.recommendations?.equipment_recommendations?.map((eq, i) => (
            <Card key={i} className="border-l-4 border-l-indigo-500">
              <CardContent className="p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge className={`${priorityColor(eq.priority)} text-[10px] w-5 h-5 flex items-center justify-center p-0`}>
                      {eq.priority}
                    </Badge>
                    <p className="font-semibold text-sm text-slate-800">{eq.equipment_name}</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800 text-[10px]">{eq.probability_of_sale}% chance</Badge>
                </div>

                <div className="bg-slate-50 rounded p-2">
                  <p className="text-[10px] font-semibold text-slate-500 mb-0.5">Por que é ideal:</p>
                  <p className="text-xs text-slate-700">{eq.why_ideal}</p>
                </div>

                {eq.roi_calculation && (
                  <div className="bg-emerald-50 rounded p-2 flex items-start gap-1.5">
                    <TrendingUp className="w-3 h-3 text-emerald-600 mt-0.5 shrink-0" />
                    <p className="text-xs text-emerald-800">{eq.roi_calculation}</p>
                  </div>
                )}

                {eq.approach_script && (
                  <div className="bg-blue-50 rounded p-2">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[10px] font-semibold text-blue-700">📱 Script de Abordagem:</p>
                      <button
                        onClick={() => copyText(eq.approach_script, `script_${i}`)}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        {copied === `script_${i}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                    <p className="text-xs text-blue-800 italic">{eq.approach_script}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {/* Consumables */}
          {data.recommendations?.consumable_recommendations?.length > 0 && (
            <Card>
              <CardContent className="p-3 space-y-2">
                <p className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-purple-600" />
                  Consumíveis Recomendados
                </p>
                {data.recommendations.consumable_recommendations.map((c, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <span className="text-purple-500 font-bold shrink-0">•</span>
                    <div>
                      <span className="font-medium text-slate-700">{c.consumable_name}</span>
                      {c.reason && <span className="text-slate-500"> — {c.reason}</span>}
                      {c.monthly_value > 0 && (
                        <span className="text-emerald-600 font-medium ml-1">~R${c.monthly_value}/mês</span>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Sales Sequence */}
          {data.recommendations?.sales_sequence && (
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-lg p-3">
              <p className="text-[10px] font-semibold text-slate-300 mb-1">🎯 Sequência de Venda Recomendada:</p>
              <p className="text-xs text-slate-200">{data.recommendations.sales_sequence}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Zap, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

export default function CrossSellUpsellAnalyzer({ clientId }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  const { data: client } = useQuery({
    queryKey: ['client', clientId],
    queryFn: () => clientId ? base44.entities.Client.filter({ id: clientId }).then(r => r[0]) : null,
    enabled: !!clientId
  });

  const { data: sales } = useQuery({
    queryKey: ['client-sales', clientId],
    queryFn: () => clientId ? base44.entities.Sale.filter({ client_id: clientId }) : [],
    enabled: !!clientId
  });

  const analyzeCrossSellUpsell = async () => {
    if (!client) {
      toast.error('Selecione um cliente');
      return;
    }
    setLoading(true);
    try {
      const res = await base44.functions.invoke('analyzeCrossSellOpportunities', {
        client_id: clientId,
        client_data: {
          name: client.first_name,
          clinic: client.clinic_name,
          type: client.client_type,
          volume: client.current_volume,
          equipment: client.current_equipment,
          interest: client.equipment_interest,
          purchase_history: client.equipment_purchase_history || []
        },
        sales: sales || []
      });
      
      if (res.data) {
        setAnalysis(res.data);
        toast.success('Análise concluída!');
      }
    } catch (error) {
      toast.error('Erro ao analisar');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!clientId) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <TrendingUp className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">Selecione um cliente para análise</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          onClick={analyzeCrossSellUpsell}
          disabled={loading}
          className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
          Analisar Oportunidades
        </Button>
      </div>

      {analysis && (
        <div className="space-y-3">
          {/* Upsell */}
          {analysis.upsell?.length > 0 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-orange-800">📈 Upsell (Expansão)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {analysis.upsell.map((item, i) => (
                  <div key={i} className="p-3 bg-white rounded border border-orange-100">
                    <div className="flex items-start justify-between mb-1">
                      <p className="font-semibold text-xs text-orange-900">{item.product}</p>
                      <Badge className="bg-orange-100 text-orange-700 text-[10px]">
                        {item.probability}% prob
                      </Badge>
                    </div>
                    <p className="text-xs text-orange-700 mb-2">{item.reason}</p>
                    <p className="text-[10px] text-orange-600">💰 Valor esperado: R$ {(item.expected_value || 0).toLocaleString()}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Cross-sell */}
          {analysis.crosssell?.length > 0 && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-green-800">🎯 Cross-sell (Complementar)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {analysis.crosssell.map((item, i) => (
                  <div key={i} className="p-3 bg-white rounded border border-green-100">
                    <div className="flex items-start justify-between mb-1">
                      <p className="font-semibold text-xs text-green-900">{item.product}</p>
                      <Badge className="bg-green-100 text-green-700 text-[10px]">
                        {item.probability}% prob
                      </Badge>
                    </div>
                    <p className="text-xs text-green-700 mb-2">{item.reason}</p>
                    <p className="text-[10px] text-green-600">💰 Valor esperado: R$ {(item.expected_value || 0).toLocaleString()}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Summary */}
          {analysis.summary && (
            <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
              <CardContent className="p-3">
                <p className="text-[10px] text-indigo-600 font-semibold mb-1">💡 RESUMO</p>
                <p className="text-xs text-indigo-800">{analysis.summary}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
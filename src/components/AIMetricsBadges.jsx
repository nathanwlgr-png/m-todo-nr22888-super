import React from 'react';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, DollarSign, AlertTriangle, Sparkles, Target } from 'lucide-react';

export default function AIMetricsBadges({ client, variant = 'full' }) {
  const intelligence = client.ai_sales_intelligence || {};
  const hasOpportunities = (intelligence.cross_sell_opportunities?.length || 0) + 
                          (intelligence.upsell_opportunities?.length || 0) > 0;
  
  const ltv = intelligence.ltv_24_months || 0;
  const adoptionRate = intelligence.product_adoption_rate || 0;
  const churnRisk = intelligence.churn_risk || 0;

  // Compact variant for lists
  if (variant === 'compact') {
    return (
      <div className="flex gap-1 flex-wrap">
        {ltv > 50000 && (
          <Badge className="bg-green-600 text-white text-xs">
            <DollarSign className="w-3 h-3 mr-1" />
            Alto LTV
          </Badge>
        )}
        {hasOpportunities && (
          <Badge className="bg-purple-600 text-white text-xs">
            <Sparkles className="w-3 h-3 mr-1" />
            Oportunidade
          </Badge>
        )}
        {churnRisk > 60 && (
          <Badge className="bg-red-600 text-white text-xs">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Risco
          </Badge>
        )}
        {adoptionRate > 70 && (
          <Badge className="bg-blue-600 text-white text-xs">
            <Target className="w-3 h-3 mr-1" />
            Alta Adoção
          </Badge>
        )}
      </div>
    );
  }

  // Full variant for detailed views
  return (
    <div className="space-y-2">
      <div className="flex gap-2 flex-wrap">
        {ltv > 0 && (
          <Badge className={`${
            ltv > 50000 ? 'bg-green-600' : ltv > 20000 ? 'bg-blue-600' : 'bg-gray-600'
          } text-white`}>
            <DollarSign className="w-3 h-3 mr-1" />
            LTV: R$ {ltv.toLocaleString('pt-BR')}
          </Badge>
        )}
        
        {adoptionRate > 0 && (
          <Badge className={`${
            adoptionRate > 70 ? 'bg-purple-600' : adoptionRate > 40 ? 'bg-indigo-600' : 'bg-gray-600'
          } text-white`}>
            <Target className="w-3 h-3 mr-1" />
            Adoção: {adoptionRate}%
          </Badge>
        )}

        {hasOpportunities && (
          <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
            <Sparkles className="w-3 h-3 mr-1" />
            {(intelligence.cross_sell_opportunities?.length || 0) + 
             (intelligence.upsell_opportunities?.length || 0)} Oportunidades
          </Badge>
        )}

        {churnRisk > 60 && (
          <Badge className="bg-red-600 text-white animate-pulse">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Alto Risco de Perda
          </Badge>
        )}
      </div>

      {intelligence.next_purchase_prediction && (
        <Badge variant="outline" className="border-purple-300 text-purple-700">
          <TrendingUp className="w-3 h-3 mr-1" />
          Próxima compra: {intelligence.next_purchase_prediction.product_category} 
          ({intelligence.next_purchase_prediction.estimated_date})
        </Badge>
      )}
    </div>
  );
}
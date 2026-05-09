import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingDown, TrendingUp, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

export default function InsumoPatternAlert({ clients = [], consumables = [] }) {
  // Analisar padrões de compra de insumos
  const patterns = useMemo(() => {
    const analysis = [];

    clients.forEach((client) => {
      const clientConsumables = consumables.filter(c => c.client_id === client.id);

      if (clientConsumables.length === 0) return;

      // Verificar padrão: cliente parou de comprar um tipo mas compra outro
      clientConsumables.forEach((consumable) => {
        const lastOrder = new Date(consumable.last_order_date);
        const daysSinceLastOrder = Math.floor((new Date() - lastOrder) / (1000 * 60 * 60 * 24));

        // Se parou de comprar há mais de 30 dias
        if (daysSinceLastOrder > 30) {
          const otherConsumables = clientConsumables.filter(c => c.id !== consumable.id);
          const hasBuyingOther = otherConsumables.some(c => {
            const lastDate = new Date(c.last_order_date);
            const daysSince = Math.floor((new Date() - lastDate) / (1000 * 60 * 60 * 24));
            return daysSince < 30; // Comprou outro tipo recentemente
          });

          if (hasBuyingOther) {
            analysis.push({
              clientId: client.id,
              clientName: client.full_name || client.clinic_name,
              stoppedType: consumable.consumable_type,
              daysStopped: daysSinceLastOrder,
              alternativeOptions: otherConsumables.map(c => c.consumable_type),
              type: 'pattern_change', // Cliente mudou de insumo
            });
          }
        }
      });

      // Verificar padrão: cliente continua comprando mesmo tipo (beleza)
      clientConsumables.forEach((consumable) => {
        const lastOrder = new Date(consumable.last_order_date);
        const daysSinceLastOrder = Math.floor((new Date() - lastOrder) / (1000 * 60 * 60 * 24));

        // Se está comprando regularmente (menos de 15 dias)
        if (daysSinceLastOrder < 15 && consumable.order_quantity_units && consumable.monthly_revenue_potential) {
          analysis.push({
            clientId: client.id,
            clientName: client.full_name || client.clinic_name,
            consumableType: consumable.consumable_type,
            lastOrderDays: daysSinceLastOrder,
            monthlyRevenue: consumable.monthly_revenue_potential,
            type: 'healthy_pattern', // Cliente está comprando regularmente
          });
        }
      });
    });

    return analysis;
  }, [clients, consumables]);

  // Separar por tipo de padrão
  const patternChanges = patterns.filter(p => p.type === 'pattern_change');
  const healthyPatterns = patterns.filter(p => p.type === 'healthy_pattern');

  const handleSuggestAlternative = (pattern) => {
    toast.info(`💡 Sugestões para ${pattern.clientName}:\n- ${pattern.alternativeOptions.join('\n- ')}`);
  };

  const handleSendWhatsApp = (clientName) => {
    toast.success(`💬 Mensagem preparada para envio via WhatsApp para ${clientName}`);
  };

  return (
    <div className="space-y-4">
      {/* MUDANÇAS DE PADRÃO - ATENÇÃO */}
      {patternChanges.length > 0 && (
        <Card className="border-2 border-orange-300 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-900">
              <AlertTriangle className="w-5 h-5" />
              🚨 Padrão Alterado - Clientes Mudaram de Insumo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {patternChanges.map((pattern, idx) => (
              <div key={idx} className="p-3 bg-white rounded-lg border border-orange-200">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-bold text-slate-900">{pattern.clientName}</p>
                    <p className="text-xs text-orange-700">
                      ⏸️ Parou de comprar <strong>{pattern.stoppedType}</strong> há {pattern.daysStopped} dias
                    </p>
                  </div>
                  <Badge className="bg-orange-600">Ação Recomendada</Badge>
                </div>

                <p className="text-xs text-slate-600 mb-2">
                  Alternativas que ele está comprando: {pattern.alternativeOptions.join(', ')}
                </p>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSuggestAlternative(pattern)}
                    className="text-xs"
                  >
                    💡 Ver Alternativas
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleSendWhatsApp(pattern.clientName)}
                    className="text-xs bg-green-600 hover:bg-green-700 gap-1"
                  >
                    <MessageSquare className="w-3 h-3" />
                    WhatsApp
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* PADRÃO SAUDÁVEL - FATURAMENTO */}
      {healthyPatterns.length > 0 && (
        <Card className="border-2 border-green-300 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-900">
              <TrendingUp className="w-5 h-5" />
              ✅ Padrão Saudável - Clientes Comprando Regularmente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {healthyPatterns.slice(0, 5).map((pattern, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 bg-white rounded-lg border border-green-200">
                <div>
                  <p className="font-bold text-sm text-slate-900">{pattern.clientName}</p>
                  <p className="text-xs text-green-700">
                    {pattern.consumableType} • Última compra: {pattern.lastOrderDays} dias
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-green-600">
                    R$ {(pattern.monthlyRevenue || 0).toLocaleString('pt-BR')}
                  </p>
                  <p className="text-xs text-green-700">/mês</p>
                </div>
              </div>
            ))}
            {healthyPatterns.length > 5 && (
              <p className="text-xs text-green-700 text-center pt-2">
                +{healthyPatterns.length - 5} clientes com padrão saudável
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {patternChanges.length === 0 && healthyPatterns.length === 0 && (
        <Card className="text-center py-8">
          <p className="text-slate-600">Nenhum padrão de compra detectado ainda</p>
        </Card>
      )}
    </div>
  );
}
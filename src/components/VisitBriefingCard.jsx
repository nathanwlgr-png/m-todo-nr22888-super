import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, TrendingUp, DollarSign, Clock } from 'lucide-react';

export default function VisitBriefingCard({ client, inventory = [] }) {
  
  // Calcular 3 produtos mais prováveis
  const recommendedProducts = useMemo(() => {
    if (!client || !inventory.length) return [];

    const scoring = inventory.map(item => {
      let score = 0;

      // Score: Se cliente não tem equipamento, alta prioridade
      if (!client.current_equipment && item.category === 'analisador_hematologico') {
        score += 50;
      }

      // Score: Se é upgrade (cliente tem VG1, pode ter VG2)
      if (client.current_equipment?.includes('VG1') && item.model === 'VG2') {
        score += 40;
      }

      // Score: Baseado em histórico de compra
      if (client.purchased_products?.includes(item.sku)) {
        score += 30; // Cliente confia, pode comprar consumíveis
      }

      // Score: Baseado em necessidades de lab
      if (client.lab_needs?.some(need => {
        const needMap = {
          hemograma: 'analisador_hematologico',
          bioquimico: 'analisador_bioquimico',
          hemogasio: 'gasometro'
        };
        return needMap[need] === item.category;
      })) {
        score += 35;
      }

      // Score: Produtos com validade válida (reagentes)
      if (item.validity) {
        const expiry = new Date(item.validity);
        if (expiry > new Date()) score += 10;
        else score -= 50; // Vencido, elimina
      }

      // Score: Quantidade disponível
      if (item.quantity_available > 0) score += 5;

      return { ...item, recommendation_score: score };
    });

    return scoring
      .filter(p => p.recommendation_score > 0)
      .sort((a, b) => b.recommendation_score - a.recommendation_score)
      .slice(0, 3);
  }, [client, inventory]);

  return (
    <Card className="bg-white border-indigo-200 shadow-lg">
      <CardHeader className="border-b border-indigo-100">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-2xl text-indigo-900">
              {client.full_name}
            </CardTitle>
            <p className="text-sm text-slate-600 mt-1">
              {client.clinic_name && `Clínica: ${client.clinic_name}`}
            </p>
          </div>
          <Badge variant="outline" className="text-indigo-700 border-indigo-300">
            {client.pipeline_stage || 'lead'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        
        {/* DADOS CONFIRMADOS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-xs text-slate-600 font-semibold uppercase mb-2">📍 Localização</p>
            <p className="text-lg font-bold text-slate-900">{client.city}</p>
            <p className="text-sm text-slate-600">{client.state}</p>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-xs text-slate-600 font-semibold uppercase mb-2">🏥 Tipo de Cliente</p>
            <p className="text-lg font-bold text-slate-900 capitalize">
              {client.client_type?.replace(/_/g, ' ') || 'Não definido'}
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-xs text-slate-600 font-semibold uppercase mb-2">⚙️ Equipamento Atual</p>
            <p className="text-lg font-bold text-slate-900">
              {client.current_equipment || '❌ Nenhum'}
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-xs text-slate-600 font-semibold uppercase mb-2">💰 Orçamento</p>
            <p className="text-lg font-bold text-slate-900">
              {client.available_budget ? `R$ ${client.available_budget.toLocaleString('pt-BR')}` : '❓'}
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-xs text-slate-600 font-semibold uppercase mb-2">📅 Último Contato</p>
            <p className="text-lg font-bold text-slate-900">
              {client.last_contact_date ? new Date(client.last_contact_date).toLocaleDateString('pt-BR') : '🚨 Nunca'}
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
            <p className="text-xs text-slate-600 font-semibold uppercase mb-2">📊 Status</p>
            <p className={`text-lg font-bold ${
              client.status === 'quente' ? 'text-red-600' :
              client.status === 'morno' ? 'text-orange-600' :
              'text-blue-600'
            }`}>
              {client.status?.toUpperCase() || '?'}
            </p>
          </div>
        </div>

        {/* NECESSIDADES DE LAB */}
        {client.lab_needs && client.lab_needs.length > 0 && (
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <p className="text-xs text-green-700 font-semibold uppercase mb-3">🧪 Necessidades de Laboratório</p>
            <div className="flex flex-wrap gap-2">
              {client.lab_needs.map((need, i) => (
                <Badge key={i} className="bg-green-200 text-green-900">
                  {need}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* PRODUTOS RECOMENDADOS */}
        <div>
          <h3 className="font-bold text-indigo-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            Top 3 Produtos Recomendados
          </h3>
          
          {recommendedProducts.length === 0 ? (
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200 flex gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
              <p className="text-sm text-yellow-800">Nenhum produto recomendado disponível. Validar necessidades em visita.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recommendedProducts.map((product, idx) => (
                <div
                  key={product.id}
                  className="p-4 rounded-lg border-2 border-indigo-100 bg-gradient-to-r from-indigo-50 to-blue-50 hover:border-indigo-300 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-bold text-indigo-900 text-lg">
                        #{idx + 1} {product.product_name}
                      </p>
                      <p className="text-sm text-slate-600">{product.model}</p>
                    </div>
                    <div className="text-right">
                      <Badge className="bg-indigo-600">
                        Score: {product.recommendation_score}%
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-slate-600" />
                      <span className="text-slate-700 font-semibold">
                        R$ {product.price_sku?.toLocaleString('pt-BR') || 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-600" />
                      <span className="text-slate-700 font-semibold">
                        {product.quantity_available} un
                      </span>
                    </div>
                    {product.validity && (
                      <div className="text-slate-700 font-semibold">
                        ✓ Válido
                      </div>
                    )}
                  </div>

                  {product.notes && (
                    <p className="text-xs text-slate-600 mt-2 italic">
                      📝 {product.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PRÓXIMAS AÇÕES */}
        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
          <p className="text-xs text-purple-700 font-semibold uppercase mb-2">📋 Próximas Ações em Visita</p>
          <ul className="space-y-1 text-sm text-purple-900">
            <li>✓ Confirmar necessidade de laboratório</li>
            <li>✓ Validar volume mensal de exames</li>
            <li>✓ Apresentar 3 produtos recomendados</li>
            <li>✓ Negociar condições de pagamento</li>
            <li>✓ Agendar próximo contato</li>
          </ul>
        </div>

      </CardContent>
    </Card>
  );
}
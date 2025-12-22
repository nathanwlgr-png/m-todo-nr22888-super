import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

/**
 * Retorna "Cliente" se tiver venda fechada, caso contrário "Possível Venda"
 */
export function useClientLabel(clientId) {
  const { data: sales = [] } = useQuery({
    queryKey: ['client-sales-status', clientId],
    queryFn: () => base44.entities.Sale.filter({ client_id: clientId }),
    enabled: !!clientId
  });

  const hasClosedSale = sales.some(sale => sale.status === 'fechada' || sale.status === 'entregue');
  return hasClosedSale ? 'Cliente' : 'Possível Venda';
}

export function getClientLabelSync(sales = []) {
  const hasClosedSale = sales.some(sale => sale.status === 'fechada' || sale.status === 'entregue');
  return hasClosedSale ? 'Cliente' : 'Possível Venda';
}
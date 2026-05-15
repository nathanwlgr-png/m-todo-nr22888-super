import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Users, Package, DollarSign, Flame } from 'lucide-react';

export default function CRMStatsBar() {
  const { data: clients = [] } = useQuery({
    queryKey: ['crm-stats-clients'],
    queryFn: () => base44.entities.Client.list('-updated_date', 500),
    staleTime: 120000,
  });

  const { data: sales = [] } = useQuery({
    queryKey: ['crm-stats-sales'],
    queryFn: () => base44.entities.Sale.filter({ status: 'fechada' }),
    staleTime: 120000,
  });

  const quentes = clients.filter(c => c.status === 'quente').length;
  const mesAtual = new Date();
  const vendsMes = sales.filter(s => {
    const d = new Date(s.sale_date || s.created_date);
    return d.getMonth() === mesAtual.getMonth() && d.getFullYear() === mesAtual.getFullYear();
  });
  const equipMes = vendsMes.length;
  const valorMes = vendsMes.reduce((a, s) => a + (s.sale_value || 0), 0) || 0;
  const valorMesStr = valorMes >= 1000 ? `R$${(valorMes / 1000).toFixed(0)}k` : `R$${valorMes.toFixed(0)}`;

  const stats = [
    { label: 'Clientes CRM', value: clients.length, Icon: Users, color: '#6366f1', link: 'Clients' },
    { label: 'Equip. Total', value: sales.length, Icon: Package, color: '#10b981', link: 'SalesFunnel' },
    { label: `${equipMes} equip · ${valorMesStr}`, value: 'MÊS', Icon: DollarSign, color: '#f59e0b', link: 'SalesFunnel' },
    { label: 'Leads Quentes', value: quentes, Icon: Flame, color: '#ef4444', link: 'Clients' },
  ];

  return (
    <div className="grid grid-cols-4 gap-2 mb-4">
      {stats.map(({ label, value, Icon, color, link }) => (
        <Link key={label} to={createPageUrl(link)}>
          <div
            className="rounded-xl p-2.5 flex flex-col items-center gap-1 hover:opacity-80 transition-opacity"
            style={{ background: '#111', border: `1px solid ${color}30` }}
          >
            <Icon className="w-4 h-4" style={{ color }} />
            <p className="text-lg font-black leading-none" style={{ color }}>{value}</p>
            <p className="text-[9px] text-center leading-tight" style={{ color: '#888' }}>{label}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
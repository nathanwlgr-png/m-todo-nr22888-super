import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Gift, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

const addDays = (days) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

export default function ClientBonusPanel({ client }) {
  const qc = useQueryClient();
  const [redeemingId, setRedeemingId] = useState('');
  const [dailyUse, setDailyUse] = useState('');
  const [unitPrice, setUnitPrice] = useState('');

  const { data: campaigns = [] } = useQuery({
    queryKey: ['c360-bonus', client.id],
    queryFn: () => base44.entities.BonusReleaseRule.filter({ client_id: client.id }),
  });
  const { data: orders = [] } = useQuery({
    queryKey: ['c360-consumption', client.id],
    queryFn: () => base44.entities.ConsumableOrder.filter({ client_id: client.id, status: 'ativo' }),
  });

  const redeem = async (campaign) => {
    const consumption = Number(dailyUse);
    const price = Number(unitPrice || 0);
    if (!(consumption > 0)) return toast.error('Informe o consumo estimado por dia');
    setRedeemingId(campaign.id);
    try {
      const current = campaign.total_released_percentage || 0;
      const step = campaign.releases?.length ? campaign.per_usage_percentage : campaign.first_contact_percentage;
      const percentage = Math.min(step || 20, 100 - current);
      const items = (campaign.total_bonus_items || []).map(item => ({ ...item, quantity: Math.ceil((item.quantity * percentage) / 100) }));
      const units = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
      const interval = Math.max(1, Math.ceil(units / consumption));
      const release = { release_number: (campaign.releases?.length || 0) + 1, release_date: new Date().toISOString(), items_released: items, percentage_released: percentage, status: 'released', notes: 'Resgate confirmado no Cliente 360' };
      const equipment = campaign.equipment_sold || client.equipment_sold || client.current_equipment;
      const existingOrder = orders.find(order => order.equipment_model === equipment);
      const orderData = { client_id: client.id, client_name: client.clinic_name || client.first_name, consumable_type: 'outro', equipment_model: equipment || 'SEAMATY', last_order_date: new Date().toISOString().split('T')[0], order_quantity_units: units, estimated_consumption_per_day: consumption, reorder_interval_days: interval, next_reorder_date: addDays(interval), unit_price: price, monthly_revenue_potential: price * consumption * 30, supplier: 'Seamaty', status: 'ativo', notes: `Bonificação: ${campaign.campaign_name}` };
      await Promise.all([
        base44.entities.BonusReleaseRule.update(campaign.id, { releases: [...(campaign.releases || []), release], total_released_percentage: current + percentage }),
        base44.entities.Client.update(client.id, { equipment_sold: equipment, current_equipment: equipment, purchased_products: [...new Set([...(client.purchased_products || []), equipment].filter(Boolean))], next_action: `Acompanhar consumo do ${equipment || 'equipamento'} e reposição em ${interval} dias` }),
        existingOrder ? base44.entities.ConsumableOrder.update(existingOrder.id, orderData) : base44.entities.ConsumableOrder.create(orderData),
      ]);
      await Promise.all([qc.invalidateQueries({ queryKey: ['c360-client', client.id] }), qc.invalidateQueries({ queryKey: ['c360-bonus', client.id] }), qc.invalidateQueries({ queryKey: ['c360-consumption', client.id] })]);
      toast.success('Bônus resgatado e consumo atualizado');
      setDailyUse(''); setUnitPrice('');
    } catch {
      toast.error('Não foi possível concluir o resgate');
    } finally { setRedeemingId(''); }
  };

  const active = campaigns.filter(campaign => campaign.is_active !== false && (campaign.total_released_percentage || 0) < 100);
  return (
    <div className="rounded-2xl p-4" style={{ background: '#111', border: '1px solid rgba(34,197,94,0.25)' }}>
      <p className="text-[10px] font-black text-green-400 uppercase tracking-widest mb-3 flex items-center gap-1.5"><Gift className="w-3.5 h-3.5" /> Bônus e consumo</p>
      {orders.map(order => <div key={order.id} className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 text-center"><div><p className="text-sm font-black text-white">{order.equipment_model}</p><p className="text-[8px] text-slate-500">Equipamento</p></div><div><p className="text-sm font-black text-blue-400">{order.estimated_consumption_per_day || 0}/dia</p><p className="text-[8px] text-slate-500">Consumo</p></div><div><p className="text-sm font-black text-orange-400">{order.next_reorder_date ? new Date(`${order.next_reorder_date}T12:00:00`).toLocaleDateString('pt-BR') : '—'}</p><p className="text-[8px] text-slate-500">Próxima compra</p></div><div><p className="text-sm font-black text-green-400">R$ {(order.monthly_revenue_potential || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p><p className="text-[8px] text-slate-500">Projeção/mês</p></div></div>)}
      {active.length === 0 ? <p className="text-xs text-slate-500">Nenhuma bonificação ativa para este cliente.</p> : active.map(campaign => <div key={campaign.id} className="pt-3 mt-3 border-t border-slate-800"><div className="flex justify-between gap-2 mb-2"><div><p className="text-xs font-black text-white">{campaign.campaign_name}</p><p className="text-[10px] text-slate-500">{campaign.equipment_sold} · {campaign.total_released_percentage || 0}% liberado</p></div></div><div className="grid grid-cols-2 gap-2 mb-2"><input type="number" min="0.01" step="0.01" value={dailyUse} onChange={e => setDailyUse(e.target.value)} placeholder="Consumo/dia" className="min-h-11 rounded-xl bg-slate-900 border border-slate-700 px-3 text-xs text-white" /><input type="number" min="0" step="0.01" value={unitPrice} onChange={e => setUnitPrice(e.target.value)} placeholder="R$ por unidade" className="min-h-11 rounded-xl bg-slate-900 border border-slate-700 px-3 text-xs text-white" /></div><button onClick={() => redeem(campaign)} disabled={!!redeemingId} className="w-full min-h-12 rounded-xl flex items-center justify-center gap-2 text-xs font-black text-green-400 disabled:opacity-50" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.35)' }}>{redeemingId === campaign.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Gift className="w-4 h-4" />} Resgatar bônus do equipamento</button></div>)}
    </div>
  );
}
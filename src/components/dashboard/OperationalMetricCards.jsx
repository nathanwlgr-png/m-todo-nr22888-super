import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock3, FileText, Flame, MessageSquare, Package, Route } from 'lucide-react';

const cards = [
  { key: 'today', label: 'Hoje', to: '/ScheduledAgenda', icon: Calendar, color: 'text-cyan-300 border-cyan-500/25' },
  { key: 'overdue', label: 'Atrasados', to: '/TasksUnified?filter=overdue', icon: Clock3, color: 'text-red-300 border-red-500/25' },
  { key: 'hot', label: 'Quentes', to: '/Clients?filter=quente', icon: Flame, color: 'text-orange-300 border-orange-500/25' },
  { key: 'proposals', label: 'Propostas', to: '/ProposalGenerator', icon: FileText, color: 'text-amber-300 border-amber-500/25' },
  { key: 'supplies', label: 'Insumos', to: '/ModoInsumos', icon: Package, color: 'text-green-300 border-green-500/25' },
  { key: 'route', label: 'Rota', to: '/DayFieldView', icon: Route, color: 'text-blue-300 border-blue-500/25' },
  { key: 'approvals', label: 'Aprovações', to: '/MessageApproval', icon: MessageSquare, color: 'text-purple-300 border-purple-500/25' },
];

export default function OperationalMetricCards({ metrics }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
      {cards.map(({ key, label, to, icon: Icon, color }) => (
        <Link key={key} to={to} className={`min-h-24 rounded-2xl p-3 bg-[#101012] border ${color} active:scale-[0.98]`}>
          <Icon className="w-5 h-5 mb-2" />
          <p className="text-2xl font-black text-white">{metrics[key] || 0}</p>
          <p className="text-[10px] font-bold uppercase">{label}</p>
          {key === 'supplies' && <p className="text-[9px] text-slate-500 mt-1">{metrics.installed || 0} equipamentos</p>}
        </Link>
      ))}
    </div>
  );
}
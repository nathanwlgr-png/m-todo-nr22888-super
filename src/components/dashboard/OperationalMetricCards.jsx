import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Clock3, FileText, Flame } from 'lucide-react';

const cards = [
  { key: 'today', label: 'Hoje', to: '/ScheduledAgenda', icon: Calendar, color: 'text-cyan-300 border-cyan-500/25' },
  { key: 'overdue', label: 'Atrasadas', to: '/TasksUnified?filter=overdue', icon: Clock3, color: 'text-red-300 border-red-500/25' },
  { key: 'hot', label: 'Quentes', to: '/Clients?filter=quente', icon: Flame, color: 'text-orange-300 border-orange-500/25' },
  { key: 'proposals', label: 'Propostas', to: '/ProposalGenerator', icon: FileText, color: 'text-amber-300 border-amber-500/25' },
];

export default function OperationalMetricCards({ metrics }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {cards.map(({ key, label, to, icon: Icon, color }) => (
        <Link key={key} to={to} className={`min-h-20 rounded-2xl border bg-card p-2 ${color} active:scale-[0.98]`}>
          <Icon className="mb-1.5 h-4 w-4" />
          <p className="text-xl font-black text-foreground">{metrics[key] || 0}</p>
          <p className="truncate text-[9px] font-bold uppercase">{label}</p>
        </Link>
      ))}
    </div>
  );
}
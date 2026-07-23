import React from 'react';
import { Link } from 'react-router-dom';
import { ClipboardCheck, FileText, MapPinned, MessageCircle, Radar, Search, UserPlus, WifiOff, ListTodo } from 'lucide-react';

const actions = [
  { label: 'Novo cliente', to: '/NewClient', icon: UserPlus, color: 'text-cyan-300 border-cyan-500/25' },
  { label: 'Buscar clínicas', to: '/SeamatyHunter', icon: Radar, color: 'text-fuchsia-300 border-fuchsia-500/25' },
  { label: 'Visita', to: '/VisitManager', icon: ClipboardCheck, color: 'text-blue-300 border-blue-500/25' },
  { label: 'Tarefa', to: '/TasksUnified', icon: ListTodo, color: 'text-amber-300 border-amber-500/25' },
  { label: 'Rota', to: '/SmartRouteOptimizer', icon: MapPinned, color: 'text-orange-300 border-orange-500/25' },
  { label: 'WhatsApp', to: '/WhatsAppHub', icon: MessageCircle, color: 'text-green-300 border-green-500/25' },
  { label: 'Investigar', to: '/ModoInvestigativoSupremo', icon: Search, color: 'text-purple-300 border-purple-500/25' },
  { label: 'Proposta', to: '/ProposalGenerator', icon: FileText, color: 'text-rose-300 border-rose-500/25' },
  { label: 'Offline', to: '/OfflineMode', icon: WifiOff, color: 'text-slate-300 border-slate-500/25' },
];

export default function FieldQuickActions() {
  return (
    <section aria-labelledby="field-actions-title">
      <div className="mb-2 flex items-center justify-between">
        <h2 id="field-actions-title" className="text-xs font-black uppercase tracking-widest text-slate-400">Ações de campo</h2>
        <span className="text-[10px] text-slate-600">1 toque</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {actions.map(({ label, to, icon: Icon, color }) => (
          <Link key={to} to={to} aria-label={label} className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl border bg-[#101012] px-1 text-center active:scale-95 ${color}`}>
            <Icon className="h-5 w-5" aria-hidden="true" />
            <span className="text-[10px] font-bold leading-tight">{label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}